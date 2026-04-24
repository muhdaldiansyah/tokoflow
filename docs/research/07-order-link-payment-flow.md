# Discussion: Dedicated Order Link as Payment Bridge

> Status: DRAFT — not decided yet. For discussion only.

---

## The Question

Each order already generates a unique link (`catatorder.id/r/{orderId}`). Should this become a **live order page** where customer and seller interact — instead of building a separate proof upload system?

---

## Current State

### What exists today

| Component | Current Behavior |
|-----------|-----------------|
| `/r/{orderId}` | Read-only receipt. Shows items, total, business name. No status, no actions. No auth required. |
| Success page (`/sukses`) | Shows order summary, QRIS, WA buttons. "Sudah Bayar" changes UI state locally (Phase 1). No backend effect. |
| WA message to seller | Contains receipt link + order details. Seller reads it manually. |
| Seller dashboard | Sees new orders via realtime notification. Must manually mark payment. |
| Payment verification | Entirely manual — seller checks bank app, then marks paid in dashboard. |

### The gap

After the success page, there's **no shared space** between customer and seller. The WA chat becomes the only communication channel. CatatOrder loses visibility into what happens after the order is placed.

---

## Proposed Concept: Upgraded Order Link

Turn `/r/{orderId}` from a static receipt into a **live order page** that both customer and seller can interact with.

### Customer view (`/r/{orderId}`)

```
┌─────────────────────────────────┐
│ [Logo] Katering Barokah         │
│                                 │
│ Pesanan WO-20260309-2029        │
│ Status: ● Diproses              │  ← live, updates in real-time
│                                 │
│ ─── Ringkasan ───               │
│ Nasi Box Ayam    x5   Rp125.000│
│ Air Mineral      x5    Rp25.000│
│ ────────────────────────────────│
│ Total              Rp150.000    │
│ Pembayaran:    Belum Bayar      │  ← or "Lunas ✓"
│                                 │
│ Pengiriman: Senin, 10 Maret     │
│ Catatan: Tidak pedas            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │    [✓] Sudah Bayar          │ │  ← customer taps this after paying
│ └─────────────────────────────┘ │
│                                 │
│ [💬 Hubungi Penjual via WA]    │
│ [🔄 Pesan Lagi]                │
│                                 │
│ Dibuat dengan CatatOrder        │
└─────────────────────────────────┘
```

### After customer taps "Sudah Bayar"

```
┌─────────────────────────────────┐
│ Pembayaran: ⏳ Menunggu          │
│             konfirmasi penjual   │
│                                 │
│ "Penjual akan mengecek          │
│  pembayaran kamu"               │
│                                 │
│ [💬 Konfirmasi via WA]          │
└─────────────────────────────────┘
```

### After seller confirms in dashboard

```
┌─────────────────────────────────┐
│ Pembayaran: ✅ Lunas             │
│                                 │
│ Status: ● Diproses              │
└─────────────────────────────────┘
```

### Seller dashboard notification

When customer taps "Sudah Bayar":
- Realtime toast: "Pelanggan bilang sudah bayar untuk WO-20260309-2029"
- Badge on the order card: "Pelanggan bilang sudah bayar"
- Seller taps → sees order detail → verifies in bank app → taps "Tandai Lunas"

---

## Technical Approach

### Database changes

New column on `orders` table:
```sql
ALTER TABLE orders ADD COLUMN payment_claimed_at timestamptz DEFAULT NULL;
```

- `NULL` = customer hasn't claimed payment
- Timestamp = customer tapped "Sudah Bayar" at this time

No new table needed. The existing `paid_amount` / payment status derivation handles the seller's side.

### API endpoint

```
POST /api/public/orders/{id}/claim-payment
```
- No auth required (public, same as order link)
- Sets `payment_claimed_at = NOW()`
- Rate-limited (1 claim per order)
- Returns updated order status

### Realtime notification to seller

Option A: Use existing Supabase realtime subscription on `orders` table. Seller's dashboard already listens for INSERT. Extend to listen for UPDATE where `payment_claimed_at` changes from NULL to a value.

Option B: Fire a Supabase realtime broadcast event (lighter weight, no DB polling).

### Upgraded `/r/[id]` page

