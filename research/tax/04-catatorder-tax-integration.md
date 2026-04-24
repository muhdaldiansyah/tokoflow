# CatatOrder → Tax Integration Path

**Tanggal riset:** 2026-03-28
**Sumber utama:** DJP/pajak.go.id (T1), Kemenkeu Media Keuangan (T1), DDTC News (T3), Klikpajak.id (T3-T4), Square/Toast/Xero/QuickBooks docs (T1-T3), Kompas/Liputan6 (T3), GetApp/Capterra (T4), Academic papers (T2)
**Temporal focus:** [STRUCTURE/TREND]

---

## A. APA YANG CATATORDER SUDAH PUNYA (Data Audit)

### Database Schema — Tax-Relevant Data

| Tabel | Kolom Tax-Relevant | Status | Tag |
|-------|-------------------|--------|-----|
| `orders` | `subtotal`, `total`, `discount`, `created_at`, `status` | ADA — omzet bruto bisa dihitung dari SUM(total) per bulan | [FAKTA] |
| `orders` | `source` (manual/whatsapp/order_link), `payment_status` | ADA — bisa filter paid orders saja | [FAKTA] |
| `profiles` | `npwp`, `nitku` | ADA — sudah capture NPWP penjual | [FAKTA] |
| `customers` | `npwp`, `name`, `phone`, `address` | ADA — sudah capture NPWP pembeli | [FAKTA] |
| `invoices` | `subtotal`, `discount`, `ppn_rate`, `ppn_amount`, `total`, `trx_code` | ADA — full PPN data per faktur | [FAKTA] |
| `invoices` | `seller_*`, `buyer_*` snapshot fields | ADA — frozen seller/buyer identity | [FAKTA] |
| `products` | `price`, `cost_price` | ADA — bisa hitung margin | [FAKTA] |

### Existing Tax Features (v4.6.0)

| Fitur | Status | Detail | Tag |
|-------|--------|--------|-----|
| e-Faktur XML generation | LIVE | `lib/efaktur/generate-xml.ts` — TaxInvoice.xsd v1.6, supports TrxCode 01/04/07/08 | [FAKTA] |
| NPWP 16-digit formatting | LIVE | Auto-pad 15→16 digit, IDTKU generation | [FAKTA] |
| DPP Nilai Lain (PMK 131/2024) | LIVE | TaxBase * 11/12 for TrxCode 04 | [FAKTA] |
| SPT PPN summary | LIVE | Aggregasi PPN keluaran per periode | [FAKTA] |
| Faktur lifecycle tracking | LIVE | Status tracking per faktur | [FAKTA] |
| Order → Faktur 1-click | LIVE | Konversi order ke faktur pajak langsung | [FAKTA] |
| Omzet recording (implicit) | LIVE | Via orders table — SUM(total) WHERE status != 'cancelled' | [FAKTA] |

### Key Insight: CatatOrder Sudah Punya ~80% Data untuk PPh Final UMKM

[INFERENSI] Untuk menghitung PPh Final UMKM 0.5%, yang dibutuhkan HANYA:
1. **Omzet bruto bulanan** → sudah ada (SUM orders.total per bulan)
2. **Identitas WP** (NPWP) → sudah ada (profiles.npwp)
3. **Periode pajak** → sudah ada (orders.created_at)

Yang BELUM ada:
- Kalkulator PPh Final otomatis
- Tracking threshold Rp500 juta (tax-free) vs di atas Rp500 juta
- Kode billing generation
- Rekap omzet formatted sesuai Coretax input requirement
- Reminder tanggal setor (15 bulan berikutnya) dan lapor (20 bulan berikutnya)

---

## B. GLOBAL BENCHMARKS: Bagaimana POS/Ordering Apps Handle Tax

### Square (US) — Tax Reporting Model

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Automatic sales tax calculation | Per-item, per-jurisdiction | [FAKTA-T1] | [STRUCTURE] |
| Tax reporting dashboard | Overview tax rates, taxable vs non-taxable sales | [FAKTA-T1] | [STRUCTURE] |
| 1099-K auto-generation | Form tax otomatis jika gross >$20K + 200 transactions | [FAKTA-T1] | [TREND] |
| Year-end sales summary | Jika tidak qualify 1099-K, tetap bisa download | [FAKTA-T1] | [STRUCTURE] |
| Tax form delivery | Available di dashboard by Jan 31 | [FAKTA-T1] | [STRUCTURE] |

[INFERENSI] Square approach: **passive tax reporting** — mereka tidak bantu bayar/lapor pajak, tapi menyediakan semua data yang dibutuhkan untuk filing. User tetap file sendiri atau via accountant.

### Toast (US F&B) — Tax Compliance Model

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Multi-rate tax configuration | Beda rate per kategori (food 6%, alcohol 9%) | [FAKTA-T1] | [STRUCTURE] |
| Smart tax (dine-in vs takeout) | Auto-switch tax rate berdasarkan dining option | [FAKTA-T1] | [STRUCTURE] |
| Tax-exempt takeout handling | Auto-exempt untuk state yang tidak tax takeout | [FAKTA-T1] | [STRUCTURE] |
| xtraCHEF integration | Real-time insight sales tax payable | [FAKTA-T3] | [STRUCTURE] |
| Tax report per outlet | Breakdown per tanggal, transaksi, penjualan, pajak | [FAKTA-T1] | [STRUCTURE] |

