# 08 — Perbandingan Provider

> Head-to-head comparison semua provider untuk payment detection.

## Payment Gateway (QRIS + Webhook)

| Provider | QRIS Fee | Settlement | Sub-merchant | Webhook | SDK Node.js | Catatan |
|---|---|---|---|---|---|---|
| **Xendit** | 0.7% | T+1 | Ya (xenPlatform) | Instant | Ya | **Best for marketplace model** |
| **Midtrans** | 0.7% | T+1 | Ya | Instant | Ya | GoTo/GoPay ecosystem |
| **DOKU** | 0.7% | T+1 | Ya | Instant | Ya | PJP Level 1, 5 lisensi |
| **Durianpay** | 0.7% | Real-time opt | Ya | Instant | Ya | PJP Cat 2, newer |
| **iPaymu** | 0.7% | H+2 atau H+0* | Ya | Instant | Ya | *H+0 = +1.8% fee |
| **OY! Indonesia** | 0.7% est | T+1 | Ya | Instant | Ya | Payment link, no-code |
| **Flip** | 0.7% | — | Ya | Instant | Ya | QRIS Direct API |

*Semua QRIS fee = 0.7% karena regulasi BI. Untuk usaha mikro: 0% (≤500K) atau 0.3% (>500K).*

## Mutation Monitoring

| Provider | Harga/bulan | Delay | Bank Support | Notifikasi | Perlu Credential |
|---|---|---|---|---|---|
| **Moota** | Rp 45-225K | ~15 min | 28 bank + GoPay/OVO | Webhook | Ya (iBanking) |
| **Mutasibank** | ~Rp 60K | Periodic | BCA, BRI, BNI, Mandiri + | Webhook + WA/SMS | Ya |
| **Mesinotomatis** | Varies | "Detik" (klaim) | 17 bank | Webhook + WA/Telegram | Ya |

## Open Banking

| Provider | Real-time | Pricing | Model | Verdict |
|---|---|---|---|---|
| **Brick** | Tidak (pull) | Enterprise | Consent-based | Tidak cocok |
| **Brankas** | Tidak (pull) | Enterprise | Licensed AInS | Tidak cocok |
| **Ayoconnect** | Tidak (pull) | Enterprise | Consent-based | Tidak cocok |

## DIY Options

| Approach | Cost | Delay | Reliability | Effort |
|---|---|---|---|---|
| **QRIS local gen** (qris-js) | Rp 0 | — | No notification | 2-3 hari |
| **Notification parsing** (Android) | Rp 0 | Real-time | Fragile | 3-5 hari |
| **Bank scraper** (open source) | Rp 0 | Polling | Fragile, risky | 3-5 hari |

## Scoring Matrix

| Criteria | Xendit | Moota | Notif Parse | QRIS Local |
|---|---|---|---|---|
| Real-time notification | 10 | 3 | 8 | 0 |
| Reliability | 10 | 6 | 3 | N/A |
| Cost for seller | 7* | 5 | 10 | 10 |
| Seller trust barrier | 7 | 3 | 5 | 10 |
| Integration effort | 7 | 8 | 4 | 9 |
| Scalability | 10 | 5 | 2 | 1 |
| **Total /50** | **51** | **30** | **32** | **30** |

*Xendit cost = 7 karena 0.7% fee, tapi 0% untuk mikro ≤500K.*

## Keputusan Berdasarkan Fase

### Fase 1: MVP (sekarang)
**QRIS Local Gen** — UX improvement tanpa backend complexity.
- Seller upload QRIS fisik → decode → generate dynamic per order.
- Customer scan, nominal exact, tampilan pro.
- Konfirmasi tetap manual tapi UX lebih baik.
- Effort: 2-3 hari. Cost: Rp 0.

### Fase 2: Auto-Confirmation (setelah validate demand)
**Xendit xenPlatform** — real payment solution.
- Seller onboard sebagai sub-account.
- QRIS di-generate via Xendit API.
- Auto-confirm via webhook.
- Effort: 4-6 hari. Cost: 0.7% (0% untuk mikro ≤500K).

### Fase 3: Hybrid (opsional)
**Xendit + Moota fallback** — untuk seller yang belum onboard Xendit.
- Default: Xendit QRIS (auto-confirm).
- Fallback: Moota mutation monitoring (15 min delay).
- Effort: +3-4 hari di atas Fase 2.
