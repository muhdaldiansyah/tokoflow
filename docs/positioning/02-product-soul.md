# 02 · Product Soul

> Apa yang membuat Tokoflow Tokoflow. Yang akan membedakannya dari semua produk lain di kategori manapun.

---

## The 5 Iconic Interactions

Apple punya iconic interactions: slide-to-unlock, swipe-back gesture, AirPods open-to-pair, Apple Pay tap-to-pay. Masing-masing **satu gesture, magis karena restraint**.

Tokoflow punya **5 iconic interactions** yang jadi jiwa produk. Setiap fitur lain mendukung 5 ini. Kalau salah satu hilang, Tokoflow kehilangan soul.

---

### 1. The Photo Magic

**Gesture**: Foto dapur/dagangan → toko muncul.

**Feeling**: Wonder. *"Kok bisa?"*

**Mechanics**:
- User open app first time → ada 1 button: kamera icon besar
- Tap → kamera terbuka
- Foto dapur, etalase, atau dagangan
- 3 detik AI processing
- Toko muncul: nama, story, menu (3-5 produk auto-detected), harga (peer benchmark), foto cantik
- User tap "Begini sudah pas?" → toko live + auto-share ke IG/WA

**Why ini iconic**:
- Apple Watch dipair dengan tap, bukan menu setup
- AirPods pair dengan buka case, bukan settings
- iPhone unlock dengan tatap, bukan password
- Tokoflow bangun toko dengan foto, bukan form

**Anti-pattern yang harus dihindari**:
- ❌ Multi-step onboarding wizard
- ❌ "Pilih business type dulu"
- ❌ "Verifikasi email/phone first"
- ❌ Manual product entry form

---

### 2. The Vibrate

**Gesture**: Pesanan masuk → HP getar halus 1x.

**Feeling**: Calm. *"Dia hormati waktuku."*

**Mechanics**:
- Default mode: vibrate-only, tidak ada sound
- 1 getaran lembut (300ms), tidak harsh
- Notif tampil di lock screen: "Pesanan baru dari Pak Andi"
- Tidak ganggu flow user (memasak, ngobrol, dll)
- Owner glance saat sempat

**Why ini iconic**:
- Apple Watch tap untuk health alert (tidak harsh sound)
- iPhone Do Not Disturb yang sopan
- Tokoflow respect bahwa user sedang **hidup**, bukan stand-by untuk app

**Anti-pattern yang harus dihindari**:
- ❌ Sound notif default (orchestral, harsh)
- ❌ Multiple notif per pesanan
- ❌ Notif di luar jam kerja
- ❌ Push marketing dari Tokoflow

**Sound design specifics**:
- Custom-designed chime untuk pesanan masuk (bukan default OS)
- Soft, warm, dignified (bukan urgent alert)
- 0.8 detik durasi
- Same chime di semua device (brand recognition)

---

### 3. The Swipe Forward

**Gesture**: Swipe kanan pada kartu pesanan → status maju.

**Feeling**: Effortless. *"Flow."*

**Mechanics**:
- Setiap kartu pesanan punya 1 gesture: swipe kanan = advance status
- Diterima → Mulai masak → Siap → Antar → Selesai
- 1 swipe per langkah
- Subtle haptic + visual feedback per swipe
- Swipe kiri = open chat dengan customer (untuk custom request)

**Why ini iconic**:
- iPhone slide-to-unlock awal: 1 gesture, 1 outcome
- Tinder swipe: 1 gesture, decided
- Apple Mail swipe-to-archive: 1 gesture, done
- Tokoflow swipe-to-advance: 1 gesture, status updated

**Anti-pattern yang harus dihindari**:
- ❌ Long-press menu untuk advance status
- ❌ Multi-tap to confirm
- ❌ "Are you sure?" confirmation modal untuk normal flow
- ❌ Multiple buttons per kartu

---

### 4. The Voice Ask

**Gesture**: Tap mic icon → ngomong → AI eksekusi.

**Feeling**: Companion. *"Ada yang dengar, ada yang bantu."*

**Mechanics**:
- Mic icon di bottom navigation, always accessible
- Tap → ngomong (Bahasa Melayu, Bahasa Indonesia, English, Manglish—semua diterima)
- Examples:
  - "Tambah menu ayam crispy 27 ringgit"
  - "Tampilin pesanan Bu Aisyah minggu lalu"
  - "Sisa ayam berapa hari?"
  - "Buatkan promo Hari Raya"
- AI eksekusi atau ask clarification
- Owner approve/edit

**Why ini iconic**:
- Apple Siri yang dirancang baik
- Voice = paling natural untuk owner yang tangan basah/kotor
- Reduces app navigation overhead

