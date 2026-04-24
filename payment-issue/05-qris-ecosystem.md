# 05 — QRIS Ecosystem & Regulasi

> Bagaimana QRIS bekerja di balik layar. Kenapa third-party SaaS tidak bisa "listen" ke QRIS bank seller.

## Arsitektur QRIS

```
Customer (Issuer Bank)
    │
    ▼
QRIS Switching (ASPI/RNPS)
    │
    ▼
Seller's Bank (Acquirer)
    │
    ▼
Seller (via SMS/app notif dari bank)
```

**Notifikasi HANYA mengalir ke acquirer bank → seller.** Tidak ada hook point untuk third-party.

## Jenis QRIS

### MPM Static (Merchant Presented Mode — Static)
- QRIS fisik yang ditempel di toko.
- **Tidak ada nominal** — customer input sendiri.
- Acquirer kirim SMS ke seller saat payment masuk.
- **Tidak ada API notification** ke third-party.

### MPM Dynamic
- QR di-generate per transaksi dengan nominal exact.
- Acquirer BISA kirim notification ke partner via SNAP API (contoh: BRI QRIS MPM Notification).
- **TAPI** hanya ke registered acquirer partner, bukan arbitrary third-party.

### CPM (Customer Presented Mode)
- Customer tunjukkan QR mereka ke POS merchant.
- Notification ke POS system merchant.
- Butuh hardware POS.

## SNAP Standard (Bank Indonesia)

- **National Open API Payment Standard** — standar API untuk semua bank di Indonesia.
- Mendefinisikan MPM notification endpoints.
- Akses **terbatas** ke licensed PSP (Penyedia Jasa Pembayaran) dan partner mereka.
- Bukan untuk SaaS umum.

## ASPI Developer Portal

- URL: `apidevportal.aspi-indonesia.or.id`
- Menyediakan SNAP API specs untuk MPM.
- Registrasi memerlukan **lisensi PJP** (Penyedia Jasa Pembayaran) dari Bank Indonesia.
- CatatOrder bukan PJP → tidak bisa akses langsung.

## Regulasi MDR (Bank Indonesia, efektif 15 Maret 2025)

| Kategori Merchant | ≤ Rp 500.000 | > Rp 500.000 |
|---|---|---|
| **Usaha Mikro** | **0%** | **0.3%** |
| Usaha Kecil | 0.7% | 0.7% |
| Usaha Menengah | 0.7% | 0.7% |
| Usaha Besar | 0.7% | 0.7% |
| Pendidikan | 0.6% | 0.6% |
| SPBU | 0.4% | 0.4% |

**Implikasi untuk CatatOrder**: Mayoritas seller CatatOrder kemungkinan usaha mikro. Jika pakai payment gateway, MDR untuk transaksi ≤ Rp 500K = **0%**. Ini bukan barrier.

## Klasifikasi Usaha

| Kategori | Omzet/tahun |
|---|---|
| Usaha Mikro | ≤ Rp 2 miliar |
| Usaha Kecil | Rp 2-15 miliar |
| Usaha Menengah | Rp 15-50 miliar |

Sebagian besar UMKM CatatOrder = mikro (omzet < Rp 2M/tahun).

## Kesimpulan

QRIS ecosystem di Indonesia **by design** tidak expose notification ke third-party. Satu-satunya jalan: jadi acquirer partner (butuh lisensi PJP) atau pakai payment gateway yang sudah jadi acquirer (Xendit, Midtrans, dll).

## Referensi

- Bank Indonesia QRIS MDR: https://www.bi.go.id/id/publikasi/ruang-media/cerita-bi/Pages/mdr-qris.aspx
- ASPI Developer Portal: https://apidevportal.aspi-indonesia.or.id
- BRI QRIS MPM Notification: https://developers.bri.co.id/en/docs/qris-merchant-presented-mode-mpm-dynamic-notification
