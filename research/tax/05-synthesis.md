# SYNTHESIS: Tax UMKM via CatatOrder — CoreTax Deep Dive

**Tanggal:** 2026-03-28
**Input:** 4 research files — CoreTax transition, UMKM tax compliance, tax tech landscape, CatatOrder integration path

---

## PETA UTAMA — SCALE

```
INDONESIA TAX UNIVERSE (2026)
═══════════════════════════════════════════════════════════════════════

86,7 juta WP terdaftar
├── 80,27 juta WP Orang Pribadi (92,58%)
├── 5,54 juta WP Badan
└── 880 ribu Instansi Pemerintah

UMKM BREAKDOWN:
64,2 juta (estimasi) ──┐
30,2 juta (terverifikasi) ──┤
├── 30,1 juta Mikro (99,71%)  ← rata-rata omzet Rp99,2jt/th
├── ~74 ribu Kecil (0,24%)    ← omzet Rp2-15M/th
└── ~15 ribu Menengah (0,05%) ← omzet Rp15-50M/th

COMPLIANCE FUNNEL:
64,2 juta UMKM
→ 1,6 juta WP UMKM terdaftar (2,5%)
  → 653.000 seharusnya bayar PPh Final (40,8% compliance)
    → 432.000 yang benar-benar setor (2023)
      → Rp2,49 triliun total setoran (turun dari Rp7,5T di 2019)

PENERIMAAN PAJAK:
Rp1.932T total (2024) → UMKM <5% = ~Rp96T maksimal
Tax ratio: 10,08% (TERENDAH DI ASEAN, target 12%)
```

**Angka yang matter:**
- 542.000 WP pakai fasilitas PPh Final 0,5% (2025) [FAKTA-T1]
- 68% usaha mikro omzet <Rp50jt/tahun = legal BEBAS PPh [FAKTA-T1]
- Mayoritas UMKM yang "tidak bayar pajak" MEMANG tidak perlu bayar [INFERENSI]
- Tapi semua WP terdaftar WAJIB lapor SPT Tahunan, termasuk yang nihil [FAKTA-T1]

---

## AKTOR & POWER DYNAMICS — STRUCTURE

### Peta Kekuatan Tax Tech Indonesia

```
TIER 1: REGULATORS (mendefinisikan game)
┌────────────────────────────────────────────────────────┐
│ DJP — monopoli otoritas, CoreTax mandatory 2026       │
│ Kemenkeu — perpanjang PPh Final sampai 2029 (WP OP)    │
│ 14 PJAP — gatekeeper akses API DJP (monopoli de facto) │
└────────────────────────────────────────────────────────┘

TIER 2: ESTABLISHED PLAYERS (sudah punya pangsa)
┌────────────────────────────────────────────────────────┐
│ Mekari ecosystem — $97,5M revenue, Klikpajak+Jurnal   │
│ OnlinePajak — 900K users, $53,5M funding, PJAP        │
│ Accurate Online — satu-satunya accounting→DJP langsung │
│ 7.390 konsultan pajak — diuntungkan oleh complexity    │
└────────────────────────────────────────────────────────┘

TIER 3: POS/ORDERING (punya data, TIDAK punya tax)
┌────────────────────────────────────────────────────────┐
│ Majoo — 45K merchants, PPN basic, ZERO PPh             │
│ Moka/GoTo — 35-45K merchants, PPN basic, ZERO PPh      │
│ CatatOrder — e-Faktur XML LIVE, PPh BELUM              │
│ Pawoon, Qasir, iSeller — PPN basic, ZERO PPh           │
└────────────────────────────────────────────────────────┘

TIER 4: UMKM-ADJACENT (dekat user, tanpa tax)
┌────────────────────────────────────────────────────────┐
│ BukuKas/BukuWarung — jutaan user, pivoting away        │
│ HiPajak — satu-satunya yang target UMKM+freelancer     │
│   (Rp25K/bln, tapi TANPA order management)             │
└────────────────────────────────────────────────────────┘
```

### Dependency Map Kritis

