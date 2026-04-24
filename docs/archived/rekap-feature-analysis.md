# Analisis Fitur Rekap CatatOrder

> Konteks masalah UMKM, apa yang sudah diselesaikan CatatOrder, dan bagaimana fitur Rekap bekerja saat ini

---

## Bagian 1 — Masalah UMKM yang Relevan

### Konteks Besar

65,5 juta UMKM di Indonesia menyerap 97% tenaga kerja dan menyumbang 61% PDB. Namun produktivitasnya hanya 25% dari usaha besar. 77% UMKM masih mencatat keuangan secara manual. Credit gap UMKM mencapai Rp2.400 triliun — bukan karena bank tidak mau meminjamkan, tapi karena UMKM tidak punya data.

### Pain Chain: Akar Masalah → Dampak

```
Layer 1: PROSES MANUAL
├── Tidak ada pembukuan (B1)
├── Pesanan via WA manual (D3) ← titik masuk CatatOrder
├── Inventaris manual (B7)
└── Produksi tanpa standar (F1)
        ↓
Layer 2: SUMBER DAYA TERBUANG
├── Waktu terbuang 2-4 jam/hari untuk administrasi manual
├── 15-30% pesanan hilang karena terlewat
├── Margin 5-15% habis tergerus biaya tersembunyi
        ↓
Layer 3: DAMPAK LANGSUNG
├── Tidak bisa buktikan kelayakan kredit
├── Tidak tahu laba/rugi aktual
├── Produktivitas 25% dari usaha besar
        ↓
Layer 4: DAMPAK TURUNAN
├── Credit gap Rp2.400T tetap menganga
├── 67% tetap informal tanpa prospek formalisasi
├── UMKM terjebak subsistence economy permanen
```

### Masalah Spesifik yang Relevan dengan Rekap

| Kode | Masalah | Relevansi Rekap |
|------|---------|-----------------|
| B1 | 98% UMKM tidak melakukan pembukuan — transaksi hanya di ingatan atau kertas | Rekap otomatis menggantikan pencatatan manual |
| B2 | 83% mencampur keuangan pribadi dan bisnis — laba/rugi tidak pernah diketahui | Laporan bisnis terpisah dari keuangan pribadi |
| B3 | Harga jual berdasarkan intuisi, bukan HPP | Data produk terlaris + revenue bisa jadi dasar pricing |
| B4 | Cash flow rapuh — piutang macet 30-90 hari | Tracking pembayaran (lunas/DP/belum bayar) terlihat di rekap |
| B5 | Tidak ada proyeksi arus kas | Data harian/bulanan bisa jadi dasar proyeksi |
| B8 | Tidak ada laporan laba/rugi periodik | Rekap harian + laporan bulanan otomatis |
| B9 | Margin tipis habis tergerus biaya tersembunyi yang tidak dicatat | Visibilitas revenue vs collected memperlihatkan gap |
| D5 | Tidak ada data historis penjualan terstruktur | Semua pesanan tercatat → tren bisa dianalisis |
| E5 | Tidak ada CRM/database pelanggan | Pelanggan teratas + riwayat belanja otomatis dari pesanan |
| J4 | Tidak ada credit history formal | Data transaksi konsisten = alternatif credit scoring |
| A1 | Tidak punya laporan keuangan standar → gagal ajukan kredit | Laporan periodik otomatis = bukti kelayakan usaha |

---

## Bagian 2 — Apa yang Sudah Diselesaikan CatatOrder

### Core: Order Management

CatatOrder menyelesaikan masalah paling frekuen — **pesanan yang tercecer di chat WhatsApp** (D3, F5).

Dua jalur terima pesanan:
1. **Link Toko** (`catatorder.id/nama-bisnis`) — pelanggan pesan sendiri, masuk otomatis ke dashboard
2. **Manual + AI** — tempel chat WA, suara, foto screenshot → AI extract jadi item pesanan

### Fitur yang Sudah Live (v2.6.0)

| Fitur | Masalah yang Diselesaikan |
|-------|---------------------------|
| Pesanan tercatat otomatis | D3, F5 — tidak perlu scroll chat WA |
| Status pesanan (Baru → Diproses → Dikirim → Selesai) | G8 — tracking real-time |
| Pembayaran terlacak (Lunas/DP/Belum Bayar) | B4 — piutang terlihat |
| Katalog produk + stok | B7 — inventaris otomatis |
| Daftar pelanggan otomatis | E5 — CRM dari pesanan |
| Struk digital (WA/gambar/PDF) | Profesionalisme + bukti transaksi |
| QRIS pembayaran | D6 — pembayaran digital |
| Rekap harian + laporan bulanan | B1, B8 — pembukuan otomatis |
| Analisis AI | D5 — insight dari data historis |
| Konfirmasi & pengingat WA | Komunikasi pelanggan terstruktur |

