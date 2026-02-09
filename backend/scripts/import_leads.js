
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, '../data/leads_bgn_raw.csv');

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');

    // Helper to split by comma but ignore commas inside quotes
    const parseLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    };

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseLine(lines[i]);
        if (values.length === headers.length) {
            const entry = {};
            headers.forEach((h, index) => {
                entry[h.trim()] = values[index];
            });
            data.push(entry);
        }
    }
    return data;
}

async function importLeads() {
    console.log('Starting Import...');

    if (!fs.existsSync(CSV_FILE)) {
        console.error('File not found:', CSV_FILE);
        return;
    }

    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = parseCSV(csvContent);

    console.log(`Found ${records.length} records to process.`);

    let imported = 0;
    let skipped = 0;

    for (const record of records) {
        try {
            // Check duplicate
            const existing = db.query('SELECT id FROM leads WHERE nama_sppg = ?', [record.nama_sppg]);

            if (existing && existing.length > 0) {
                skipped++;
                continue;
            }

            // Insert
            db.run(`
                INSERT INTO leads (
                    nama_sppg, alamat, provinsi, kab_kota, kecamatan, desa,
                    phone, confidence_score, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Belum Dihubungi', datetime('now'), datetime('now'))
            `, [
                record.nama_sppg,
                record.alamat,
                record.provinsi,
                record.kab_kota,
                record.kecamatan,
                record.desa,
                '', // Phone is empty from scraper
                1.0 // High confidence from official source
            ]);

            imported++;
        } catch (err) {
            console.error('Import error:', err);
        }
    }

    // Explicitly confirm save (though run() usually saves)
    // We might want to add a manual saveDb() export if needed, 
    // but db.js run() calls saveDb() internally.

    console.log(`Import Finished!`);
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️ Skipped (Duplicate): ${skipped}`);
}

importLeads();
