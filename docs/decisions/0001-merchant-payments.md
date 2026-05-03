# ADR 0001 — Merchant payments architecture

**Status:** Accepted
**Date:** 2026-05-03
**Author:** Aldi
**Decided by:** Aldi (solo founder, pre-Ariff partnership)
**Revisit trigger:** if Phase 0 reveals weak demand for in-flow payment, OR if Curlec/Razorpay Routes ships full MY support, OR if Billplz adds embedded onboarding

---

## Context

Tokoflow is the merchant's storefront. Customers click an order link, fill a cart, submit. Today, payment happens *outside* the order flow — the customer sees a static DuitNow QR and is asked to pay via their bank app, screenshot proof, and wait for the merchant to manually verify.

This breaks two things:

1. **Seamless customer experience.** The order step ends without confirmation. Customer doesn't know if their payment landed; merchant doesn't know if it's real until they manually check the bank statement.
2. **Records.** Tokoflow has no payment record until the merchant taps "verify." There's no real-time `/today` revenue, no audit trail, no automatic reconciliation. Smart matching is heuristic — wrong matches happen, refunds are manual, partial pays are messy.

The merchant ICP (Bu Aisyah, home F&B mompreneur in Shah Alam) is precisely the audience that has been burned by reconciliation errors. Probabilistic matching breaks trust the moment it produces a wrong answer.

The reference apps the founder pointed at are **courtsite.my** (sports court booking, MY) and **momence.com** (fitness/wellness booking, US). Both deliver instant in-flow payment with full records. Both use platform-payment patterns: courtsite via iPay88 marketplace, momence via Stripe Connect.

This ADR decides how Tokoflow gets the same outcome while preserving the positioning bible's "zero commission" and "your customers stay yours" claims.

---

## Decision

**Pattern B — per-merchant Billplz accounts.**

Each merchant connects their own Billplz account to Tokoflow. Tokoflow uses the merchant's API key + collection ID + X-Signature key to:

1. Create a Billplz bill at order-submit time
2. Redirect the customer to Billplz hosted checkout (DuitNow QR / FPX / cards / eWallets — all in one)
3. Receive the webhook on payment, verify signature with the merchant's key, update Tokoflow's `order_payments` record + parent `orders.paid_amount` atomically
4. Funds settle from Billplz to the merchant's bank account on Billplz's normal schedule — **Tokoflow never touches the money**

Tokoflow's revenue from this flow: **zero.** Billplz's per-transaction fees (RM 0.30 – 0.95 depending on method) are deducted by Billplz on settlement, surfaced to the merchant as a transparent line item on the order detail. Tokoflow's revenue stays in the Pro / Business subscription tiers.

DuitNow QR + manual verification stays as the **graceful fallback** for merchants who haven't connected Billplz, are mid-KYB, or whose API call fails at order time.

---

## Alternatives considered (and rejected)

### A — Marketplace / aggregator (Tokoflow holds funds)

Customer pays Tokoflow's Billplz account. Tokoflow holds funds, settles to merchant on T+N.