### Apa yang Belum Diselesaikan (Peluang)

| Masalah | Fitur Potensial |
|---------|-----------------|
| B3 — Tidak tahu HPP | Kalkulator harga pokok |
| B5 — Tidak ada proyeksi kas | Proyeksi arus kas dari data pesanan |
| B6 — Tidak pisah biaya tetap/variabel | Pencatatan pengeluaran |
| A1 — Tidak punya laporan untuk kredit | Laporan keuangan standar untuk pengajuan kredit |
| J4 — Tidak ada credit scoring | Data transaksi sebagai alternatif credit scoring |

---

## Bagian 3 — Fitur Rekap Saat Ini (Detail Teknis)

### Struktur Halaman

Satu halaman `/rekap` dengan dua tab:
- **Harian** — rekap satu hari (default: hari ini)
- **Bulanan** — laporan satu bulan (default: bulan ini)

Halaman `/laporan` redirect ke `/rekap`.

### 3.1 Rekap Harian

#### Navigasi
- Tombol prev/next untuk pindah hari
- Tidak bisa maju melewati hari ini
- Tanggal tampil dalam format Indonesia (contoh: "Senin, 10 Maret 2026")

#### Data yang Ditampilkan

**A. Pendapatan**
| Metrik | Penjelasan | Sumber Data |
|--------|-----------|-------------|
| Total Pesanan | Jumlah pesanan (non-cancelled) | `COUNT` orders where status ≠ cancelled |
| Terkumpul | Total uang yang sudah masuk | `SUM(paid_amount)` dari semua pesanan |

**B. Pembayaran**
| Status | Warna | Logika |
|--------|-------|--------|
| Lunas | Hijau | `paid_amount === total` |
| DP | Kuning | `paid_amount > 0 && paid_amount < total` |
| Belum Bayar | Merah | `paid_amount === 0` atau null |

Masing-masing menampilkan: jumlah pesanan + total nominal.

**C. Status Pesanan**
Jumlah pesanan per status: Baru, Menunggu, Diproses, Dikirim, Selesai, Dibatalkan.

**D. Produk Terlaris**
- Top 10 produk berdasarkan revenue (qty × harga)
- Grouping case-insensitive (lowercase key, capitalized display)
- Menampilkan: nama produk, jumlah terjual, total revenue

**E. Pelanggan Baru**
- Jumlah pelanggan baru yang terdaftar hari itu
- Query dari tabel `customers` berdasarkan `created_at`

**F. Penggunaan Kuota Bulan Ini**
- Progress bar: orders_used vs limit
- Menampilkan sisa kuota

#### Aksi yang Tersedia

1. **Download Excel** — file `Rekap-Harian-{DD}-{MM}-{YYYY}-{HHMM}.xlsx`
   - Kolom: No. Pesanan, Pelanggan, Telepon, Item, Total (Rp), Dibayar (Rp), Sisa (Rp), Status, Pembayaran

2. **Kirim ke WhatsApp** — via WhatsApp Cloud API
   - Input nomor HP (disimpan di localStorage)
   - Format pesan:
   ```
   *{Nama Bisnis}* — {Tanggal dalam format Indonesia}

   Total Pesanan: {jumlah}
   Pendapatan: Rp{total revenue}
   Lunas: {jumlah lunas} · Belum bayar: {jumlah belum bayar}
   Item terlaris: {top 3 items}
   ```

3. **Analisis AI** — lihat bagian 3.3

---

### 3.2 Laporan Bulanan

#### Navigasi
- Tombol prev/next untuk pindah bulan
- Tidak bisa maju melewati bulan ini

#### Data yang Ditampilkan

Semua data rekap harian, **ditambah:**

**G. Pelanggan Teratas**
- Top 10 pelanggan berdasarkan total belanja
- Menampilkan: ranking, nama, telepon, total belanja, jumlah pesanan

**H. Rincian Harian**
- Tabel breakdown per hari dalam bulan tersebut
- Kolom: Tanggal, Jumlah Pesanan, Total Revenue, Total Terkumpul

**I. Pembayaran (versi bulanan)**
- Menampilkan count per status: Lunas, DP, Belum Bayar, Dibatalkan

#### Aksi yang Tersedia

1. **Download Excel** — file `Laporan-Bulanan-{Bulan}-{Tahun}-{DDMMYYYY}-{HHMM}.xlsx`
   - Kolom: Tanggal, No. Pesanan, Pelanggan, Telepon, Total (Rp), Dibayar (Rp), Sisa (Rp), Status, Pembayaran

