# Final Recommendation: Phased Roadmap

> Synthesizing all research into a prioritized action plan

---

## The Core Problem

Current flow: Customer orders → sees seller's static QRIS image → pays in banking app → manually confirms via WhatsApp → seller manually verifies in bank app → marks paid.

**Issues:** No auto-confirmation, no payment proof, fragile session-based UX, 3 critical code bugs, missing order summary on success page, disruptive auto-open WA.

---

## Phased Approach

### Phase 1: Fix Bugs + Quick UX Wins (Now — 1 user)
**Cost: Rp0 | Effort: 1-2 days | Impact: High**

No payment gateway changes. Fix what's broken and improve the existing flow.

#### 1A. Critical Bug Fixes
- [ ] **Fix stock not decremented** on public orders (use service role client)
- [ ] **Add server-side stock validation** in API route before creating order
- [ ] **Link `customer_id`** to order after customer upsert

#### 1B. Success Page Overhaul
- [ ] **Show order summary** — items, quantities, prices, total (from sessionStorage + URL fallback)
- [ ] **Make order number prominent** — `text-sm font-mono font-medium` + copy button
- [ ] **Add "Lihat Struk" link** — receipt URL `/r/{orderId}` already exists
- [ ] **Add "Sudah Bayar" button** → transitions to "Menunggu konfirmasi penjual" with seller WA as escape hatch
- [ ] **Show "what happens next"** guidance — "Penjual akan konfirmasi via WhatsApp"
- [ ] **Remove auto-open WA** — replace with prominent, explained WA button (or add 4s countdown with cancel)

#### 1C. Order Form Improvements
- [ ] **Move name/phone below catalog** — let customers browse first
- [ ] **Persist customer info in localStorage** by slug — pre-fill on return visits
- [ ] **Add phone validation** — regex for Indonesian numbers (10+ digits, starts 0/62/+62)
- [ ] **Add delivery date picker** — optional field, maps to existing `delivery_date` column

#### 1D. Trust & Accessibility
- [ ] **Order count social proof** — "X pesanan telah diproses" (data already fetched)
- [ ] **Add `role="alert"`** to error messages
- [ ] **Add `aria-label`** on +/- quantity buttons
- [ ] **Respect `prefers-reduced-motion`** on pulse animations

---

### Phase 2: Enhanced Payment Confirmation (5-10 merchants)
**Cost: Rp0-minimal | Effort: 3-5 days | Impact: Medium-High**

Improve payment verification without a full gateway.

#### Option A: "Sudah Bayar" + Proof Upload (Recommended)
- Customer taps "Sudah Bayar" → uploads screenshot of payment proof
- Order status moves to **"pending_confirmation"** (new sub-status or use existing flow)
- Seller gets notification → reviews proof → confirms/rejects in dashboard
- If seller doesn't confirm within X hours → auto-reminder

**Pros:** Free, adds accountability, reduces fake payment claims vs bare "Sudah Bayar"
**Cons:** Screenshots can be faked (acceptable risk at this scale)

#### Option B: Static-to-Dynamic QRIS Conversion (npm)
- Use `@agungjsp/qris-dinamis` to convert seller's uploaded static QRIS to dynamic with embedded amount
- Customer sees exact amount in their banking app (no manual entry)
- **Still no auto-confirmation** — payment goes to seller's bank directly
- Combine with Option A for best effect

**Pros:** Better UX (exact amount), free, minimal code
**Cons:** No webhook, still needs manual confirmation

#### Option C: Auto Bank Mutation Checking (Moota.co)
- Moota.co checks seller's bank account statements automatically
- Webhook when payment arrives matching the order amount
- ~Rp1,500/day per bank account
- **Partial auto-confirmation** — matches by amount + timing

**Pros:** Cheapest auto-verification, no full gateway needed
**Cons:** Seller must connect bank account, matching is heuristic (not guaranteed)

#### Phase 2 Also Includes:
- [ ] **Auto follow-up on unpaid orders** — WhatsApp reminder after X hours (inspired by Take.app)
- [ ] **Order tracking page** — status progress bar on `/r/[id]` receipt page
- [ ] **"Pesan Lagi" with pre-filled cart** — localStorage cart by slug for repeat orders

---

### Phase 3: Dynamic QRIS via Gateway API (10-50 merchants)
**Cost: 0.63-0.7% per txn | Effort: 1-2 weeks | Impact: Very High**

Full auto-confirmation with webhook. Two viable paths:

#### Path A: Extend Midtrans (Already Integrated)
- Use Midtrans Core API (`/v2/charge` with `payment_type: "qris"`)
- Generate dynamic QRIS per order with exact amount
- Webhook → auto-update order `paid_amount` and `status`
- All payments go to CatatOrder's Midtrans account
- Disburse to sellers manually or via Midtrans Iris

**Pros:** Already have Midtrans keys + webhook infrastructure
**Cons:** 0.7% fee, no native split payment, DIY disbursement, T+3 VA settlement