```
UMKM ─→ Coretax (WAJIB) ─→ DJP
         ↑ bantuan?
         ├── Konsultan pajak (Rp1,5-7jt/bln — TIDAK AFFORDABLE)
         ├── HiPajak (Rp25K/bln — paling dekat, tapi no order data)
         ├── Klikpajak/OnlinePajak (Rp250K+/bln — target SME, bukan mikro)
         └── ??? (30 JUTA UMKM MIKRO = VOID ZONE)
```

[INFERENSI] **Structural gap terbesar: 30 juta UMKM mikro yang wajib lapor SPT tapi tidak punya bantuan affordable. CoreTax terlalu kompleks, konsultan terlalu mahal, HiPajak paling dekat tapi tidak punya data omzet mereka.**

---

## APA YANG BERUBAH & KECEPATAN — DYNAMICS

### Timeline Kritis

| Tanggal | Event | Impact | Urgency |
|---------|-------|--------|---------|
| 1 Jan 2025 | CoreTax go-live (paralel DJP Online) | Confusion mulai | Selesai |
| 1 Jan 2026 | DJP Online ditutup → full CoreTax | No fallback | Selesai |
| 1 Jan 2026 | Revisi PP 55/2022 berlaku: WP OP permanen, CV/PT tidak bisa | Market definition berubah | Selesai |
| **30 Apr 2026** | **Deadline SPT Tahunan 2025 (relaksasi)** | **Pertama kali 100% wajib CoreTax** | **33 HARI LAGI** |
| 2026-2029 | PPh Final 0,5% berlaku untuk WP OP | Market window 3+ tahun | Ongoing |

### Velocity of Change

| Faktor | Kecepatan | Arah | Tag |
|--------|-----------|------|-----|
| CoreTax mandatory | CEPAT (sudah terjadi) | Irreversible | [FAKTA] |
| UMKM digital adoption | SEDANG (27M sudah digital) | Naik tapi lambat | [TREND] |
| Tax tech funding | CEPAT TURUN (82% collapse) | New entrant sangat sulit | [FAKTA] |
| POS→tax integration | STAGNANT | Tidak ada yang bergerak | [INFERENSI] |
| Compliance rate UMKM | LAMBAT | 40,8% → target naik tapi tidak ada mekanisme | [TREND] |
| CoreTax perbaikan | LAMBAT | Target terus mundur (Jul→Okt→Feb 2026) | [FAKTA] |

[INFERENSI] **Window of opportunity SEKARANG TERBUKA karena 3 forcing function bertemu:**
1. CoreTax mandatory (no choice)
2. Funding collapse (no new competitors)
3. PPh Final diperpanjang 2029 (market stability)

---

## SIAPA DIUNTUNGKAN — INCENTIVES

### Peta Insentif

| Aktor | Diuntungkan Oleh | Mengapa | Stance terhadap CatatOrder Tax |
|-------|------------------|---------|-------------------------------|
| **30M UMKM mikro** | Simplicity | Tidak punya waktu/uang/pengetahuan | WELCOME — butuh bantuan gratis/murah |
| **DJP/Pemerintah** | Higher compliance | Target tax ratio 12% | WELCOME — apa saja yang naikkan compliance |
| **542K WP PPh Final** | Efisiensi | Waktu = uang, CoreTax ribet | WELCOME — CatatOrder sudah punya data mereka |
| **7.390 konsultan** | Complexity | Job security, fee per engagement | NETRAL→NEGATIF (tapi UMKM mikro bukan klien mereka anyway) |
| **Mekari/Klikpajak** | Ecosystem lock-in | Revenue dari SME, bukan mikro | NETRAL (berbeda segmen) |
| **OnlinePajak** | Volume transactions | Per-tx model butuh volume | NETRAL (berbeda segmen) |
| **POS competitors** | Status quo | Menambah tax = complexity + risk scaring merchants | NEGATIF jika CatatOrder berhasil (tapi belum bergerak) |

