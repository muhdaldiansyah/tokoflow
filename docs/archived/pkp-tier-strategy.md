# CatatOrder — Strategi Tier PKP (Bisnis) v2

> Dari ~1MB reality capture (7 captures) + PKP deep dive validation: satu platform, dua segmen, dua revenue model.

**Tanggal:** 2026-03-15 (v2 — revised after PKP deep dive)
**Basis:** 7 reality captures + PKP tier deep dive (4 area riset) + analisis fitur CatatOrder v3.3.0
**Perubahan dari v1:** Market sizing dikoreksi (-63%), pricing direvisi, Ayoconnect dieliminasi, build sequence diperbarui

---

## 1. MASALAH YANG DI-SOLVE

### CatatOrder Sekarang — Kuat tapi ARPU Rendah

CatatOrder sudah tepat untuk UMKM mikro (katering, bakery, frozen food). WA-first, sederhana, Rp15K/50 order. Tidak ada kompetitor langsung di space "WA order management."

Tapi dari riset, ada mismatch:

| Aspek | CatatOrder Sekarang | Sweet Spot Riset |
|-------|--------------------|-----------------|
| User | UMKM mikro, non-PKP | UMKM kecil B2B, PKP |
| Omzet user | Rp 1-5 juta/bulan | Rp 400 juta+/bulan |
| Masalah | Pesanan tercecer di WA | e-Faktur compliance (mandatory) |
| Forcing function | Tidak ada | Coretax (denda 1% DPP jika tidak comply) |
| Revenue model | Per-order credit (Rp15K/50) | Per-transaction compliance |
| ARPU | Rp 30-39K/bulan | Rp 99-200K/bulan |

### Solusi: Serve Keduanya

```
Tier existing → tetap serve mikro non-PKP (katering, bakery)
Tier baru "Bisnis (PKP)" → serve UMKM kecil B2B yang butuh compliance

Satu platform. Satu codebase. Dua segmen. Dua revenue model.
```

---

## 2. MARKET SIZING (REVISED — Deep Dive Validated)

### PKP Market Funnel

| Level | Jumlah | Sumber | Tag |
|-------|--------|--------|-----|
| PKP Terdaftar Total | 735.838 | DJP Nov 2025 (T1) | [FAKTA] |
| **PKP Aktif Terbitkan Faktur** | **~273.555 (37%)** | DJP Feb 2025 (T1) | [FAKTA] |
| PKP Kecil (omzet Rp4,8-50M) | ~200.000-350.000 | Estimasi | [SPEKULASI] |
| PKP Kecil yang AKTIF | ~74.000-130.000 | 37% dari estimasi | [SPEKULASI] |
| PKP Kecil B2B via WA | ~35.000-63.000 | Estimasi ~70% B2B × ~70% WA | [SPEKULASI] |
| Willing to pay Rp99K | ~7.000-12.600 | Estimasi 20% WTP | [SPEKULASI] |

**KOREKSI PENTING:** 63% PKP "idle"/zombie — tidak terbitkan faktur. Addressable market = ~274K, BUKAN 735K.

### TAM-SAM-SOM Revised

| Tier | Jumlah | Revenue Potensial |
|------|--------|-------------------|
| TAM | ~274.000 (PKP aktif) | ~Rp68B/tahun |
| SAM | ~50.000-90.000 (PKP kecil B2B via WA) | ~Rp12.5B/tahun |
| **SOM (target 2 tahun)** | **500-2.000 user** | **Rp600M-Rp2.4B ARR** |

**Sweet spot target: PKP BARU (~61K/tahun)** — mereka belum punya workflow, butuh solusi dari nol. Lebih mudah di-acquire daripada steal dari existing tool.

---

## 3. PRICING STRUCTURE (REVISED)

### Competitive Landscape (Data Aktual dari Deep Dive)

