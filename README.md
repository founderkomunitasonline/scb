# SCB Deposit Filter

Aplikasi web untuk memfilter data deposit dari dua sumber (Manual dan QRPay) untuk menampilkan user yang belum mendapatkan bonus deposit harian.

## 🚀 Fitur

- Upload file Excel untuk Deposit History Manual
- Upload file Excel untuk Deposit History QRPay
- Filter otomatis berdasarkan User Name dan Tanggal
- Download hasil filter dalam format Excel
- Responsive design dengan Tailwind CSS
- Optimasi untuk data besar (1000+ records)

## 📋 Prasyarat

- Node.js 18+ atau lebih tinggi
- Akun GitHub (untuk upload)
- Akun Vercel (untuk deploy)

## 🛠️ Instalasi Lokal

```bash
# Clone repository
git clone https://github.com/username-anda/scb-deposit-filter.git

# Masuk ke folder
cd scb-deposit-filter

# Install dependencies
npm install

# Jalankan development server
npm run dev