[INFERENSI] **Tidak ada aktor yang akan AKTIF menghalangi CatatOrder. Konsultan pajak tidak melayani UMKM mikro. POS competitor tidak bergerak ke tax. Yang butuh bantuan (UMKM + DJP) akan menyambut.**

---

## GAP ANALYSIS — KONTRADIKSI & DATA YANG HILANG

### CatatOrder di Intersection yang Tidak Ada Orang Lain

```
                    ORDER DATA        e-FAKTUR XML      PPh FINAL CALC
                    ──────────        ────────────      ──────────────
Majoo                  ✓                  ✗                  ✗
Moka                   ✓                  ✗                  ✗
HiPajak                ✗                  ✗                  ✓
Klikpajak              ✗                  ✓ (H2H)            ✓
CatatOrder (now)       ✓                  ✓                  ✗
CatatOrder (+MVP)      ✓                  ✓                  ✓  ← MONOPOLI
```

[FAKTA] **Tidak ada satupun app di Indonesia yang menggabungkan:**
1. Order management (data omzet real)
2. e-Faktur XML generation
3. PPh Final UMKM calculator

CatatOrder sudah punya #1 dan #2. Menambah #3 = monopoli di intersection ini.

### Feature Gap yang Tidak Ada di Seluruh Market

| Fitur | Status Market | CatatOrder Bisa? | Impact |
|-------|--------------|------------------|--------|
| Auto-track omzet YTD vs Rp500jt threshold | TIDAK ADA | YA (data sudah ada) | TINGGI — "omzet kamu tinggal Rp50jt lagi sebelum kena pajak" |
| Proactive tax notification berbasis data real | TIDAK ADA | YA (push notif existing) | TINGGI — reminder setor/lapor |
| Rekap omzet siap copy ke CoreTax | TIDAK ADA | YA (format data) | SEDANG — mengurangi input manual |
| WA-shareable tax summary | TIDAK ADA | YA (existing WA infra) | SEDANG — share ke konsultan/keluarga |
| Bahasa sederhana tax guidance (non-jargon) | TIDAK ADA | YA (UI layer) | TINGGI — CoreTax campur bahasa + jargon |

---

## BLIND SPOTS YANG DITEMUKAN

| # | Blind Spot | Teknik | Signifikansi |
|---|-----------|--------|-------------|
| 1 | **Mengapa TIDAK ADA POS yang build tax features?** Kemungkinan: takut scare away merchant yang hindari pajak | CUI BONO | VERY HIGH — jika benar, CatatOrder perlu framing hati-hati |
| 2 | **Berapa % UMKM mikro tahu wajib lapor SPT meski bebas PPh?** Banyak berita "UMKM bebas pajak" tapi silent soal kewajiban lapor | ADJACENT SILENCE | VERY HIGH — compliance gap bisa lebih besar dari data |
| 3 | **Tax tech market size Indonesia belum pernah diukur** — 86,7M WP tapi no one measured spending on compliance | STRUCTURAL NECESSITY | HIGH |
| 4 | **BukuKas/BukuWarung meninggalkan jutaan user mikro** — pivoting away, user base terbesar UMKM mikro Indonesia orphaned | ADJACENT SILENCE | HIGH — market tersedia |
| 5 | **CoreTax NPS/satisfaction score tidak pernah dipublish** — DJP bilang "semakin baik" tanpa metrik | CUI BONO | MEDIUM |
| 6 | **CatatOrder internal data: berapa user PKP vs non-PKP, berapa yang pakai PPh Final?** | STRUCTURAL NECESSITY | CRITICAL — bisa di-query |
| 7 | **Retention impact tax features di ordering apps = 0 data** — belum pernah ada yang coba, jadi klaim "meningkatkan retention" belum proven | INVERSION | MEDIUM |
| 8 | **Proporsi UMKM self-file vs lewat konsultan — data tidak ada** | STRUCTURAL NECESSITY | HIGH — menentukan demand |

---

## KONEKSI KE CAPTURE LAIN — CONTEXT