[INFERENSI] Toast approach: **active tax calculation** — mereka menghitung tax di setiap transaksi. Tapi tetap tidak file ke IRS. Lebih advanced dari Square karena F&B punya kompleksitas tax rate berbeda per item.

### Xero (NZ/AU/UK) — Full Compliance Model

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Auto tax calculation | Sales tax, VAT, GST otomatis dari transaksi | [FAKTA-T1] | [STRUCTURE] |
| Avalara integration | 13,000+ jurisdictions US | [FAKTA-T3] | [STRUCTURE] |
| Pre-filled tax forms | Auto-generate forms siap submit ke otoritas | [FAKTA-T1] | [STRUCTURE] |
| Tax law update alerts | Notifikasi perubahan regulasi | [FAKTA-T3] | [STRUCTURE] |
| Audit trail | Record semua transaksi tax-related | [FAKTA-T1] | [STRUCTURE] |

[INFERENSI] Xero approach: **full compliance pipeline** — dari calculation sampai form generation. Tapi Xero = accounting software, bukan POS. Level integrasi berbeda.

### QuickBooks Self-Employed (US) — Micro Business Model

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Auto quarterly tax estimate | Kalkulasi federal income + self-employment tax | [FAKTA-T1] | [STRUCTURE] |
| Tax category classification | Auto-categorize expenses as deductible | [FAKTA-T1] | [STRUCTURE] |
| Quarterly payment reminders | Alert sebelum due date | [FAKTA-T1] | [STRUCTURE] |
| Direct payment from app | Bayar estimated tax langsung dari QuickBooks | [FAKTA-T1] | [STRUCTURE] |
| Annual tax report | Schedule C data pre-filled | [FAKTA-T1] | [STRUCTURE] |

[INFERENSI] QuickBooks SE approach: **proactive tax management** — tidak hanya hitung, tapi estimasi, remind, dan facilitate payment. INI yang paling relevan untuk CatatOrder karena target user sama: micro/solo business owner.

### Ringkasan Model Integrasi Tax di POS Global

| Level | Deskripsi | Contoh | Complexity | Tag |
|-------|-----------|--------|------------|-----|
| **L1: Passive Data** | Sediakan data omzet, user hitung sendiri | Square (basic) | Rendah | [STRUKTUR] |
| **L2: Tax Calculator** | Hitung pajak otomatis dari data transaksi | Toast, Square (sales tax) | Sedang | [STRUKTUR] |
| **L3: Form Generation** | Generate form/report siap submit | Xero, QuickBooks | Tinggi | [STRUKTUR] |
| **L4: Filing Integration** | Submit langsung ke otoritas pajak via API | Xero (AU/UK), beberapa PJAP | Sangat Tinggi | [STRUKTUR] |
| **L5: End-to-End** | Hitung + bayar + lapor dalam satu platform | Full PJAP (OnlinePajak, Klikpajak) | Maksimal | [STRUKTUR] |

---

## C. INDONESIA BENCHMARKS: Tax Features di POS/UMKM Apps Lokal

### Majoo — Tax Features

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Pengaturan pajak per outlet | 3 opsi: sebelum diskon, sesudah diskon, termasuk harga | [FAKTA-T1] | [STRUCTURE] |
| Laporan pajak | Breakdown per tanggal, transaksi, penjualan, pajak, outlet | [FAKTA-T1] | [STRUCTURE] |
| Tapping box integration | Koneksi ke tapping box pajak daerah (pajak restoran) | [FAKTA-T1] | [STRUCTURE] |
| PPh Final UMKM | TIDAK ADA fitur khusus | [FAKTA-T1] | [STRUCTURE] |
| e-Faktur / XML | TIDAK ADA | [FAKTA-T1] | [STRUCTURE] |

### Moka POS — Tax Features

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Sales tax per transaksi | Configurable tax rate | [FAKTA-T1] | [STRUCTURE] |
| Tax report | Laporan pajak per periode | [INFERENSI-T4] | [STRUCTURE] |
| PPh Final UMKM | TIDAK ADA fitur khusus | [INFERENSI-T4] | [STRUCTURE] |
| e-Faktur / XML | TIDAK ADA | [INFERENSI-T4] | [STRUCTURE] |

### BukuKas / BukuWarung — Tax Features

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Pencatatan pemasukan/pengeluaran | Basic bookkeeping | [FAKTA-T3] | [STRUCTURE] |
| Tax features | TIDAK ADA fitur pajak spesifik | [FAKTA-T3] | [STRUCTURE] |
| Omzet tracking | Implicit dari pencatatan | [INFERENSI] | [STRUCTURE] |

### HiPajak — Tax-First UMKM App

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Target user | WP OP non-karyawan, freelancer, UMKM | [FAKTA-T3] | [STRUCTURE] |
| Paket gratis | Fitur dasar | [FAKTA-T3] | [STRUCTURE] |
| Paket premium | Rp25.000/bulan — 9 fitur | [FAKTA-T3] | [SNAPSHOT] |
| Fitur premium | Konsultasi 30 mnt, rekomendasi pajak, pencatatan, hitung bulanan, arsip, download SPT | [FAKTA-T3] | [STRUCTURE] |
| Sumber revenue | TIDAK ADA dari order/transaksi — pure tax tool | [INFERENSI] | [STRUCTURE] |

