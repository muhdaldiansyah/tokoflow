# CatatOrder — Store Analytics Design

> Analytics link toko yang bikin owner UMKM buka CatatOrder setiap hari — bukan dashboard yang diabaikan.

**Tanggal:** 2026-03-15
**Basis:** Riset 17 platform benchmark + UMKM analytics behavior research (~100KB data)
**Source:** `/reality/20260315-store-analytics-research/`

---

## 1. PRINSIP DESAIN

### Yang WORKS (data-backed)

| Prinsip | Evidence |
|---------|----------|
| **Angka besar + teks pendek > chart** | Riset ACM: chart unusable untuk low-literacy users. Semua 17 platform tampilkan views/revenue sebagai angka besar. |
| **WA delivery > in-app dashboard** | WA open rate 95% vs email 21.5%. UMKM hidup di WA. |
| **Insight bahasa natural > raw data** | Dari 17 platform, hanya Square AI kasih rekomendasi bahasa manusia — differentiator terbesar. CatatOrder sudah punya AI Analysis. |
| **Counter yang berubah = addictive** | Variable ratio reinforcement (Nature Communications) = compulsive checking. |
| **Milestone celebratory > leaderboard** | Streak 7+ hari = 2.3x engagement (Duolingo). Gamification boost retention 22%. |

### Yang GAGAL (data-backed)

| Anti-Pattern | Evidence |
|-------------|----------|
| Dashboard chart kompleks | BukuWarung: 6.5M registered, 659K MAU = 90% churn. Dashboard bukan alasan orang stay. |
| Raw data tanpa konteks | "Conversion rate 6.2%" = UMKM tidak tahu bagus atau jelek. 14/17 platform hanya kasih raw data. |
| Analytics terpisah dari flow | UMKM buka app untuk JUALAN (79% alasan digitalisasi), bukan analytics. |
| Leaderboard / perbandingan toko | Bisa demotivasi. UMKM baru selalu kalah dari yang established. |

---

## 2. METRIC HIERARCHY

### Tier 1 — WAJIB (hari 1)

| Metric | Action yang Didorong | Format |
|--------|---------------------|--------|
| **Pengunjung hari ini** | Share link lebih sering | "25 orang lihat toko kamu hari ini" |
| **Pesanan hari ini** | Proses pesanan | "8 pesanan hari ini" |
| **Omzet hari ini** | Motivasi | "Rp 1.250.000 hari ini ↑" |
| **Produk paling laris** | Stok/promosi | "Kue keju paling laris (12 pesanan)" |
| **vs kemarin** | Awareness tren | "10 lebih banyak dari kemarin ↑" |

### Tier 2 — BAGUS (setelah Tier 1 proven)

| Metric | Action | Format |
|--------|--------|--------|
| **Produk dilihat tapi jarang dipesan** | Turunkan harga / update foto | "Kue coklat dilihat 30 orang tapi cuma 2 yang pesan" |
| **Jam ramai pengunjung** | Kapan share link | "Pengunjung paling banyak jam 7-9 malam" |
| **Pelanggan baru vs lama** | Re-engage / apresiasi | "5 pelanggan baru, 3 yang balik lagi" |
| **Sumber traffic** | Fokus channel efektif | "15 dari WA, 8 dari Instagram, 2 langsung" |

### Tier 3 — NICE TO HAVE (setelah 50+ user)

| Metric | Format |
|--------|--------|
| Conversion sederhana | "Dari 50 pengunjung, 8 yang pesan" — hanya jika >20 pengunjung/hari |
| Ringkasan mingguan | WA digest Minggu pagi |
| Milestone tracker | "Toko kamu sudah dikunjungi 500 orang!" |

### Tier 4 — JANGAN

| Jangan | Kenapa |
|--------|--------|
| Conversion funnel | Konsep asing bagi UMKM |
| Bounce rate | Terlalu teknis, tidak actionable |
| Demographic breakdown | "60% perempuan 25-34" = lalu apa? |
| Session duration | Abstrak |
| A/B testing | Terlalu advanced |
| UTM tracking | UMKM tidak akan setup |

---

## 3. DASHBOARD LAYOUT

Satu halaman, scroll vertikal, TANPA tab/menu:

