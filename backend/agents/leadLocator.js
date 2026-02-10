/**
 * Lead Locator Agent
 * Finds SPPG/Dapur MBG from public sources
 */

import db from '../database/db.js';
import supervisor from './supervisor.js';

/**
 * Sample SPPG data
 */
const SAMPLE_SPPG_DATA = [
    {
        nama_sppg: 'Dapur MBG SDN 01 Menteng',
        alamat: 'Jl. Besuki No. 1, Menteng',
        provinsi: 'DKI Jakarta',
        kab_kota: 'Jakarta Pusat',
        kecamatan: 'Menteng',
        desa: 'Menteng',
        phone: '081234567890',
        confidence_score: 0.95
    },
    {
        nama_sppg: 'Dapur MBG SMPN 5 Bandung',
        alamat: 'Jl. Belitung No. 8, Bandung',
        provinsi: 'Jawa Barat',
        kab_kota: 'Bandung',
        kecamatan: 'Sumur Bandung',
        desa: 'Merdeka',
        phone: '082198765432',
        confidence_score: 0.90
    },
    {
        nama_sppg: 'Dapur MBG SDN Sukajadi',
        alamat: 'Jl. Sukajadi No. 25, Bandung',
        provinsi: 'Jawa Barat',
        kab_kota: 'Bandung',
        kecamatan: 'Sukajadi',
        desa: 'Sukagalih',
        phone: '083112233445',
        confidence_score: 0.88
    },
    {
        nama_sppg: 'Dapur MBG SMAN 3 Surabaya',
        alamat: 'Jl. Praban No. 3, Surabaya',
        provinsi: 'Jawa Timur',
        kab_kota: 'Surabaya',
        kecamatan: 'Genteng',
        desa: 'Genteng',
        phone: '085544332211',
        confidence_score: 0.92
    },
    {
        nama_sppg: 'Dapur MBG SDN 2 Denpasar',
        alamat: 'Jl. Gajah Mada No. 2, Denpasar',
        provinsi: 'Bali',
        kab_kota: 'Denpasar',
        kecamatan: 'Denpasar Barat',
        desa: 'Pemecutan',
        phone: '087766554433',
        confidence_score: 0.85
    },
    {
        nama_sppg: 'Dapur MBG SMPN 1 Semarang',
        alamat: 'Jl. Pemuda No. 134, Semarang',
        provinsi: 'Jawa Tengah',
        kab_kota: 'Semarang',
        kecamatan: 'Semarang Tengah',
        desa: 'Sekayu',
        phone: '089988776655',
        confidence_score: 0.93
    },
    {
        nama_sppg: 'Dapur MBG SDN Kramat Jati',
        alamat: 'Jl. Raya Bogor KM 25',
        provinsi: 'DKI Jakarta',
        kab_kota: 'Jakarta Timur',
        kecamatan: 'Kramat Jati',
        desa: 'Kramat Jati',
        phone: '081122334455',
        confidence_score: 0.87
    },
    {
        nama_sppg: 'Dapur MBG SMAN 1 Yogyakarta',
        alamat: 'Jl. HOS Cokroaminoto No. 10',
        provinsi: 'DI Yogyakarta',
        kab_kota: 'Yogyakarta',
        kecamatan: 'Jetis',
        desa: 'Bumijo',
        phone: '082233445566',
        confidence_score: 0.91
    }
];

/**
 * Find and save new leads
 */
async function findAndSaveLeads() {
    console.log('[LeadLocator] Starting lead discovery...');

    const results = {
        success: true,
        newLeadsCount: 0,
        leads: []
    };

    try {
        const discoveredLeads = await discoverLeads();

        for (const leadData of discoveredLeads) {
            if (supervisor.isDuplicateLead(leadData.nama_sppg, leadData.kab_kota)) {
                console.log(`[LeadLocator] Skipping duplicate: ${leadData.nama_sppg}`);
                continue;
            }

            const validation = supervisor.validateLead(leadData);
            if (!validation.valid) {
                console.log(`[LeadLocator] Invalid lead data: ${validation.errors.join(', ')}`);
                continue;
            }

            const savedLead = saveLead(leadData);
            if (savedLead) {
                results.newLeadsCount++;
                results.leads.push({
                    id: savedLead.id,
                    nama_sppg: leadData.nama_sppg,
                    kab_kota: leadData.kab_kota
                });
            }
        }

        console.log(`[LeadLocator] Found ${results.newLeadsCount} new leads`);
    } catch (err) {
        console.error('[LeadLocator] Error:', err);
        results.success = false;
    }

    return results;
}

/**
 * Discover leads from sources
 */
async function discoverLeads() {
    console.log('[LeadLocator] Using sample SPPG data (Simulation Mode)');
    // In the new architecture, leads come from 'scraped_bgn.js' -> 'import_leads.js'.
    // This function is kept for backward compatibility/simulation.
    return SAMPLE_SPPG_DATA;
}

/**
 * Save lead to database
 */
function saveLead(leadData) {
    try {
        db.run(`
      INSERT INTO leads (
        nama_sppg, alamat, provinsi, kab_kota, kecamatan, desa,
        phone, confidence_score, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Belum Dihubungi', datetime('now'), datetime('now'))
    `, [
            leadData.nama_sppg,
            leadData.alamat || '',
            leadData.provinsi || '',
            leadData.kab_kota || '',
            leadData.kecamatan || '',
            leadData.desa || '',
            leadData.phone || '',
            leadData.confidence_score || 0.5
        ]);

        const inserted = db.query(
            'SELECT * FROM leads WHERE nama_sppg = ? ORDER BY id DESC LIMIT 1',
            [leadData.nama_sppg]
        )[0];

        return inserted;
    } catch (err) {
        console.error('[LeadLocator] Save lead error:', err);
        return null;
    }
}

export default {
    findAndSaveLeads,
    discoverLeads,
    saveLead
};