2. **Analisis AI** — lihat bagian 3.3

---

### 3.3 Analisis AI

#### Cara Kerja

1. User tekan "Minta Analisis" di halaman rekap
2. Frontend POST ke `/api/recap/analyze` dengan `type` (daily/monthly) dan `period`
3. Server mengumpulkan data pesanan untuk periode tersebut + data perbandingan
4. Kirim ke AI model (Gemini 3.1 Flash Lite via OpenRouter, temperature 0.3)
5. Hasil disimpan ke tabel `ai_analyses` (cache)
6. Tampilkan di UI — nominal Rupiah di-highlight hijau

#### Data yang Dikirim ke AI

**Untuk Analisis Harian:**
- Jumlah pesanan aktif (non-cancelled)
- Revenue: total, terkumpul, per status pembayaran
- Top 5 produk (nama, qty, revenue)
- Jumlah pembayaran per status
- Pelanggan baru hari itu
- **Perbandingan:** rata-rata 7 hari terakhir + hari yang sama minggu lalu

**Untuk Analisis Bulanan:**
- Semua data di atas untuk skala bulanan
- Top 5 produk + top 5 pelanggan
- **Perbandingan:** bulan sebelumnya (orders, revenue, growth %)

#### Format Output AI

**Harian — 5 poin maksimal:**
- Masing-masing 1-2 kalimat
- Wajib menyebut status pembayaran jika ada yang belum lunas
- Wajib identifikasi pola produk
- Wajib 1 action item untuk besok
- Bahasa Indonesia sederhana, tanpa jargon keuangan

**Bulanan — 4 seksi:**
1. RINGKASAN — overview performa bulan ini vs sebelumnya
2. PELANGGAN — pola pelanggan, retention, top spender
3. PRODUK — produk terlaris, tren, peluang
4. SARAN — rekomendasi konkret untuk bulan depan
- Maksimal 300 kata total
- Highlight piutang besar jika ada

#### Cache & Refresh
- Cache tersimpan di tabel `ai_analyses` dengan constraint `UNIQUE(user_id, analysis_type, period_key)`
- Period key format: `YYYY-MM-DD` (harian) atau `YYYY-MM` (bulanan)
- Jika jumlah pesanan berubah sejak analisis terakhir → tampilkan tombol "refresh"
- User bisa force regenerate dengan klik refresh

#### Kirim ke WhatsApp
- Via WAPreviewSheet (modal preview sebelum kirim)
- Format:
  ```
  *{Nama Bisnis}* — Analisis {Harian/Bulanan} {periode}

  {isi analisis}

  _Dibuat dengan CatatOrder — catatorder.id_
  ```

---

### 3.4 Alur Data Teknis

```
Tabel orders (Supabase)
  ↓ query dengan timezone WIB (UTC+7)
  ↓ filter: user_id + date range + non-cancelled
  ↓
Service Layer (recap.service.ts / report.service.ts)
  ↓ aggregasi: revenue, items, customers, status counts
  ↓ derivasi: payment status dari paid_amount vs total
  ↓
Component (DailyRecap.tsx / MonthlyReport.tsx)
  ↓ render metrik + tabel + charts
  ↓
Aksi opsional:
  ├── Download Excel (lib/utils/export.ts → xlsx library)
  ├── Kirim WA (/api/recap → WhatsApp Cloud API)
  └── Analisis AI (/api/recap/analyze → OpenRouter → ai_analyses cache)
```

### 3.5 Timezone Handling

Semua query menggunakan WIB (UTC+7) eksplisit:
- Batas harian: `YYYY-MM-DDT00:00:00.000+07:00` sampai `YYYY-MM-DDT23:59:59.999+07:00`
- Batas bulanan: tanggal 1 bulan ini sampai tanggal 1 bulan depan
- Konversi tanggal di rincian harian menggunakan `Asia/Jakarta` timezone

### 3.6 Database Schema Terkait

**Tabel `orders` (sumber data utama rekap):**
- `order_number` — WO-YYYYMMDD-XXXX
- `items` — JSONB array [{name, price, qty}]
- `subtotal`, `discount`, `total` — nominal pesanan
- `paid_amount` — jumlah yang sudah dibayar
- `status` — new/menunggu/processed/shipped/done/cancelled
- `delivery_date` — tanggal pengiriman
- `created_at` — timestamp pesanan masuk

