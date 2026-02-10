/**
 * Contact Scanner Agent (OSINT)
 * Stealthily finds phone numbers from public web sources
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import db from '../database/db.js';

// Random delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main function to find contact for a lead
 */
async function findContact(leadId) {
    const lead = db.query('SELECT * FROM leads WHERE id = ?', [leadId])[0];
    if (!lead) throw new Error('Lead not found');

    console.log(`[ContactScanner] Starting OSINT search for: ${lead.nama_sppg}`);

    // Strategy 1: Search Queries
    const queries = [
        `"${lead.nama_sppg}" ${lead.kab_kota} kontak`,
        `"${lead.nama_sppg}" telepon`,
        `"${lead.nama_sppg}" kepala sekolah`
    ];

    let foundPhone = null;
    let sourceUrl = null;

    for (const query of queries) {
        if (foundPhone) break;

        try {
            console.log(`[ContactScanner] Searching: ${query}`);
            const results = await googleSearch(query);

            // Visit top 3 results
            for (const result of results.slice(0, 3)) {
                console.log(`[ContactScanner] Visiting: ${result.link}`);
                const phone = await scrapePhoneFromUrl(result.link);

                if (phone) {
                    foundPhone = phone;
                    sourceUrl = result.link;
                    break;
                }

                // Random delay between requests to be polite
                await delay(Math.random() * 3000 + 2000);
            }
        } catch (err) {
            console.error(`[ContactScanner] Error on query "${query}":`, err.message);
        }
    }

    if (foundPhone) {
        console.log(`[ContactScanner] FOUND: ${foundPhone} from ${sourceUrl}`);

        // Update Database
        db.run(`
            UPDATE leads 
            SET phone = ?, 
                status = CASE WHEN status = 'Belum Dihubungi' THEN 'Belum Dihubungi' ELSE status END
            WHERE id = ?
        `, [foundPhone, leadId]);

        return { success: true, phone: foundPhone, source: sourceUrl };
    } else {
        console.log('[ContactScanner] No phone number found.');
        return { success: false, message: 'Nomor tidak ditemukan di sumber publik' };
    }
}

/**
 * Mock Google Search (Scraping SERP)
 * Note: Real implementation usually requires an API or specific SERP scraper.
 * For this MVP, we will try to scrape a standard search result page cautiously.
 */
async function googleSearch(query) {
    const userAgent = new UserAgent().toString();
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.google.com/search?q=${encodedQuery}&gl=id`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        // Parsing Google SERP structure (Subject to change by Google)
        // Trying common selectors for organic results
        $('div.g').each((i, el) => {
            const link = $(el).find('a').attr('href');
            const title = $(el).find('h3').text();

            if (link && link.startsWith('http')) {
                results.push({ title, link });
            }
        });

        return results;
    } catch (err) {
        console.error('[ContactScanner] Search blocked or failed:', err.message);
        return [];
    }
}

/**
 * Scrape phone number from a specific webpage
 */
async function scrapePhoneFromUrl(url) {
    const userAgent = new UserAgent().toString();

    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': userAgent },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const text = $('body').text();

        // Regex for Indonesian phone numbers
        // Matches: +62 8xx, 08xx, (021) xxx
        const phoneRegex = /(?:\+62|62|0)(?:8[1-9][0-9]|2[1-9])[\s-]?\d{3,4}[\s-]?\d{3,5}/g;

        const matches = text.match(phoneRegex);

        if (matches && matches.length > 0) {
            // Clean and validate
            const cleanPhone = matches[0].replace(/[^0-9+]/g, '');
            if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
                return cleanPhone;
            }
        }

        return null;

    } catch (err) {
        return null;
    }
}

export default { findContact };
