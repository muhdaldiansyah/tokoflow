# Cycle 014 — Ibu Sari (Bandung), reaksi jujur

Mompreneur, 35, kue catering + nasi padang, ~100 pesanan/bulan WhatsApp. Suami kerja kantor, 2 anak (6, 9), HP Xiaomi RM 1.200-an, DANA + GoPay tiap hari.

---

## 1. Tagline "Cerita aja."

Kena. Tapi setengah hati. "Cerita aja" di telinga Bandung **lebih ke arah "ngobrol santai"** — kayak temen bilang "udah, cerita aja ke gue". Itu hangat, ibu-ibu banget. Plus.

Tapi begitu aku tau versi MY-nya "Cerita je", langsung kerasa: oh, ini diturunin dari Melayu. **"Aja" di Bandung dipakai, tapi lebih natural-nya "ceritain aja" atau "ngomong aja"**. "Cerita aja" doang berasa agak puitis/iklan, bukan cara mompreneur ngomong sehari-hari. Bukan negatif, tapi **bukan vernacular asli**. Mirip iklan Indomie yang dibuat agency Singapur — kena, tapi gak 100% di rumah.

## 2. Demo #2 (Mbak Sari, 8 box nasi padang, transfer DANA)

Skenario realnya **75% bener, 25% berasa nulis dari luar**. Yang real:
- Tangan bau bumbu rendang, HP terkunci → YES tiap hari
- Transfer DANA udah masuk → YES, customer Bandung pake DANA banget
- "Mbak Sari ambil 8 box" → wait, **kalau aku Ibu Sari, customernya gak mungkin namanya Sari juga**. Itu confusing. Ganti nama customer (Mbak Rina, Bu Endah, Pak Asep).
- "Seratus enam puluh ribu" → realistic, tapi nasi padang Bandung 8 box biasanya **Rp 200rb-240rb** (Rp 25-30rb/box). Rp 20rb/box terlalu murah. Berasa angka diasal-asalin.
- "Bisa pesan kue lapis 5 loyang" → real banget. Sabtu malam catering arisan/pengajian, YES.

Verdict: skenarionya **bener arah**, tapi detail rasanya kayak orang Malaysia ngebayangin Bandung. Fix nama + harga, langsung 95%.

## 3. Sahabat-AI primary buat ID

Skeptis. **Aku gak peduli LLM apa di belakang** — yang aku peduli: kalau AI-nya bales/extract, ngomongnya kayak mompreneur Bandung atau kayak terjemahan robot Melayu? "Boleh tempah" itu Melayu. Bandung bilang **"bisa pesen"**. "Pukul 7 malam" oke, tapi lebih sering "**jam 7 malem**". Kalau Tokoflow keluarin draft WA pakai "boleh", "tempah", "kau" — langsung ketauan ini app MY yang dipaksain. Sahabat-AI bisa fix ini, **tapi cuma kalau prompt + dataset bener-bener Bandung/Jakarta vernacular, bukan formal BI Kompas**. Risk: medium-tinggi.

## 4. QRIS deeplink

**Ini killer feature kalau bener.** Customerku 70% bayar QRIS GoPay/DANA, 20% transfer manual, 10% cash. Kalau Tokoflow generate QRIS dari order langsung dan customer scan — itu **lebih cepat dari aku ngetik nomor rekening manual**. Masuk akal banget. Tapi pertanyaan: ini QRIS dinamis (per-transaksi nominal udah set) atau statis? Kalau dinamis, butuh PJP partner — itu ribet. Kalau statis pake QRIS GoPay/DANA aku sendiri, **gak butuh Tokoflow** sebenernya. Clarify dulu.

## 5. Voice diary 5-15 detik

**Cocok, gak kekanakan.** Anak rewel, tangan bumbu, jemput sekolah jam 11 — ngetik gak mungkin. Voice note 10 detik di WA udah jadi habit aku. Tap-to-talk sambil naro panci itu **persis ritme aku**. Yang takut aku: privacy. Suara aku direkam terus diolah AI di server — itu nge-creep. Harus ada **on-device transcription clear di onboarding** biar tenang.

## 6. Kompetitor di ID

Aku pake **Excel di HP + buku tulis fisik**. Kadang BukuKas/BukuWarung dulu, tapi uninstall karena ribet input form. **Mokapos? Itu buat warung pake kasir, bukan aku**. Olsera sama.

Tokoflow nawarin sesuatu BEDA: **input voice, bukan form**. Itu yang BukuKas/BukuWarung gagal. Kalau bener tinggal cerita doang, ini **kategori baru**, bukan voice version dari yang udah ada. Plus. Tapi awas — BukuKas pasti ngejar voice 6 bulan lagi.

## 7. Brand "Tokoflow" vs "CatatOrder"

Jujur? **"CatatOrder" lebih kena di kuping Indonesia.** "Catat" + "order" — langsung paham fungsinya. "Tokoflow" itu **English banget, agak corporate, gak inget**. Buat ID, pertahanin "CatatOrder". Buat MY pake "Tokoflow" gpp. **Jangan disatukan** — beda pasar, beda telinga, beda trust signal. Brand terpisah = strategi bener.

---

## Skor

- Want this NOW: **8/10**
- Trust dengan catatan keuangan: **6/10** (privacy + AI accuracy concern)
- 6 bulan masih pakai: **7/10** (kalau morning briefing gak nyebelin)
- Switch dari cara sekarang: **YA** (dari Excel + buku) — asal voice extraction akurat 90%+ minggu pertama

## Concerns severity ≥7

1. **Voice tone "diterjemahin dari Melayu"** — 8/10. Kalau draft WA keluar "boleh tempah" sekali aja, customer aku langsung mikir "kok kak Sari aneh ngomongnya". Bisa rusak kepercayaan customer ke aku, bukan ke Tokoflow.
2. **Privacy suara di-server** — 8/10. On-device STT harus visible di onboarding, bukan kubur di T&C.
3. **Harga di demo gak realistis** — 7/10. Detail kayak Rp 20rb/box nasi padang langsung bikin "ini orang gak tau pasar Bandung". Hilangin trust di first impression landing page.
4. **QRIS deeplink unclear (dinamis/statis)** — 7/10. Kalau ternyata cuma redirect ke QRIS GoPay aku sendiri, value-add zero. Kalau dinamis, butuh kerja sama PJP — itu launch blocker ID.
5. **Brand "Tokoflow" buat ID** — 7/10. Bukan deal-breaker, tapi nahan growth. CatatOrder lebih trustable di telinga Indonesia.

— Sari
