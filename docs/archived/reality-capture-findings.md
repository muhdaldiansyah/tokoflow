# CatatOrder — Reality Capture Findings

> Temuan dari 6 langkah reality capture (~883KB data) untuk menentukan posisi strategis CatatOrder di peta aliran uang global dan Indonesia.

**Tanggal:** 2026-03-15
**Sumber:** 6 reality captures di `/reality/` — Global Money Flow, Global SaaS Landscape, Indonesia Money Flow, Indonesia SaaS Landscape, Gap Analysis, Sweet Spot Deep Dive

---

## DAFTAR ISI

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Konteks Makro: Di Mana Uang Mengalir](#2-konteks-makro)
3. [Landscape SaaS: Apa yang Sudah Ada](#3-landscape-saas)
4. [Gap Analysis: Di Mana Peluang](#4-gap-analysis)
5. [Sweet Spot Terkuat: Invoice + e-Faktur Compliance](#5-sweet-spot-terkuat)
6. [Convergence Map: Posisi CatatOrder](#6-convergence-map)
7. [Competitive Landscape Detail](#7-competitive-landscape)
8. [Model Monetisasi Berdasarkan Data](#8-model-monetisasi)
9. [Anti-Pattern: Apa yang Harus Dihindari](#9-anti-pattern)
10. [Global Comparables: Pelajaran dari Dunia](#10-global-comparables)
11. [Remaining Unknowns: Apa yang Harus Divalidasi](#11-remaining-unknowns)
12. [Meta-Assessment: Di Mana Peta Ini Lemah](#12-meta-assessment)

---

## 1. RINGKASAN EKSEKUTIF

### Dari 883KB Data ke 1 Halaman

CatatOrder duduk di posisi paling hulu dari **Post-Payment Stack** — convergence point terkuat yang ditemukan dari analisis 6 langkah reality capture.

**Entry point terkuat:** Invoice + e-Faktur Compliance

**Kenapa:**
- 735.838 PKP (Pengusaha Kena Pajak), growing 9%/tahun = CAPTIVE MARKET [FAKTA]
- Coretax mandatory + bermasalah = DEMAND SEKARANG [FAKTA]
- Per-transaction model = PROVEN (OnlinePajak Rp5K/trx, Bill.com 73% revenue dari fee) [FAKTA]
- Conta Azul (Brazil, $300M exit) = GLOBAL PROOF untuk SME compliance SaaS [FAKTA]
- Mega-gap: micro PKP underserved — Paper.id gratis tapi tanpa e-Faktur, OnlinePajak/Mekari terlalu mahal [INFERENSI]

**Natural expansion:**
```
CatatOrder (order) → Invoice → e-Faktur → Payment Tracking
    → Reconciliation → Basic Accounting → Tax Filing
```

**Monetisasi:**
```
Free core (invoice + order) + Rp 3-5K/e-Faktur + 1-2% payment + Rp 99-199K/mo premium
```

**Moat:**
CatatOrder upstream data + WhatsApp UX + affordable compliance + vertical specialization

---

## 2. KONTEKS MAKRO: DI MANA UANG MENGALIR

### 2.1 Global — Aliran Uang Dunia

Dari capture Global Money Flow ($33T trade, $150T+ payments, $905B remitansi), hanya 3 cluster yang relevan untuk SaaS — yaitu flow yang MELEWATI PROSES YANG BISA DISOFTWAREKAN:

| Cluster | Volume Global | Relevansi untuk CatatOrder |
|---------|--------------|---------------------------|
| Trade & Supply Chain | $33T/tahun | **LANGSUNG** — CatatOrder = order management, duduk di rantai trade |
| Payments & Remittances | $150T + $905B | **PARSIAL** — payment tracking setelah order = extension natural |
| Compliance & Tax | $492B tax loss, $275B AML spend | **LANGSUNG** — e-Faktur, pajak UMKM = forcing function terbesar |

### 2.2 Indonesia — Di Mana Uang UMKM Mengalir

| Metrik | Nilai | Sumber | Tag |
|--------|-------|--------|-----|
| Jumlah UMKM | 66 juta (95% mikro) | BPS (T1) | [FOUNDATION] |
| Omzet total UMKM | Rp 8.574-9.500 triliun | Kemenkopukm (T1) | [STRUCTURE] |
| Kontribusi UMKM ke GDP | 61% | Kemenkopukm (T1) | [STRUCTURE] |
| UMKM yang pakai SaaS operasional | <2% | Estimasi dari multiple sources | [INFERENSI] |
| UMKM yang catat keuangan manual | 77% | OCBC-NielsenIQ 2024 (T2) | [TREND] |
| UMKM yang punya laporan keuangan | 22.5% | Bank Indonesia (T1) | [TREND] |
| QRIS merchant | 38-42 juta (90% UMKM) | BI (T1) | [TREND] |
| QRIS growth YoY | +175% | BI (T1) | [SNAPSHOT] |
| Credit gap UMKM | Rp 2.400 triliun ($234B) | IFC/World Bank (T1) | [STRUCTURE] |
| Tax gap | Rp 944 triliun | Kemenkeu (T1) | [STRUCTURE] |
| UMKM yang bayar pajak | ~3% | World Bank (T1) | [STRUCTURE] |
| Konsumsi rumah tangga | Rp 12.000 triliun (54-55% GDP) | BPS (T1) | [STRUCTURE] |
| E-commerce GMV | Rp 900 triliun | BI (T1) | [TREND] |
| Kelas menengah | Menyusut -9.48M orang (2019-2024) | BPS (T1) | [TREND] |

### 2.3 Temuan Kritis untuk CatatOrder

1. **58% UMKM terima payment digital (QRIS), tapi <2% pakai SaaS operasional.** [FAKTA] Gap ini = peluang terbesar. Payment infrastructure sudah siap, tapi post-payment (reconciliation, invoicing, accounting) = dark zone.

2. **Kelas menengah menyusut -9.48M orang.** [FAKTA] Ini berarti spending power konsumen UMKM bisa tertekan. Pricing harus super affordable.

3. **77% UMKM masih catat keuangan manual.** [FAKTA] Ini BUKAN karena kurang tech — 97.4% punya smartphone. Ini karena tool yang ada terlalu mahal atau terlalu rumit. CatatOrder positioning (sederhana + murah) sudah benar.

4. **Credit gap Rp2.400T** bukan karena bank tidak mau pinjam — tapi karena **UMKM tidak punya data untuk buktikan kelayakan kredit.** [INFERENSI] CatatOrder yang mendigitalisasi order → invoice → payment = menghasilkan DATA yang bisa menjadi dasar credit scoring. Ini moat jangka panjang.

---

## 3. LANDSCAPE SAAS: APA YANG SUDAH ADA

### 3.1 Global SaaS yang Melayani Money Flows

| Cluster | Global SaaS Market | SaaS/Flow Ratio | Interpretasi |
|---------|-------------------|-----------------|-------------|
| Trade & Supply Chain | $50-75B | **0.18%** | PALING UNDERSERVED — dari $33T flow, hanya 0.18% yang di-SaaS-kan |
| Payments & Financial | $320-520B | ~0.3% | Moderat |
| Compliance & Tax | ~$135B | ~27% | Paling mature |

[INFERENSI] Trade/Supply Chain cluster (di mana CatatOrder berada) = cluster dengan rasio SaaS/Flow TERENDAH secara global. Ini konfirmasi bahwa order management, invoicing, supply chain SaaS = underserved.

### 3.2 Indonesia SaaS Landscape — Peta Player

#### Commerce & Operations

| Player | Category | Revenue/Users | Pricing | Status | Relevansi CatatOrder |
|--------|----------|---------------|---------|--------|---------------------|
| Moka POS (GoTo) | POS | 35-50K merchants | Rp299K/bln | Hidup | Beda segmen — POS fisik |
| Majoo | POS | $79.6M claimed rev | Rp249K/bln | Hidup | Beda segmen — POS fisik |
| ESB | F&B Vertical | 30K+ merchants | Enterprise pricing | Hidup, kuat | Beda vertikal — F&B chain |
| SIRCLO | E-commerce enabler | $184M rev | Enterprise | Hidup | Beda — enterprise e-commerce |
| Jubelio | Multi-channel | "ribuan" | Rp500K+/bln | Hidup | Beda — e-commerce seller |
| **CatatOrder** | **Order Mgmt (WA)** | **~early stage** | **Rp15K/50 order** | **Hidup** | **Satu-satunya WA order-first** |

[INFERENSI] **CatatOrder TIDAK punya kompetitor langsung di "WA-based order management."** Dazo (Rp49K+/bln) terdekat tapi lebih mahal + AI chatbot focus. QuickOrder.ai = keyboard app, bukan order management system.

#### Financial & Accounting

| Player | Category | Revenue/Users | Pricing | Status |
|--------|----------|---------------|---------|--------|
| Mekari Jurnal | Cloud Accounting | $97.5M (total Mekari) | Rp399K/bln | Dominan |
| Accurate | Cloud Accounting | 300K bisnis | Rp278K/bln | Legacy, kuat |
| Kledo | Cloud Accounting | 70K users | Rp140K/bln | Bootstrap, niche |
| Paper.id | Invoicing + Payment | 600K SME | Gratis (monetisasi payment) | Growing |
| BukuWarung | Micro Bookkeeping | $1.7M rev | Gratis | Fragile |
| Lummo/BukuKas | Micro Bookkeeping | **MATI** | - | Bankrut Sep 2023 ($140M burned) |

#### HR, Tax & Compliance

| Player | Category | Revenue/Users | Pricing | Status |
|--------|----------|---------------|---------|--------|
| OnlinePajak | Tax Filing (PJAP) | 700K users | Rp5K/transaksi | Bertahan |
| Klikpajak (Mekari) | Tax Filing (PJAP) | Bagian Mekari | Bundle | Bertahan |
| Pajakku | Tax Filing (PJAP) | $24.3M rev | Varied | Bertahan |
| Mekari Talenta | Payroll | 35K businesses | Rp25K/karyawan/bln | Dominan |
| Gadjian | Payroll SME | 10K businesses | Rp12.5K/karyawan/bln | Niche |

### 3.3 Dead & Dying List (2023-2025)

| Company | Category | Total Funding | Status | Lesson untuk CatatOrder |
|---------|----------|---------------|--------|------------------------|
| BukuKas/Lummo | Micro bookkeeping | ~$140M | **MATI** (Sep 2023) | Jangan target 65M UMKM mikro. WTP = $0. |
| Ula | B2B FMCG marketplace | $141M | **MATI** (Feb 2025) | Jangan jadi marketplace. Margin terlalu tipis. |
| GudangAda | B2B FMCG marketplace | $135M | **Pivot** ke beauty | B2B commerce butuh niche, bukan horizontal. |
| Selly (GoTo) | WA commerce | Akuisisi | **MATI** (Jul 2025) | Problem WA order NYATA — Selly mati karena parent restructuring, bukan market rejection. |
| eFishery | Agritech | $200M+ | **Fraud** ($600M revenue fraud) | Due diligence, governance matters. |
| TaniHub | Agritech | $32M | **Mati** (izin dicabut OJK) | Regulatory risk nyata. |
| Zenius | EdTech | $30M+ | **Mati** (Jan 2024) | Consumer EdTech = race to bottom. |
| Investree | P2P Lending | $37.5M | **Mati** (fraud, bubar Maret 2025) | Lending = regulatory + fraud risk tinggi. |
| Spenmo | Expense Mgmt | $47M+ | **Mati** (Aug 2025) | Standalone point solution = tidak sustainable. |

**Total capital destroyed: $730M+**

[INFERENSI] **3 thesis yang TERBUKTI GAGAL di Indonesia:**
1. Free bookkeeping untuk micro UMKM → WTP = $0
2. B2B FMCG marketplace → margin terlalu tipis, logistics terlalu berat
3. Standalone point solution → harus bundle

[FAKTA] **1 thesis yang BUKAN gagal karena market:** Selly (WA commerce) mati karena GoTo restructuring, BUKAN karena market rejection. Selly punya 1M+ transaksi/bulan. **Ini validasi bahwa WA-based order = pasar yang nyata.**

---

## 4. GAP ANALYSIS: DI MANA PELUANG

### 4.1 Matriks Gap — 24 Kategori SaaS

Dari 24 kategori yang dipetakan across 4 kuadran:

```
EXTREME GAP (zero solution, proven problem, large flow):
  - Account Reconciliation SME — QRIS 38M merchant, zero auto-reconcile
  - Treasury/Cash Flow Visibility SME — UMKM zero visibility

HIGH GAP (minimal/no solution, strong problem):
  - Invoice Automation / AR — 100% manual B2B
  - Procurement SaaS SME — 100% manual
  - Cross-border Payment SME — Bank-dominated
  - Social Commerce Tools — Rp84T tanpa tools ← CATATORDER AREA

DEAD ZONE (sudah dicoba, gagal — JANGAN masuk):
  - Trade Finance/SCF via marketplace — $276M burned
  - Free micro bookkeeping — $220M+ burned
```

### 4.2 Sweet Spot Filter (5 kriteria)

```
FILTER 1: Gap Level = HIGH atau EXTREME (bukan DEAD ZONE) ✓
FILTER 2: Indonesia Flow > Rp100T/tahun ✓
FILTER 3: Global SaaS sudah proven (ARR > $100M) ✓
FILTER 4: Ada forcing function di Indonesia ✓
FILTER 5: Belum ada startup Indonesia gagal besar di sini ✓
```

### 4.3 Verdict — 3 Sweet Spots

| Sweet Spot | Verdict | Feasibility Solo Dev |
|-----------|---------|---------------------|
| **B: Invoice + e-Faktur Compliance** | **UPGRADED** — terkuat | **MEDIUM-TINGGI** |
| A: Payment Reconciliation | CONFIRMED — tapi bukan standalone | MEDIUM |
| C: Cross-border Remittance | DOWNGRADED — barrier terlalu tinggi | RENDAH |

---

## 5. SWEET SPOT TERKUAT: INVOICE + e-FAKTUR COMPLIANCE

### 5.1 Kenapa Ini Entry Point Terkuat

| Aspek | Data | Tag |
|-------|------|-----|
| Captive market | 735.838 PKP, growing 9%/tahun | [FAKTA] T1-DJP |
| Forcing function | Coretax e-Faktur MANDATORY (batas akhir 31 Des 2025) | [FAKTA] T1-DJP |
| Problem nyata | Coretax 34 tipe masalah saat launch, hanya 31.8% berhasil buat faktur | [FAKTA] T1-DPR |
| AR problem | 49% invoice B2B Indonesia overdue, 8% bad debt | [FAKTA] T2-Atradius |
| Global proof | Bill.com $1.5B revenue (73% transaction fee), Conta Azul $300M exit | [FAKTA] T1-SEC |
| Gap | Micro PKP underserved: Paper.id gratis tapi tanpa e-Faktur. OnlinePajak/Mekari terlalu mahal | [INFERENSI] |
| WA-native | Zero invoicing solution yang WhatsApp-first | [INFERENSI] |
| Price sensitivity | Rp5K/e-Faktur vs risiko denda Rp500K+ = value prop SANGAT jelas | [INFERENSI] |

### 5.2 Thesis Adjustment (dari Deep Dive)

**SEBELUM deep dive:** "Invoice automation + AR management"
**SETELAH deep dive:** "Invoice-to-eFaktur COMPLIANCE sebagai beachhead, AR automation sebagai upsell, payment processing sebagai revenue engine"

**Perubahan penting:**
- PPh Final 0.5% diperpanjang PERMANEN untuk WP Orang Pribadi — forcing function lebih lemah dari perkiraan awal [FAKTA]
- WP Badan (PT/CV) tetap ada batas waktu — masih ada market tapi lebih kecil [FAKTA]
- Coretax e-Faktur = forcing function PRIMER (bukan PPh Final) [INFERENSI]
- Beachhead = PKP baru (~60K/tahun) yang butuh e-Faktur pertama kali [INFERENSI]

### 5.3 Mega-Gap yang Ditemukan

```
LANDSCAPE E-FAKTUR SAAT INI:

                    Ada e-Faktur         Tidak Ada e-Faktur
                    ───────────         ──────────────────
Mahal (>Rp300K)     Mekari Klikpajak    -
                    OnlinePajak

Murah (<Rp100K)     ??? ← KOSONG        Paper.id (gratis)
                                         CatatOrder (potential)

Target = kuadran kiri bawah: e-Faktur compliance yang MURAH dan MUDAH
```

### 5.4 PJAP — Barrier Sekaligus Moat

[FAKTA] 14 PJAP (Penyedia Jasa Aplikasi Perpajakan) resmi diakui DJP. Hanya PJAP yang bisa Host-to-Host dengan Coretax API.

**Opsi untuk CatatOrder:**
1. **Jadi PJAP sendiri** — barrier tinggi (approval DJP, infrastructure requirement), tapi moat kuat jika berhasil
2. **Partner dengan PJAP existing** — lebih feasible untuk solo dev, tapi dependent on partner
3. **Generate e-Faktur tanpa H2H** — via Coretax web portal (manual), kurang ideal tapi possible sebagai MVP

[INFERENSI] Opsi 2 (partner PJAP) paling realistis untuk tahap awal. PJAP seperti Pajakku atau OnlinePajak mungkin terbuka untuk partnership karena mereka butuh distribusi ke micro UMKM yang mereka sendiri tidak reach.

---

## 6. CONVERGENCE MAP: POSISI CATATORDER

### 6.1 Post-Payment Stack (Convergence Terkuat)

```
  CatatOrder (EXISTING — posisi paling hulu)
       │
       ▼
  ┌──────────┐    ┌──────────────┐    ┌─────────────┐
  │  ORDER   │ → │  INVOICE     │ → │  PAYMENT    │
  │  (PO/SO) │    │  (komersial  │    │  (QRIS/bank/│
  │          │    │  + e-Faktur) │    │  transfer)  │
  └──────────┘    └──────────────┘    └─────────────┘
                         │                    │
                         ▼                    ▼
                  ┌──────────────────────────────────┐
                  │     AUTO-RECONCILIATION           │
                  │  (match invoice ↔ payment)        │
                  └──────────────────────────────────┘
                              │
                              ▼
                  ┌──────────────────────────────────┐
                  │     ACCOUNTING / BOOKKEEPING      │
                  │  (buku besar, neraca, laba rugi)  │
                  └──────────────────────────────────┘
                              │
                              ▼
                  ┌──────────────────────────────────┐
                  │     TAX COMPLIANCE                │
                  │  PPN (e-Faktur) + PPh + SPT       │
                  └──────────────────────────────────┘
```

### 6.2 Kenapa CatatOrder = Starting Point Natural

1. **Order = top of funnel** — setiap flow bisnis dimulai dari order [INFERENSI]
2. **Order data = PALING BERHARGA** — mengandung: apa yang dijual, ke siapa, berapa harga, kapan [INFERENSI]
3. **Jika order sudah digital, invoice generation = trivial** — auto-generate dari order data [INFERENSI]
4. **Invoice generation = gateway ke e-Faktur compliance** — forcing function Coretax [INFERENSI]
5. **e-Faktur compliance = revenue opportunity** — Rp 3.000-5.000/faktur [INFERENSI]

### 6.3 Expansion Path dari CatatOrder

```
SAAT INI:    CatatOrder = Order Management
                    │
LANGKAH 1:   + Invoice Generation (order → auto-create invoice)
                    │
LANGKAH 2:   + e-Faktur Compliance (invoice → e-Faktur via PJAP partner)
                    │
LANGKAH 3:   + Payment Tracking (invoice → track pembayaran masuk)
                    │
LANGKAH 4:   + Auto-Reconciliation (match payment ↔ invoice)
                    │
LANGKAH 5:   + Basic Accounting (auto-generate laporan keuangan)
                    │
LANGKAH 6:   + Tax Filing (SPT, PPN, PPh)
```

[INFERENSI] Ini persis model **Conta Azul (Brazil)** yang diakuisisi $300M: dimulai dari invoicing/bookkeeping sederhana, expand ke full ERP + compliance.

---

## 7. COMPETITIVE LANDSCAPE DETAIL

### 7.1 Mekari — The 800-Pound Gorilla

| Aspek | Fakta | Implikasi untuk CatatOrder |
|-------|-------|---------------------------|
| Revenue | $97.5M total | Incumben terbesar |
| Stack | 5/6 layers (invoice, payment, recon, accounting, tax) | Comprehensive tapi enterprise-priced |
| Pricing | Rp399K+/bulan | **2.5x lipat terlalu mahal** untuk UMKM kecil |
| UX | Enterprise-feeling | Terlalu kompleks untuk UMKM mikro-kecil |
| Reconciliation | "Auto-reconciliation" = CSV upload manual | **BUKAN real auto-recon** — gap di sini |
| WhatsApp integration | Zero | **CatatOrder advantage** |
| Target segment | Menengah-atas | BEDA segmen dari CatatOrder |
| Money Forward investment | Series E $50M dari Money Forward (Jepang) | **THREAT** — Money Forward = specialist bank feed auto-recon |

[INFERENSI] **Mekari = ancaman terbesar tapi BUKAN invincible.** Mekari bermain di SEGMEN BERBEDA (menengah-atas) dan kemungkinan besar TETAP di sana karena margin lebih tinggi. CatatOrder harus UNDERSERVE segmen Mekari — bukan head-on compete.

### 7.2 Paper.id — Competitor Terdekat di Invoicing

| Aspek | Fakta | Implikasi |
|-------|-------|-----------|
| Users | 600K SME | Sudah punya base |
| Pricing | Gratis (monetisasi via payment) | Revenue dari payment processing, bukan invoicing |
| e-Faktur | TIDAK ADA | **GAP** — Paper.id = invoicing tanpa compliance |
| TPV growth | 30x | Growing via payment, bukan tools |
| Revenue | Tidak dipublikasikan | Opaque |

[INFERENSI] Paper.id ada di space invoicing tapi TANPA e-Faktur compliance. CatatOrder bisa differentiate via: (a) order-first flow yang Paper.id tidak punya, (b) e-Faktur compliance yang Paper.id tidak punya.

### 7.3 Xendit/Midtrans — Payment Gateway Threat

| Aspek | Kemungkinan Expand ke Recon/Invoice | Reasoning |
|-------|--------------------------------------|-----------|
| Reconciliation dashboard | TINGGI (3-12 bulan) | Sudah punya data transaksi |
| Invoicing | RENDAH | Bukan core competency |
| Accounting/tax | SANGAT RENDAH | Terlalu jauh dari core |
| Limitation | Hanya lihat transaksi VIA mereka | TIDAK bisa cross-platform reconciliation |

[INFERENSI] Xendit/Midtrans = ancaman untuk single-channel reconciliation tapi BUKAN untuk order-to-invoice-to-multi-channel-recon flow yang CatatOrder bisa build.

---

## 8. MODEL MONETISASI BERDASARKAN DATA

### 8.1 WTP UMKM Indonesia (Data Terkumpul)

| Segmen | WTP Range | Evidence |
|--------|-----------|---------|
| Mikro (omzet <Rp300jt/yr) | Rp 0-50K/bulan | BukuWarung ARPU $0.21/yr. BukuKas BANGKRUT. |
| Kecil (Rp300jt-2.5M/yr) | Rp 50K-300K/bulan | Kledo Rp140K/bln, 70K users. Paper.id free. |
| Menengah (Rp2.5M-50M/yr) | Rp 300K-2M/bulan | Mekari Jurnal Rp399-499K/bln, 20K businesses. |
| Compliance-driven (PKP) | Rp 3K-5K per e-Faktur | OnlinePajak Rp5K/trx. Fear of Rp500K+ denda. |

### 8.2 Model yang PROVEN di Indonesia

| Model | Contoh | Revenue | Status |
|-------|--------|---------|--------|
| Ecosystem SaaS (bundling) | Mekari | $97.5M | PROVEN |
| Per-transaction (compliance) | OnlinePajak (Rp5K/trx) | Tidak dipublikasikan | PROVEN |
| Freemium + payment processing | Paper.id | Tidak dipublikasikan | PROVEN |
| Vertical SaaS + transaction | ESB (F&B) | ~$30-50M est. | PROVEN |
| Mid-market subscription | Kledo (Rp140K), Accurate (Rp278K) | Survive 10+ tahun | PROVEN |

### 8.3 Model yang GAGAL di Indonesia

| Model | Contoh | Capital Burned | Lesson |
|-------|--------|---------------|--------|
| Free tool, monetize later | BukuKas | $140M | ARPU = $0. Jangan. |
| Free bookkeeping, monetize via lending | BukuWarung | $80M | ARPU $0.21/yr |
| Standalone point solution | Spenmo | $47M+ | Terlalu tipis |
| Hardware-dependent | Cashlez | $5M+ | Distribution + maintenance > revenue |

### 8.4 Pricing Formula untuk CatatOrder

```
1. CORE PRODUCT = FREE atau SANGAT MURAH
   - Order management: FREE (50 order/bulan — sudah ada)
   - Invoice creation: FREE (hook untuk e-Faktur conversion)
   - Basic reconciliation view: FREE

2. COMPLIANCE = PER-TRANSACTION (Revenue Driver #1)
   - e-Faktur generation: Rp 3.000-5.000/faktur
   - e-Bupot: Rp 3.000-5.000/bukti potong
   - e-Materai: Rp 10.000 (pass-through Peruri)

3. PAYMENT PROCESSING = PER-TRANSACTION (Revenue Driver #2)
   - Payment facilitation fee: 1-2%
   - Extended payment terms margin

4. PREMIUM FEATURES = SUBSCRIPTION (Revenue Driver #3 — terkecil)
   - Multi-outlet: Rp 99K-199K/bulan
   - Advanced reporting: Rp 99K/bulan
   - API access: Rp 199K-499K/bulan

ARPU TARGET:
  Year 1: Rp 30K-50K/bulan (mostly compliance transactions)
  Year 2: Rp 80K-150K/bulan (+ payment processing)
  Year 3: Rp 150K-300K/bulan (+ premium + lending referral)
```

[INFERENSI] Per-transaction model JAUH lebih viable daripada subscription karena:
1. WTP subscription UMKM rendah (proven by BukuKas failure)
2. Compliance transaction = WAJIB (captive revenue)
3. Transaction fees scale with business growth
4. Bill.com: 73% revenue dari transaction fees, hanya 17% subscription

---

## 9. ANTI-PATTERN: APA YANG HARUS DIHINDARI

### 9.1 PASTI Dihindari (Data-Backed, Confidence Tinggi)

| # | Anti-Pattern | Evidence | Capital Destroyed |
|---|-------------|---------|-------------------|
| 1 | **Target semua 65M UMKM** | BukuKas/BukuWarung near-zero monetization | $220M+ |
| 2 | **Free product, monetize later** | BukuKas bankrupt, BukuWarung ARPU $0.21/yr | $220M+ |
| 3 | **Standalone reconciliation** | Tidak ada global success story standalone recon untuk SME | N/A |
| 4 | **Standalone invoicing** | Zoho Invoice = FREE. Paper.id = FREE. Commoditized. | N/A |
| 5 | **Head-on compete Mekari** di segmen Rp400K+ | $97.5M revenue, ecosystem lock-in | N/A |
| 6 | **Cross-border remittance** | Wise gagal e-wallet Indonesia. Regulasi terlalu berat. | N/A |
| 7 | **Andalkan PPh Final expiry saja** | Diperpanjang PERMANEN untuk WP OP | N/A |

### 9.2 Decision Tree

```
Apakah target user MEWAJIBKAN fitur ini secara hukum?
├── YA → CHARGE per-event (e-Faktur, e-Bupot, laporan pajak)
│         Revenue = captive, churn rendah
│
└── TIDAK → Apakah fitur ini MENGHEMAT waktu >1 jam/minggu?
     ├── YA → FREEMIUM → convert ke paid setelah sticky
     │
     └── TIDAK → JANGAN BUILD — nice-to-have = BukuKas trap
```

---

## 10. GLOBAL COMPARABLES: PELAJARAN DARI DUNIA

### 10.1 Paling Relevan untuk CatatOrder

| Comparable | Negara | Model | Revenue | Lesson |
|------------|--------|-------|---------|--------|
| **Conta Azul** | Brazil | SME ERP + compliance NFe | $300M exit | **PALING RELEVAN.** Dimulai dari invoicing sederhana, expand ke full ERP + compliance. "Conta Azul for Indonesia" = thesis yang valid. |
| **Bill.com** | US | Transaction fee (73%) + subscription | $1.5B | Transaction fees >> subscription. Per-compliance-event pricing = model terbaik. |
| **ClearTax** | India | GST compliance SaaS | $10.7M rev, 97 orang | Tax compliance SaaS bisa capital-efficient. Revenue/employee ~$110K. |
| **Churpy** | Kenya | Auto-reconcile invoice ↔ bank, extend ke SCF | Seed $1M | Data-as-moat: reconciliation data = credit scoring. Start small. |

### 10.2 Pattern Konsisten dari Semua Comparable

1. **Bundling > standalone.** Setiap success story (StoneCo, Bill.com, Mekari, Conta Azul) = BUNDLE. Standalone = tidak survive alone.
2. **Transaction fees > subscription di emerging markets.** Per-event pricing beat monthly subscription di pasar dengan WTP rendah.
3. **Compliance = stickiest revenue.** User TIDAK BISA churn jika legally required. Retention near-guaranteed.
4. **Free bookkeeping alone = death trap.** Khatabook ($187M, belum profitable), BukuKas ($140M, bankrupt), BukuWarung ($80M, $1.7M revenue). Konsisten di India DAN Indonesia.
5. **Regulatory moat = real but expensive.** PJAP/GSP status = barrier for followers tapi juga barrier for you. Sweet spot: partner dengan licensed entity.

### 10.3 Warning dari Khatabook (India)

[FAKTA] Khatabook = model yang paling mirip BukuKas Indonesia. Revenue $12.4M setelah $187M funding. ARPU $1.24/user/yr. Masih BELUM profitable setelah 5+ tahun.

[INFERENSI] **Ini konfirmasi kuat: micro-merchant WTP = structural near-zero, bahkan di India yang digital adoption-nya lebih tinggi dari Indonesia.** CatatOrder Rp15K/50 order sudah tepat — tapi harus ada revenue stream lain (compliance, payment) selain subscription.

---

## 11. REMAINING UNKNOWNS: APA YANG HARUS DIVALIDASI

### 11.1 Make-or-Break Questions

| # | Unknown | Kritis? | Cara Jawab |
|---|---------|---------|-----------|
| 1 | **WTP UMKM kecil untuk invoice+compliance tool** | SANGAT KRITIS | Survei/wawancara 50-100 UMKM kecil (Rp500M-5M omzet) |
| 2 | **CatatOrder users: pain point SETELAH order?** | SANGAT KRITIS | Survei CatatOrder existing users: "Setelah catat order, langkah berikutnya apa?" |
| 3 | **Coretax stability per Maret 2026** | KRITIS | Coba sendiri file e-Faktur via Coretax. Berapa lama? Error? |
| 4 | **SNAP API capabilities** | KRITIS | Build POC dengan Brick/Ayoconnect API. Data apa yang available? |
| 5 | **Churn rate SaaS UMKM Indonesia** | SANGAT KRITIS | Wawancara Kledo/Accurate tentang retention |
| 6 | **% UMKM B2B yang buat invoice formal** | TINGGI | Survei UMKM B2B |
| 7 | **Mekari roadmap auto-recon** | KRITIS | OSINT: Mekari careers page (cari "open banking" engineer) |
| 8 | **Konsultan pajak: channel atau kompetitor?** | MEDIUM | Wawancara 20-30 konsultan pajak |

### 11.2 Prioritas Validasi

```
PERTAMA (bisa dilakukan SENDIRI):
  #2 — Survei CatatOrder users: pain point setelah order?
  #3 — Coba Coretax sendiri: masih bermasalah?
  #4 — Build POC Brick/Ayoconnect API

KEDUA (butuh survei/wawancara UMKM):
  #1 — WTP UMKM kecil
  #6 — % UMKM B2B yang buat invoice formal

KETIGA (butuh koneksi industri):
  #5 — Churn rate
  #7 — Mekari roadmap
  #8 — Konsultan pajak
```

---

## 12. META-ASSESSMENT: DI MANA PETA INI LEMAH

### 12.1 Kelemahan Utama

| Area | Kenapa Lemah | Impact |
|------|-------------|--------|
| WTP = masih unknown | Semua riset ini secondary research. Zero data primer dari UMKM. | Seluruh TAM dan pricing model = SPEKULASI sampai validated |
| Source bias: English-dominant | Sumber utama = World Bank, Bloomberg, SEC filings. Sumber bahasa Indonesia terbatas. | Kompetitor dari China/India mungkin under-assessed |
| Survivorship bias | Hanya lihat yang berhasil besar dan gagal besar. Yang gagal kecil = invisible. | Mungkin overestimate probabilitas success |
| Coretax data STALE | Data dari Jan 2025 (34 bug). Sekarang 14 bulan kemudian — bisa sudah fixed. | Jika Coretax sudah stabil, compliance SaaS value prop MELEMAH |
| CatatOrder specific data = ZERO | Tidak punya data tentang: berapa users CatatOrder, segmen apa, fitur apa yang paling dipakai | Convergence analysis yang menempatkan CatatOrder as upstream = BISA SALAH |

### 12.2 Apa yang Mungkin Kita Salah Assess

1. **Mekari mungkin LEBIH DEKAT ke real auto-reconciliation.** [SPEKULASI] Money Forward (Jepang) invest Series E $50M — Money Forward = specialist bank feed. Knowledge transfer bisa accelerate Mekari recon launch.

2. **UMKM mungkin AKTIF menolak digitalisasi.** [SPEKULASI] 97% UMKM tidak bayar pajak. Banyak yang SENGAJA hindari digital trail. Product yang membuat keuangan transparan = ANCAMAN bagi mereka, bukan solusi. "Tax fear" = anti-adoption force yang kuat.

3. **Paper.id mungkin sudah jauh lebih maju dari yang terlihat.** [SPEKULASI] 600K users, TPV 30x growth. Mereka mungkin sudah building reconciliation/compliance secara silent.

4. **Coretax mungkin sudah DIPERBAIKI.** [SPEKULASI] 14 bulan sejak launch. Jika portal sekarang "good enough", compliance SaaS thesis melemah untuk micro.

### 12.3 Confidence Level

| Aspek | Confidence | Reasoning |
|-------|-----------|-----------|
| CatatOrder di posisi hulu convergence | MEDIUM | Logika kuat tapi CatatOrder-specific data = zero |
| Invoice + e-Faktur = entry point terkuat | MEDIUM-TINGGI | Forcing function terkuat, global proof, gap confirmed |
| Per-transaction > subscription | TINGGI | Konsisten across Bill.com, OnlinePajak, BukuKas failure |
| Micro UMKM WTP = near-zero | SANGAT TINGGI | $220M+ destroyed membuktikan ini |
| Cross-border = bukan untuk solo dev | TINGGI | Wise gagal, regulatory barrier documented |

---

## PETA FINAL

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  STRONGEST ENTRY POINT:                                           │
│  Invoice + e-Faktur Compliance (Sweet Spot B - UPGRADED)          │
│                                                                   │
│  NATURAL EXPANSION:                                               │
│  CatatOrder (order) → Invoice → e-Faktur → Payment Tracking      │
│  → Reconciliation → Basic Accounting → Tax Filing                 │
│                                                                   │
│  MONETISASI:                                                      │
│  Free core + Rp 3-5K/e-Faktur + 1-2% payment + Rp 99-199K/mo    │
│                                                                   │
│  MOAT:                                                            │
│  CatatOrder upstream data + WhatsApp UX + affordable compliance   │
│  + vertical specialization + eventual data/lending moat           │
│                                                                   │
│  BIGGEST RISKS:                                                   │
│  1. Mekari + Money Forward launch real auto-recon                 │
│  2. PJAP access barrier (must partner, not build)                 │
│  3. WTP masih UNKNOWN (must validate via primary research)        │
│  4. Coretax might get fixed (reduces compliance SaaS value)       │
│                                                                   │
│  NEXT STEP (tidak bisa dijawab via internet):                     │
│  1. Survei CatatOrder users: pain point setelah order?            │
│  2. Coba Coretax sendiri: masih bermasalah?                       │
│  3. Build POC Brick/Ayoconnect API                                │
│  4. Wawancara 50 UMKM kecil: WTP untuk compliance tool?           │
│                                                                   │
│  AVOID:                                                           │
│  ✗ Cross-border remittance (barrier terlalu tinggi)               │
│  ✗ Standalone reconciliation (tidak sustainable)                  │
│  ✗ Free product without revenue (BukuKas trap)                    │
│  ✗ Target 65M UMKM (target 2-3M UMKM kecil-menengah)            │
│  ✗ Head-on compete Mekari (underserve their segment instead)      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**Dokumen ini berdasarkan ~883KB data dari 6 reality captures.**
**Confidence overall: MEDIUM — limited by absence of primary research data.**
**Tanggal: 2026-03-15**
**Refresh recommended: 2026-06-15 (3 bulan)**

**Source captures:**
- `/reality/20260315-global-money-flow/` (188KB)
- `/reality/20260315-global-saas-landscape/` (173KB)
- `/reality/20260315-indonesia-money-flow/` (184KB)
- `/reality/20260315-indonesia-saas-landscape/` (132KB)
- `/reality/20260315-gap-analysis/` (46KB)
- `/reality/20260315-sweet-spot-deep-dive/` (160KB)