| Capture Sebelumnya | Koneksi |
|-------------------|---------|
| 20260327-info-asymmetry-opportunity | Tax UMKM scored 28/35 (tied #1). Synthesis ini VALIDATES scoring: WTP=5 (regulatory mandate), Feasibility=5 (rule-based, data sudah ada), Low Competition=4 (void zone confirmed) |
| 20260327-willingness-to-pay-history | WTP regulatory mandate = tertinggi. Confirmed: orang HARUS comply dengan pajak |
| 20260323-bisnis-pkp-tier-strategy | CatatOrder Bisnis tier (Rp99K) sudah punya e-Faktur XML. PPh Final = natural extension yang memperkuat value prop tanpa menambah tier/harga |
| 20260316-catatorder-distribution-sota | Tax compliance tool = retention hook + organic acquisition (SEO: "cara lapor pajak UMKM 2026") |
| 20260315-catatorder-user-types | Segmen B (custom order, omzet lebih tinggi) = primary target PPh Final. Segmen A (warung kecil) = mostly di bawah Rp500jt = fitur monitoring omzet berguna tapi PPh = Rp0 |

---

## DATA FRESHNESS ASSESSMENT

| Data | Layer | Shelf Life | Refresh By |
|------|-------|-----------|------------|
| CoreTax mandatory date, fitur | [STRUCTURE] | 6-12 bulan | 2026-09 |
| PPh Final 0,5% rules, PTKP Rp500jt | [STRUCTURE] | Stabil sampai 2029 | 2027-01 |
| SPT deadline 30 Apr 2026 | [SNAPSHOT] | 33 hari | 2026-04-30 |
| Tax tech player data (users, pricing, funding) | [TREND] | 3-6 bulan | 2026-09 |
| Compliance rate UMKM 40,8% | [TREND] | 6-12 bulan | 2027-01 |
| CoreTax bug/error status | [SNAPSHOT] | 1-4 minggu | 2026-04-15 |
| CatatOrder schema (orders, profiles, invoices) | [SNAPSHOT] | Bisa berubah kapan saja | Cek sebelum build |
| Revisi PP 55/2022 status | [SNAPSHOT] | Sampai ditandatangani | 2026-06 |

---

## VERDICT: REALITAS TAX UMKM VIA CATATORDER

### 7 Fakta Keras

1. **CatatOrder sudah punya ~80% data yang dibutuhkan.** Orders table = omzet bruto. Profiles = NPWP. Invoices = PPN. Yang kurang hanya kalkulator + threshold tracker + reminder. [FAKTA]

2. **MVP feasible dalam 7-10 hari development.** Dashboard omzet YTD, kalkulator PPh 0,5%, reminder setor/lapor, info billing. Rule-based, bukan ML. [INFERENSI]

3. **Tidak perlu jadi PJAP untuk MVP.** Kalkulator/simulasi + data preparation tool legal tanpa izin PJAP. PJAP hanya untuk koneksi langsung ke DJP. [INFERENSI dari regulasi]

4. **ZERO competitor di intersection order management + e-Faktur + PPh Final.** CatatOrder akan MONOPOLI intersection ini dengan menambah 1 fitur. [FAKTA]

5. **542.000 WP pengguna PPh Final = addressable market.** PPh Final diperpanjang sampai 2029 untuk WP OP. Market window lebar. [FAKTA-T1]

6. **CoreTax mandatory + UX buruk + 35% belum aktivasi = demand besar untuk "CoreTax made simple."** [FAKTA]

7. **Funding collapse 82% = tidak ada new entrant.** POS competitor (Majoo, Moka) TIDAK bergerak ke tax. Window opportunity terbuka. [FAKTA]

### 3 Risiko Utama

1. **Framing risk:** Jika UMKM mengasosiasikan CatatOrder dengan "pajak", bisa scare away user yang menghindari pajak. Perlu framing: "monitor omzet kamu" bukan "bayar pajak kamu." [SPEKULASI — dikonfirmasi oleh blind spot #1]

2. **Demand uncertainty:** Mayoritas UMKM mikro beromzet <Rp500jt = PPh = Rp0. Fitur PPh Final paling berguna untuk segmen Rp500jt-4,8M, yang jauh lebih kecil. [INFERENSI]

3. **CoreTax API tetap tertutup.** Tanpa public API, CatatOrder tidak bisa auto-generate billing code atau auto-submit SPT. User tetap harus buka CoreTax manual. [FAKTA]

### Revenue Model

**Bundled di Bisnis tier (Rp99K/bulan) = paling masuk akal.** [INFERENSI]

| Alasan | Detail |
|--------|--------|
| Zero friction | Tidak perlu tier/add-on baru |
| Retention hook | Data pajak di CatatOrder = churn protection |
| Competitive moat | Majoo/Moka tidak punya, HiPajak tidak punya order data |
| Harga tetap termurah | Rp99K < Kledo (Rp159K) < Klikpajak (Rp250K) |
| Low dev cost | Rule-based dari data existing = high perceived value, minimal effort |

### MVP Scope (7-10 hari)

| # | Fitur | Effort | Priority |
|---|-------|--------|----------|
| 1 | Dashboard omzet YTD + threshold tracking Rp500jt | 2-3 hari | P0 |
| 2 | Kalkulator PPh Final otomatis per bulan | 1-2 hari | P0 |
| 3 | Field: status WP (OP/Badan) + tahun terdaftar | 1 hari | P0 |
| 4 | Reminder setor (tgl 15) + lapor (tgl 20) via push | 1 hari | P1 |
| 5 | Rekap omzet bulanan "siap copy ke CoreTax" | 2-3 hari | P1 |
| 6 | Info billing: KAP 411128, KJS 420, nominal | 0,5 hari | P1 |

### Implementation Ladder

```
Phase 1 (NOW — 1-2 minggu):
  MVP: kalkulator + dashboard + reminder
  Target: existing CatatOrder Bisnis users

Phase 2 (+2-3 minggu):
  Enhanced: PDF export, historis, deep-link CoreTax
  Target: SEO acquisition "cara hitung pajak UMKM 2026"

Phase 3 (+3-6 bulan):
  Partnership: bermitra dengan PJAP untuk e-Billing API
  Target: auto-generate kode billing

Phase 4 (+12-24 bulan):
  Become PJAP sendiri: PT, PKP, infra, seleksi DJP
  Target: full end-to-end tax compliance
```

### Positioning Statement

**"CatatOrder = satu-satunya app yang TAHU omzet kamu (dari pesanan harian), bisa bikin faktur pajak (XML), DAN hitung PPh UMKM kamu — semua dalam 1 app."**

---

## VALIDASI TERHADAP SCORING AWAL (dari 08-synthesis-final)

| Kriteria | Score Awal | Validated? | Evidence |
|----------|-----------|------------|----------|
| Market Size (3/5) | CONFIRMED | 542K WP PPh Final + 1,6M WP UMKM total. Bukan massive, tapi solid |
| WTP (5/5) | CONFIRMED | Regulatory mandate. PPh Final extended to 2029. Orang HARUS comply |
| Low Competition (4/5) | CONFIRMED→5/5 | ZERO competitor di intersection ini. Void zone 30M UMKM mikro |
| Unique Advantage (4/5) | CONFIRMED | CatatOrder sudah punya 80% data. e-Faktur XML sudah LIVE |
| Feasibility (5/5) | CONFIRMED | 7-10 hari MVP. Rule-based. Tidak perlu PJAP |
| Bleeding Edge (3/5) | CONFIRMED | Rule-based, bukan AI. Tapi NOBODY doing this = category creation |
| Impact (4/5) | CONFIRMED | 60% UMKM yang seharusnya comply TIDAK comply. Bisa unlock compliance |

**Revised score: 29/35** (naik dari 28 — Low Competition naik dari 4 ke 5 setelah deep dive konfirmasi ZERO competitor di intersection)

---

*Synthesis dari 4 research files, 100+ data points, 50+ sumber T1-T4.*
