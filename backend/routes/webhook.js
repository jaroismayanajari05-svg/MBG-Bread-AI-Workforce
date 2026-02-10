import express from 'express';
import db from '../database/db.js';
import outreachAssistant from '../agents/outreachAssistant.js';

const router = express.Router();

// Verification Token for Meta (configured in App Dashboard)
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'mbg_bread_secure_token';

/**
 * GET /api/webhook
 * Meta Webhook Verification
 */
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[Webhook] Verified successfully');
            res.status(200).send(challenge);
        } else {
            console.error('[Webhook] Verification failed');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

/**
 * POST /api/webhook
 * Handle incoming messages from WhatsApp
 */
router.post('/', async (req, res) => {
    const body = req.body;

    console.log('[Webhook] Received payload:', JSON.stringify(body, null, 2));

    try {
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const message = body.entry[0].changes[0].value.messages[0];
                const from = message.from; // Phone number (e.g. 62812345678)
                const text = message.text ? message.text.body : '';

                if (text) {
                    await handleIncomingMessage(from, text);
                }
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.error('[Webhook] Processing error:', err);
        res.sendStatus(500);
    }
});

async function handleIncomingMessage(from, text) {
    console.log(`[Webhook] Incoming from ${from}: ${text}`);

    // normalize phone number (remove 62 prefix if needed for matching, but database likely has it)
    // We try to match likeness
    // SQLite doesn't have great fuzzy matching, so we try exact or like

    // Attempt 1: Exact match or match without prefix
    // Common formats: '0812...', '62812...', '+62812...'
    // API sends '62812...'

    // We'll search by trying to match the last 10 digits
    const cleanPhone = from.replace(/\D/g, '').slice(-10);

    const leads = db.query(`
        SELECT * FROM leads 
        WHERE replace(replace(replace(phone, '-', ''), ' ', ''), '+', '') LIKE ?
        LIMIT 1
    `, [`%${cleanPhone}`]);

    if (leads && leads.length > 0) {
        const lead = leads[0];
        console.log(`[Webhook] Matched lead: ${lead.nama_sppg} (ID: ${lead.id})`);

        // Log message
        db.run(`
            INSERT INTO messages (lead_id, direction, content, sent_at)
            VALUES (?, 'incoming', ?, datetime('now'))
        `, [lead.id, text]);

        // Classify and Update Status
        const classification = outreachAssistant.classifyReply(text);
        console.log(`[Webhook] Classification: ${classification}`);

        let newStatus = null;
        if (classification === 'interested') newStatus = 'Tertarik';
        if (classification === 'not_interested') newStatus = 'Tidak Tertarik';

        if (newStatus) {
            db.run(`UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?`, [newStatus, lead.id]);
            console.log(`[Webhook] Updated status to ${newStatus}`);
        }

    } else {
        console.log(`[Webhook] No lead found for phone ${from}`);
    }
}

export default router;
