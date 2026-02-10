/**
 * API Routes for Automation
 */

import express from 'express';
import orchestrator from '../agents/orchestrator.js';

const router = express.Router();

/**
 * POST /api/automation/run
 * Trigger full automation workflow
 */
router.post('/run', async (req, res) => {
    try {
        console.log('[API] Running automation workflow...');
        const result = await orchestrator.runFullWorkflow();
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[API] Automation error:', err);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat menjalankan proses'
        });
    }
});

/**
 * GET /api/automation/status
 * Get system status
 */
router.get('/status', (req, res) => {
    try {
        const status = orchestrator.getSystemStatus();
        res.json({ success: true, data: status });
    } catch (err) {
        console.error('[API] Status error:', err);
        res.status(500).json({
            success: false,
            error: 'Tidak dapat mengambil status sistem'
        });
    }
});

/**
 * POST /api/automation/generate-message/:id
 * Generate message for specific lead
 */
router.post('/generate-message/:id', async (req, res) => {
    try {
        const result = await orchestrator.generateMessageForLead(req.params.id);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[API] Generate message error:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Gagal membuat pesan'
        });
    }
});

/**
 * POST /api/automation/send/:id
 * Send message for specific lead
 */
router.post('/send/:id', async (req, res) => {
    try {
        const result = await orchestrator.sendMessageForLead(req.params.id);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[API] Send message error:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Gagal mengirim pesan'
        });
    }
});

import contactScanner from '../agents/contactScanner.js';

// ... existing code ...

/**
 * POST /api/automation/scan-contact/:id
 * Trigger OSINT contact scan for a lead
 */
router.post('/scan-contact/:id', async (req, res) => {
    try {
        const result = await contactScanner.findContact(req.params.id);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[API] Scan contact error:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Gagal mencari kontak'
        });
    }
});

export default router;
