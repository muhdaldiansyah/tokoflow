# 01 — Payment Gateway QRIS (RECOMMENDED)

> Generate QRIS sendiri via payment gateway. Dapat instant webhook saat pembayaran masuk. Seller tidak perlu konfirmasi manual.

## Flow

```
Order dibuat di CatatOrder
  → CatatOrder call Xendit API: create QRIS dengan amount exact
  → Customer buka /r/{orderId}, QRIS muncul
  → Customer scan dengan GoPay/OVO/DANA/BCA Mobile/dll
  → Xendit kirim webhook POST ke CatatOrder (INSTANT)
  → CatatOrder auto-update status: "Lunas"
  → Seller terima notifikasi: "Pesanan #123 sudah dibayar"
  → Uang masuk ke saldo Xendit seller, withdraw ke bank T+1
```

**Yang berubah vs flow sekarang**: Seluruh step konfirmasi manual HILANG. Ini bukan UX polish — ini architectural change.

## Xendit xenPlatform (Primary Choice)

### Kenapa Xendit

1. **xenPlatform** = model marketplace/platform. CatatOrder = Master Account, setiap seller = Managed sub-account.
2. **for-user-id header**: Satu API call, QRIS dibuat atas nama seller. Payment notification tetap ke CatatOrder.
3. **Split Rules**: CatatOrder bisa ambil platform fee otomatis dari setiap transaksi.
4. **Settlement langsung ke seller**: Uang masuk ke sub-account seller, bukan ke CatatOrder dulu.

### Pricing

| Item | Biaya |
|---|---|
| Setup fee | Rp 0 |
| Monthly fee | Rp 0 |
| QRIS MDR | 0.7% (regulasi BI) |
| QRIS MDR (usaha mikro, ≤Rp 500K) | **0%** |
| QRIS MDR (usaha mikro, >Rp 500K) | **0.3%** |
| Platform fee CatatOrder | Customizable via Split Rules |

### Integrasi

```
POST /payment_requests
Headers:
  Authorization: Basic {api_key}
  for-user-id: {seller_sub_account_id}

Body:
{
  "reference_id": "order-123",
  "amount": 150000,
  "currency": "IDR",
  "payment_method": {
    "type": "QR_CODE",
    "qr_code": {
      "channel_code": "QRIS"
    },
    "reusable": false
  }
}
```

Response berisi `qr_string` → render sebagai QR code di order page.

### Webhook

```
POST /webhook/xendit (CatatOrder endpoint)

{
  "event": "payment.succeeded",
  "data": {
    "reference_id": "order-123",
    "amount": 150000,
    "payment_method": { "type": "QR_CODE" },
    "status": "SUCCEEDED"
  }
}
```

CatatOrder verifikasi webhook token → update order status → notify seller.

### Onboarding Seller

1. Seller daftar di CatatOrder (sudah ada).
2. CatatOrder create Xendit sub-account via API (perlu KTP seller).
3. KYC review 3-5 hari kerja.
4. Setelah approved, QRIS bisa di-generate untuk setiap order.

### SDK

- Node.js: `npm install xendit-node`
- PHP: `composer require xendit/xendit-php`
- Python: `pip install xendit-python`
- REST API: https://docs.xendit.co

## Midtrans (Alternative)

### Kenapa Midtrans Sebagai Backup

- Owned by GoTo (GoPay). Kalau seller sudah punya GoPay merchant, auto-link.
- 0.7% QRIS fee. Sama dengan Xendit.
- HTTP notification (webhook) dengan signature verification (SHA-512).
- Sub-merchant capability ada tapi kurang terdokumentasi dibanding Xendit xenPlatform.

### Integrasi QRIS Midtrans

```
POST /v2/charge
Headers:
  Authorization: Basic {server_key}
  Content-Type: application/json

Body:
{
  "payment_type": "qris",
  "transaction_details": {
    "order_id": "order-123",
    "gross_amount": 150000
  },
  "qris": {
    "acquirer": "gopay"
  }
}
```

Response berisi `actions[].url` → QR code image URL.

### SDK Midtrans

- Node.js: `npm install midtrans-client`
- Go: `github.com/midtrans/midtrans-go`
- PHP: `composer require midtrans/midtrans-php`
- Docs: https://docs.midtrans.com

## Provider Lain yang Support QRIS + Webhook

| Provider | QRIS Fee | Sub-merchant | Catatan |
|---|---|---|---|
| **DOKU** | 0.7% | Ya | PJP Level 1, 5 lisensi. Enterprise-focused. |
| **Durianpay** | 0.7% | Ya | PJP Category 2. Real-time settlement available. |
| **iPaymu** | 0.7% | Ya | H+0 settlement (0.7%+1.8%) atau H+2 (0.7%). |
| **OY! Indonesia** | 0.7% | Ya | Payment link + QRIS, no-code option. |
| **Flip** | 0.7% | Ya | QRIS Direct API. |

## Effort Estimate

| Task | Waktu |
|---|---|
| Setup Xendit account + xenPlatform | 1 hari |
| API integration (create QRIS, handle webhook) | 1-2 hari |
| UI: render QR di order page | 0.5 hari |
| Seller onboarding flow (KTP upload → sub-account) | 1-2 hari |
| Testing + edge cases | 1 hari |
| **Total** | **4-6 hari** |

## Limitasi

1. **Seller perlu onboarding baru** — upload KTP, tunggu KYC 3-5 hari.
2. **Seller dapat QRIS baru** — bukan QRIS bank mereka. Perlu edukasi.
3. **Settlement T+1** — uang masuk ke rekening bank seller sehari setelah transaksi.
4. **Xendit withdrawal fee** — cek pricing terbaru untuk biaya penarikan saldo.

## Referensi

- Xendit QRIS: https://www.xendit.co/en/payment-channel/qris/
- Xendit xenPlatform: https://docs.xendit.co/docs/xenplatform-overview
- Xendit sub-account: https://docs.xendit.co/docs/accepting-payments-for-sub-accounts
- Xendit Split Rules: https://docs.xendit.co/docs/split-payments
- Xendit Pricing: https://www.xendit.co/en-id/pricing/
- Midtrans QRIS: https://docs.midtrans.com/reference/mpm-api-qris
- Midtrans Webhook: https://docs.midtrans.com/docs/https-notification-webhooks
- Midtrans Pricing: https://midtrans.com/pricing
