# Tokoflow MECE Problem Tree

> **Versi:** Final · **Tanggal:** 2026-05-23
> **Status:** Locked — dipakai sebagai basis positioning, copy, demo script, dan pitch

---

## Satu Kalimat Root Problem

> **Banyak bisnis Malaysia yang sudah punya produk terbukti, customer nyata, dan demand aktif — tapi belum punya sistem commerce sendiri yang mudah, murah, dan siap dipakai.**

Ini bukan "admin susah". "Admin susah" hanya satu gejala.

Mereka jualan lewat TikTok/Shopee untuk exposure, WhatsApp untuk order, bank transfer/DuitNow untuk payment, screenshot untuk proof, Excel/notebook/chat untuk tracking, dan ingatan pribadi untuk follow-up. Mesin jualannya berjalan, tapi tidak benar-benar mereka kontrol.

---

## Diagnosis Internal (satu kalimat)

> **Kita bukan membangun order management tool. Kita membangun owned-commerce layer untuk bisnis Malaysia yang sudah punya demand tapi belum punya mesin jualan sendiri.**

---

## Problem Tree

### Layer 1 — Strategic Problems
*Problem yang membuat merchant tertarik dan daftar.*

#### 1. Channel Control Problem

**Apa masalahnya:**
Merchant bergantung pada channel orang lain untuk jualan. Marketplace dan social media bagus untuk discovery, tapi tidak sepenuhnya milik merchant. Kalau algorithm berubah, fee naik, atau akun kena limit, jualan ikut terganggu.

**Apa yang merchant rasakan:**
- "Saya asyik kena ikut TikTok/Shopee."
- "Kalau tak post/live, sales jatuh."
- "Saya nak ada website sendiri tapi tak tahu macam mana."

**Tokoflow menyelesaikan dengan:**
> Laman web order sendiri di `tokoflow.com/[slug]` — owned order channel.

---

#### 2. Customer Relationship Problem

**Apa masalahnya:**
Customer yang sudah beli tidak sepenuhnya menjadi aset merchant. Kalau transaksi lewat marketplace, platform mengontrol hubungan setelah transaksi — bisa merekomendasikan kompetitor, campaign lain, atau seller lain.

Ini bukan hanya soal "data customer". Ini soal: **siapa yang mengontrol kemungkinan customer itu beli lagi?**

**Apa yang merchant rasakan:**
- "Customer beli sekali, lepas itu hilang."
- "Customer lama jarang repeat, tapi tak tahu kenapa."

**Tokoflow menyelesaikan dengan:**
Customer database, order history, direct order link, repeat order path, dan channel yang dimiliki merchant sendiri.

**Kalimat tajam:**
> Marketplace bantu customer jumpa produk anda. Tokoflow bantu customer balik beli dari anda.

*Catatan: Problem 1 dan 2 saling terkait — channel ownership adalah prerequisite untuk customer relationship ownership. Dari perspektif merchant, keduanya dirasakan sebagai satu pain: "customer saya bukan betul-betul milik saya."*

---

#### 3. Margin / Effective Platform Cost Problem

**Apa masalahnya:**
Merchant tahu ada biaya jualan di platform, tapi sering tidak tahu total effective cost-nya. Bukan hanya komisi — bisa termasuk transaction fee, platform support fee, affiliate, voucher, campaign discount, ads, shipping subsidy, dan cost untuk visibility.

**Apa yang merchant rasakan:**
- "Sales nampak banyak, tapi profit tak terasa."
- "Order ada, tapi margin macam nipis."
- "Saya tak tahu sebenarnya tinggal berapa."

**Tokoflow menyelesaikan dengan:**
Direct order tanpa komisi jualan dari Tokoflow, pricing tetap RM49/bulan, dan Marketplace Cost Calculator.

**Framing yang aman:**
> Kira kos sebenar jualan anda di marketplace. (Bukan: "TikTok ambil 30%.")

---

#### 4. Credibility / Business Legitimacy Problem

**Apa masalahnya:**
Produk sudah serius, tapi channel digital belum mencerminkan keseriusan bisnis.

