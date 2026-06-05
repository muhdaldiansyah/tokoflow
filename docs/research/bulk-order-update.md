# Bulk Order Update — Deep-Dive Analysis

> Decision research for solving the bulk order update problem in CatatOrder.
> Grounded in UMKM psychology research (`~/demand/psychology/`) and codebase analysis.

*Date: 2026-02-22*

---

## 1. The Problem

### Current flow to update 1 order (status or payment)

1. Open `/pesanan` (list page)
2. Tap order row → navigate to `/pesanan/[id]` (detail page, **read-only**)
3. Tap "Edit" button → navigate to `/pesanan/[id]/edit` (full form)
4. Scroll to payment toggle or status dropdown → make change
5. Tap "Simpan Perubahan" → saves → redirects back to detail page
6. Tap back → list page

**Result: 6 actions per order.** Updating 10 orders = **60 interactions.** Worse than the creation problem (was 50).

### Why it's especially painful

The detail page (`OrderDetail.tsx`) is **fully read-only** — it shows status stepper and payment badge but cannot change them. The edit page (`OrderForm.tsx`) loads the **entire form** (871 lines — items, customer, notes, discount, payment, status) just to flip one toggle or change one dropdown.

### Root cause in code

- `OrderDetail.tsx` has zero mutation actions for status/payment — only WA send, receipt, reminder, and edit link
- `OrderForm.tsx` is the only way to change status/payment, but it's a full form designed for item-level editing
- `OrderList.tsx` rows are plain `<Link>` elements to detail page — no inline actions
- No bulk/multi-select capability anywhere in the app

---

## 2. What Gets Updated in Bulk?

| Update type | Frequency | Bulk? | Example |
|-------------|-----------|-------|---------|
| Payment → Lunas | Very high | Yes | End-of-day cash reconciliation |
| Status → next step | High | Yes | Morning: mark all "Baru" as "Diproses" |
| Status → Selesai | High | Yes | After delivery batch returns |
| Payment → DP (partial) | Medium | No | Amount differs per order |
| Items/customer/notes | Low | No | Always order-specific |
| Cancel/delete | Low | No | Intentional, needs confirmation |

**Key insight: ~90% of bulk updates are exactly two operations:**
1. **"Tandai Lunas"** — set `paid_amount = total` for each order
2. **"Ubah Status"** — advance status to a specific step for each order

Both are simple field changes — no nested data, no variable amounts. Fundamentally different from bulk creation (which involves nested items per order).

---

## 3. When Does Bulk Update Happen?

From psychology research (`~/demand/psychology/fnb-katering-bakery.md`, `umkm.md`):

### Scenario A: End-of-day payment reconciliation (warung)

- Owner closes the register at 8–9pm
- Scrolls through today's orders
- Marks cash-paid orders as "Lunas" one by one
- Pattern: filter "Belum Bayar" or "Baru" → mark each/all as paid

### Scenario B: Morning batch processing (katering)

- Owner checks overnight WA orders
- Marks all "Baru" as "Diproses" to start cooking
- Pattern: filter "Baru" tab → change status for all

### Scenario C: Post-delivery confirmation

- Driver returns from deliveries
- Owner marks "Dikirim" orders as "Selesai"
- Pattern: filter "Kirim" tab → mark all as done

### Scenario D: Single quick update (throughout the day)

- Customer pays one order mid-day
- Owner just wants to mark that ONE order as "Lunas" — fast
- Pattern: see order → update immediately, no extra navigation

---

## 4. All Solutions Evaluated

### Option A: Multi-Select Mode (WhatsApp-style)

Long-press order → checkboxes appear → select multiple → bottom action bar with bulk actions.

**Flow:** Long-press → tap orders → tap "Tandai Lunas" or "Ubah Status" = **3 steps for N orders.**

| Aspect | Assessment |
|--------|-----------|
| Steps for 10 orders | 3 (enter select → tap 10 → action) |
| Mobile (375px) | Good — bottom bar is thumb-reachable |
| Familiar pattern | Very high — WhatsApp delete/forward uses this exact pattern |
| "Ribet" threshold | Low — known interaction |
| Handles payment | Yes — "Tandai Lunas" for all selected |
| Handles status | Yes — "Ubah Status → [pick]" for all selected |
| Handles one-off | No — overkill for single order |
| Development cost | Medium — new select state, bottom bar, bulk service |

**Risk:** Long-press discovery — UMKM users may not know to long-press. But WhatsApp has trained this behavior in 200M+ Indonesian users.

### Option B: Inline Swipe Actions on Order Rows

Swipe left on order row → reveals action buttons ("Lunas", "Proses").

| Aspect | Assessment |
|--------|-----------|
| Steps for 10 orders | 20 (swipe + tap × 10) |
| Mobile (375px) | Risky — swipe conflicts with iOS back gesture |
| Familiar pattern | Medium — email apps use this, UMKM users less familiar |
| "Ribet" threshold | Medium — hidden actions = discovery problem |
| Handles bulk | No — still one at a time |
| Development cost | Medium |

