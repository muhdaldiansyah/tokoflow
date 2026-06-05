# CatatOrder — Session Summary
*Compiled: 23 Februari 2026*

---

## DAFTAR ISI

1. [Big Picture: Konteks Pasar](#1-big-picture-konteks-pasar)
2. [Analisis Produk: Fitur Pesanan](#2-analisis-produk-fitur-pesanan)
3. [Feature Updates yang Diimplementasi](#3-feature-updates-yang-diimplementasi)
4. [Analisis Kompetitif & Positioning](#4-analisis-kompetitif--positioning)
5. [Strategi Distribusi Pre-Ramadan](#5-strategi-distribusi-pre-ramadan)
6. [Script Video Final: "Pesanan Mana Kak?"](#6-script-video-final-pesanan-mana-kak)

---

## 1. BIG PICTURE: KONTEKS PASAR

### Indonesia & UMKM — Apa yang Riset Katakan

Indonesia punya 65 juta UMKM, berkontribusi 61% dari GDP nasional dan menyerap 97% tenaga kerja. Dari 30,18 juta UMKM yang terdaftar, hanya ~6 juta yang sudah menggunakan SaaS — artinya **24 juta belum terjangkau**. Pasar SaaS Indonesia diproyeksikan mencapai $1,25 miliar pada 2029 dengan CAGR 23,2%.

Tapi angka ini hanya separuh ceritanya. Yang lebih penting adalah *mengapa* 24 juta belum adopsi — dan jawabannya bukan karena tidak ada uang atau tidak ada akses internet. Jawabannya adalah psikologis.

### Psikologi UMKM Mikro — Fondasi Segalanya

**Orientasi survival, bukan growth.** Sebagian besar UMKM mikro beroperasi dalam mode subsisten — tujuannya "cukup buat makan," bukan "mau berkembang." Ini mengubah segalanya: cara mereka evaluasi tools, cara mereka ambil keputusan, cara mereka merespons pricing.

**Loss aversion 2x lebih kuat dari gain.** UMKM tidak akan mengambil risiko Rp 50rb pada tool baru sebelum mereka yakin tool itu bekerja. Free tier bukan strategi marketing — ini adalah **kebutuhan psikologis**.

**Trust dibangun melalui orang, bukan brand.** Urutan trust UMKM: (1) teman yang merekomendasikan, (2) bukti yang bisa dilihat sendiri, (3) bisa coba gratis, (4) baru brand/perusahaan. Ini kebalikan dari enterprise SaaS.

**Identitas "bukan pengusaha."** Kebanyakan operator mikro tidak mengidentifikasi diri sebagai pebisnis. Mereka adalah "ibu yang jualan kue" atau "pegawai yang punya sampingan." Tool yang menggunakan bahasa bisnis formal akan terasa "bukan untuk saya."

**Spousal gatekeeping.** 60–70% keputusan finansial UMKM mikro melibatkan pasangan. Harga di atas Rp 50rb/bulan akan memicu "diskusi" dengan pasangan — dan diskusi itu sering berujung churn.

### Segmen Target Utama CatatOrder

Berdasarkan scoring 8 dimensi (pain level, TAM, WTP, competitive gap, seasonal strength, viral potential, product fit, cross-sell value):

| Rank | Segmen | Skor | Alasan |
|------|--------|------|--------|
| #1 | **Katering** | 66/80 | Pain tertinggi (7 dimensi kompleksitas order), seasonal Ramadan 3–5x, viral via arisan |
| #2 | **Bakery/Kue** | 59/80 | Margin tertinggi (50–75%), seasonal Eid kue kering 5–10x, komunitas Instagram baker |
| #3 | **F&B General** | 42/80 | TAM terbesar tapi kompetisi tertinggi, belum prioritas |

### Timing Window Terpenting: Ramadan

Ramadan adalah event spending terbesar Indonesia ($73 miliar / IDR 1.188T). Untuk UMKM katering dan bakery:
- Volume pesanan naik **3–5x** (katering) dan **5–10x** (kue kering)
- Sistem manual (notebook + scroll WA) **kolaps** di volume 2x, apalagi 5x
- Ada **dua adoption window**: Pre-Ramadan (preparation-driven) dan Post-Ramadan (reflection-driven)
- Pre-Ramadan = lebih fertile karena operator masih bisa belajar tool baru sebelum kewalahan

---

## 2. ANALISIS PRODUK: FITUR PESANAN

### Yang Sudah Benar (Jangan Diubah)

**Struktur 4 status (Baru → Proses → Kirim → Selesai)**
Bukan sekadar label — ini representasi digital dari siklus emosional operator. Setiap status punya emosi yang berbeda: Baru = excitement + anxiety, Proses = focus + time pressure, Kirim = anticipation, Selesai = relief + closure.

**Payment status 3-tier (Lunas/DP/Belum Bayar)**
Killer feature yang sesungguhnya. Menyelesaikan dua masalah sekaligus: tracking DP yang kompleks untuk katering, dan mengurangi awkwardness menagih hutang. Tombol "Ingatkan Bayar" memindahkan beban dari personal ke transaksional — "bukan saya yang nagih, tapi sistem."

**"Simpan & Buat Lagi"**
Detail kecil yang sangat cerdas untuk operator katering yang menerima 20–30 pesanan massal sekaligus saat pre-order Ramadan dibuka.

**Tombol konteks (Lihat/Edit/Struk/Kirim WA)**
Empat aksi yang paling sering dilakukan setelah mencatat pesanan, dalam urutan yang mengikuti alur mental operator, bukan alur teknis programmer.

**Struk PDF + Kirim WA dalam satu flow**
Viral mechanic utama. Setiap struk yang dikirim ke pelanggan = exposure ke CatatOrder. Watermark "catatorder.id" di bawah struk adalah zero-CAC acquisition yang sudah berjalan otomatis.

**Nama bisnis di struk + logo support**
Menyelesaikan gengsi psychology — operator ingin kelihatan profesional kepada pelanggan, bukan menampilkan nama app orang lain.

**Nama pelanggan di order list**
Sudah ada sebelum sesi ini. Kritis untuk operator dengan 15–20 pesanan aktif simultan — mereka mengingat pesanan dari nama orangnya, bukan dari item-nya.

**DP tracking dengan nominal**
Sudah ada. Menampilkan berapa yang sudah dibayar dan berapa sisa — kebutuhan mendasar katering yang handle advance payment.

### Gap yang Diidentifikasi dan Status

| Gap | Status | Prioritas |
|-----|--------|-----------|
| Field tanggal delivery | ✅ Diimplementasi | Kritis |
| Quick-pick item dari riwayat | ✅ Diimplementasi | Tinggi |
| Tab "Hari Ini" | ✅ Diimplementasi | Tinggi |
| Field catatan accessible | Belum — tab masih tersembunyi | Medium |
| Onboarding user baru | Belum | Medium |
| Logo bisnis di struk | Status belum dikonfirmasi | Medium |
| Recurring order / langganan | Belum — pasca Ramadan | Rendah |
| Delivery address field | Belum — pasca Ramadan | Rendah |

### Yang Tidak Boleh Ditambahkan (Sekarang)

- **Inventory management / stok bahan baku** — menambah cognitive load, membunuh kesederhanaan
- **Laporan pajak / akuntansi** — memicu tax anxiety, adoption barrier nyata
- **Multi-user / team management** — target adalah operator solo, bukan tim
- **Integrasi marketplace** — untuk segmen yang sudah lebih advance, bukan micro-UMKM

---

## 3. FEATURE UPDATES YANG DIIMPLEMENTASI

### Update 1: Delivery Date Field (Tanggal Delivery / Ambil)

**Database:** Migration `016_add_delivery_date.sql` — added `delivery_date` column + index, pushed to production.

**Form:** Toggle button "Tanggal" dengan CalendarDays icon, membuka `datetime-local` input.

**List view display logic:**
- "Hari ini 14:00" — kalau delivery hari ini
- "Besok 11:00" — kalau delivery besok
- "23 Feb 14:00" — kalau tanggal lain

**Detail view:** Full date display ("Senin, 23 Februari 2026, 14:00")

**WA messages:** Semua 4 titik share WA (OrderDetail share, payment reminder, OrderList share, celebration share) sudah include delivery date.

**Mengapa ini kritis:** Katering punya delivery timing sebagai dimensi kompleksitas tertinggi — "harus sampai jam 11:45, meeting mulai jam 12:00." Tanpa field ini, operator masih harus scroll WA untuk cari tahu pesanan ini diminta kapan — persis problem yang CatatOrder harusnya solve.

---

### Update 2: Quick-Pick Item Chips

**Implementasi:** Shows top 5 most frequently ordered items sebagai tappable chips di atas field nama item.

**Behavior:**
- Tap pertama = item langsung ditambahkan dengan harga terakhir yang digunakan, qty 1
- Tap lagi = increment qty existing item
- Uses existing `getFrequentItems()` service yang sudah dibangun tapi belum dihubungkan ke UI

**Visual feedback:**
- Chip berubah hijau (`bg-green-50 border-green-300 text-green-700`) saat item sudah ada di list
- Qty counter muncul di chip: `+ Ayam x2`
- Toast notification setiap tap: "Ayam ditambahkan" (tap pertama) → "Ayam x3" (tap berikutnya)
- `active:scale-95` memberikan tactile press feedback untuk touchscreen

**Mengapa ini kritis:** Warung yang jual ayam, bubur, cireng setiap hari — 8 interaksi untuk catat 2 item (ketik nama, set qty, set harga, klik +, ulangi). Dengan quick-pick, itu menjadi 2 tap. Research menunjukkan "3-step death line" — lebih dari 3 langkah = "ribet" = abandon.

---

### Update 3: Tab "Hari Ini"

**Implementasi:** Tab baru di awal filter bar dalam OrderList.

**Filter logic:** Menampilkan pesanan dengan `delivery_date = today`, dikecualikan status `done` dan `cancelled`. Hanya pesanan yang butuh perhatian (Baru, Proses, Kirim) yang muncul.

**Empty state:** "Tidak ada pesanan untuk hari ini"

**Timezone handling:** Semua konversi terjadi di browser (local time). Query ke Supabase dihitung dari local timezone lalu convert ke UTC — sudah aman untuk semua zona waktu Indonesia (WIB/WITA/WIT).

**Mengapa ini kritis:** Operator UMKM punya ritual harian penting — di pagi hari mereka perlu tahu apa yang harus dikerjakan hari ini, bukan semua pesanan aktif. Ini menyelesaikan "closure anxiety" — perasaan "did I miss anything?" yang menghantui operator setiap malam.

---

## 4. ANALISIS KOMPETITIF & POSITIONING

### Landscape Kompetitor

| Tool | Pricing | Target | Gap |
|------|---------|--------|-----|
| Majoo | Rp 149–599K/bulan | SME | Terlalu mahal untuk micro-UMKM |
| Moka POS | Rp 299K/outlet/bulan | F&B SME | POS-focused, bukan order management |
| Pawoon | Rp 199K/bulan | F&B SME | Sama — POS oriented |
| Mimin | Tidak publik ($1.5M raised) | UMKM 95% | WA chatbot-focused, bukan simple order recording |
| BukuWarung | Free, monetize via payments | Semua UMKM | Bookkeeping, bukan order management |
| iReap | Freemium | Micro-small | Limited free tier |

**Whitespace CatatOrder:** Ultra-affordable + WhatsApp-native + micro-UMKM focus + vertical-specific. Tidak ada satu pun kompetitor yang ada di interseksi ini.

### Competitive Moat (3 Lapisan)

**Moat 1 — Community Network Effects:** Begitu 5+ operator dalam satu arisan group pakai CatatOrder, switching cost menjadi sosial, bukan finansial. "Semua pakai ini" → lock-in yang tidak bisa dikopi kompetitor hanya dengan copy fitur.

**Moat 2 — Data Accumulation:** Setelah 3 bulan data pesanan, pelanggan, dan rekap terakumulasi, switching cost menjadi sangat tinggi. Operator tidak akan mau kehilangan riwayat pesanan Bu Sari yang sudah 6 bulan tersimpan.

**Moat 3 — Viral Mechanic Built-in:** Setiap struk PDF yang dikirim ke pelanggan membawa watermark "catatorder.id." Setiap pengiriman pesanan adalah iklan gratis. Tidak ada budget marketing yang diperlukan untuk mekanisme ini bekerja.

---

## 5. STRATEGI DISTRIBUSI PRE-RAMADAN

### Prinsip Utama

Distribusi untuk CatatOrder **bukan soal iklan** — itu jalan yang mahal dan lambat untuk segmen ini. Satu-satunya distribusi yang bekerja untuk UMKM mikro adalah **community seeding yang sangat targeted**.

Viral coefficient yang berlaku: satu operator puas di satu arisan group → 5–10 pengguna baru dalam 2–3 minggu.

### 3 Aksi Konkret (Sebelum Ramadan)

**Aksi 1 — Seed 5 operator katering/kue aktif di media sosial**
- Kriteria: Instagram atau TikTok dengan minimal 500 follower, konten seputar makanan/pesanan
- Mereka sudah punya audience UMKM sejenis
- Berikan akses penuh, dampingi setup pertama via WhatsApp
- Minta satu hal saja: kalau merasa terbantu, ceritakan di story

**Aksi 2 — Masuk ke 3 WhatsApp group UMKM**
- Target: arisan ibu-ibu, komunitas katering, grup PKK
- Bukan untuk jualan — tapi menawarkan bantuan setup gratis
- Satu orang yang berhasil di dalam group = endorser yang lebih powerful dari iklan apapun

**Aksi 3 — Produksi dan posting video (lihat Section 6)**
- Target posting: 3–5 hari sebelum Ramadan dimulai
- Window pre-Ramadan adalah yang paling fertile — operator dalam mode persiapan, belum kewalahan, masih bisa belajar tool baru

### Timing Kalender

| Period | Status Operator | Action |
|--------|----------------|--------|
| **Sekarang (pre-Ramadan)** | Preparation mode, cemas tapi belum chaos | **Akuisisi agresif** — video, community seeding |
| **Ramadan Minggu 1–2** | Adrenaline + early chaos | Onboarding support via WA, reply semua pertanyaan |
| **Ramadan Minggu 3–4** | Exhaustion + routine | Habit formation — daily use selama 21+ hari |
| **Post-Ramadan** | Reflection mode | Tunjukkan "Ramadan recap" → konversi ke berbayar |
| **Post-Ramadan (May)** | Revenue drop 70–80% | Grace period, jangan hard sell |

---

## 6. SCRIPT VIDEO FINAL: "Pesanan Mana Kak?"

**Durasi:** 60 detik
**Platform:** TikTok + Instagram Reels
**Format:** Vertical, handheld, natural — bukan studio
**Produksi:** Bisa selesai dalam 1 hari dengan CapCut/VN

---

### STORYBOARD

---

**[0–2 detik] — HOOK**

*Visual:* Close-up layar HP. Notifikasi WA masuk.

*Pesan di layar:*
> "Kak, pesanan saya yang kemarin gimana ya? Udah DP kemarin lho 🙂"

*Audio:* Bunyi notifikasi WA. Tidak ada musik. Tidak ada text overlay.

*Mengapa:* Bunyi notifikasi WA adalah pavlovian trigger. "Udah DP kemarin lho" menambahkan stakes — ada uang yang sudah berpindah tangan. Emoji 🙂 adalah detail spesifik cara Indonesia menegur sopan tapi menekan. Tiga elemen ini memicu anxiety yang dikenal di detik pertama.

---

**[3–8 detik] — PAIN SETUP**

*Visual:* POV tangan scroll WhatsApp ke atas. Chat demi chat. Jempol semakin cepat.

*Text overlay:* **"Scroll... scroll... scroll..."**

*Audio:* Suara scroll repetitive. Masih tanpa musik.

*Mengapa:* Ritual harian yang mereka benci tapi normalisasi. Melihatnya dari luar membuat mereka sadar betapa absurdnya.

---

**[9–14 detik] — ESKALASI**

*Visual:* Masih scrolling. Notifikasi kedua masuk.

*Pesan di layar:*
> "Kak pesanan 20 box nasi untuk Jumat bisa?"

*Text overlay:* **"Belum ketemu yang lama. Yang baru udah masuk."**

*Audio:* Bunyi notifikasi kedua. Masih tanpa musik.

*Mengapa:* Pressure berlipat — dua masalah bersamaan. Ini sangat spesifik untuk katering menjelang Ramadan. Eskalasi dua lapis jauh lebih visceral dari satu momen panik.

---

**[15–18 detik] — PEAK PAIN**

*Visual:* Tangan berhenti scroll. Jari menyentuh dahi. Helaan napas.

*Text overlay:* **"Tiap hari kayak gini."**

*Audio:* Sigh. Hening total.

*Mengapa:* Exhaustion validation. Tidak ada drama berlebihan — hanya kelelahan yang semua orang kenal. Ini peak moment untuk Peak-End Rule: persepsi keseluruhan video ditentukan oleh momen paling intens dan ending. Ini adalah puncaknya.

---

**[19–22 detik] — THE TURN**

*Visual:* Layar gelap 0.5 detik. Jari mengetuk app berbeda. Layar terang — tampilan bersih muncul.

*Text overlay:* **"Sekarang coba lihat ini."**

*Audio:* Satu beat clean. Musik ukulele/gitar akustik hangat masuk pelan — mulai **tepat di momen ini**, tidak sebelumnya. Kontras audio silence → warmth menandakan perubahan secara emosional.

---

**[23–30 detik] — RELIEF**

*Visual:* CatatOrder order list. **"Bu Sari"** langsung terlihat di baris pertama — nama, item, harga, status "Belum Bayar." Jari scroll dengan tenang — kontras langsung dengan scroll panik di awal.

Tap order → detail muncul: **"Besok, 11:00."**

Tap "Ingatkan Bayar" → WhatsApp terbuka, pesan profesional siap kirim.

*Text overlay:* **"5 detik. Ketemu. Kirim."**

*Mengapa:* Solusi ditunjukkan, bukan dijelaskan. 5 detik vs 5 menit scrolling — kontras yang tidak butuh kata-kata.

---

**[31–36 detik] — DELIGHT**

*Visual:* Form pesanan baru. Quick-pick chips muncul di atas field:
**+ Nasi Box · + Es Teh · + Kerupuk**

Tap, tap, tap → 3 item masuk. Chip berubah hijau dengan qty counter: **+ Nasi Box x1**. Set tanggal delivery. Simpan.

*Text overlay:* **"Pesanan baru? 3 tap."**

*Audio:* Musik naik sedikit — playful, ringan.

*Mengapa:* Momen "tunggu, tadi apa?" yang mendorong rewatch. Kecepatan yang tidak terduga membuat penonton ingin melihat lagi.

---

**[37–42 detik] — CLOSURE**

*Visual:* Tap tab **"Hari Ini"** — 5 pesanan hari ini, masing-masing dengan nama pelanggan, jam delivery, status badge berwarna. Semua terlihat dalam satu layar tanpa scroll.

*Text overlay:* **"Setiap pagi, kamu tahu persis apa yang harus dikerjakan."**

*Audio:* Musik kembali hangat, sedikit lebih pelan.

*Mengapa:* Peak-End Rule: ending = perasaan KONTROL. Ini emosi yang paling dirindukan operator yang hidupnya penuh ketidakpastian. Ini yang mereka ingat setelah video selesai.

---

**[43–52 detik] — HUMAN MOMENT**

*Visual:* Cut ke wajah ibu nyata. Dapur di belakang — kompor, packaging katering. Duduk tenang. HP di tangan. Natural, tidak studio.

*Dialog ke kamera, tidak scripted:*

> **"Ramadan tahun lalu sampai nangis. Pesanan berantakan, pelanggan nanya-nanya, saya udah ga tau harus ngapain."**

*Pause. Senyum kecil.*

> **"Sekarang alhamdulillah. Rapi."**

*Audio:* Musik fade pelan saat dia bicara.

*Mengapa:* Wajah manusia = trust. "Sampai nangis" adalah detail yang spesifik dan visceral. "Ada yang kelewat" (versi alternatif) bekerja via loss aversion. "Alhamdulillah" adalah resonansi kultural yang tidak bisa digantikan text overlay. Pause sebelum "Sekarang" memberikan ruang emosional yang membuat kata itu genuine.

**Opsi untuk human moment:**
- **Opsi A (lebih kuat):** User aktif CatatOrder yang bisa dihubungi dalam 1–2 hari. Lebih authentic, tidak ada konflik interest.
- **Opsi B (lebih cepat):** Founder sendiri dengan disclaimer jujur di komentar: "Ini saya sendiri yang bangun produk ini, karena saya lihat masalah ini tiap hari." Transparansi justru membangun trust di segmen UMKM.

---

**[53–57 detik] — CTA**

*Visual:* Layar putih bersih. Text muncul satu per satu dengan rhythm:

**"Gratis."**

**"Langsung dari browser HP."**

**"Tanpa ribet."**

*Audio:* Musik fade out.

*Mengapa:* Tiga objeksi terbesar UMKM dijawab dalam tiga kata: harga (gratis), install friction (browser, tidak perlu download), kompleksitas (tanpa ribet). Tidak ada "DAFTAR SEKARANG!" — pressure selling memicu skeptisisme "pasti ada tangkapannya."

---

**[58–60 detik] — LOOP**

*Visual:* **catatorder.id**

*Audio:* Bunyi notifikasi WA — satu kali. Sama persis dengan detik 0. Tapi musik masih hangat. Tidak ada panik.

*Mengapa:* Suara yang sama, konteks emosional yang berbeda. Otak secara otomatis merasakan kontras: dulu notifikasi itu = panik, sekarang = terkendali. Ini yang mendorong rewatch rate — sinyal algoritma tertinggi.

---

### CAPTION

```
Yang jualan via WA pasti paham.

30 pesanan. 30 chat. Yang mana punya siapa?

Ramadan tinggal sebentar lagi.
Masih mau scroll WA buat cari pesanan?

Tag teman yang butuh ini 👇

#kateringRamadan #jualkue #UMKMIndonesia #ramadan2026 #orderanlebaran #catatorder
```

*Mengapa caption ini:* "Yang jualan via WA pasti paham" adalah identity filter — orang yang jualan via WA langsung merasa "ini untuk saya." "30 pesanan. 30 chat." adalah copywriting yang menghantam langsung. Pertanyaan retoris di akhir memancing engagement tanpa terasa pushy.

---

### PANDUAN PRODUKSI

| Elemen | Durasi | Cara Produksi |
|--------|--------|---------------|
| Scroll WA panik | 0–14 detik | Screen recording HP sendiri, simulasi 2 chat masuk berurutan |
| Helaan napas | 15–18 detik | Close-up tangan sendiri + rekam suara sigh terpisah, sync di edit |
| Demo CatatOrder | 19–42 detik | Screen recording app live — bukan mockup. Pastikan ada data pesanan nyata dengan nama pelanggan |
| Wajah ibu (human moment) | 43–52 detik | User aktif CatatOrder, atau founder sendiri. Selfie cam, cahaya natural dari jendela |
| Text CTA + logo | 53–60 detik | CapCut text animation |

**Spesifikasi teknis edit:**
- Text overlay: font tebal, putih dengan shadow tipis, ukuran besar untuk HP kecil
- Transisi gelap di detik 19: 0.5 detik, tanpa efek fancy
- Audio layer 1: Notifikasi WA asli (detik 0 dan detik 58–60)
- Audio layer 2: Ukulele/gitar akustik royalty-free dari CapCut library (masuk detik 19, fade out detik 53–57)
- Total waktu edit: 1–2 jam

**Distribusi:**
- Waktu posting: Selasa–Kamis, pukul 20:00–22:00 WIB (jam ibu-ibu paling aktif scroll setelah anak tidur)
- Komentar pertama dari akun sendiri: *"Gratis langsung pakai, buka catatorder.id di browser HP 🙏"*
- Reply **semua** komentar dalam 2 jam pertama — ini sinyal utama algoritma TikTok dan Reels
- Kalau ada yang tag teman di komentar, reply ke tag-an itu juga — ini multiplier organik

---

### Mengapa Struktur Video Ini Bekerja

| Faktor Algoritma | Cara Video Ini Memenuhinya |
|-----------------|---------------------------|
| Retention rate (TikTok: 50 poin) | Hook detik 0–2 memicu anxiety universal — tidak ada alasan scroll away |
| Completion rate (30 poin) | Escalation → Turn → Relief menciptakan arc naratif yang ingin ditonton sampai habis |
| Rewatch rate (20 poin) | Loop audio notifikasi WA (awal ↔ akhir) + kecepatan quick-pick yang membuat orang ingin lihat lagi |
| Shares / DM sends (15 poin) | "Ini gue banget" + "temen gue harus lihat ini" — relatability drives DM shares |
| Saves (10 poin) | "Gratis, langsung dari browser HP" membuat orang save untuk dicoba nanti |

| Faktor Psikologis | Cara Video Ini Memanfaatkannya |
|------------------|-------------------------------|
| Loss aversion | Momen panik kehilangan pesanan, bukan "fitur keren yang menguntungkan" |
| Narrative bias | Story satu operator, bukan statistik |
| Peak-End Rule | Peak = helaan napas (pain). End = tab "Hari Ini" + alhamdulillah (control + relief) |
| Exhaustion validation | "Tiap hari kayak gini" — merasa dilihat dan dipahami, bukan dijudge |
| Social proof implicit | Menampilkan app yang sudah working dengan data nyata, bukan janji |
| Relational trust | Wajah manusia nyata di human moment — bukan corporate voiceover |

---

*Document compiled dari sesi analisis CatatOrder, 23 Februari 2026.*
*Mencakup: market research synthesis, product critique, feature implementation log, competitive positioning, distribution strategy, dan video production script.*
