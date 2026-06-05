# Problem-to-Rekap Data Mapping

> Analisis mendalam: Dari 87 masalah UMKM, masalah mana yang bisa diselesaikan/dibantu oleh fitur rekap, dan data apa yang dibutuhkan.

---

## Metodologi

Untuk setiap masalah dari `umkm-problem.md` (12 kategori, 87 masalah), dilakukan evaluasi:
1. **Apakah masalah ini bisa diselesaikan (fully/partially) melalui data/rekap?**
2. **Data field atau metrik apa yang dibutuhkan?**
3. **Bagaimana mekanisme: data → insight → aksi → masalah berkurang?**
4. **Prioritas:** Critical (kebutuhan harian), Important (mingguan), Nice-to-have (bulanan)

Konteks: CatatOrder v2.6.0 sudah memiliki data pesanan (items, total, paid_amount, status, delivery_date, source), pelanggan (name, phone, total_orders, total_spent), produk (name, price, stock, category, is_available), dan rekap harian/bulanan (revenue, payment breakdown, top items, top customers, daily breakdown).

---

## Part 1: Masalah yang Langsung Bisa Diselesaikan oleh Rekap (23 masalah)

| Kode | Masalah | Data Rekap yang Dibutuhkan | Bagaimana Membantu | Prioritas |
|------|---------|---------------------------|-------------------|-----------|
| **B1** | 98% UMKM tidak melakukan pembukuan — transaksi hanya di ingatan/kertas | Rekap harian otomatis: total pesanan, revenue, payment breakdown, daftar transaksi | Setiap pesanan otomatis tercatat. Rekap harian = pembukuan harian tanpa effort. Owner cukup buka 1 halaman untuk lihat semua transaksi hari itu | Critical |
| **B2** | 83% mencampur keuangan pribadi dan bisnis — laba/rugi tidak diketahui | Revenue bisnis terpisah: total pendapatan, terkumpul, piutang. Tren bulanan | Rekap menampilkan angka bisnis yang terpisah dari rekening pribadi. Owner bisa lihat "uang bisnis" vs "uang pribadi" karena semua transaksi bisnis tercatat | Critical |
| **B4** | Cash flow rapuh — piutang macet 30-90 hari | **Piutang outstanding:** total belum bayar, daftar pesanan belum lunas beserta umur piutang (aging), nama pelanggan + nominal. **Collection rate:** % terkumpul vs total | Owner lihat siapa yang belum bayar dan sudah berapa lama. Bisa langsung kirim pengingat WA. Rekap harian sudah tampilkan belum bayar, tapi perlu aging analysis | Critical |
| **B5** | Tidak ada proyeksi arus kas — selalu reaktif terhadap kekurangan dana | **Tren revenue harian/mingguan** (sudah ada di daily breakdown). **Rata-rata pendapatan harian.** **Proyeksi revenue minggu/bulan depan** berdasarkan tren + pesanan terjadwal (delivery_date di masa depan) | Owner bisa antisipasi kapan pendapatan turun/naik. Delivery date yang sudah di-book = revenue terjadwal yang bisa diprediksi | Important |
| **B7** | Inventaris manual — overstock atau stockout | **Stok terjual per produk per hari.** **Velocity produk** (rata-rata terjual/hari). **Stok sisa saat ini.** **Alert produk hampir habis** | Owner tahu produk mana yang harus di-restock besok. Velocity membantu hitung kebutuhan bahan baku. Data sudah ada di top items, perlu ditambah velocity + stock alert | Critical |
| **B8** | Tidak ada laporan laba/rugi periodik | **Laporan bulanan:** total revenue, total terkumpul, perbandingan bulan lalu (growth %). Revenue per produk, revenue per pelanggan | Rekap bulanan sudah memberikan gambaran performa bisnis. Belum ada sisi "biaya/pengeluaran", tapi sisi revenue sudah lengkap. Owner minimal tahu omzet aktual | Critical |
| **B9** | Margin 5-15% habis tergerus biaya tersembunyi yang tidak dicatat | **Gap revenue vs collected** (total pesanan vs uang masuk). **Diskon total yang diberikan.** **Pesanan dibatalkan** (cancelled count + nilai) — ini "biaya tersembunyi" yang jarang disadari | Owner lihat berapa banyak uang yang "hilang" dari diskon dan pembatalan. Gap revenue-collected memperlihatkan piutang yang belum tertagih | Important |
| **D3** | Pesanan WA manual — 15-30% pesanan hilang | **Sumber pesanan** (manual vs order_link vs whatsapp) per hari. **Jumlah pesanan masuk per jam** (peak hours) | Rekap menampilkan dari mana pesanan datang. Owner tahu apakah link toko efektif. Data peak hours membantu siapkan kapasitas | Critical |
| **D4** | Tidak ada integrasi pencatatan, inventaris, keuangan — data silo | **Dashboard terpadu:** pesanan + stok + pembayaran + pelanggan dalam 1 rekap | Satu halaman rekap sudah menggabungkan data pesanan, produk terlaris, pembayaran, dan pelanggan. Menghapus data silo | Critical |
| **D5** | Tidak ada data historis penjualan terstruktur — tidak bisa analisis tren | **Tren harian** (daily breakdown sudah ada). **Tren mingguan.** **Perbandingan period-over-period** (sudah ada: 7 hari terakhir, bulan lalu). **Seasonality pattern** (hari apa paling ramai) | Data historis terbentuk otomatis dari setiap pesanan. AI analysis sudah memanfaatkan perbandingan. Perlu ditambah: pola hari dalam seminggu, tren mingguan | Important |
| **D6** | 60% transaksi masih tunai — sulit dicatat | **Breakdown metode pembayaran.** **% digital vs tunai** (bisa diturunkan dari source: order_link biasanya QRIS, manual biasanya tunai) | Rekap menampilkan status pembayaran. Owner bisa lihat seberapa besar porsi pembayaran digital. Mendorong adopsi QRIS | Important |
| **E5** | Tidak ada CRM/database pelanggan — repeat purchase kebetulan | **Pelanggan teratas** (sudah ada). **Pelanggan baru vs returning** per periode. **Frekuensi pembelian pelanggan.** **Customer lifetime value.** **Pelanggan yang sudah lama tidak pesan (churn risk)** | Owner tahu siapa pelanggan terbaik dan siapa yang mulai menjauh. Bisa kirim WA follow-up ke pelanggan yang sudah lama tidak pesan. Top customers sudah ada, perlu returning ratio + churn detection | Critical |
| **F5** | Manajemen pesanan manual — kesalahan dan keterlambatan | **Status pesanan real-time:** berapa baru, diproses, dikirim, selesai (sudah ada). **Pesanan terlambat** (delivery_date < hari ini tapi status belum done). **Rata-rata waktu proses** (created_at → done timestamp) | Owner lihat bottleneck: berapa pesanan menumpuk di status tertentu. Alert pesanan terlambat membantu prioritas. Lead time rata-rata membantu set ekspektasi pelanggan | Critical |
| **G6** | Tidak ada visibilitas stok bahan baku dan produk jadi | **Stok produk saat ini** (sudah ada di products). **Produk yang mendekati habis.** **Prediksi kapan stok habis** berdasarkan velocity penjualan | Owner tahu kapan harus belanja bahan baku. Prediksi habis stok = perencanaan pembelian. Velocity sudah bisa dihitung dari top items data | Critical |
| **G8** | Tidak ada tracking pengiriman — tidak bisa update pelanggan | **Pesanan per status** (sudah ada). **Pesanan yang sedang dikirim** (status=shipped). **Order completion rate** | Rekap menampilkan berapa pesanan masih dalam proses. Owner bisa proaktif update pelanggan via WA | Important |
| **A1** | 77,5% UMKM tidak punya laporan keuangan standar — gagal ajukan kredit | **Laporan bulanan berformat standar:** total omzet, jumlah transaksi, rata-rata transaksi, trend pertumbuhan, konsistensi pendapatan. **Laporan kumulatif** (3/6/12 bulan) | Rekap bulanan yang konsisten = bukti kelayakan usaha. Bank/fintech bisa lihat omzet konsisten. Perlu format "Laporan Keuangan" yang bisa di-download/share untuk pengajuan kredit | Nice-to-have |
| **A8** | Tidak ada revenue-based financing yang bisa diakses tanpa agunan | **Konsistensi revenue** (coefficient of variation bulan ke bulan). **Growth rate.** **Customer retention rate.** **Average order value trend** | Data transaksi historis yang konsisten = fondasi untuk revenue-based credit scoring. Ini data yang dibutuhkan fintech untuk assess risiko tanpa agunan | Nice-to-have |
| **J4** | Tidak ada credit history formal — tidak ada credit scoring | **Transaction history terstruktur:** jumlah transaksi/bulan, total omzet/bulan, payment collection rate, jumlah pelanggan aktif, rata-rata pesanan. **Minimal 3-6 bulan data** | Data pesanan CatatOrder = proxy credit history. Menunjukkan bahwa bisnis aktif, menghasilkan revenue, dan melayani pelanggan nyata | Nice-to-have |
| **B3** | Harga jual berdasarkan intuisi — bukan HPP | **Revenue per produk** (sudah ada). **Qty terjual per produk.** **Harga rata-rata per produk.** **Kontribusi % produk terhadap total revenue** | Owner lihat produk mana yang paling menguntungkan. Jika ada data HPP (input manual), bisa hitung margin per produk. Saat ini bisa bandingkan harga jual vs revenue contribution | Important |
| **B6** | Tidak ada pemisahan biaya tetap dan variabel — tidak bisa hitung break-even | **Revenue harian rata-rata.** **Hari operasional per bulan.** **Revenue minimum per hari untuk BEP** (jika biaya tetap diinput) | Saat ini rekap hanya sisi revenue. Jika owner input biaya tetap bulanan (sewa, gaji), rekap bisa tampilkan: "Kamu perlu Rp X/hari untuk nutup biaya tetap, hari ini sudah Rp Y" | Important |
| **E6** | CAC digital terlalu mahal untuk margin UMKM | **Sumber pesanan breakdown** (order_link vs manual vs WA). **Customer acquisition cost** jika ada data spend. **Organic vs paid customer ratio** | Owner lihat berapa banyak pelanggan datang dari link toko (gratis) vs dari mana lagi. Mendorong optimasi channel gratis (WA status, IG bio) vs paid ads | Important |
| **H6** | UMKM tidak memahami kewajiban perpajakan (PPh Final 0.5%) | **Total omzet kumulatif tahun berjalan.** **Estimasi pajak** (0.5% dari omzet jika < Rp500juta). **Alert threshold** saat mendekati batas omzet | Owner tahu berapa omzet kumulatifnya dan berapa pajak yang harus disiapkan. Simple alert: "Omzet tahun ini sudah Rp X, siapkan pajak Rp Y" | Nice-to-have |
| **K4** | Data UMKM nasional tidak akurat — pemerintah butuh data real-time | **Aggregate anonymized data:** jumlah transaksi, rata-rata omzet per segmen, produk populer per wilayah, tren pertumbuhan UMKM | Bukan untuk individual rekap, tapi data CatatOrder secara agregat bisa menjadi sumber data UMKM yang akurat dan real-time untuk pemerintah | Nice-to-have |

