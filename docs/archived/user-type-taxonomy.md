# CatatOrder — User Type Taxonomy & Priority Matrix

> 75 tipe bisnis dipetakan → 5 kategori berdasarkan pola order → 4 segmen actionable. Peta lengkap siapa yang CatatOrder layani, pain apa yang di-solve, dan mana yang prioritas.

**Tanggal:** 2026-03-15
**Basis:** Reality capture 3 area (F&B, Produk/Jasa, B2B/Wholesale) — 186KB data
**Source:** `/reality/20260315-catatorder-user-types/`

---

## 1. LIMA KATEGORI BERDASARKAN POLA ORDER

75 tipe bisnis di-collapse ke 5 kategori berdasarkan CARA MEREKA TERIMA DAN PROSES ORDER — ini yang paling relevan untuk CatatOrder:

### Kategori 1: "PESAN-BIKIN-KIRIM" (Made-to-Order) — 28 tipe

```
FLOW:  Order masuk → produksi → delivery/pickup
MODE:  PREORDER
FIT:   ★★★★★ (current sweet spot CatatOrder)
```

| Tipe Bisnis | Jumlah | WA Order | PKP? | Tier Fit |
|-----------|--------|----------|------|----------|
| Katering rumahan harian | 150-200K | Dominan | Non-PKP | TIER 1 |
| Home baker kue custom | 200-500K | Dominan | Non-PKP | TIER 1 |
| Kue kering PO (Lebaran) | 100-300K | Sangat tinggi | Non-PKP | TIER 1 |
| Jasa rantangan | Ribuan | Sangat tinggi | Non-PKP | TIER 1 |
| Katering diet/sehat | 5-15K | Ya | Minoritas | TIER 2 |
| Dessert box/kekinian | 50-100K | Ya | Non-PKP | TIER 2 |
| Frozen food rumahan | Banyak | Ya | Non-PKP | TIER 2 |
| Sambal/bumbu homemade | Ribuan | Menengah | Non-PKP | TIER 3 |
| Oleh-oleh khas daerah | 100-200K | Menengah | Campuran | TIER 3 |
| Konveksi rumahan | 50-80K | >80% | Non-PKP | TIER 1 |
| Sablon kaos custom | 20-40K | >80% | Non-PKP | TIER 1 |
| Percetakan digital | >50K | >80% | Campuran | TIER 1 |
| Merchandise custom | 10-20K | >70% | Non-PKP | TIER 1 |
| Souvenir custom (wedding) | 15-25K | >90% | Non-PKP | TIER 1 |
| Hampers/gift box | 20-50K | >80% | Non-PKP | TIER 1 |
| Furniture custom | 50-100K | >60% | Non-PKP | TIER 2 |
| Gorden/soft furnishing | 10-20K | >70% | Non-PKP | TIER 2 |
| Kerajinan tangan | >700K | >60% | Non-PKP | TIER 2 |
| Batik/tenun custom | >200K perajin | <40% | Non-PKP | TIER 4 |
| Seller fashion online (PO) | 100K+ | 30-50% | Non-PKP | TIER 2 |
| Percetakan offset | 5-10K | >50% | Banyak PKP | TIER 2 |
| Konveksi menengah (B2B) | 10-20K | >50% | Campuran | TIER 3 |
| Desain grafis freelancer | 100K+ | >60% | Non-PKP | TIER 3 |
| Penjual tanaman hias | Bervariasi | Menengah | Non-PKP | TIER 3 |
| Florist | 5-10K | >80% | Non-PKP | TIER 2 |
| Skincare homemade | Puluhan ribu | >50% | Non-PKP | TIER 3 |
| Peternak ayam/telur | >1 juta | Menengah | Non-PKP | TIER 4 |
| Tukang/renovasi | >500K | >50% | Non-PKP | TIER 4 |

**Pain utama:** Pesanan tercecer, DP tracking, deadline management, spek custom berantakan

### Kategori 2: "ORDER HARIAN-SUPPLY-TAGIH" (Recurring Supply) — 18 tipe

