# Deep Dive: How to Make CatatOrder Become Architecture

> Chain-of-thought analysis: transformasi CatatOrder dari "tool yang butuh pikiran" menjadi "arsitektur yang membuat perilaku bisnis baik menjadi default"
>
> **Tanggal riset:** 2026-03-22
> **Basis evidence:** 36 kesimpulan dari `/realitas/` (10 file, ~650KB, 125+ sumber, 190 buku)
> **CatatOrder state:** Web v4.1.0, App v2.3.0
> **Prerequisite:** Baca `gap-analysis-36-kesimpulan.md` terlebih dahulu

---

## BAGIAN 1: APA ITU "ARSITEKTUR" — DAN KENAPA CATATORDER BELUM MENJADI SATU

### 1.1 Definisi dari Evidence

Dari 36 kesimpulan, satu hukum muncul tanpa pengecualian di setiap domain:

> **Mengubah lingkungan/struktur/default SELALU mengalahkan mengubah motivasi/informasi/willpower.**

Evidence yang tidak bisa dibantah:
- Opt-in → opt-out pensiun: 49% → 93% (Thaler & Benartzi)
- QRIS: 56.3 juta user tanpa satu seminar pun
- Ramadan: 242 juta orang, 30 hari, 99.8% compliance, zero cost
- WHO Surgical Checklist: selembar kertas, 19 item, kematian operasi turun >33%
- Operasi bariatrik: satu-satunya diet yang bertahan 10 tahun

Ini bukan korelasi. Ini kausalitas yang direplikasi berulang kali, lintas budaya, lintas domain, selama puluhan tahun.

### 1.2 Tool vs Architecture

| Dimensi | Tool (CatatOrder sekarang) | Architecture (CatatOrder seharusnya) |
|---------|---------------------------|--------------------------------------|
| Inisiasi | User harus memutuskan untuk buka app | App yang datang ke user (morning brief push) |
| Konfigurasi | User harus manual set mode, capacity, products | Auto-configured berdasarkan tipe bisnis |
| Retensi | User harus ingat untuk kembali | Sistem yang menarik kembali secara otomatis |
| Intelligence | User harus buka rekap dan klik analyze | Insight yang muncul tanpa diminta |
| Distribusi | User harus share link sendiri | Komunitas yang mendorong adopsi secara sosial |
| Makna | User harus interpretasi angka sendiri | Angka yang sudah di-frame sebagai makna |
| Otak target | System 2 (sadar, butuh effort) | System 1 (otomatis, tanpa effort) |

### 1.3 Diagnosis: Kenapa Strategy Docs yang Sudah Bagus Belum Terimplementasi

CatatOrder sudah punya dokumen strategi yang sangat kuat:
- `CatatOrder_The_Complete_Strategy_Playbook.md` — Champion/Agen model, 4-phase sequence
- `deep-dive-narrative-architecture.md` — "Dari Jualan Jadi Usaha" narrative, 7 komponen
- `deep-dive-best-sales-model.md` — Seeder → Champion → Viral Loop
- `deep-dive-best-friend-distribution-model.md` — Berbagi Bukan Jualan, research-backed

**Tapi hampir NONE of it diimplementasi dalam produk.** Kenapa?

Karena semua dokumen ini adalah **strategi distribusi dan komunikasi** — mereka menjawab "bagaimana menyebarkan CatatOrder?" Tapi mereka tidak menjawab pertanyaan yang lebih fundamental:

> **Bagaimana membuat CatatOrder SENDIRI menjadi arsitektur yang otomatis menghasilkan perilaku yang diinginkan — tanpa user harus membaca, memahami, atau memutuskan apa pun?**

Strategy docs bicara tentang distribusi. Dokumen ini bicara tentang **produk sebagai arsitektur.**

---

## BAGIAN 2: LIMA LAYER ARSITEKTUR

Berdasarkan 36 kesimpulan, arsitektur yang efektif memiliki 5 layer. Setiap layer menangani domain berbeda dari perilaku manusia.

```
Layer 5: MEANING ARCHITECTURE    — Frame angka sebagai makna (Kesimpulan 30, 31, 32)
Layer 4: INTELLIGENCE ARCHITECTURE — Ganti "pikirkan ini" dengan "lakukan ini" (Kesimpulan 9, 10, 12)
Layer 3: SOCIAL ARCHITECTURE     — Buat adopsi terjadi lewat komunitas (Kesimpulan 20, 22, 25)
Layer 2: TEMPORAL ARCHITECTURE   — Match ritme produk ke ritme biologis & kultural (Kesimpulan 4, 21, 34)
Layer 1: DEFAULT ARCHITECTURE    — Buat perilaku benar = perilaku termudah (Kesimpulan 1, 2, 23)
```

Layer 1 adalah fondasi. Tanpa default yang benar, layer di atasnya tidak bisa bekerja.

---

## BAGIAN 3: LAYER 1 — DEFAULT ARCHITECTURE

### 3.1 Prinsip