### Klikpajak (Mekari) — PJAP Full

| Fitur | Detail | Tag | Temporal |
|-------|--------|-----|----------|
| Status | PJAP resmi DJP (KEP-169/PJ/2018) | [FAKTA-T1] | [STRUCTURE] |
| e-Faktur H2H | Terhubung langsung ke DJP | [FAKTA-T1] | [STRUCTURE] |
| e-Billing | Generate kode billing | [FAKTA-T1] | [STRUCTURE] |
| e-SPT | Filing langsung | [FAKTA-T1] | [STRUCTURE] |
| Pricing Small | Gratis 3 bulan, lalu Rp250.000/bulan (100 dokumen/bulan) | [FAKTA-T3] | [SNAPSHOT] |
| Target | Badan usaha PKP, bukan UMKM mikro | [INFERENSI] | [STRUCTURE] |

### Gap Analysis: Indonesia POS vs Tax

| App | Order Management | Sales Tax Calc | PPh Final UMKM | e-Faktur XML | SPT/Filing | Tag |
|-----|-----------------|---------------|----------------|-------------|-----------|-----|
| **CatatOrder** | YA (core) | TIDAK | TIDAK (tapi data ADA) | YA (Bisnis tier) | TIDAK | [FAKTA] |
| Majoo | YA | YA (per transaksi) | TIDAK | TIDAK | TIDAK | [FAKTA] |
| Moka | YA | YA (per transaksi) | TIDAK | TIDAK | TIDAK | [FAKTA/INFERENSI] |
| BukuKas/BukuWarung | Minimal | TIDAK | TIDAK | TIDAK | TIDAK | [FAKTA] |
| HiPajak | TIDAK | TIDAK | YA (kalkulator) | TIDAK | YA (SPT) | [FAKTA] |
| Klikpajak | TIDAK | TIDAK | YA | YA (H2H) | YA | [FAKTA] |

[INFERENSI] **TIDAK ADA satupun app di Indonesia yang menggabungkan order management + PPh Final UMKM calculation + e-Faktur XML dalam satu platform.** CatatOrder sudah punya 2 dari 3 (order management + e-Faktur XML). Menambah PPh Final calculator = monopoli di intersection ini.

---

## D. TECHNICAL FEASIBILITY: PPh Final UMKM Integration

### Data Requirements vs CatatOrder Data Availability

| Data Requirement | Untuk Apa | CatatOrder Status | Gap | Tag |
|-----------------|-----------|-------------------|-----|-----|
| Omzet bruto bulanan | Hitung PPh Final 0.5% | ADA (SUM orders.total) | Query saja | [FAKTA] |
| NPWP pemilik | Identitas WP | ADA (profiles.npwp) | Sudah ada | [FAKTA] |
| Akumulasi omzet tahunan | Cek threshold Rp500 juta | BISA DIHITUNG | Perlu aggregate query | [FAKTA] |
| Status WP (OP/Badan) | Tentukan masa berlaku tarif 0.5% | BELUM ADA | Perlu field baru | [INFERENSI] |
| Tahun terdaftar WP | Hitung sisa masa tarif 0.5% | BELUM ADA | Perlu field baru | [INFERENSI] |
| KAP + KJS | Kode untuk billing pajak | FIXED (411128/420) | Hardcode saja | [FAKTA] |

### Alur Teknis: Data Omzet → Hitung Pajak → Setor → Lapor

```
┌─────────────────────────────────────────────────────────────┐
│ ALUR PPh FINAL UMKM via CatatOrder                         │
│                                                             │
│ 1. RECORD (sudah ada)                                       │
│    orders.total → akumulasi per bulan                       │
│                                                             │
│ 2. CALCULATE (perlu dibangun — SEDERHANA)                   │
│    IF omzet_ytd <= 500 juta → PPh = Rp0                    │
│    IF omzet_ytd > 500 juta → PPh = omzet_bulan * 0.5%      │
│    Tapi: hanya omzet di ATAS Rp500jt yang kena              │
│    Bulan saat threshold terlampaui → pro-rate                │
│                                                             │
│ 3. REMIND (perlu dibangun — SEDERHANA)                      │
│    Push notification: "Setor PPh paling lambat 15 [bulan]"  │
│    Push notification: "Lapor SPT Masa paling lambat 20"     │
│                                                             │
│ 4. GENERATE BILLING INFO (perlu dibangun — SEDANG)          │
│    Tampilkan: KAP 411128, KJS 420, nominal, masa pajak      │
│    User copy → buka Coretax → buat billing sendiri          │
│    ATAU: deep-link ke Coretax (jika supported)              │
│                                                             │
│ 5. FILE/REPORT (TIDAK dibangun di MVP)                      │
│    User file sendiri di Coretax                             │
│    CatatOrder sediakan rekap omzet bulanan yang bisa        │
│    langsung di-copy ke form SPT di Coretax                  │
└─────────────────────────────────────────────────────────────┘
```

### CoreTax API Status