```
FLOW:  Order masuk tiap hari → supply → tagih piutang
MODE:  PREORDER (daily recurring)
FIT:   ★★★★ (butuh invoice + piutang dashboard → tier Bisnis PKP)
```

| Tipe Bisnis | Jumlah | WA Order | PKP? | Tier Fit |
|-----------|--------|----------|------|----------|
| Supplier daging/ayam B2B | 5-15K | Sangat tinggi | **Banyak PKP** | TIER 1 |
| Supplier sayur/buah B2B | 10-30K | Sangat tinggi | Campuran | TIER 1 |
| Supplier bahan kering | 5-10K | Tinggi | Campuran | TIER 2 |
| Supplier bahan kue | Ribuan | Tinggi | Campuran | TIER 2 |
| Supplier minuman B2B | Ribuan | Menengah-Tinggi | Campuran | TIER 2 |
| Supplier frozen food B2B | 20-50K | Tinggi | Campuran | TIER 2 |
| Supplier es batu | 5-15K | Tinggi | Non-PKP | TIER 3 |
| Supplier kemasan makanan | Ribuan | Tinggi | Campuran | TIER 2 |
| Supplier pakan ternak | Ribuan | Tinggi | Banyak PKP | TIER 3 |
| Grosir makanan kemasan | 100-300K | Tinggi | Campuran | TIER 1 |
| Grosir sembako | 200-500K | Tinggi | Campuran | TIER 2 |
| Grosir pakaian | 50-150K | Tinggi | Campuran | TIER 2 |
| Grosir kosmetik | 10-30K | Tinggi | Campuran | TIER 2 |
| Grosir bahan bangunan | Ribuan | Tinggi | **Banyak PKP** | TIER 2 |
| Depot air galon | 78K | Tinggi | Non-PKP | TIER 1 |
| Katering corporate B2B | 10-30K | Tinggi | **Banyak PKP** | TIER 2 |
| Distributor FMCG kecil | Ribuan | Menengah-Tinggi | Banyak PKP | TIER 3 |
| Agen gas LPG / air mineral | Ribuan | Tinggi | Non-PKP | TIER 3 |

**Pain utama:** Rekap harian multi-buyer, piutang NET 7-90, harga dinamis, invoice formal, e-Faktur

### Kategori 3: "BOOKING-DP-EXECUTE" (Service Booking) — 10 tipe

```
FLOW:  Booking jadwal → DP → execute → pelunasan
MODE:  PREORDER
FIT:   ★★★ (butuh booking calendar)
```

| Tipe Bisnis | Jumlah | WA Order | PKP? | Tier Fit |
|-----------|--------|----------|------|----------|
| Rental alat (tenda/sound) | 20-40K | >80% | Non-PKP | TIER 1 |
| MUA (makeup artist) | 30-50K | >80% | Non-PKP | TIER 2 |
| Fotografer/videografer | 50-100K | >70% | Non-PKP | TIER 2 |
| Dekorasi acara | 20-40K | >70% | Non-PKP | TIER 2 |
| Katering acara/wedding | 30-50K | Ya | Campuran | TIER 2 |
| Wedding organizer | 10-20K | >80% | Non-PKP | TIER 3 |
| Event organizer | 5-15K | >70% | Campuran | TIER 3 |
| Servis AC/elektronik panggilan | 50-80K | >70% | Non-PKP | TIER 2 |
| Cleaning service panggilan | 10-30K | >70% | Non-PKP | TIER 4 |
| Tutor/les privat | 200-500K | >60% | Non-PKP | TIER 4 |

**Pain utama:** Double booking, DP tracking bulan sebelumnya, brief/spek berantakan

### Kategori 4: "DATANG-BELI-BAYAR" (Walk-in) — 14 tipe ← BUKAN TARGET

```
FLOW:  Customer datang → beli → bayar langsung
MODE:  DINE-IN / DEFAULT
FIT:   ★ (ini territory POS: Moka, Majoo, Pawoon)
```

