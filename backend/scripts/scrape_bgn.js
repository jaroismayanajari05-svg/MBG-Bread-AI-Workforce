
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://bgn.go.id/operasional-sppg';
const OUTPUT_FILE = path.join(__dirname, '../data/leads_bgn_raw.csv');

// Create data directory if not exists
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

// Headers to mimic a real browser
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
};

async function scrapePage(pageNumber) {
    const url = `${BASE_URL}?search=Bogor&page=${pageNumber}`;
    console.log(`Fetching page ${pageNumber}...`);

    try {
        const response = await fetch(url, { headers: HEADERS });

        if (!response.ok) {
            console.error(`Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response Preview:', text.substring(0, 200));
            return [];
        }

        const html = await response.text();

        // Simple regex parsing for table rows
        // Looking for <tr ... data-search="..."> ... </tr>
        const rowRegex = /<tr[^>]*data-search="[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
        const rows = [];
        let match;

        while ((match = rowRegex.exec(html)) !== null) {
            const rowContent = match[1];
            // Extract cells <td>...</td>
            // Be careful with nested tags.
            // Using a simple split by </td> might fail if nested.
            // Let's rely on the structure: <td class="..."> convert to text

            // Extract text content from each td
            const cells = rowContent.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
            if (cells && cells.length >= 7) {
                const cleanCells = cells.map(cell => {
                    // Remove tags and trim
                    return cell.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                });

                // Structure based on HTML: No, Prov, Kab, Kec, Desa, Alamat, Nama
                // We want: Nama, Alamat, Prov, Kab, Kec, Desa, Phone(empty)
                // Source indices: 0:No, 1:Prov, 2:Kab, 3:Kec, 4:Desa, 5:Alamat, 6:Nama

                rows.push({
                    nama_sppg: cleanCells[6],
                    alamat: cleanCells[5],
                    provinsi: cleanCells[1],
                    kab_kota: cleanCells[2],
                    kecamatan: cleanCells[3],
                    desa: cleanCells[4]
                });
            }
        }

        return rows;

    } catch (error) {
        console.error('Error fetching page:', error);
        return [];
    }
}

const TOTAL_PAGES = 100; // Reduced for specific search
const DELAY_MS = 500; // Slower delay to be polite

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log(`Starting Full Scraper for ${TOTAL_PAGES} pages...`);

    // Initialize CSV with header
    const header = 'nama_sppg,alamat,provinsi,kab_kota,kecamatan,desa\n';
    fs.writeFileSync(OUTPUT_FILE, header);

    let totalRecords = 0;

    for (let i = 1; i <= TOTAL_PAGES; i++) {
        // Retry logic
        let attempts = 0;
        let success = false;
        let data = [];

        while (attempts < 3 && !success) {
            try {
                data = await scrapePage(i);
                success = true;
            } catch (e) {
                attempts++;
                await sleep(1000 * attempts);
            }
        }

        if (data && data.length > 0) {
            const csvContent = data.map(row =>
                `"${row.nama_sppg}","${row.alamat}","${row.provinsi}","${row.kab_kota}","${row.kecamatan ? row.kecamatan.replace(/"/g, '""') : ''}","${row.desa ? row.desa.replace(/"/g, '""') : ''}"`
            ).join('\n') + '\n';

            fs.appendFileSync(OUTPUT_FILE, csvContent);
            totalRecords += data.length;

            if (i % 50 === 0) {
                console.log(`[Progress] Page ${i}/${TOTAL_PAGES} | Total: ${totalRecords}`);
            }
        } else {
            console.log(`[Warning] Empty data on page ${i}`);
        }

        await sleep(DELAY_MS);
    }

    console.log(`Scraping Completed! Total records saved: ${totalRecords}`);
}

main();