**Verdict:** Solves one-off but not bulk. Swipe gesture is unreliable on mobile.

### Option C: Tap Status Badge to Advance

Tap the status badge in OrderList → advances to next status. Tap payment label → toggles Lunas.

| Aspect | Assessment |
|--------|-----------|
| Steps for 10 orders | 10 (one tap each) |
| Mobile (375px) | Poor — status badge is ~24px, below 44px min touch target |
| Familiar pattern | Low — not standard, needs teaching |
| "Ribet" threshold | Low per tap, but 10 taps is still friction |
| Handles bulk | No — still one at a time |
| Accidental tap risk | High — no confirmation, irreversible |
| Reversibility | Poor — can't undo |
| Development cost | Low |

**Verdict:** Fast for singles but risky (accidental taps, tiny touch target) and not truly bulk.

### Option D: Quick Actions on Order Detail Page

Add "Tandai Lunas" and "→ [Next Status]" buttons directly on the detail page. Skip the edit form for simple status/payment changes.

| Aspect | Assessment |
|--------|-----------|
| Steps for 1 order | 2 (tap row → tap action) |
| Steps for 10 orders | 30 (tap → action → back × 10) |
| Mobile (375px) | Good |
| Familiar pattern | High — button is visible and self-explanatory |
| Handles bulk | No — still navigate to each order |
| Development cost | Low (~40 lines) |

**Verdict:** Reduces single-order from 6 to 2 actions. Great complement but doesn't solve bulk.

### Option E: Filter + Bulk Action Header

Use existing status filter tabs. Add "Tandai Semua Lunas" or "Proses Semua" button when a filter is active.

| Aspect | Assessment |
|--------|-----------|
| Steps for all filtered | 2 (filter + action) |
| Mobile (375px) | Good |
| Flexibility | Poor — all or nothing, can't cherry-pick |
| Danger | High — "Proses Semua" on 50 orders by accident? |
| Development cost | Low |

**Verdict:** Very efficient for "process ALL" scenarios but too blunt. What if 8 of 10 "Baru" orders should be processed but 2 shouldn't?

### Option F: Multi-Select + Quick Detail Actions (Hybrid)

Combine Option A (multi-select for bulk) with Option D (quick actions on detail page for singles).

- **Bulk path:** Long-press on list → select → bottom bar actions
- **Single path:** Tap order → detail page has "Tandai Lunas" / "→ [Next Status]" button

| Aspect | Assessment |
|--------|-----------|
| Steps for bulk (10) | 3 (long-press → select 10 → action) |
| Steps for single (1) | 2 (tap row → tap quick action) |
| Mobile (375px) | Good for both paths |
| Covers all scenarios | Yes — bulk AND single |
| Development cost | Medium |
| "Ribet" threshold | Low — two familiar patterns |

---

## 5. Scoring Against Psychology Framework

Sources: `~/demand/psychology/umkm.md`, `fnb-katering-bakery.md`, `indonesia.md`; `~/demand/insights/patterns.md`, `umkm-insights.md`

| Criterion | A: Multi-Select | B: Swipe | C: Tap Badge | D: Quick Detail | E: Filter+Bulk | F: Hybrid |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| 3-step death line | Pass (3) | Fail (20) | Fail (10) | Fail (30) | Pass (2) | Pass (2–3) |
| Mobile-first 375px | Good | Risky | Poor (24px) | Good | Good | Good |
| WhatsApp familiarity | Very high | Low | Low | Medium | Low | High |
| Accidental tap safety | Good (confirm) | Medium | Poor | Good | Poor | Good |
| Covers bulk | Yes | No | No | No | Yes (blunt) | Yes |
| Covers single | No | Yes | Yes | Yes | No | Yes |
| Development cost | Medium | Medium | Low | Low | Low | Medium |
| Discovery | Long-press | Hidden | Non-obvious | Visible | Visible | Mixed |

---

## 6. Decision: Option F (Hybrid), 2 Sub-Phases

### Phase 2a — Quick Actions on Order Detail (low effort, immediate value)

Add action buttons directly on `OrderDetail.tsx` that skip the edit form:

1. **"Tandai Lunas"** button — visible when `payment_status !== "paid"` and `status !== "cancelled"`. One tap: sets `paid_amount = total`, derives new payment_status, refreshes view.
2. **"→ Diproses" / "→ Dikirim" / "→ Selesai"** button — shows the NEXT status in the flow. One tap: advances status via `updateOrderStatus()`, refreshes view.

**Impact:** Single-order update reduced from 6 actions to 2.

**Why this first:**
- Lowest development cost (~40 lines in `OrderDetail.tsx`)
- Highest daily usage — most updates throughout the day are single orders
- No new UI patterns — just buttons, same as existing "Kirim WA" / "Struk" buttons
- Uses existing service functions: `updateOrderStatus()`, `recordPayment()` or direct `updateOrder()`
- Zero new pages, components, or API routes

**Files to modify:**
- `features/orders/components/OrderDetail.tsx` — add status advance + payment buttons in action row

### Phase 2b — Multi-Select on Order List (medium effort, bulk value)

