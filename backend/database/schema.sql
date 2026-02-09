-- MBG Bread AI Workforce Database Schema

-- Leads table: stores SPPG/Dapur MBG information
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_sppg TEXT NOT NULL,
    alamat TEXT,
    provinsi TEXT,
    kab_kota TEXT,
    kecamatan TEXT,
    desa TEXT,
    phone TEXT,
    confidence_score REAL DEFAULT 0.5,
    status TEXT DEFAULT 'Belum Dihubungi' CHECK(status IN ('Belum Dihubungi', 'Sudah Dikirimi', 'Tertarik', 'Tidak Tertarik', 'Eskalasi')),
    pesan_penawaran TEXT,
    pesan_terakhir_dikirim DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages table: conversation history
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('outgoing', 'incoming')),
    content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_kab_kota ON leads(kab_kota);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