| Tipe Bisnis | Jumlah | Kenapa Bukan CatatOrder |
|-----------|--------|------------------------|
| Warung makan biasa | 1.5-2M | Walk-in dominan, WA irrelevant |
| Warteg/warung nasi | 50-80K | Zero digital, WA irrelevant |
| Kedai kopi | ~462K | Sudah pakai POS |
| Resto UMKM kecil | 300-500K | Sudah pakai POS |
| PKL/street food | >725K | Zero digital |
| Food truck | 1-5K | Niche terlalu kecil |
| Franchise F&B | Banyak | Franchisor sediakan tools |
| Minuman kekinian | Banyak | Walk-in dominan |
| Toko kelontong | 3.94M | Walk-in retail |
| Apotek/toko obat | 17-20K | Sudah ada software apotek |
| Bengkel motor | >100K | Walk-in, WA <20% |
| Salon rumahan | 200K+ | Sudah ada booking app |
| Laundry | 100-150K | Sudah ada app laundry |
| Bakery retail | 50-100K | Walk-in dominan |

### Kategori 5: "MARKETPLACE/MULTI-CHANNEL" (Platform Seller) — 5 tipe ← BUKAN TARGET

```
FLOW:  Order dari platform → pack → kirim
MODE:  DEFAULT
FIT:   ★ (ini territory Jubelio, SIRCLO, Ginee)
```

| Tipe Bisnis | Kenapa Bukan CatatOrder |
|-----------|------------------------|
| Cloud kitchen | Dashboard platform sudah ada |
| Seller marketplace murni | Jubelio/Ginee territory |
| Distributor FMCG (pakai SFA) | Sudah ada Sales Force Automation |
| Franchise besar | Tools dari franchisor |
| Kursus/pelatihan online | Registration-based, bukan order |

### Ringkasan 5 Kategori

| Kategori | Tipe | CatatOrder Fit | Target? |
|----------|------|---------------|---------|
| 1. Pesan-Bikin-Kirim | 28 | ★★★★★ | **YA — current sweet spot** |
| 2. Order Harian-Supply-Tagih | 18 | ★★★★ | **YA — tier Bisnis PKP** |
| 3. Booking-DP-Execute | 10 | ★★★ | **YA — niche** |
| 4. Datang-Beli-Bayar | 14 | ★ | **TIDAK** |
| 5. Marketplace Seller | 5 | ★ | **TIDAK** |

**CatatOrder territory = Kategori 1 + 2 + 3 = 56 tipe bisnis.**
**Kategori 4 + 5 = 19 tipe = BUKAN CatatOrder. Jangan kejar.**

---

## 2. DISTRIBUSI TIER FIT (Across Kategori 1-3)

| Tier | Jumlah | Definisi |
|------|--------|---------|
| **TIER 1 — Perfect Fit** | 16 tipe | WA-heavy, order-based, pain match fitur CatatOrder sekarang |
| **TIER 2 — Good Fit** | 27 tipe | WA-heavy tapi perlu minor adjustment |
| **TIER 3 — Possible Fit** | 13 tipe | WA parsial, perlu fitur baru |
| **TIER 4 — Low Fit** | 19 tipe | Walk-in dominant, atau sudah ada tool spesifik |

### 16 Tipe TIER 1 (Perfect Fit)

