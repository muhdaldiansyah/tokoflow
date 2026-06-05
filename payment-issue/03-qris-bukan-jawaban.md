# Kenapa QRIS Saja Bukan Jawaban

## Narasi BI vs Realitas Lapangan

### Narasi BI (optimis)
- 42,75 juta merchant QRIS
- Growth 140-175% YoY
- "93% merchant UMKM"
- Target cashless society

### Realitas lapangan
- BI TIDAK pernah publish data merchant AKTIF vs dormant
- MicroSave (2022): mayoritas merchant QRIS dormant, 68% UMKM tidak pakai digital payment
- Penetrasi efektif (aktif) estimasi hanya 10-18% dari total UMKM
- "93% merchant QRIS adalah UMKM" ≠ "93% UMKM punya QRIS" (sering salah interpret di media)

## 5 Alasan QRIS Tidak Cukup untuk Masalah Verifikasi

### 1. Penetrasi masih rendah di UMKM mikro

- ~35% UMKM mikro terdaftar QRIS, tapi berapa yang aktif = unknown
- 42 juta UMKM mikro (64%) BELUM punya QRIS sama sekali
- Bahkan yang punya QRIS masih terima mayoritas pembayaran via cash dan transfer

### 2. Static QRIS rawan masalah

Mayoritas UMKM mikro pakai Static QRIS (stiker). Masalahnya:
- Customer input nominal sendiri — rawan salah ketik
- Seller TETAP harus cek apakah nominal benar — verifikasi manual masih ada
- Screenshot pembayaran QRIS juga bisa dipalsukan
- Modus: tempel QRIS penipu di atas QRIS merchant asli

### 3. Settlement delay

- Standard: H+1 hari kerja
- BCA baru mulai multi-settlement 5x/hari (Juni 2025) — hanya BCA
- Bank kecil/BPD: bisa 1-5 hari kerja
- Cash = langsung di tangan. Untuk UMKM mikro dengan cash flow harian tipis, H+1 itu real cost.

### 4. QRIS tidak solve rekonsiliasi

QRIS memudahkan pembayaran, tapi seller TETAP harus:
- Cocokkan transaksi QRIS dengan order yang mana
- Track mana yang sudah bayar, mana yang belum
- Rekonsiliasi di akhir hari

Kalau pakai QRIS statis (bukan dynamic via payment gateway), seller tidak punya API/webhook — tetap cek manual di app bank.

### 5. MDR 0% menciptakan perverse incentive

MDR 0% untuk usaha mikro (transaksi ≤Rp500.000) ditanggung industri — bukan subsidi APBN. Implikasi:
- Bank/PJSP menanggung biaya serving merchant mikro tanpa revenue langsung
- Motivasi utama bank: data harvest + lending channel (KUR), bukan payment
- Jika kebijakan berubah (MDR kembali >0%), adopsi bisa turun

## Apa yang QRIS Sebenarnya Solve

QRIS solve **penerimaan pembayaran digital tanpa payment gateway**. Itu saja. Ini valuable (UMKM tidak perlu share nomor rekening), tapi tidak solve:
- Verifikasi otomatis
- Rekonsiliasi order-payment
- Fraud protection
- Cash flow management

## Data Kunci

| Metrik | Nilai | Sumber |
|--------|-------|--------|
| Merchant QRIS terdaftar | 42,75 juta (2025) | BI (T1) |
| Merchant QRIS UMKM | 93% dari total | BI (T1) |
| Merchant QRIS aktif | TIDAK DIPUBLIKASI | - |
| Penetrasi usaha mikro | ~35% terdaftar | Inferensi dari BI |
| Rata-rata txn/merchant/bulan | 35 transaksi | Databoks (T3) |
| Rata-rata nilai/merchant/bulan | Rp3,1 juta | Databoks (T3) |
| MDR usaha mikro (≤Rp500rb) | 0% (sejak Des 2024) | BI (T1) |
| MDR UKE/UME/UBE | 0,3-0,7% | BI (T1) |
| Settlement standar | H+1 hari kerja | Bank (T1) |

## Sumber

- Bank Indonesia QRIS statistics & regulations (T1)
- MicroSave Consulting "State of QRIS" 2022 (T2)
- Databoks/Katadata QRIS per-merchant analysis (T3)
