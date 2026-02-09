/**
 * Orchestrator Agent
 * Single entry point for automation workflow
 */

import supervisor from './supervisor.js';
import leadLocator from './leadLocator.js';
import contentCreator from './contentCreator.js';
import outreachAssistant from './outreachAssistant.js';
import db from '../database/db.js';

/**
 * Run the complete automation workflow
 */
async function runFullWorkflow() {
    console.log('[Orchestrator] Starting full workflow...');

    const result = {
        success: false,
        step1_findLeads: null,
        step2_generateMessages: null,
        step3_sendOutreach: null,
        summary: {
            newLeadsFound: 0,
            messagesGenerated: 0,
            messagesSent: 0,
            errors: []
        }
    };

    try {
        const preflight = supervisor.preFlightCheck();
        console.log('[Orchestrator] Preflight check:', preflight.ready ? 'PASS' : 'ISSUES');

        if (!preflight.ready) {
            throw new Error('Sistem belum siap. Periksa konfigurasi.');
        }

        // Step 1: Find new leads
        console.log('[Orchestrator] Step 1: Finding leads...');
        const leadsResult = await leadLocator.findAndSaveLeads();
        result.step1_findLeads = leadsResult;
        result.summary.newLeadsFound = leadsResult.newLeadsCount || 0;

        // Step 2: Generate messages
        console.log('[Orchestrator] Step 2: Generating messages...');
        const leadsNeedingMessages = db.query(`
      SELECT * FROM leads 
      WHERE (pesan_penawaran IS NULL OR pesan_penawaran = '')
      AND status = 'Belum Dihubungi'
    `);

        const messageResults = [];
        for (const lead of leadsNeedingMessages) {
            try {
                const validation = supervisor.validateLead(lead);
                if (!validation.valid) {
                    messageResults.push({ leadId: lead.id, success: false, errors: validation.errors });
                    continue;
                }

                const message = await contentCreator.generateMessage(lead);
                if (message) {
                    db.run(`
            UPDATE leads SET pesan_penawaran = ?, updated_at = datetime('now')
            WHERE id = ?
          `, [message, lead.id]);
                    messageResults.push({ leadId: lead.id, success: true });
                    result.summary.messagesGenerated++;
                }
            } catch (err) {
                console.error(`[Orchestrator] Message generation error for lead ${lead.id}:`, err);
                messageResults.push({ leadId: lead.id, success: false, error: err.message });
            }
        }
        result.step2_generateMessages = { count: messageResults.length, details: messageResults };

        // Step 3: Send outreach
        console.log('[Orchestrator] Step 3: Sending outreach...');
        const eligibleLeads = db.query(`
      SELECT * FROM leads 
      WHERE pesan_penawaran IS NOT NULL 
      AND pesan_penawaran != ''
      AND status = 'Belum Dihubungi'
    `);

        const prioritizedLeads = supervisor.prioritizeLeads(eligibleLeads);

        const sendResults = [];
        for (const lead of prioritizedLeads) {
            try {
                const sendCheck = supervisor.canSendMessage(lead);
                if (!sendCheck.canSend) {
                    sendResults.push({
                        leadId: lead.id,
                        nama_sppg: lead.nama_sppg,
                        sent: false,
                        blockers: sendCheck.blockers
                    });
                    continue;
                }

                if (supervisor.wasRecentlyContacted(lead.id, 24)) {
                    sendResults.push({
                        leadId: lead.id,
                        nama_sppg: lead.nama_sppg,
                        sent: false,
                        reason: 'Baru saja dihubungi'
                    });
                    continue;
                }

                const sendResult = await outreachAssistant.sendMessage(lead);
                sendResults.push({
                    leadId: lead.id,
                    nama_sppg: lead.nama_sppg,
                    sent: sendResult.success,
                    simulated: sendResult.simulated
                });

                if (sendResult.success) {
                    result.summary.messagesSent++;
                }

                // Jeda Manusiawi (Human-like Delay) agar tidak dianggap spam
                // Random antara 5 sampai 15 detik per pesan
                const delay = Math.floor(Math.random() * (15000 - 5000 + 1) + 5000);
                console.log(`[Orchestrator] Menunggu ${delay / 1000} detik sebelum pesan berikutnya...`);
                await new Promise(resolve => setTimeout(resolve, delay));

            } catch (err) {
                console.error(`[Orchestrator] Send error for lead ${lead.id}:`, err);
                sendResults.push({
                    leadId: lead.id,
                    nama_sppg: lead.nama_sppg,
                    sent: false,
                    error: err.message
                });
                result.summary.errors.push(`Lead ${lead.id}: ${err.message}`);
            }
        }
        result.step3_sendOutreach = { count: sendResults.length, details: sendResults };

        result.success = true;
        console.log('[Orchestrator] Workflow completed successfully');
        console.log(`[Orchestrator] Summary: ${result.summary.newLeadsFound} found, ${result.summary.messagesGenerated} messages, ${result.summary.messagesSent} sent`);

    } catch (err) {
        console.error('[Orchestrator] Workflow failed:', err);
        result.summary.errors.push(err.message);
    }

    return result;
}

/**
 * Generate message for a specific lead
 */
async function generateMessageForLead(leadId) {
    const lead = db.query('SELECT * FROM leads WHERE id = ?', [leadId])[0];

    if (!lead) {
        throw new Error('Lead tidak ditemukan');
    }

    const validation = supervisor.validateLead(lead);
    if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
    }

    const message = await contentCreator.generateMessage(lead);

    if (message) {
        db.run(`
      UPDATE leads SET pesan_penawaran = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [message, leadId]);
    }

    return { success: true, message };
}

/**
 * Send message for a specific lead
 */
async function sendMessageForLead(leadId) {
    const lead = db.query('SELECT * FROM leads WHERE id = ?', [leadId])[0];

    if (!lead) {
        throw new Error('Lead tidak ditemukan');
    }

    const sendCheck = supervisor.canSendMessage(lead);
    if (!sendCheck.canSend) {
        throw new Error(sendCheck.blockers.join(', '));
    }

    const compliance = supervisor.validateMessageCompliance(lead.pesan_penawaran);
    if (!compliance.valid) {
        console.warn('[Orchestrator] Compliance issues:', compliance.issues);
    }

    const result = await outreachAssistant.sendMessage(lead);

    return result;
}

/**
 * Get system status
 */
function getSystemStatus() {
    const preflight = supervisor.preFlightCheck();

    return {
        ready: preflight.ready,
        mode: preflight.mode,
        checks: preflight.checks
    };
}

export default {
    runFullWorkflow,
    generateMessageForLead,
    sendMessageForLead,
    getSystemStatus
};