---

## Part 2: Masalah yang Partially Addressable oleh Rekap (19 masalah)

| Kode | Masalah | Data Rekap yang Bisa Berkontribusi | Bagaimana Membantu (Partial) | Mengapa Hanya Partial | Prioritas |
|------|---------|-----------------------------------|-----------------------------|-----------------------|-----------|
| **A2** | 60-70% pengajuan kredit ditolak — tidak ada agunan | Laporan transaksi konsisten = bukti performa usaha alternatif | Data transaksi bisa jadi "soft collateral" — bukti bisnis jalan tanpa agunan fisik | Tetap butuh perubahan kebijakan bank untuk terima data digital sebagai pengganti agunan | Nice-to-have |
| **A6** | Modal kerja habis untuk operasional — tidak sisa untuk investasi | **Cash flow visibility:** revenue vs collected, tren pendapatan, proyeksi | Owner bisa lihat timing cash flow dan rencanakan investasi. Tapi rekap tidak bisa menambah modal | Masalah fundamental: margin terlalu tipis, bukan visibility | Important |
| **A7** | KUR prosedur 15-30 hari, 8-12 dokumen | Laporan keuangan otomatis yang memenuhi sebagian persyaratan dokumen KUR | Rekap bisa generate "laporan keuangan" yang dibutuhkan KUR, mengurangi beban dokumentasi | Masih butuh dokumen lain (NIB, NPWP, dll) yang di luar scope rekap | Nice-to-have |
| **C4** | Pelaku UMKM menjalankan semua fungsi sendiri — kualitas turun | **Automated reporting** mengurangi beban fungsi "keuangan". **Quick insights** menggantikan analisis manual | Rekap otomatis + AI analysis menghilangkan 1 dari banyak fungsi yang harus dikerjakan sendiri | Masih butuh bantuan di fungsi lain (produksi, pemasaran, logistik) | Important |
| **C5** | Tidak ada SOP — bisnis berhenti kalau pemilik tidak hadir | **Data pesanan dan rekap bisa diakses siapa saja** yang diberi akses. **Pola operasional** (jam sibuk, volume tipikal) terdokumentasi | Rekap menjadi "dokumentasi operasional" — orang lain bisa lihat pola bisnis. Tapi bukan SOP lengkap | Butuh fitur multi-user access + SOP builder | Important |
| **C7** | Literasi digital rendah — hanya 23% pakai tools digital | Rekap yang **sangat sederhana** dan auto-generated = adopsi digital tanpa learning curve | Owner "menggunakan tools digital" tanpa sadar — cukup buka 1 halaman | Masalah lebih luas dari sekedar rekap — butuh ekosistem digital yang ramah | Critical |
| **C8** | Mindset subsistence — tidak berorientasi pertumbuhan | **Growth metrics:** pertumbuhan bulan ke bulan, target vs aktual, "bulan ini naik X% dari bulan lalu" | Melihat angka pertumbuhan bisa mengubah mindset: "Ternyata bisnis saya tumbuh 20%!" — motivasi untuk berkembang | Perubahan mindset butuh lebih dari data — butuh mentoring, komunitas, role model | Important |
| **D1** | 88% UMKM sepenuhnya manual — tidak adopsi teknologi | Rekap otomatis = **pintu masuk adopsi digital**. Nilai langsung terlihat tanpa learning curve | Jika UMKM mulai dari catat pesanan → langsung dapat rekap, mereka merasakan manfaat digital | Adopsi teknologi secara keseluruhan butuh lebih dari 1 app | Important |
| **D2** | Solusi SaaS dirancang untuk korporat — tidak cocok UMKM mikro | Rekap yang **sederhana, bahasa Indonesia, gratis** = counter-example | CatatOrder sudah dirancang untuk UMKM mikro. Rekap harus tetap sederhana — jangan tambah fitur yang membingungkan | Ini tentang seluruh ekosistem SaaS, bukan hanya CatatOrder | Critical |
| **E1** | 90% UMKM hanya jual lokal radius <10km | **Sumber pesanan** (order_link = bisa dari mana saja). **Lokasi pelanggan** (jika ada data area) | Link toko memperluas jangkauan. Rekap menampilkan berapa pesanan dari link toko vs manual = bukti jangkauan diperluas | Ekspansi pasar butuh lebih dari link — butuh logistik, pemasaran, distribusi | Important |
| **E8** | Kualitas produk tidak konsisten antar batch | **Feedback implisit:** produk yang di-repeat order vs yang hanya dibeli sekali. **Cancel rate per produk** | Data repeat purchase per produk = proxy kualitas. Produk yang tidak pernah di-reorder mungkin ada masalah kualitas | Konsistensi produksi butuh standarisasi resep/proses, bukan hanya data | Nice-to-have |
| **E9** | UMKM tidak bisa buat konten marketing | **Data produk terlaris + testimoni implisit** (repeat customer) bisa jadi bahan konten | AI bisa generate caption marketing dari data: "Nasi Box Ayam — sudah 500+ porsi terjual bulan ini!" | Content creation butuh visual (foto/video) yang di luar scope rekap | Nice-to-have |
| **F2** | Tidak ada quality control — cacat baru ketahuan dari komplain | **Pesanan dibatalkan per produk.** **Retur rate** (jika dicatat). **Penurunan order produk tertentu** | Anomali data (tiba-tiba produk X tidak laku, atau banyak cancel) bisa jadi signal masalah kualitas | QC butuh proses produksi terstandar, bukan hanya data output | Nice-to-have |
| **F3** | Kapasitas produksi terbatas — tidak bisa scale saat musiman | **Pola musiman:** volume pesanan per minggu/bulan selama setahun. **Peak day detection.** **Advance orders** (delivery_date di masa depan) | Owner bisa antisipasi lonjakan (Lebaran, Natal) dari data historis. Pesanan terjadwal = early warning | Scale-up kapasitas butuh investasi peralatan/SDM, bukan hanya prediksi | Important |
| **G1** | Bahan baku beli eceran — 20-40% lebih mahal dari grosir | **Volume produk terjual per periode** = kebutuhan bahan baku yang bisa diprediksi | Jika tahu akan jual 1000 Nasi Box bulan depan, bisa beli bahan grosir. Rekap + proyeksi = dasar pembelian bulk | Butuh akses ke supplier grosir dan modal untuk bulk purchase | Important |
| **G5** | Ketergantungan satu pemasok — rentan fluktuasi | **Data historis volume pembelian** (tidak ada di CatatOrder saat ini, tapi bisa diturunkan dari volume produk terjual) | Mengetahui volume kebutuhan membantu negosiasi dengan multiple supplier | Butuh marketplace supplier atau jaringan — di luar scope | Nice-to-have |
| **H1** | 67% UMKM informal — tidak punya NIB/NPWP | **Bukti usaha aktif** dari data transaksi. **Laporan omzet** untuk pendaftaran OSS | Data transaksi konsisten bisa mempermudah proses formalisasi — bukti bahwa usaha ini nyata | Formalisasi butuh NIB, NPWP, akta — proses birokrasi di luar scope | Nice-to-have |
| **I5** | Tidak ada business continuity plan | **Baseline operasional:** volume normal, revenue tipikal, peak days, customer base. **Alert anomali** | Data baseline membantu recovery setelah gangguan: "Biasanya kamu dapat 15 pesanan/hari, hari ini baru 3 — ada yang salah?" | BCP butuh rencana cadangan fisik (supplier alternatif, backup peralatan) | Nice-to-have |
| **I7** | Ketergantungan satu produk/jasa — tidak ada diversifikasi | **Revenue concentration:** % revenue dari top 1 produk. **Product diversity index.** **Alert jika 1 produk > 70% revenue** | Owner lihat risiko: "80% omzet kamu dari Nasi Box. Kalau harga ayam naik, bisnis kamu terancam." Motivasi diversifikasi | Diversifikasi butuh R&D produk baru, modal, skill baru — di luar scope data | Important |