| Aspek | Status | Detail | Tag | Temporal |
|-------|--------|--------|-----|----------|
| CoreTax launch | Effective Jan 2025 | Menggantikan DJP Online sepenuhnya di 2026 | [FAKTA-T1] | [TREND] |
| API capability | ADA tapi TERBATAS | DJP sedang develop, testing API integration | [FAKTA-T1] | [TREND] |
| API untuk PJAP | ADA | e-Faktur, e-Bupot, e-Billing via API untuk PJAP | [FAKTA-T1] | [STRUCTURE] |
| Public developer API | TIDAK ADA | Tidak ada open API docs untuk developer umum | [FAKTA-T1] | [STRUCTURE] |
| H2H integration | Hanya via PJAP | Host-to-Host channel memerlukan status PJAP | [FAKTA-T3] | [STRUCTURE] |
| Interoperability | 89 entitas terhubung | Berkembang terus, tapi semua institusional | [FAKTA-T1] | [TREND] |
| Klikpajak API | ADA (public) | Postman docs tersedia, perlu client credentials | [FAKTA-T3] | [STRUCTURE] |

[INFERENSI] **CoreTax TIDAK punya public API untuk third-party developer.** Semua integrasi melalui PJAP. Ini berarti CatatOrder TIDAK BISA langsung generate kode billing atau file SPT ke CoreTax tanpa menjadi PJAP atau bermitra dengan PJAP.

### e-Billing Generation Path

| Metode | Tersedia Untuk | Complexity untuk CatatOrder | Tag |
|--------|---------------|----------------------------|-----|
| Via Coretax web (manual) | Semua WP | Nol — user buka Coretax sendiri | [FAKTA] |
| Via PJAP app (Klikpajak dll) | User PJAP | Rendah — redirect ke PJAP | [FAKTA] |
| Via Bank H2H (Mandiri dll) | Nasabah bank | Tidak relevan | [FAKTA] |
| Via Coretax API (H2H) | PJAP saja | Tinggi — perlu jadi PJAP | [FAKTA] |
| **CatatOrder approach** | **CatatOrder users** | **Sediakan data (KAP, KJS, nominal, periode), user buat billing sendiri di Coretax** | **[INFERENSI]** |

---

## E. REGULATORY REQUIREMENTS

### Apakah CatatOrder Perlu Jadi PJAP?

| Skenario | Perlu PJAP? | Alasan | Tag |
|----------|-------------|--------|-----|
| Hitung omzet + tampilkan PPh terutang | TIDAK | Ini kalkulator/simulasi, tidak terhubung ke DJP | [INFERENSI] |
| Generate rekap omzet format Coretax | TIDAK | Output file, bukan koneksi ke DJP | [INFERENSI] |
| Reminder setor + lapor | TIDAK | Notification internal | [INFERENSI] |
| Tampilkan info billing (KAP/KJS/nominal) | TIDAK | Informasi statis, user tetap buat billing sendiri | [INFERENSI] |
| Generate kode billing otomatis | YA | Butuh koneksi API ke DJP — hanya PJAP | [FAKTA-T1] |
| Submit SPT ke DJP | YA | Butuh koneksi API ke DJP — hanya PJAP | [FAKTA-T1] |
| e-Faktur H2H (upload XML langsung) | YA | Butuh koneksi API ke DJP — hanya PJAP | [FAKTA-T1] |

[INFERENSI] **CatatOrder TIDAK perlu jadi PJAP untuk MVP tax features.** Yang perlu PJAP hanya jika mau terhubung langsung ke sistem DJP. MVP bisa beroperasi sebagai "kalkulator + data preparation tool" yang output-nya user salin ke Coretax.

### Syarat Menjadi PJAP (Jika Dibutuhkan Nanti)

| Syarat | Detail | Feasibility untuk CatatOrder | Tag |
|--------|--------|------------------------------|-----|
| Badan hukum Indonesia | PT | Perlu mendirikan PT (jika belum) | [FAKTA-T1] |
| Punya NPWP | Ya | Standar | [FAKTA-T1] |
| PKP terdaftar | Ya | Perlu omzet >Rp4.8M atau daftar sukarela | [FAKTA-T1] |
| Infrastruktur IT di Indonesia | Data center + DR di Indonesia | Supabase Mumbai = TIDAK qualify → perlu migrate atau colocation | [FAKTA-T1] |
| 5 tahap seleksi | Dokumen, bisnis plan, prakualifikasi, dev plan, uji teknis | 6-12 bulan proses | [INFERENSI] |
| Total PJAP terdaftar | 14 perusahaan (2025) | Sangat eksklusif, barrier tinggi | [FAKTA-T3] |

[INFERENSI] Menjadi PJAP adalah long-term play (12-24 bulan), bukan sesuatu yang bisa dilakukan untuk MVP. Alternatif: bermitra dengan PJAP existing untuk deep integration.

---

## F. PPh FINAL UMKM 2025-2026: Regulatory Landscape

### Peraturan Terkini