| Tool | Harga/bulan | Free Tier | e-Faktur | Invoice | Order Mgmt | WA |
|------|------------|-----------|----------|---------|-----------|-----|
| Coretax DJP | GRATIS | Unlimited | Ya | Tidak | Tidak | Tidak |
| e-Faktur Desktop | GRATIS | Unlimited | Ya | Tidak | Tidak | Tidak |
| Pajak.io | Rp250K+ | 50 faktur/bln | Ya | Tidak | Tidak | Tidak |
| Klikpajak | Rp250K+ | 50 faktur/bln | Ya | Tidak | Tidak | Tidak |
| OnlinePajak | Rp5K/trx | 10 trx gratis | Ya | Ya | Tidak | Tidak |
| Paper.id | Rp90-100K | Unlimited inv | Tidak | Ya | Tidak | Tidak |
| Kledo | Rp160K+ | 1000 inv/bln | Terbatas | Ya | Tidak | Tidak |
| **CatatOrder Bisnis** | **Rp99K** | **50 order/bln** | **Ya (export)** | **Ya** | **Ya** | **Ya** |

**Gap CONFIRMED:** Sweet spot Rp100-250K untuk combined invoicing + e-Faktur + WA = KOSONG. Tidak ada player di posisi ini.

### Pricing Tiers (Revised)

```
GRATIS              Rp 0          50 order/bulan, semua fitur dasar
ISI ULANG 50        Rp 15.000     +50 order
ISI ULANG 100       Rp 25.000     +100 order
UNLIMITED           Rp 39.000     Order unlimited/bulan
──────────────────────────────────────────────────────────────
BISNIS (PKP)        Rp 99.000     Semua fitur Unlimited, ditambah:
                    /bulan
                                  + Invoice formal (A4, nomor urut, jatuh tempo)
                                  + Field PPN 11% otomatis
                                  + NPWP penjual + pembeli
                                  + e-Faktur XML export (50/bulan GRATIS)
                                  + e-Faktur XML export >50: Rp 1.000/faktur
                                  + Piutang dashboard per pelanggan
                                  + Reminder overdue otomatis via WA
                                  + Laporan pajak bulanan
                                  + Profit per produk (HPP tracking)
                                  + Export untuk konsultan pajak

ADD-ONS (di atas tier Bisnis):
  e-Faktur Auto     Rp 2.000-3.000/faktur
  (via PJAP)        Submit langsung ke Coretax, tidak perlu login manual

  Auto-Recon        Rp 49.000-79.000/bulan
                    Cek mutasi bank otomatis, match dengan invoice
                    ATAU: user self-connect Moota (biaya di user)
```

### ARPU Scenarios (Revised — Lebih Realistis)

| Skenario | Subscription | e-Faktur | Recon | Total ARPU |
|----------|-------------|----------|-------|------------|
| Bisnis basic (50 XML gratis) | Rp99K | Rp0 | Rp0 | **Rp99K** |
| Bisnis aktif (80 XML export) | Rp99K | Rp30K | Rp0 | **Rp129K** |
| Bisnis premium (PJAP + recon) | Rp99K | Rp100K | Rp49K | **Rp248K** |

**Blended ARPU realistis awal: Rp99-150K** (mayoritas di tier basic). Bukan Rp249K seperti asumsi v1.

---

## 4. UNIT ECONOMICS (REVISED)

### Cost per User

| Komponen | Fase 1 | Fase 2 | Fase 3 | Fase 4B |
|----------|--------|--------|--------|---------|
| Supabase | Rp5K | Rp5K | Rp5K | Rp5K |
| WA Cloud API | Rp10K | Rp15K | Rp20K | Rp20K |
| XML compute | - | Rp1K | Rp1K | Rp1K |
| PJAP API | - | - | Rp50-100K | Rp50-100K |
| Moota (jika bundle) | - | - | - | Rp45K |
| **Total COGS** | **Rp15K** | **Rp21K** | **Rp76-126K** | **Rp121-171K** |

### Margin per Fase

