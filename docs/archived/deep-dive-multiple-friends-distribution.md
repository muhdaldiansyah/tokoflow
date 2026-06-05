# Deep Dive: Distribusi via Beberapa Teman Non-Penjual

> Chain-of-thought analysis berdasarkan riset akademik, data konversi, psikologi sosial, dan studi kasus startup
>
> **Tanggal riset:** 15 Maret 2026 · **CatatOrder:** v3.1.0 · **Current users:** 1

---

## Daftar Isi

1. [Konteks & Skenario Spesifik](#1-konteks--skenario-spesifik)
2. [Riset: Warm Introduction sebagai Channel Distribusi](#2-riset-warm-introduction-sebagai-channel-distribusi)
3. [Riset: Dinamika Meminta Tolong Banyak Orang](#3-riset-dinamika-meminta-tolong-banyak-orang)
4. [Riset: Psikologi "The Ask"](#4-riset-psikologi-the-ask)
5. [Riset: Kompensasi untuk Multiple Helpers](#5-riset-kompensasi-untuk-multiple-helpers)
6. [Lima Kesalahan Fatal (Evidence-Based)](#6-lima-kesalahan-fatal-evidence-based)
7. [Model Optimal: "Jembatan Bertahap"](#7-model-optimal-jembatan-bertahap)
8. [Panduan Praktis: Script & Framing](#8-panduan-praktis-script--framing)
9. [Proyeksi Realistis](#9-proyeksi-realistis)
10. [Rangkuman Keputusan](#10-rangkuman-keputusan)
11. [Sources](#11-sources)

---

## 1. Konteks & Skenario Spesifik

### Situasi

```
CatatOrder:
  Users:     1
  MRR:       Rp0
  Funding:   Bootstrapped (Rp0)
  Pricing:   50 free orders/month + Rp15K/50 pack + Rp35K unlimited

Rencana distribusi:
  → Minta tolong BEBERAPA teman (bukan 1-2)
  → Teman-teman ini BUKAN penjual makanan / UMKM
  → Mereka punya koneksi ke penjual, tapi tidak pakai CatatOrder sendiri
```

### Kenapa Ini Skenario yang Berbeda

Teman yang bukan penjual **tidak bisa**:
- Pakai CatatOrder sendiri → tidak bisa recommend dari pengalaman
- Demo produk secara meyakinkan → tidak paham detail fitur
- Jawab pertanyaan teknis → "aku gak tahu, tanya temenku aja"
- Berikan peer credibility → "saya juga pakai" (padahal tidak)

Yang mereka **bisa**:
- Buka pintu: "Bu, temen aku bikin ini, mau kenalan gak?"
- Transfer trust: hubungan mereka dengan penjual → trust ke founder
- Jangkau network yang founder tidak bisa akses langsung

**Peran sebenarnya teman = INTRODUCER (penghubung), bukan sales.**

Ini perbedaan fundamental yang mengubah seluruh model.

### Beberapa Teman = Dinamika Tambahan

Multiple friends menambah kompleksitas:
- **Fairness:** semua harus diperlakukan konsisten (kalau beda → sakit hati)
- **Comparison:** "Dia dapat berapa?" → toxic kalau jadi kompetisi
- **Coordination:** siapa approach siapa? (bisa overlap)
- **Diffusion of responsibility:** semakin banyak yang diminta, semakin sedikit masing-masing merasa bertanggung jawab
- **Management overhead:** founder harus track multiple relationships

---

## 2. Riset: Warm Introduction sebagai Channel Distribusi

### Data Konversi: Warm vs Cold

| Channel | Response Rate | Konversi ke Customer | CAC (B2B SaaS) |
|---|---|---|---|
| **Warm introduction** | **58-60%** | **25-29%** | **$150** (terendah) |
| Cold email | 1-5% | 2-3% | $350+ |
| Cold calling | ~25% answer | 8-9% | $1,980 |
| Content marketing | varies | 3-8% | $200 |
| Social media ads (FB) | varies | 8.9% | $350 |
| Social media ads (IG) | varies | 0.7-1.9% | varies |

**Warm intro 10-15x lebih efektif dari cold outreach.** Ini bukan opini — ini data dari ratusan ribu interaksi B2B yang di-track.

Referred customers juga menunjukkan:
- **37% higher retention** dari channel lain
- **18% lower churn**
- **16% more profit** per customer (Schmitt et al., Journal of Marketing, ~10.000 customers tracked 3 tahun)

### Granovetter's "Strength of Weak Ties" — Bukti Kausal 2022

Paper asli Granovetter (1973) berteori bahwa **weak ties** (kenalan, teman-of-teman) lebih berharga untuk menyebarkan informasi BARU karena mereka menjembatani lingkaran sosial yang berbeda. Strong ties (teman dekat) share informasi yang sama dan mengenal orang yang sama.

**LinkedIn mega-experiment (2022)** memberikan bukti kausal pertama:
- **20 juta orang** diamati selama 5 tahun
- **2 miliar koneksi baru** dan **600.000 pekerjaan baru** di-track
- Hasil: **moderately weak ties** menghasilkan mobilitas paling tinggi
- Hubungannya **inverted U-shape**: terlalu lemah = no trust, terlalu kuat = informasi redundan
- Weak ties terutama powerful di sektor **digital/teknologi**

```
Aplikasi ke CatatOrder:

  Kamu (founder) ←→ Teman (strong tie) ←→ Ibu katering (weak tie)
                     ↑ BRIDGE FUNCTION ↑

  Teman kamu = jembatan ke lingkaran sosial yang
  TIDAK BISA kamu akses langsung.
  Ini PERSIS fungsi bridge yang dibuktikan Granovetter.
```

### Transfer Trust — Berapa "Hop" yang Bertahan?

Riset propagasi trust dalam social network:

```
1 hop: Teman merekomendasikan langsung
  → Trust: TINGGI, konversi tinggi

2 hop: Teman memperkenalkan kamu ke kontaknya
  → Trust: MODERATE — "evaluation of 2nd-hop trust could not be 100% accurate"
  → Masih efektif untuk membuka pintu

3+ hop: Teman minta temannya memperkenalkan ke orang lain
  → Trust: RENDAH — degrades significantly
  → Most frameworks stop modeling beyond 3 hops
```

**92% konsumen** percaya rekomendasi dari orang yang mereka kenal langsung, di atas semua bentuk iklan lain (Nielsen Global Trust Survey). Konsumen **77% lebih mungkin** membeli produk yang direkomendasikan teman.

**Implikasi praktis:** Teman memperkenalkan kamu ke Bu Sari = BEKERJA (2 hop). Minta Bu Sari memperkenalkan ke temannya (3 hop) = kurang bisa diandalkan.

### "Super-Connector" Itu Mitos — Banyak Teman Biasa Lebih Baik

Malcolm Gladwell popularisasikan "Connectors" — orang super-connected yang menyebarkan ide. **Riset Duncan Watts (Columbia University) menantang ini secara signifikan:**

```
Watts' computer simulations + empirical data:
  → Large cascades digerakkan BUKAN oleh influencers,
    tapi oleh critical mass of "ordinary people"
  → Hanya 5% messages melewati Connectors
  → Highly connected people hanya SEDIKIT lebih mungkin
    memulai rantai panjang dari orang biasa
  → Most cost-effective: "ordinary influencers" — orang dengan
    pengaruh RATA-RATA atau bahkan di bawah rata-rata
```

**Watts' "Big Seed" approach:** Daripada cari 1 super-connector, reach sebanyak mungkin orang biasa. Setiap orang BISA menjadi trigger cascade. Hasilnya lebih predictable dan less dependent on finding rare individuals.

**Implikasi:** Jangan buang waktu cari 1 teman yang "paling kenal banyak orang." Minta 5-7 teman biasa — setiap dari mereka bisa menjadi jembatan yang membuka akses ke cluster UMKM yang tepat.

### Dunbar's Number — Berapa Perkenalan Realistis per Teman?

Robin Dunbar's research menunjukkan manusia memaintain hubungan dalam layer yang distinct (divalidasi across history — neolithic villages: 160, Roman army units: 150, modern Christmas card networks: 153):

| Layer | Jumlah | Tipe Hubungan | Frekuensi Kontak |
|---|---|---|---|
| Inner circle | ~5 | Teman terdekat/keluarga | Mingguan |
| Sympathy group | ~15 | Teman dekat | Bulanan |
| Active network | ~50 | Teman aktif | Occasional |
| Stable relationships | ~150 | Kenalan bermakna | Would stop to chat |
| Known names | ~1,500 | Dikenali by name | No active relationship |

```
Dari ~50 active network teman kamu:
  → Mungkin 3-7 yang punya usaha makanan
  → Yang mereka COMFORTABLE memperkenalkan: 1-3 orang
  → Kenapa hanya 1-3? Social capital spending:
    - Perkenalan yang buruk = merusak reputasi mereka
    - Mereka hanya akan memperkenalkan orang yang mereka yakin cocok
    - Perkenalan tanpa tujuan jelas = disrespect waktu recipient

Realistis: 1-3 perkenalan per teman, BUKAN 10-20
```

### Studi Kasus: Startup yang Berhasil dengan Non-User Networks

**Stripe — "Collison Installation" (YC, 2010):**
- First 20 customers dari orang-orang yang mereka kenal di Y Combinator
- YC peers BUKAN target market developers — tapi mereka KENAL developers
- Teknik: bukan "Will you try our beta?" tapi **"Right then, give me your laptop"** dan install on the spot
- Awalnya, ketika seseorang signup, Patrick **manually telepon teman** untuk setup merchant account (Wizard of Oz)
- **Lesson:** personal network (non-target users) as bridge → founder handles everything after intro

**DoorDash — Founders Were the Product (Stanford, 2013):**
- Built prototype website **dalam 1 hari** + PDF menu dari 8 restoran lokal
- **Semua 4 founder jadi delivery driver** sendiri
- First orders dari: **telling friends, emailing campus groups, dorm listservers**
- **Lesson:** friends spread awareness, founder does ALL the work

**Tokopedia — 70 Sellers, Zero Marketing (2009):**
- Launched dengan 4 orang dari rumah masing-masing
- **70 sellers** sudah partner sebelum launch
- **Zero paid promotion** karena dana terbatas
- Growth entirely word of mouth
- **Lesson:** personal network seeding → organic word of mouth

**Gojek — 20 Drivers Became Recruiters (2010):**
- Nadiem rekrut 20 ojek pertama secara personal
- Driver pertama (Mulyono, Gojek 001) di Blok M
- Dari 15 yang didekati, hanya 2 tertarik awalnya
- 20 driver ini **later became organic recruiters**
- **Lesson:** first users recruited personally → they recruit the next wave

**GoFood — From In-Person to Self-Serve:**
- Early days: registrasi HARUS di kantor Gojek, bahkan upload menu butuh bantuan staff
- Evolution: 5-minute instant onboarding via app
- **Lesson:** start with high-touch (founder helps), then streamline

---

## 3. Riset: Dinamika Meminta Tolong Banyak Orang

### Ringelmann Effect — Effort Decay per Person

Data klasik (divalidasi berulang kali sejak 1913):

| Jumlah Orang | % Effort Individual yang Retained |
|---|---|
| 1 (solo) | 100% |
| 2 | 93% |
| 3 | 85% |
| **4** | **77%** |
| **5** | **~70%** |
| 6 | 36% (dramatic drop) |
| 8 | 49% |

Drop dari 1 ke 3 signifikan. Dari 4-6, additional members produce **insignificant additional decrements** — effort sudah sangat rendah. Kurva bersifat **curvilinear, bukan linear**.

**Jennifer Mueller's research:** "Above and beyond five, you begin to see diminishing motivation." Practical sweet spot untuk task coordination: 3-8, dengan specialized working teams ~5 being optimal.

```
IMPLIKASI:
  5 teman aktif = optimal
  7 teman diminta (expect 2 gak follow through) = 5 aktif
  10+ teman = effort per person turun drastis, coordination nightmare

  Lebih baik 4 teman committed dari 10 teman pasif
```

### Bystander Effect — Data yang Menentukan Segalanya

Darley & Latane research (1968, replicated extensively):

| Situasi | % yang Menolong |
|---|---|
| Sendirian diminta tolong | **85%** |
| Bersama 1 orang lain | 62% |
| Bersama 4 orang lain | **31%** |

**Mekanisme:** Diffusion of responsibility. Semakin banyak orang yang BISA bantu, semakin sedikit masing-masing merasa HARUS bantu. "Pasti yang lain yang handle."

**TAPI temuan kritis yang mengubah segalanya:** Ketika korban **menyebut NAMA orang spesifik** dan meminta ORANG ITU untuk bantu, bystander effect **hampir hilang sepenuhnya**:
- Unnamed request: response time 51.53 detik
- **Named request: response time 36.38 detik**
- Intervention rate kembali mendekati level "sendirian"

```
IMPLIKASI LANGSUNG:

  ❌ SALAH: "Halo teman-teman, mohon bantuannya sebarkan CatatOrder ya 🙏"
    → Setiap orang baca, setiap orang think "yang lain pasti bantu"
    → Nobody acts (31% intervention)

  ✅ BENAR: WA ke Adi: "Adi, kamu kenal Bu Rina yang jualan kue kan?
    Boleh kenalin aku ke dia?"
    → Adi specifically named → felt personally responsible
    → 85% intervention rate
```

### Social Loafing — Meta-Analysis 78 Studies

Karau & Williams (1993) meta-analysis of 78 studies confirmed social loafing is **"robust and generalizes across tasks and populations."**

Empat moderator terkuat yang MENGURANGI loafing:
1. **Evaluation potential** — kontribusi individual bisa diidentifikasi?
2. **Task meaningfulness** — apakah ini penting buat orang yang diminta?
3. **Expectations of co-worker performance** — apakah yang lain juga doing their part?
4. **Culture** — collectivist cultures show LESS loafing

```
Indonesia = collectivist → social loafing lebih rendah dari Western cultures
TAPI tetap ada — harus dimitigasi dengan:
  → Individual asks (evaluation potential: "Adi, specifically kamu")
  → Meaningful framing (task meaningfulness: "bantu UMKM di sekitar kamu")
  → Reporting back (expectations: "Budi udah kenalin 2 orang lho")
```

### Volunteer's Dilemma — Game Theory

Dalam mixed-strategy Nash equilibrium, menambah jumlah potential volunteers **menurunkan** probabilitas individu untuk volunteer. TAPI: probabilitas **at least one person** volunteering justru **naik**.

```
Implikasi:
  Minta 5 teman: setiap individu kurang likely bantu (vs minta 1)
  TAPI: kemungkinan SETIDAKNYA 1 orang bantu lebih tinggi

  → Minta 5 orang = hedging strategy
  → Kamu gak tahu siapa yang akan follow through
  → Tapi hampir pasti at least 2-3 akan bantu
```

---

## 4. Riset: Psikologi "The Ask"

### Temuan Bohns: Orang Jauh Lebih Willing Membantu dari yang Kamu Kira

**Vanessa Bohns & Flynn (2008), Stanford/Cornell, multiple studies:**

```
Orang OVERESTIMATE berapa kali mereka harus minta tolong:
  Expected: perlu minta 7.2 orang untuk 1 "yes"
  Actual:   hanya perlu minta 2.3 orang

Orang underestimate willingness to help sebesar 50%!

Mekanisme:
  Kita fokus pada "hassle of saying yes" (betapa repotnya)
  Tapi kita lupa "social cost of saying no" (betapa gak enaknya nolak)
  → Orang lebih sering bilang "yes" karena bilang "no" = awkward
```

**Bohns' summary:** "Our fears about asking are overblown — we think they're going to say no, but they're less likely to say no than we expect."

**JANGAN TAKUT MINTA TOLONG.** Teman-teman kamu lebih willing membantu dari yang kamu kira. Fear of asking = biggest barrier, bukan willingness to help.

### Ben Franklin Effect — Minta Tolong MEMPERKUAT Friendship

```
Mekanisme: cognitive dissonance
  "Aku membantu dia → berarti aku memang peduli sama dia"
  → Friendship STRENGTHENED, bukan weakened

Historical example: Ben Franklin meminjam buku dari rival politik
  → Rival jadi lebih friendly setelahnya

Kondisi agar bekerja:
  → Request harus direct (bukan via perantara)
  → Easy to grant (bukan permintaan berat)
  → Followed by genuine thanks (bukan taken for granted)

Implikasi: Minta tolong teman untuk kenalkan ke 1-2 orang = MEMPERKUAT hubungan
  BUKAN merusak hubungan (selama ask-nya reasonable dan ada genuine thanks)
```

### Langer's "Because" Study — Specific Request + Reason

```
Ellen Langer (Harvard) classic study:

Request tanpa alasan:
  "Excuse me, may I use the Xerox machine?"
  → 60% compliance

Request DENGAN alasan (bahkan alasan trivial):
  "...because I need to make copies"
  → 93-94% compliance!

Bahkan alasan MEANINGLESS meningkatkan compliance drastis.

Implikasi:
  ❌ "Bisa bantu sebarkan CatatOrder gak?"
      → 60% compliance, vague, no action trigger

  ✅ "Kamu kenal Bu Rina yang jualan kue di depan gang kan?
      Bisa kenalin aku ke dia? Karena dia pasti capek catat
      orderan dari WA satu-satu."
      → 93%+ compliance: specific person + specific action + reason
```

### BYAF Technique — "Gak Apa-Apa Kalau Gak Bisa"

**Meta-analysis of 42 studies (Carpenter, 2013):** Menambahkan "but you are free to refuse" ke request **significantly increases compliance**. Larger meta-analysis (52 studies, N=28,759): medium effect size (g=0.44). Effect paling kuat ketika decision immediate.

```
"Boleh tolong kenalin aku ke Bu Sari? Tapi kalau lagi gak sempet,
 gak apa-apa sama sekali ya."

→ Paradox: memberikan freedom to say no → orang LEBIH MUNGKIN say yes
→ Mechanism: removes psychological reactance (feeling pressured)
→ Indonesia + sungkan context: BYAF sangat powerful karena
   menghilangkan tekanan sosial yang bikin orang uncomfortable
```

### Cialdini's Principles Applied to Asking Friends

| Principle | Aplikasi | Script Example |
|---|---|---|
| **Reciprocity** | Bantu mereka dulu sebelum minta tolong | "Eh btw makasih kemarin ya udah..." (build goodwill first) |
| **Commitment** | Small yes dulu → bigger ask | "Menurut kamu app kayak gini berguna gak?" → "Kamu kenal siapa yang cocok?" |
| **Social proof** | Mention that others are helping | "Budi udah kenalin aku ke 2 orang, helpful banget" |
| **Liking** | People comply more with friends they like | Be genuinely grateful, not transactional |
| **Scarcity** | "Aku cuma minta ke 5 orang" | Makes it feel exclusive, not mass-broadcast |
| **Authority** | Your expertise as founder adds credibility | "Aku udah riset 6 bulan dan ini solusinya" |

### Foot-in-the-Door — Start Micro

Micro-volunteering research: tasks of 5-30 minutes with no long-term commitment serve as **"gateway" to deeper engagement**. Nearly 50% of people cite lack of time as barrier to helping.

```
JANGAN mulai dengan: "Tolong bantu onboard 10 UMKM ya"
  → Barrier terlalu tinggi → orang overwhelmed → say no

MULAI dengan: "Kamu kenal siapa 1 orang yang jualan makanan?"
  → Ultra-low barrier (5 menit effort)
  → Setelah 1 intro berhasil → "Ada lagi gak yang mungkin cocok?"
  → Foot-in-the-door: commitment to small action → willingness for larger
```

---

## 5. Riset: Kompensasi untuk Multiple Helpers

### Adams' Equity Theory — Fairness Dynamics

Adams (1963): Orang TERUS-MENERUS membandingkan **input/output ratio** mereka dengan orang lain. Ketika seseorang merasa kontribusinya lebih banyak tapi reward-nya sama → **"under-reward inequity"** yang memproduksi anger, resentment, dan penarikan effort.

```
Skenario:
  Adi introduce CatatOrder ke 5 orang → dapat "makasih" + Rp150K GoPay
  Budi introduce ke 0 orang → dapat "makasih" + Rp150K GoPay

  Adi's reaction:
  → "Aku kerja keras, Budi gak ngapa-ngapain, kok sama?"
  → RESENTMENT → stop helping → mungkin cerita ke teman lain
```

### Equal vs Equitable — Data 30 Studies

Review of 30 studies: **equitably distributed rewards** (proportional to contribution) resulted in **higher performance** than equally distributed rewards. TAPI purely individual rewards bisa **increase free-riding**. **Hybrid structure paling efektif.**

### Collectivist Culture Twist (Indonesia)

Asumsi umum bahwa collectivist cultures prefer equality ternyata **tidak fully supported**. Studi 28 negara:

```
Collectivistic employees (including Indonesia):
  → Prefer allocation based on EXTRA-ROLE performance
    (going above and beyond)
  → BUKAN pure equality

Indonesian workplaces specifically:
  "Culturally aligned reward systems — those that blend monetary
   incentives with communal appreciation and social respect —
   are more effective"

Key phrase: BLEND monetary dengan social recognition
```

### Gneezy Dead Zone — Masih Berlaku

Dari analisis dokumen sebelumnya (Gneezy & Rustichini 2000): small payment performs WORSE than no payment. Tapi di konteks multiple friends:

```
Per-introduction payment (e.g., Rp20K/intro):
  → 5 teman × avg 2 intro × Rp20K = Rp200K total
  → Rp20K per intro = Gneezy dead zone (too small to motivate,
    too large to ignore → reframes dari social to transactional)

Lump appreciation (e.g., Rp150K gift after they help):
  → Same Rp200K budget, tapi:
  → Framed as GIFT, bukan payment
  → No "per-intro" calculation
  → Social norms preserved
  → ABOVE the dead zone per person (Rp150K feels meaningful)
```

### Volunteer Motivation Research

Research on informal volunteering (ScienceDirect):

```
Intrinsic motivation: significantly associated with informal volunteering
Extrinsic motivation: NOT significantly associated

People volunteer informally because of:
  → Expressing values ("aku suka bantu UMKM")
  → Strengthening social ties ("bantu teman")
  → Learning ("aku jadi tahu soal startup")
  → Self-esteem ("aku bisa contribute sesuatu")
  → Alleviating guilt ("teman butuh bantuan, masa aku gak bantu")

"Offering no incentive is often better than offering a small incentive"
  → Overjustification effect: small reward kills intrinsic motivation
```

### Volunteer Burnout — Timeline

Burnout doesn't happen overnight. Tapi untuk informal help:
- Energy for helping peaks at **week 1-2**
- Without recognition/feedback, drops significantly by **week 3-4**
- By **month 2**, most informal helpers have moved on

**Protective factors:** feeling that their help is making a difference (share wins), receiving recognition, and having variety in tasks.

```
Implikasi: Window of active help = 2-4 minggu per friend
  → Ask, get intros, appreciate, done
  → JANGAN expect ongoing help for months
  → Kalau butuh lebih: batch baru, teman baru
```

---

## 6. Lima Kesalahan Fatal (Evidence-Based)

### Kesalahan #1: Minta via Grup (Broadcast/Group WA)

```
Evidence: Bystander effect (Darley & Latane 1968)

  Broadcast: "Teman-teman, tolong sebarkan ya" → 31% response
  Individual: "Adi, kamu kenal Bu Rina kan?" → 85% response

  2.7x lebih efektif minta satu-satu.

Additional evidence: Social loafing meta-analysis (78 studies)
  → Group ask = each person assumes others will handle it
  → Individual ask = personal responsibility, can't hide

JANGAN: Kirim di grup WA teman-teman
JANGAN: WA broadcast ke 10 orang sekaligus dengan pesan yang sama
HARUS:  WA individual ke masing-masing, dengan ask yang DIPERSONALISASI
```

### Kesalahan #2: Minta Terlalu Banyak Orang Sekaligus

```
Evidence: Ringelmann Effect + Mueller research

  > 5 orang aktif: diminishing motivation per person
  8 orang: effort per person turun ke 49%
  → 10 teman × 49% effort ≈ 5 teman equivalent effort
  → Tapi dengan 10 teman: coordination overhead 2x lipat

  Plus: kamu harus handle SEMUA onboarding sendiri
  → 10 teman × 2 intro each = 20 warm leads
  → 20 warm leads × 30-60 min onboarding = 10-20 jam kerja
  → BOTTLENECK bukan di jumlah teman, tapi di KAPASITAS kamu

JANGAN: Minta 12 teman sekaligus
HARUS:  Start dengan 5-7 teman. Batch ke-2 setelah batch 1 selesai.
```

### Kesalahan #3: Ask yang Terlalu Vague

```
Evidence: Ellen Langer "because" study
  Vague request: 60% compliance
  Specific request + reason: 93-94% compliance

JANGAN: "Bisa bantu sebarkan CatatOrder gak?"
  → Sebarkan ke siapa? Bagaimana? Kapan? → Teman bingung
  → Procrastinate → never do it

HARUS: "Adi, kamu kenal Bu Rina yang jualan kue di depan gang kan?
  Bisa tolong kenalin aku ke dia? Karena dia pasti capek catat
  orderan dari WA satu-satu."
  → Specific person + specific action + reason → 93%+ compliance
```

### Kesalahan #4: Bikin Grup Koordinasi Formal

```
Evidence: Social loafing moderated by evaluation potential
  Kalau individual contribution bisa di-track → loafing turun
  TAPI kalau tracking terasa seperti surveillance → motivation turun

JANGAN: Bikin WA group "Tim Distribusi CatatOrder"
  → Feels like employment, bukan tolong-menolong
  → Weekly report, target, leaderboard → KILLS friendship dynamic
  → Teman yang kurang perform merasa malu di depan yang lain
  → Social comparison → resentment atau withdrawal

HARUS: Semua komunikasi individual (1-on-1 WA)
  → Masing-masing relationship terpisah
  → Tidak ada comparison, tidak ada pressure
  → Teman tidak perlu tahu siapa lain yang juga membantu
  → Group chat (kalau ada) HANYA untuk celebration, bukan coordination
```

### Kesalahan #5: Same Reward for Different Contribution

```
Evidence: Adams' Equity Theory + 30-study review

  Equitable (proportional) reward → higher performance
  Equal reward when contribution unequal → resentment + withdrawal

  Tapi: pure individualistic reward → free-riding
  → Best: HYBRID — base appreciation for everyone who helps +
    extra recognition for those who go above and beyond

JANGAN: Semua dapat GoPay Rp150K terlepas kontribusi
JANGAN: Hanya yang bawa banyak intro yang dapat sesuatu

HARUS: Proportional appreciation
  → Semua yang bantu: genuine thanks + small gesture (kopi/traktir)
  → Yang banyak bantu: meaningful appreciation (larger gift + specific recognition)
  → Yang gak jadi bantu: no awkwardness, graceful fade
```

---

## 7. Model Optimal: "Jembatan Bertahap"

### Prinsip Inti

```
PERAN TEMAN:     Introducer (jembatan), BUKAN sales
PERAN FOUNDER:   Closer (onboarder), BUKAN coordinator
JUMLAH IDEAL:    5 teman aktif (Ringelmann sweet spot)
ASK:             Individual, specific, with reason (Langer + bystander)
KOMPENSASI:      Proportional appreciation (Adams equity)
KOORDINASI:      1-on-1 WA, BUKAN grup (avoid social loafing)
WINDOW:          2-4 minggu per batch (volunteer energy timeline)
```

### Phase 0: Pilih 7 Teman (Sebelum Mulai)

```
KRITERIA SELEKSI:
  Bukan "siapa yang paling connected" (Watts: ordinary people = fine)
  Tapi FILTER berdasarkan:

  ✅ Tinggal di area dengan penjual makanan (pasar, kampung, komplek)
  ✅ Aktif di komunitas (arisan, RT/RW, PKK, masjid/gereja, gym)
  ✅ Tipe yang responsive di WA (bukan yang sering read-no-reply)
  ✅ Punya hubungan baik dengan kamu (Ben Franklin effect)
  ✅ Tidak terlalu sibuk (respect their time — volunteer burnout risk)
  ✅ Berada di LOKASI BERBEDA (coverage, bukan overlap)

KENAPA 7:
  → Expect 2 yang gak follow through (50% follow-through rate)
  → 7 diminta → ~5 aktif (Ringelmann sweet spot)
  → Jangan lebih — effort decay + bottleneck di kapasitas kamu

JANGAN:
  → Pilih berdasarkan siapa "paling connected" (mitos Gladwell)
  → Pilih semua di area yang sama (overlap, inefficient)
  → Pilih teman yang sibuk/unreliable (wastes your social capital)
```

### Phase 1: Ask Individually (Minggu 1)

```
FORMAT: WA personal, BUKAN grup, BUKAN broadcast

TIMING: Satu per satu, BUKAN serentak
  → Hari 1-2: WA ke teman 1 dan 2
  → Hari 2-3: WA ke teman 3 dan 4
  → Hari 3-4: WA ke teman 5, 6, 7

  Kenapa bertahap?
  → Belajar dari response pertama → adjust script
  → Tidak overwhelm diri sendiri (bottleneck = kapasitas onboarding)
  → Kalau teman 1-2 sudah kasih intro, bisa fokus follow up dulu

STRUKTUR ASK (berdasarkan riset):

  1. Context personal — Ben Franklin effect (make it about relationship)
  2. Specific ask — Langer (name + action, bukan vague "bantu sebarkan")
  3. Reason — Langer ("karena..." — bahkan reason simple works)
  4. BYAF — Carpenter meta-analysis ("gak apa-apa kalau gak bisa")
  5. Low barrier — Foot-in-the-door ("cukup kenalin 1 orang aja")
```

### Phase 2: Receive & Follow Up Introductions (Minggu 1-3)

```
KETIKA TEMAN KASIH NAMA/KONTAK:

  1. SEGERA follow up — jangan tunggu berhari-hari
     → "Makasih Adi! Aku WA Bu Rina sekarang ya"
     → Urgency shows respect untuk effort teman

  2. Minta teman bridge (OPTIONAL, tapi lebih efektif):
     → "Boleh tolong bikin grup WA bertiga? Atau forward kontak aku
        ke dia sambil bilang 'ini temen aku yang bikin app catat pesanan'?"
     → Bridge intro via existing trust = higher response rate (58-60%)

  3. KAMU yang handle 100% setelah intro:
     → WA Bu Rina: "Bu, saya Aldi, temannya [nama teman]. [Teman] bilang
        Ibu jualan [kue/katering]. Saya bikin tool gratis buat bantu catat
        pesanan dari WA. Mau saya demo-in? 5 menit aja Bu."
     → Founder handles ALL onboarding — teman selesai tugasnya

  4. Report back ke teman (Deci: verbal recognition meningkatkan motivasi):
     → "Adi, Bu Rina udah daftar lho! Dia seneng banget, bilang
        gak perlu scroll chat lagi. Makasih banget ya udah kenalin!"
     → Ini KRUSIAL — membuat teman merasa kontribusinya bermakna
     → Triggers: helper's high, sense of impact, willingness to do more
```

### Phase 3: Second Ask (Natural Escalation, Minggu 2-3)

```
SETELAH first intro berhasil, teman MUNGKIN menawarkan sendiri:
  → "Oh gitu? Aku kenal juga Bu Yani di sebelah, mau aku kenalin?"
  → IDEAL — organic escalation, bukan forced

KALAU TIDAK menawarkan, gentle second ask:
  → "Eh Adi, ternyata Bu Rina udah aktif banget lho, udah 20 pesanan
     masuk minggu ini. Ada gak siapa lagi yang mungkin cocok?"
  → Framing: share WIN dulu (social proof) → kemudian ask
  → JANGAN langsung: "Ada lagi gak?" tanpa share progress

KAPAN BERHENTI:
  → Setelah 2-3 introductions per friend → STOP
  → Jangan push lebih — social capital teman terbatas
  → Beyond 3 intros: teman mulai merasa "aku dijadiin sales"
  → Thank them and let it end naturally
```

### Phase 4: Appreciate (Minggu 3-4)

```
PROPORTIONAL appreciation (Adams Equity):

TEMAN YANG KASIH 3+ INTRO & PROAKTIF FOLLOW UP:
  → Traktir makan meaningful (Rp100-200K)
  → DAN/ATAU: GoPay/pulsa Rp150-200K
  → DAN: specific recognition:
    "Gara-gara kamu, 3 ibu katering udah mulai pakai dan
     gak ada yang kehilangan orderan lagi. Seriously makasih."
  → Consider: upgrade ke "Mitra Awal" (model B dari dokumen sebelumnya)

TEMAN YANG KASIH 1-2 INTRO:
  → Traktir kopi (Rp50-80K)
  → "Makasih banget ya, Bu [nama] yang kamu kenalin udah aktif!"

TEMAN YANG BILANG "OK" TAPI BELUM FOLLOW THROUGH:
  → 1x gentle reminder setelah 1 minggu
  → Kalau masih gak: "Gak apa-apa ya, makasih udah niat bantu!"
  → JANGAN push lebih dari 1x
  → Let them fade naturally — no awkwardness, no guilt

TEMAN YANG BILANG "SORRY GAK BISA":
  → "Gak apa-apa sama sekali! Makasih ya."
  → No follow up, no guilt tripping
  → Ben Franklin: mereka tetap appreciate kamu asked
```

### Phase 5: Evaluate & Batch 2 (Minggu 4-6, kalau perlu)

```
SETELAH BATCH 1 SELESAI:

Evaluate:
  → Berapa intro yang masuk?
  → Berapa yang convert ke active user?
  → Apa yang bikin onboarding berhasil vs gagal?
  → Script mana yang response-nya paling baik?

Kalau hasilnya bagus (2+ active users):
  → Batch 2: minta 5 teman BARU
  → Pakai improved script berdasarkan learning dari batch 1
  → Include social proof: "Udah 5 ibu katering pakai CatatOrder"

Kalau hasilnya kurang (0-1 active users):
  → JANGAN tambah teman — fix onboarding process dulu
  → Problem mungkin bukan di intro quantity tapi di:
    - Produk belum cukup meyakinkan saat demo
    - Target market salah (bukan ibu katering?)
    - Onboarding terlalu rumit
  → Fix root cause sebelum burn more social capital
```

---

## 8. Panduan Praktis: Script & Framing

### Script WA untuk Minta Tolong (Personalize per Teman)

**Versi A — Teman yang kamu tahu kenal penjual spesifik:**

> Eh [nama], aku mau minta tolong nih. Aku lagi bikin tool gratis buat ibu-ibu yang jualan makanan lewat WA — bantu mereka catat pesanan biar gak ada yang kelewat.
>
> Kamu kenal Bu [nama] yang jualan [kue/katering] di [lokasi] kan? Bisa tolong kenalin aku ke dia? Karena kayaknya dia bakal terbantu banget.
>
> Cukup bilang "temen aku bikin app catat pesanan, mau kenalan gak?" aja udah cukup. Aku yang ngobrol dan setup-in semuanya. Kalau lagi gak sempet juga gak apa-apa sama sekali ya.

**Versi B — Teman yang kamu gak tahu kenal siapa spesifik:**

> Eh [nama], aku mau minta tolong nih. Aku bikin app gratis buat UMKM makanan — bantu catat pesanan dari WA biar gak ada yang kelewat.
>
> Kamu kenal gak ada siapa yang jualan kue, katering, atau makanan di sekitar kamu? Cukup kenalin aku aja, aku yang handle semuanya.
>
> Gak perlu kamu explain apa-apa soal app-nya — literally cukup "temen aku bikin ini, mau kenalan gak?" Kalau gak kenal siapa-siapa juga gak apa-apa ya!

**Versi C — Kalau teman tanya "itu apa sih?":**

> Jadi gini — ibu-ibu yang jualan katering/kue kan biasanya terima orderan lewat WA chat. Masalahnya sering kelewat, salah hitung, atau lupa siapa yang udah bayar siapa yang belum.
>
> CatatOrder itu link toko gratis — customer tinggal buka link, pilih menu, pesan. Otomatis tercatat rapi di dashboard penjual. Gak perlu download app, gak perlu belajar yang ribet.
>
> Gratis 50 pesanan/bulan. Aku cuma butuh dikenalin ke ibu-ibu yang jualan makanan biar aku bisa setup-in.

### Script setelah Dapat Introduction

**WA ke teman (konfirmasi + thanks):**

> Makasih banget [nama]! Aku WA Bu [nama penjual] sekarang ya. Nanti aku kabarin gimana hasilnya!

**WA ke penjual (first contact):**

> Assalamualaikum Bu, saya Aldi, temannya [nama teman]. [Teman] bilang Ibu jualan [kue/katering] ya?
>
> Saya bikin tool gratis buat bantu catat pesanan dari WA — jadi pelanggan Ibu bisa langsung pesan dari link, gak perlu chat satu-satu. Semua pesanan langsung tercatat rapi.
>
> Kalau Ibu mau coba, saya bisa bantu setup-in sekarang. Gratis kok Bu, 5 menit aja.

### Script Report Back ke Teman

**Setelah penjual berhasil onboard:**

> [Nama], Bu [nama penjual] yang kamu kenalin udah daftar lho! Udah masuk [X] pesanan lewat link toko-nya. Dia bilang seneng banget gak perlu scroll chat lagi. Makasih banget ya udah bantu kenalin!

**Kenapa ini penting (Deci research):**
- Verbal feedback meningkatkan intrinsic motivation (d = +0.33)
- Showing impact = helper's high activation (dopamine, oxytocin release)
- Makes friend want to help more (natural escalation)

### Script Gentle Reminder (Hanya 1x)

**Untuk teman yang bilang OK tapi belum follow through (setelah 1 minggu):**

> Eh [nama], masih inget soal CatatOrder kemarin? Kalau ada siapa yang cocok, kabarin ya. Tapi kalau lagi sibuk juga santai aja, gak usah dipikirin!

**JANGAN kirim lebih dari 1 reminder.** Kalau setelah reminder masih gak ada action → biarkan. Respect their autonomy.

---

## 9. Proyeksi Realistis

### Skenario A: 7 Teman, 1 Batch

```
Minggu 1: Minta 7 teman individually
  → 5-6 bilang OK (Bohns: 70-85% compliance on direct ask)
  → 1-2 bilang "sorry gak bisa" atau gak respond

Minggu 1-2: Introductions mulai masuk
  → 3-4 teman actually introduce (50% follow-through rate)
  → Each provides 1-3 intros (Dunbar: realistic from active network)
  → Total: 5-10 warm leads

Minggu 2-3: Founder onboard
  → 58-60% respond positively: 3-6 mau ngobrol/demo
  → Founder demo + setup: 25-29% convert
  → 1-3 sign up CatatOrder

Minggu 3-4: Active users
  → 1-2 menjadi active (3+ pesanan)
  → 2-3 warm leads masih bisa di-nurture (follow up next month)

Budget:
  Teman yang banyak bantu (2-3 orang × Rp150K avg): Rp300-450K
  Teman yang sedikit bantu (1-2 orang × Rp70K avg):  Rp70-140K
  Total: Rp370-590K

Result:
  Active users gained: 1-2
  Warm leads in pipeline: 2-4
  Cost per active user: Rp185-590K
```

### Skenario B: 2 Batch (7 + 5 Teman)

```
Batch 1 (Minggu 1-4): 7 teman → 1-2 active users
  Learning: improve script, improve onboarding flow

Batch 2 (Minggu 5-8): 5 teman baru (improved process)
  → Better script (based on batch 1 learning)
  → Social proof available: "5 ibu katering udah pakai"
  → Expected: 1-3 active users (improved conversion)

Viral loop activation (Minggu 6+):
  → Existing users share Link Toko di WA Status
  → WA confirmations carry CatatOrder branding
  → +1-3 organic users (beginning of viral loop)

Total at Week 8:
  Active users: 3-7
  Pipeline: 5-10 warm leads
  Total cost: Rp700K-1.2M
  Average cost per active user: Rp100-400K
```

### Perbandingan dengan Alternatif

| Channel | Cost per Active User | Timeline | Quality |
|---|---|---|---|
| **Warm intro via teman** | **Rp185-590K** | **2-4 minggu** | **Highest** (trust-based) |
| Google/Meta Ads | Rp300-800K est. | 1-2 minggu | Low (cold) |
| Instagram DM cold | Rp0 cash, 20+ jam | 4-6 minggu | Very low |
| Content marketing | Rp0 cash | 3-6 bulan | Medium |
| Founder personal only | Rp0 cash | 4-8 minggu | High tapi slow |

**Warm intro via teman:** biaya comparable dengan ads, tapi kualitas user JAUH lebih baik. Referred users: 37% higher retention, 18% lower churn (Schmitt et al., Journal of Marketing).

---

## 10. Rangkuman Keputusan

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  MODEL: "JEMBATAN BERTAHAP"                                         │
│  Beberapa Teman Non-Penjual sebagai Introducer                      │
│                                                                      │
│  PRINSIP UTAMA (dari riset):                                        │
│  1. Ask individual, bukan grup (bystander: 85% vs 31%)              │
│  2. Max 5-7 per batch (Ringelmann: >5 = effort collapse)            │
│  3. Specific ask + reason (Langer: 60% → 94%)                       │
│  4. JANGAN TAKUT MINTA (Bohns: orang 50% more willing than          │
│     you expect. Ben Franklin: asking STRENGTHENS friendship)         │
│  5. Proportional appreciation (Adams: equal ≠ equitable)            │
│  6. Product credits > cash (Jin & Huang, Dropbox)                   │
│  7. Teman = introducer, founder = closer (Stripe model)             │
│                                                                      │
│  STRUKTUR:                                                           │
│  → Phase 0: Pilih 7 teman (berbeda lokasi, responsive, kenal UMKM) │
│  → Phase 1: Ask individual + specific + BYAF (Minggu 1)            │
│  → Phase 2: Receive intros, founder onboard 100% (Minggu 1-3)      │
│  → Phase 3: Report back wins, natural second ask (Minggu 2-3)       │
│  → Phase 4: Proportional appreciation (Minggu 3-4)                  │
│  → Phase 5: Evaluate → Batch 2 kalau perlu (Minggu 4-6)            │
│                                                                      │
│  KOMPENSASI:                                                         │
│  → Banyak bantu (3+ intro): traktir + Rp150-200K gift              │
│  → Sedikit bantu (1-2 intro): traktir kopi + genuine thanks         │
│  → Gak jadi bantu: "Gak apa-apa" → fade naturally                  │
│  → BUKAN per-introduction payment (Gneezy dead zone)                │
│                                                                      │
│  BUDGET: Rp370-590K per batch (7 teman)                             │
│  EXPECTED: 1-2 active users per batch                               │
│  TIMELINE: 2-4 minggu per batch                                      │
│  2 BATCHES: 3-7 active users dalam 2 bulan                          │
│                                                                      │
│  5 RULES:                                                            │
│  1. SATU PER SATU — never broadcast (bystander elimination)         │
│  2. SEBUT NAMA — "Bu Rina yang jualan kue" (Langer specificity)     │
│  3. SERENDAH MUNGKIN — "cukup kenalin" (foot-in-the-door)          │
│  4. KAMU YANG HANDLE — teman buka pintu, founder close              │
│  5. APRESIASI PROPORTIONAL — yang bantu banyak, dapat lebih         │
│                                                                      │
│  JANGAN:                                                             │
│  ✗ Broadcast di grup WA                                              │
│  ✗ Bayar per-introduction (Rp10-25K dead zone)                      │
│  ✗ Bikin "Tim Sales" atau WA group koordinasi                       │
│  ✗ Minta >7 orang sekaligus                                        │
│  ✗ Push teman yang gak respond lebih dari 1x                        │
│  ✗ Kasih reward sama rata kalau kontribusi beda                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 11. Sources

### Warm Introduction & Conversion Data

- [Warm Intros vs Cold Email 2025 — Metal.so](https://www.metal.so/collections/warm-intros-vs-cold-email-2025-conversion-data-referral-playbook)
- [Warm Outreach vs Cold Email — GrowLeads](https://growleads.io/blog/warm-outreach-vs-cold-email/)
- [B2B Cold Email Statistics 2025 — Martal](https://martal.ca/b2b-cold-email-statistics-lb/)
- [Power of Warm Intros in B2B — Draftboard](https://www.draftboard.com/blog/the-power-of-warm-intros-why-cold-outreach-is-fading-in-b2b-sales)
- [Average Cold Call Conversion Rate — Focus Digital](https://focus-digital.co/average-cold-call-conversion-rate/)
- [Average CAC by Industry — UserMaven](https://usermaven.com/blog/average-customer-acquisition-cost)
- [Schmitt, Skiera & Van den Bulte, "Referral Programs and Customer Value" (2011) — Journal of Marketing](https://journals.sagepub.com/doi/10.1509/jm.75.1.46)

### Network Theory & Trust Transfer

- [Granovetter, "Strength of Weak Ties" (1973) — American Journal of Sociology](https://www.cs.cmu.edu/~jure/pub/papers/granovetter73ties.pdf)
- [Causal Test of Strength of Weak Ties (2022) — Science Magazine](https://www.science.org/doi/10.1126/science.abl4476)
- [LinkedIn Weak Ties Study — MIT News](https://news.mit.edu/2022/weak-ties-linkedin-employment-0915)
- [Real Strength of Weak Ties — Stanford Report](https://news.stanford.edu/stories/2022/09/real-strength-weak-ties)
- [Multi-hop Trust in Social Networks — ResearchGate](https://www.researchgate.net/publication/271472929_Assessment_of_multi-hop_interpersonal_trust_in_social_networks_by_Three-Valued_Subjective_Logic)
- [Trust and Referrals — Buyapowa](https://www.buyapowa.com/blog/referral-trust-and-brand-advocacy/)
- [Global Trust in Advertising — Nielsen](https://www.nielsen.com/insights/2012/global-trust-in-advertising-and-brand-messages-2/)
- [Tyranny of Influentials (Watts) — Digital Tonto](https://digitaltonto.com/2011/the-tyranny-of-influentials/)
- [Easily Influenced Individuals Drive Cascades — ScienceDaily](https://www.sciencedaily.com/releases/2007/11/071112133759.htm)
- [Why Influencers Can't Achieve Tipping Point — Georgetown SCS](https://scs.georgetown.edu/news-and-events/article/7550/why-influencers-cant-achieve-tipping-point)
- [Dunbar's Number — Wikipedia](https://en.wikipedia.org/wiki/Dunbar's_number)
- [Dunbar's Number Layers — Brian Colwell](https://briandcolwell.com/what-is-dunbars-number/)

### Startup Distribution Case Studies

- [Stripe First 1000 — First 1000](https://read.first1000.co/p/-stripe-6bb)
- [Stripe First Few — Just Go Grind](https://www.justgogrind.com/p/the-first-few-stripe)
- [Paul Graham, "Do Things That Don't Scale"](https://www.paulgraham.com/ds.html)
- [Airbnb Growth — GrowthHackers](https://growthhackers.com/growth-studies/airbnb/)
- [Airbnb Traction — Medium](https://medium.com/@etch.ai/how-airbnb-got-their-early-traction-cb059e902ea4)
- [Uber Supply-Side Recruitment — Wikipedia](https://en.wikipedia.org/wiki/Uber)
- [DoorDash Origin — Sequoia](https://sequoiacap.com/podcast/crucible-moments-doordash/)
- [DoorDash Founders — Business of Business](https://www.businessofbusiness.com/articles/Doordash-ipo-stock-founders-tony-xu/)
- [Gojek — Wikipedia](https://en.wikipedia.org/wiki/Gojek)
- [Driver Pertama Gojek — Detik Finance](https://finance.detik.com/berita-ekonomi-bisnis/d-6140308/cerita-mul-driver-pertama-gojek-kantornya-bekas-garasi-mobil)
- [Tokopedia 10 Year Journey — Medium](https://medium.com/life-at-tokopedia/the-story-behind-tokopedias-10-year-journey-75eecfa89372)
- [GoFood Instant Onboarding — Jakarta Post](https://www.thejakartapost.com/business/2025/11/27/gofood-accelerates-msme-digitalization-with-breakthrough-instant-onboarding-feature.html)
- [Lenny Rachitsky, "How Consumer Apps Got First 1,000 Users"](https://www.lennysnewsletter.com/p/how-the-biggest-consumer-apps-got)

### Group Dynamics & Bystander Effect

- [Ringelmann Effect — Wikipedia](https://en.wikipedia.org/wiki/Ringelmann_effect)
- [Ringelmann Effect — ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/002210317490033X)
- [Social Loafing Meta-Analysis (Karau & Williams 1993)](http://www.communicationcache.com/uploads/1/0/8/8/10887248/social_loafing-_a_meta-analytic_review_and_theoretical_integration.pdf)
- [Social Loafing — Simply Psychology](https://www.simplypsychology.org/social-loafing.html)
- [Bystander Effect — Wikipedia](https://en.wikipedia.org/wiki/Bystander_effect)
- [Diffusion of Responsibility — Wikipedia](https://en.wikipedia.org/wiki/Diffusion_of_responsibility)
- [Bystander Effect Revisited — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6099971/)
- [Bystander Effect — The Decision Lab](https://thedecisionlab.com/reference-guide/psychology/bystander-effect)
- [Volunteer's Dilemma — Wikipedia](https://en.wikipedia.org/wiki/Volunteer's_dilemma)
- [Exploring the Volunteer's Dilemma — Psychology Today](https://www.psychologytoday.com/us/blog/media-spotlight/201604/exploring-the-volunteers-dilemma)
- [Optimal Group Size — Mark's Musings](https://verber.com/group-size/)
- [Dunbar Number and Group Sizes — Life With Alacrity](https://www.lifewithalacrity.com/article/the-dunbar-number-as-a-limit-to-group-sizes/)

### Psychology of Asking

- [Flynn & Bohns, "Underestimating Compliance" — Stanford/Cornell](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1547977)
- [People Underestimate Willingness to Help — Stanford News](https://news.stanford.edu/news/2008/august6/justask-080608.html)
- [Vanessa Bohns Research](https://www.vanessabohns.com/research)
- [Asking for Things is Easier Than You Think — NPR](https://www.npr.org/2022/10/13/1128382539/for-better-or-worse-asking-for-things-is-easier-than-you-think)
- [Ben Franklin Effect — The Decision Lab](https://thedecisionlab.com/biases/benjamin-franklin-effect)
- [Ben Franklin Effect — Effectiviology](https://effectiviology.com/benjamin-franklin-effect/)
- [Doing Favors and Ben Franklin Effect — TIME](https://time.com/6987094/doing-favors-benjamin-franklin-effect-essay/)
- [BYAF Meta-Analysis (Carpenter 2013) — ResearchGate](https://www.researchgate.net/publication/234839851_A_Meta-Analysis_of_the_Effectiveness_of_the_But_You_Are_Free_Compliance-Gaining_Technique)
- [BYAF Re-examination — ResearchGate](https://www.researchgate.net/publication/344807911_The_effectiveness_of_the_But-you-are-free_technique_Meta-analysis_and_re-examination_of_the_technique)
- [Langer "Because" Study — Compliance Psychology](https://www.simplypsychology.org/compliance.html)
- [Cialdini's 7 Principles — Influence at Work](https://www.influenceatwork.com/7-principles-of-persuasion/)
- [Foot-in-the-Door / Micro-Volunteering — Wikipedia](https://en.wikipedia.org/wiki/Micro-volunteering)
- [Small Acts Big Impact — Goodera](https://www.goodera.com/blog/micro-volunteering)

### Compensation & Fairness

- [Adams' Equity Theory — Wikipedia](https://en.wikipedia.org/wiki/Equity_theory)
- [Equity Theory — Neuroworx](https://www.neuroworx.io/magazine/adams-equity-theory-of-employee-motivation)
- [Relative Rewards in Team Compensation — ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0927537107000176)
- [Free-Rider Problem — LeadershipIQ](https://www.leadershipiq.com/blogs/leadershipiq/the-free-rider-problem)
- [Cultural Influence on Reward Preferences — Wiley](https://onlinelibrary.wiley.com/doi/10.1111/1748-8583.12486)
- [Gneezy & Rustichini, "Pay Enough or Don't Pay at All" (2000) — QJE](https://rady.ucsd.edu/_files/faculty-research/uri-gneezy/pay-enough.pdf)
- [Intrinsic vs Extrinsic Volunteer Motivation — ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0191886909000221)
- [Volunteers vs Employees Motivation — NonProfit PRO](https://www.nonprofitpro.com/post/employees-volunteers-motivated-way/)
- [Volunteer Recruitment & Retention — NMBL Strategies](https://www.nmblstrategies.com/blog/volunteer-recruitment-and-retention-best-practices-for-nonprofits)

### Indonesian Context

- [Gotong Royong as Social Capital for MSEs — PMC / Heliyon](https://pmc.ncbi.nlm.nih.gov/articles/PMC7492849/)
- [Gotong Royong and Economic Incentives — International Journal of the Commons](https://thecommonsjournal.org/articles/10.5334/ijc.1273)
- [Indonesian Business Culture — Commisceo Global](https://commisceo-global.com/articles/why-is-relationship-building-so-important-in-indonesian-business-culture/)
- [Indonesian Business Culture — Cultural Atlas](https://culturalatlas.sbs.com.au/indonesian-culture/indonesian-culture-business-culture)
- [WhatsApp Viral Content Patterns — ArXiv](https://arxiv.org/html/2407.08172v2)
- [Indonesian WhatsApp Misinformation — ICFJ](https://www.icfj.org/news/indonesian-survey-explores-spread-misinformation-whatsapp)
- [WhatsApp Business for UMKM — WhatsApp](https://www.whatsapp.com/stories/business/Indonesia)
- [Evermos Social Commerce — IFC Case Study PDF](https://www.ifc.org/content/dam/ifc/doclink/2023/case-study-evermos-revolutionizing-e-commerce.pdf)
- [Evermos — Jungle Ventures / Medium](https://medium.com/jungle-ventures/how-evermos-is-building-the-largest-social-commerce-company-in-indonesia-a4499d82502b)
- [Collectivism in Indonesia — Indonesia Design Studio](https://indonesiadesignstudio.blog/2015/04/27/post-d-collectivism-in-indonesia/)
- [Consumer Psychology Collectivist Culture — PARADE RISET](https://ejurnal.ubharajaya.ac.id/index.php/PARS/article/view/4752)
- [WOM Marketing Indonesia — Qontak](https://qontak.com/blog/word-of-mouth-marketing/)

### SaaS Conversion Benchmarks

- [SaaS Free Trial Conversion Benchmarks — First Page Sage](https://firstpagesage.com/seo-blog/saas-free-trial-conversion-rate-benchmarks/)
- [SaaS Average Conversion Rate — UserPilot](https://userpilot.com/blog/saas-average-conversion-rate/)
- [Referral Program Benchmarks 2026 — ReferralCandy](https://www.referralcandy.com/blog/referral-program-benchmarks-whats-a-good-conversion-rate-in-2025)
- [Funnel Metrics from 400 Referral Programs — Extole](https://www.extole.com/blog/4-key-funnel-metrics-from-400-referral-programs/)

---

*Dokumen ini disusun melalui riset akademik, data konversi industri, psikologi sosial, dan studi kasus startup pada 15 Maret 2026.*