| Ketentuan | Detail | Tag | Temporal |
|-----------|--------|-----|----------|
| Tarif PPh Final UMKM | 0.5% dari omzet bruto | [FAKTA-T1] | [STRUCTURE] |
| Threshold bebas pajak | Rp500 juta/tahun (kumulatif) | [FAKTA-T1] | [STRUCTURE] |
| Batas omzet UMKM | Rp4.8 miliar/tahun | [FAKTA-T1] | [STRUCTURE] |
| Perpanjangan WP OP | Hingga 2029 (dari PP 55/2022 revisi) | [FAKTA-T1] | [TREND] |
| WP Badan PT | Max 3 tahun dari terdaftar (PT 2023 → max 2026) | [FAKTA-T1] | [STRUCTURE] |
| Setelah masa habis | Wajib bookkeeping + PPh Pasal 17 (tarif normal) | [FAKTA-T1] | [STRUCTURE] |
| Jumlah WP pengguna fasilitas | 542.000 WP (2025) | [FAKTA-T1] | [TREND] |
| Anggaran pemerintah | Rp2 triliun (2025) untuk fasilitas ini | [FAKTA-T1] | [TREND] |
| Deadline setor | 15 bulan berikutnya | [FAKTA-T1] | [STRUCTURE] |
| Deadline lapor SPT Masa | 20 bulan berikutnya | [FAKTA-T1] | [STRUCTURE] |
| KAP PPh Final UMKM | 411128 | [FAKTA-T1] | [STRUCTURE] |
| KJS PPh Final UMKM | 420 | [FAKTA-T1] | [STRUCTURE] |

### Implikasi untuk CatatOrder

| Fakta Regulasi | Implikasi | Tag |
|----------------|-----------|-----|
| PPh Final diperpanjang sampai 2029 untuk WP OP | Market UMKM orang pribadi tetap pakai 0.5% minimal 3 tahun lagi | [INFERENSI] |
| WP Badan max 3 tahun | PT-PT yang terdaftar 2022-2023 akan segera keluar dari 0.5% | [INFERENSI] |
| 542.000 WP pengguna | Ini TAM untuk fitur PPh Final UMKM — bukan kecil | [INFERENSI] |
| Threshold Rp500 juta | CatatOrder perlu track akumulasi omzet YTD per user | [INFERENSI] |
| Pelaporan di Coretax | User input omzet per bulan di Coretax → CatatOrder bisa pre-fill data ini | [INFERENSI] |

### Coretax untuk UMKM

| Fitur Coretax | Detail | Tag | Temporal |
|---------------|--------|-----|----------|
| Login | coretaxdjp.pajak.go.id | [FAKTA-T1] | [STRUCTURE] |
| Pelaporan omzet bulanan | Input omzet Jan-Des, PPh otomatis terhitung | [FAKTA-T1] | [STRUCTURE] |
| Auto-calculate PPh | Sistem auto-hitung 0.5% jika >Rp500jt | [FAKTA-T1] | [STRUCTURE] |
| Billing integration | e-Billing terintegrasi dalam Coretax (bukan terpisah lagi) | [FAKTA-T1] | [TREND] |
| SPT Tahunan | Rekapitulasi omzet 12 bulan + bukti setor | [FAKTA-T1] | [STRUCTURE] |

[INFERENSI] Coretax sudah cukup capable untuk UMKM — masalahnya bukan fitur Coretax, tapi **UMKM tidak tahu berapa omzetnya** karena tidak punya pencatatan rapi. CatatOrder solve this gap: data omzet sudah tercatat → tinggal salin ke Coretax.

---

## G. REVENUE MODEL ANALYSIS

### Competitor Pricing Benchmarks

| Platform | Target | Harga/Bulan | Model | Fitur Tax | Tag | Temporal |
|----------|--------|-------------|-------|-----------|-----|----------|
| HiPajak Premium | WP OP UMKM | Rp25.000 | Subscription | Hitung, konsultasi, arsip, SPT | [FAKTA-T3] | [SNAPSHOT] |
| Klikpajak Small | PKP/Badan | Rp250.000 | Subscription | e-Faktur H2H, e-Billing, e-SPT | [FAKTA-T3] | [SNAPSHOT] |
| OnlinePajak | Badan menengah-besar | Custom (Rp300K+) | Subscription | Full compliance | [INFERENSI-T4] | [SNAPSHOT] |
| CatatOrder Bisnis | UMKM PKP | Rp99.000 | Subscription | e-Faktur XML, SPT PPN summary | [FAKTA-T1] | [SNAPSHOT] |

### WTP (Willingness to Pay) UMKM Indonesia

| Data Point | Nilai | Sumber | Tag | Temporal |
|-----------|-------|--------|-----|----------|
| Paid tier entry point POS Indonesia | Rp99.000-149.000/bulan | Pricing pages (T1) | [FAKTA] | [STRUCTURE] |
| HiPajak premium (tax tool) | Rp25.000/bulan | Kompas (T3) | [FAKTA] | [SNAPSHOT] |
| Tax compliance rate UMKM | Hanya 15% | Academic research (T2) | [FAKTA] | [TREND] |
| Jumlah WP UMKM pakai fasilitas 0.5% | 542.000 | DJP (T1) | [FAKTA] | [TREND] |
| Omzet threshold UMKM mikro | Rp2-5 juta/bulan | Multiple (T3-T4) | [INFERENSI] | [STRUCTURE] |
| Spending software sebagai % omzet | ~1-2% maximum | Multiple (T3-T4) | [INFERENSI] | [STRUCTURE] |

### Revenue Model Options untuk CatatOrder