| Fase | ARPU | COGS | Gross Margin |
|------|------|------|-------------|
| **Fase 1 (invoice only)** | **Rp99K** | **Rp15K** | **Rp84K (85%)** |
| Fase 2 (+ XML export) | Rp129K | Rp21K | Rp108K (84%) |
| Fase 3 (+ PJAP) | Rp200K | Rp76-126K | Rp74-124K (37-62%) |
| Fase 4B (+ Moota, user self-connect) | Rp248K | Rp76-126K | Rp122-172K (49-69%) |

**Fase 1-2 margin TERBAIK (84-85%).** Bisa sustain lama sebelum masuk Fase 3 yang margin lebih tipis.

### Breakeven

| Skenario | Fixed Cost/Bulan | Margin/User | Users Needed |
|----------|-----------------|-------------|-------------|
| Solo dev, Fase 1 | Rp3M | Rp84K | **36 users** |
| Solo dev, Fase 2 | Rp3M | Rp108K | **28 users** |
| + 1 contractor, Fase 3 | Rp8M | Rp74-124K | **65-110 users** |

**Breakeven sangat rendah.** 36 user Bisnis = sudah menutup biaya. Risiko finansial minimal.

---

## 5. BUILD SEQUENCE (REVISED)

### Fase 1: Invoice Formal (Minggu 1-2) — LAUNCH TIER BISNIS

Build dari fondasi yang sudah ada di CatatOrder:
- Kolom `tax` di DB receipts → activate, isi 11% PPN
- Kolom `cost_price` di DB products → wire ke rekap, hitung profit
- jsPDF → tambah template A4 formal (selain thermal)
- Piutang aging di monthly report → expose sebagai dashboard

**Yang perlu BUILD BARU:**
- Tabel `invoices` (extend dari orders)
- Nomor invoice urut (INV-YYYY-XXXX)
- Field: NPWP penjual + pembeli, NITKU, jatuh tempo (NET 7/14/30)
- Auto-generate invoice dari order data
- Filter pelanggan "Belum Lunas"

**VALUE PROP:** "Buat invoice formal dari pesanan WA — 1 klik. Dengan PPN otomatis."

### Fase 2: e-Faktur XML Export (Minggu 3-6) — KOREKSI: XML bukan CSV

**PERUBAHAN dari v1:** Coretax hanya terima XML. DJP sediakan 31 template + converter gratis.

**Build:**
- Generate file XML sesuai format template DJP
- Field mapping: order data → field wajib faktur pajak (NPWP, NITKU, kode transaksi 01-10, kode objek pajak, DPP, PPN)
- Kode transaksi selector (mayoritas pakai 01)
- Batch export (max 1.000 faktur per file, recommended 500)
- Panduan step-by-step upload XML ke Coretax
- Reminder overdue via WA
- Laporan PPN bulanan

**Risiko legal: RENDAH** — software non-PJAP generate XML untuk user upload sendiri = legal. Accurate, Jurnal sudah lakukan ini. [FAKTA]

**50 XML export/bulan GRATIS** (match competitor Klikpajak/Pajak.io yang gratis 50). Di atas 50 = Rp1.000/faktur.

### Fase 3: PJAP Partnership (Bulan 2-4)

**Target #1: Pajak.io** [INFERENSI]
- API sudah documented (OpenAPI)
- Backed by Telkom/IndiBiz (stabil)
- Bukan direct competitor
- Free tier 50 faktur/bulan

**Alternatif:** Klikpajak (API public, tapi bagian Mekari = potential competitor), OnlinePajak (API via readme.io), Pajakku (e-Met SFTP)

**Model partnership:**
1. API Partner — CatatOrder call PJAP API, bayar per call
2. Reseller — pakai infra PJAP, branding CatatOrder
3. Referral — arahkan user ke PJAP, dapat komisi

**Charge user: Rp2.000-3.000/faktur** (cover PJAP fee + margin). OnlinePajak charge Rp5K — CatatOrder undercut.

### Fase 4A: Manual Reconciliation Assist (Bulan 3-5) — BARU

