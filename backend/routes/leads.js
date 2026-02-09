/**
 * API Routes for Leads
 */

import express from 'express';
import db from '../database/db.js';

const router = express.Router();

/**
 * GET /api/leads
 * List all leads with optional status filter
 */
router.get('/', (req, res) => {
    try {
        const { status } = req.query;

        let query = 'SELECT * FROM leads ORDER BY created_at DESC';
        let params = [];

        if (status) {
            query = 'SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC';
            params = [status];
        }

        const leads = db.query(query, params);
        res.json({ success: true, data: leads });
    } catch (err) {
        console.error('[API] List leads error:', err);
        res.status(500).json({
            success: false,
            error: 'Gagal mengambil data dapur'
        });
    }
});

/**
 * GET /api/leads/stats
 * Get dashboard KPIs
 */
router.get('/stats', (req, res) => {
    try {
        const total = db.query('SELECT COUNT(*) as count FROM leads')[0]?.count || 0;

        const sentToday = db.query(`
      SELECT COUNT(*) as count FROM leads 
      WHERE DATE(sent_at) = DATE('now')
    `)[0]?.count || 0;

        const interested = db.query(`
      SELECT COUNT(*) as count FROM leads 
      WHERE status = 'Tertarik'
    `)[0]?.count || 0;

        const pending = db.query(`
      SELECT COUNT(*) as count FROM leads 
      WHERE status = 'Sudah Dikirimi'
    `)[0]?.count || 0;

        res.json({
            success: true,
            data: { total, sentToday, interested, pending }
        });
    } catch (err) {
        console.error('[API] Stats error:', err);
        res.status(500).json({
            success: false,
            error: 'Gagal mengambil statistik'
        });
    }
});

/**
 * GET /api/leads/:id
 * Get lead detail with messages
 */
router.get('/:id', (req, res) => {
    try {
        const lead = db.query('SELECT * FROM leads WHERE id = ?', [req.params.id])[0];

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Data tidak ditemukan'
            });
        }

        // Get messages
        const messages = db.query(
            'SELECT * FROM messages WHERE lead_id = ? ORDER BY sent_at DESC',
            [req.params.id]
        );

        res.json({
            success: true,
            data: { ...lead, messages }
        });
    } catch (err) {
        console.error('[API] Lead detail error:', err);
        res.status(500).json({
            success: false,
            error: 'Gagal mengambil detail dapur'
        });
    }
});

/**
 * PUT /api/leads/:id
 * Update lead data
 */
router.put('/:id', (req, res) => {
    try {
        const { status, pesan_penawaran } = req.body;
        const updates = [];
        const params = [];

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        if (pesan_penawaran !== undefined) {
            updates.push('pesan_penawaran = ?');
            params.push(pesan_penawaran);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Tidak ada data yang diupdate'
            });
        }

        updates.push("updated_at = datetime('now')");
        params.push(req.params.id);

        db.run(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);

        const updated = db.query('SELECT * FROM leads WHERE id = ?', [req.params.id])[0];
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('[API] Update lead error:', err);
        res.status(500).json({
            success: false,
            error: 'Gagal mengupdate data'
        });
    }
});

export default router;
