# TokoFlow - Sistem Inventory & Penjualan Terintegrasi

## Overview
TokoFlow adalah sistem manajemen inventory dan penjualan yang diimplementasikan dari sistem spreadsheet ke platform web menggunakan Next.js. Sistem ini mengelola:
- Pencatatan transaksi penjualan dengan perhitungan profit multi-layer
- Manajemen stok real-time
- Sistem produk bundle/paket dengan komposisi komponen
- Multi-channel marketplace dengan fee berbeda
- Tracking barang masuk dan keluar

## Struktur Menu

### 1. Dashboard (`/dashboard`)
- Overview statistik penjualan
- Total omzet, profit, transaksi
- Monitoring stok kritis
- Aksi cepat untuk input data
- Aktivitas terkini

### 2. Input Penjualan (`/penjualan`)
- Form input transaksi penjualan
- Fields: Tanggal, SKU, Nama Produk, Harga Jual, Jumlah, Channel, Status
- Daftar penjualan pending
- Tombol proses untuk finalisasi penjualan

### 3. Barang Masuk (`/barang-masuk`)
- Form input barang masuk
- Fields: Tanggal, SKU, Nama Produk, Jumlah Masuk, Status
- Daftar barang masuk pending
- Update stok otomatis setelah proses

### 4. Inventori (`/inventori`)
- Monitoring stok semua produk
- Filter pencarian berdasarkan SKU atau nama
- Indikator stok: Normal, Rendah, Negatif
- Summary statistik inventori

### 5. Rekap Penjualan (`/rekap-penjualan`)
- Laporan detail semua transaksi penjualan
- Filter by: Tanggal, Channel, SKU
- Kalkulasi omzet dan profit per transaksi
- Summary total keseluruhan

### 6. Komposisi Produk (`/komposisi-produk`)
- Setup produk bundle/paket
- Definisi komponen per produk
- Support channel-specific composition
- Status aktif/non-aktif

### 7. Harga Modal (`/harga-modal`)
- Setup harga modal per SKU
- Biaya packing
- Persentase komisi affiliate
- Total HPP (Harga Pokok Penjualan)

### 8. Fee Marketplace (`/fee-marketplace`)
- Konfigurasi fee per channel
- Persentase fee marketplace
- Contoh perhitungan fee
- Validasi duplikasi channel

## Perhitungan Profit

Sistem menghitung profit dengan formula:
```
Total Modal = (Modal + Packing) × Quantity + Biaya Affiliate
Biaya Affiliate = (Persentase Affiliate / 100) × Omzet
Biaya Fee = (Persentase Fee / 100) × Omzet
Profit = Omzet - Total Modal - Biaya Fee
```

## Flow Proses

### Penjualan:
1. Input data penjualan dengan status "OK"
2. Klik "Proses Penjualan"
3. Sistem akan:
   - Mengurangi stok produk
   - Mengurangi stok komponen (jika produk bundle)
   - Mencatat ke rekap penjualan
   - Menghitung profit

### Barang Masuk:
1. Input data barang masuk dengan status "OK"
2. Klik "Proses Barang Masuk"
3. Sistem akan menambah stok produk

## Status Data
- **OK**: Siap diproses
- **Dalam proses**: Pending, tidak diproses
- **Dibatalkan**: Tidak diproses

## Tech Stack
- Next.js 14
- React
- Tailwind CSS
- Supabase (Authentication)

## Development Notes
- Semua komponen menggunakan "use client" untuk interaktivity
- State management menggunakan React useState
- Styling dengan Tailwind CSS utility classes
- Responsive design untuk mobile & desktop

## Future Enhancements
- Integrasi database untuk persistent storage
- API endpoints untuk data processing
- Real-time stock validation
- Export laporan ke Excel/PDF
- Dashboard analytics dengan charts
- Multi-user dengan role management
