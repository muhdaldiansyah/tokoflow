# Preorder Feature Analysis — CatatOrder

> Deep-dive research & recommended approach for adding preorder capability
> Date: 2026-03-10

---

## Table of Contents

1. [Research Sources](#1-research-sources)
2. [What is "Preorder" in UMKM Context?](#2-what-is-preorder-in-umkm-context)
3. [Current System State](#3-current-system-state)
4. [Chain of Thought: Approach Options](#4-chain-of-thought-approach-options)
5. [Recommended Approach](#5-recommended-approach)
6. [Detailed Design](#6-detailed-design)
7. [Implementation Plan](#7-implementation-plan)
8. [Edge Cases & Risks](#8-edge-cases--risks)

---

## 1. Research Sources

Detailed findings from 4 parallel research agents:
- `04-preorder-research-settings.md` — Settings page structure, profile fields
- `04-preorder-research-public-order.md` — Public order form, success page, live page, QRIS flow
- `04-preorder-research-order-list.md` — Order list, types, cards, badges, swipe, filtering
- `04-preorder-research-order-creation.md` — Order creation flows (3 sources), DB functions, stock

---

## 2. What is "Preorder" in UMKM Context?

For CatatOrder's target users (katering, kue, makanan rumahan), "preorder" means:

> **Pelanggan memesan sekarang, untuk dikirim/diambil di tanggal tertentu di masa depan.**

Key characteristics:
- **Pembayaran TIDAK langsung** — pelanggan belum perlu bayar saat pesan (DP opsional, atau bayar saat ambil)
- **Produksi belum dimulai** — penjual baru produksi setelah mengumpulkan cukup pesanan atau mendekati tanggal
- **Tanggal pengiriman adalah WAJIB** — bukan opsional seperti pesanan biasa
- **Stok tidak berkurang langsung** — pesanan dihitung sebagai "komitmen" bukan "penjualan aktif"

Real-world examples:
- "Pre-order kue kering lebaran, ambil H-3" (seasonal)
- "PO nasi box untuk acara Jumat depan" (event-based)
- "PO brownies batch Minggu ini, pickup Sabtu" (weekly batch)

---

## 3. Current System State

### What Already Exists

| Feature | Status | Notes |
|---------|--------|-------|
| `delivery_date` field on orders | ✅ Exists | Optional date picker, stored as timestamptz |
| Delivery date on public form | ✅ Exists | Optional input, min = today |
| Delivery date display on success page | ✅ Exists | Shown in order summary |
| Delivery date display on live page (`/r/[id]`) | ✅ Exists | Shown with icon |
| QRIS payment after ordering | ✅ Exists | Shown on success + live page |
| "Sudah Bayar" claim flow | ✅ Exists | Customer claims → seller confirms |
| `order_form_enabled` toggle in settings | ✅ Exists | Pattern for adding more toggles |
| `menunggu` status precedent | ✅ Exists | Model for special non-flow statuses |
| Source tracking (manual/order_link/whatsapp) | ✅ Exists | Differentiates order origins |

### What's Missing for Preorder

| Feature | Status | Notes |
|---------|--------|-------|
| Preorder toggle in settings | ❌ Missing | No way for seller to enable/disable |
| Preorder identification on orders | ❌ Missing | No `is_preorder` flag or `order_type` field |
| Delivery date REQUIRED (not optional) | ❌ Missing | Currently always optional |
| QRIS hidden for preorder | ❌ Missing | Currently always shown if available |
| Preorder badge on order cards | ❌ Missing | No visual distinction |
| Preorder filter in order list | ❌ Missing | Can't filter preorder vs regular |
| Preorder-specific messaging | ❌ Missing | Success page, live page, WA messages |
| Stock reservation logic | ❌ Missing | Stock decrements immediately |

---

## 4. Chain of Thought: Approach Options

### Step 1: How should preorder be identified?

**Option A: New `order_type` field (enum: 'regular' | 'preorder')**
- ✅ Explicit, no ambiguity
- ✅ Extensible (could add 'catering', 'wholesale' later)
- ❌ New DB column + migration
- ❌ Need to set it at creation time from all 3 sources

**Option B: Derive from `delivery_date` (if delivery_date > today + N days → preorder)**
- ✅ No new DB column
- ✅ Works with existing data
- ❌ Ambiguous — what threshold? 1 day? 3 days?
- ❌ Same-day delivery vs no-delivery-date both = "regular"?
- ❌ A delivery date tomorrow could be regular OR preorder — context-dependent

**Option C: Boolean `is_preorder` flag on orders**
- ✅ Simple, explicit
- ✅ Easy to query/filter
- ❌ New DB column
- ❌ Less extensible than enum

**Option D: Seller-level setting only — ALL orders from link toko become preorder when enabled**
- ✅ Simplest implementation
- ✅ Matches real UMKM pattern (sellers often switch modes: "bulan ini PO only")
- ❌ Can't mix regular + preorder simultaneously
- ❌ Too restrictive for sellers who want both

**→ DECISION: Option A (`order_type` enum) is cleanest, BUT for v1 simplicity we combine Option C + D:**
- **Seller enables "Mode Pre-order" in settings** → stored as `preorder_enabled` on profiles
- **When enabled, public order form delivery_date becomes REQUIRED**
- **Orders created while preorder is enabled get `is_preorder: true`**
- **Manual dashboard orders can also be marked as preorder**

Wait — let me reconsider. This is overengineered. Let me think about what the UMKM seller actually needs.

### Step 2: What does the seller actually want?

The seller's mental model is simple:
1. "Saya mau buka pre-order untuk minggu depan"
2. "Pelanggan pesan sekarang, ambil nanti"
3. "Jangan minta bayar dulu, bayar nanti pas ambil" (OR "minta DP dulu")
4. "Saya mau lihat ada berapa PO masuk"

They DON'T think about:
- Database schemas
- Order type enums
- Complex stock reservation

### Step 3: What does the customer need to see differently?

Currently after ordering:
1. Success page shows QRIS → customer feels they need to pay NOW
2. Live page shows QRIS → reinforces "pay now" expectation

For preorder:
1. Success page should say "Pre-order kamu tercatat!" — NOT "Pesanan masuk!"
2. **NO QRIS shown** — payment is deferred (bayar saat ambil/kirim, or DP via WA)
3. Show delivery date prominently — "Ambil: Sabtu, 15 Maret 2026"
4. Show "Hubungi Penjual" for payment arrangement (DP etc.)
5. Live page: same — no QRIS, show preorder messaging

### Step 4: What about the order list?

Seller needs to:
1. **See which orders are preorder** — visual badge/chip
2. **Filter preorder orders** — especially to plan production
3. **Group by delivery date** — "berapa pesanan untuk Sabtu?"

The simplest approach: a "Pre-order" badge on the OrderCard + filter chip.

### Step 5: What about stock?

Two scenarios:
- **Made-to-order products (stock = null):** No stock issue. Preorder just means "make it later."
- **Stock-tracked products (stock = number):** Tricky. Should preorder decrement stock?

For v1: **Don't decrement stock for preorder.** Rationale:
- UMKM preorders are mostly made-to-order (kue, katering)
- Stock-tracked products with preorder is an edge case
- Complexity of "reservations" is too high for v1
- Seller can manually manage production quantities

### Step 6: What's the minimal viable preorder?

After all analysis, the **simplest approach that solves the real problem:**

> **A toggle in settings that changes the public order form behavior:**
> 1. Delivery date becomes **required** (not optional)
> 2. QRIS is **hidden** on success + live page
> 3. Orders get tagged `is_preorder: true`
> 4. Different messaging on success/live pages
> 5. "Pre-order" badge on OrderCard in dashboard
> 6. Filter chip in order list

That's it. No new status. No stock reservation. No complex logic.

---

## 5. Recommended Approach

### "Mode Pre-order" — Toggle in Pengaturan

**Philosophy:** CatatOrder is about simplicity. Preorder should be a MODE the seller toggles, not a complex parallel system.

### How it works:

```
Seller enables "Mode Pre-order" in Pengaturan
        ↓
Public order form: delivery date becomes REQUIRED, label changes
        ↓
Customer orders: no QRIS shown, "Pre-order tercatat!" messaging
        ↓
Dashboard: orders tagged with "Pre-order" badge
        ↓
Seller processes order normally (status flow same as regular)
        ↓
When approaching delivery date, seller contacts customer for payment
```

### Why this approach wins:

1. **Minimal DB changes** — 1 field on `profiles` (`preorder_enabled`), 1 field on `orders` (`is_preorder`)
2. **No new status** — Preorder follows the same Baru → Diproses → Dikirim → Selesai flow
3. **No stock complexity** — Stock doesn't change for preorder v1
4. **Familiar pattern** — Same toggle UX as `order_form_enabled`
5. **Reversible** — Seller can toggle off anytime, existing preorders stay tagged
6. **Both modes simultaneously from dashboard** — Only link toko is affected by the toggle. Dashboard manual orders can individually be marked as preorder via checkbox

---

## 6. Detailed Design

### 6.1 Database Changes

```sql
-- Migration 033: preorder support
ALTER TABLE profiles ADD COLUMN preorder_enabled BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN is_preorder BOOLEAN DEFAULT false;

-- Index for filtering
CREATE INDEX idx_orders_is_preorder ON orders (user_id, is_preorder) WHERE is_preorder = true;
```

### 6.2 Settings Page (Pengaturan)

**Location:** After "Link Pesanan" section, before "Kuota Pesanan"

```
┌─────────────────────────────────────────┐
│ 📦 MODE PRE-ORDER                [toggle]│
│                                          │
│ Aktifkan pre-order di link toko.         │
│ Pelanggan wajib pilih tanggal            │
│ pengiriman dan pembayaran QRIS           │
│ tidak ditampilkan.                       │
│                                          │
│ (if enabled)                             │
│ ℹ️ Pesanan dari link toko akan           │
│   ditandai sebagai pre-order             │
└──────────────────────────────────────────┘
```

**Implementation:** Same pattern as `handleToggleOrderForm()` — update `profiles.preorder_enabled`.

### 6.3 Public Order Form (`/pesan/[slug]`)

**When preorder_enabled = true:**

| Element | Regular | Preorder |
|---------|---------|----------|
| Page subtitle | "Pesan sekarang, langsung masuk!" | "Pre-order sekarang!" |
| Delivery date | Optional | **Required** (with label "Tanggal pengiriman / pengambilan *") |
| Date min | Today | Tomorrow (or configurable) |
| Submit button | "Kirim Pesanan" | "Kirim Pre-order" |

**Data flow:** Form sends `is_preorder: true` in request body when `preorder_enabled` is active.

### 6.4 Success Page

**When is_preorder = true:**

```
┌─────────────────────────────────┐
│     ✅ Pre-order tercatat!       │
│                                  │
│ Pesanan kamu sudah dicatat.      │
│ Penjual akan menghubungi kamu    │
│ untuk konfirmasi dan pembayaran. │
│                                  │
│ 📋 WO-20260315-0001    [copy]   │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Ringkasan Pre-order          │ │
│ │ 📅 Ambil: Sabtu, 15 Mar 2026│ │
│ │ • Kue Coklat x5   Rp150.000 │ │
│ │ • Kue Keju x3     Rp120.000 │ │
│ │ Total: Rp270.000             │ │
│ └──────────────────────────────┘ │
│                                  │
│ ❌ NO QRIS SECTION              │
│                                  │
│ [💬 Hubungi Penjual via WA]     │
│ [🔄 Pesan Lagi]                 │
└──────────────────────────────────┘
```

**Key changes:**
- Header: "Pre-order tercatat!" instead of "Pesanan masuk!"
- Message: Explains seller will contact for payment
- **QRIS section completely hidden**
- "Sudah Bayar" button removed
- "Hubungi Penjual" becomes primary CTA
- "Simpan Bukti Pesanan" still available (receipt without QRIS)

### 6.5 Live Order Page (`/r/[id]`)

**When is_preorder = true:**
- "Pre-order" badge next to status badge
- **QRIS section hidden**
- "Sudah Bayar" button hidden
- Show prominent delivery date
- "Hubungi Penjual" as primary action
- Status progress bar still works normally

### 6.6 Order Card (Dashboard)

**New badge on OrderCard row 3:**

```
sanji                                    33m lalu
kue coklat x5
Rp150.000    [Pre-order] [Baru] [Belum Bayar]
```

**Badge styling:**
- `Pre-order` chip: `bg-violet-50 text-violet-700 border-violet-200` (distinct from all existing colors)
- Positioned before status badge

### 6.7 Order List Filtering

**Add "Pre-order" chip to Aktif tab filters:**

```
Status: [Baru] [Diproses] [Dikirim] [Pre-order]
```

When "Pre-order" chip is selected, filter: `is_preorder = true AND status NOT IN (done, cancelled)`

### 6.8 Dashboard Manual Order (`/pesanan/baru`)

**Add optional checkbox:**
```
☐ Pre-order (tanggal pengiriman wajib diisi)
```

When checked:
- Delivery date becomes required
- Order created with `is_preorder: true`

### 6.9 WA Messages

**New WA message variant for preorder confirmation:**

```
*Pre-order Tercatat* ✅

Hai {customer}! Pre-order kamu sudah dicatat:

{items}

📅 Pengiriman: {delivery_date}
💰 Total: {total}

Kami akan hubungi kamu untuk konfirmasi pembayaran.

Terima kasih! 🙏

_Dibuat dengan CatatOrder — catatorder.id_
```

### 6.10 Rekap Integration

- Daily/monthly rekap: preorder orders counted normally in revenue
- Optional: "Pre-order" count in summary (e.g., "5 pre-order untuk minggu depan")
- Source breakdown already works (order_link/manual/whatsapp)

---

## 7. Implementation Plan

### Phase 1: Core (Minimal Viable Preorder)

| Step | Files to Change | Effort |
|------|----------------|--------|
| 1. DB migration | `supabase/migrations/033_preorder.sql` | Small |
| 2. Profile type | `features/receipts/types/receipt.types.ts` | Small |
| 3. Order type | `features/orders/types/order.types.ts` | Small |
| 4. Settings toggle | `app/(dashboard)/pengaturan/page.tsx` | Small |
| 5. Public form changes | `app/(public)/pesan/[slug]/PublicOrderForm.tsx` | Medium |
| 6. API route changes | `app/api/public/orders/route.ts` | Small |
| 7. Public order service | `lib/services/public-order.service.ts` | Small |
| 8. Success page | `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx` | Medium |
| 9. Live page | `app/(public)/r/[id]/page.tsx` + `ReceiptActions.tsx` | Medium |
| 10. OrderCard badge | `features/orders/components/OrderCard.tsx` | Small |

### Phase 2: Enhancements

| Step | Files to Change | Effort |
|------|----------------|--------|
| 11. Order list filter | `features/orders/components/OrderList.tsx` | Small |
| 12. Manual order checkbox | `app/(dashboard)/pesanan/baru/` | Small |
| 13. WA message variant | `lib/utils/wa-messages.ts` | Small |
| 14. Rekap preorder count | `features/recap/` | Small |
| 15. WA bot support | `lib/wa-bot/order-creator.ts` | Medium |

### Estimated total: ~15 files, no architectural changes

---

## 8. Edge Cases & Risks

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Seller toggles preorder OFF with pending preorders | Existing preorder orders keep `is_preorder: true`, new orders are regular |
| Customer tries to pay preorder via external means | Seller can still mark payment in dashboard (DP/Lunas) — works as-is |
| Preorder product runs out of stock | Stock NOT decremented for preorder (v1). Seller manages manually |
| Customer orders preorder with delivery_date = today | Form enforces min = tomorrow when preorder mode active |
| Menunggu + preorder overlap | Possible: quota-exceeded preorder gets `status: menunggu, is_preorder: true`. Both badges shown |
| WA bot order when preorder enabled | v1: WA bot creates regular orders. v2: bot asks for delivery date |

### Risks

| Risk | Mitigation |
|------|-----------|
| Seller forgets to toggle off preorder | Show "Mode Pre-order Aktif" indicator on dashboard header |
| Customer confused by no QRIS | Clear messaging: "Penjual akan hubungi untuk pembayaran" |
| Preorder orders inflate revenue metrics | They SHOULD count — it's committed revenue. Rekap already shows payment status |
| Stock oversold via preorder | v1 accepts this trade-off. Seller manages. v2 could add reservation |

### What We're NOT Doing (v1)

- ❌ Stock reservation/locking
- ❌ Automatic payment reminders for preorder
- ❌ Preorder deadline/cutoff dates
- ❌ Minimum order quantity for preorder batches
- ❌ Preorder-specific pricing
- ❌ Separate preorder catalog

These can all be v2+ enhancements based on user feedback.

---

## Summary

**The best approach is a simple "Mode Pre-order" toggle in Pengaturan** that:
1. Makes delivery date required on public order form
2. Hides QRIS on success + live pages
3. Tags orders as `is_preorder: true`
4. Shows "Pre-order" badge on dashboard order cards
5. Adds filter chip in order list

This is **minimal, reversible, and follows existing CatatOrder patterns** (similar to `order_form_enabled` toggle, `menunggu` status precedent). No new statuses, no stock complexity, no architectural changes.

---

*Research completed: 2026-03-10*
*Source files: 04-preorder-research-{settings,public-order,order-list,order-creation}.md*