Merchant mungkin sudah punya packaging proper, label, stok, customer, sertifikasi, trade show, program government, atau potensi distributor/retail. Tapi ketika customer tanya "beli di mana?", jawabannya masih: "WhatsApp saya" atau "Cari kami di TikTok."

**Apa yang merchant rasakan:**
- "Produk saya serius, tapi belum nampak proper online."
- "Saya nak customer nampak kita ada website sendiri."

**Tokoflow menyelesaikan dengan:**
> "Ini laman web company kami sendiri." — `tokoflow.com/[slug]`

**Catatan segmen:**
- Untuk IKS manufacturer: credibility = **Tier 1** (business requirement, bukan sekadar aspirasi)
- Untuk mompreneur home-based: credibility = Tier 3 (emotional aspiration)

---

### Layer 2 — Conversion Problems
*Problem yang langsung mempengaruhi order masuk.*

#### 5. Reorder Friction Problem

**Apa masalahnya:**
Customer yang sudah pernah beli masih harus melewati proses panjang untuk beli lagi:

> ingat brand → cari nombor WhatsApp → chat → tunggu balasan → tanya stok → bagi alamat → tunggu total → bayar → send receipt.

Banyak repeat purchase gagal bukan karena customer tidak suka produk, tapi karena alurnya terlalu berat.

**Apa yang merchant rasakan:**
- "Customer lama jarang repeat." (tapi tidak tahu penyebabnya adalah friction)

**Tokoflow menyelesaikan dengan:**
Direct order link, product page, repeat order path — customer bisa order tanpa mulai dari chat kosong.

**Kalimat tajam:**
> Repeat customer jangan dipaksa mulai dari WhatsApp kosong lagi.

---

#### 6. Order Capture Problem

**Apa masalahnya:**
Demand datang dari banyak tempat (WhatsApp, TikTok DM, IG DM, Facebook, referral, trade show, voice note, screenshot), tapi tidak semua berubah menjadi order yang rapi. Semuanya berbentuk chat manual.

**Akibatnya:**
Detail order tidak lengkap, alamat salah, payment proof hilang, merchant lupa follow-up, customer batal.

**Apa yang merchant rasakan:**
- "Banyak tanya, tapi sikit jadi order."
- "Order masuk WhatsApp tapi susah nak susun."

**Tokoflow menyelesaikan dengan:**
Public order page, structured checkout, AI parse order dari chat/voice/screenshot, order record, customer record.

---

### Layer 3 — Operations Problems
*Problem yang membuat merchant stay setelah daftar.*

#### 7. Operations Control Problem

**Apa masalahnya:**
Bisnis sudah jalan, tapi operating system-nya masih manual: WhatsApp, Excel, notebook, screenshot, bank app, memory pribadi.

**Akibatnya:**
Susah tahu order pending, siapa sudah bayar, produk mana laku, cari customer lama, buat invoice, scale kalau order naik.

**Apa yang merchant rasakan:**
- "Order, customer, payment masih bercampur dalam chat."
- "Order/customer/payment bersepah."

**Tokoflow menyelesaikan dengan:**
Order management, product management, customer management, invoice, status tracking, dashboard.

*Ini bukan headline positioning utama, tapi ini yang membuat merchant pakai produk setiap hari.*

---

#### 8. Payment & Reconciliation Problem

**Apa masalahnya:**
Payment masuk, tapi matching ke order masih manual. Customer bayar via DuitNow, screenshot dikirim di WhatsApp, merchant cek bank app, cocokkan nama/order secara manual.

**Apa yang merchant rasakan:**
- "Penat cek bank app dan payment proof manual."
- "Saya kena cek payment manual."

**Tokoflow menyelesaikan dengan:**
DuitNow QR, Billplz FPX, payment status, invoice, Background Twin payment matching.

*Penting untuk IKS/semi-formal SME yang butuh operasi lebih proper.*

---

### Layer 4 — Barrier (Bukan Problem Utama)

#### 9. Implementation Barrier

**Bukan problem bisnis tersendiri — ini alasan kenapa 8 problem di atas belum terselesaikan.**