#### Path B: Migrate to Xendit (Better Long-term) ⭐
- Use Xendit Payment Request API for dynamic QRIS
- 0.63% fee (cheaper than Midtrans)
- Better settlement (instant for most VAs)
- Path to Phase 4 (XenPlatform) without re-integration

**Pros:** Lower fees, better DX, modern TS SDK, foundation for marketplace
**Cons:** New provider onboarding, two payment providers during transition

#### Phase 3 Flow:
```
Customer submits order
    ↓
API creates order + calls Xendit/Midtrans to generate dynamic QRIS
    ↓
Success page renders QR code (from qr_string, not static image)
    ↓
Show countdown timer (15-30 min expiry)
    ↓
Poll status every 5s OR wait for webhook
    ↓
Payment confirmed → auto-update order → show success animation
    ↓
Send WhatsApp notification to seller (order paid)
```

#### Phase 3 Decision:
- If you plan to eventually do Phase 4 → **choose Xendit** (no re-integration)
- If you want minimal change → **extend Midtrans** (reuse existing infrastructure)

---

### Phase 4: Marketplace Payment via XenPlatform (50+ merchants)
**Cost: Rp25K/active sub-account/month + 0.63% QRIS | Effort: 2-4 weeks | Impact: Transformative**

Full marketplace with automatic fund routing.

#### Architecture:
```
Customer pays → Xendit collects → Split Rule applied
    ├── CatatOrder commission (e.g., 2-5%) → CatatOrder sub-account
    └── Seller's share (95-98%) → Seller's sub-account
```

#### Seller Onboarding:
1. Seller signs up on CatatOrder
2. CatatOrder creates Xendit Managed sub-account via API
3. Seller completes KYC: KTP + selfie (Xendit handles verification, 3-5 days)
4. Once verified → can receive payments directly

#### Requirements:
- CatatOrder must be registered as **entity business** (PT/CV) for XenPlatform activation
- 1-3 business days for platform approval

#### Revenue Model:
- Take 2-5% commission per transaction (via Split Rules)
- OR keep current quota model (Rp15K/50 orders) + free payment processing
- OR hybrid: free quota + small processing fee for auto-confirmed payments

---

## Recommended Strategy Summary

| Phase | When | Cost | What |
|-------|------|------|------|
| **1** | Now (1 user) | Free | Fix bugs + UX overhaul + trust signals |
| **2** | 5-10 merchants | Free-minimal | Proof upload + dynamic QR npm + auto-reminders |
| **3** | 10-50 merchants | 0.63%/txn | Dynamic QRIS API (Xendit) + auto-confirmation |
| **4** | 50+ merchants | Rp25K/sub/month | Full marketplace via XenPlatform |

---

## Why This Order?

1. **Phase 1 costs nothing** and fixes real bugs + dramatically improves UX. Do this regardless of payment strategy.

2. **Phase 2 bridges the gap** — "Sudah Bayar" + proof upload is 80% of the value of auto-confirmation at 0% of the cost. Most UMKM sellers are used to manual verification.

3. **Phase 3 is worth the investment** only when payment friction becomes a measurable growth bottleneck — i.e., customers are dropping off at the QRIS step. With 10+ merchants, you'll have data to validate this.

4. **Phase 4 is a product transformation** — CatatOrder becomes a marketplace, not just a SaaS tool. Only pursue when the unit economics justify the Rp25K/sub/month cost and the PT/CV entity setup.

---

## Key Insight from Research

> **The biggest UX improvement isn't payment gateway integration — it's showing the order summary on the success page, adding a "Sudah Bayar" flow, and fixing the 3 critical bugs. These cost nothing and have immediate impact.**

The payment gateway conversation (Xendit vs Midtrans vs DOKU) only matters at Phase 3+. For Phase 1-2, the current static QRIS approach works fine with better UX wrapping.

---

## Appendix: Technology Decisions

### If choosing Xendit (Phase 3+):
- SDK: `xendit-node` v7.0.0 (TypeScript, Node 18+)
- QRIS fee: 0.63%
- Webhook: `payment_request.succeeded`
- Tutorial: [Xendit QRIS + Next.js](https://www.sandimaulanajuhana.com/articles/xendit-qris-webhook-nextjs)

### If staying with Midtrans (Phase 3):
- SDK: `midtrans-client` (already installed)
- QRIS fee: 0.7%
- Webhook: reuse `/api/billing/webhook` pattern
- Docs: [Midtrans QRIS API](https://docs.midtrans.com/reference/qris)

### For static-to-dynamic QRIS conversion (Phase 2):
- npm: `@agungjsp/qris-dinamis` (ESM)
- No API key needed — client-side conversion of seller's existing QRIS
- Limitation: no webhook, payment still goes to seller directly

### For bank mutation checking (Phase 2 alternative):
- [Moota.co](https://moota.co/) — ~Rp1,500/day per bank account
- Auto-checks bank statements → webhook on new transaction
- 7,200+ businesses using it

---

*Research conducted 2026-03-09. See individual research files for full details and sources.*