```
┌──────────────────────────────────────────────────┐
│              TOKO KAMU HARI INI                   │
│                                                   │
│  👁 25 orang lihat          📦 8 pesanan           │
│  ↑ 10 dari kemarin          ↑ 3 dari kemarin      │
│                                                   │
│  💰 Rp 1.250.000                                   │
│  ↑ Naik 30% dari kemarin                          │
├───────────────────────────────────────────────────┤
│              PRODUK POPULER                       │
│                                                   │
│  1. Kue Keju ........... 12 pesanan               │
│  2. Brownies ........... 8 pesanan                │
│  3. Roti Sobek ......... 5 pesanan                │
├───────────────────────────────────────────────────┤
│              INSIGHT AI                           │
│                                                   │
│  "Kue coklat dilihat 30 orang tapi cuma 2 yang   │
│   pesan — coba update foto atau turunkan harga?"  │
├───────────────────────────────────────────────────┤
│              DARI MANA PENGUNJUNG                 │
│                                                   │
│  WhatsApp: 15 orang                               │
│  Instagram: 8 orang                               │
│  Langsung: 2 orang                                │
├───────────────────────────────────────────────────┤
│              MILESTONE                            │
│                                                   │
│  🎉 Toko kamu sudah dikunjungi 500 orang!         │
│     [Share ke WA]                                 │
└───────────────────────────────────────────────────┘
```

- Default = HARI INI (UMKM berpikir harian)
- Swipe untuk 7 hari / 30 hari
- 3 pilihan saja, BUKAN date picker custom

---

## 4. CONTOH UI TEXT (10 Contoh)

Bahasa Indonesia yang UMKM paham. Tidak ada istilah teknis. Pakai "kamu" bukan "Anda."

**Pengunjung:**
1. "25 orang lihat toko kamu hari ini — 10 lebih banyak dari kemarin"
2. "Hari ini masih sepi, baru 5 orang yang buka toko kamu. Coba share link di WA Status?"
3. "Minggu ini 180 orang lihat toko kamu. Paling rame hari Sabtu (45 orang)"

**Produk:**
4. "Kue keju paling banyak dilihat tapi jarang dipesan — coba turunkan harga atau ganti foto?"
5. "Brownies kamu laris banget! 15 pesanan minggu ini. Stok cukup?"
6. "Ada 3 produk yang belum pernah dipesan siapapun. Mau hapus atau update?"

**Pesanan & Omzet:**
7. "8 pesanan hari ini, total Rp 1.250.000. Mantap! Naik 30% dari kemarin"
8. "Pesanan minggu ini turun 20% dari minggu lalu. Coba share link toko lebih sering?"

**Pelanggan:**
9. "5 pelanggan baru hari ini! Total kamu sudah punya 120 pelanggan"
10. "Bu Sari sudah pesan 5x bulan ini — pelanggan paling setia kamu"

**Prinsip penulisan:**
- Selalu akhiri dengan SARAN AKSI jika ada masalah
- Angka absolut, bukan persentase (kecuali sederhana "naik 30%")
- Emoji sparingly: hanya untuk arah (↑↓) dan celebrasi
- Maksimal 2 kalimat per insight

---

## 5. WA DIGEST FORMAT

### Daily Digest (kirim jam 21:00)

```
📊 Rekap Toko Kamu Hari Ini

👁 Pengunjung: 25 orang (↑10 dari kemarin)
📦 Pesanan: 8 (↑3 dari kemarin)
💰 Omzet: Rp 1.250.000

⭐ Paling laris: Kue Keju (12 pesanan)
💡 Kue coklat dilihat 30 orang tapi cuma 2 yang pesan — coba update foto?

Lihat detail: catatorder.id/rekap
```

### Weekly Digest (kirim Minggu jam 08:00)

```
📊 Ringkasan Minggu Ini (10-16 Mar)

👁 Total pengunjung: 180 orang (↑25% dari minggu lalu)
📦 Total pesanan: 45
💰 Total omzet: Rp 8.750.000

📈 Hari paling rame: Sabtu (45 pengunjung)
⏰ Jam paling rame: 19:00-21:00
⭐ Produk terlaris: Kue Keju (35 pesanan)
👤 Pelanggan baru: 12 orang
🔄 Pelanggan yang balik lagi: 8 orang

💡 Share link toko di WA Status jam 7-9 malam — itu jam paling rame!

🎉 Milestone: Toko kamu sudah dikunjungi total 500 orang!

Lihat detail: catatorder.id/rekap
```

### Anomaly Alert (real-time, max 1x/hari)

```
🔥 Toko kamu lagi rame!

50 orang buka toko kamu hari ini — biasanya cuma 15. Cek pesanan:
catatorder.id/pesanan
```

### Streak Reminder (jam 18:00 jika belum ada visitor)

```
Streak kamu 12 hari 🔥
Hari ini belum ada pengunjung — share link biar ga putus?

Link toko: catatorder.id/[slug]
```

### Aturan WA

