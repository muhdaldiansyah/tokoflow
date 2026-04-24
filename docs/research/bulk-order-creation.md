# Bulk Order Creation & Update — Deep-Dive Analysis

> Decision research for solving the bulk order entry problem in CatatOrder.
> Grounded in UMKM psychology research (`~/demand/psychology/`) and codebase analysis.

*Date: 2026-02-22*

---

## 1. The Problem

### Current flow to create 10 orders manually

1. Open `/pesanan` (list page)
2. Tap FAB → navigate to `/pesanan/baru`
3. Fill form (items, customer, payment) → tap "Buat Pesanan"
4. `router.push(/pesanan/${order.id})` → lands on order detail page
5. Tap back → detail page → tap back → list page
6. Repeat steps 2–5 nine more times

**Result: 5 actions per order × 10 = 50 interactions.** For a warung with 20 morning orders, that's 100+ taps.

Against the psychology research's **3-step death line**, this is catastrophic — users abandon workflows requiring more than 3 steps per task.

### Current batch (AI) flow limitations

- Paste WA text → AI parses → review cards → "Buat Semua"
- All orders hardcoded to `paid_amount: 0`, `source: "whatsapp"`
- No customer picker, no payment control per order
- Error-prone when WA format is non-standard (Gemini misparses)
- No manual creation path — AI is the only entry point in batch mode

### Root cause in code

`OrderForm.tsx` line 343:
```typescript
router.push(`/pesanan/${order.id}`);
```

After every successful creation, the user is redirected to the order detail page. Returning to the create form requires 2 back navigations (detail → list → new form).

---

## 2. User Scenarios — When Does Bulk Happen?

From psychology research (`~/demand/psychology/fnb-katering-bakery.md`, `umkm.md`):

### Scenario A: Live Rush (warung/kedai)

- 15–50 orders/day, mostly walk-in
- Orders come in waves during rush hours (11am–1pm lunch, 5pm–7pm dinner)
- Pattern: customer in front of them → record order fast → next customer
- Need: rapid-fire one-at-a-time entry, zero navigation between orders

### Scenario B: Batch Catch-Up (katering, bakery/kue)

- Multiple WA messages received overnight, recorded in the morning
- 10 customers ordering for tomorrow's event
- Pattern: sitting down after rush, recording everything at once
- Need: create multiple orders from WA text or manual entry, review all, submit

### Key insight

These are **two distinct scenarios** requiring different optimizations. Live rush needs speed per order. Batch catch-up needs bulk throughput.

---

## 3. All Solutions Evaluated

### Option A: "Simpan & Buat Lagi" Button

Add a second button to OrderForm that saves the current order and resets the form instead of navigating away.

**Implementation:** ~30 lines change in `OrderForm.tsx`. After save, reset all form state, show success toast, auto-focus item name input.

| Aspect | Assessment |
|--------|-----------|
| Steps per order | 2 (fill + save) — down from 5 |
| Mobile (375px) | Perfect — same form |
| Learning curve | Zero — same UI, one new button |
| Features retained | All (customer, payment, notes, discount, AI paste) |
| Development cost | Very low (~30 lines) |
| Covers live rush? | Yes |
| Covers batch catch-up? | Partial — still one at a time |

### Option B: "Catat Cepat" Quick Entry Mode

Minimal form showing only items + customer name, with a running list of created orders below.

| Aspect | Assessment |
|--------|-----------|
| Steps per order | 2 |
| Mobile (375px) | Good |
| Learning curve | Medium — new concept, "which form do I use?" |
| Features retained | Limited — no payment/notes/discount |
| Development cost | Medium (new component) |
| Covers live rush? | Yes |
| Covers batch catch-up? | No |

**Risk:** Creates decision paralysis — "Catat Cepat vs Pesanan Baru?" Psychology research warns: "tools that demand categorization upfront trigger decision paralysis." UMKM users want ONE path, not choices.

### Option C: Manual Batch Entry Page

Page where users add multiple orders as cards/rows before saving all at once.

| Aspect | Assessment |
|--------|-----------|
| Steps per order | 4+ (add order → add items → repeat → submit all) |
| Mobile (375px) | Poor — N expandable cards = scrolling nightmare |
| Learning curve | High — new UI paradigm |
| Features retained | Partial |
| Development cost | High (new complex component) |
| Covers live rush? | No — requires planning ahead |
| Covers batch catch-up? | Yes |

**Fails 3-step death line.** Users must manage nested state (orders containing items). Partial save failure creates confusing state.

### Option D: Cell/Table/Spreadsheet View

Table where each row is an order with columns for customer, items, total, payment.

| Aspect | Assessment |
|--------|-----------|
| Mobile (375px) | **Fatal** — cannot fit columns |
| Learning curve | Very high — triggers "gaptek" identity threat |
| Development cost | Very high |

**Hard no.** Items are nested arrays (1–N items per order) — a single cell can't represent this. Psychology research: "interfaces resembling corporate software trigger impostor syndrome in UMKM users."

### Option E: Hybrid — "Simpan & Buat Lagi" + Enhanced Batch Page