Merchant tahu solusi idealnya: "Saya perlu website/sistem order sendiri." Tapi opsi yang ada berat: custom IT mahal, setup lama, Shopify/EasyStore kompleks, marketplace mudah tapi bukan milik sendiri, WhatsApp murah tapi manual.

**Tokoflow menghapus barrier ini:**
> Sistem sendiri yang siap hari ini, tanpa IT company mahal, cukup sederhana untuk dipakai sendiri.

---

## Ringkasan MECE

| No | Problem | Jenis | Apa yang merchant rasakan |
|---:|---|---|---|
| 1 | Channel control | Strategic | "Saya terlalu bergantung pada platform." |
| 2 | Customer relationship | Strategic | "Customer saya tak balik direct ke saya." |
| 3 | Effective platform cost | Profit | "Sales banyak, tapi profit tak terasa." |
| 4 | Credibility | Trust/status | "Produk saya serius, tapi belum nampak proper online." |
| 5 | Reorder friction | Conversion | "Customer lama susah order lagi." |
| 6 | Order capture | Conversion | "Banyak tanya, tapi sikit jadi order." |
| 7 | Operations control | Retention | "Order/customer/payment bersepah." |
| 8 | Payment reconciliation | Cash control | "Saya kena cek payment manual." |
| 9 | Implementation barrier | Barrier | "Nak sistem sendiri, tapi IT mahal/susah." |

---

## Demand Sequencing

Tidak semua problem langsung dirasakan merchant sebelum kenal Tokoflow. Ini menentukan copy dan entry hook.

### Already Felt — boleh jadi hook pertama

| Problem | Hook copy |
|---|---|
| Order capture | "Order masuk WhatsApp tapi susah nak susun?" |
| Operations control | "Order, customer, payment masih bercampur dalam chat?" |
| Payment reconciliation | "Penat cek bank app dan payment proof manual?" |
| Credibility (IKS) | "Produk sudah serius, tapi belum ada laman web order sendiri?" |

### Partially Felt — merchant rasa gejalanya, belum tahu diagnosisnya

| Problem | Yang merchant rasa | Diagnosis sebenarnya |
|---|---|---|
| Effective platform cost | "Sales banyak tapi margin nipis." | Kos efektif platform tidak dikira penuh |
| Reorder friction | "Customer lama tak repeat." | Jalan beli ulang terlalu susah |
| Customer relationship | "Customer beli sekali, lepas itu hilang." | Relationship dikontrol platform |

### Needs to Be Surfaced — jangan jadi hook pertama

| Problem | Risiko kalau jadi hook terlalu awal |
|---|---|
| Channel control | Merchant jawab: "Saya okay je pakai TikTok/Shopee." |
| Customer ownership | Merchant belum merasa ini masalah tanpa contoh konkret |
| Platform dependency | Terlalu strategic kalau merchant masih pening order harian |

**Urutan yang benar:** Felt pain → diagnosis → strategic pain → Tokoflow sebagai owned-commerce solution.

---

## Segmentasi

### Segment A — IKS Manufacturer / Semi-formal SME

**Entry point terbaik:** Credibility → channel sendiri → customer relationship → platform cost

**Headline:**
> Produk sudah serius. Sekarang beri customer laman web order sendiri.

**Supporting:**
> Sesuai untuk usahawan IKS, produk makanan, minuman, kosmetik, herba, dan brand kecil yang mahu nampak lebih profesional tanpa bayar IT company mahal.

**Demo flow (proof-first):**
1. Tunjuk email order real masuk (contoh: "New order — Qumail Husaini · RM 21" — bukan mock)
2. Tunjuk website yang menghasilkan order itu (`tokoflow.com/[slug]`)
3. Tunjuk customer journey (pilih produk → checkout → payment)
4. Tunjuk dashboard: order, customer, payment status
5. Tunjuk setup cepat: upload foto → AI extract → katalog live
6. Tunjuk pricing: RM 49/bulan vs effective platform cost

---

### Segment B — Mompreneur / Home-based Seller