Add WhatsApp-style multi-select to `OrderList.tsx`:

1. **Enter select mode:** Long-press any order row → checkboxes appear on all rows, bottom action bar slides up, header shows "X dipilih"
2. **Select orders:** Tap rows to toggle selection. Counter updates: "5 dipilih"
3. **Bulk actions (bottom bar):**
   - **"Tandai Lunas"** — sets `paid_amount = total` for all selected orders
   - **"Ubah Status"** — opens a small bottom-sheet picker (Diproses/Dikirim/Selesai), applies to all selected
4. **Exit select mode:** Tap "X" button in header, or tap back, or after action completes
5. **Success feedback:** Toast with count: "5 pesanan ditandai lunas"

**Impact:** Bulk update reduced from 60 actions to 3 for 10 orders. **95% reduction.**

**Why multi-select works for UMKM:**
- WhatsApp has trained 200M+ Indonesian users on long-press → select → action
- Bottom action bar is thumb-reachable on 375px screens
- 3 steps for N orders — stays within the 3-step death line
- Arbitrary selection — not all-or-nothing like filter+bulk
- Confirmation via toast — prevents accidents, allows mental undo

**Files to modify:**
- `features/orders/components/OrderList.tsx` — add select mode state, checkboxes, bottom bar
- `features/orders/services/order.service.ts` — add `bulkUpdatePayment(ids[])` and `bulkUpdateStatus(ids[], status)` functions
- No new pages or API routes needed — can use existing client-side Supabase

**Implementation considerations:**
- Select mode should use `Set<string>` for selected IDs (O(1) lookup)
- Long-press detection: `onTouchStart` + `setTimeout(500ms)` + cancel on `onTouchEnd/Move`
- Desktop alternative: show checkbox on hover, or use Ctrl+click
- Bottom bar should be `fixed bottom-0` with `backdrop-blur-lg` (same pattern as batch footer)
- FABs (create + batch) should hide when select mode is active
- Pagination: selected IDs persist across "Load More" loads
- Status picker: reuse `ORDER_STATUS_FLOW` array, show as bottom-sheet on mobile
- Edge case: if selected orders span different statuses, "Ubah Status" still works — each gets set to the chosen status

---

## 7. Why NOT Other Options

**Swipe actions:** iOS back gesture conflict on mobile Safari. Hidden gestures = undiscoverable for UMKM users. Not bulk.

**Tap badge:** Status badge is 24px — below 44px minimum touch target. No confirmation = accidental state changes on every mis-tap. Not reversible. Not bulk.

**Filter + bulk all:** Too dangerous — "Proses Semua" on 47 orders when you meant 5 is catastrophic. No cherry-pick ability. The research says: "UMKM users fear irreversible actions — any hint of 'all at once' without clear selection triggers anxiety."

**Tap badge + multi-select combined:** If badge is tappable AND row is selectable, which tap does what? Adds cognitive load. Better to keep list rows as navigation-only (normal) or selection-only (select mode). Clear modes = clear behavior.

---

## 8. Summary: Full Phase Roadmap

| Phase | What | Steps | Effort | Solves |
|-------|------|-------|--------|--------|
| 1 (done) | "Simpan & Buat Lagi" on OrderForm | 2 per order | Low | Rapid-fire order creation |
| 2a | Quick actions on OrderDetail | 2 per order | Low | Single order status/payment update |
| 2b | Multi-select on OrderList | 3 for N orders | Medium | Bulk status/payment update |

**Combined impact across all phases:**
- Bulk creation: 50 → 20 interactions (60% reduction)
- Single update: 6 → 2 interactions (67% reduction)
- Bulk update (10 orders): 60 → 3 interactions (95% reduction)

---

## 9. Technical Reference

### Existing service functions (reusable)

```typescript
// order.service.ts — already exists
updateOrderStatus(id, status)    // Status change + timestamps
recordPayment(id, amount)        // Increment paid_amount, derive status
updateOrder(id, updates)         // Full update with customer stats
```

### Order status flow

```
new → processed → shipped → done
                              (cancelled is outside flow)
```

### Payment derivation

```typescript
// order.types.ts — derivePaymentStatus()
paid_amount >= total && total > 0  → "paid"
paid_amount > 0                    → "partial"
else                               → "unpaid"
```

### Key code references

- Order detail actions: `OrderDetail.tsx:234-268` (action buttons row)
- Order list rows: `OrderList.tsx:199-257` (order card links)
- Order list FABs: `OrderList.tsx:261-272` (create + batch FABs)
- Status types: `order.types.ts:6-7` (OrderStatus, PaymentStatus)
- Status flow: `order.types.ts:61` (ORDER_STATUS_FLOW)
- Status labels: `order.types.ts:45-51` (ORDER_STATUS_LABELS)

---

*References: `~/demand/psychology/umkm.md`, `~/demand/psychology/fnb-katering-bakery.md`, `~/demand/psychology/indonesia.md`, `~/demand/insights/umkm-insights.md`, `~/demand/insights/fnb-katering-bakery-insights.md`, `~/demand/insights/patterns.md`*
