/**
 * Outreach Assistant Agent
 * Handles WhatsApp message sending
 */

import db from '../database/db.js';

/**
 * Check if in production mode
 */
function isProductionMode() {
    return process.env.WHATSAPP_TOKEN &&
        process.env.WHATSAPP_TOKEN !== 'your_whatsapp_token_here' &&
        process.env.WHATSAPP_PHONE_ID &&
        process.env.WHATSAPP_PHONE_ID !== 'your_phone_number_id_here';
}

/**
 * Send WhatsApp message
 */
async function sendMessage(lead) {
    console.log(`[OutreachAssistant] Sending message to ${lead.nama_sppg}`);

    if (!lead.phone) {
        throw new Error('Nomor telepon tidak tersedia');
    }

    if (!lead.pesan_penawaran) {
        throw new Error('Pesan belum dibuat');
    }

    let result;

    if (isProductionMode()) {
        result = await sendViaWhatsAppAPI(lead);
    } else {
        result = await simulateSend(lead);
    }

    logMessage(lead.id, lead.pesan_penawaran, result.success);

    if (result.success) {
        updateLeadStatus(lead.id, 'Sudah Dikirimi');
    }

    return result;
}

/**
 * Send via WhatsApp Cloud API
 */
async function sendViaWhatsAppAPI(lead) {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    let phone = lead.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${phoneId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: phone,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: lead.pesan_penawaran
                    }
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log(`[OutreachAssistant] Message sent successfully to ${phone}`);
            return {
                success: true,
                simulated: false,
                messageId: data.messages?.[0]?.id
            };
        } else {
            console.error('[OutreachAssistant] WhatsApp API error:', data);
            throw new Error(data.error?.message || 'WhatsApp API error');
        }
    } catch (err) {
        console.error('[OutreachAssistant] Send failed:', err);
        throw err;
    }
}

/**
 * Simulate sending (for development/testing)
 */
async function simulateSend(lead) {
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`[OutreachAssistant] SIMULATED: Message to ${lead.phone}`);
    console.log(`[OutreachAssistant] Content preview: ${lead.pesan_penawaran.substring(0, 50)}...`);

    return {
        success: true,
        simulated: true,
        messageId: `sim_${Date.now()}_${lead.id}`
    };
}

/**
 * Log message to database
 */
function logMessage(leadId, content, success) {
    try {
        db.run(`
      INSERT INTO messages (lead_id, content, direction, status, sent_at)
      VALUES (?, ?, 'outgoing', ?, datetime('now'))
    `, [leadId, content, success ? 'sent' : 'failed']);
    } catch (err) {
        console.error('[OutreachAssistant] Failed to log message:', err);
    }
}

/**
 * Update lead status
 */
function updateLeadStatus(leadId, status) {
    try {
        db.run(`
      UPDATE leads SET status = ?, sent_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `, [status, leadId]);
    } catch (err) {
        console.error('[OutreachAssistant] Failed to update status:', err);
    }
}

/**
 * Classify incoming reply
 */
function classifyReply(message) {
    const lower = message.toLowerCase();

    if (lower.includes('tertarik') || lower.includes('berminat') || lower.includes('lanjut')) {
        return 'interested';
    }

    if (lower.includes('tidak tertarik') || lower.includes('tidak berminat')) {
        return 'not_interested';
    }

    if (lower.includes('harga') || lower.includes('berapa') || lower.includes('kontrak')) {
        return 'question';
    }

    return 'unknown';
}

/**
 * Process incoming reply
 */
function processReply(leadId, message) {
    const classification = classifyReply(message);

    db.run(`
    INSERT INTO messages (lead_id, content, direction, status, sent_at)
    VALUES (?, ?, 'incoming', 'received', datetime('now'))
  `, [leadId, message]);

    switch (classification) {
        case 'interested':
            updateLeadStatus(leadId, 'Tertarik');
            break;
        case 'not_interested':
            updateLeadStatus(leadId, 'Tidak Tertarik');
            break;
        case 'question':
            console.log(`[OutreachAssistant] Lead ${leadId} needs human follow-up`);
            break;
    }

    return { classification, processed: true };
}

export default {
    sendMessage,
    classifyReply,
    processReply,
    isProductionMode
};
