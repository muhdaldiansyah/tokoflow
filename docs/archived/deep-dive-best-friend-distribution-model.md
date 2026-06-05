# Deep Dive: Model Distribusi via Teman untuk CatatOrder

> Chain-of-thought analysis berdasarkan riset akademik, data industri, dan studi kasus startup emerging market
>
> **Tanggal riset:** 15 Maret 2026 · **CatatOrder:** v3.1.0 · **Current users:** 1

---

## Daftar Isi

1. [Konteks & Pertanyaan Utama](#1-konteks--pertanyaan-utama)
2. [Apa Kata Riset tentang Bayar Teman untuk Referral](#2-apa-kata-riset-tentang-bayar-teman-untuk-referral)
3. [Konteks Indonesia: Gotong Royong vs Transaksi](#3-konteks-indonesia-gotong-royong-vs-transaksi)
4. [Tiga Kesalahan Fatal yang Harus Dihindari](#4-tiga-kesalahan-fatal-yang-harus-dihindari)
5. [Empat Model Viable, Diranking berdasarkan Evidence](#5-empat-model-viable-diranking-berdasarkan-evidence)
6. [Ranking dan Rekomendasi Final](#6-ranking-dan-rekomendasi-final)
7. [Panduan Praktis: Script & Framing](#7-panduan-praktis-script--framing)
8. [What NOT to Do](#8-what-not-to-do)
9. [Rangkuman Keputusan](#9-rangkuman-keputusan)
10. [Sources](#10-sources)

---

## 1. Konteks & Pertanyaan Utama

### Situasi

```
CatatOrder:
  Users:     1
  MRR:       Rp0
  ARPU:      Rp0-20K/bulan (kebanyakan user akan pakai gratis)
  Funding:   Bootstrapped (Rp0)
  Pricing:   50 free orders/month + Rp15K/50 pack + Rp35K unlimited

Dari analisis sebelumnya (deep-dive-best-sales-model.md):
  → Paid sales agent: ❌ TIDAK VIABLE (ARPU terlalu rendah)
  → Viral loop: ✅ tapi butuh users dulu
  → Champion model: ✅ BEST FIT
  → Founder personal: ✅ ESSENTIAL untuk 0-50 users
```

### Pertanyaan

Founder mau minta tolong teman untuk bantu distribusi. Pertanyaannya: **apa model kompensasi yang paling cocok?**

Ini berbeda dari "hire sales agent" karena:
- Ada elemen trust & relasi personal
- Teman bukan sales professional
- Budget sangat terbatas
- Hubungan pertemanan harus dijaga

### Kenapa Ini Butuh Riset Mendalam

Bayar teman untuk bantu startup = salah satu keputusan paling sensitif. Terlalu sedikit → friendship damaged. Terlalu banyak → cash habis. Model salah → hasil jelek DAN friendship rusak. Riset akademik dan data industri memberikan panduan yang surprisingly clear.

---

## 2. Apa Kata Riset tentang Bayar Teman untuk Referral

### Temuan Kritis #1: "Pay Enough or Don't Pay at All"

**Gneezy & Rustichini (2000), Quarterly Journal of Economics:**

Eksperimen klasik: tiga grup diminta bekerja. Grup A tidak dibayar. Grup B dibayar sedikit. Grup C dibayar cukup besar.

```
Hasil:
  Grup A (tidak dibayar):  PERFORMA BAIK  — motivasi sosial/altruistik
  Grup B (bayar sedikit):  PERFORMA TERBURUK — lebih jelek dari gratis!
  Grup C (bayar cukup):    PERFORMA TERBAIK — motivasi finansial bekerja

Kurva berbentuk U:
  Rp0 (gratis) ──── ↗ OK
  Rp5-15K (sedikit) ── ↘ LEBIH BURUK dari gratis
  Rp50K+ (cukup) ──── ↗↗ Terbaik

Kenapa?
  → Bayaran kecil MENGGANTI motivasi sosial ("bantu teman") dengan
    motivasi transaksional ("kerja dibayar")
  → Tapi bayarannya terlalu kecil untuk memotivasi secara transaksional
  → Hasilnya: kehilangan DUA-DUANYA — motivasi sosial sudah hilang,
    motivasi finansial belum cukup
```

**Temuan tambahan:** Para pembuat insentif (principals) TIDAK memprediksi efek ini. Mereka berasumsi bahwa bayaran berapapun lebih baik dari gratis. Riset menunjukkan asumsi ini SALAH.

**Implikasi langsung untuk CatatOrder:** Bayar teman Rp10-25K per user bisa LEBIH BURUK daripada tidak bayar sama sekali. Angka itu terlalu kecil untuk terasa sebagai "penghasilan" tapi cukup besar untuk mengubah dinamika dari "bantu teman" menjadi "kerja dibayar murah."

### Temuan Kritis #2: Uang Menurunkan Kualitas Referral

**Garnefeld et al. (2020), Marketing Science, field experiment 160.000+ nasabah bank, divalidasi dengan ~270.000 pelanggan telekomunikasi:**

```
Temuan:
  → Reward lebih besar = LEBIH BANYAK referral (kuantitas naik)
  → TAPI: reward lebih besar = kualitas referral JAUH LEBIH RENDAH
  → Referred customers dari reward besar = significantly less profitable

Mekanisme:
  Tanpa reward: teman hanya merekomendasikan ke orang yang
    BENAR-BENAR cocok → high quality match
  Dengan reward: teman merekomendasikan ke SIAPA SAJA agar
    dapat bonus → kuantitas naik, kualitas turun
```

**Studi pendukung — Employee Referral Programs (2022, field experiment di grocery chain):**

> "Larger referral bonuses increase referral quantity but decrease quality... as the referral bonus increases, workers lower their match quality thresholds, becoming willing to refer less qualified friends."

**Studi counter-point — Schmitt, Skiera, Van den Bulte (Journal of Marketing, 2011), ~10.000 nasabah bank 3 tahun:**

> Referred customers 18% more likely to stay, generate 16% more profit ($40 each). Bank earned 60% return on $25 referral reward.

**Rekonsiliasi:** Reward MODERAT mempertahankan kualitas. Reward BESAR menurunkannya. Threshold-nya yang menentukan.

**Implikasi:** Kalau bayar teman per-user, mereka akan terdorong onboard siapa saja (termasuk yang tidak cocok). Ini menurunkan retensi dan membuang waktu founder untuk support user yang tidak engaged.

### Temuan Kritis #3: Product Credits > Cash

**Jin & Huang (2014), International Journal of Research in Marketing, empat eksperimen:**

```
Cash reward vs in-kind reward (product credits, voucher):
  → In-kind rewards menghasilkan LEBIH BANYAK referral
  → Dan referral yang LEBIH BERKUALITAS

Mekanisme:
  Cash → "market exchange norms" (norma transaksi)
    → Orang merasa "aku jualan ke teman" → social cost tinggi
    → Orang merasa malu merekomendasikan karena motif uang terlihat

  In-kind → "social relationship norms" (norma sosial)
    → Orang merasa "aku berbagi sesuatu berguna"
    → Social cost rendah
    → Rekomendasi terasa authentic
```

**Contoh nyata — Dropbox:**
- Reward: 500MB storage (product credit), bukan cash
- Hasil: **3,900% growth** dalam 15 bulan (100K → 4M users)
- **35% daily signups** dari referral at peak
- Viral coefficient: 0.35 (setiap 10 user bawa 3.5 user baru)
- CAC **60% lebih rendah** dari paid advertising
- 2.8 juta invites/bulan di peak

**Contoh nyata — Airbnb:**
- Framing altruistik "Share $25 with your friend" **mengalahkan** "Earn $25 for inviting"
- Referral v2: **300% increase** bookings/signups, **900% YoY** first-time bookings
- Referred users book lebih sering dan refer lebih banyak (compounding effect)
- Curating 5-10 targeted invites outperformed mass blasts

**Contoh nyata — Robinhood:**
- Reward: random free stock ($2.50-$225), bukan cash
- 1 juta pre-launch signups, 2/3 dari referral
- Landing page convert **50%+**
- Setiap user bawa rata-rata **3 additional signups**

### Temuan Kritis #4: Budaya Non-WEIRD = Psychological > Monetary

**Nature Human Behaviour (2023), studi lintas budaya:**

```
Di budaya WEIRD (Western, Educated, Industrialized, Rich, Democratic):
  → Uang 52% lebih efektif dari motivasi psikologis

Di budaya NON-WEIRD (Indonesia, India, Mexico, dll):
  → Keunggulan uang vs motivasi psikologis JAUH LEBIH KECIL (27%)
  → Eksperimen spesifik: di antara bilingual Facebook users di India,
    uang meningkatkan effort 27% dalam bahasa Hindi vs 52% dalam
    bahasa Inggris — bahasa sebagai cultural frame changer
  → Motivasi sosial, status, rasa membantu = relatif LEBIH KUAT
    di budaya kolektivis
```

**Implikasi:** Apa yang berhasil di Silicon Valley (cash incentive, stock options) belum tentu optimal di Indonesia. Status, gotong royong, dan rasa berbagi = motivator yang relatif lebih kuat di konteks Indonesia.

### Temuan Kritis #5: Two-Sided > One-Sided Rewards

**Data industri referral (2025):**

```
One-sided (hanya referrer dibayar):  29% completion rate
Two-sided (keduanya dapat benefit):  52% completion rate

91.2% referral program top-performing sekarang pakai two-sided
65% referrer PREFER share reward (merasa lebih baik kalau teman juga benefit)
Two-sided meningkatkan referral rate sebesar 45% (HBR research)
```

**Twist menarik:** Emerging research menunjukkan recipient-only rewards (HANYA yang dirujuk dapat) bisa performa mirip two-sided dengan setengah biaya. Artinya "Kasih temanmu 50 pesanan gratis" bisa lebih efektif dari "kamu dapat 50, temanmu juga dapat 50."

### Temuan Kritis #6: Overjustification Effect

**Deci, Koestner & Ryan (1999), meta-analisis 128 studi:**

```
Tangible, expected, contingent rewards MENURUNKAN intrinsic motivation:
  Engagement-contingent rewards: d = -0.40
  Completion-contingent rewards: d = -0.36
  Performance-contingent rewards: d = -0.28

TAPI: positive verbal feedback (non-monetary) MENINGKATKAN motivasi:
  d = +0.33

Artinya:
  → Bayar teman untuk bantu → intrinsic motivation turun
  → Puji teman, tunjukkan impact, share wins → intrinsic motivation NAIK
  → "Gara-gara kamu, Bu Sari gak kehilangan orderan lagi" > Rp25K
```

---

## 3. Konteks Indonesia: Gotong Royong vs Transaksi

### Bagaimana Orang Indonesia Merekomendasikan Produk

```
Nielsen Indonesia:
  89% orang Indonesia percaya rekomendasi teman/keluarga
  vs 61% percaya iklan search
  vs 54% percaya iklan media sosial

Kantar Indonesia:
  93% konsumen Indonesia percaya keluarga & teman untuk info brand

Riset WOM Indonesia:
  Rekomendasi yang efektif = "disampaikan lebih jujur karena dianggap
  tidak ada motif tersembunyi (no ulterior motives)"
```

**Kata kunci: "tidak ada motif tersembunyi."** Begitu teman terlihat "dibayar" untuk merekomendasikan CatatOrder, kekuatan rekomendasinya TURUN drastis. Orang yang mendengar akan berpikir: "Oh dia disuruh, bukan genuine."

### Sungkan dan Framing

```
Sungkan = perasaan segan/tidak enak dalam konteks sosial Indonesia
Manifestasi: reluctance to say no, reluctance to ask for payment,
  indirectness in business dealings within social relationships

Kalau kamu frame: "Aku bayar kamu Rp25K per user"
  → Teman: "Wah kayak kerja, tapi bayarannya gak seberapa"
  → Sungkan untuk ambil uang segitu dari teman
  → Sungkan untuk minta lebih (karena dia tahu kamu bootstrapped)
  → Hubungan jadi awkward — hitungan masuk, rasa keluar

Kalau kamu frame: "Tolong bantu ya, nanti aku kasih sesuatu sebagai terima kasih"
  → Teman: "OK, bantu teman"
  → Motivasi sosial utuh, gotong royong intact
  → Gift yang datang kemudian = surprise yang memperkuat hubungan
  → Tidak ada "harga per jam" yang bisa dihitung dan diprotes
```

### Berbagi vs Jualan — Garis Budaya yang Krusial

```
Indonesia cultural research:
  "Berbagi" (sharing something useful) → WELCOMED
  "Jualan" (selling for personal gain) → SOCIAL DISCOMFORT

WhatsApp groups = primary product discovery channel:
  → Members buy from trusted sellers because of known reputation
  → Products "more easily accepted" when shared organically
  → But: commercial intent that's too obvious triggers resistance

Word-of-mouth marketing in Indonesia:
  "Quite effective in reaching Indonesian consumers who have a
  culture of mutual cooperation (gotong royong) and strong
  social interaction" — but ONLY when it feels genuine
```

### Pelajaran dari Distribusi Indonesia yang Berhasil

**Gojek awal (2010):**
- Nadiem Makarim rekrut 20 ojek pertama SECARA PERSONAL di pangkalan
- Driver pertama: Mulyono (Gojek 001) di Blok M
- Dari 15 yang didekati, hanya 2 yang tertarik awalnya
- Driver pertama jadi recruiter organik — BUKAN karena dibayar, tapi karena produk bekerja
- Later: cash bonuses untuk referral driver di lokasi strategis (SETELAH product-market fit terbukti)

**BukuWarung (2019):**
- Co-founders interview 400 merchant sebelum build product
- 600K merchants di 750 kota dalam ~1 tahun
- Growth dari: app ringan + offline-capable + WA-native sharing
- BUKAN dari paid agents atau referral bonuses

**Mapan (diakuisisi Gojek):**
- Digitalisasi arisan → 2.5 juta agen (Mitra Usaha Mapan)
- Agen = ketua arisan yang SUDAH dipercaya di komunitas
- Kompensasi: cashback + loyalty rewards (emas, motor, tabungan)
- Framing: community empowerment, BUKAN sales commission

**Evermos (social commerce):**
- 100.000+ reseller di 500+ kota tier 2/3
- Reseller mendapat **15-30% commission** per sale
- Tapi ini untuk PRODUK FISIK dengan margin 30%+
- Untuk SaaS Rp15-35K, model ini tidak applicable

**M-Pesa (Kenya, 2007):**
- Pilot dimulai dengan 8 toko agen, BUKAN teman/keluarga
- Mengkonversi EXISTING airtime dealer network → M-Pesa agents
- Agent pertama: Esther Muchemi (Agent 0001), pemilik toko telekomunikasi
- Kunci sukses: leverage jaringan yang SUDAH ADA, bukan bangun dari nol

**Paul Graham, Y Combinator — "Do Things That Don't Scale":**
- Stripe ("Collison installation"): founders langsung setup Stripe di laptop calon user ON THE SPOT
- Airbnb: founders door-to-door di New York bantu hosts 30 hari straight
- Principle: "Recruit users manually... if you can find someone with a problem and solve it manually, do that for as long as you can"

---

## 4. Tiga Kesalahan Fatal yang Harus Dihindari

### Kesalahan #1: Bayar Per-User Kecil (Rp10-25K)

```
Kenapa fatal (evidence-based):
  1. Gneezy/Rustichini (2000): bayaran kecil → performa LEBIH BURUK dari gratis
  2. Mengubah frame dari "bantu teman" → "kerja murah" (reframing)
  3. Teman menghitung: "Kalau aku spend 1 jam per user, Rp25K/jam?
     Grab aja Rp30K/jam. Ini kerja rodi."
  4. Garnefeld (2020): paid referrals menurunkan kualitas user
  5. Deci meta-analysis: tangible rewards menurunkan intrinsic motivation
  6. Jin & Huang (2014): cash meningkatkan social cost referral
  7. Orang yang dirujuk curiga: "Dia dapat komisi ya?"
     → Rekomendasi kehilangan kekuatan trust (89% trust advantage gone)

Riset konsisten: jangan berada di "dead zone" antara Rp0 dan Rp50K+
```

### Kesalahan #2: Treat Teman Sebagai Sales Agent

```
Kenapa fatal:
  1. Teman bukan sales professional — mereka tidak mau "jualan"
  2. Budaya Indonesia: "jualan ke teman" = social discomfort (berbagi ≠ jualan)
  3. Target mingguan, laporan progress, KPI → merusak hubungan
  4. Kalau hasilnya jelek → siapa yang salah? Friendship at risk
  5. "Minta tolong" ≠ "hire" — mixing these destroys both frames
  6. Sungkan: teman gak enak bilang "gak bisa" tapi juga gak optimal kerjanya

Pelajaran dari Gojek:
  Nadiem TIDAK bayar Mulyono untuk rekrut driver lain.
  Mulyono rekrut secara organik karena produk bekerja dan dia PERCAYA.
  Cash bonuses untuk referral baru masuk SETELAH product-market fit terbukti.
```

### Kesalahan #3: Janji Besar Tanpa Komitmen Tertulis

```
Kenapa fatal:
  1. "Nanti kalau sukses kamu dapat share" tanpa detail = resep konflik
  2. Friendship + uang + janji ambigu = kombinasi paling berbahaya
  3. Kalau CatatOrder gagal: teman merasa waktunya terbuang
  4. Kalau CatatOrder sukses: teman merasa bagiannya kurang
  5. Either way: friendship bisa terdamage

Rule: apapun yang dijanjikan, tulis di WA/doc.
  Sederhana, jelas, no ambiguity.
  Bukan kontrak formal — tapi pesan WA yang clear tentang:
  → Apa yang diminta
  → Apa yang ditawarkan sebagai terima kasih
  → Kapan dan bagaimana
```

---

## 5. Empat Model Viable, Diranking berdasarkan Evidence

### Model A: "Berbagi, Bukan Jualan" (Product Credits, Two-Sided)

```
COCOK UNTUK: Teman yang JUGA pemilik usaha makanan / UMKM

Mekanisme:
  → Teman jadi user CatatOrder sendiri dulu
  → Mereka pakai, merasakan manfaat langsung
  → Mereka share ke sesama penjual dari PENGALAMAN NYATA
  → Setiap user baru yang aktif (3+ pesanan):
    → Teman (referrer) dapat 25 pesanan gratis
    → User baru (referred) juga dapat 25 pesanan gratis
    → Two-sided, altruistic framing

Framing WA dari teman ke calon user:
  "Bu, ini yang saya pakai buat catat pesanan. Enak banget,
   gak perlu scroll chat lagi. Mau coba? Gratis 50 pesanan
   per bulan, terus kalau daftar lewat link saya, kita berdua
   dapat bonus 25 pesanan."

Kenapa ini model terbaik (berdasarkan riset):
  ✅ Rekomendasi dari PENGALAMAN, bukan bayaran → trust tertinggi (89% Nielsen)
  ✅ Product credits, bukan cash → Jin & Huang 2014 (lebih efektif, less social cost)
  ✅ Two-sided → 52% completion vs 29% one-sided (industry data)
  ✅ Altruistic framing → Airbnb proof: "share" > "earn"
  ✅ Berbagi, bukan jualan → sesuai norma sosial Indonesia
  ✅ Avoids Gneezy dead zone — no cash at all
  ✅ Self-reinforcing: semakin banyak credits, semakin engaged
  ✅ Dropbox model: 3,900% growth dengan product credits

Cost:
  Cash: Rp0
  Product credits: marginal cost ~Rp0 (SaaS, no COGS)
  Setiap referral = 50 order credits total = Rp0 actual cost

Projected output:
  1 teman UMKM → 5-15 user organik (peer trust)
  3 teman UMKM → 15-45 users
  Conversion to paid: ~5% × 30 = 1-2 paying users
  Timeline: 2-3 bulan

Limitation:
  Hanya bisa kalau teman juga punya usaha makanan
  Butuh teman yang genuine suka produknya (gak bisa dipaksakan)
```

**Evidence strength: SANGAT KUAT** — didukung Dropbox (3,900%), Airbnb (300%), Gneezy/Rustichini, Jin & Huang, Garnefeld, Deci meta-analysis, Nielsen Indonesia.

---

### Model B: "Mitra Awal" (Founding Partner, Appreciation-Based)

```
COCOK UNTUK: Teman dekat yang percaya visi kamu dan mau "invest" waktu

Mekanisme:
  → Jujur dari awal: "Aku belum bisa bayar banyak. Tapi kalau ini
     berhasil, kamu bagian dari cerita awalnya."
  → Teman membantu onboard user selama 1 bulan
  → TIDAK ada per-user micro-payment

Apa yang teman DAPAT:
  1. Status: "Mitra Awal CatatOrder" — named di about page, marketing
  2. Akses: direct WA line ke founder, input pada product decisions
  3. Appreciation gift SETELAH 1 bulan bantu:
     → Rp300-500K sebagai TERIMA KASIH (bukan "bayaran")
     → Framing: "Ini buat kamu, makasih banget udah bantu sebulan ini"
  4. Milestone bonuses yang DITULIS JELAS:
     → CatatOrder reach 50 users aktif → Rp500K
     → CatatOrder reach 200 users aktif → Rp1.5M
     → CatatOrder reach Rp5M MRR → Rp3M
  5. CatatOrder unlimited selamanya (kalau mereka punya usaha)

Kenapa ini bisa bekerja (berdasarkan riset):
  ✅ Status & recognition > uang kecil (Nature 2023, non-WEIRD cultures)
  ✅ Avoids Gneezy dead zone — tidak ada per-user micro-payment
  ✅ "Thank you gift" = social norms preserved (bukan market norms)
  ✅ Milestone bonus = "pay enough" (Rp500K+), bukan "pay a little"
  ✅ Helper's high: dopamine dari membantu teman (UC Berkeley research)
  ✅ Gotong royong frame: "kita bangun bareng"
  ✅ Deci: verbal recognition + visible impact → meningkatkan motivation
  ✅ Paul Graham: "do things that don't scale" → personal, deep involvement

Cost analysis:
  Immediate: Rp300-500K after 1 month (one-time appreciation gift)
  At 50 users: Rp500K milestone bonus
  At 200 users: Rp1.5M milestone bonus
  Total if reach 200 users: ~Rp2-2.5M

  Bandingkan:
  → Hired agent 1 bulan: Rp3-5M (gaji) + management overhead
  → Google Ads Rp2.5M: mungkin 500 klik, 25 signup, 10 aktif
  → Mitra Awal Rp2.5M: 50-200 users yang properly onboarded

  Mitra Awal = 5-20x lebih cost-effective dari alternatif

Projected output:
  1 Mitra Awal → bantu onboard 10-25 users dalam 1-2 bulan
  Kualitas: properly onboarded, product explained, setup assisted
  Timeline: 1-2 bulan intensif

Limitation:
  Butuh teman yang genuinely care (tidak bisa transaksional)
  Tidak scalable — works for 1-2 close friends
  Milestone bonuses = commitment dari founder (harus dihormati)
```

**Evidence strength: KUAT** — didukung Gojek early story, Paul Graham, helper's high research, Nature 2023 cultural study.

---

### Model C: "Gotong Royong" (Pure Social, No Formal Structure)

```
COCOK UNTUK: Teman yang bilang "gak usah dibayar" tapi tetap mau bantu

Mekanisme:
  → Teman bantu karena gotong royong, bukan kontrak
  → Kamu tunjukkan apresiasi melalui RECIPROCITY, bukan payment:
     - Traktir makan/kopi setiap kali ketemu (Rp50-100K)
     - Pulsa/GoPay "jajan" Rp50-100K tiap 2 minggu
     - Share wins secara personal: "Gara-gara kamu, udah 15 user!"
     - Di momen penting (lebaran, ulang tahun): hadiah meaningful
  → JANGAN formalize dengan per-user pricing
  → Keep it social, keep it genuine

Kenapa ini bisa bekerja:
  ✅ Purest form of gotong royong — culturally native
  ✅ Avoids ALL transactional framing
  ✅ Sungkan-safe: tidak ada "harga" yang bisa dihitung
  ✅ Cialdini reciprocity principle: gifts create organic obligation
  ✅ Helper's high sustained — no extrinsic motivation crowding (Deci)
  ✅ Intrinsic motivation preserved — friend helps because they want to

Cost:
  ~Rp200-400K/bulan dalam bentuk "jajan" dan appreciation
  Unpredictable — based on relationship dynamics, not structure

Projected output:
  Depends heavily on friend's enthusiasm and network
  Realistic: 5-15 users over 1-2 months
  Quality: highest (only recommends to people they think really fit)

Limitation:
  Hanya untuk teman yang BENAR-BENAR close
  Cannot scale (works for 1 friend, maybe 2)
  Unpredictable output
  Risk: teman diam-diam merasa under-appreciated
    → founder harus PEKA dan proactively show gratitude
```

**Evidence strength: MODERATE** — didukung gotong royong research (PMC), Cialdini reciprocity, Deci intrinsic motivation, Indonesian trust dynamics. Tapi less structured = less predictable.

---

### Model D: "Bayar Cukup" (Lump Sum per Batch)

```
COCOK UNTUK: Teman yang mau bantu tapi BUTUH kompensasi nyata

Mekanisme:
  → Bayar LUMP SUM per "batch" onboarding, BUKAN per-user
  → "Tolong bantu onboard 10 user dalam 2 minggu. Aku kasih Rp500K
     setelah selesai."
  → Rp500K ÷ 10 user = Rp50K/user (DI ATAS Gneezy dead zone)
  → Rp500K ÷ ~10 jam kerja = Rp50K/jam (fair untuk side gig)
  → Framing: "project fee" / "bantuan project", bukan "komisi per user"

Kenapa ini bisa bekerja:
  ✅ "Pay enough" — Rp500K is above the Gneezy dead zone
  ✅ Lump sum = no micro-payment awkwardness
  ✅ Project-based = clear scope, clear end
  ✅ Fixed fee = teman tahu persis apa yang mereka dapat
  ✅ No ongoing obligation — clean exit point
  ✅ Schmitt et al.: moderate rewards preserve referral quality

Tapi ada DOWNSIDE:
  ⚠️ Cash payment → invokes market norms (Jin & Huang 2014)
  ⚠️ Rekomendasi mungkin terasa less genuine ke yang dirujuk
  ⚠️ Garnefeld 2020: paid referrals = lower quality users
  ⚠️ Kamu keluar Rp500K upfront, mungkin semua user pakai gratis
  ⚠️ Kalau user gak retain, uang sudah keluar, tidak bisa ditarik

Cost:
  Rp500K per batch 10 user (one-time)
  Bisa repeat: Rp500K per batch berikutnya
  Total budget needed: Rp500K-1.5M

Projected output:
  10-15 users per batch (properly onboarded)
  Quality: moderate (some may be "warm body" referrals)
  Timeline: 2-3 minggu per batch

Limitation:
  Paling "transactional" dari semua model
  Recommendation quality may suffer (Garnefeld effect)
  Butuh budget cash Rp500K+ upfront
  Risk: if users don't retain, cash is lost
```

**Evidence strength: MIXED** — Gneezy says "pay enough" works, tapi Garnefeld says paid referrals have lower quality. Jin & Huang says cash < in-kind. Not clearly better or worse than Model B.

---

## 6. Ranking dan Rekomendasi Final

### Head-to-Head Comparison

| Kriteria | A: Berbagi | B: Mitra Awal | C: Gotong Royong | D: Bayar Cukup |
|---|---|---|---|---|
| **Trust level rekomendasi** | Tertinggi | Tinggi | Tinggi | Sedang |
| **Kualitas user yang dirujuk** | Tertinggi | Tinggi | Tinggi | Sedang-rendah |
| **Cash cost** | Rp0 | Rp300-500K + milestone | ~Rp200-400K/bulan | Rp500K/batch |
| **Sustainable?** | Ya (self-reinforcing) | Terbatas (1-2 orang) | Terbatas (relationship) | Terbatas (budget) |
| **Scalable?** | Ya (referral system) | Tidak | Tidak | Sedikit |
| **Friendship risk** | Sangat rendah | Rendah | Rendah | Sedang |
| **Gneezy-safe?** | Ya (no cash) | Ya (lump, not micro) | Ya (no formal pay) | Ya (above dead zone) |
| **Research support** | Sangat kuat | Kuat | Moderate | Mixed |

### Ranking

```
#1  Model A: "Berbagi" (Product Credits)     — kalau teman punya usaha
#2  Model B: "Mitra Awal" (Appreciation)     — kalau teman dekat mau invest waktu
#3  Model C: "Gotong Royong" (Pure Social)   — kalau teman close & volunteer
#4  Model D: "Bayar Cukup" (Lump Sum)        — kalau teman butuh kompensasi cash
```

### Rekomendasi: Kombinasi A + B

```
BEST APPROACH:

LANGKAH 1 — Engine (Model A):
  → Cari 1-2 teman yang JUGA punya usaha makanan/katering
  → Jadikan mereka user CatatOrder dulu
  → Bantu setup Link Toko, produk, QRIS
  → Setelah mereka merasakan manfaat (1-2 minggu):
    "Kalau ada temen sesama jualan, boleh share. Nanti kalian
     berdua dapat bonus 25 pesanan gratis."
  → Ini ENGINE — scalable, zero cash, highest trust

LANGKAH 2 — Booster (Model B):
  → Minta 1 teman dekat yang punya koneksi UMKM
  → Jelaskan situasi jujur: belum ada revenue, butuh bantuan
  → Mereka jadi "Mitra Awal" — bantu onboard selama 1 bulan
  → Appreciation gift Rp300-500K setelah 1 bulan
  → Milestone bonus di-tulis jelas
  → Ini BOOSTER — not scalable, tapi high-impact untuk start

LANGKAH 3 — Loop Activation:
  → Setelah 10-20 users dari Langkah 1 + 2
  → Viral loop mulai berputar organik
  → Setiap WA message, Link Toko, receipt = CatatOrder branding
  → Users refer users tanpa intervensi

HINDARI: Model D (Bayar Cukup) kecuali teman secara eksplisit bilang
  mereka BUTUH cash compensation. Kalau bisa pakai A atau B, prioritaskan.

PALING HINDARI: per-user micro-payment (Rp10-25K)
  → Riset konsisten: ini LEBIH BURUK dari tidak bayar
```

### Budget Summary

```
Model A (Berbagi):
  Cash: Rp0
  Product credits: Rp0 marginal cost

Model B (Mitra Awal):
  Month 1 gift: Rp300-500K
  Milestone 50 users: Rp500K
  Milestone 200 users: Rp1.5M
  Total if reach 200 users: Rp2-2.5M over ~6 months

Combined A + B:
  Total budget needed: Rp300-500K to start, up to Rp2.5M over time
  Expected output: 50-200 users over 3-6 months
  Cost per user: Rp12.5K-50K (far below Rp150K+ hired agent cost)
```

---

## 7. Panduan Praktis: Script & Framing

### Script untuk Teman yang Punya Usaha (Model A)

**Langkah 1 — Jadikan user dulu (WA message):**

> Eh [nama], aku bikin tool buat catat pesanan UMKM. Namanya CatatOrder. Basically customer kamu bisa pesan langsung dari link, gak perlu chat WA satu-satu. Pesanan masuk otomatis ke dashboard, ada rekap harian juga. Mau coba? Gratis kok 50 pesanan per bulan. Aku bantu setup-in.

**Langkah 2 — Setelah mereka pakai 1-2 minggu dan merasa manfaat:**

> Gimana, enak kan? Kalau kamu ada temen sesama jualan yang mungkin butuh, boleh share. Nanti kalau mereka daftar dan aktif, kalian berdua dapat bonus 25 pesanan gratis.

**JANGAN bilang:**
- "Aku bayar kamu Rp25K per user yang kamu bawa ya"
- "Tolong sebarkan ke semua temen kamu"
- "Target 10 user ya minggu ini"

### Script untuk Teman Dekat (Model B)

**Langkah 1 — Ngobrol langsung (bukan WA — ini butuh suasana personal):**

> Aku mau cerita soal CatatOrder. Ini masih awal banget, baru 1 user. Aku butuh bantuan untuk approach ibu-ibu katering/kue buat coba pakai. Aku tahu waktu kamu berharga, dan jujur aku belum bisa bayar banyak karena belum ada revenue. Tapi aku mau hargain bantuanmu — setelah 1 bulan, aku mau kasih [Rp300-500K] sebagai tanda terima kasih. Dan kalau ini berhasil sampai [50 user], aku mau kasih bonus lebih besar karena kamu bagian dari awalnya.

**Langkah 2 — Follow-up WA (kejelasan tertulis):**

> Makasih ya [nama]! Biar clear, ini yang kita sepakati:
>
> - Kamu bantu approach & onboard penjual makanan selama 1 bulan
> - Aku kasih Rp[X] di akhir bulan sebagai terima kasih
> - Kalau CatatOrder sampai 50 user aktif, bonus Rp500K
> - Kamu jadi "Mitra Awal CatatOrder" — unlimited gratis selamanya
>
> Gak ada target wajib, gak ada pressure. Kalau di tengah jalan gak cocok atau sibuk, gak apa-apa sama sekali. Appreciate banget bantuannya!

**Kunci framing:**
- Jujur tentang situasi (belum ada revenue, bootstrapped)
- Spesifik tentang apresiasi (angka, timing)
- No pressure (boleh berhenti kapan saja)
- Written confirmation (menghindari ambiguity)

### Yang Harus Dilakukan Selama Proses

```
WEEKLY:
  → Check-in casual: "Gimana? Ada kesulitan? Ada feedback?"
  → Share wins: "User yang kamu bantu kemarin udah 15 pesanan minggu ini!"
  → Show impact: "Bu Sari bilang gak pernah kehilangan orderan lagi"
  → BUKAN micromanage: jangan minta laporan, jangan kasih target

SETELAH 1 BULAN:
  → Kasih appreciation gift TEPAT WAKTU (jangan tunda)
  → Verbal recognition: "Makasih banget ya, ini bener-bener ngebantu"
  → Ask: "Mau lanjut bulan depan atau udah cukup? Either way gak apa-apa"
```

### Exit Clause yang Fair

```
Buat kedua belah pihak:
  → Teman bisa berhenti kapan aja tanpa awkward
  → "Kalau sibuk atau gak cocok, gak apa-apa. Makasih udah bantu."
  → Milestone bonuses tetap berlaku untuk kontribusi yang sudah dilakukan
  → Tidak ada clawback atau hutang
```

---

## 8. What NOT to Do

| Jangan | Kenapa (Evidence) |
|---|---|
| Bayar Rp10-25K per user | Gneezy/Rustichini 2000: performs WORSE than Rp0 (dead zone) |
| Kasih target mingguan / KPI | Merusak hubungan, ini tolong-menolong bukan employment |
| Janji revenue share tanpa detail | Resep konflik — tulis angka spesifik atau jangan janji |
| Bilang "nanti kalau sukses" tanpa angka | Ambiguity = resentment di kemudian hari |
| Treat 2+ teman sebagai "sales team" | Management overhead > value, friendship risk multiplied |
| Kasih bonus per SIGNUP (bukan per AKTIF) | Garnefeld 2020: incentivizes quantity over quality |
| Kasih cash tanpa framing yang benar | Cash = market norms → rekomendasi terasa less genuine (Jin & Huang) |
| Libatkan terlalu banyak teman sekaligus | Fokus 1-2 orang, dalam 1 komunitas, deep > wide |
| Bandingkan progress antar teman | Social comparison merusak motivasi dan hubungan |
| Lupa berterima kasih | Deci: verbal recognition meningkatkan motivasi. Silence kills it |

---

## 9. Rangkuman Keputusan

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  MODEL TERBAIK: A + B (Berbagi + Mitra Awal)                        │
│                                                                      │
│  5 Prinsip dari Riset:                                               │
│  1. Product credits > cash (Jin & Huang 2014, Dropbox 3,900%)       │
│  2. Bayar cukup ATAU jangan bayar (Gneezy/Rustichini 2000)         │
│  3. Berbagi > jualan (Nielsen Indonesia 89% trust, gotong royong)   │
│  4. Two-sided rewards (91% industry standard, 52% completion)       │
│  5. Status & recognition > uang kecil di Indonesia                  │
│     (Nature 2023, non-WEIRD cultures)                               │
│                                                                      │
│  Untuk teman punya usaha (Model A):                                  │
│  → Jadikan user → recommend dari experience → product credits       │
│  → Cash cost: Rp0                                                    │
│                                                                      │
│  Untuk teman dekat bantu onboard (Model B):                         │
│  → Mitra Awal → appreciation gift → milestone bonus                 │
│  → Cash cost: Rp300-500K + milestone bonuses                        │
│                                                                      │
│  HINDARI: per-user micro-payment (Rp10-25K)                         │
│  → Gneezy: LEBIH BURUK dari tidak bayar                             │
│  → Garnefeld: menurunkan kualitas referral                          │
│  → Jin & Huang: cash meningkatkan social cost                       │
│                                                                      │
│  Total budget: Rp300-500K to start                                   │
│  Expected output: 20-50 users dalam 2-3 bulan                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Sources

### Behavioral Economics & Referral Research

- [Gneezy & Rustichini, "Pay Enough or Don't Pay at All" (2000) — Quarterly Journal of Economics](https://rady.ucsd.edu/_files/faculty-research/uri-gneezy/pay-enough.pdf)
- [Garnefeld et al., "Referral Reward Size and New Customer Profitability" (2020) — Marketing Science, 160K+ customers](https://pubsonline.informs.org/doi/abs/10.1287/mksc.2020.1242)
- [Jin & Huang, "When Giving Money Does Not Work" (2014) — International Journal of Research in Marketing](https://www.sciencedirect.com/science/article/abs/pii/S0167811613000906)
- [Schmitt, Skiera & Van den Bulte, "Referral Programs and Customer Value" (2011) — Journal of Marketing, ~10K customers 3 years](https://journals.sagepub.com/doi/10.1509/jm.75.1.46)
- [Deci, Koestner & Ryan, "Extrinsic Rewards and Intrinsic Motivation" (1999) — Meta-analysis 128 studies](https://pubmed.ncbi.nlm.nih.gov/10589297/)
- [Nature Human Behaviour, "Monetary vs Psychological Incentives in WEIRD vs Non-WEIRD Cultures" (2023)](https://www.nature.com/articles/s41562-023-01769-5)
- [HBR, "Social Pressure Is a Better Motivator Than Money" (2012)](https://hbr.org/2012/09/stop-wasting-money-on-motivati)
- [UC Berkeley Greater Good, "The Helper's High" — neuroscience of helping](https://greatergood.berkeley.edu/article/item/the_helpers_high)
- [The Decision Lab, "Crowding Out Effect"](https://thedecisionlab.com/reference-guide/psychology/crowding-out)
- [Springer, "Unintended Reward Costs" — Journal of Academy of Marketing Science](https://link.springer.com/article/10.1007/s11747-019-00635-z)
- [ECONtribute, "Employee Referral Bonus and Quality" (2022) — field experiment grocery chain](https://www.econtribute.de/RePEc/ajk/ajkdps/ECONtribute_164_2022.pdf)
- [ScienceDirect, "Reward-Product Congruence Effect" (2021) — Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.644412/full)

### Referral Program Data & Benchmarks

- [Dropbox referral: 3,900% growth in 15 months — Viral Loops](https://viral-loops.com/blog/dropbox-grew-3900-simple-referral-program/)
- [PayPal $20 referral: 100M users — QueueForm](https://www.queueform.com/blog/how-paypal-gained-100m-users-with-a-simple-20-referral-bonus)
- [Airbnb referral v2: 300% increase — Viral Loops](https://viral-loops.com/blog/airbnb-referral-billion-dollar-formula/)
- [Airbnb Engineering, "Hacking Word-of-Mouth"](https://medium.com/airbnb-engineering/hacking-word-of-mouth-making-referrals-work-for-airbnb-46468e7790a6)
- [Uber referral: 25% higher LTV — Viral Loops](https://viral-loops.com/blog/uber-referral-program-case-study/)
- [Robinhood: 1M pre-launch signups, 2/3 from referral — Viral Loops](https://viral-loops.com/blog/robinhood-referral-got-1-million-users/)
- [Two-sided vs one-sided rewards: 52% vs 29% completion — impact.com](https://impact.com/referral/better-referral-rewards-recipient-incentives/)
- [Referral marketing statistics 2025 — impact.com](https://impact.com/referral/top-10-referral-marketing-statistics/)
- [Referral program benchmarks 2026 — ReferralCandy](https://www.referralcandy.com/blog/referral-program-benchmarks-whats-a-good-conversion-rate-in-2025)
- [Referral marketing statistics — GrowSurf](https://growsurf.com/statistics/referral-marketing-statistics/)

### Indonesian Startup Distribution & Culture

- [Gojek Wikipedia — Nadiem recruiting first 20 drivers](https://en.wikipedia.org/wiki/Gojek)
- [Cerita Mul, Driver Pertama Gojek — Detik Finance](https://finance.detik.com/berita-ekonomi-bisnis/d-6140308/cerita-mul-driver-pertama-gojek-kantornya-bekas-garasi-mobil)
- [BukuWarung 6.5M merchants — TechCrunch](https://techcrunch.com/2021/06/09/bukuwarung-a-fintech-for-indonesian-msmes-scores-60m-series-a-led-by-valar-and-goodwater/)
- [BukuKas early story — KrASIA](https://kr-asia.com/bukukas-keeps-indonesian-smes-books-free-of-error-startup-stories)
- [Khatabook 8M MAU — TechCrunch](https://techcrunch.com/2021/08/23/indias-khatabook-raises-100-million-for-its-bookkeeping-platform-for-merchants/)
- [Mapan 2.5M agents — Flourish Ventures](https://flourishventures.com/perspectives/mapan-helps-indonesian-women-empower-each-other-with-social-fintech/)
- [Evermos 100K+ resellers, 15-30% commission — TechCrunch](https://techcrunch.com/2021/09/21/indonesian-social-commerce-startup-evermos-lands-30m-series-b/)
- [Mitra Bukalapak 56% warung penetration — Medium](https://medium.com/inside-bukalapak/how-mitra-bukalapak-helped-indonesias-warung-move-to-a-21st-century-business-model-6a993302446d)
- [Gotong royong and MSE development — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7492849/)
- [Sungkan culture impact — Medium](https://medium.com/@mosessetiady13/the-silent-career-killer-how-the-culture-of-sungkan-might-impact-your-growth-64dfaee9b6fd)
- [Nielsen Indonesia: 89% trust word-of-mouth](https://www.nielsen.com/insights/2015/malaysians-trust-word-of-mouth-recommendations-most/)
- [WhatsApp Business for UMKM Indonesia](https://www.whatsapp.com/stories/business/Indonesia)
- [WOM marketing Indonesia — Qontak](https://qontak.com/blog/word-of-mouth-marketing/)
- [Consumer psychology collectivist culture — PARADE RISET](https://ejurnal.ubharajaya.ac.id/index.php/PARS/article/view/4752)

### Startup Distribution Strategy

- [Paul Graham, "Do Things That Don't Scale"](https://www.paulgraham.com/ds.html)
- [Lenny Rachitsky, "How the Biggest Consumer Apps Got First 1,000 Users"](https://www.lennysnewsletter.com/p/how-the-biggest-consumer-apps-got)
- [WhatsApp growth strategy — zero marketing — GrowthHackers](https://growthhackers.com/growth-studies/whatsapp/)
- [M-Pesa first agent Esther Muchemi — Tech Safari](https://techsafari.beehiiv.com/p/agent-0001)
- [M-Pesa agent commission — SiliconAfrica](https://siliconafrica.org/m-pesa-agent-commission/)
- [BRILink agent benefits — BukuWarung](https://www.bukuwarung.com/keuntungan-dan-cara-daftar-agen-brilink/)
- [Titip jual (consignment) UMKM — BukaOutlet](https://bukaoutlet.com/article/bisnis-umkm-dengan-sistem-titip-jual--solusi-untuk-pemula-yang-belum-punya-tempat)

### Compensation Models

- [Indonesian reseller vs dropship — Evermos](https://evermos.com/home/panduan/dropship/)
- [Tupperware compensation — ProMLMSoftware](https://promlmsoftware.com/blog/tupperware-compensation-revealed/)
- [Oriflame compensation plan — ProMLMSoftware](https://promlmsoftware.com/blog/oriflame-compensation-plan-mlm-review/)
- [MLM vs pyramid scheme Indonesia — Tandfonline](https://www.tandfonline.com/doi/full/10.1080/23311886.2023.2178540)
- [Tokopedia vs Shopee affiliate — AccessTrade](https://accesstrade.co.id/blogs/affiliate-marketing/perbandingan-komisi-affiliate-program-shopee-vs-affiliate-program-tokopedia-mana-yang-paling-cuan)
- [Startup equity for early hires — Pear VC](https://pear.vc/how-to-structure-startup-equity-for-early-hires/)
- [Grab driver referral — Grab SG](https://www.grab.com/sg/driver-referral/)

---

*Dokumen ini disusun melalui riset akademik, data industri, dan studi kasus startup emerging market pada 15 Maret 2026.*