| # | Tipe Bisnis | Kategori | Jumlah | Mode | WA Order | PKP? |
|---|-----------|---------|--------|------|----------|------|
| 1 | Katering Rumahan Harian | F&B | 150-200K | Preorder | Dominan | Non-PKP |
| 2 | Home Baker Kue Custom | F&B | 200-500K | Preorder | Dominan | Non-PKP |
| 3 | Kue Kering PO (Lebaran) | F&B | 100-300K | Preorder | Sangat tinggi | Non-PKP |
| 4 | Jasa Rantangan | F&B | Ribuan | Preorder | Sangat tinggi | Non-PKP |
| 5 | Depot Air Galon | F&B | 78K | Default | Tinggi | Non-PKP |
| 6 | Supplier Daging/Ayam B2B | F&B-B2B | 5-15K | Preorder | Sangat tinggi | **Banyak PKP** |
| 7 | Supplier Sayur/Buah B2B | F&B-B2B | 10-30K | Preorder | Sangat tinggi | Campuran |
| 8 | Grosir Makanan Kemasan | B2B | 100-300K | Preorder | Tinggi | Campuran |
| 9 | Konveksi Rumahan | Produk | 50-80K | Preorder | >80% | Non-PKP |
| 10 | Sablon Kaos Custom | Produk | 20-40K | Preorder | >80% | Non-PKP |
| 11 | Percetakan Digital | Produk | >50K | Default+PO | >80% | Campuran |
| 12 | Merchandise Custom | Produk | 10-20K | Preorder | >70% | Non-PKP |
| 13 | Souvenir Custom (Wedding) | Produk | 15-25K | Preorder | >90% | Non-PKP |
| 14 | Hampers/Gift Box | Produk | 20-50K | Preorder | >80% | Non-PKP |
| 15 | Rental Alat (Tenda/Sound) | Jasa | 20-40K | Preorder | >80% | Non-PKP |
| 16 | Furniture Custom | Produk | 50-100K | Preorder | >60% | Non-PKP |

---

## 2. TOP 10 PRIORITY (Weighted Score)

Scoring 7 dimensi: WA Intensity (25%), Pain Severity (20%), CatatOrder Fit (15%), Market Size (15%), WTP (10%), PKP Potential (10%), Competitive Gap (5%).

| Rank | Tipe Bisnis | Score | Segmen | ARPU Potensial |
|------|-----------|-------|--------|---------------|
| **1** | **Supplier Daging/Ayam B2B** | **4.15** | C (Bisnis) | Rp99-200K |
| **2** | **Hampers/Gift Box Custom** | **4.10** | B (Custom) | Rp39-200K |
| **3** | **Kue Kering PO Lebaran** | **4.10** | A (Katering) | Rp15-39K |
| **4** | **Grosir Makanan Kemasan** | **4.10** | C (Bisnis) | Rp39-99K |
| **5** | **Supplier Sayur/Buah B2B** | **4.00** | C (Bisnis) | Rp99-200K |
| 6 | Katering Rumahan Harian | 3.95 | A (Katering) | Rp0-39K |
| 7 | Home Baker Kue Custom | 3.95 | A (Katering) | Rp15-39K |
| 8 | Konveksi Rumahan | 3.90 | B (Custom) | Rp39-150K |
| 9 | Sablon Kaos Custom | 3.90 | B (Custom) | Rp39-150K |
| 10 | Percetakan Digital | 3.80 | B (Custom) | Rp39-300K |

**Insight:** Top 5 terbagi antara Segmen C/B2B (supplier, grosir = revenue play) dan Segmen A-B (hampers, kue = volume play).

---

## 3. EMPAT SEGMEN CATATORDER

### Segmen A: "Ibu Katering & Baker" — Volume Play

```
SIAPA:    Katering rumahan, home baker, kue kering PO, rantangan, depot air galon
JUMLAH:   500K-1M+ usaha
PAIN:     Pesanan WA tercecer, rekap manual, DP/piutang tidak terlacak
MODE:     Preorder
TIER:     Gratis / Isi Ulang Rp15K
ARPU:     Rp0-15K/bulan
PKP:      Non-PKP (hampir semua)
CHURN:    TINGGI (price-sensitive, seasonal)

CATATORDER SOLVE:
  ✅ Order WA tercecer → AI parse + dashboard
  ✅ Rekap manual → rekap otomatis harian/bulanan
  ✅ DP/piutang → payment tracking lunas/DP/belum
  ✅ Struk manual → struk digital via WA

CATATORDER BELUM SOLVE:
  ❌ Jadwal produksi otomatis
  ❌ Food cost / profit per order (field ada, belum dipakai)

POSITIONING:
  "Ga perlu lagi scroll WA buat cari siapa yang udah bayar"
```

### Segmen B: "Custom Order Maker" — Growth Play