---

## Part 3: Chain of Thought — Dari Data ke Aksi

### 3.1 Piutang & Cash Flow (B4, B5, B9) — CRITICAL

```
DATA DITAMPILKAN:
  Rekap harian: "Belum Bayar: 5 pesanan · Rp250.000"
  Aging: "Bu Ratna — Rp75.000 — sudah 3 hari"
  Collection rate: "Hari ini 67% terkumpul"
      ↓
INSIGHT YANG DIDAPAT:
  "Ada Rp250.000 yang belum masuk. Bu Ratna sudah 3 hari belum bayar.
   Collection rate-ku di bawah rata-rata (biasanya 80%)."
      ↓
AKSI YANG DIAMBIL:
  1. Kirim pengingat WA ke Bu Ratna (langsung dari rekap)
  2. Mulai minta DP untuk pesanan besar
  3. Perketat kebijakan: pembayaran sebelum kirim
      ↓
MASALAH BERKURANG:
  - Piutang macet turun dari 30 hari ke 7 hari
  - Cash flow lebih sehat — uang masuk lebih cepat
  - Margin tidak tergerus piutang tak tertagih
```

### 3.2 Stok & Bahan Baku (B7, G6, G1) — CRITICAL

```
DATA DITAMPILKAN:
  Velocity produk: "Nasi Box Ayam: rata-rata 25/hari"
  Stok sisa: "Ayam: 50 porsi (habis dalam 2 hari)"
  Top items hari ini: "Nasi Box Ayam — 30 porsi (↑20% dari biasanya)"
      ↓
INSIGHT YANG DIDAPAT:
  "Nasi Box Ayam lagi naik permintaannya. Stok ayam cuma cukup 2 hari.
   Kalau beli grosir untuk seminggu (175 porsi), bisa hemat 25%."
      ↓
AKSI YANG DIAMBIL:
  1. Besok pagi belanja ayam untuk seminggu (beli grosir)
  2. Siapkan extra stok untuk hari Jumat (biasanya ramai)
  3. Set stock alert di 30 porsi
      ↓
MASALAH BERKURANG:
  - Tidak ada stockout (pelanggan tidak kecewa)
  - Bahan baku lebih murah (beli grosir)
  - Persiapan lebih baik → waktu produksi lebih efisien
```

