# Landscape Solusi yang Ada

## Peta Solusi Verifikasi Pembayaran untuk UMKM

### 1. Cek Mutasi Manual (Mobile Banking)

**Apa:** Seller buka app bank, scroll mutasi, cocokkan sendiri.
**Penetrasi:** ~100% UMKM yang terima transfer (default behavior)
**Biaya:** Rp0
**Kelebihan:** Gratis, familiar, sudah jalan
**Kekurangan:** Repetitif, time-consuming, rawan human error, tidak scalable >20 order/hari

### 2. Tool Cek Mutasi Otomatis (Moota, Mutasibank, Durianpay)

**Apa:** Scraping/API koneksi ke rekening bank, notifikasi otomatis kalau ada uang masuk, matching dengan nominal.
**Penetrasi:** ~7.000 user (Moota) dari 66 juta UMKM = **0,01%**
**Biaya:** ~Rp45.000-100.000/bulan per akun bank
**Kelebihan:** Auto-detect mutasi, notifikasi real-time
**Kekurangan:**
- Hanya solve DETEKSI mutasi — tidak solve MATCHING dengan order
- Perlu setup teknis (API key, koneksi bank)
- Tidak semua bank didukung
- Terlalu teknis untuk UMKM mikro dengan literasi digital rendah
- 40% UMKM tanpa akses pelatihan digital

**Kenapa penetrasi rendah?** Kemungkinan kombinasi dari:
- UMKM mikro tidak mau bayar Rp45K/bulan untuk solve masalah yang "masih bisa dihandel manual"
- Setup terlalu teknis
- Awareness rendah
- Pain belum cukup besar di volume <20 order/hari

### 3. Payment Gateway (Midtrans, Xendit, DOKU)

**Apa:** Full payment processing — payment link, checkout page, webhook, auto-reconciliation.
**Penetrasi:** Ratusan ribu merchant (mostly online/e-commerce, bukan UMKM mikro offline)
**Biaya:** Per transaksi (VA Rp4-5K, QRIS 0,7%, e-wallet 1,5-2,5%)
**Kelebihan:** Full automation, webhook confirmation, multi-method
**Kekurangan:**
- Terlalu kompleks untuk UMKM mikro
- Memerlukan integrasi teknis (API, webhook endpoint)
- Fee per transaksi membebani margin tipis UMKM mikro
- Designed untuk online commerce, bukan WA commerce
- UMKM mikro offline tidak butuh dan tidak bisa pakai

### 4. Marketplace Escrow (Shopee, Tokopedia, GoFood)

**Apa:** Platform hold dana, settlement setelah konfirmasi.
**Penetrasi:** Jutaan merchant (tapi hanya untuk transaksi DI DALAM marketplace)
**Biaya:** Commission 5-22% (GoFood hingga 22,2%)
**Kelebihan:** Zero fraud risk untuk seller, auto-reconciliation
**Kekurangan:**
- Extraction fee tinggi
- Hanya untuk transaksi dalam platform
- Customer milik marketplace, bukan milik UMKM
- Tidak solve transaksi WA/offline

### 5. QRIS Dynamic via Bank/PSP API

**Apa:** Generate QRIS unik per transaksi dengan amount embedded, auto-reconciliation via callback.
**Penetrasi:** Enterprise/large merchant
**Biaya:** MDR 0,7% + setup fee
**Kelebihan:** Per-transaction tracking, auto-confirm
**Kekurangan:**
- Butuh integrasi API (sama seperti payment gateway)
- Hanya untuk pembayaran QRIS (bukan transfer bank)
- UMKM mikro tidak bisa setup sendiri

### 6. BukuWarung / Moka / GoBiz (POS + Pencatatan)

**Apa:** Point of sale + pencatatan yang include fitur pembayaran.
**Penetrasi:** Ratusan ribu UMKM (mostly F&B/retail perkotaan)
**Biaya:** Free (basic) + hardware
**Kelebihan:** Integrated POS + payment
**Kekurangan:**
- Fokus transaksi fisik di tempat (dine-in, walk-in), bukan WA commerce
- Tidak solve verifikasi transfer bank (yang dominan di WA commerce)
- Monetisasi via data/lending, bukan payment

## Gap Map: Apa yang Belum Di-Solve

```
Masalah                           | Solusi yang ada        | Status
----------------------------------|------------------------|--------
Customer bayar via transfer bank  | Mobile banking manual  | SOLVED (tapi manual)
Deteksi uang masuk otomatis       | Moota (0.01%)          | SOLVED tapi 0.01% adoption
Matching mutasi dengan ORDER      | TIDAK ADA              | GAP
Fraud bukti transfer palsu        | Cek mutasi manual      | PARTIAL (human judgment)
Rekonsiliasi akhir hari           | TIDAK ADA (utk WA comm)| GAP
Payment + order dalam 1 flow      | Marketplace (22% fee)  | SOLVED tapi extraction
Payment + order tanpa extraction  | TIDAK ADA              | GAP
```

## Temuan Kunci

**Gap terbesar:** Tidak ada tool yang menggabungkan **order management** + **verifikasi pembayaran** dalam satu flow sederhana untuk UMKM yang jualan via WA.

- Moota solve deteksi mutasi tapi tidak tahu order mana yang dibayar
- CatatOrder solve order management tapi tidak tahu payment mana yang masuk
- Payment gateway solve keduanya tapi terlalu kompleks + mahal untuk UMKM mikro

Segmen yang paling underserved: **UMKM growing (20-100 order/hari)** yang jualan via WA. Mereka sudah digital (meninggalkan pure-cash) tapi belum punya tools automasi.

## Sumber

- Moota.co pricing dan user count (T5)
- Midtrans/Xendit public pricing (T3)
- MicroSave QRIS study 2022 (T2)
- BPS e-commerce statistics 2024 (T1)