**TANPA integrasi bank API. TANPA biaya external.**
- User screenshot/export mutasi dari mobile banking
- CatatOrder AI parse dan suggest match dengan invoice pending
- 1 tap confirm match → otomatis "Lunas"
- Biaya: Rp0 (compute only, Gemini Flash ~Rp5/parse)

**Ini MVP reconciliation yang GRATIS untuk CatatOrder.** Test apakah user peduli sebelum invest di Moota/Brick.

### Fase 4B: Moota/MesinOtomatis Webhook (Bulan 5+)

**KOREKSI dari v1:** Ayoconnect DIELIMINASI (bukan account aggregator). Opsi yang tersisa:

| Provider | Biaya/bulan/akun | Bank Support | Model |
|----------|-----------------|-------------|-------|
| MesinOtomatis | Rp27K (BCA Individual) | BCA, BRI, Mandiri, BNI | Screen scraping |
| Moota | Rp45K | 7 bank + e-wallet | Screen scraping |
| Mutasibank | Rp60-105K | BCA, BRI, Mandiri | Screen scraping |
| Brick | Unknown (contact sales) | 140+ institusi | API (OAuth) |

**Model: user self-subscribe Moota + connect webhook ke CatatOrder.**
- User bayar Moota langsung (Rp45K/bulan)
- CatatOrder terima webhook mutasi, auto-match invoice
- CatatOrder cost: Rp0 (webhook gratis)

**ATAU: CatatOrder bundle sebagai add-on Rp49-79K/bulan** (include Moota cost + margin).

**Legal caveat:** OJK Regulation 4/2025 mengatur aggregator keuangan, modal min Rp500M. Status Moota/MesinOtomatis di bawah regulasi ini = blind spot. Perlu konsultasi hukum sebelum deep integration.

### Timeline Visual (Revised)

```
Minggu 1-2      Minggu 3-6       Bulan 2-4        Bulan 3-5        Bulan 5+
──────────      ──────────       ─────────        ─────────        ────────
FASE 1          FASE 2           FASE 3           FASE 4A          FASE 4B
Invoice         e-Faktur         PJAP             Manual           Moota
Formal          XML Export       Partnership      Recon Assist     Webhook

Rp99K/bln       +50 gratis       +Rp2-3K/faktur   Gratis           Add-on
                >50: Rp1K/fkt    (auto-submit)    (AI parse)       Rp49-79K

ARPU: Rp99K     ARPU: ~Rp129K    ARPU: ~Rp200K    ARPU: ~Rp200K    ARPU: ~Rp250K+
Margin: 85%     Margin: 84%      Margin: 37-62%   Margin: 37-62%   Margin: 49-69%

LAUNCH          UPGRADE          UPGRADE           UPGRADE          UPGRADE
TIER BISNIS
```

---

## 6. RISIKO & MITIGASI (REVISED)

| Risiko | Severity | Data | Mitigasi |
|--------|----------|------|---------|
| **63% PKP idle — market lebih kecil** | TINGGI | 273K aktif dari 735K (DJP T1) | Target 274K base. Focus PKP BARU 61K/tahun |
| **Window Coretax menyempit** | TINGGI | DJP sudah perbaiki 18/22 kendala | Launch Fase 1 SEGERA. Long-term value = "integrated workflow" bukan "Coretax jelek" |
| **WA B2B order BELUM tervalidasi** | TINGGI | 87% preferensi WA (Meta T2), tapi TIDAK ADA data spesifik B2B formal | CRITICAL PATH: wawancara 20-30 PKP kecil |
| **ClearTax India turun 46%** | MEDIUM | Revenue $19.8M→$10.7M, karyawan 1.270→97 | Jangan all-in tax compliance. Core = WA order+invoice. e-Faktur = value-add |
| **Free tier competitor** | MEDIUM | Klikpajak/Pajak.io 50 gratis, DJP gratis unlimited | Differentiate di WA + order flow, bukan di jumlah faktur |
| **PJAP partnership gagal** | MEDIUM | 4 PJAP punya public API | Fase 2 (XML export) tetap bernilai tanpa PJAP |
| **Screen scraping legal risk** | MEDIUM | POJK 4/2025 mengatur aggregator | Fase 4A (manual AI parse) = zero legal risk. Moota integration = perlu legal review |
| **Mekari + Money Forward** | MEDIUM | Series E $50M dari Money Forward | Mekari di Rp399K+ = beda segmen. Tapi monitor roadmap |