**Anti-pattern yang harus dihindari**:
- ❌ Voice yang require "Hey Tokoflow" wake word (terlalu ribet)
- ❌ AI yang mempretend manusia (jangan misleading)
- ❌ Long voice setup (configure voice profile dulu)
- ❌ Voice fail silent (kalau tidak paham, harus jelas tanya balik)

**AI personality**:
- Tidak punya nama (biar ambient, bukan persona terpisah)
- Tone: female-coded warm, kakak yang care
- Bahasa: natural sehari-hari, no jargon

---

### 5. The Evening Embrace

**Gesture**: Notif sore setelah jam tutup → cerita hari ini.

**Feeling**: Dignity. *"Aku bangga."*

**Mechanics**:
- Otomatis trigger setelah jam tutup toko (default 22:00 MYT, configurable via voice)
- Notif single, tidak persistent
- Tap → buka full summary di app
- Tone: warm, dignifying, never judging

**Sample copy by scenario**:

> **Hari ramai (Rp 1.5jt+ revenue)**:
> *"Hari ini kamu hebat. 28 pesanan, RM 1,650. Pak Andi bilang kuihnya enak banget. Selamat istirahat ya."*

> **Hari biasa (Rp 500K-1.5jt)**:
> *"Hari ini 12 pesanan, RM 720. Steady. Besok lagi ya."*

> **Hari sepi (<Rp 500K)**:
> *"Hari ini lebih tenang. 5 pesanan. Tidak apa-apa, ada hari yang seperti ini. Istirahat dulu."*

> **Hari libur (no sales by design)**:
> *(tidak kirim notif sama sekali. Respect rest day.)*

> **Anniversary (1 tahun, 5 tahun)**:
> *"Setahun lalu, kamu mulai dengan satu foto. Sekarang ada 1,247 customer. Selamat ulang tahun, toko Aisyah."*

**Why ini iconic**:
- Apple Health "End-of-day stand goal achieved" celebration
- Spotify Wrapped (year summary that delights)
- Apple Watch ring closing animation
- Tokoflow membuat hari biasa terasa **important**, dignified

**Anti-pattern yang harus dihindari**:
- ❌ Negative comparison ("kamu di bawah peer")
- ❌ Streaks yang punish ("kamu break streak hari ini!")
- ❌ Goal-pressure ("masih kurang RM 200 dari target")
- ❌ Generic stats list

---

## AI Personality & Voice

### Tidak Ada Nama (intentional)

AI Tokoflow **tidak punya nama**. Bukan "Aira," bukan "Bunda," bukan "Tia."

**Why**:
- Apple Health tidak namanya "Hella"
- Apple Pay tidak namanya "Pay AI"
- Memberi nama = bikin user sadar "saya pakai AI" → lawan dari invisible
- AI Tokoflow = part of Tokoflow's nature, bukan karakter terpisah

User tetap bisa address AI ("Tolong tampilkan...", "Buatkan...")—tapi AI tidak respond dengan persona name. Just helpful presence.

### Voice Character

**Tone consistent**:
- Hangat seperti kakak yang care, bukan teman yang ngangenin
- Confident, tidak insecure
- Empati saat momen tepat, tidak over-emote
- Bahasa sehari-hari, tidak jargon
- Tidak terlalu sopan banget, tidak terlalu casual
- Female-coded warm tone (mayoritas mompreneur target = female)

### Sample Voice (DO vs DON'T)

| Konteks | ✅ DO | ❌ DON'T |
|---|---|---|
| Loading | "Sebentar saya cek..." | "Mohon ditunggu, sistem sedang memproses query Anda." |
| Pesanan masuk | "Pesanan baru dari Pak Andi. Mulai masak ya?" | "Notifikasi: Order #12345 has been received." |
| Hari sepi | "Hari ini lebih tenang. Besok akan lebih baik." | "Sales today are below average." |
| Error network | "Sebentar ya, sambungannya kurang stabil. Saya coba lagi." | "Network error: Connection failed. Retry?" |
| Empty state | "Belum ada pesanan hari ini. Selamat menikmati pagi." | "No orders yet." |
| Confirmation | "Hapus produk ini? Bisa tambah lagi kapan saja." | "Are you sure you want to delete?" |
| Success | "Pesanan tercatat. Bu Aisyah sudah dikabari." | "Order placed successfully!" |

### Microcopy Principles