### 3.3 Pola Bisnis & Pertumbuhan (D5, C8, F3) — IMPORTANT

```
DATA DITAMPILKAN:
  Tren mingguan: "Minggu ini 85 pesanan (↑15% dari minggu lalu)"
  Pola hari: "Jumat & Sabtu paling ramai (rata-rata 18 pesanan)"
  Perbandingan bulan: "Bulan ini sudah Rp8.5juta (bulan lalu total Rp7.2juta)"
      ↓
INSIGHT YANG DIDAPAT:
  "Bisnis saya tumbuh 18% bulan ini! Jumat-Sabtu paling ramai.
   Kalau tren ini lanjut, bulan depan bisa tembus Rp10 juta."
      ↓
AKSI YANG DIAMBIL:
  1. Fokus promosi di Kamis malam (menjelang peak Friday)
  2. Siapkan extra stok untuk weekend
  3. Pertimbangkan tambah produk baru (bisnis tumbuh, saatnya diversifikasi)
      ↓
MASALAH BERKURANG:
  - Mindset berubah dari subsistence → growth (C8)
  - Antisipasi musiman lebih baik (F3)
  - Keputusan bisnis berdasarkan data, bukan intuisi
```

### 3.4 Pelanggan & Repeat Purchase (E5, E6) — CRITICAL