Combine Option A with improvements to existing batch page.

| Aspect | Assessment |
|--------|-----------|
| Steps per order | 2 (single) / 3 (batch) |
| Mobile (375px) | Good |
| Learning curve | Low — builds on existing UI |
| Features retained | All |
| Development cost | Low–Medium |
| Covers live rush? | Yes (via Save & New) |
| Covers batch catch-up? | Yes (via enhanced batch) |

---

## 4. Scoring Against Psychology Framework

Sources: `~/demand/psychology/umkm.md`, `fnb-katering-bakery.md`, `indonesia.md`; `~/demand/insights/patterns.md`, `umkm-insights.md`

| Criterion | A: Save & New | B: Quick Entry | C: Manual Batch | D: Table | E: Hybrid |
|-----------|:---:|:---:|:---:|:---:|:---:|
| 3-step death line | Pass (2) | Pass (2) | Fail (4+) | Fail | Pass |
| Mobile-first 375px | Pass | Pass | Marginal | Fail | Pass |
| "Ribet" threshold | Low | Medium | High | Very High | Low–Medium |
| Familiar mental model | Same form | New concept | New concept | Foreign | Mostly familiar |
| Production-identity fit | Good (fast) | Good | Slow (upfront) | Bad | Good |
| Implementation cost | Very Low | Medium | High | Very High | Low–Medium |
| Covers live rush | Yes | Yes | No | No | Yes |
| Covers batch catch-up | Partial | No | Yes | No | Yes |

---

## 5. Decision: Option E (Hybrid), Phased

### Phase 1 — "Simpan & Buat Lagi" (immediate, high impact)

**The single highest-ROI change.** Solves the live rush scenario completely.

Implementation:
1. Add `handleSaveAndNew()` in `OrderForm.tsx` — same save logic, but resets form instead of `router.push()`
2. Add second button "Simpan & Buat Lagi" next to "Buat Pesanan"
3. Show success toast with order summary after each save
4. Show subtle running counter: "3 pesanan tercatat"
5. Auto-focus back to item name input after reset
6. Item suggestions cache warms up across orders (already works)

**Impact:** 50 interactions → 20 for 10 orders. **60% reduction.** Zero learning curve.

**Why this wins:**
- ~30 lines of code change
- Zero new pages or components
- Users keep ALL features (customer, payment, discount, notes, AI paste)
- Matches warung rush pattern: take order → save → next customer
- Zero new concepts to learn

### Phase 2 — Enhanced Batch Page (later)

For the batch catch-up scenario:
1. Add manual "Tambah Pesanan" button to batch review step
2. Allow editing parsed orders in `BatchOrderCard` (customer, items, payment)
3. Allow setting payment status per order (currently hardcoded `paid_amount: 0`)
4. Keep AI paste as primary entry, manual add as supplement

This makes batch page handle both AI-parsed and manually-added orders.

### Phase 3 — Bulk Status/Payment Update (future)

For end-of-day reconciliation:
1. Long-press or checkbox select on `OrderList`
2. Bottom action bar: "Tandai Lunas" / "Ubah Status" for selected orders
3. Bulk operations via single API call

---

## 6. Why NOT Quick Entry or Manual Batch

From psychology research:

> "Every additional screen, button, or concept multiplies perceived complexity. UMKM users don't compare features, they compare feelings."

"Simpan & Buat Lagi" adds **zero new concepts**. It's the same form with one new button.

Quick Entry would force users to choose between two forms — that's a decision, and decisions are friction. The research on "WhatsApp Dependency Paradox" shows users want the tool to feel as simple as sending a WA message, not to present options.

Manual Batch Entry sounds logical but fails the real-world test: a warung owner during lunch rush can't plan ahead. They don't know how many orders they'll get. They need record-and-go, one at a time, fast.

---

## 7. Technical Notes

### Files to modify (Phase 1)

- `features/orders/components/OrderForm.tsx` — add `handleSaveAndNew()`, second button, session counter
- No new files needed
- No API changes needed — uses existing `createOrder()` service

### Key code references

- Save + redirect: `OrderForm.tsx:325-348`
- Form state declarations: `OrderForm.tsx:29-61`
- Batch hardcoded payment: `BatchOrderForm.tsx:139-145`
- Order service: `features/orders/services/order.service.ts:155-241`
- Order list FABs: `OrderList.tsx:261-272`

### Considerations

- First-order celebration modal (`OrderForm.tsx:338-341`) should only trigger on the very first order, not on subsequent "Save & New" orders — already handled by `ordersUsedBefore === 0` check
- Item suggestions cache (`order.service.ts:69-134`) should be cleared after each save so new items appear in suggestions — `clearItemSuggestionsCache()` already exists
- Quota check (`checkOrderLimit()`) should run before each save, not just once per session

---

*References: `~/demand/psychology/umkm.md`, `~/demand/psychology/fnb-katering-bakery.md`, `~/demand/psychology/indonesia.md`, `~/demand/insights/umkm-insights.md`, `~/demand/insights/fnb-katering-bakery-insights.md`, `~/demand/insights/patterns.md`*
