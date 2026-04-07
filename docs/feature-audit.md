# Tokoflow Feature Audit

> Audit per 7 April 2026 — perbandingan fitur yang di-claim di marketing page vs implementasi aktual di codebase.

## Supabase Project

- **Project ID**: yhwjvdwmwboasehznlfv
- **Org**: akademisi (Free)
- **Database tables**: tf_products, tf_sales_transactions, tf_sales_input, tf_incoming_goods, tf_incoming_goods_input, tf_product_costs, tf_product_compositions, tf_stock_adjustments, tf_marketplace_fees, kn_membership_plans

---

## Fitur yang SUDAH ADA

| # | Fitur | Detail | File/Route Terkait |
|---|---|---|---|
| 1 | Inventory tracking (single location) | CRUD produk, stok real-time update saat jual/incoming goods | `app/(private)/inventory/`, `app/api/inventory/` |
| 2 | Sales input + auto profit calculation | Revenue - (modal×qty + packing×qty + affiliate fee + marketplace fee) | `lib/services/sales.js`, `app/api/sales/` |
| 3 | Product compositions / bundle | Komposit produk, update stok komponen otomatis | `app/(private)/product-compositions/`, `lib/services/composition.js` |
| 4 | Marketplace fee config | Set fee % per channel, otomatis dihitung saat input penjualan | `app/(private)/marketplace-fees/`, `tf_marketplace_fees` |
| 5 | Dashboard analytics | Time-series profit, revenue, channel breakdown, top products | `app/(private)/dashboard/`, `app/api/dashboard/analytics/` |
| 6 | Incoming goods tracking | Catat barang masuk, update stok otomatis | `app/(private)/incoming-goods/`, `lib/services/incomingGoods.js` |
| 7 | Stock adjustments | Koreksi stok manual dengan alasan | `app/(private)/stock-adjustments/` |
| 8 | Sales history + CSV export | Lihat riwayat penjualan, filter, export CSV | `app/(private)/sales-history/` |
| 9 | Product costs management | Modal, biaya packing, persentase affiliate per produk | `app/(private)/product-costs/` |
| 10 | Auth (email/password) | Supabase Auth, middleware redirect untuk protected routes | `middleware.js`, `lib/auth/` |
| 11 | Multi-user access | Multiple user bisa login (tapi tanpa role/permission) | Supabase Auth |

---

## Fitur yang DIKLAIM tapi BELUM ADA

| # | Klaim Marketing | Halaman yang Claim | Status | Catatan |
|---|---|---|---|---|
| 1 | Integrasi API Shopee/Tokopedia/TikTok Shop | Home, Layanan, Investasi, Tentang | **TIDAK ADA** | Nol kode integrasi marketplace API. Hanya tabel fee% manual |
| 2 | Stock sync across channels | Home, Layanan | **TIDAK ADA** | Stok hanya di satu tempat, tidak ada sync ke marketplace |
| 3 | Centralized order management | Layanan | **TIDAK ADA** | Tidak ada import order dari marketplace |
| 4 | Mobile App + Barcode Scanner | Home, Layanan, Investasi | **TIDAK ADA** | Tidak ada mobile app, tidak ada library barcode |
| 5 | Multi-warehouse support | Home, Layanan | **TIDAK ADA** | Tidak ada field warehouse/lokasi di tabel produk |
| 6 | Stock alert & notification | Home, Layanan | **TIDAK ADA** | Tidak ada threshold stok, tidak ada notifikasi |
| 7 | Customer behavior analytics | Home | **TIDAK ADA** | Tidak ada tabel customer, tidak ada tracking behavior |
| 8 | Predictive inventory planning | Home | **TIDAK ADA** | Tidak ada forecasting/ML |
| 9 | POS system | FAQ | **TIDAK ADA** | Tidak ada fitur point-of-sale |
| 10 | Role-based access control | Layanan | **TIDAK ADA** | Semua user punya akses sama, tidak ada role |
| 11 | Google Sheets based | Home (Technology section) | **MISLEADING** | Sistem 100% Supabase. Bukan Google Sheets. Mungkin versi awal pakai Sheets tapi sudah migrasi penuh |
| 12 | Midtrans payment | Checkout page | **PARTIAL** | Load Midtrans Snap script, tapi API endpoint (`/api/payment/create-transaction`) belum ada |
| 13 | Custom reports | Investasi | **TIDAK ADA** | Hanya dashboard analytics, belum ada custom report builder |
| 14 | API access (untuk user) | Investasi | **TIDAK ADA** | API internal saja, tidak ada public API untuk customer |
| 15 | Newsletter subscribe | Panduan | **TIDAK ADA** | Form ada tapi tidak terhubung ke backend |

---

## Klaim Marketing yang Tidak Terverifikasi

| Klaim | Muncul di | Penilaian |
|---|---|---|
| 500+ UMKM pengguna | Home, Investasi, Tentang | Tidak terverifikasi — kemungkinan placeholder |
| 10M+ transaksi/bulan | Home, Tentang | Tidak terverifikasi — kemungkinan placeholder |
| 99.9% uptime | Home | Klaim hosting, bukan fitur custom |
| 24/7 support team | Home | Tidak terverifikasi |
| 15+ team members | Tentang | Tidak terverifikasi |
| ISO 27001 certified | Tentang, FAQ | Kemungkinan false — tidak ada evidence |
| Google for Startups alumni | Tentang | Tidak terverifikasi |
| Top 10 Startup award | Tentang | Tidak terverifikasi |
| 5,000+ newsletter subscribers | Panduan | Tidak terverifikasi — newsletter belum functional |

---

## Kesimpulan

### Yang solid
Core product (inventory + sales + profit calculation) sudah **fungsional dan well-built**. Dashboard analytics cukup lengkap. Product composition/bundling bekerja dengan baik.

### Gap terbesar
1. **Marketplace integration** — di-promote besar di semua page tapi nol implementasi
2. **Mobile app & barcode** — di-claim di pricing tapi tidak ada
3. **Role-based access** — kritis untuk multi-user tapi belum ada
4. **Payment/subscription** — checkout page ada tapi backend belum lengkap

### Rekomendasi prioritas
1. Sesuaikan marketing copy dengan realita (hapus klaim false)
2. Implementasi payment flow (Midtrans) supaya bisa monetize
3. Tambah role-based access untuk multi-user
4. Marketplace integration sebagai next major feature
5. Stock alert sebagai quick win

---

*Audit ini dilakukan dengan membaca source code, bukan testing runtime. Beberapa fitur mungkin ada di database (stored procedures/triggers) yang tidak terlihat dari codebase saja.*