```
DATA DITAMPILKAN:
  Pelanggan teratas: "Bu Ratna — 12 pesanan — Rp2.5juta total"
  New vs returning: "Hari ini 3 baru, 12 returning (80% returning)"
  Churn risk: "Pak Budi terakhir pesan 21 hari lalu (biasanya tiap minggu)"
  Sumber pelanggan: "Link toko: 8 (53%) · Manual: 5 (33%) · WA: 2 (13%)"
      ↓
INSIGHT YANG DIDAPAT:
  "80% pesanan dari pelanggan lama — bagus! Tapi Pak Budi sudah 3 minggu
   tidak pesan. Link toko mendatangkan lebih dari separuh pesanan baru."
      ↓
AKSI YANG DIAMBIL:
  1. WA Pak Budi: "Pak, lama gak pesan. Ada menu baru lho!"
  2. Apresiasi Bu Ratna: kasih bonus/diskon pelanggan setia
  3. Share link toko lebih gencar di WA Status (efektif)
      ↓
MASALAH BERKURANG:
  - Repeat purchase naik (E5)
  - Churn berkurang
  - Customer acquisition lebih efisien (E6) — fokus channel yang work
```

### 3.5 Pembukuan untuk Kredit (A1, J4, A8) — NICE-TO-HAVE (tapi high-impact)

```
DATA DITAMPILKAN:
  Laporan 6 bulan: "Rata-rata omzet Rp7.5juta/bulan, growth 12%/bulan"
  Konsistensi: "Aktif setiap hari, rata-rata 15 pesanan/hari"
  Pelanggan: "45 pelanggan aktif, 78% retention rate"
      ↓
INSIGHT YANG DIDAPAT:
  "Saya punya bukti bisnis yang konsisten selama 6 bulan.
   Omzet tumbuh, pelanggan stabil, pembayaran terlacak."
      ↓
AKSI YANG DIAMBIL:
  1. Download "Laporan Keuangan Usaha" dari CatatOrder
  2. Lampirkan saat ajukan KUR atau pinjaman fintech
  3. Atau: CatatOrder connect ke fintech → auto credit scoring
      ↓
MASALAH BERKURANG:
  - UMKM punya "bukti" keuangan yang terstruktur
  - Fintech bisa assess risiko berdasarkan data real
  - Credit gap Rp2.400T mulai terlayani
```

### 3.6 Efisiensi Operasional (F5, D3, C4) — CRITICAL

```
DATA DITAMPILKAN:
  Status pipeline: "Baru: 5 · Diproses: 3 · Dikirim: 2 · Selesai: 8"
  Pesanan terlambat: "2 pesanan melewati tanggal kirim"
  Lead time rata-rata: "1.5 hari dari pesanan masuk → selesai"
  Sumber: "75% dari link toko (tidak perlu input manual)"
      ↓
INSIGHT YANG DIDAPAT:
  "Ada 2 pesanan terlambat! Lead time naik dari biasanya 1 hari.
   75% pesanan masuk otomatis dari link toko — hemat waktu input."
      ↓
AKSI YANG DIAMBIL:
  1. Prioritaskan 2 pesanan terlambat sekarang
  2. Dorong lebih banyak pelanggan pakai link toko (kurangi input manual)
  3. Investigasi kenapa lead time naik — mungkin perlu bantuan
      ↓
MASALAH BERKURANG:
  - Tidak ada pesanan terlewat/terlambat
  - Waktu admin berkurang (otomatis dari link toko)
  - Owner fokus produksi, bukan administrasi (C4)
```

### 3.7 Pricing & Profitabilitas (B3, I7) — IMPORTANT