---

## 7. VALIDASI SEBELUM BUILD (CRITICAL PATH)

### Wajib Selesai Dalam 2 Minggu

| # | Pertanyaan | Cara | Waktu |
|---|-----------|------|-------|
| 1 | **PKP kecil terima order via WA?** | Wawancara 20-30 PKP kecil (supplier, konveksi, grosir) | 1-2 minggu |
| 2 | **Bagaimana mereka buat invoice hari ini?** | Tanya di wawancara sama | - |
| 3 | **Mau bayar Rp99K/bulan?** | Tanya langsung | - |
| 4 | **Coretax masih bermasalah?** | Coba sendiri — daftar, buat e-Faktur | 1-2 hari |
| 5 | **Ada user CatatOrder sekarang yang PKP?** | Cek data user | 1 hari |

### Decision Tree

```
Wawancara 20-30 PKP kecil B2B (2 minggu)
│
├── "Terima order via WA?" >50% YA
│   ├── "Mau bayar Rp99K?" >30% YA
│   │   └── ✅ BUILD Fase 1 (Invoice Formal, 2 minggu)
│   │       └── Launch tier Bisnis
│   │           └── 50 user dalam 3 bulan?
│   │               ├── YA → Fase 2 (XML export)
│   │               └── TIDAK → Analyze churn, adjust
│   └── "Mau bayar Rp99K?" <30%
│       └── Test Rp49K atau freemium model
│
├── "Terima order via WA?" <50%
│   └── "Via apa?"
│       ├── Email → Build email-to-invoice parser
│       ├── Telepon → Build manual input form cepat
│       └── Campuran → Build multi-input method
│
└── "Pain point terbesar?"
    ├── e-Faktur compliance → Prioritize Fase 2
    ├── Invoice/penagihan → Prioritize Fase 1
    └── Payment tracking → Prioritize piutang dashboard
```

---

## 8. HUBUNGAN DENGAN USER MIKRO SEKARANG

### Tidak Mengganggu

```
USER MIKRO (katering, bakery):
  Gratis / Isi Ulang / Unlimited → TIDAK BERUBAH
  Tidak perlu invoice formal, tidak PKP, tidak butuh e-Faktur

USER PKP (supplier, konveksi, grosir):
  Tier Bisnis Rp99K → FITUR BARU khusus mereka
  Invoice formal, PPN, e-Faktur, piutang dashboard
```

### Grow-with-Customer

```
Hari ini:   Katering rumahan, 30 order/bulan → GRATIS
6 bulan:    Makin rame, 100 order/bulan → ISI ULANG Rp15K
1 tahun:    Terima pesanan corporate, 200 order/bulan → UNLIMITED Rp39K
2 tahun:    Klien minta faktur pajak, daftar PKP → BISNIS Rp99K
```

---

## 9. ClearTax WARNING — Kenapa Tidak Boleh All-In Tax

[FAKTA] ClearTax India: $140M funding → revenue turun 46% → karyawan turun 92%. Tax compliance SaaS BUKAN guaranteed win.

**Implikasi untuk CatatOrder:**
1. Core value HARUS tetap = WA order management + invoicing (yang pemerintah TIDAK akan buat)
2. e-Faktur = value-add yang meningkatkan stickiness, BUKAN core product
3. Jika Coretax diperbaiki total, CatatOrder tetap bernilai karena ORDER + INVOICE + WA (Coretax tidak punya ini)
4. Jangan over-invest di fitur yang bisa digratiskan pemerintah

---

