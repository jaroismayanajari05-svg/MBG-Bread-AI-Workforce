
import db from '../database/db.js';

db.get('SELECT count(*) as count FROM leads', [], (err, row) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Total Leads in DB: ${row.count}`);
    }
});