```
DATA DITAMPILKAN:
  Revenue per produk: "Nasi Box Ayam: Rp5jt (65% total revenue)"
  Qty per produk: "Nasi Box: 200, Kue Lapis: 80, Minuman: 150"
  Harga rata-rata per order: "Rp50.000"
  Revenue concentration alert: "⚠ 65% revenue dari 1 produk"
      ↓
INSIGHT YANG DIDAPAT:
  "Nasi Box Ayam dominan — bagus tapi risiko tinggi. Kalau harga ayam naik
   atau pelanggan bosan, omzet turun drastis. Kue Lapis marginnya mungkin lebih baik."
      ↓
AKSI YANG DIAMBIL:
  1. Naikkan harga Nasi Box sedikit (demand tinggi, market bisa absorb)
  2. Promosikan Kue Lapis lebih agresif (diversifikasi revenue)
  3. Tambah 1-2 menu baru untuk kurangi konsentrasi
      ↓
MASALAH BERKURANG:
  - Harga berbasis data, bukan intuisi (B3)
  - Revenue lebih terdiversifikasi (I7)
  - Margin lebih sehat dari pricing yang tepat
```

### 3.8 Pajak & Formalisasi (H6, H1) — NICE-TO-HAVE

```
DATA DITAMPILKAN:
  Omzet kumulatif YTD: "Rp45.000.000 (dari Rp500juta batas PPh Final)"
  Estimasi pajak: "PPh Final 0.5% = Rp225.000"
  Proyeksi tahunan: "Rp180juta (jika tren berlanjut)"
      ↓
INSIGHT YANG DIDAPAT:
  "Omzet masih jauh di bawah Rp500juta. Pajak tahun ini sekitar Rp900ribu.
   Bisnis terlalu kecil untuk khawatir pajak, tapi bagus untuk mulai aware."
      ↓
AKSI YANG DIAMBIL:
  1. Sisihkan 0.5% dari omzet setiap bulan untuk pajak
  2. Download laporan omzet tahunan untuk pelaporan SPT
  3. Pertimbangkan daftar NPWP (syarat KUR dan formalisasi)
      ↓
MASALAH BERKURANG:
  - UMKM aware kewajiban pajak (H6)
  - Ada bukti omzet untuk formalisasi (H1)
  - Transisi informal → formal lebih mulus
```

---

## Part 4: Master List Data Fields yang Dibutuhkan

### Kategori A — Revenue & Pendapatan (sudah ada sebagian besar)

| # | Data Field | Status Saat Ini | Sumber | Dibutuhkan Untuk |
|---|-----------|----------------|--------|-----------------|
| A1 | Total pesanan (non-cancelled) | Ada | COUNT orders | B1, B8, D3 |
| A2 | Total revenue (omzet) | Ada | SUM(total) | B1, B2, B8 |
| A3 | Total terkumpul (uang masuk) | Ada | SUM(paid_amount) | B2, B4 |
| A4 | Revenue per status pembayaran (lunas/DP/belum bayar) | Ada | Filter by payment_status | B4, B9 |
| A5 | Jumlah pesanan per status pembayaran | Ada | COUNT by payment_status | B4 |
| A6 | Revenue per status pesanan | Ada | GROUP BY order status | F5 |
| A7 | **Gap revenue vs collected** | Ada (implisit) | total_revenue - collected_revenue | B9 |
| A8 | **Rata-rata nilai pesanan (AOV)** | Belum ada | total_revenue / total_orders | B3, A8 |
| A9 | **Revenue per hari (daily breakdown)** | Ada | Daily aggregation | B5, D5 |
| A10 | **Diskon total yang diberikan** | Belum ada | SUM(discount) | B9 |
| A11 | **Nilai pesanan dibatalkan** | Belum ada | SUM(total) WHERE cancelled | B9 |
| A12 | **Omzet kumulatif tahun berjalan** | Belum ada | SUM all months in year | H6 |

### Kategori B — Produk & Inventaris

| # | Data Field | Status Saat Ini | Sumber | Dibutuhkan Untuk |
|---|-----------|----------------|--------|-----------------|
| B1 | Top produk by revenue | Ada (top 10) | Item aggregation | B3, D5 |
| B2 | Qty terjual per produk | Ada | Item aggregation | B7, G6 |
| B3 | Revenue per produk | Ada | price × qty | B3, I7 |
| B4 | **Velocity produk** (rata-rata terjual/hari) | Belum ada | qty / days_in_period | B7, G6, G1 |
| B5 | **Stok sisa per produk** | Ada di products table | products.stock | B7, G6 |
| B6 | **Prediksi hari habis stok** | Belum ada | stock / velocity | B7, G6 |
| B7 | **Produk hampir habis (alert)** | Belum ada | stock < threshold | B7, G6 |
| B8 | **Revenue concentration %** | Belum ada | top_product_revenue / total | I7 |
| B9 | **Kontribusi % per produk** | Belum ada | product_revenue / total × 100 | B3, I7 |
| B10 | **Produk yang tidak laku** (0 order in period) | Belum ada | Products with 0 sales | E8, F2 |
| B11 | **Repeat purchase rate per produk** | Belum ada | Unique customers per product over time | E8 |
| B12 | **Harga rata-rata per produk** | Belum ada | AVG(price) from order items | B3 |
| B13 | **Jumlah kategori produk** | Belum ada | DISTINCT categories | I7 |

### Kategori C — Pelanggan & CRM