- Max 1 WA/hari (daily digest). Anomaly + streak = opsional, total max 2/hari
- Jangan kirim jika 0 pengunjung dan 0 pesanan — kirim streak reminder saja
- Owner bisa opt-out (default = ON)

---

## 6. AI INSIGHT EXTENSION

CatatOrder sudah punya AI Analysis (Gemini Flash) di rekap. Extend ke data link toko.

### Prompt Template

```
Kamu adalah asisten toko online. Berikan SATU insight paling penting hari ini
dalam bahasa Indonesia sederhana, maksimal 2 kalimat. Jangan pakai istilah teknis.
Bayangkan kamu bicara ke ibu-ibu pemilik usaha katering.

DATA TOKO HARI INI:
- Nama toko: {store_name}
- Pengunjung: {page_views} orang (kemarin: {yesterday_views})
- Pesanan: {orders_count} (kemarin: {yesterday_orders})
- Omzet: Rp {revenue} (kemarin: Rp {yesterday_revenue})
- Produk paling banyak DILIHAT: {top_viewed_product} ({view_count}x dilihat)
- Produk paling banyak DIPESAN: {top_ordered_product} ({order_count}x dipesan)
- Produk dilihat tapi TIDAK dipesan: {viewed_not_ordered}
- Jam paling ramai: {peak_hour}
- Sumber pengunjung: WA {wa_count}, IG {ig_count}, Langsung {direct_count}

ATURAN:
1. Pilih SATU insight paling actionable
2. Selalu akhiri dengan saran konkret
3. Pakai "kamu" bukan "Anda"
4. Kalau semuanya bagus, puji — jangan cari-cari masalah
5. Jangan gunakan kata: conversion, bounce, traffic, engagement, CTR, funnel
6. Maksimal 2 kalimat
```

### Contoh Output AI

| Skenario | Output |
|----------|--------|
| Gap view-to-order | "Kue coklat kamu dilihat 30 orang tapi cuma 2 yang pesan — coba ganti foto yang lebih menarik?" |
| Traffic naik, order flat | "Pengunjung naik banyak hari ini tapi pesanan masih sama. Cek harga dan deskripsi produk ya?" |
| Semua bagus | "Mantap! Omzet naik 30% dan ada 3 pelanggan yang balik lagi pesan. Terus share link toko ya!" |
| Peak hour | "Pengunjung paling banyak jam 7-9 malam. Share link di WA Status jam segitu paling pas!" |
| Sepi | "Baru 3 orang buka toko hari ini. Coba share link di WA group atau posting di IG Story?" |

---

## 7. GAMIFICATION

### Visitor Streak (bukan order streak)

- **Definisi aktif:** minimal 1 pengunjung hari itu
- **Kenapa visitor bukan order:** order tergantung faktor eksternal, visitor bisa dipengaruhi owner (share link)
- **Evidence:** 7+ day streak = 2.3x daily engagement (Duolingo)

**Teks:**
- "Toko kamu dikunjungi 7 hari berturut-turut! Terus share link biar makin rame"
- Jika putus: "Streak kamu berhenti di 12 hari. Yuk mulai lagi — share link di WA Status sekarang?"

### Milestones

| Trigger | Teks | Share? |
|---------|------|--------|
| 1 pengunjung pertama | "Selamat! Orang pertama sudah lihat toko kamu!" | [Share ke WA] |
| 50 pengunjung | "Toko kamu sudah dilihat 50 orang!" | [Share ke WA] |
| 100 pengunjung | "100 orang sudah lihat toko kamu! Keren!" | [Share ke WA] |
| 500 pengunjung | "500 pengunjung! Toko kamu makin dikenal" | [Share ke WA] |
| 1000 pengunjung | "1000 pengunjung! Toko kamu populer" | [Share ke WA] |
| Pesanan ke-10 | "Pesanan ke-10! Bisnis kamu jalan terus" | [Share ke WA] |
| Pesanan ke-50 | "50 pesanan! Pelanggan makin banyak" | [Share ke WA] |
| Pesanan ke-100 | "100 pesanan! Kamu hebat!" | [Share ke WA] |
| Pelanggan setia pertama | "Kamu punya pelanggan setia pertama!" | - |

**Tombol [Share ke WA] = viral loop:** owner share milestone → orang lain lihat link toko → CatatOrder brand exposure.

### Comparison

- **BOLEH:** dengan diri sendiri ("Minggu ini lebih ramai dari minggu lalu")
- **JANGAN:** dengan toko lain (demotivasi)

---

## 8. ANTI-PATTERNS

### Metric yang JANGAN Ditampilkan