- Fetch order with status, payment info, delivery date
- Show live status progress bar (Baru → Diproses → Dikirim → Selesai)
- Show payment status with "Sudah Bayar" button (if unpaid + not yet claimed)
- Show "Menunggu konfirmasi" state (if claimed but not yet paid)
- Show "Lunas" state (if paid_amount >= total)
- Optional: Supabase realtime subscription for live updates (customer sees status change without refresh)
- Link back to store (`/{slug}`) for reorder

### Success page changes

- "Sudah Bayar" on success page → redirect to `/r/{orderId}` (single source of truth)
- Or: success page "Sudah Bayar" calls same API, but the order link is the canonical place to check status

---

## Flow Comparison

### Current flow (after Phase 1)
```
Customer pays QRIS
    ↓
Taps "Sudah Bayar" on success page (UI-only, no backend)
    ↓
Taps "Konfirmasi via WA" → WA message to seller
    ↓
Seller reads WA → checks bank → marks paid in dashboard
    ↓
Customer has no visibility into whether seller confirmed
```

### Proposed flow
```
Customer pays QRIS
    ↓
Taps "Sudah Bayar" (on success page OR order link)
    ↓
Backend records claim → seller gets realtime notification
    ↓
Seller sees "Pelanggan bilang sudah bayar" badge → checks bank → taps "Tandai Lunas"
    ↓
Order link updates live → customer sees "Lunas ✓"
    ↓
(WA still available as fallback throughout)
```

---

## What This Replaces

| Original Phase 2 idea | Replaced by |
|------------------------|------------|
| Proof upload (screenshot) | "Sudah Bayar" claim (one tap, zero friction) |
| Auto bank mutation checking (Moota) | Not replaced — still a valid Phase 3+ option |
| npm dynamic QRIS conversion | Not replaced — still a valid independent improvement |
| Auto follow-up unpaid orders | Could integrate: if `payment_claimed_at` is set but `paid_amount` is still 0 after X hours, remind seller |

---

## Open Questions

1. **Should "Sudah Bayar" be on the success page, the order link, or both?**
   - Success page: customer is already there after ordering
   - Order link: customer can come back later after paying
   - Both: use same API, consistent state

2. **Should the order link require any verification?**
   - Currently: UUID is the only "auth" (hard to guess)
   - Risk: if someone gets the UUID, they can see order details
   - Mitigation: UUIDs are 128-bit random, practically unguessable
   - Alternative: add a short token/PIN to the URL

3. **Should the customer see real-time updates via Supabase realtime?**
   - Pro: instant "Lunas" confirmation without page refresh
   - Con: adds client-side Supabase dependency to public page (bundle size)
   - Middle ground: poll every 30 seconds, or just show static state

4. **Should we add a notification to the customer (WA) when seller confirms?**
   - Pro: closes the loop — customer knows for sure their payment is confirmed
   - Con: requires WA API integration for customer-facing messages (currently only seller-facing)
   - Alternative: customer just refreshes the order link

5. **npm dynamic QRIS — do this independently or together?**
   - The `@agungjsp/qris-dinamis` package can embed exact amount in the seller's static QRIS
   - No webhook, but better UX (customer sees correct amount)
   - Could be done as a quick win regardless of the order link decision

6. **What about the "Pesan Lagi" flow?**
   - Currently: links back to `/{slug}` (empty form, but name/phone pre-filled via localStorage)
   - Could improve: pre-fill cart with same items from this order
   - Independent of the order link decision

---

## Effort Estimate

| Component | Effort |
|-----------|--------|
| Add `payment_claimed_at` column (migration) | 30 min |
| `POST /api/public/orders/[id]/claim-payment` endpoint | 1 hour |
| Upgrade `/r/[id]` page (status bar, payment claim, styling) | 3-4 hours |
| Seller dashboard notification for payment claims | 1-2 hours |
| Connect success page "Sudah Bayar" to API | 30 min |
| Testing + edge cases | 1-2 hours |
| **Total** | **~1-1.5 days** |

---

## Decision needed

- [ ] Do we go with this approach (order link as payment bridge)?
- [ ] Or stick with original Phase 2 plan (proof upload)?
- [ ] Or skip both and go straight to dynamic QRIS via gateway API (Phase 3)?
- [ ] Or combine: order link + npm dynamic QRIS as Phase 2?

---

*Draft written 2026-03-09. For discussion — no implementation yet.*