| # | Data Field | Status Saat Ini | Sumber | Dibutuhkan Untuk |
|---|-----------|----------------|--------|-----------------|
| C1 | Pelanggan teratas (by total spent) | Ada (top 10) | Customer aggregation | E5 |
| C2 | Pelanggan baru per periode | Ada (daily count) | customers.created_at | E5 |
| C3 | **Pelanggan returning vs baru** | Belum ada | Orders by new vs existing customer | E5, E6 |
| C4 | **Returning customer ratio** | Belum ada | returning_orders / total_orders | E5 |
| C5 | **Frekuensi pembelian per pelanggan** | Belum ada | orders_count / months_active | E5 |
| C6 | **Customer lifetime value (CLV)** | Belum ada | total_spent per customer | E5, A8 |
| C7 | **Churn risk** (lama tidak pesan) | Belum ada | NOW() - last_order_at > threshold | E5 |
| C8 | **Total pelanggan aktif** (ordered in period) | Belum ada | DISTINCT customer_id in period | E5, J4 |
| C9 | **Pelanggan dengan piutang** | Belum ada | Customers with unpaid orders | B4 |
| C10 | **Customer retention rate** | Belum ada | Returning this month / total last month | J4, A8 |

### Kategori D — Waktu & Operasional

| # | Data Field | Status Saat Ini | Sumber | Dibutuhkan Untuk |
|---|-----------|----------------|--------|-----------------|
| D1 | Status pipeline (pesanan per status) | Ada | ordersByStatus | F5 |
| D2 | **Pesanan terlambat** | Belum ada | delivery_date < NOW() AND status not done | F5 |
| D3 | **Lead time rata-rata** (order → done) | Belum ada | AVG(completed_at - created_at) | F5, G8 |
| D4 | **Peak hours** (pesanan per jam) | Belum ada | GROUP BY HOUR(created_at) | D3, F3 |
| D5 | **Peak days** (hari paling ramai) | Belum ada | GROUP BY DAY_OF_WEEK | D5, F3 |
| D6 | **Pesanan terjadwal** (delivery_date masa depan) | Belum ada | Orders WHERE delivery_date > NOW() | B5, F3 |
| D7 | **Order completion rate** | Belum ada | done_count / total_orders | G8 |
| D8 | **Cancellation rate** | Belum ada | cancelled / total × 100 | F2, B9 |

### Kategori E — Sumber & Channel

| # | Data Field | Status Saat Ini | Sumber | Dibutuhkan Untuk |
|---|-----------|----------------|--------|-----------------|
| E1 | **Pesanan per source** (manual/order_link/whatsapp) | Belum ada | GROUP BY source | D3, E1, E6 |
| E2 | **Revenue per source** | Belum ada | SUM(total) GROUP BY source | E6 |
| E3 | **Pelanggan baru per source** | Belum ada | First order source per customer | E6 |
| E4 | **Conversion: link toko views → orders** | Belum ada (butuh tracking page views) | Page views vs orders | E6 |

### Kategori F — Perbandingan & Tren

| # | Data Field | Status Saat Ini | Sumber | Dibutuhkan Untuk |
|---|-----------|----------------|--------|-----------------|
| F1 | Perbandingan vs rata-rata 7 hari | Ada (AI analysis) | Past orders query | D5 |
| F2 | Perbandingan vs hari sama minggu lalu | Ada (AI analysis) | Past orders query | D5 |
| F3 | Perbandingan vs bulan lalu | Ada (AI analysis) | Past orders query | B8, C8 |
| F4 | **Growth rate (MoM %)** | Ada (AI analysis, implisit) | (this_month - last_month) / last_month | A8, J4 |
| F5 | **Tren mingguan** | Belum ada | Weekly aggregation | D5 |
| F6 | **Pola musiman** (month-over-month for 12 months) | Belum ada | 12-month historical | F3, D5 |
| F7 | **Konsistensi revenue** (coefficient of variation) | Belum ada | STDEV / MEAN of monthly revenue | A8, J4 |
| F8 | **Proyeksi revenue** (bulan depan) | Belum ada | Trend extrapolation | B5 |

### Kategori G — Keuangan & Pajak

| # | Data Field | Status Saat Ini | Sumber | Dibutuhkan Untuk |
|---|-----------|----------------|--------|-----------------|
| G1 | **Piutang aging** (umur piutang) | Belum ada | NOW() - created_at for unpaid orders | B4 |
| G2 | **Collection rate** (% terkumpul) | Ada (implisit) | collected / total_revenue | B4, B9 |
| G3 | **Estimasi pajak** (0.5% omzet) | Belum ada | total_revenue × 0.005 | H6 |
| G4 | **Omzet YTD** | Belum ada | SUM revenue Jan-now | H6 |
| G5 | **Laporan format standar** (untuk kredit) | Belum ada | Formatted export | A1, A7 |

---

## Part 5: Masalah yang TIDAK Bisa Diselesaikan oleh Rekap (45 masalah)

Untuk kelengkapan, berikut masalah yang murni di luar scope fitur rekap/data:

| Kategori | Kode | Alasan Tidak Bisa Diselesaikan Rekap |
|----------|------|--------------------------------------|
| Modal | A3, A4, A5 | Masalah struktural: credit gap, bunga tinggi, rentenir — butuh intervensi keuangan sistemik |
| Keuangan | — | Semua sudah tercakup di Part 1/2 |
| SDM | C1, C2, C3, C6 | Pendidikan, pelatihan, rekrutmen, suksesi — butuh intervensi pendidikan & SDM |
| Teknologi | D7 | Infrastruktur internet — butuh pembangunan fisik |
| Pemasaran | E2, E3, E4, E7 | Brand identity, marketplace, ekspor — butuh strategi & ekosistem |
| Produksi | F1, F4, F6, F7 | Produktivitas, peralatan, waste, penggajian — butuh investasi & sistem HR |
| Logistik | G2, G3, G4, G7 | Collective purchasing, logistik mahal, cold chain, last-mile — butuh infrastruktur |
| Regulasi | H2, H3, H4, H5, H7, H8 | Perizinan, compliance, sertifikasi, hukum — butuh reformasi regulasi |
| Risiko | I1, I2, I3, I4, I6 | Asuransi, dana darurat, jaring pengaman — butuh produk asuransi & perlindungan |
| Keuangan Inklusi | J1, J2, J3, J5, J6 | Unbanked, akses bank, e-wallet, literasi — butuh inklusi keuangan sistemik |
| Ekosistem | K1, K2, K3, K5 | Program pemerintah, klaster, mentoring, koperasi — butuh koordinasi ekosistem |
| Gender/Inklusi | L1, L2, L3, L4, L5 | Semua butuh intervensi kebijakan dan sosial |

