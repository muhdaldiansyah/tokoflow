# Cycle 022 — Critique Ibu Sari (Bandung, kue + nasi padang catering, 100 pesanan/bln)

Mental simulation. HP Xiaomi Redmi Note 11, MIUI 13. Dua anak (3 thn + 8 bln).

## 1. Lock-screen claim-card "Lina Rp 240k QRIS — CLAIM"

Natural banget. Tiap hari saya buka HP udah penuh notif DANA, GoPay, BCA mobile sambil aduk rendang. **Tapi**: di MIUI lock-screen biasanya cuma muncul preview 1 baris, bukan card aksi. Kalau CLAIM-nya cuma teks tanpa tombol jelas, saya skip. Tombol harus gemuk, jempol basah santan masih bisa tap.

## 2. Mic FAB bottom-center

**Kanan bawah lebih enak.** Tangan kanan pegang HP (kiri gendong Aira). Bottom-center maksa jempol stretch ke tengah — pegel kalau HP 6.6 inch. Kanan-bawah 1cm dari pojok = ibu jari mendarat tanpa mikir.

## 3. Sections "Hari ini / Kemarin / Minggu ini / Bulan ini"

3 section cukup: **Hari ini / Kemarin / Lebih lama**. "Minggu ini" + "Bulan ini" overlap di kepala saya — kalau hari Rabu, "minggu ini" itu termasuk Senin? Bingung. Catering saya horizon-nya 7 hari (preorder Sabtu, kue tunangan minggu depan). Selebihnya gak relevan tiap hari.

## 4. Now → tap → scroll ke source voice note

Jujur, **gak langsung paham**. Mental model saya: Now = "yang harus diurus", Diary = "catatan masa lalu". Kalau di-tap malah scroll ke bawah ke voice note lama, saya kira app-nya nge-bug. Solusi: kasih animasi "kartu turun ke posisinya" + sub-text kecil "dari rekaman jam 09:30". Sekali liat, paham. Tanpa itu — `/pending` terpisah lebih intuitif tapi melanggar prinsip kalian.

## 5. MIUI lock-screen widget

**Bakal masalah.** MIUI default kill background app brutal — Security app auto-restrict, lock-screen notif sering ke-suppress kalau battery saver on. User harus manual: Settings → Apps → CatatOrder → Autostart ON + Battery saver "No restrictions" + Lock screen notif "Show". Onboarding wajib walkthrough screenshot MIUI khusus. Tanpa itu, claim-card hilang setelah HP standby 30 menit.

## 6. Anti-anxiety vs gamifikasi ID

**Justru lega.** Shopee koin bikin saya stress checkout cuma buat streak. Saya pakai app order = mau beres, bukan main game. "Kurang fun" itu framing developer; ibu rumah tangga umur 34 sama 2 anak = fun = anak tidur tepat waktu. Hilangkan badge, saya makin sayang.

## 7. Concern ID-context ≥7

- **Bahasa**: "Cerita aja" terlalu Malaysia. Bandung casual = "Cerita weh" / "Catet aja" / "Ngomong aja". Sunda-Indo mix.
- **Multi-anak**: voice note suka ke-record nangis bayi. STT harus filter background noise atau confidence drop → minta ulang dengan halus.
- **Nomor HP**: customer Bandung sering kasih "0822..." tanpa +62. Parser harus normalize.
- **Harga**: "dua ratus empat puluh rebu" vs "240" vs "240k" — tiga-tiganya harus ke-handle.

## Skor

- UX cocok hari saya: **8/10**
- Multi-tasking: **7/10** (FAB posisi + MIUI quirk -2)
- Diary mental model: **6/10** (tap-to-scroll bingung tanpa hint visual)
- Mau pakai sehari-hari: **8/10** (kalau MIUI onboarding solid)
