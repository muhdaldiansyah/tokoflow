# Implikasi untuk CatatOrder

## Posisi CatatOrder Saat Ini

CatatOrder sudah punya:
- Order management (siapa pesan apa, berapa, kapan)
- Customer database
- Order link `/r/{orderId}` yang bisa dibagikan ke customer
- "Sudah Bayar" button (customer claim payment)
- Manual payment recording (seller tandai lunas + nominal)
- Payment status derivation (paid/partial/unpaid)
- AI WhatsApp order parsing

CatatOrder BELUM punya:
- Koneksi ke data bank/mutasi
- Auto-matching payment → order
- Fraud detection (bukti transfer palsu)
- Payment link generation (QRIS/VA per order)

## Temuan Relevan (Hanya Fakta)

### 1. Masalah verifikasi manual MENINGKAT seiring volume

Threshold pain = ~20+ pesanan/hari. CatatOrder target user yang sudah jualan via WA dan butuh manajemen order — ini overlap dengan segmen yang mulai kesakitan dengan verifikasi manual.

### 2. Gap terbesar di market: order management + verifikasi pembayaran dalam satu flow

- Moota tahu uang masuk tapi tidak tahu order mana
- CatatOrder tahu order tapi tidak tahu uang masuk
- Tidak ada tool yang bridging keduanya untuk segmen WA commerce UMKM

### 3. Transfer bank (bukan QRIS) adalah metode digital dominan di WA commerce

Implikasi: solusi yang hanya fokus QRIS (termasuk Dynamic QRIS) miss mayoritas transaksi digital UMKM. Transfer bank > QRIS di segmen ini.

### 4. Tool cek mutasi 0,01% penetrasi — masalah mungkin bukan demand tapi delivery

Moota Rp45K/bulan, setup teknis, hanya cek mutasi tanpa order matching. CatatOrder sudah charge Rp15K-99K/bulan untuk order management. Verifikasi pembayaran bisa jadi value-add yang justify existing subscription — bukan fitur terpisah yang perlu dijual sendiri.

### 5. Fraud bukti transfer palsu naik 1.550%

Ini real pain yang makin parah. Seller yang bisa auto-verify tanpa rely screenshot = protected. Ini differentiator yang growing in value.

### 6. UMKM growing (20-100 order/hari) paling underserved

Terlalu besar untuk manual, terlalu kecil untuk payment gateway. CatatOrder sudah serving segmen ini untuk order management — payment verification adalah natural extension.

### 7. Data transaksi = aset strategis

CatatOrder yang mencatat order data sudah punya data bernilai serupa dengan yang bank pakai untuk credit scoring. Menambah payment verification data memperkuat aset ini tanpa harus jadi payment processor.

## Pertanyaan Terbuka yang Perlu Dijawab

Dari blind spots riset:

1. **Berapa waktu tepat yang dihabiskan user CatatOrder untuk verifikasi manual per hari?**
   → Bisa diukur: track waktu antara order masuk vs payment recorded

2. **Berapa conversion rate order → payment di CatatOrder?**
   → Data sudah ada di database (orders with payment_status = 'paid' vs total)

3. **Berapa banyak user CatatOrder yang sudah punya QRIS?**
   → Perlu survey langsung ke user

4. **Apakah masalah verifikasi masuk top 3 pain point user CatatOrder?**
   → Perlu user interview / in-app survey

5. **Overlap verifikasi + pencatatan: apakah ini satu masalah atau dua?**
   → CatatOrder sudah solve pencatatan. Apakah user yang pakai CatatOrder masih pain di verifikasi?

## Status

- [x] Reality capture complete (2026-03-27)
- [ ] Validate dengan data CatatOrder internal
- [ ] User interview untuk confirm pain ranking
- [ ] Technical exploration jika evidence kuat