---

## Part 6: Prioritized Implementation Roadmap

### Wave 1 — Quick Wins (data sudah ada, tinggal tampilkan)

| Data Field | Effort | Impact | Masalah yang Diselesaikan |
|-----------|--------|--------|--------------------------|
| Pesanan per source (E1) | Low | High | D3, E1, E6 |
| Rata-rata nilai pesanan / AOV (A8) | Low | Medium | B3, A8 |
| Diskon total (A10) | Low | Medium | B9 |
| Nilai pesanan dibatalkan (A11) | Low | Medium | B9 |
| Collection rate % (G2, eksplisit) | Low | High | B4, B9 |
| Pelanggan aktif per periode (C8) | Low | Medium | E5, J4 |
| Cancellation rate (D8) | Low | Medium | F2, B9 |
| Order completion rate (D7) | Low | Medium | G8 |

### Wave 2 — Moderate Effort (perlu query/logic baru)

| Data Field | Effort | Impact | Masalah yang Diselesaikan |
|-----------|--------|--------|--------------------------|
| New vs returning customers (C3, C4) | Medium | High | E5, E6 |
| Velocity produk (B4) | Medium | High | B7, G6, G1 |
| Prediksi habis stok (B6) + alert (B7) | Medium | High | B7, G6 |
| Revenue concentration % (B8) | Medium | Medium | I7 |
| Peak days / peak hours (D4, D5) | Medium | High | D5, F3 |
| Pesanan terlambat alert (D2) | Medium | High | F5 |
| Churn risk detection (C7) | Medium | High | E5 |
| Piutang aging (G1) | Medium | High | B4 |
| Revenue per source (E2) | Medium | Medium | E6 |
| Tren mingguan (F5) | Medium | Medium | D5 |

### Wave 3 — Strategic (high-effort, high-long-term-value)

| Data Field | Effort | Impact | Masalah yang Diselesaikan |
|-----------|--------|--------|--------------------------|
| Lead time rata-rata (D3) | Medium | Medium | F5, G8 |
| CLV / Customer Lifetime Value (C6) | High | High | E5, A8 |
| Revenue projection / proyeksi (F8) | High | High | B5 |
| Konsistensi revenue / CoV (F7) | High | Medium | A8, J4 |
| Laporan format standar untuk kredit (G5) | High | Very High | A1, A7, J4 |
| Estimasi pajak & omzet YTD (G3, G4) | Medium | Medium | H6 |
| Pola musiman 12 bulan (F6) | High | Medium | F3, D5 |
| Pesanan terjadwal / upcoming (D6) | Medium | Medium | B5, F3 |

---

## Ringkasan

| Kategori | Jumlah Masalah | Solvable by Rekap | Partially Addressable | Not Addressable |
|----------|---------------|-------------------|----------------------|-----------------|
| A. Permodalan & Kredit (8) | 3 | 1 | 4 |
| B. Keuangan & Pencatatan (9) | 8 | 1 | 0 |
| C. SDM & Kapasitas (8) | 0 | 4 | 4 |
| D. Teknologi & Digitalisasi (7) | 4 | 2 | 1 |
| E. Pemasaran & Akses Pasar (9) | 1 | 4 | 4 |
| F. Operasional & Produksi (7) | 1 | 3 | 3 |
| G. Rantai Pasok & Logistik (8) | 2 | 2 | 4 |
| H. Regulasi & Formalisasi (8) | 1 | 1 | 6 |
| I. Risiko & Ketahanan (7) | 0 | 2 | 5 |
| J. Akses Keuangan (6) | 1 | 0 | 5 |
| K. Ekosistem (5) | 1 | 0 | 4 |
| L. Gender & Inklusi (5) | 0 | 0 | 5 |
| **TOTAL (87)** | **23** | **19** | **45** |

**42 dari 87 masalah (48%)** UMKM bisa diselesaikan atau dibantu melalui rekap/data yang lebih baik. Ini menunjukkan bahwa fitur rekap bukan "nice-to-have" — ini adalah inti dari value proposition CatatOrder.

Dari 42 masalah tersebut, **60+ data fields** teridentifikasi, di mana ~15 sudah ada di rekap saat ini dan ~45 perlu ditambahkan. Prioritas utama: piutang aging, velocity produk, new vs returning customers, source breakdown, dan pesanan terlambat.

---

*Dianalisis: 2026-03-10*
*Berdasarkan: umkm-problem.md (87 masalah), rekap-feature-analysis.md, CatatOrder v2.6.0*
*Metode: Chain of Thought per masalah → data mapping → deduplication → prioritization*
