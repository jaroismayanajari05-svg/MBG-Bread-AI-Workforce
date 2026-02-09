/**
 * Supervisor Agent
 * Critical safety layer - blocks invalid operations
 */

import db from '../database/db.js';

/**
 * Validate lead data before any operation
 */
function validateLead(lead) {
    const errors = [];

    if (!lead) {
        return { valid: false, errors: ['Data lead tidak ditemukan'] };
    }

    if (!lead.nama_sppg || lead.nama_sppg.trim() === '') {
        errors.push('Nama SPPG kosong');
    }

    if (!lead.kab_kota || lead.kab_kota.trim() === '') {
        errors.push('Kota/Kabupaten kosong');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Check if message can be sent
 */
function canSendMessage(lead) {
    const blockers = [];

    // Must have phone number
    if (!lead.phone || lead.phone.trim() === '') {
        blockers.push('Nomor telepon tidak tersedia');
    }

    // Must have message content
    if (!lead.pesan_penawaran || lead.pesan_penawaran.trim() === '') {
        blockers.push('Pesan penawaran belum dibuat');
    }

    // Check message length
    if (lead.pesan_penawaran && lead.pesan_penawaran.length > 700) {
        blockers.push('Pesan terlalu panjang (max 700 karakter)');
    }

    return {
        canSend: blockers.length === 0,
        blockers
    };
}

/**
 * Check for duplicate leads
 */
function isDuplicateLead(nama_sppg, kab_kota) {
    const existing = db.query(`
    SELECT id FROM leads 
    WHERE LOWER(nama_sppg) = LOWER(?) 
    AND LOWER(kab_kota) = LOWER(?)
    LIMIT 1
  `, [nama_sppg, kab_kota]);

    return existing.length > 0;
}

/**
 * Prioritize leads for outreach
 */
function prioritizeLeads(leads) {
    return leads.sort((a, b) => {
        const aHasPhone = a.phone && a.phone.trim() !== '';
        const bHasPhone = b.phone && b.phone.trim() !== '';
        if (aHasPhone && !bHasPhone) return -1;
        if (!aHasPhone && bHasPhone) return 1;

        if ((a.confidence_score || 0) > (b.confidence_score || 0)) return -1;
        if ((a.confidence_score || 0) < (b.confidence_score || 0)) return 1;

        return new Date(b.created_at) - new Date(a.created_at);
    });
}

/**
 * Check if lead was recently contacted
 */
function wasRecentlyContacted(leadId, hoursThreshold = 24) {
    const messages = db.query(`
    SELECT sent_at FROM messages 
    WHERE lead_id = ? AND direction = 'outgoing'
    ORDER BY sent_at DESC 
    LIMIT 1
  `, [leadId]);

    if (messages.length === 0) return false;

    const lastSent = new Date(messages[0].sent_at);
    const now = new Date();
    const hoursSince = (now - lastSent) / (1000 * 60 * 60);

    return hoursSince < hoursThreshold;
}

/**
 * Flag lead for human review
 */
function flagForReview(leadId, reason) {
    console.log(`[Supervisor] Lead ${leadId} flagged: ${reason}`);
    return { flagged: true, leadId, reason, timestamp: new Date().toISOString() };
}

/**
 * Validate message content for compliance
 */
function validateMessageCompliance(message) {
    const issues = [];

    if (!message || message.trim() === '') {
        return { valid: false, issues: ['Pesan kosong'] };
    }

    const lowerMessage = message.toLowerCase();

    if (!lowerMessage.includes('roti')) {
        issues.push('Tidak menyebutkan produk roti');
    }

    if (!lowerMessage.includes('halal')) {
        issues.push('Tidak menyebutkan sertifikasi Halal');
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

/**
 * Pre-flight check before running automation
 */
function preFlightCheck() {
    const checks = [];

    try {
        db.query('SELECT 1');
        checks.push({ name: 'Database', status: 'ok' });
    } catch (err) {
        checks.push({ name: 'Database', status: 'error', message: err.message });
    }

    const hasOpenAI = process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    checks.push({
        name: 'OpenAI API',
        status: hasOpenAI ? 'ok' : 'simulation',
        message: hasOpenAI ? null : 'Menggunakan template pesan'
    });

    const hasWhatsApp = process.env.WHATSAPP_TOKEN &&
        process.env.WHATSAPP_TOKEN !== 'your_whatsapp_token_here';
    checks.push({
        name: 'WhatsApp API',
        status: hasWhatsApp ? 'ok' : 'simulation',
        message: hasWhatsApp ? null : 'Mode simulasi aktif'
    });

    const allOk = checks.every(c => c.status === 'ok' || c.status === 'simulation');

    return {
        ready: allOk,
        checks,
        mode: hasWhatsApp ? 'production' : 'simulation'
    };
}

export default {
    validateLead,
    canSendMessage,
    isDuplicateLead,
    prioritizeLeads,
    wasRecentlyContacted,
    flagForReview,
    validateMessageCompliance,
    preFlightCheck
};