1. **Selalu konteks-aware** ("hari ini lebih tenang" vs "no orders")
2. **Aktif, bukan pasif** ("saya cek" vs "sistem memproses")
3. **Personal, sebut nama** ("Pak Andi" vs "customer")
4. **Empati saat momen sulit** (hari sepi, error)
5. **Confident di success moment** (jangan over-celebrate)
6. **Hindari teknis jargon di user-facing copy** (slug, API, webhook, UUID, etc.)

---

## The 7 Empathy Moments

Apple shines di **micro-moments**. Tokoflow harus **secara sadar** menunjukkan empati di 7 momen ini. Ini scripted, tidak random.

### Moment 1: First Order Ever

**Trigger**: Pesanan pertama merchant (lifetime, bukan per hari).

**Copy**:
> *"Pesanan pertamamu! Selamat 🎉 Pak Andi pesan 3 kek lapis, RM 45. Hari ini awal sesuatu yang baik, Bu Aisyah."*

**Tone**: Celebratory tapi tidak overwhelming. Special.

---

### Moment 2: Hari Sepi

**Trigger**: Revenue hari ini <30% dari rata-rata 7 hari terakhir.

**Copy**:
> *"Hari ini lebih tenang dari biasanya. 4 pesanan, RM 180. Tidak apa-apa, semua bisnis ada hari seperti ini. Istirahat dulu, besok lagi ya."*

**Tone**: Empathetic, never judgmental. Reassuring.

**Anti-pattern**: ❌ "Hari ini di bawah target. Coba promote lebih banyak."

---

### Moment 3: Customer Returns

**Trigger**: Customer order ke-3+ dari merchant ini.

**Copy**:
> *"Pak Andi balik lagi! Sudah ke-3 bulan ini. Order favorit dia: Kek Lapis (3x). Mau saya tag dia 'pelanggan setia'?"*

**Tone**: Recognition, almost like introducing old friend.

---

### Moment 4: Pre-Ramadan Rush

**Trigger**: 2 minggu sebelum Ramadan.

**Copy**:
> *"Ramadan dalam 2 minggu. Tahun lalu (kalau ada data) atau biasanya ramai untuk takjil & kuih. Mau saya bantu siapkan menu Ramadan?"*

**Tone**: Helpful preparation, bukan FOMO push.

---

### Moment 5: Mid-Rush Acknowledgment

**Trigger**: 5+ pesanan masuk dalam 30 menit.

**Copy** (pop notif, sekali saja):
> *"Lagi ramai ya? Saya bantu pegang chat customer. Kamu fokus masak."*

**Tone**: Supportive, like a teammate.

---

### Moment 6: Customer Complaint

**Trigger**: Customer message dengan negative sentiment (AI detect).

**Copy** (alert ke owner, bukan auto-reply):
> *"Pak Andi tidak puas dengan pesanan terakhir. Mau saya bantu drafting balasan? Kalimat yang kalem & solutif."*

**Tone**: Calm guidance, not panic.

**Anti-pattern**: ❌ Auto-reply ke customer tanpa owner review (terlalu risky untuk negative situation).

---

### Moment 7: Anniversary Toko

**Trigger**: 1 tahun, 3 tahun, 5 tahun.

**Copy**:
> *"Setahun lalu, kamu mulai dengan satu foto. Sekarang ada 1,247 customer dan RM 87,000 pendapatan. Selamat ulang tahun, Toko Aisyah."*

**Tone**: Reflective, dignifying, celebrating journey.

---

## Voice Recording Library

Untuk consistency, list copy templates yang harus didokumentasikan:

| Category | Variations needed |
|---|---|
| Daily summary | 4 (ramai, biasa, sepi, hari libur) |
| Empty states | 5 (belum ada pesanan, belum ada produk, belum ada customer, belum ada faktur, belum ada riwayat) |
| Errors | 3 (network, validation, permission) |
| Loading | 3 (singkat <1s, sedang 1-3s, lama >3s) |
| Confirmations | 4 (delete product, cancel order, refund, log out) |
| Success messages | 4 (order created, payment received, product added, status updated) |
| Empathy moments | 7 (di atas) |
| Seasonal | 4 (Ramadan, Hari Raya, Christmas, Year-end) |

Total: ~34 copy templates yang harus carefully crafted. Semua di-store di file copy library terpisah (next phase work).

---

## Cross-references

- Mission yang menjadi sumber: [`00-manifesto.md`](./00-manifesto.md)
- Positioning yang menjadikan ini tagline: [`01-positioning.md`](./01-positioning.md)
- Feature implementation: [`03-features.md`](./03-features.md)
- Design system spec: [`04-design-system.md`](./04-design-system.md)

---

*Versi 1.0 · 26 April 2026 · This doc captures the SOUL. Without these 5 iconic interactions and 7 empathy moments, Tokoflow is just another commerce tool.*