| Model | Deskripsi | Pro | Contra | Tag |
|-------|-----------|-----|--------|-----|
| **A: Bundled (di Bisnis tier)** | Tax features masuk Rp99K/bulan Bisnis | Zero friction, natural upsell dari Unlimited | Tidak ada revenue tambahan, tapi drives Bisnis conversion | [INFERENSI] |
| **B: Add-on** | Tax module terpisah Rp25-49K/bulan | Revenue per user naik, bisa dijual cross-tier | Complexity, perceived nickel-and-diming | [INFERENSI] |
| **C: Freemium tax calculator** | Kalkulator gratis, advanced features berbayar | Acquisition tool, SEO bait, trust builder | Perlu jaga scope agar tidak cannibalize Bisnis | [INFERENSI] |
| **D: Per-report** | Rp5-10K per laporan SPT generated | Pay-as-you-go, familiar bagi UMKM | Low revenue, unpredictable, friction per transaction | [INFERENSI] |

### Rekomendasi Revenue Model

[INFERENSI] **Model A (Bundled) paling masuk akal untuk MVP.** Alasan:

1. **PPh Final calculator = retention hook** — UMKM yang pakai CatatOrder untuk track omzet+pajak TIDAK AKAN churn, karena data pajak mereka tersimpan di sana
2. **Memperkuat value proposition Bisnis tier** — dari "XML + SPT PPN" menjadi "COMPLETE tax compliance toolkit"
3. **Competitive moat** — Majoo/Moka TIDAK punya, HiPajak TIDAK punya order management
4. **Low development cost** — kalkulasi 0.5% dari data yang sudah ada = minimal effort, maximum perceived value
5. **Rp99K masih termurah** — bahkan setelah tambah PPh Final, tetap di bawah Kledo (Rp159K) dan Klikpajak (Rp250K)

Jangka panjang (post-MVP): bisa evolve ke Model B jika fitur tax makin sophisticated (e.g., PPh 21 karyawan, pembukuan untuk pasca-tarif-0.5%).

---

## H. IMPLEMENTATION SCOPE

### MVP Scope (Minimum Viable)

| Fitur | Effort | Dependency | Priority | Tag |
|-------|--------|-----------|----------|-----|
| Dashboard omzet YTD + tracking threshold Rp500jt | 2-3 hari | Query orders table | P0 | [INFERENSI] |
| Kalkulator PPh Final otomatis per bulan | 1-2 hari | Omzet data + formula 0.5% | P0 | [INFERENSI] |
| Field: status WP (OP/Badan) + tahun terdaftar | 1 hari | Migration + form update | P0 | [INFERENSI] |
| Reminder setor (15) + lapor (20) via push notification | 1 hari | Existing push infra | P1 | [INFERENSI] |
| Rekap omzet bulanan "siap copy ke Coretax" | 2-3 hari | Format sesuai input Coretax | P1 | [INFERENSI] |
| Info billing: KAP 411128, KJS 420, nominal | 0.5 hari | Display saja | P1 | [INFERENSI] |
| **TOTAL MVP** | **~7-10 hari development** | | | [INFERENSI] |

### V2 Scope (Enhanced)

| Fitur | Effort | Dependency | Priority | Tag |
|-------|--------|-----------|----------|-----|
| Export rekap omzet ke PDF (WA-shareable) | 2-3 hari | PDF generation (existing lib) | P2 | [INFERENSI] |
| Historis pajak per bulan + annual summary | 2-3 hari | New table tax_records | P2 | [INFERENSI] |
| Integrasi deep-link ke Coretax (jika tersedia) | 1-2 hari | Coretax URL scheme | P2 | [INFERENSI] |
| PPh 21 karyawan sederhana (jika ada karyawan) | 5-7 hari | New module | P3 | [INFERENSI] |
| Pembukuan sederhana (untuk pasca-tarif-0.5%) | 10-15 hari | New module | P3 | [INFERENSI] |

### V3 Scope (PJAP/Partnership)

| Fitur | Effort | Dependency | Priority | Tag |
|-------|--------|-----------|----------|-----|
| Partnership dengan PJAP untuk e-Billing API | 1-3 bulan | Business partnership + API integration | P4 | [INFERENSI] |
| Auto-generate kode billing | 2-4 minggu | PJAP API | P4 | [INFERENSI] |
| SPT submission via PJAP | 2-4 minggu | PJAP API | P4 | [INFERENSI] |
| Apply jadi PJAP sendiri | 12-24 bulan | PT, PKP, infra Indonesia, seleksi DJP | P5 | [INFERENSI] |

### Development Time Summary

| Phase | Scope | Timeline | Tag |
|-------|-------|----------|-----|
| MVP | Kalkulator + dashboard + reminder | 1-2 minggu | [INFERENSI] |
| V2 | PDF export + historis + deep-link | +2-3 minggu | [INFERENSI] |
| V3 | PJAP partnership | +3-6 bulan | [INFERENSI] |
| V4 | Become PJAP | +12-24 bulan | [SPEKULASI] |

---

## I. COMPETITIVE POSITIONING

### CatatOrder Tax Feature = Unique Intersection

```
                    ┌─────────────────────┐
                    │   ORDER MANAGEMENT  │
                    │   (CatatOrder,      │
                    │    Majoo, Moka)     │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   e-FAKTUR XML      │
                    │   (CatatOrder       │
                    │    Bisnis ONLY)     │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │  PPh FINAL UMKM     │
                    │  CALCULATOR         │◄── BELUM ADA YANG PUNYA
                    │  (dari data order)  │    di intersection ini
                    └─────────────────────┘
```

