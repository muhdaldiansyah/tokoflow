# 04 — Bank-Specific APIs

> API resmi dari bank-bank Indonesia. Bisa baca mutasi tapi pull-based dan perlu business partnership.

## BCA API (developer.bca.co.id)

| Aspek | Detail |
|---|---|
| Endpoint | Bank Statement (mutasi), Balance Inquiry, Transaction Status |
| Mutation data | Newest-to-oldest, max 9.000 per request |
| Real-time webhook | **TIDAK** — pull-based |
| Push notification | "Customer Fund Account Notification" ada tapi untuk perusahaan sekuritas |
| Akses | Perlu **KlikBCA Bisnis** (corporate banking). Personal account TIDAK bisa. |
| Requirement | Business partnership dengan BCA |
| Reference | https://developer.bca.co.id |

## BRI API (developers.bri.co.id)

| Aspek | Detail |
|---|---|
| Endpoint | Account Statement, Account Information |
| **QRIS MPM Dynamic Notification** | BRI kirim POST callback saat QRIS Dynamic payment success |
| Webhook endpoint | `/v1.0/qr-dynamic/qr-mpm-notify` |
| Auth | OAuth 2.0 + digital signature |
| **TAPI**: | Hanya jika BRI = acquirer DAN kamu registered BRI API partner |
| Untuk arbitrary seller QRIS | **TIDAK BISA** intercept notification |
| Reference | https://developers.bri.co.id |

**BRI QRIS MPM Dynamic Notification** adalah satu-satunya bank API yang punya push notification untuk QRIS. Tapi hanya berguna jika CatatOrder jadi BRI QRIS acquirer partner — tidak realistis untuk SaaS kecil.

## Bank Mandiri API (developer.bankmandiri.co.id)

| Aspek | Detail |
|---|---|
| Endpoint | Balance, transaction status, transaction history |
| SNAP compliant | Ya |
| Real-time | **TIDAK** — pull-based |
| Reference | https://www.bankmandiri.co.id/en/mandiri-api |

## BNI API

| Aspek | Detail |
|---|---|
| Endpoint | 280+ APIs: SNAP, Virtual Account, Disbursement, Cash Management |
| Account statement | Pull-based |
| Reference | BNI API Portal |

## Bank Jago, SeaBank, Blu by BCA Digital

| Bank | Status API |
|---|---|
| Bank Jago | Kolaborasi GoPay. Open banking capability ada. Developer docs terbatas. |
| SeaBank | Mungkin accessible via open banking aggregator. Tidak ada public API. |
| Blu by BCA Digital | Under BCA API ecosystem. Tidak ada portal terpisah. |

## Kesimpulan

Bank APIs di Indonesia:
- **Pull-based** semua (kecuali BRI QRIS notification yang sangat spesifik)
- **Perlu business partnership** formal
- **Corporate banking** required (bukan personal)
- **Integrasi terpisah per bank** — tidak scalable

**Tidak viable** sebagai solusi payment detection untuk CatatOrder pada skala saat ini.