```
SIAPA:    Konveksi, sablon, percetakan, merchandise, souvenir, hampers,
          florist, dekorasi, rental alat, furniture custom, gorden
JUMLAH:   200K-400K usaha
PAIN:     Spek custom beda tiap order, DP tracking, deadline management,
          approval desain, peak season chaos
MODE:     Preorder (dominan)
TIER:     Isi Ulang / Unlimited Rp39K
ARPU:     Rp15-39K/bulan
PKP:      Non-PKP mayoritas
CHURN:    SEDANG (lebih sticky karena daily use)

CATATORDER SOLVE:
  ✅ Order tercecer → dashboard terstruktur
  ✅ DP tracking → payment tracking
  ✅ Deadline → delivery date tracking
  ✅ Rekap → otomatis harian/bulanan

CATATORDER BELUM SOLVE:
  ❌ Custom order template per tipe (size chart, spek cetak, dll)
  ❌ Multi-alamat kirim (hampers)
  ❌ File/desain management
  ❌ Quotation/pricing engine

POSITIONING:
  "Satu tempat buat catat semua order custom — ga ada lagi yang kelewat
   atau salah kirim"
```

### Segmen C: "Supplier & Grosir" — Revenue Play (PKP Tier Target)

```
SIAPA:    Supplier daging/ayam, supplier sayur/buah, supplier bahan kering,
          supplier frozen food B2B, grosir makanan kemasan, grosir sembako,
          grosir pakaian, grosir bahan bangunan, katering corporate
JUMLAH:   100K-500K usaha
PAIN:     Rekap order HARIAN dari puluhan buyer via WA, piutang NET 7-90,
          harga dinamis, invoice formal + faktur pajak
MODE:     Preorder / Default
TIER:     Unlimited Rp39K → Bisnis Rp99K
ARPU:     Rp39-200K/bulan
PKP:      Campuran — yang omzet >Rp4.8M/tahun sudah PKP
CHURN:    RENDAH (jika solve piutang + invoice = sangat sticky)

CATATORDER SOLVE:
  ✅ Order WA dari banyak buyer → rekap otomatis
  ✅ Piutang → aging report (0-7, 8-14, 15-30, >30 hari)
  ✅ Customer database → history per buyer

CATATORDER BELUM SOLVE:
  ❌ Invoice formal (A4, nomor urut, jatuh tempo) ← HIGHEST PRIORITY
  ❌ e-Faktur / Coretax integration ← PKP TIER
  ❌ Dynamic pricing per customer (harga berubah harian)
  ❌ Retur/klaim tracking
  ❌ Auto-reconciliation
  ❌ Piutang dashboard per pelanggan (ada di report tapi belum di UI pelanggan)

POSITIONING:
  "Rekap semua order WA otomatis + lacak siapa yang belum bayar +
   cetak invoice untuk klien hotel/korporat"
```

### Segmen D: "Wedding & Event Vendor" — Niche Play

```
SIAPA:    MUA, fotografer, videografer, wedding organizer, event organizer,
          katering acara, dekorasi acara
JUMLAH:   100K-250K usaha
PAIN:     Kalender booking bentrok, DP tracking multi-klien bulan sebelumnya,
          multi-vendor coordination, brief via WA berantakan
MODE:     Preorder
TIER:     Unlimited Rp39K
ARPU:     Rp39K/bulan
PKP:      Non-PKP mayoritas
CHURN:    SEDANG (seasonal — musim nikah)

CATATORDER SOLVE:
  ✅ DP tracking → payment tracking
  ✅ Order details → dashboard

CATATORDER BELUM SOLVE:
  ❌ Booking calendar ← BUTUH FITUR BARU
  ❌ Brief/portfolio management
  ❌ Multi-vendor coordination

POSITIONING:
  "Booking calendar + DP tracker — ga pernah lagi double booking"
```

---

## 4. PAIN POINT TAXONOMY

### Sudah SOLVED oleh CatatOrder

| Pain Point | Segmen | Fitur |
|-----------|--------|-------|
| Order WA tercecer/terlewat | A, B, C, D | AI parse + order management |
| Rekap harian/bulanan manual | A, B, C | Rekap otomatis |
| DP/pembayaran tidak terlacak | A, B, C, D | Payment tracking (lunas/DP/belum) |
| Piutang aging | C (utama), A | Piutang aging report |
| Customer data tercecer | Semua | Customer database auto-create |
| Struk/konfirmasi manual | A, B | Struk digital via WA/PDF |