[INFERENSI] Positioning statement: **"CatatOrder = satu-satunya app yang tahu omzet kamu (dari pesanan), bisa bikin faktur pajak (XML), DAN hitung PPh UMKM kamu — semua dalam 1 platform."**

### Kompetitor Terdekat dan Jarak

| Kompetitor | Order Mgmt | e-Faktur | PPh UMKM | Jarak dari CatatOrder |
|-----------|-----------|---------|---------|----------------------|
| Majoo | YA | TIDAK | TIDAK | Jauh — perlu build 2 fitur |
| Moka | YA | TIDAK | TIDAK | Jauh — perlu build 2 fitur |
| HiPajak | TIDAK | TIDAK | YA | Jauh — perlu build order mgmt + e-Faktur |
| Klikpajak | TIDAK | YA (H2H) | Sebagian | Jauh — tidak punya order data |
| **CatatOrder + PPh MVP** | **YA** | **YA** | **YA** | **0 — monopoli di intersection** |

---

## KONTRADIKSI ANTAR SUMBER

| Topik | Sumber A (Tier) | Sumber B (Tier) | Perbedaan | Signifikansi |
|-------|----------------|----------------|-----------|-------------|
| PPh Final WP OP deadline | Beberapa sumber: "berakhir akhir 2025" (pre-extension) | DDTC/Ortax (T3): "diperpanjang sampai 2029" | Revisi PP belum final saat beberapa artikel ditulis. Extension dikonfirmasi Sep 2025 | TINGGI — perpanjangan BESAR untuk viability produk |
| HiPajak pricing | Kompas 2020 (T3): Rp25.000/bulan premium | Tidak ada sumber 2025-2026 yang konfirmasi | Bisa sudah berubah; Rp25K mungkin outdated | SEDANG — perlu verifikasi langsung |
| Jumlah PJAP | Pajakku (T3): "14 perusahaan" | DJP website tidak bisa di-extract | Angka 14 dari 1 sumber saja | SEDANG — perlu cross-check di DJP |
| Coretax API availability | DJP (T1): "sedang develop API" | Multiple (T3): "API hanya untuk PJAP" | Tidak kontradiksi — API exists tapi restricted access | RENDAH — konsisten |
| Threshold Rp500jt calculation | Beberapa: "omzet di atas 500jt yang kena" | Lain: "seluruh omzet kena jika total >500jt" | Sesuai PP 55/2022: yang KENA hanya bagian di atas Rp500jt | TINGGI — salah hitung = error di product |

---

## APA YANG TIDAK KITA KETAHUI

1. **Berapa UMKM CatatOrder yang sudah PKP vs non-PKP, dan berapa yang pakai PPh Final 0.5%** — Ini data internal yang belum di-track. Tanpa ini, sulit estimate demand. Ditemukan via: [STRUCTURAL NECESSITY] — jika CatatOrder punya fitur NPWP, data ini seharusnya bisa di-query.

2. **Berapa WTP aktual UMKM untuk fitur tax calculator tambahan** — Tidak ada survei primer. HiPajak di Rp25K/bulan adalah proxy terbaik, tapi HiPajak = pure tax tool vs CatatOrder = bundled. Ditemukan via: [CUI BONO] — HiPajak/Klikpajak tidak publish conversion rate mereka.

3. **Apakah Coretax akan membuka public API** — DJP belum mengumumkan roadmap API publik. Jika dibuka, barrier untuk integrasi langsung akan turun drastis. Jika tidak, PJAP tetap satu-satunya jalan. Ditemukan via: [ADJACENT SILENCE] — banyak bicara tentang Coretax features, sangat sedikit tentang third-party developer access.

4. **Detail teknis format input omzet di Coretax** — Untuk membuat "rekap siap copy ke Coretax", perlu tahu exact format yang Coretax expect (field names, data types, input sequence). Belum ada dokumentasi publik tentang ini. Ditemukan via: [STRUCTURAL NECESSITY] — jika CatatOrder mau pre-fill, harus tahu format.

5. **Retention impact dari tax features di ordering apps** — Tidak ada data dari kompetitor manapun tentang churn reduction setelah menambah tax features. Ini karena belum ada ordering app yang punya tax features, jadi data inherently tidak ada. Ditemukan via: [INVERSION] — klaim "tax feature meningkatkan retention" belum pernah dibuktikan di ordering app context.

6. **Proses dan timeline realistis PJAP application** — Angka "12-24 bulan" adalah estimasi, bukan data. Tidak ada PJAP yang mempublikasi timeline application mereka. Ditemukan via: [CUI BONO] — PJAP incumbent tidak mau barrier terlihat rendah.

7. **Proporsi UMKM yang benar-benar menghitung dan membayar PPh Final sendiri vs lewat konsultan** — Jika mayoritas lewat konsultan, maka fitur ini kurang berguna. Jika mayoritas self-file di Coretax, maka sangat berguna. Ditemukan via: [STRUCTURAL NECESSITY] — dari 542K WP, breakdown cara filing HARUS ada tapi tidak dipublikasi.

