# MBG Bread AI Workforce

Aplikasi otomatis untuk mencari dan menghubungi Dapur MBG (SPPG) untuk penawaran roti.

## Cara Menjalankan

### 1. Install Dependencies

```bash
# Di folder utama
npm run install:all
```

### 2. Konfigurasi (Opsional)

Copy file `.env.example` ke `.env` dan isi API keys jika tersedia:

```bash
cp .env.example .env
```

> **Catatan**: Aplikasi berjalan dalam mode **Simulasi** jika API keys tidak diisi

### 3. Jalankan Aplikasi

```bash
# Jalankan backend dan frontend bersamaan
npm run dev
```

Atau jalankan terpisah:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 4. Buka Browser

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Fitur

- 🔍 **Cari Otomatis**: Temukan Dapur MBG dari berbagai sumber
- ✉️ **Pesan Otomatis**: Generate pesan WhatsApp sesuai standar MBG
- 📊 **Dashboard**: Pantau statistik dan status pengiriman
- 📋 **Daftar Dapur**: Kelola semua lead dalam satu tempat

## API Keys (Opsional)

| Key | Fungsi |
|-----|--------|
| `OPENAI_API_KEY` | Generate pesan dengan AI (tanpa key = template) |
| `GOOGLE_MAPS_API_KEY` | Cari lokasi SPPG (tanpa key = sample data) |
| `WHATSAPP_TOKEN` | Kirim pesan WhatsApp (tanpa key = simulasi) |

## Deployment

### Frontend (Netlify)

```bash
cd frontend
npm run build
# Upload folder dist/ ke Netlify
```

### Backend (Railway)

Push ke GitHub, connect ke Railway dengan environment variables.

## License

MIT
