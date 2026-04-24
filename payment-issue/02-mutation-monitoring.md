# 02 — Mutation Monitoring (Moota, Mutasibank, Mesinotomatis)

> Layanan yang login ke iBanking seller secara berkala, baca mutasi baru, kirim webhook ke CatatOrder. Seller tetap pakai QRIS/rekening bank mereka sendiri.

## Cara Kerja

```
Seller daftar → kasih credential iBanking ke Moota
  → Moota login otomatis tiap ~15 menit
  → Baca mutasi kredit baru
  → Kirim webhook POST ke CatatOrder
  → CatatOrder match amount + deskripsi dengan pending order
  → Auto-confirm jika match
```

## Moota.co (Market Leader)

### Pricing (efektif Feb 2026)

| Plan | Bank | Harga/bulan |
|---|---|---|
| BCA Personal | BCA | Rp 100.000 |
| Mandiri Bisnis | Mandiri | Rp 150.000 |
| BCA SNAP | BCA (API resmi) | Rp 225.000 |
| Per-hari (lama) | Various | ~Rp 1.500/hari (~Rp 45.000/bln) |

### Bank yang Didukung (28 total)

BCA, BCA Syariah, BNI, BRI, Mandiri, Mandiri Bisnis/CMS, BSI, Muamalat, Maybank, Mega Syariah CMS, **GoPay, OVO**.

**TIDAK support**: Bank Jago, SeaBank, Blu by BCA Digital, DANA, ShopeePay.

### Webhook

```
POST /webhook/moota (CatatOrder endpoint)

{
  "id": "mutation-uuid",
  "bank_id": "bca-xxx",
  "account_number": "1234567890",
  "amount": 150000,
  "description": "TRANSFER DARI ...",
  "type": "CR",
  "created_at": "2026-03-27T10:15:00Z"
}
```

Header berisi secret token untuk verifikasi.

### Fitur Webhook (Update Feb 2025)

- Filter per akun bank
- Filter range nominal
- Secret token verification
- Retry mechanism
- Webhook log untuk debugging

### Integrasi

- REST API v2
- PHP/Laravel SDK official
- WooCommerce plugin (reference implementation)
- Docs: https://moota.gitbook.io/technical-docs

### Limitasi

1. **15 menit delay minimum** — bukan real-time.
2. **Perlu credential iBanking** — trust barrier tinggi. Seller harus percaya Moota.
3. **iBanking only** — banyak UMKM cuma pakai mBanking (app HP). iBanking kadang harus diaktifkan terpisah.
4. **Bank bisa block** — automated login terdeteksi → akun di-lock sementara.
5. **Matching bisa ambigu** — kalau 2 order nominal sama masuk berdekatan, matching bisa salah.

## Mutasibank.co.id (Alternative)

| Aspek | Detail |
|---|---|
| Harga | Mulai Rp 2.000/hari per akun |
| Bank | BCA, BRI, BNI, Mandiri + lainnya |
| Notifikasi | SMS, Email, WhatsApp, Telegram, **Webhook** |
| Delay | Periodic polling |

## Mesinotomatis.com (Alternative)

| Aspek | Detail |
|---|---|
| Harga | Deposit-based. WhatsApp gateway mulai Rp 5.900/hari. Bank gateway: hubungi. |
| Bank | 17 bank termasuk BCA, Mandiri, BRI, BNI, BSI, Permata, BTN, Danamon, dll. |
| Notifikasi | Webhook, Email, Telegram, WhatsApp |
| Klaim | Deteksi "dalam hitungan detik" — kemungkinan polling lebih cepat dari Moota |
| Trial | 7 hari gratis |
| Custom | Integrasi bank baru dalam 3 hari |

## Kapan Pakai Mutation Monitoring

- **Bootstrapping phase**: Seller belum mau onboard ke payment gateway.
- **Volume rendah**: Belum worth it bayar 0.7% per transaksi.
- **Seller sudah punya QRIS bank**: Tidak mau ganti ke QRIS baru.

## Kapan TIDAK Pakai

- **Volume tinggi**: 0.7% per transaksi lebih murah dari Rp 45-100K/bulan jika transaksi > ~Rp 6.5-14 juta/bulan.
- **Butuh real-time**: 15 menit delay tidak acceptable.
- **Seller pakai Bank Jago/SeaBank**: Tidak didukung.

## Effort Estimate

| Task | Waktu |
|---|---|
| Setup Moota account + API key | 0.5 hari |
| Webhook handler di CatatOrder | 0.5 hari |
| Matching logic (amount + order) | 1 hari |
| Seller onboarding flow (input iBanking credential) | 1 hari |
| Testing | 0.5 hari |
| **Total** | **3-4 hari** |

## Referensi

- Moota: https://moota.co/
- Moota pricing: https://moota.co/harga/
- Moota API: https://moota.gitbook.io/technical-docs
- Moota webhook: https://moota.co/kb/panduan-penggunaan-webhook-di-moota/
- Mutasibank: https://mutasibank.co.id/
- Mesinotomatis: https://mesinotomatis.com/bank-gateway-cek-mutasi-bank/
