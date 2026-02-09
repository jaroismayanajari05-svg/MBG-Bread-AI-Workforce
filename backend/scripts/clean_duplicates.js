
import db from '../database/db.js';

async function cleanDuplicates() {
    console.log('🧹 Starting cleanup...');

    // 1. Get total count
    const totalBefore = db.query('SELECT COUNT(*) as c FROM leads')[0].c;
    console.log(`Total records before: ${totalBefore}`);

    // 2. Find duplicates
    const duplicates = db.query(`
        SELECT nama_sppg, COUNT(*) as c 
        FROM leads 
        GROUP BY nama_sppg 
        HAVING c > 1
    `);

    console.log(`Found ${duplicates.length} names with duplicate entries.`);

    if (duplicates.length === 0) {
        console.log('✅ No duplicates found.');
        return;
    }

    // 3. Delete duplicates (keep the one with worst ID? No, keep the one with BEST info? 
    // Usually keep the earliest ID is safest, or latest if updated. 
    // Since we just imported, they are likely identical. Let's keep the lowest ID.

    db.run(`
        DELETE FROM leads 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM leads 
            GROUP BY nama_sppg
        )
    `);

    // 4. Verify
    const totalAfter = db.query('SELECT COUNT(*) as c FROM leads')[0].c;
    console.log(`Total records after: ${totalAfter}`);
    console.log(`🗑️ Removed ${totalBefore - totalAfter} duplicate records.`);
}

cleanDuplicates();