---

## SUMBER

### T1 (Data Primer / Statistik Resmi)
- [DJP - PJAP Index](https://www.pajak.go.id/en/index-pjap) — Tier T1
- [DJP - Coretax](https://www.pajak.go.id/en/core-system-tax-administration) — Tier T1
- [DJP - PPh Final UMKM](https://www.pajak.go.id/en/node/113050) — Tier T1
- [Kemenkeu Media Keuangan - Coretax UMKM](https://mediakeuangan.kemenkeu.go.id/article/show/umkm-wajib-tahu-coretax-permudah-laporan-pajak-umkm-melalui-fitur-ini) — Tier T1
- [DJP - Pembayaran 2025](https://www.pajak.go.id/en/node/113240) — Tier T1
- [Square Support - 1099-K](https://squareup.com/help/us/en/article/5048-1099-k-overview) — Tier T1
- [Square Support - Tax Reports](https://squareup.com/help/us/en/article/8360-view-tax-fee-and-service-charge-reports) — Tier T1
- [Toast - Tax Rate Setup](https://central.toasttab.com/s/article/Setting-Up-Tax-Rates-and-Adjusting-Tax-Options) — Tier T1
- [Toast - Smart Tax](https://doc.toasttab.com/doc/platformguide/adminSmartTax.html) — Tier T1
- [QuickBooks - Self-Employed Tax](https://quickbooks.intuit.com/self-employed/tax/) — Tier T1
- [Xero - Auto Sales Tax](https://www.xero.com/us/accounting-software/calculate-sales-tax/) — Tier T1
- [Majoo - Pengaturan Pajak](https://majoo.id/panduan-pengguna/detail/325) — Tier T1
- [Majoo - Laporan Pajak](https://majoo.id/panduan-pengguna/detail/202) — Tier T1
- CatatOrder CLAUDE.md + DB migrations — Tier T1 (data primer internal)

### T2 (Riset Institusional)
- [World Bank - Behavioral Insights SME Tax Indonesia](https://documents1.worldbank.org/curated/en/448871615957692506/pdf/) — Tier T2
- [Academic Paper - Tax Compliance Indonesian MSMEs](https://e-journal.umc.ac.id/index.php/JPK/article/view/5519) — Tier T2

### T3 (Jurnalisme / Analisis Berkualitas)
- [DDTC - PPh Final UMKM Diperpanjang 2029](https://news.ddtc.co.id/berita/nasional/1813716/khusus-orang-pribadi-pph-final-umkm-diperpanjang-hingga-2029) — Tier T3
- [DDTC - PJAP Update 2025](https://news.ddtc.co.id/literasi/kamus/1813835/update-2025-apa-itu-penyedia-jasa-aplikasi-perpajakan-pjap) — Tier T3
- [DDTC - CoreTax API](https://news.ddtc.co.id/berita/nasional/1795036/pakai-api-djp-hubungkan-coretax-dengan-entitas-luar-kemenkeu) — Tier T3
- [Klikpajak - Panduan Pajak UMKM](https://klikpajak.id/blog/pajak-umkm-tarif-cara-hitung-bayar-dan-lapor-spt-pajaknya/) — Tier T3
- [Klikpajak - Harga](https://klikpajak.id/harga/) — Tier T3
- [MUC Consulting - PPh Final Extended 2029](https://muc.co.id/en/article/extended-final-income-tax-for-individual-msme-taxpayers-valid-until-2029) — Tier T3
- [Ortax - Perpanjangan PPh UMKM](https://ortax.org/pemerintah-perpanjang-jangka-waktu-pph-umkm-orang-pribadi-sampai-2029) — Tier T3
- [Pajakku - Daftar PJAP 2025](https://artikel.pajakku.com/daftar-lengkap-pjap-tahun-2025) — Tier T3
- [Kompas - HiPajak Launch](https://money.kompas.com/read/2020/01/30/071500326/permudah-freelancer-dan-umkm-payar-pajak-startup-ini-luncurkan-aplikasi) — Tier T3
- [VATupdate - Indonesia Coretax Full Enforcement](https://www.vatupdate.com/2025/12/15/indonesias-coretax-system-full-e-invoicing-enforcement-by-dec-31/) — Tier T3
- [DavoSalesTax - Toast Tax](https://www.davosalestax.com/how-do-restaurants-pay-sales-tax-with-toast-pos/) — Tier T3
- [Alvarez & Marsal - Coretax PER-8 PER-11](https://www.alvarezandmarsal.com/thought-leadership/coretax-regulation-update-per-8-pj-2025-and-per-11-pj-2025) — Tier T3

### T4-T5 (Laporan Industri / Analisis Individual)
- [GetApp - Klikpajak Review](https://www.getapp.com/finance-accounting-software/a/klikpajak/) — Tier T4
- [LinkmyBooks - Square Tax](https://linkmybooks.com/blog/square-tax-forms) — Tier T4
- [Pajak Startup - PJAP](https://pajakstartup.com/2023/10/24/mengenal-pjap-penyedia-jasa-aplikasi-perpajakan/) — Tier T4
- [Tax Academy - PPh Final 2026](https://taxacademy.id/tarif-pph-final-05-umkm-berakhir-di-akhir-2025-strategi-pajak-untuk-2026/) — Tier T4