**Entry point terbaik:** Order capture → operations control → payment reconciliation → reorder friction

**Headline:**
> Customer order sendiri. Anda tak perlu susun semua dalam WhatsApp.

**Supporting:**
> Customer pilih produk sendiri, order masuk tersusun, payment lebih mudah dicheck, dan repeat order tak perlu mula dari chat kosong.

**Demo flow (pain-first):**
1. Tunjuk customer order sendiri dari link (tanpa WhatsApp)
2. Tunjuk order masuk rapi ke dashboard
3. Tunjuk payment status jelas
4. Tunjuk customer bisa order lagi dari link yang sama
5. Tunjuk website sendiri sebagai bonus kredibilitas
6. Tunjuk pricing

---

## Problem Selector Cards (Landing Page)

Tiga card untuk self-selection — pakai felt-pain language, bukan strategic language:

**Card 1 (IKS/credibility):**
> Produk sudah serius, tapi channel digital masih WhatsApp?

**Card 2 (mompreneur/order chaos):**
> Order masuk WhatsApp tapi susah nak susun?

**Card 3 (platform cost — felt pain language):**
> Sales banyak, tapi tak tahu sebenarnya berapa yang tinggal?

Card 3 anchor ke Marketplace Cost Calculator — bukan langsung ke /register.

---

## Messaging Hierarchy (3 Level)

### Level 1 — Simple hook
*Untuk orang awam, iklan, cold outreach.*
> Website order sendiri untuk bisnes kecil Malaysia.

### Level 2 — Felt pain
*Untuk conversion: landing page, demo opening, WhatsApp outreach.*
> Order WhatsApp lebih tersusun. Customer boleh beli direct. Payment dan invoice lebih mudah dicheck.

### Level 3 — Strategic insight
*Untuk pitch, investor, agency (KEDA/MARA/SMECorp), dan buyer yang sudah aware.*
> Marketplace bagus untuk discovery, tapi repeat customer dan customer data perlu dibina dalam channel sendiri.

**Jangan buka dengan Level 3 untuk semua orang.** Level 3 powerful tapi butuh konteks. Masuk lewat Level 1 atau 2 dulu.

---

## 3 Big Problems untuk Pitch

Jangan tampilkan 8 problem dalam satu pitch. Gunakan 3 problem besar:

1. **Bisnis belum punya channel order sendiri** — bergantung pada marketplace, social media, dan WhatsApp.
2. **Bisnis kehilangan margin dan repeat customer** — sales ada, tapi biaya platform tidak jelas dan customer relationship dikontrol channel lain.
3. **Bisnis belum punya sistem yang cukup mudah untuk dipakai sendiri** — order, payment, customer, invoice masih tercecer di chat dan manual process.

**Solution statement:**
> Tokoflow memberi mereka owned order channel yang siap hari ini — tanpa komisi jualan dari Tokoflow, tanpa IT company mahal, dan cukup sederhana untuk dipakai sendiri.

---

## Problem Statement Final

> **Banyak bisnis Malaysia yang sudah punya produk terbukti, customer nyata, dan demand aktif — tapi belum punya sistem commerce sendiri. Mereka bergantung pada marketplace untuk exposure, WhatsApp untuk order, transfer manual untuk payment, dan ingatan/chat untuk operasi. Akibatnya mereka kehilangan margin, kehilangan kendali atas customer relationship, repeat order jadi friction-heavy, dan bisnis terlihat kurang matang padahal produknya sudah serius. Tokoflow memberi mereka owned order channel yang siap hari ini — tanpa komisi jualan dari Tokoflow, tanpa IT company mahal, dan cukup sederhana untuk dipakai sendiri.**

---

## One-line Diagnosis

> **Tokoflow menyelesaikan masalah kontrol: kontrol atas channel, customer, margin, order, payment, repeat purchase, dan kredibilitas bisnis.**

---

*Dokumen ini adalah output dari sesi strategy 2026-05-23. Dipakai sebagai basis positioning v0.3, landing page copy, segment demo scripts, dan pitch ke Ariff/KEDA/SMECorp.*