**Rejected because:**
- Money Services Business license required from BNM in MY (regulated activity).
- Float capital required at scale (RM millions in transit).
- "Your customers stay yours" is harder to claim when transactions route through Tokoflow's brand.
- "Zero commission" becomes harder to maintain (per-transaction cut becomes the obvious revenue lever).
- Settlement delay (you can't pay merchant instantly because *you* just got paid).
- KYC/AML burden on every merchant lands on Tokoflow.

This is what courtsite.my chose — and they took a 15-20% service fee per booking. That's the wrong shape for Tokoflow.

### C — DuitNow QR + smart matching (status quo)

Static QR shown after order. Merchant manually verifies, helped by amount + name + recency matching.

**Rejected because:**
- Not seamless. Customer abandons the flow before payment confirmation.
- No record in Tokoflow until manual verify. `/today` revenue and audit trail break.
- Smart matching is probabilistic — wrong matches happen at scale.
- Refunds, disputes, partial pays all manual.
- Bank-statement reconciliation falls outside Tokoflow's data.

**Kept as fallback** for merchants without Billplz, but never the primary rail for Pro merchants.

### B alternative — Billplz Partner / sub-account API

Tokoflow as the Billplz "partner," merchants get sub-collections under Tokoflow's umbrella account.

**Rejected because:**
- Funds settle to *Tokoflow's* account, not the merchant's. This is Pattern A in disguise.
- Same regulatory exposure as A.
- Same positioning conflict.

### Curlec/Razorpay Routes

Closer to Stripe Connect in API shape — split payments to multiple recipient accounts.

**Rejected for now because:**
- MY Routes maturity unverified as of 2026-05-03.
- Adds a new PSP integration (Tokoflow already has Billplz wired for SaaS billing).
- Onboarding flow for merchants is unfamiliar (Curlec is newer in MY).

**Revisit if:** Curlec MY Routes fully ships and offers embedded onboarding (the Stripe Connect Express equivalent), at which point the per-merchant friction in Pattern B becomes addressable by switching PSP.

### iPay88 marketplace

MY's most established payment processor with marketplace API.

**Rejected because:**
- Tokoflow becomes merchant of record in their model = Pattern A in disguise.
- Heavy KYB on Tokoflow side.
- Enterprise-feel onboarding for merchants.

---

## Consequences

### Positive

- **Seamless customer flow.** One link → cart → pay → done. Same shape as courtsite/momence.
- **Real-time records.** Every payment lands in `order_payments` via webhook with bill ID, method, fee, paid timestamp.
- **Funds direct to merchant.** Zero float, zero MSB license requirement on Tokoflow.
- **Bible-compatible.** Tokoflow takes 0% per transaction. "Zero commission" preserved as a competitive moat against marketplaces taking 5-15%.
- **Multi-rail support free.** Billplz hosted page handles DuitNow QR, FPX, cards, GrabPay, TNG — all four MY payment archetypes — without us integrating each.
- **Existing infrastructure.** `lib/billplz/` adapter already exists for Tokoflow's own subscription billing. Per-merchant flow parameterizes the same code with the merchant's keys.
- **Auto-MyInvois trigger.** Webhook landing `paid=true` can auto-call `/api/invoices/[id]/myinvois-submit` for Pro merchants — making the "Background Twin" promise literal.

### Negative

- **Per-merchant onboarding friction.** Each merchant must KYB with Billplz (1-3 days for sole prop). Some will fail.
- **API key management.** Merchant pastes their key into Tokoflow Settings; Tokoflow stores encrypted at rest via `lib/crypto/secret-box`. Key rotation is a manual flow.
- **Per-merchant webhook signature keys.** Each webhook must look up the right merchant's X-Signature key before verifying. More complexity than a single-tenant webhook.
- **Per-transaction fees on the merchant.** RM 0.30 – 0.95 per order. Surfaced transparently. Trade-off vs. free static-QR flow.
- **Failure modes to handle.** Customer abandons checkout, Billplz API down, KYB rejected, webhook lost or out-of-order, refund needed, partial payment.

### Neutral

- **Dependent on Billplz.** Switching PSP later means rewriting the order flow. Acceptable risk because Billplz is the dominant MY PSP for the ICP segment.

---

## Architecture summary

```
Customer order submit
        │
        ▼
/api/public/orders POST
        │
        ├── insert orders row (existing)
        │
        ├── if profile.billplz_payment_enabled:
        │       │
        │       ├── decrypt merchant API key
        │       ├── billplzClient.createBill(merchantKey, collectionId, ...)
        │       ├── insert order_payments(status=pending, bill_id, url)
        │       └── return paymentUrl in response
        │
        └── else: return order with no paymentUrl
                  storefront falls back to static DuitNow QR display

Storefront receives response
        │
        ├── if paymentUrl: window.location.href = paymentUrl
        └── else: show DuitNow QR + "I've paid" manual verify

Customer pays on Billplz hosted page
        │
        ▼
Billplz POST /api/public/orders/billplz-webhook
        │
        ├── parse reference_2 → merchant id
        ├── decrypt merchant X-Signature key
        ├── verify signature (timing-safe)
        ├── reject if signature invalid
        ├── update order_payments (status, paid_at, method, fee)
        └── update orders.paid_amount atomically (RPC)

Realtime listener broadcasts to merchant dashboard
        │
        ▼
Merchant sees order arrive marked PAID, with full record
```

---

## Schema additions (deferred to migration 086 + 087)

```sql
ALTER TABLE profiles
  ADD COLUMN billplz_api_key_enc TEXT,
  ADD COLUMN billplz_x_signature_key_enc TEXT,
  ADD COLUMN billplz_collection_id TEXT,
  ADD COLUMN billplz_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN billplz_kyb_status TEXT;

CREATE TABLE order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','paid','failed','refunded','expired')),
  provider TEXT NOT NULL CHECK (provider IN ('billplz','duitnow_manual','cash')),
  billplz_bill_id TEXT,
  billplz_url TEXT,
  payment_method TEXT,
  payer_name TEXT,
  payer_email TEXT,
  payer_phone TEXT,
  fee_amount NUMERIC(12,2),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Rollout plan

1. **Behind feature flag from day 1.** `profiles.billplz_payment_enabled` defaults FALSE. No merchant gets the new flow until they explicitly opt in.
2. **First user: Aldi (or one volunteer merchant).** During Phase 0 smoke test, the volunteer merchant connects their Billplz account and accepts real orders through the new rail.
3. **Phase 0 validates** with real-merchant data: customer abandonment rate at the payment step, merchant emotional trust, settlement timing, KYB friction perception.
4. **Post-Gate-0: enable broadly** for any Pro merchant who connects Billplz. Free-tier merchants stay on the static-QR fallback (no Billplz connection required).

---

## Security commitments (non-negotiable)

These must be implemented and tested before *any* merchant other than Aldi has the flag enabled:

- ✅ **Timing-safe X-Signature verification** using `crypto.timingSafeEqual`, per-merchant key looked up by `reference_2`.
- ✅ **Idempotency on `order_payments` updates** — the same `billplz_bill_id` arriving twice must not double-credit `orders.paid_amount`.
- ✅ **Reference cross-validation** — webhook payload's `reference_1` (order id) must belong to the merchant identified in `reference_2`. Reject mismatched.
- ✅ **API keys encrypted at rest** via `lib/crypto/secret-box`. Never logged. Never returned by `/api/profile`.
- ✅ **Webhook test suite** covering: valid signature, invalid signature, missing signature, replay (same payload twice), tampered amount, mismatched references.
- ✅ **Default OFF flag** — schema migration sets `billplz_payment_enabled = false`. Each merchant flips on individually.

---

## Open questions

1. **What's Billplz's per-merchant onboarding latency in practice?** Spec says 1-3 days for sole prop, longer for Sdn Bhd. Ariff would know better.
2. **Does Billplz let us *programmatically* create a collection on a merchant's account once we have their API key?** If yes, onboarding wizard auto-creates "Tokoflow Orders" collection. If no, merchant must create one manually.
3. **What's the right default fee-handling UX?** Show net (RM 24.70) or gross (RM 25.00) on `/today`? Probably both — gross headline, net in tooltip.
4. **Does Phase 0 actually reveal that mompreneurs want this badly enough to KYB with Billplz?** Or are they fine with manual QR? Smoke test settles it.
5. **Refund flow** — manual call to Billplz API from order detail UI, OR automatic when merchant marks order cancelled? Lean toward manual confirmation modal.
6. **Auto-MyInvois on payment** — fire automatically when `paid=true` (Pro tier), or require merchant tap to confirm? Lean toward automatic with 30-second undo window.

---

## Revisit triggers

This ADR should be re-opened if:

- Phase 0 reveals merchants don't actually want in-flow payment (improbable but possible).
- Phase 0 reveals KYB friction is too high (>50% drop-off), forcing rethink toward Pattern A or PSP switch.
- Curlec MY Routes ships full embedded-onboarding equivalent to Stripe Connect Express — the per-merchant friction goes away, may want to add as second PSP.
- Billplz changes pricing materially (e.g., introduces per-merchant monthly fee) that breaks the unit economics.
- Tokoflow scales beyond MY (Singapore, Brunei) and per-country PSP coverage matters.

---

*Single source of truth for the merchant-payments architecture decision. If this ADR conflicts with anything written elsewhere, this document wins until revised.*
