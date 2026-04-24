# Deep Dive Research: Sistem Mie Gacoan — Analisis Komprehensif

> Riset mendalam tentang seluruh sistem operasional, teknologi, supply chain, dan strategi bisnis Mie Gacoan (PT Pesta Pora Abadi) — serta relevansinya untuk CatatOrder.
>
> **Tanggal riset:** 15 Maret 2026

---

## Daftar Isi

1. [Profil Bisnis](#1-profil-bisnis)
2. [Sistem Order & Customer Journey](#2-sistem-order--customer-journey)
3. [Wireless Calling System (Pager) — Detail Teknis](#3-wireless-calling-system-pager--detail-teknis)
4. [Self-Order QR Code](#4-self-order-qr-code)
5. [Model Antrian & Riset Akademis](#5-model-antrian--riset-akademis)
6. [Sistem Pembayaran](#6-sistem-pembayaran)
7. [Supply Chain & Produksi](#7-supply-chain--produksi)
8. [Menu Engineering & Pricing Strategy](#8-menu-engineering--pricing-strategy)
9. [Efisiensi Operasional (Rahasia Profitabilitas)](#9-efisiensi-operasional-rahasia-profitabilitas)
10. [Digital Infrastructure & Technology Stack](#10-digital-infrastructure--technology-stack)
11. [HR & Training System](#11-hr--training-system)
12. [Marketing & Branding Strategy](#12-marketing--branding-strategy)
13. [Kelemahan & Kritik](#13-kelemahan--kritik)
14. [Pelajaran & Relevansi untuk CatatOrder](#14-pelajaran--relevansi-untuk-catatorder)
15. [Sources](#15-sources)

---

## 1. Profil Bisnis

| Aspek | Detail |
|-------|--------|
| **Perusahaan** | PT Pesta Pora Abadi |
| **Didirikan** | 2016 |
| **CEO/Founder** | Anton Kurniawan |
| **Jumlah Outlet** | 130+ cabang di seluruh Indonesia (data terbaru) |
| **Omzet Tahunan** | Estimasi ~Rp3.6 triliun/tahun (seluruh cabang) |
| **Omzet per Outlet** | Cabang besar: hingga Rp2.97 miliar/bulan. Cabang biasa: ~Rp100 juta/hari |
| **Harga Menu** | Mulai Rp10 ribuan per porsi mie |
| **Target Pasar** | Pasar bawah hingga menengah, terutama anak muda |
| **Halal** | Ya — mie pedas halal no.1 di Indonesia |

### Status Franchise

**BUKAN franchise.** Mie Gacoan secara resmi menyatakan:

> "Selama ini kami tidak pernah membuka sistem franchise/kerjasama/mitra dalam bentuk apapun."

Semua 130+ outlet adalah **milik perusahaan 100%** (company-owned). PT Pesta Pora Abadi menguasai langsung seluruh sistem operasional. Pertumbuhan outlet sangat cepat karena manajemen pusat mengontrol penuh standar kualitas, supply chain, dan operasional.

### IPO

Tidak ada informasi publik tentang rencana IPO Mie Gacoan per Maret 2026.

---

## 2. Sistem Order & Customer Journey

### Alur Lengkap Pelanggan di Gerai (End-to-End)

```
MASUK GERAI
    │
    ▼
Staff tanya jumlah orang
    │
    ▼
Dapat PAGER (wireless calling system) + nomor meja
    │
    ▼
Duduk di meja yang ditunjuk
    │
    ▼
Scan QR CODE / BARCODE di meja (pakai kamera HP)
    │
    ▼
Menu digital muncul di browser HP
    │
    ▼
Pilih menu + level pedas (0-8) + jumlah + catatan khusus
    │
    ▼
Bayar langsung via QRIS / e-wallet dari HP
    │
    ▼
Pesanan otomatis masuk ke sistem dapur
    │
    ▼
PAGER BERGETAR + BUNYI saat makanan siap
    │
    ▼
Self-service: pelanggan ambil makanan sendiri di counter
    │
    ▼
Makan → Selesai → Keluar
```

### Metode Pemesanan yang Tersedia

1. **Self-Order via QR Code di meja** — Sistem terbaru, scan barcode → pilih menu → bayar dari HP
2. **Pesan di kasir (tradisional)** — Masih tersedia di beberapa cabang, antri → pilih menu → bayar di kasir
3. **Delivery via aplikasi** — GoFood, GrabFood, ShopeeFood
4. **Pre-order** — Fitur yang sedang dikembangkan di aplikasi internal

### Sistem Pemanggilan

- **Pager elektronik** — diberikan saat masuk, bergetar/bunyi saat pesanan siap
- **Self-service** — pelanggan ambil sendiri (bukan diantar pelayan)
- Mengurangi kebutuhan tenaga pelayan secara signifikan

---

## 3. Wireless Calling System (Pager) — Detail Teknis

### Cara Kerja

Wireless Calling System (WCS) yang digunakan Mie Gacoan bekerja dengan teknologi radio frequency:

| Komponen | Detail |
|----------|--------|
| **Frekuensi** | Radio Frequency <433MHz |
| **Identifikasi** | Setiap pager memiliki **kode biner unik** (misal nomor 1-20) |
| **Mekanisme** | Semua pager berada di frekuensi sama, tapi kode biner memastikan hanya pager yang dituju yang berbunyi |
| **Trigger** | Kasir/dapur menekan nomor spesifik di transmitter |
| **Notifikasi** | Pager **menyala + bergetar + bunyi** = pesanan siap diambil |
| **Jangkauan** | Mencakup seluruh area restoran |

### Alur Penggunaan Pager

1. Pelanggan masuk → staff memberikan pager dengan nomor tertentu
2. Pelanggan duduk di meja dan memesan via QR code
3. Pesanan masuk ke dapur
4. Saat makanan siap, dapur/kasir memicu pager melalui transmitter
5. Pager pelanggan bergetar + bunyi
6. Pelanggan menuju counter untuk mengambil makanan sendiri (self-service)
7. Pager dikembalikan setelah makan

### Manfaat WCS

- **Eliminasi panggilan manual** — tidak perlu pelayan memanggil nama/nomor
- **Efisiensi tenaga kerja** — kurangi kebutuhan pelayan
- **Pengalaman tertib** — pelanggan tidak perlu terus menunggu di counter
- **Riset di Mie Gacoan Veteran Semarang** menunjukkan WCS efektif mengurangi kerumunan di area pengambilan

---

## 4. Self-Order QR Code

### Sistem QR Code di Meja

Beberapa gerai Mie Gacoan telah mengimplementasikan sistem pemesanan mandiri via QR code untuk meminimalkan antrian kasir.

### Cara Penggunaan

1. **Duduk di meja** — setiap meja memiliki QR code/barcode yang tertempel
2. **Scan** — buka kamera HP atau QR scanner app → pindai barcode
3. **Menu digital** — menu lengkap muncul di browser HP (tidak perlu install app)
4. **Pilih pesanan** — pilih menu + jumlah + catatan khusus (misal: "no bawang", "extra cabe")
5. **Bayar** — langsung via QRIS / e-wallet (OVO, DANA, GoPay) dari halaman yang muncul
6. **Tunggu** — pesanan otomatis masuk ke dapur, pager akan bergetar saat siap

### Keuntungan

- **Zero queue di kasir** — pesan dan bayar dari meja
- **Akurasi pesanan** — pelanggan input sendiri, kurangi human error
- **Kecepatan** — pesanan langsung masuk ke kitchen display/printer
- **Cashless-ready** — terintegrasi dengan QRIS

### Kekurangan

- Tidak semua pelanggan terbiasa (terutama generasi tua)
- Butuh koneksi internet stabil di HP pelanggan
- Dikritik "ribet" oleh sebagian pelanggan (lihat bagian Kelemahan)

---

## 5. Model Antrian & Riset Akademis

### Karakteristik Antrian

Beberapa studi akademis telah menganalisis sistem antrian Mie Gacoan:

| Parameter | Detail |
|-----------|--------|
| **Tipe antrian** | Single Channel-Single Phase |
| **Disiplin antrian** | First In First Out (FIFO) |
| **Distribusi kedatangan** | Poisson distribution |
| **Waktu pelayanan** | Exponential distribution |
| **Fasilitas kasir** | 1 fasilitas, 2 karyawan |
| **Fasilitas dapur** | 1 fasilitas, 6 karyawan |

### Customer Journey dalam Simulasi

Simulasi antrian (Arena 14.0) menunjukkan flow:

```
Gateway (masuk) → Booking point (kasir) → Kitchen → Pick-up → Exit
```

### Temuan Riset

- Penambahan **1 pelayan saat peak hours** → kurangi waktu tunggu **35%** dan panjang antrian **40%**
- Bottleneck utama: **jumlah kasir** vs volume pelanggan
- Self-order QR code mengatasi bottleneck ini dengan mendistribusikan "kasir" ke setiap meja

### Studi Terkait

- Analisis Sistem Antrian Konsumen Mie Gacoan (ResearchGate, 2023)
- Simulasi Antrian Mie Gacoan Gresik menggunakan Arena 14.0 (R Discovery)
- Analisis Model Antrian Mie Gacoan Pancing Medan (Jurnal Konstanta)
- Digital Transformation: WCS Implementation Mie Gacoan Veteran Semarang (ICIE)

---

## 6. Sistem Pembayaran

### Metode yang Diterima

| Metode | Ketersediaan | Detail |
|--------|-------------|--------|
| **QRIS** | Semua cabang | Standar QR Bank Indonesia. Scan di kasir atau self-service di meja |
| **E-wallet** | Via QRIS | OVO, DANA, GoPay, ShopeePay, LinkAja |
| **Cash** | Semua cabang | Masih diterima untuk pelanggan yang belum cashless |
| **Kartu debit/kredit** | Terbatas | Tidak semua cabang, utamanya QRIS |

### Integrasi QRIS

- **QRIS** adalah metode pembayaran digital utama
- Mendukung semua e-wallet dan mobile banking yang terdaftar di Bank Indonesia
- Proses: staff/meja menampilkan QR → pelanggan scan → konfirmasi → selesai
- Transaksi **real-time**, notifikasi instan ke merchant dan pelanggan
- Promo khusus QRIS: diskon, cashback, loyalty program

### Insiden & Masalah

- **Double pembayaran QRIS** tercatat terjadi di Mie Gacoan Dramaga (Januari 2026) — pelanggan terdebit dua kali untuk satu transaksi
- Menunjukkan bahwa implementasi QRIS belum sepenuhnya bebas masalah

---

## 7. Supply Chain & Produksi

### Central Kitchen Model

Mie Gacoan menggunakan model **produksi terpusat (centralized production)** untuk menjamin konsistensi rasa di seluruh cabang:

```
VENDOR HULU (bahan baku)
    │
    ▼
SENTRAL PRODUKSI / REGIONAL DISTRIBUTION CENTER
    │  - Mie diproduksi semi-jadi
    │  - Bumbu rahasia diolah
    │  - Kemasan disiapkan
    │
    ▼
DISTRIBUSI KE OUTLET (daily untuk bahan segar)
    │
    ▼
DAPUR OUTLET
    │  - Final cooking (cepat, karena semi-finished)
    │  - Assembly dan plating
    │
    ▼
PENYAJIAN KE PELANGGAN
```

### Kategori Bahan Baku

| Kategori | Sumber | Frekuensi |
|----------|--------|-----------|
| **Bahan inti** (mie, bumbu rahasia, kemasan) | Sentral produksi pusat | Periodik |
| **Bahan segar** (sayur, cabai, supplements) | Supplier lokal / regional DC | **Harian** |
| **Semi-finished materials** | Sentral produksi | Periodik |

### Inventory Management

- **Forecasting** berbasis data historis penjualan (harian/mingguan/bulanan)
- **Just-in-time approach** — minimal stok mengendap di gudang outlet
- **Food waste mendekati nol** — perputaran bahan baku sangat cepat karena volume tinggi
- Daily delivery bahan segar menjamin freshness

### Vendor Strategy

- **Long-term partnerships** dengan supplier yang telah melalui seleksi ketat
- **Bulk ordering (economies of scale)** — volume besar → harga per unit lebih murah
- Kerjasama dengan **vendor hulu** untuk mendapatkan bahan baku semi-jadi
- Memprediksi supply changes dan price instability melalui relasi supplier yang stabil

### Keunggulan Kompetitif

- **Konsistensi rasa 100%** di semua cabang — karena centralized production
- **Waktu masak di outlet lebih cepat** — bahan sudah semi-jadi
- **Cost per unit rendah** — bulk production + economies of scale
- **Quality control terpusat** — standar bahan baku seragam

---

## 8. Menu Engineering & Pricing Strategy

### Struktur Menu

| Kategori | Item | Harga (Rp) | Peran | Margin |
|----------|------|------------|-------|--------|
| **Mie (core product)** | Mie Suit, Mie Hompimpa, Mie Gacoan | 10.000 - 12.000 | Traffic driver | **Rendah** (volume play) |
| **Dimsum (side dish)** | Udang Keju (3pcs), Udang Rambutan, Siomai Ayam | 9.000 - 12.000 | Cross-sell | **Lebih tinggi** |
| **Minuman (beverages)** | Es Teklek, Es Gobak Sodor, dll | 5.000 - 10.000 | Upsell / profit maker | **Margin tertinggi** |

### Level Pedas

Mie Gacoan menawarkan **8 level kepedasan (0-8)**:

- Level 0: Tidak pedas
- Level 1-2: Pedas ringan
- Level 3-4: Pedas sedang
- Level 5-6: Pedas
- Level 7-8: Sangat pedas (challenge level)

**Taktik:** Level pedas menciptakan engagement — orang suka tantangan, share di social media, ajak teman untuk "adu level". Ini adalah **viral loop bawaan** dari produk.

### Naming Strategy

Nama-nama menu menggunakan **permainan tradisional Indonesia** yang nostalgik dan playful:
- **Gacoan** — dari istilah kelereng terbaik
- **Hompimpa** — permainan suit tangan
- **Gobak Sodor** — permainan galah asin
- **Teklek** — sandal kayu tradisional

**Efek:** Memorable, shareable, unik → natural word-of-mouth marketing.

### Strategi Pricing

```
HARGA MIE MURAH (Rp10K) → tarik volume masif
    + DIMSUM (margin lebih tinggi) → cross-sell
    + MINUMAN (margin tertinggi) → upsell
    = TOTAL BASKET SIZE meningkat
    × VOLUME TRANSAKSI ribuan/hari
    = OMZET TRILIUNAN
```

- **Mie sebagai loss leader** — harga super terjangkau untuk menarik pelanggan
- **Minuman sebagai profit driver** — margin bisa 5-10x lipat dari mie
- **Dimsum sebagai complement** — pelanggan jarang pesan mie tanpa side dish

---

## 9. Efisiensi Operasional (Rahasia Profitabilitas)

### Formula Inti

```
Harga Murah (Rp10K) × Volume MASIF (ribuan porsi/hari/outlet) = Omzet Triliunan/tahun
```

### 7 Pilar Efisiensi

| # | Pilar | Detail |
|---|-------|--------|
| 1 | **Menu berbahan sejenis** | Semua base-nya mie — kurangi kompleksitas dapur, training sederhana |
| 2 | **Dapur & peralatan seragam** | Layout dan equipment identik di semua cabang → standarisasi operasional |
| 3 | **Training sederhana** | SOP ketat + Gacoan Academy (LMS) → karyawan produktif dalam waktu singkat |
| 4 | **Tenaga kerja efisien** | Self-service model → pelanggan ambil makanan sendiri, kurangi pelayan |
| 5 | **Operasional panjang** | Banyak cabang buka hingga **24 jam** → maksimalkan revenue per sqm |
| 6 | **Target pasar bawah-menengah** | Pasar terbesar di Indonesia → volume sangat besar, repeat purchase tinggi |
| 7 | **Perputaran kursi cepat** | Makan mie relatif cepat (~15-20 menit) → turnover rate tinggi |

### Cost Leadership Strategy

Mie Gacoan menerapkan strategi **Cost Leadership** — produksi barang dengan biaya serendah mungkin dengan kualitas relatif sama dibandingkan pesaing:

- **Semi-finished materials** → waktu produksi di outlet lebih singkat
- **Economies of scale** → biaya produksi per unit turun seiring volume naik
- **Bulk ordering dari vendor** → harga bahan baku lebih murah
- **Food waste mendekati nol** → perputaran sangat cepat, minim stok mengendap
- **Efisiensi tenaga kerja** → jumlah karyawan minimal per outlet berkat self-service dan WCS

### Metrik Operasional (Estimasi)

| Metrik | Estimasi |
|--------|----------|
| Porsi per hari per outlet | Ribuan porsi |
| Turnover kursi | ~15-20 menit per pelanggan |
| Waktu masak per porsi | Cepat (bahan semi-jadi) |
| Karyawan dapur per shift | ~6 orang |
| Karyawan kasir per shift | ~2 orang |

---

## 10. Digital Infrastructure & Technology Stack

### Overview Sistem Digital

| Sistem | Platform/Teknologi | Fungsi |
|--------|-------------------|--------|
| **Self-Order** | QR code di meja → menu digital (browser-based) | Pesan tanpa antri kasir |
| **Pager** | Wireless Calling System (RF 433MHz) | Notifikasi pesanan siap |
| **Payment** | QRIS (standar Bank Indonesia) | Pembayaran cashless |
| **Delivery** | GoFood, GrabFood, ShopeeFood | Online delivery |
| **LMS/Training** | Gacoan Academy (elearning.miegacoan.id) | Internal e-learning karyawan |
| **Mobile App** | GacoMie (Google Play, Flutter/Dart) | Lokator outlet terdekat |
| **Social Media** | TikTok + Instagram (100% penetration) | Marketing & branding |
| **POS** | Tidak diketahui publik (kemungkinan custom/proprietary) | Transaksi kasir |
| **Internal Ordering App** | Dalam pengembangan (SUS score 48→70) | Dine-in, delivery, pickup, pre-order |

### Aplikasi Internal Ordering

Mie Gacoan pernah mengembangkan aplikasi ordering sendiri:

- **Fitur:** Delivery, dine-in, pickup, dan **pre-order**
- **Usability awal:** SUS score **48 (poor)** — tidak user-friendly
- **Setelah iterasi (Agile Development):** SUS score naik ke **70 (acceptable)**
- **Catatan:** Peningkatan signifikan tapi masih belum "excellent" — menunjukkan tantangan UX

### GacoMie App (Google Play)

- **Nama:** GacoMie (Mi Gacoan Didekatmu)
- **Fungsi:** Mencari outlet Mie Gacoan terdekat
- **Tech stack:** Dart + Flutter
- **Status:** Tersedia di Google Play

---

## 11. HR & Training System

### Gacoan Academy (LMS)

- **Platform:** elearning.miegacoan.id
- **Nama:** Gacoan Academy
- **Fungsi:** Courses, sertifikasi, dan program training internal
- **Akses:** Internal karyawan (login required)
- **Konten:** SOP operasional, food safety, customer service, management

### Struktur Karyawan per Outlet

| Posisi | Tugas |
|--------|-------|
| **Kitchen Crew** | Menyiapkan bahan, memasak menu, menjaga kebersihan dapur |
| **Staff Restaurant** | Menyambut pelanggan, memberikan pager, membantu pemesanan |
| **Kasir** | Memproses pembayaran, mengoperasikan POS |
| **Quality Control** | Memastikan standar kualitas makanan |
| **Cleaning Staff** | Kebersihan area makan dan dapur |

### Training & Standardisasi

- Pelatihan **intensif** untuk semua karyawan baru
- Fokus: **SOP** yang sudah terbukti sukses
- Mencakup: manajemen operasional, strategi marketing, customer service
- Tujuan: **konsistensi** di seluruh outlet

### Tantangan HR

Riset di Mie Gacoan Jatiasih menunjukkan:
- Manajemen HR **belum optimal** dalam pengembangannya
- Kinerja karyawan belum mencapai standar yang ditetapkan
- Butuh **supervisi lebih ketat** terkait kepatuhan SOP
- Inkonsistensi layanan antar cabang masih menjadi masalah

---

## 12. Marketing & Branding Strategy

### Strategi Inti: FOMO + Viral + Harga Murah

Mie Gacoan menggunakan tiga pilar marketing utama:

#### 1. FOMO (Fear of Missing Out)
- **Antrian panjang = social proof** — pada awal pembukaan cabang baru, antrian sengaja dibiarkan sebagai "iklan gratis"
- Orang melihat antrian → penasaran → ikut antri → post di social media → viral loop

#### 2. Viral Marketing via Social Media
- **TikTok:** Konten "level pedas challenge", behind-the-scene dapur, mukbang
- **Instagram:** Food photography, promo, engagement dengan followers
- **User-generated content (UGC):** Pelanggan post sendiri tanpa dibayar — natural virality
- Riset: TikTok dan Instagram masing-masing mencapai **100% penetration** untuk brand awareness

#### 3. Harga Murah sebagai Magnet
- Rp10K per porsi mie → accessible untuk semua kalangan
- **Price anchoring** — harga terasa sangat murah dibanding kompetitor

### Influencer Marketing

- Influencer/food blogger memiliki **pengaruh positif signifikan** terhadap keputusan pembelian
- Baik secara parsial maupun simultan, social media marketing dan influencer marketing terbukti efektif
- Platform utama: TikTok > Instagram > Twitter

### RFM Analysis (Customer Segmentation)

Riset Digital Marketing Analysis di Jakarta menggunakan metode **RFM (Recency, Frequency, Monetary)** + **K-Means Clustering** untuk segmentasi pelanggan Mie Gacoan — menunjukkan pendekatan data-driven dalam marketing.

### Brand Identity

- **Positioning:** "Mie Pedas Halal No.1 di Indonesia"
- **Voice:** Playful, youthful, relatable (bahasa gaul)
- **Visual:** Warna merah-kuning (panas, pedas, energik)
- **Naming:** Referensi permainan tradisional Indonesia (nostalgia + keunikan)

---

## 13. Kelemahan & Kritik

### 1. Sistem Pemesanan "Ribet"

Sistem QR code self-order terbaru **dikritik pelanggan** di Detik Food:
- Pelanggan merasa proses scan → pilih → bayar dari HP terlalu banyak langkah
- Generasi tua kesulitan dengan teknologi
- Beberapa pelanggan lebih nyaman pesan langsung di kasir
- **Pelajaran:** Teknologi baru harus diiringi onboarding yang baik dan fallback tradisional

### 2. Inkonsistensi SOP Antar Cabang

- Standar layanan **tidak seragam** di semua cabang
- Beberapa cabang memiliki service quality yang baik, cabang lain tidak
- Pengawasan pusat terhadap kepatuhan SOP masih perlu ditingkatkan

### 3. HR Belum Optimal

- Riset di Jatiasih: kinerja karyawan belum memenuhi standar
- Turnover karyawan tinggi (umum di F&B industry)
- Training via LMS perlu diperkuat dengan supervisi lapangan

### 4. Usability Aplikasi Internal

- Skor SUS awal **48 (poor)** — jauh di bawah standar
- Setelah iterasi naik ke **70 (acceptable)** — membaik tapi belum excellent
- Menunjukkan tantangan UX dalam mengadaptasi digital ordering untuk pasar Indonesia

### 5. Insiden Pembayaran

- **Double payment QRIS** terjadi di Dramaga (Januari 2026)
- Pelanggan terdebit dua kali untuk satu transaksi
- Menunjukkan kerentanan sistem pembayaran digital

### 6. Masalah Perizinan

- Gerai di Ciruas, Serang **ditutup paksa** Satpol PP karena tidak memiliki izin operasional
- Ekspansi cepat kadang meninggalkan compliance issues

---

## 14. Pelajaran & Relevansi untuk CatatOrder

### Perbandingan Sistem

| Aspek | Mie Gacoan | CatatOrder | Analisis |
|-------|-----------|------------|----------|
| **Self-ordering** | QR code di meja → menu digital | **Link Toko** (/:slug → catalog → pesan) | CatatOrder sudah melakukan konsep serupa — pelanggan buka link, pilih menu, pesan. Bahkan lebih simple karena bisa diakses dari mana saja (tidak harus di meja) |
| **Digital menu** | Browser-based via QR scan | **Product catalog** dengan kategori, stock, availability | CatatOrder sudah punya fitur serupa + lebih kaya (stock tracking, HPP, cost analysis) |
| **QRIS payment** | QRIS di kasir + self-service di meja | **QRIS statis** di success page + live order page | CatatOrder sudah support QRIS. Model "Sudah Bayar" claim + seller verification cocok untuk UMKM |
| **Pre-order** | Fitur dalam pengembangan di app internal | **Preorder mode** sudah LIVE (default ON) | CatatOrder **ahead** of Mie Gacoan — pre-order sudah jadi fitur utama |
| **Pager/notifikasi** | Wireless Calling System (hardware) | **Realtime notification** (software) — toast + sound | CatatOrder menggunakan pendekatan software (lebih murah, tanpa hardware tambahan) |
| **Production list** | Tidak ada info publik | **Persiapan page** — aggregate items by delivery date | CatatOrder sudah punya production planning tool yang Mie Gacoan (skala besar) juga butuhkan |
| **Antrian** | Single channel FIFO, bottleneck di kasir | **Tidak ada antrian** — async ordering via link | Keunggulan inherent CatatOrder untuk UMKM — tidak ada queue management issue |
| **Central kitchen** | Centralized production → distribusi | N/A (UMKM = 1 dapur) | Tidak relevan untuk target market CatatOrder, tapi **Persiapan** page = mini production planning |
| **Customer data** | Tidak ada CRM publik | **Pelanggan** page — name, phone, order history, spending | CatatOrder memiliki CRM built-in yang Mie Gacoan tidak expose ke level outlet |
| **Analytics** | Tidak ada info publik | **Rekap** — daily/monthly metrics, AI insights, piutang aging | CatatOrder sudah punya analytics yang mungkin lebih detail dari yang tersedia per-outlet di Mie Gacoan |

### Key Takeaways untuk CatatOrder

#### 1. UX Sederhana = Kunci
Mie Gacoan's QR system dikritik "ribet". **Validasi** bahwa CatatOrder harus tetap menjaga simplicity di atas segalanya. Link toko harus bisa digunakan tanpa friction.

#### 2. Self-Service Model = Mengurangi Beban Operasional
Mie Gacoan menghemat tenaga pelayan dengan self-service. CatatOrder melakukan hal serupa untuk UMKM — pelanggan pesan sendiri via link, penjual tinggal proses pesanan.

#### 3. QRIS = Standar Pembayaran Digital Indonesia
Semua cabang Mie Gacoan pakai QRIS. CatatOrder sudah mendukung ini — arah yang tepat.

#### 4. Pre-order = Fitur yang Dibutuhkan Bahkan oleh Chain Besar
Mie Gacoan masih mengembangkan pre-order di app mereka. CatatOrder sudah punya ini LIVE. Ini adalah **competitive advantage** untuk target market katering/kue UMKM.

#### 5. Volume-Based Pricing Works
Mie Gacoan bukti bahwa "harga murah × volume besar" bisa menghasilkan triliunan. CatatOrder's **order quota model** (50 free + packs Rp15K) mengikuti logika serupa — murah per unit, untung dari volume.

#### 6. Consistency Through Standardization
Mie Gacoan menjaga konsistensi lewat centralized production. Untuk CatatOrder, konsistensi dijaga lewat **SOP yang embedded di product** — template order, product catalog, automated calculations.

#### 7. Training = Critical
Gacoan Academy (LMS) menunjukkan bahwa training karyawan penting bahkan untuk operasi sesederhana mie. Untuk CatatOrder, ini berarti **onboarding UX** harus sangat baik agar UMKM bisa self-serve tanpa pelatihan intensif.

#### 8. Realtime Notifications > Hardware Pager
CatatOrder's software-based notification (Supabase realtime + toast + sound) lebih cost-effective dan accessible dibanding hardware WCS. Ini advantage untuk UMKM yang tidak mau beli hardware tambahan.

---

## 15. Sources

### Sistem Order & QR Code
- [Cara Pesan Mie Gacoan 2025: Dine-in, Online & QR — Wigatos](https://wigatos.com/20677-cara-pesan-mie-gacoan/)
- [Mie Gacoan Pakai Sistem Pemesanan Terbaru, Malah Disebut Jadi Ribet — Detik Food](https://food.detik.com/info-kuliner/d-7023589/mie-gacoan-pakai-sistem-pemesanan-terbaru-malah-disebut-jadi-ribet)
- [Cara Scan Barcode Mie Gacoan — Kumparan](https://kumparan.com/berita-hari-ini/cara-scan-barcode-mie-gacoan-agar-transaksi-lebih-mudah-23YrXJFz8oK)
- [Cara Scan Barcode di Meja Mie Gacoan — AjakTeman](https://www.ajakteman.com/2025/08/cara-scan-barcode-di-meja-mie-gacoan.html)
- [Cara Pesan Mie Gacoan Makan di Tempat — Kumparan](https://kumparan.com/jendela-dunia/cara-pesan-mie-gacoan-makan-di-tempat-ada-yang-pakai-hp-25gXd9lWg41)

### Wireless Calling System & Antrian
- [Wireless Calling System Solusi Manajemen Antrian — Tantri](https://tantri.id/post/wireless-calling-system-solusi-manajemen-antrian-di-restoran)
- [WCS Rahasia Efisiensi Layanan Restoran — ESB](https://www.esb.id/id/inspirasi/wireless-calling-system)
- [Digital Transformation: WCS at Mie Gacoan Veteran Semarang — ICIE](https://proceeding.uingusdur.ac.id/index.php/icie/article/view/2585)
- [Analisis Sistem Antrian Konsumen Mie Gacoan — ResearchGate](https://www.researchgate.net/publication/375125858_ANALISIS_SISTEM_ANTRIAN_PADA_PROSES_PELAYANAN_KONSUMEN_DI_MIE_GACOAN_XYZ)
- [Modeling Analysis Queuing System Mie Gacoan — ResearchGate](https://www.researchgate.net/publication/393046145_Modeling_Analysis_and_Queuing_System_at_Mie_Gacoan_Restaurant)
- [Queue System Simulation Mie Gacoan Gresik — R Discovery](https://discovery.researcher.life/article/applied-of-the-simulation-of-the-queue-system-in-restaurant-mie-gacoan-branch-gresk-using-arena-14-0/d02d81ae4dc33d68bcadace01775f4db)
- [Analisis Model Antrian Mie Gacoan Medan — Jurnal Konstanta](https://ifrelresearch.org/index.php/konstanta-widyakarya/article/view/3521)

### Pembayaran & QRIS
- [Cara Bayar Mie Gacoan Pakai QRIS — Media Perbankan](https://www.mediaperbankan.com/2025/10/cara-mudah-dan-cepat-bayar-mie-gacoan-pakai-qris.html)
- [Mie Gacoan QRIS — Twitter/X Official](https://x.com/mie_gacoan/status/1760916363789631737)
- [Double Pembayaran QRIS Mie Gacoan Dramaga — Media Konsumen](https://mediakonsumen.com/2026/01/01/surat-pembaca/double-pembayaran-qris-di-mie-gacoan-dramaga)
- [QRIS di Mie Gacoan Era Baru Pembayaran — Mie Gacoan Kaltara](https://miegacoanprovkaltara.id/qris-di-mie-gacoan-era-baru-pembayaran/)

### Bisnis & Strategi
- [Membongkar Strategi Bisnis Mie Gacoan — UKM Indonesia](https://ukmindonesia.id/baca-deskripsi-posts/membongkar-strategi-bisnis-mie-gacoan-mie-pedas-nomor-satu-di-indonesia)
- [Mie Gacoan Omzet Triliunan — Malang Times](https://www.malangtimes.com/baca/3331338869/20260223/035000/mengintip-kesuksesan-bisnis-mie-gacoan-jualan-murah-tapi-tetap-untung-triliunan)
- [Strategi Marketing Gacoan: FOMO, Harga Murah, Antri — David Antonny](https://davidantonny.com/bisnis/strategi-pemasaran-mie-gacoan)
- [Bisnis Kontemporer Mie Gacoan — ResearchGate](https://www.researchgate.net/publication/365762328_BISNIS_KONTEMPORER_DI_BIDANG_KULINER_MIE_GACOAN)
- [Analisis Strategi Keunggulan Bersaing Mie Gacoan — ResearchGate](https://www.researchgate.net/publication/396232997_Analisis_Strategi_Keunggulan_Bersaing_Mie_Gacoan_Indonesia)
- [Strategi Sukses Mie Gacoan Omzet Melejit — Tugu Malang](https://tugumalang.id/strategi-sukses-mie-gacoan-terobosan-dahsyat-harga-terjangkau-omzet-melejit/)
- [Sistem Pengendalian Manajemen Mie Gacoan — Kompasiana](https://www.kompasiana.com/maryani1399929/666c74bded641542964288e2/sistem-pengendalian-manajemen-pada-mie-gacoan-menuju-keberhasilan-umkm-kuliner)

### Franchise & Model Bisnis
- [Update Franchise Mie Gacoan 2024 — Detik Finance](https://finance.detik.com/ekonomi-bisnis/d-7592028/update-franchise-mie-gacoan-2024-jangan-asal-daftar)
- [Franchise Mie Gacoan Modal Keuntungan — ESB](https://www.esb.id/id/inspirasi/franchise-mie-gacoan)
- [Franchise Mie Gacoan — OCBC](https://www.ocbc.id/id/article/2024/10/16/modal-franchise-mie-gacoan)
- [Business Model Canvas Mie Gacoan — Program IPOS](https://www.programipos.co.id/blog/contoh-business-model-canvas-mie-gacoan/)

### Supply Chain & Produksi
- [Pendekatan CDR Strategi Lokasi Mie Gacoan — Kompasiana](https://www.kompasiana.com/mulyadimulyadi8384/683b4e81c925c418f42c5562/pendekatan-cdr-dalam-strategi-lokasi-dan-kapasitas-operasional-mie-gacoan-untuk-meraih-daya-saing-di-industri-kuliner?page=2)
- [Analisis Kelayakan Bisnis Mie Gacoan — ejournal Sagita](https://ejournal.sagita.or.id/index.php/future/article/download/251/205/956)
- [Belajar Strategi Bisnis Mie Gacoan — Hops ID](https://www.hops.id/trending/29412128197/belajar-strategi-bisnis-trending-ala-mie-gacoan-bisa-menjual-produk-dengan-harga-ekonomis-tapi-tetap-berkualitas)

### Digital & Teknologi
- [Improving Mie Gacoan Online Ordering App SUS — ResearchGate](https://www.researchgate.net/publication/393590135_Improving_the_Mie_GACOAN_Online_Food_Ordering_Application_Using_the_System_Usability_Scale_SUS)
- [Mie Gacoan Digital Solution — Medium](https://medium.com/@anggralia10/unraveling-the-issue-of-mie-gacoan-optimization-long-queues-and-pt-pesta-pora-indonesias-digital-020687dcf9be)
- [Mie Gacoan Delivery App UX Case Study — Medium](https://medium.com/@albertfernando07/mie-gacoan-delivery-app-ux-case-study-efc59da5fd64)
- [Gacoan Academy LMS](https://elearning.miegacoan.id/login)
- [GacoMie App — Google Play](https://play.google.com/store/apps/details?id=com.mipedes.gacomie&hl=en_US)

### HR & Karyawan
- [Human Resource Management at Mie Gacoan Jatiasih — West Science](https://wsj.westsciences.com/index.php/wsshs/article/view/852)

### Marketing & Social Media
- [Viral Marketing Social Media Mie Gacoan Surabaya — Jurnal REJOSSE](https://jurnal.untag-sby.ac.id/index.php/rejosse/article/view/9005)
- [TikTok Brand Awareness Mie Gacoan Medan — ResearchGate](https://www.researchgate.net/publication/380406342_The_Use_of_Tiktok_in_Increasing_Brand_Awareness_Case_Study_on_Mie_Gacoan_Followers_in_Medan)
- [Digital Marketing RFM Analysis Mie Gacoan Jakarta — Academia](https://www.academia.edu/125131962/Digital_Marketing_Analysis_of_Mie_Gacoan_Customer_at_Jakarta_Using_RFM_and_K_Means_Clustering_Methode)
- [Mie Gacoan Millennials Viral Trends — Gandiwa Jurnal Komunikasi](https://journal.unindra.ac.id/index.php/gandiwa/article/view/3935)
- [Mie Gacoan Wikipedia](https://id.wikipedia.org/wiki/Mie_Gacoan)

### Menu & Harga
- [Menu Mie Gacoan Terbaru 2026 — Tokopedia](https://www.tokopedia.com/blog/menu-mie-gacoan-tvl/)
- [Daftar Menu Mie Gacoan Lengkap — Tempo](https://www.tempo.co/gaya-hidup/daftar-menu-mie-gacoan-terbaru-lengkap-dengan-harganya-1180615)
- [Menu Mie Gacoan Terbaru 2025 — IDN Times](https://www.idntimes.com/food/dining-guide/menu-mie-gacoan-terbaru-q9t01-00-cqkqh-938zsm)

---

*Dokumen ini disusun melalui web research pada 15 Maret 2026. Informasi mungkin berubah seiring waktu.*
