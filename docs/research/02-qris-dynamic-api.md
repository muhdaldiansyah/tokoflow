# QRIS Dynamic API Research

> Static vs dynamic QRIS, API providers, auto-confirmation, fees, and hybrid approaches

---

## 1. Static vs Dynamic QRIS

| | Static QRIS | Dynamic QRIS |
|---|---|---|
| **Amount** | Customer enters manually | Pre-filled (embedded in QR) |
| **Expiry** | Never expires | 15-30 min typically |
| **Auto-confirm** | No — manual verification | Yes — webhook notification |
| **Uniqueness** | One QR for all transactions | Unique per transaction |
| **Security** | Lower (reusable, duplicatable) | Higher (single-use) |
| **Cost** | Free (just print) | Gateway fees (0.63-0.7%) |
| **Best for** | Low-volume, street stalls | Online commerce, platforms |

**Key insight:** Dynamic QRIS enables auto-confirmation because the system knows exactly which order the payment corresponds to. Static QRIS has no system-level linkage between QR code and a specific order.

---

## 2. QRIS API Providers

### Xendit
- **Endpoint:** `POST /payment_requests` (new API) or `POST /qr_codes` (legacy)
- **Fee:** 0.63% per transaction (VAT inclusive)
- **Expiry:** 48 hours default (configurable via `expires_at`)
- **Webhook:** `payment_request.succeeded` / `payment_request.expired`
- **XenPlatform:** Supports generating QRIS on behalf of sub-merchants
- [Docs](https://docs.xendit.co/docs/qris)

### Midtrans (already in use)
- **Endpoint:** `POST /v2/charge` with `payment_type: "qris"`
- **Fee:** 0.7% per transaction (VAT inclusive)
- **Expiry:** 15 min default (configurable: 20s to 7 days)
- **Webhook:** HTTP POST on `transaction_status` changes (settlement/expire/cancel)
- **Signature:** SHA-512 of `order_id + status_code + gross_amount + ServerKey`
- [Docs](https://docs.midtrans.com/reference/qris)

### DOKU
- **Endpoint:** Direct API (SNAP) for dynamic QRIS
- **Webhook:** Configurable notification URL
- **Signature:** HMAC_SHA512
- [Docs](https://developers.doku.com/accept-payments/direct-api/snap/integration-guide/qris)

### InterActive QRIS (qris.id)
- **Endpoint:** Create Invoice → returns `qris_content` + `qris_invoiceid`
- **Confirmation:** Polling-based only (NOT webhook) — poll every 60s, max 30 times
- **Expiry:** 30 minutes
- **Limitation:** Rapid polling prohibited — risks API key blocking
- [Docs](https://qris.id/api-doc/)

### BRI API
- **Endpoint:** `Generate QR` with `partnerReferenceNo`, `amount`, `merchantId`
- **Webhook:** Notify Payment callback
- **Signature:** HMAC_SHA512
- [Docs](https://developers.bri.co.id/en/docs/qris-merchant-presented-mode-mpm-dynamic)

### Others
- **OY! Indonesia** — Payment Link with QRIS option ([docs](https://api-docs.oyindonesia.com/))
- **Flip** — Direct API QRIS ([docs](https://docs.flip.id/docs/accept-payment/direct-api/qris-integration/))
- **NICEPay** — QRIS API v2 ([docs](https://docs.nicepay.co.id/nicepay-api-v2-registration-api-qris))

---

## 3. Payment Notification Mechanisms

### Webhook (push) — Most Common
- Xendit, Midtrans, DOKU, BRI all POST to your server on payment status change
- Midtrans: `"payment_type": "qris"` in webhook body
- Events: `settlement` (paid), `expire`, `cancel`
- Signature verification prevents spoofing

### Polling (pull) — InterActive QRIS Only
- Call Check Invoice API with `invoice_id`
- Poll every 60s, max 30 attempts (30 min)
- Rapid polling = API key suspension

**For CatatOrder:** Midtrans Core API QRIS would give webhook-based confirmation, identical to existing billing webhook at `/api/billing/webhook`.

---

## 4. QRIS for Multi-Merchant

### Model A: Platform Collects → Settles to Seller
- Single QRIS integration under platform's merchant account
- Disburse to sellers via payout API
- **Providers:** Xendit XenPlatform (split), Midtrans Iris
- **Pros:** Full control, single integration
- **Cons:** Needs PJP partnership or licensed provider; holding funds

### Model B: Payment Directly to Seller
- Each seller has own QRIS merchant account/sub-account
- **Providers:** Xendit XenPlatform sub-accounts, BRI direct
- **Pros:** Simpler regulatory, funds go directly to seller
- **Cons:** KYC per seller (3-5 days)

### Model C: Per-Transaction Dynamic QRIS
- Unique QRIS per order with exact amount
- Customer scans → pays → webhook confirms
- Works on top of Model A or B
- **All providers** support this

**Best for CatatOrder:** Model A (platform collects, settles to seller) — most practical since UMKM sellers don't want to set up merchant accounts.

---

## 5. Technical Implementation

### Midtrans Core API (already integrated)

```
POST https://api.midtrans.com/v2/charge
{
  "payment_type": "qris",
  "transaction_details": {
    "order_id": "ORDER-123",
    "gross_amount": 75000
  },
  "qris": {
    "acquirer": "gopay"
  },
  "custom_expiry": {
    "expiry_duration": 30,
    "unit": "minute"
  }
}
```
→ Response: `qr_string` (render as QR code on client)
→ Webhook: `transaction_status: "settlement"` when paid

### Xendit Payment Request API

```
POST https://api.xendit.co/qr_codes
{
  "external_id": "order-123",
  "type": "DYNAMIC",
  "callback_url": "https://catatorder.id/api/qris/webhook",
  "amount": 75000
}
```
→ Response: `qr_string` + `id`
→ Webhook fires on payment

### QR Code Display
- Render from `qr_string` using `qrcode.react` library (client-side)
- Show amount prominently above/below QR
- Countdown timer for expiry
- Poll status or listen via WebSocket for real-time update
- Clear success/failure states

### Expiry Times

| Provider | Default | Range |
|----------|---------|-------|
| Midtrans | 15 min | 20s - 7 days |
| Xendit | 48 hours | Customizable |
| InterActive | 30 min | Not configurable |

---

## 6. Fees & MDR Regulations

### Bank Indonesia MDR (effective March 15, 2025)

| Merchant Category | Transaction | MDR |
|-------------------|------------|-----|
| Micro (< Rp400M/year) | < Rp500,000 | **0%** |
| Micro | > Rp500,000 | 0.3% |
| Small/Medium/Large | All | 0.7% |

**Key:** Most UMKM food/catering orders < Rp500K = **0% MDR**. MDR is borne by merchant (seller), NOT the buyer. BI prohibits passing MDR to consumers.

### Gateway Fees (what platform pays)

| Provider | QRIS Fee |
|----------|----------|
| Xendit | 0.63% |
| Midtrans | 0.7% |
| DOKU | 0.7% |
| InterActive | Varies |

---

## 7. Hybrid Approaches (Without Full Gateway)

### Tier 1: Manual "Sudah Bayar" Button (simplest)
- Keep static QRIS
- Customer taps "Sudah Bayar" → order moves to "pending confirmation"
- Seller manually confirms in dashboard
- **Cost:** Free | **Effort:** Low
- **Limitation:** No proof, relies on trust

### Tier 2: Proof Upload + Manual Confirmation
- Same as Tier 1, but customer uploads payment screenshot
- Seller reviews and confirms
- **Cost:** Free | **Effort:** Medium
- **Limitation:** Screenshots can be faked

### Tier 3: Static-to-Dynamic QRIS Conversion (npm)
- npm packages convert seller's static QRIS to dynamic with embedded amount:
  - `@agungjsp/qris-dinamis` (ESM support)
  - `@misterdevs/qris-static-to-dynamic`
- Works by: parse EMV TLV data → inject tag 54 (amount) → change indicator `010211`→`010212` → recalculate CRC-16
- **Critical limitation:** NO webhook. Payment still goes to seller's bank. No auto-confirm possible.
- **Cost:** Free | **Effort:** Medium
- **Useful for:** Showing exact amount on QR, but still needs manual verification

### Tier 4: Dynamic QRIS via Gateway API
- Full auto-confirmation with webhook
- **Cost:** 0.63-0.7% per txn | **Effort:** High
- **Best approach** for solving the core problem

---

## 8. Recommendation

### Comparison Table

| Approach | Auto-Confirm | Webhook | Effort | Cost |
|----------|-------------|---------|--------|------|
| Current static QRIS | No | No | None | Free |
| + "Sudah Bayar" button | No | No | Low | Free |
| + Proof upload | No | No | Medium | Free |
| + npm dynamic conversion | No | No | Medium | Free |
| Midtrans dynamic QRIS | **Yes** | **Yes** | High | 0.7%/txn |
| Xendit QRIS API | **Yes** | **Yes** | High | 0.63%/txn |

**Short-term:** Tier 1-2 (Sudah Bayar + proof upload) — immediate UX improvement, zero cost.

**Medium-term:** Tier 3 (npm conversion) — show exact amount on QR, better UX.

**Long-term:** Tier 4 (Midtrans or Xendit dynamic QRIS) — full auto-confirmation.

---

## Sources
- [Static vs Dynamic QRIS - Tempo](https://en.tempo.co/read/2039827/static-vs-dynamic-qris-key-differences-every-business-should-know)
- [Xendit QRIS Documentation](https://docs.xendit.co/docs/qris)
- [Midtrans QRIS API](https://docs.midtrans.com/reference/qris)
- [DOKU QRIS API](https://developers.doku.com/accept-payments/direct-api/snap/integration-guide/qris)
- [InterActive QRIS API](https://qris.id/api-doc/)
- [BRI QRIS Dynamic](https://developers.bri.co.id/en/docs/qris-merchant-presented-mode-mpm-dynamic)
- [Bank Indonesia QRIS MDR](https://www.bi.go.id/id/publikasi/ruang-media/cerita-bi/Pages/mdr-qris.aspx)
- [npm: @agungjsp/qris-dinamis](https://www.npmjs.com/package/@agungjsp/qris-dinamis)
- [Xendit QRIS + Next.js Tutorial](https://www.sandimaulanajuhana.com/articles/xendit-qris-webhook-nextjs)
- [QRIS Payment Guide - Antom](https://knowledge.antom.com/qris-indonesia-payment-guide)
