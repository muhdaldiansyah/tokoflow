# P5 · Auto-Reconciliation — Implementation Plan

> Background Twin (Tier 3) work: cocokin pembayaran masuk → pesanan unpaid
> tanpa input merchant. Foundation shipped — ingestion + UI deferred until
> Phase 0 interviews confirm the pain.
> Effort estimate: **~5 working days** for shippable v1 (paste-only ingestion + claim card).

---

## What's already shipped (cycle 037-MY)

| Layer | State | Lokasi |
|---|---|---|
| Schema | ✅ shipped | `supabase/migrations/083_payment_notifications.sql` |
| Scoring service | ✅ shipped | `lib/services/reconcile.service.ts` |
| Auto-link engine | ✅ shipped | `app/api/reconcile/route.ts` |
| Money-bearing threshold (0.92) | ✅ shipped | `MONEY_BEARING_THRESHOLD` |

Without ingestion (paste/SMS/screenshot/webhook) the engine has nothing to
match against — it's a load-bearing pillar with no roof yet. Below: paths
to add the roof, ranked by leverage.

---

## Three ingestion paths (pick one for v1, rank order matches positioning fit)

### Path A — Paste ingestion (RECOMMENDED v1)

**Why first:** zero native dependencies, works on web today. Merchant gets
SMS notification → long-press → copy → paste into a Tokoflow modal. The
existing voice-paste pattern in CatatOrder is proof this UX works.

**Deliverables:**
1. `app/api/payment-notifications/parse/route.ts` — POST `{ raw_text: string }`,
   calls Gemini Flash Lite to extract `{ amount_myr, sender_name, bank, reference, occurred_at }`,
   inserts the row, then calls `/api/reconcile` inline with the new row id.
2. `features/reconcile/components/PastePaymentSheet.tsx` — bottom-sheet
   modal triggered from `/today` or `/orders` page, single textarea + paste
   button + parse → confirm.
3. Prompt template tuned for MY bank notification formats: Maybank2u, CIMB
   Clicks, MAE, Touch 'n Go, GrabPay, BigPay, RHB Now.

**Effort:** ~2 days.

### Path B — Screenshot ingestion

**Why second:** WhatsApp users often forward bank screenshots to themselves
or to a "ledger" chat. Screenshot → upload → OCR via Gemini multimodal (the
exact pattern already in `app/api/image/parse/route.ts`).

**Deliverables:**
1. Variant of `app/api/payment-notifications/parse/route.ts` accepting
   `{ image: base64 }` instead of text.
2. Reuse upload UI from `OrderForm.tsx` image-paste flow.

**Effort:** ~1.5 days. Mostly prompt engineering.

### Path C — Native SMS share intent (Wave 2 mobile)

**Why last:** requires mobile app + Android share intent (iOS doesn't expose
SMS to app share-sheets). Tokoflow Phase 1 is web-first; this comes when
the mobile app catches up.

**Effort:** ~3 days when mobile shell exists.

---

## Claim-card UI (deferred — required when ingestion ships)

Sub-0.92 matches stay `pending_match` and need a merchant decision. UI:

- Banner on `/today` and `/orders`: "1 payment menunggu cocok"
- Card view: payment details + top 3 candidate orders + per-row confidence
- Three actions per candidate row:
  - "Yes, this is the one" → updates payment to `matched`, order to paid
  - "Not this one" → moves on to next candidate
  - "This isn't mine" → updates payment to `rejected_not_mine`

**Why this matters:** without the claim card, sub-0.92 matches just sit
forever. The auto-link engine handles the easy 80%; the claim card handles
the messy 20% (partial payments, name-changed-on-bank-slip, sender
forwarded a payment to the wrong account).

**Effort:** ~1.5 days.

---

## Rejected approaches

- **Direct bank API integration** — Maybank/CIMB/RHB APIs require Sdn Bhd +
  enterprise tier + mTLS + manual onboarding per merchant. Killed at
  positioning bible §1: zero-integration path is the moat.
- **MAE / Touch 'n Go OAuth** — same issue, plus T&G specifically does not
  permit aggregator apps to read transaction history. Both are deferred.
- **OCR-only without LLM** — Gemini multimodal is faster + cheaper +
  more accurate than Tesseract+regex pipelines for noisy MY bank screenshots.

---

## Hooking into existing Billplz path

`/api/billing/webhook` already auto-links Billplz-paid orders. This new
engine only operates on payment_notifications — entries from Billplz never
flow through this table. No double-matching risk.

If Billplz ever goes down or merchant bypasses it (e.g. customer transfers
directly to maybank account), the merchant pastes the notification and the
engine catches up.

---

## Telemetry to add when v1 ships

- `payment_notification_ingested` (source = paste|screenshot|sms)
- `payment_auto_linked` (with `composite_score` bucket)
- `payment_manually_linked` (claim-card click)
- `payment_rejected_not_mine`
- `reconcile_run` (cron / inline / manual)

These wire into the existing `events` table — no new infra.

---

## Pre-committed kill triggers (Phase 0 reality check)

If interviews surface any of these, **scrap the engine**:

1. <3/10 merchants name "cocokin pembayaran" as top-3 pain → engine solves a
   pain that doesn't exist
2. >50% of merchants use only Billplz / FPX direct → coverage already
   handled by `/api/billing/webhook`, engine is overbuild
3. Auto-link false-positive rate ≥1% in shadow mode (week 1) → 0.92
   threshold too low; raise or kill

---

## See also

- `lib/services/reconcile.service.ts` — scoring (pure)
- `app/api/reconcile/route.ts` — engine
- `supabase/migrations/083_payment_notifications.sql` — schema
- `app/api/billing/webhook/route.ts` — existing Billplz happy path
- `docs/positioning/02-product-soul.md` §1.4 — Background Twin pillar
- `docs/positioning/03-features.md` — Three-Tier mapping (this is Tier 3)

---

*Versi 1.0 · 2026-05-02 · Engine shipped, ingestion + UI deferred.*
