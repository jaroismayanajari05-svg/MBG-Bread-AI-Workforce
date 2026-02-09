
import fetch from 'node-fetch';

async function verifyApi() {
    try {
        console.log('Testing API access...');
        const response = await fetch('http://localhost:3001/api/leads');
        const data = await response.json();

        if (data.success) {
            console.log(`✅ API Success! Retrieved ${data.data.length} leads.`);
            if (data.data.length > 500) {
                console.log('✅ Data count matches expected import size (> 500).');

                // Print a sample
                const sample = data.data[0];
                console.log('Sample Data:', {
                    nama: sample.nama_sppg,
                    alamat: sample.alamat,
                    status: sample.status
                });
            } else {
                console.log('⚠️ Warning: Data count is lower than expected.');
            }
        } else {
            console.error('❌ API Error:', data.error);
        }
    } catch (err) {
        console.error('❌ Connection Error:', err.message);
    }
}

verifyApi();