**Tabel `ai_analyses` (cache analisis AI):**
- `analysis_type` — 'daily' atau 'monthly'
- `period_key` — 'YYYY-MM-DD' atau 'YYYY-MM'
- `insights` — teks hasil analisis
- `data_snapshot` — JSONB berisi metrik saat analisis dibuat:
  ```json
  {
    "totalOrders": 15,
    "totalRevenue": 750000,
    "collectedRevenue": 500000,
    "paidRevenue": 400000,
    "paidCount": 8,
    "partialRevenue": 100000,
    "partialCount": 2,
    "unpaidRevenue": 250000,
    "unpaidCount": 5,
    "topItems": [{"name": "Nasi Box", "qty": 20, "revenue": 500000}],
    "newCustomers": 3,
    "comparison": {
      "avgOrders": 12,
      "avgRevenue": 600000,
      "samePeriodOrders": 10,
      "samePeriodRevenue": 500000
    }
  }
  ```

### 3.7 Analytics Events

| Event | Properties | Trigger |
|-------|-----------|---------|
| `recap_viewed` | date, total_orders, revenue | Buka rekap harian |
| `recap_exported` | date, order_count | Download Excel harian |
| `report_viewed` | month, year, total_orders, revenue | Buka laporan bulanan |
| `report_exported` | month, year, order_count | Download Excel bulanan |
| `ai_analysis_generated` | type, period, force | Generate analisis AI |

---

## Bagian 4 — Contoh Output Rekap

### Contoh Rekap Harian (tampilan dashboard)

```
Senin, 10 Maret 2026

PENDAPATAN
  Total Pesanan    : 15
  Terkumpul        : Rp750.000

PEMBAYARAN
  ● Lunas          : 8 pesanan · Rp400.000
  ● DP             : 2 pesanan · Rp100.000
  ● Belum Bayar    : 5 pesanan · Rp250.000

STATUS PESANAN
  Baru: 3  Diproses: 5  Dikirim: 2  Selesai: 5

PRODUK TERLARIS
  1. Nasi Box Ayam      — 20 pcs · Rp500.000
  2. Air Mineral        — 15 pcs · Rp75.000
  3. Kue Lapis          — 10 pcs · Rp150.000

PELANGGAN BARU: 3
KUOTA: 35/50 pesanan bulan ini
```

### Contoh Excel Harian

| No. Pesanan | Pelanggan | Telepon | Item | Total (Rp) | Dibayar (Rp) | Sisa (Rp) | Status | Pembayaran |
|-------------|-----------|---------|------|-----------|-------------|----------|--------|------------|
| WO-20260310-0001 | Bu Ratna | 081234567890 | Nasi Box Ayam x5, Air Mineral x5 | 150.000 | 150.000 | 0 | Selesai | Lunas |
| WO-20260310-0002 | Pak Budi | 082345678901 | Kue Lapis x10 | 150.000 | 75.000 | 75.000 | Diproses | DP |
| WO-20260310-0003 | Ibu Sari | 083456789012 | Nasi Box Ayam x3 | 75.000 | 0 | 75.000 | Baru | Belum Bayar |

### Contoh Analisis AI Harian

```
Hari ini ada 15 pesanan masuk dengan total Rp750.000 — naik 25% dari
rata-rata 7 hari terakhir (Rp600.000). Hari yang bagus!

Masih ada 5 pesanan belum dibayar senilai Rp250.000. Pertimbangkan
kirim pengingat WA malam ini sebelum tutup.

Nasi Box Ayam tetap jadi andalan — menyumbang 67% dari total
pendapatan hari ini (Rp500.000 dari 20 porsi).

3 pelanggan baru hari ini, semua dari link toko. Link toko efektif
mendatangkan pelanggan baru.

Untuk besok: siapkan stok Nasi Box Ayam lebih banyak — tren
pemesanan meningkat di hari Selasa berdasarkan minggu lalu.
```

### Contoh Laporan Bulanan (bagian tambahan)

**Pelanggan Teratas:**

| # | Nama | Telepon | Total Belanja | Pesanan |
|---|------|---------|--------------|---------|
| 1 | Bu Ratna | 081234567890 | Rp2.500.000 | 12 |
| 2 | Pak Budi | 082345678901 | Rp1.800.000 | 8 |
| 3 | Ibu Sari | 083456789012 | Rp1.200.000 | 6 |

**Rincian Harian:**

| Tanggal | Pesanan | Revenue | Terkumpul |
|---------|---------|---------|-----------|
| 1 Mar | 12 | Rp600.000 | Rp450.000 |
| 2 Mar | 15 | Rp750.000 | Rp600.000 |
| 3 Mar | 8 | Rp400.000 | Rp400.000 |
| ... | ... | ... | ... |

---

*Dokumen ini ditulis: 2026-03-10*
*Berdasarkan: CatatOrder v2.6.0, umkm-problem.md, profil-catatorder.md*