> **Sebelum mencoba "lebih disiplin," tanya dulu "arsitektur apa yang membuat perilaku ini default?"** (Kesimpulan #1)

Setiap kali user harus membuat keputusan = cognitive load. UMKM sudah kehilangan 13-14 IQ dari scarcity (Mullainathan). Setiap keputusan yang bisa dihilangkan = cognitive relief yang nyata.

### 3.2 Audit: Default CatatOrder Saat Ini

| Aspek | Status | Masalah |
|-------|--------|---------|
| Business type | Tidak ditanyakan saat register | Semua user mendapat UI yang sama |
| Mode (Pre-order/Dine-in/Booking) | Preorder default ON, sisanya manual | Warung harus tahu untuk switch ke dine-in |
| Capacity | NULL (unlimited) | Katering yang butuh limit harus cari setting |
| Products | Kosong | User harus buat dari nol |
| Operating hours | Kosong | User harus isi manual |
| QRIS | Kosong | User harus upload manual |
| City + Category | Kosong | Tidak dikumpulkan saat registrasi |
| Onboarding | 6-step checklist (one-time) | Tidak ada follow-up setelah hari 1 |
| First login | Redirect ke /pesanan/baru?contoh=1 | User bingung — belum ada produk |

### 3.3 Desain: Smart Defaults by Business Type

**Perubahan registrasi:**

Setelah signup (Google atau email), tambah 1 layar:

```
┌─────────────────────────────────┐
│  Apa yang kamu jual?            │
│                                 │
│  [🍰 Kue & Bakery    ]         │
│  [🍱 Katering        ]         │
│  [🍜 Warung Makan    ]         │
│  [👗 Konveksi/Jahit   ]         │
│  [📸 Jasa (MUA/Foto)  ]         │
│  [📦 Grosir/Supplier  ]         │
│  [🎁 Hampers/Gift     ]         │
│  [   Lainnya...       ]         │
└─────────────────────────────────┘
```

Satu tap. Satu layar. Hasilnya:

| Pilihan | Auto-set |
|---------|----------|
| Kue & Bakery | mode=preorder, delivery_date required, suggested units: loyang/box/pcs, capacity=20/hari, suggested categories: Kue Kering, Kue Basah, Roti, Custom |
| Katering | mode=preorder, delivery_date required, units: porsi/pack/box, capacity=50/hari, categories: Nasi Box, Snack Box, Prasmanan, Tumpeng |
| Warung Makan | mode=dine_in, customer optional, table_number enabled, units: porsi/mangkok/gelas, categories: Makanan, Minuman, Snack |
| Konveksi/Jahit | mode=preorder, units: pcs/lusin, categories: Kaos, Kemeja, Seragam, Custom |
| Jasa (MUA/Foto) | mode=booking, booking_time required, categories: Wedding, Prewedding, Event, Studio |
| Grosir/Supplier | mode=langganan, units: kg/karton/pack, categories sesuai subtype |
| Hampers/Gift | mode=preorder, units: box/set/paket, categories: Lebaran, Natal, Ultah, Corporate |

**User tidak perlu tahu bahwa "preorder mode" ada.** Mereka pilih "Kue & Bakery" dan sistem sudah benar.

### 3.4 Desain: Onboarding 3-Layar (Bukan 6-Step Checklist)

Setelah pilih tipe bisnis, hanya 2 layar lagi:

**Layar 2: Produk pertama**
```
┌─────────────────────────────────┐
│  Tambah 3 produk utamamu        │
│  (bisa ditambah nanti)          │
│                                 │
│  [Nama produk]  [Harga]         │
│  [Nama produk]  [Harga]         │
│  [Nama produk]  [Harga]         │
│                                 │
│  [Lanjut →]                     │
└─────────────────────────────────┘
```

Minimum viable: nama + harga. Unit dan kategori sudah ter-preset dari tipe bisnis. Stock, HPP, image = nanti.

**Layar 3: Link toko siap**
```
┌─────────────────────────────────┐
│  Link toko kamu siap! 🎉        │
│                                 │
│  catatorder.id/[slug]           │
│                                 │
│  [Salin Link]  [Bagikan WA]    │
│                                 │
│  [Masuk Dashboard →]            │
└─────────────────────────────────┘
```

**Time to value: < 2 menit.** Dari registrasi ke link toko yang bisa dibagikan. Bukan 6 langkah terpisah yang harus dinavigasi sendiri.

### 3.5 Desain: Progressive Disclosure Dashboard

Saat ini: 7 menu sidebar (Pesanan, Pelanggan, Produk, Persiapan, Rekap, Faktur, Pengaturan) tampil sekaligus.

**Arsitektur baru: menu muncul berdasarkan usage.**

| Kondisi | Menu yang tampil |
|---------|-----------------|
| 0 pesanan | Pesanan, Produk, Pengaturan |
| 1+ pesanan | + Pelanggan |
| 5+ pesanan dengan delivery date | + Persiapan |
| 10+ pesanan | + Rekap |
| Bisnis tier OR manual activate | + Faktur |

User baru hanya melihat 3 menu. Tidak overwhelming. Setiap menu baru muncul dengan contextual tooltip: "Kamu sudah punya 5 pelanggan — lihat daftar mereka di sini."

### 3.6 Desain: Form Pesanan Baru yang Minimal

Saat ini: form punya banyak section visible (pelanggan, item, pengiriman, pembayaran, catatan, diskon, foto).

**Arsitektur baru berdasarkan mode:**

| Mode | Yang ditampilkan | Yang disembunyikan |
|------|-----------------|-------------------|
| Dine-in | Item picker + Meja (opsional) + Simpan | Pelanggan, delivery date, catatan, foto |
| Pre-order | Item picker + Pelanggan + Tanggal kirim + Simpan | Meja, catatan (collapsible), foto (collapsible) |
| Booking | Item picker + Pelanggan + Tanggal + Jam + Simpan | Meja, catatan (collapsible) |

**Prinsip: 1 layar, 1 aksi, 0 ambiguitas.** Bagian lain hanya muncul jika user membutuhkan (collapsible, bukan visible by default).

---

## BAGIAN 4: LAYER 2 — TEMPORAL ARCHITECTURE

### 4.1 Prinsip

> **Motivasi meluruh dalam HARI. Kebiasaan terbentuk dalam 66 HARI.** Death valley: motivasi habis minggu ke-2, kebiasaan belum terbentuk sampai bulan ke-2. 90% jatuh di celah ini. (Kesimpulan #4)

> **TPCL: liturgical timing — kapan kamu berkomunikasi menentukan apakah didengar.** (Kesimpulan #25)

CatatOrder saat ini: **ZERO temporal rhythm.** Push hanya transactional (new order, payment claim). Onboarding drip DEAD (WA API removed). Tidak ada morning brief, weekly recap, seasonal campaign.

### 4.2 Desain: Ritme Harian — Morning Brief

**Push notification setiap pagi, 06:00 WIB** (waktu UMKM F&B mulai hari):

```
[Push Notification - 06:00 WIB]
┌─────────────────────────────────┐
│ 📋 Hari ini: 8 pesanan          │
│ Roti Coklat x15, Brownies x10  │
│ 3 belum bayar (Rp450K)         │
│                                 │
│ [Lihat Detail]                  │
└─────────────────────────────────┘
```

Implementasi:
- Cron job (Vercel atau Supabase) setiap hari 23:00 UTC (= 06:00 WIB)
- Query: orders dengan delivery_date = today, grouped by user_id
- Untuk user yang punya push_token: kirim summary via Expo Push API
- Untuk user tanpa push_token tapi punya business_phone: kirim via WA message builder (jika WA API di-restore, atau deep link wa.me)
- Tap notification → buka `/persiapan` (production list for today)

**Kenapa ini arsitektur, bukan fitur:** User tidak perlu ingat untuk cek. CatatOrder yang datang. Setiap pagi. Otomatis. Ini menjadi ritual harian — System 1, bukan System 2.

### 4.3 Desain: Death Valley Survival Sequence

Nature megastudy (61,293 partisipan) menemukan intervensi terkuat: **reward untuk KEMBALI setelah miss, bukan reward streak.**

**Engagement sequence berdasarkan umur akun:**

| Hari | Trigger | Channel | Pesan |
|------|---------|---------|-------|
| 0 | Signup | In-app | Redirect ke onboarding 3-layar |
| 1 | Belum ada pesanan | Push | "Link toko kamu sudah siap — coba bagikan ke 1 pelanggan" |
| 3 | Ada pesanan | Push | "Pesanan pertamamu sudah masuk! 🎉 Lihat rekap hari ini" |
| 3 | Tidak ada pesanan | Push | "Belum ada pesanan? Coba kirim link toko ke pelanggan terdekatmu" |
| 7 | Aktif (3+ pesanan) | Push | "7 hari bersama CatatOrder — [X] pesanan tercatat. Kamu sudah lebih rapi dari 90% UMKM" |
| 7 | Tidak aktif | Push | "Link toko kamu masih aktif di catatorder.id/[slug] — pelanggan bisa pesan kapan saja" |
| 14 | Aktif | Push | "2 minggu! [X] pelanggan sudah pesan. Yang paling sering: [top customer name]" |
| 14 | Tidak aktif | Push | "Selamat datang kembali kapan saja — pesananmu tetap tersimpan" |
| 21 | Aktif | Push | "3 minggu — biasanya di titik ini orang sudah terbiasa. Kamu sudah melewati death valley 💪" |
| 30 | Aktif | Push | "1 bulan! Total [X] pesanan, [Y] pelanggan. Bulan depan pasti lebih rame" |
| 45 | Aktif | Push | "45 hari — kebiasaan hampir terbentuk. [X] total pesanan bulan ini" |
| 66 | Aktif | Push | "66 hari — secara science, kebiasaan baru sudah terbentuk. CatatOrder sekarang bagian dari rutinmu" |

**Kunci: pesan untuk user yang KEMBALI setelah absen:**

| Trigger | Pesan |
|---------|-------|
| Buka app setelah 3+ hari absen | In-app: "Selamat datang kembali! [X] pesanan masuk selama kamu pergi" |
| Buka app setelah 7+ hari absen | In-app: "Senang kamu kembali. Semua data masih aman. Ini rekap terakhirmu" |
| Pesanan masuk saat user dormant 5+ hari | Push: "Ada pesanan baru dari [customer]! Link toko kamu masih bekerja" |

**Tidak ada pesan yang menyalahkan.** Tidak ada "Kamu sudah lama tidak buka app." Arsitektur yang benar tidak menghakimi — arsitektur menyambut.

### 4.4 Desain: Ritme Mingguan

**Setiap Senin 06:00 WIB — Week Preview:**
```
Minggu ini: [X] pesanan sudah masuk untuk [hari-hari ini].
Produk terlaris minggu lalu: [produk].
[Y] pelanggan belum bayar (Rp[Z]).
```

**Setiap Jumat 18:00 WIB — Week Recap:**
```
Rekap minggu ini:
• [X] pesanan selesai
• Rp[Y] terkumpul
• [Z] pelanggan baru
Minggu depan sudah ada [N] pesanan.
```

### 4.5 Desain: Ritme Seasonal (Ramadan Architecture)

Ramadan = peak season untuk beachhead segment (katering/kue/hampers). Ini bukan "fitur" — ini arsitektur temporal yang match dengan kalender terbesar di Indonesia.

**2 minggu sebelum Ramadan:**
```
Push: "Ramadan tinggal 2 minggu. Tahun lalu katering bisa 5-10x volume.
Kapasitas harianmu sekarang: [X]/hari. Mau naikkan?"
[Atur Kapasitas Ramadan]
```

**Minggu pertama Ramadan:**
```
Push: "Ramadan Mubarak! 🌙
Tip: banyak pesanan hampers masuk minggu 2-3. Siapkan katalog hampers sekarang.
[Tambah Produk Hampers]"
```

**H-7 Lebaran:**
```
Push: "7 hari menuju Lebaran — [X] pesanan kue kering masuk.
Delivery date terbanyak: [tanggal]. Kapasitas: [sisa Y slot].
[Lihat Persiapan]"
```

**H+1 Lebaran:**
```
Push: "Selamat Idul Fitri! 🌙
Ramadan ini kamu melayani [X] pelanggan, [Y] pesanan, Rp[Z] total.
Terima kasih sudah melayani dengan rapi. Dari jualan jadi usaha."
```

**Setelah Lebaran (seasonal wind-down):**
```
Push: "Ramadan selesai — tapi pelangganmu tetap ada.
[X] pelanggan baru selama Ramadan. Jaga hubungan — kirim WA ucapan Lebaran?"
[Kirim Ucapan via WA]
```

Implementasi:
- Cron job yang detect tanggal Ramadan (Hijri calendar API atau hardcode tahun ini)
- Conditional push berdasarkan business_category (hanya F&B + hampers)
- Capacity planning UI: "Kapasitas Ramadan" preset (2x, 3x, 5x normal)
- Hampers product template: set of 5-10 common hampers items dengan harga range

### 4.6 Desain: Gajian Timing (Tanggal 25-1)

```
Push [tanggal 25]: "Akhir bulan — biasanya pesanan naik.
Stok [produk] tinggal [X]. Perlu restok?"
```

```
Push [tanggal 1]: "Awal bulan baru! Rekap bulan lalu:
[X] pesanan, Rp[Y] revenue, [Z] pelanggan.
Bulan ini target berapa? 💪"
```

Nudge upgrade juga timed ke gajian (bukan random):
```
Push [tanggal 25, jika kuota <10]: "Kuota tinggal [X] pesanan.
Akhir bulan biasanya rame — tambah kuota sekarang supaya tidak terhenti.
[Tambah Kuota Rp15K]"
```

---

## BAGIAN 5: LAYER 3 — SOCIAL ARCHITECTURE

### 5.1 Prinsip

> **Indonesia unit of change = KOMUNITAS, bukan individu.** 5 kasus sukses (Ramadan, KB, STBM, QRIS, vaksinasi), semua lewat mekanisme komunal. 0 counter-evidence. (Kesimpulan #20)

> **KAKIS: Komunitas-Akses-Kuasa-Identitas-Shame.** Semua 5 terpenuhi = berhasil. Tidak satupun = gagal. (Kesimpulan #22)

CatatOrder saat ini: KAKIS 6/25. Distribusi individual. Referral individual. Tidak ada mekanisme komunal.

Strategy docs SUDAH mendesain Champion model — tapi itu strategi distribusi MANUSIA, bukan arsitektur PRODUK. Yang dibutuhkan: fitur produk yang secara struktural membuat adopsi komunal menjadi mudah.

### 5.2 Desain: Pasar/Bazaar Mode — Komunitas sebagai Unit

**Konsep:** Satu koordinator membuat "Pasar" → invite tenant → setiap tenant punya link toko sendiri → pasar punya directory page → koordinator melihat aggregate stats.

```
Alur:
1. Koordinator bazaar signup → pilih "Buat Pasar/Bazaar"
2. Isi nama pasar, lokasi, tanggal (jika bazaar temporer)
3. Dapat link invite: catatorder.id/join/[kode-pasar]
4. Share ke WA group tenant
5. Tenant signup via link → otomatis terhubung ke pasar
6. Pasar punya halaman: catatorder.id/pasar/[nama]
   → list semua tenant + produk mereka
   → pengunjung bisa pilih toko lalu pesan
7. Koordinator dashboard: total pesanan semua tenant, top sellers, revenue aggregate
```

**Kenapa ini arsitektur, bukan fitur:**
- **Komunitas (K):** Pasar/bazaar = natural community. Adopsi 1 tenant → pressure untuk semua tenant join
- **Kuasa (K):** Koordinator = figur otoritas yang merekomendasikan
- **Identitas (I):** "Pasar [nama] sudah digital" = identity statement
- **Shame (S):** Tenant yang belum join → "kamu kok belum punya link toko?"
- **Akses (A):** Signup via invite link = 1 tap

KAKIS projected: 18-20/25 (dari 6/25 saat ini).

**Data model:**

```sql
-- New tables
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'bazaar', -- bazaar, pasar, komunitas
  organizer_id UUID REFERENCES auth.users NOT NULL,
  city TEXT,
  city_slug TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  event_date_start DATE, -- for temporary bazaar
  event_date_end DATE,
  invite_code TEXT UNIQUE NOT NULL, -- 6-char
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE community_members (
  community_id UUID REFERENCES communities NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
```

**UI:**
- `/pasar/[slug]` — public directory page (seperti `/toko/[city]` tapi per community)
- `/komunitas` — dashboard untuk koordinator (aggregate metrics)
- Settings → "Pasar/Komunitas" section (join via code, atau buat baru)

**Effort:** MEDIUM-HIGH (new data model, invite flow, community pages, coordinator dashboard).
**Impact:** SANGAT TINGGI — ini satu-satunya cara meningkatkan KAKIS score secara struktural.

### 5.3 Desain: Social Proof dalam Produk

Saat ini: marketplace `/toko` menampilkan merchant secara individual. Tidak ada social proof.

**Perubahan:**
- Link Toko page (`/[slug]`) menampilkan: "☕ 47 pesanan bulan ini" (social proof)
- Marketplace page menampilkan: "5 UMKM di [kota] sudah pakai CatatOrder"
- Morning brief: "Hari ini 120 UMKM se-Indonesia sudah buka toko lewat CatatOrder"

**Kenapa ini arsitektur:** Social proof = mere exposure + community signal. Orang Indonesia mendengarkan apa yang dilakukan orang lain (individualism 14/100). Angka yang visible = pressure tanpa kata.

### 5.4 Desain: Champion Kit dalam Produk

Strategy docs mendesain Champion Kit (voice note, screenshots, scripts). Tapi ini manual. Arsitektur = built-in.

**Fitur "Ajak Teman UMKM":**

```
Di Settings atau Home Screen:
┌─────────────────────────────────┐
│  Kenal UMKM lain yang masih     │
│  catat pesanan di kertas?       │
│                                 │
│  [Kirim Undangan via WA]        │
│                                 │
│  Kamu dan temanmu masing-masing │
│  dapat 25 pesanan gratis.       │
└─────────────────────────────────┘
```

WA message yang dikirim (pre-composed, 1 tap):

```
Hai! Aku udah pakai CatatOrder buat terima pesanan.
Pelanggan pesan sendiri lewat link, langsung tercatat rapi.

Cobain gratis: catatorder.id/register?ref=[CODE]

*Dari jualan jadi usaha* ✨
```

**Kunci:** Ini bukan "referral link" teknis. Ini **rekomendasi personal** dari trusted person, di trusted place (WA), dengan colloquial language, saat mereka sedang bekerja (liturgical timing). TPCL 4/4.

### 5.5 Desain: WA Status Sharing Loop

Strategy docs identifies this as viral loop #1 tapi belum diimplementasi secara proaktif.

**Setelah rekap harian (malam hari):**

```
Push: "Rekap hari ini: [X] pesanan, Rp[Y] terkumpul.
Share ke WA Status? Teman-teman akan lihat betapa rapinya usahamu."
[Share Rekap ke WA Status]
```

Rekap image yang di-generate (branded, cantik, shareable):
```
┌─────────────────────────────────┐
│  📊 Rekap Hari Ini              │
│  [Nama Toko]                    │
│                                 │
│  [X] Pesanan Selesai            │
│  Rp[Y] Terkumpul               │
│  [Z] Pelanggan Dilayani         │
│                                 │
│  catatorder.id — Dari Jualan    │
│  Jadi Usaha                     │
└─────────────────────────────────┘
```

WA Status dilihat oleh 50-200 kontak. Teman UMKM melihat → "itu apa?" → ask → viral loop.

---

## BAGIAN 6: LAYER 4 — INTELLIGENCE ARCHITECTURE

### 6.1 Prinsip

> **Algoritma sederhana > expert judgment 84-94% waktu.** 136 studi, 70 tahun. Bukan AI — regresi linear. Checklist dengan bobot. (Kesimpulan #10)

> **Untuk keputusan berulang, BUAT CHECKLIST. Ego kamu bukan data.** (Kesimpulan #10)

CatatOrder sudah punya:
- ✅ Production list ("Yang Harus Disiapkan") — ini checklist, ini benar
- ✅ AI Insights (Gemini) — ada, tapi reaktif
- ✅ Rekap dengan metrik — data sudah lengkap

Yang belum ada: **proactive intelligence** — insight yang datang ke user tanpa diminta.

### 6.2 Desain: Proactive Alert System

Bukan AI kompleks. Algoritma sederhana yang run di cron job.

**Alert 1: Stok Menipis (sudah sebagian ada di rekap, perlu push)**
```
Trigger: product.stock > 0 AND product.stock <= reorder_point
Reorder point: average daily sales * 3 (3-day buffer)

Push: "Stok [Roti Coklat] tinggal [5] — biasanya habis dalam 2 hari.
Perlu restok?"
```

**Alert 2: Customer Re-order Prediction**
```
Trigger: customer biasa pesan setiap [X] hari (stddev < 3 hari).
Terakhir pesan [X+3] hari yang lalu.

Push: "[Bu Siti] biasa pesan setiap 14 hari.
Sudah 17 hari sejak pesanan terakhir.
[Kirim WA Reminder]"
```

Implementasi:
```sql
-- Query: customers with regular ordering patterns
SELECT c.name, c.phone,
  AVG(interval_days) as avg_interval,
  STDDEV(interval_days) as stddev_interval,
  MAX(o.created_at) as last_order,
  EXTRACT(DAY FROM NOW() - MAX(o.created_at)) as days_since
FROM customers c
JOIN LATERAL (
  SELECT created_at,
    EXTRACT(DAY FROM created_at - LAG(created_at) OVER (ORDER BY created_at)) as interval_days
  FROM orders WHERE customer_id = c.id AND status != 'cancelled'
) o ON true
WHERE o.interval_days IS NOT NULL
GROUP BY c.id
HAVING STDDEV(interval_days) < 5
  AND EXTRACT(DAY FROM NOW() - MAX(o.created_at)) > AVG(interval_days) + 3
```

**Alert 3: Anomaly Detection**
```
Trigger: today's order count < 50% of same-day-of-week average (last 4 weeks)

Push: "Pesanan hari ini [3] — biasanya Selasa rata-rata [8].
Cek link toko masih aktif? Atau kirim WA ke pelanggan regular?"
```

**Alert 4: Revenue Milestone**
```
Trigger: monthly revenue crosses round number (Rp1M, Rp5M, Rp10M)

Push: "Omzet bulan ini sudah Rp[5.000.000]! 🎉
Kamu di jalur yang benar."
```

**Alert 5: Capacity Warning (untuk preorder)**
```
Trigger: tomorrow's orders >= 80% of daily_order_capacity

Push: "Pesanan besok [18/20 slot].
Tinggal 2 slot tersisa. Mau tutup atau naikkan kapasitas?"
[Tutup Hari Ini] [Naikkan Kapasitas]
```

### 6.3 Desain: Simple Decision Rules (Bukan AI, Bukan Expert)

Berdasarkan Kesimpulan #10 (checklist > expert), CatatOrder bisa memberikan **decision rules sederhana** yang otomatis:

| Situasi | Rule | Aksi |
|---------|------|------|
| Product tidak ada order 30 hari | "Produk ini belum ada pesanan 30 hari" | Suggest: arsipkan atau turunkan harga |
| Collection rate < 50% bulan ini | "Separuh pesanan belum dibayar" | Suggest: aktifkan QRIS, kirim pengingat batch |
| 1 customer > 40% revenue | "40% omzet dari 1 pelanggan" | Suggest: diversifikasi, cari pelanggan baru |
| Food cost > 35% on a product | "Margin [produk] terlalu tipis" | Suggest: naikkan harga ke Rp[X] untuk target 30% |
| Orders via manual > 80% | "80% pesanan masih manual entry" | Suggest: share link toko ke 3 pelanggan |

Ini bukan AI. Ini if-else statements yang run on cron. Sederhana. Tapi evidence menunjukkan checklist sederhana mengalahkan expert 84-94% waktu.

### 6.4 Desain: Feedback Loop Closure

Berdasarkan Kesimpulan #14, 15 (expertise butuh feedback cepat):

```
Trigger: user mengubah harga produk

7 hari kemudian, push:
"Kamu ubah harga [Brownies] dari Rp25K ke Rp30K seminggu lalu.
Sejak itu: [X] pesanan Brownies (sebelumnya rata-rata [Y]/minggu).
[Revenue naik/turun Z%]."
```

```
Trigger: user menambah produk baru

14 hari kemudian, push:
"Produk baru [Kue Sus] sudah 2 minggu.
[X] pesanan, [Y] pelanggan memesannya.
[Produk teratas/terbawah dari katalogmu]."
```

Ini feedback loop yang membuat UMKM belajar dari data, bukan dari trial-and-error tanpa umpan balik. Ini yang membedakan 10 tahun pengalaman vs 1 tahun diulang 10 kali.

---

## BAGIAN 7: LAYER 5 — MEANING ARCHITECTURE

### 7.1 Prinsip

> **Meaning = byproduct, BUKAN target.** Meaning muncul dari contribution (memberi), connection (terhubung), craft (menguasai). (Kesimpulan #32)

> **Hedonic adaptation: pencapaian kembali ke baseline.** Yang TIDAK teradaptasi: hubungan buruk, kebisingan, commute. (Kesimpulan #31)

> **Harvard 87 tahun: relationships > everything.** (Kesimpulan #30)

CatatOrder sudah punya data untuk meaning — hanya perlu frame-nya.

### 7.2 Desain: Contribution Framing

Ganti bahasa "analytics" dengan bahasa "meaning."

| Sekarang (data) | Arsitektur (meaning) |
|-----------------|---------------------|
| "150 pesanan bulan ini" | "150 keluarga yang kamu layani bulan ini" |
| "Revenue Rp5.000.000" | "Usahamu menghasilkan Rp5 juta bulan ini" |
| "5 pelanggan baru" | "5 orang baru yang percaya sama kamu" |
| "Collection rate 90%" | "Pelangganmu amanah — 90% sudah bayar" |
| "AOV Rp50.000" | "Rata-rata Rp50K per pelanggan" |

Ini bukan mengubah fitur. Ini mengubah **copy** — effort: LOW, impact: HIGH.

### 7.3 Desain: Milestone Architecture

```
Pesanan ke-10:   "Pesanan ke-10! Awal yang bagus."
Pesanan ke-50:   "50 pesanan tercatat rapi — kalau di kertas, sudah 50 halaman."
Pesanan ke-100:  "100 pesanan! Dari jualan jadi usaha — beneran."
Pesanan ke-500:  "500 pesanan — kamu sudah melayani ratusan keluarga."
Pesanan ke-1000: "1000 pesanan. Kamu bukan cuma jualan — kamu menjalankan usaha."

Pelanggan ke-10:  "10 pelanggan yang kenal namamu."
Pelanggan ke-50:  "50 pelanggan — kamu sudah punya komunitas."
Pelanggan ke-100: "100 pelanggan percaya padamu."

Bulan ke-1: "1 bulan bersama CatatOrder."
Bulan ke-3: "3 bulan — lebih lama dari 90% orang yang mencoba hal baru."
Bulan ke-6: "6 bulan. Usahamu bukan coba-coba lagi."
Bulan ke-12: "1 tahun. [Total pesanan], [total pelanggan], Rp[total revenue]. Ini bukti usahamu nyata."
```

**Kenapa ini arsitektur:** Milestone muncul tanpa diminta. Setiap milestone reinforces identitas "punya usaha" (narrative DNA dari strategy docs). Ini bukan gamification — ini framing yang membuat meaning emerge as byproduct.

### 7.4 Desain: Relationship Health Indicator

Berdasarkan Kesimpulan #30 (relationships > everything):

**Home screen menampilkan "Pelanggan Setia" (bukan data table):**

```
┌─────────────────────────────────┐
│  💚 Pelanggan Setia (3+ bulan)  │
│                                 │
│  Bu Siti — 12 pesanan           │
│  Pak Ahmad — 8 pesanan          │
│  Ibu Rina — 7 pesanan           │
│                                 │
│  [Kirim Ucapan via WA]          │
└─────────────────────────────────┘
```

**Customer detail page menampilkan relationship timeline:**

```
Pelanggan sejak: 15 Jan 2026 (2 bulan)
Total pesanan: 12
Total belanja: Rp2.400.000
Rata-rata interval: setiap 5 hari
Terakhir pesan: 3 hari lalu
Favorit: Brownies (8x), Roti Coklat (4x)
Catatan: "Selalu minta extra sambal" [edit]
```

### 7.5 Desain: Time-Saved Communication

Berdasarkan Kesimpulan #33 (>55 jam = zero output) — setiap detik yang CatatOrder hemat adalah NYATA bagi orang yang bekerja 70-100 jam/minggu.

**Quantify dan komunikasikan:**

```
Perhitungan:
- Pesanan via Link Toko vs manual WA chat: ~5 menit dihemat per pesanan
- Auto-calculation vs manual: ~2 menit per pesanan
- Rekap otomatis vs hitung manual: ~30 menit per hari

Monthly:
"Bulan ini [30] pesanan masuk via Link Toko.
Estimasi waktu dihemat: ~2.5 jam dari chat WA manual."
```

Tampilkan di monthly recap sebagai "Waktu Dihemat" metric — bersama revenue dan pesanan.

### 7.6 Desain: Annual Review (Meaning Consolidation)

**Setiap akhir Desember atau akhir Ramadan:**

```
┌─────────────────────────────────┐
│  📖 Perjalanan 2026              │
│  [Nama Toko]                    │
│                                 │
│  Tahun ini kamu:                │
│  • Melayani [X] keluarga        │
│  • Mencatat [Y] pesanan         │
│  • Menghasilkan Rp[Z]           │
│  • Punya [N] pelanggan setia    │
│                                 │
│  Produk terlaris: [produk]      │
│  Pelanggan teramanah: [nama]    │
│  Bulan terbaik: [bulan]         │
│                                 │
│  Dari jualan jadi usaha.        │
│  Terima kasih sudah bertahan.   │
│                                 │
│  [Share ke WA Status]           │
└─────────────────────────────────┘
```

Ini bukan fitur analytics. Ini **narrative revision** (Kesimpulan #32, McAdams) — membantu user melihat perjalanan mereka sebagai cerita pertumbuhan, bukan sekadar angka.

---

## BAGIAN 8: IMPLEMENTASI — PRIORITAS & SEQUENCING

### 8.1 Prinsip Prioritas

Dari evidence:
- **Impact × Feasibility × Evidence Strength**
- Start dari Layer 1 (Default) — tanpa fondasi, layer lain tidak bekerja
- Arsitektur yang baik itu INCREMENTAL — tidak perlu build semua sekaligus

### 8.2 Priority Matrix

| # | Perubahan | Layer | Effort | Impact | Evidence | Prioritas |
|---|-----------|-------|--------|--------|----------|-----------|
| 1 | Smart defaults by business type | Default | LOW | HIGH | Kesimpulan 1, 23 | **P0** |
| 2 | Onboarding 3-layar (bukan 6-step) | Default | LOW | HIGH | Kesimpulan 1, 23 | **P0** |
| 3 | Morning brief push notification | Temporal | MEDIUM | HIGH | Kesimpulan 4, 34 | **P0** |
| 4 | Death valley survival sequence | Temporal | MEDIUM | HIGH | Kesimpulan 4 | **P0** |
| 5 | Contribution framing (copy changes) | Meaning | LOW | MEDIUM | Kesimpulan 32 | **P1** |
| 6 | Milestone architecture | Meaning | LOW | MEDIUM | Kesimpulan 31, 32 | **P1** |
| 7 | WA Status sharing loop | Social | LOW | HIGH | Kesimpulan 20, viral loop | **P1** |
| 8 | Customer stories on landing page | — | LOW (content) | HIGH | Kesimpulan 6 | **P1** |
| 9 | Progressive disclosure dashboard | Default | MEDIUM | MEDIUM | Kesimpulan 23 | **P1** |
| 10 | Proactive alerts (stok, customer) | Intelligence | MEDIUM | HIGH | Kesimpulan 10 | **P2** |
| 11 | Simple decision rules | Intelligence | MEDIUM | MEDIUM | Kesimpulan 10 | **P2** |
| 12 | Re-order prediction push | Intelligence | MEDIUM | MEDIUM | Kesimpulan 30 | **P2** |
| 13 | Feedback loop (price change effect) | Intelligence | MEDIUM | MEDIUM | Kesimpulan 14, 15 | **P2** |
| 14 | Ramadan architecture | Temporal | MEDIUM | HIGH (seasonal) | Kesimpulan 21 | **P2** |
| 15 | Customer relationship tools | Meaning | MEDIUM | MEDIUM | Kesimpulan 30 | **P2** |
| 16 | Pasar/Bazaar mode | Social | HIGH | VERY HIGH | Kesimpulan 20, 22 | **P3** |
| 17 | Time-saved tracking | Meaning | LOW | LOW | Kesimpulan 33 | **P3** |
| 18 | Annual review | Meaning | MEDIUM | LOW | Kesimpulan 32 | **P3** |

### 8.3 Sequencing

**Sprint 1 (1-2 minggu): Foundation — P0**
- [ ] Tambah business type selection di registrasi (1 layar)
- [ ] Smart defaults mapping (config per business type)
- [ ] Onboarding 3-layar (business type → 3 produk → link siap)
- [ ] Morning brief cron + push (06:00 WIB, production summary)
- [ ] Death valley sequence (day 1, 3, 7, 14, 30, 66 push messages)
- [ ] Return-after-miss welcome back message

**Sprint 2 (1-2 minggu): Stickiness — P1**
- [ ] Contribution framing (copy changes di rekap, pesanan, milestone)
- [ ] Milestone push notifications (pesanan ke-10, 50, 100; pelanggan ke-10, 50; bulan ke-1, 3, 6)
- [ ] WA Status sharing dari rekap harian (generate image + share button)
- [ ] Customer stories di landing page (tulis 3-5 narratives)
- [ ] Progressive disclosure dashboard (hide menu by usage)

**Sprint 3 (2-3 minggu): Intelligence — P2**
- [ ] Proactive alert cron (stok, anomaly, capacity)
- [ ] Customer re-order prediction + push
- [ ] Simple decision rules (inactive products, collection rate, concentration risk)
- [ ] Feedback loop: price change effect tracking
- [ ] Ramadan architecture (seasonal push, capacity planning, hampers template)
- [ ] Customer relationship fields (favorites, notes, last order interval)

**Sprint 4 (3-4 minggu): Community — P3**
- [ ] Pasar/Bazaar mode (data model, invite flow, directory page, coordinator dashboard)
- [ ] Community referral (group code, community fund)
- [ ] Social proof di link toko page ("47 pesanan bulan ini")
- [ ] Champion kit in-product (invite via WA, pre-composed message)

---

## BAGIAN 9: MEASUREMENT FRAMEWORK

### 9.1 Prinsip

Arsitektur yang bekerja menunjukkan perubahan di **behavior metrics**, bukan feature usage metrics.

### 9.2 Key Metrics

| Metric | Sekarang (Baseline) | Target (3 bulan) | Target (6 bulan) | Layer |
|--------|-------------------|-------------------|-------------------|-------|
| Time to first order | Unknown (>30 min?) | < 5 min | < 3 min | Default |
| D1 retention | Unknown | > 40% | > 50% | Default + Temporal |
| D7 retention | Unknown | > 25% | > 35% | Temporal |
| D30 retention | Unknown | > 15% | > 25% | Temporal + Social |
| Death valley survival (day 14-66) | Unknown | > 30% | > 50% | Temporal |
| Morning brief open rate | N/A (doesn't exist) | > 30% | > 40% | Temporal |
| WA Status share rate | N/A | > 10% of active | > 20% | Social |
| Organic referral rate | Unknown | > 15% | > 30% | Social |
| KAKIS score | 6/25 | 12/25 | 18/25 | Social |
| Orders via Link Toko vs Manual | Unknown | > 40% link | > 60% link | Default |
| Monthly recap sentiment | N/A | Positive framing | — | Meaning |

### 9.3 Leading Indicators

| Indicator | Sinyal Arsitektur Bekerja |
|-----------|--------------------------|
| User buka app sebelum push dikirim | Habit forming — System 1 aktif |
| User share rekap ke WA Status tanpa prompt | Viral loop alami |
| User return setelah 5+ hari dormant | Death valley sequence bekerja |
| 2nd user dari komunitas yang sama signup | Social architecture engaging |
| User upgrade saat gajian | Temporal timing match |
| User bilang "ini udah biasa" | Habit terbentuk (hari 66+) |

---

## BAGIAN 10: DIAGNOSIS FINAL

### 10.1 CatatOrder Sekarang vs Seharusnya

```
SEKARANG:
User signup → bingung → manual config → coba → minggu 2 drop → lupa

ARSITEKTUR:
User signup → pilih tipe bisnis → 3 produk → link siap (2 menit)
→ morning brief setiap pagi → death valley sequence minggu 2-8
→ milestone celebrate → community invite → proactive alerts
→ Ramadan mode otomatis → annual review
→ dari jualan jadi usaha
```

### 10.2 Satu Kalimat

> CatatOrder sudah membangun tool yang bagus. Sekarang perlu menjadi **arsitektur yang membuat perilaku bisnis baik menjadi default** — lewat smart defaults yang menghilangkan keputusan, temporal rhythm yang menciptakan kebiasaan, social architecture yang mengaktifkan komunitas, intelligence yang mengganti pikiran dengan checklist, dan meaning framing yang membuat angka menjadi cerita.

### 10.3 Apa yang TIDAK Perlu Dilakukan

Berdasarkan evidence yang sama:

- ❌ Tidak perlu "gamification" (points, badges, leaderboards) — ini motivasi ekstrinsik, evidence menunjukkan ini counter-productive (overjustification effect, d = -0.40)
- ❌ Tidak perlu "educational content" (tutorial, blog tips bisnis) — informasi bukan bottleneck. Arsitektur yang bottleneck
- ❌ Tidak perlu "AI chatbot customer service" — sudah dibuktikan gagal (WA bot: 0 orders in 5 weeks)
- ❌ Tidak perlu "social media marketing campaign" — ini billboard, bukan trusted place. TPCL score 1/4
- ❌ Tidak perlu "more features" — fitur sudah 16/16 untuk katering. Yang kurang bukan fitur, tapi arsitektur yang membuat fitur digunakan secara otomatis

---

## REFERENSI EVIDENCE

Setiap desain di dokumen ini merujuk ke kesimpulan spesifik dari `/realitas/`:

| Kesimpulan | Studi Utama | Diterapkan di Layer |
|-----------|-------------|-------------------|
| #1 Arsitektur > Pikiran | Thaler opt-in/out, QRIS, Ramadan | Default (3.3-3.6) |
| #2 43% otomatis | Wood et al. 2002 | Default (3.5, 3.6) |
| #4 Death valley 66 hari | Lally et al. 2010, Nature megastudy 61K | Temporal (4.3) |
| #6 Cerita > Argumen | Hasson neural coupling, Carnegie Mellon 2.09x | Landing page (Sprint 2) |
| #9 Noise > Bias | Kahneman Noise, 208 judges | Intelligence (6.3) |
| #10 Algoritma > expert | Grove 136 studies, WHO Checklist | Intelligence (6.2, 6.3) |
| #12 Superforecasters | Tetlock, Bayesian updating | Intelligence (6.4) |
| #14, 15 Expertise + OK Plateau | Shanteau, Ericsson | Intelligence (6.4) |
| #20 Komunitas = unit of change | 5 kasus Indonesia | Social (5.2-5.5) |
| #21 Ramadan engine | 242M, 99.8%, zero cost | Temporal (4.5) |
| #22 KAKIS | Ramadan 25/25 vs anti-rokok 0/25 | Social (5.2) |
| #23 Scarcity -13 IQ | Mullainathan & Shafir | Default (3.2-3.6) |
| #25 TPCL | Wali Songo, dakwah, WA penetration | Social (5.4), Temporal (4.5, 4.6) |
| #30 Relationships > everything | Harvard 87 tahun | Meaning (7.4) |
| #31 Hedonic adaptation | Brickman 1978 | Meaning (7.3, 7.5) |
| #32 Meaning = byproduct | Steger 147 studies, 92K | Meaning (7.2, 7.3, 7.6) |
| #33 55 jam = zero output | Pencavel, WHO 745K deaths | Meaning (7.5) |
| #34 Deep work 4 jam | Ericsson | Temporal (4.2) |