### Partially Solved

| Pain Point | Segmen | Status |
|-----------|--------|--------|
| Custom spesifikasi (size/warna) | B | Order form ada tapi belum dynamic per tipe |
| Deadline management | B | Tanggal ada tapi belum production timeline |
| Multi-alamat kirim | B (hampers) | Alamat ada tapi belum bulk management |
| Peak season volume | A (Lebaran), B | Sistem ada, perlu stress-test |

### NOT Solved — HIGH PRIORITY

| Pain Point | Segmen | Feasibility | Impact |
|-----------|--------|------------|--------|
| **Invoice formal** | C | Tinggi — 2 minggu build | SANGAT TINGGI — unlock tier Bisnis |
| **Dynamic pricing** | C (supplier) | Sedang — pricing engine | TINGGI — harga berubah harian |
| **Booking calendar** | D | Tinggi — calendar feature | TINGGI — tapi niche |
| **e-Faktur Coretax** | C (PKP) | Sedang — XML + PJAP | TINGGI — forcing function |
| **Custom order template** | B | Tinggi — template system | SEDANG |
| **Profit per produk** | A, B | **Rendah — field `cost_price` sudah ada di DB, tinggal wire ke report** | SEDANG |

### NOT Solved — LOW PRIORITY

| Pain Point | Segmen | Kenapa Low |
|-----------|--------|-----------|
| File/desain management | B (sablon, percetakan) | Di luar scope order management |
| Inventory management | C (grosir) | Butuh inventory module lengkap |
| Production scheduling | B (konveksi besar) | Butuh ERP-lite |
| Delivery routing | C (supplier F&B) | Butuh maps integration |
| Multi-outlet management | F&B chain | Sudah di-serve POS |

---

## 5. FEATURE-USER FIT MAP

| Fitur | Segmen A | Segmen B | Segmen C | Segmen D |
|-------|---------|---------|---------|---------|
| **EXISTING** | | | | |
| Link toko | ★★ | ★★★ | ★★ | ★★ |
| AI parse WA order | ★★★★★ | ★★★★★ | ★★★★★ | ★★★ |
| Payment tracking | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★★ |
| Struk digital | ★★★★ | ★★★★ | ★★★ | ★★★ |
| Rekap harian/bulanan | ★★★★★ | ★★★★ | ★★★★★ | ★★★ |
| AI analysis | ★★★ | ★★★ | ★★★★ | ★★ |
| Piutang aging | ★★★★ | ★★★ | ★★★★★ | ★★★ |
| Customer database | ★★★★ | ★★★★ | ★★★★★ | ★★★★ |
| Mode Preorder | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ |
| Mode Dine-in | ★ | — | — | — |
| **PLANNED** | | | | |
| Invoice formal | ★ | ★★ | ★★★★★ | ★★ |
| e-Faktur | — | — | ★★★★★ | — |
| Reconciliation | ★ | ★ | ★★★★★ | ★ |
| **POTENTIAL NEW** | | | | |
| Dynamic pricing | — | ★ | ★★★★★ | — |
| Booking calendar | — | ★ | — | ★★★★★ |
| Custom order template | ★ | ★★★★★ | ★ | ★ |
| Profit per produk | ★★★ | ★★★ | ★★★★ | ★ |

**Insight:** Fitur existing sudah sangat fit untuk Segmen A & B. Segmen C butuh invoice + e-Faktur (development priority). Segmen D butuh booking calendar (separate opportunity).

---

## 6. STRATEGI PRIORITAS

### Apa yang Harus Dilakukan (Urut)