| Jangan | Kenapa | Alternatif |
|--------|--------|-----------|
| "Conversion rate: 6.2%" | Owner ga tahu bagus/jelek | "Dari 50 pengunjung, 8 yang pesan" |
| "Bounce rate: 72%" | Tidak tahu apa itu | Jangan tampilkan |
| "Sessions: 145" | Bingung session vs visit | "145 orang buka toko kamu" |
| "Avg duration: 2m 13s" | Abstrak | Skip |
| "CTR: 3.4%" | Acronym asing | Skip |

### Chart yang JANGAN Dibuat

| Jangan | Alternatif |
|--------|-----------|
| Pie chart distribusi produk | Ranking list: "1. Kue Keju (12)" |
| Line chart 30 hari | "Bulan ini naik 15% dari bulan lalu" |
| Heatmap jam x hari | "Paling rame jam 7-9 malam" |
| Funnel visualization | "30 lihat → 5 pesan" |

### Anti-Discouragement

| Situasi | Risiko | Solusi |
|---------|--------|--------|
| 0 pengunjung | Owner merasa gagal | Jangan tampilkan "0". Tampilkan: "Share link biar ada pengunjung!" |
| Banyak lihat, 0 pesan | Frustrasi | "20 orang tertarik lihat — coba update deskripsi biar mereka pesan" |
| Omzet turun | Demotivasi | Framing: "Biasa kalau awal minggu. Ramai lagi hari Kamis-Sabtu" |

**Prinsip emas:**
1. Highlight yang NAIK, minimize yang TURUN
2. Data negatif selalu sertakan SARAN AKSI
3. Tone selalu supportive, seperti teman yang menyemangati
4. Jangan tampilkan "0" tanpa konteks

---

## 9. BUILD SEQUENCE

### Phase 1: Track + Counter (1-2 hari)

**Build:**
- Event tracking `page_view` di halaman link toko
- Event tracking `product_view` (produk mana yang di-scroll)
- Counter "X pengunjung hari ini" di dashboard (1 card, angka besar)
- Deduplicate: sessionStorage flag supaya refresh tidak dihitung

**Database:**
- Tabel `link_views` (id, user_id, timestamp, referrer, session_id)
- Tabel `product_views` (id, user_id, product_name, timestamp, session_id)

**Impact:** MEDIUM-HIGH — owner untuk pertama kali TAHU ada orang lihat toko mereka

### Phase 2: WA Digest + Dashboard (1 minggu)

**Build:**
- WA daily digest jam 21:00 (template message)
- Dashboard halaman analytics: pengunjung, pesanan, omzet, produk laris, vs kemarin
- Perbandingan temporal: "X lebih banyak/sedikit dari kemarin"
- Deteksi sumber traffic (referrer: WA/IG/direct)

**Impact:** HIGH — WA digest = owner terima value TANPA buka app

### Phase 3: AI Insight + Gamification (2 minggu)

**Build:**
- AI insight terintegrasi (extend Gemini Flash dengan data link toko)
- "Produk dilihat tapi jarang dipesan" insight
- Jam ramai (peak hour)
- Pelanggan baru vs returning
- Visitor streak system
- Milestone system + [Share ke WA] button
- Weekly digest via WA

**Impact:** VERY HIGH — AI insight = differentiator, streak = 2.3x engagement

### Phase 4: Polish (nanti, setelah 50+ user)

**Build:**
- Conversion rate sederhana (jika volume cukup)
- Anomaly alert ("Toko kamu lagi rame!")
- Milestone sharing card (visual card untuk share di WA/IG)

---

## 10. RINGKASAN KEPUTUSAN

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Format utama | WA digest + simple in-app | WA open rate 95% |
| Metric utama | Pengunjung, pesanan, omzet, produk laris | Universal di semua 17 platform |
| Tampilan | Angka besar + teks, BUKAN chart | Chart gagal untuk UMKM (riset ACM) |
| AI insight | Extend Gemini Flash | Hanya Square AI yang punya — differentiator |
| Gamification | Visitor streak + milestone | Streak = 2.3x engagement |
| Comparison | Dengan diri sendiri saja | Leaderboard = demotivasi |
| Tone | Supportive, pakai "kamu" | Target ibu 30-45 tahun |
| Build order | Track → Digest → AI → Polish | Value tercepat: owner tahu ada yang lihat toko |
| Anti-pattern | No chart, no funnel, no acronym | 90% BukuWarung churn = fitur kompleks gagal |

---

**Source:** `/reality/20260315-store-analytics-research/` (17 platform benchmark + UMKM behavior research)
**Tanggal:** 2026-03-15