## 10. RINGKASAN 1 HALAMAN (REVISED)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  APA:  Tier "Bisnis (PKP)" di CatatOrder — Rp99K/bulan           │
│        + e-Faktur XML export (50 gratis, >50 = Rp1K/faktur)      │
│        + Auto PJAP (Rp2-3K/faktur, add-on)                       │
│        + Auto-Recon (Rp49-79K/bulan, add-on)                     │
│                                                                   │
│  SIAPA:  PKP kecil B2B via WA                                     │
│        Market aktif: ~274K PKP (BUKAN 735K — 63% idle)            │
│        Target: PKP BARU ~61K/tahun (belum punya workflow)         │
│        SOM realistis: 500-2.000 user                              │
│                                                                   │
│  MASALAH:  WA order → manual Excel → manual Coretax XML           │
│        → manual cek mutasi → manual rekap pajak = 2-4 jam/hari    │
│                                                                   │
│  SOLUSI:  Order WA → auto-invoice A4 → export XML Coretax (1 klik)│
│        → kirim via WA → track pembayaran → rekap pajak otomatis   │
│                                                                   │
│  UNIT ECONOMICS (Fase 1):                                         │
│  ARPU: Rp99K | COGS: Rp15K | Margin: 85% | Breakeven: 36 users  │
│                                                                   │
│  BUILD:                                                           │
│  Fase 1 (2 mgg): Invoice formal → LAUNCH                         │
│  Fase 2 (mgg 3-6): e-Faktur XML export                           │
│  Fase 3 (bln 2-4): PJAP partner (target: Pajak.io)               │
│  Fase 4A (bln 3-5): Manual recon assist (AI parse, Rp0 cost)     │
│  Fase 4B (bln 5+): Moota webhook (add-on)                        │
│                                                                   │
│  RISIKO UTAMA:                                                    │
│  1. 63% PKP idle — market lebih kecil dari headline               │
│  2. Window Coretax menyempit (18/22 kendala sudah fixed)          │
│  3. WA B2B order BELUM TERVALIDASI (critical path)                │
│  4. ClearTax India -46% — tax SaaS bisa gagal                    │
│                                                                   │
│  SEBELUM BUILD (WAJIB — 2 minggu):                                │
│  Wawancara 20-30 PKP kecil B2B:                                  │
│  → Terima order via WA? Mau bayar Rp99K? Pain point apa?          │
│                                                                   │
│  AVOID:                                                           │
│  ✗ All-in tax compliance (ClearTax warning)                       │
│  ✗ Target semua 735K PKP (hanya 274K aktif)                       │
│  ✗ Include auto-recon di Rp99K (unit economics tidak masuk)       │
│  ✗ Free product tanpa revenue (BukuKas trap)                      │
│  ✗ Head-on compete Mekari (underserve their segment)              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**v2 changes from v1:**
- Market sizing: 735K → 274K PKP aktif (-63%)
- Denda: Rp500K flat → 1% DPP (variable)
- Format: CSV → XML (DJP template tersedia)
- Ayoconnect: DIELIMINASI (bukan aggregator)
- Auto-recon: include → ADD-ON (unit economics tidak masuk)
- e-Faktur pricing: Rp3-5K → 50 gratis + Rp1K/faktur (match competitor free tier)
- ARPU: Rp249K → Rp99-150K realistis awal
- Fase 4A BARU: manual recon assist (AI parse, zero cost)
- PJAP target: generic → Pajak.io (API ready, backed Telkom)
- ClearTax WARNING ditambahkan
- Breakeven: 36 users (sangat rendah)

**Source captures:**
- `/reality/20260315-global-money-flow/` (188KB)
- `/reality/20260315-global-saas-landscape/` (173KB)
- `/reality/20260315-indonesia-money-flow/` (184KB)
- `/reality/20260315-indonesia-saas-landscape/` (132KB)
- `/reality/20260315-gap-analysis/` (46KB)
- `/reality/20260315-sweet-spot-deep-dive/` (160KB)
- `/reality/20260315-pkp-tier-deep-dive/` (180KB)