```
SEKARANG (0-2 minggu):
  1. Aktifkan cost_price → profit per produk di rekap
     (field sudah ada di DB, tinggal wire — low effort, high value semua segmen)
  2. Tambah filter "Belum Lunas" di halaman pelanggan
     (data sudah ada, tinggal filter — unlock Segmen C piutang dashboard)

BULAN 1 (jika validasi PKP positif):
  3. Build invoice formal (A4, nomor urut, PPN, jatuh tempo)
     → LAUNCH tier Bisnis Rp99K → unlock Segmen C

BULAN 2-3:
  4. e-Faktur XML export → strengthen tier Bisnis
  5. Custom order template system → strengthen Segmen B

BULAN 4+:
  6. Booking calendar → explore Segmen D
  7. Dynamic pricing → deepen Segmen C
  8. PJAP partnership + auto-reconciliation → scale tier Bisnis
```

### Revenue Projection per Segmen

| Segmen | Target Users (Y1) | ARPU | MRR Contribution |
|--------|-------------------|------|-----------------|
| A (Katering) | 2.000 | Rp15K | Rp30M (volume) |
| B (Custom) | 500 | Rp39K | Rp19.5M (growth) |
| C (Bisnis) | 200 | Rp150K | Rp30M (revenue) |
| D (Event) | 100 | Rp39K | Rp3.9M (niche) |
| **Total** | **2.800** | | **Rp83.4M MRR = Rp1B ARR** |

Segmen A dan C contribute SAMA ke revenue meskipun Segmen A punya 10x lebih banyak user — karena ARPU Segmen C 10x lebih tinggi.

---

## 7. QUICK WIN: PROFIT PER PRODUK

**Yang paling mudah diimplementasi SEKARANG:**

CatatOrder sudah punya `cost_price` di tabel `products` tapi TIDAK dipakai di report. Tinggal:
1. Tampilkan input HPP di halaman produk (sudah ada field-nya)
2. Hitung profit = revenue - (qty × cost_price) di rekap
3. Tampilkan margin indicator per produk (hijau >50%, kuning 30-50%, merah <30%)

**Impact:** Semua segmen (A, B, C) dapat value dari ini. Tidak perlu tier baru. Bisa jadi differentiator vs semua competitor (tidak ada yang punya di price point ini).

**Effort:** 1-3 hari.

---

## 8. VALIDASI YANG DIBUTUHKAN

### Primary Research (Sebelum Build Fitur Baru)

| # | Apa | Target | Metode | Waktu |
|---|-----|--------|--------|-------|
| 1 | Pain point validation per segmen | 10-15 bisnis per Segmen A, B, C | WA call 30 menit | 2 minggu |
| 2 | WTP untuk tier Bisnis Rp99K | 20-30 supplier/grosir B2B | Tanya langsung | 2 minggu |
| 3 | Channel order B2B (WA vs lain) | 20-30 bisnis B2B | Tanya langsung | 2 minggu |
| 4 | Excel sebagai "competitor" | 100+ UMKM | Survey online | 1 minggu |
| 5 | Cohort analysis user existing | Internal data CatatOrder | Analytics | 1 hari |
| 6 | Coretax pain assessment | 5 konsultan pajak UMKM | WA call | 1 minggu |

**#5 bisa dilakukan HARI INI** — cek data internal: siapa user paling aktif? Tipe bisnis apa? Berapa yang bayar? Ini jawab banyak pertanyaan tanpa perlu riset external.

---

## 9. BLIND SPOTS TERSISA

| Blind Spot | Signifikansi | Cara Jawab |
|-----------|-------------|-----------|
| Jumlah pasti bisnis yang AKTIF terima order via WA (bukan hanya komunikasi) | SANGAT TINGGI | Survey primer |
| WTP sebenarnya per segmen | SANGAT TINGGI | Wawancara + pricing test |
| Churn rate tools order management UMKM | TINGGI | Analisis data internal + benchmark |
| Berapa yang pakai Excel sebagai "order management" | SANGAT TINGGI | Survey primer |
| Conversion free → paid CatatOrder actual | TINGGI | Data internal |
| Breakdown PKP per tipe bisnis | TINGGI | Tidak ada data publik |

---

**Dokumen ini berdasarkan 186KB data dari 3 file riset (75 tipe bisnis), scoring 7 dimensi, dan cross-reference dengan 8 reality captures sebelumnya.**
**Tanggal: 2026-03-15**
**Source:** `/reality/20260315-catatorder-user-types/`
