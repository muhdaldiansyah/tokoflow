# Preorder Comprehensive Approach — CatatOrder

> Chain-of-thought deep dive analysis for preorder-first design
> Date: 2026-03-10

---

## Chain of Thought

### Step 1: Who is the main market?

CatatOrder's target: **katering, kue, makanan rumahan UMKM** yang terima pesanan lewat WhatsApp.

Every single order pattern in this market is inherently preorder:
- "PO kue kering lebaran, ambil H-3"
- "Pesan nasi box 50 untuk acara Jumat"
- "Brownies batch minggu ini, pickup Sabtu"
- "Kue coklat 5 buat besok"

Even the current test user (Toko Aldi) sells **kue** — which is made-to-order. The customer orders now, the seller bakes, the customer picks up later.

**Conclusion: Preorder IS the default use case. Not a special mode.**

---

### Step 2: What's wrong with the current defaults?

| Current Default | Problem for Main Market |
|---|---|
| Delivery date **optional** | Seller NEEDS to know "kapan" — without delivery date, they can't plan production. Currently most customers skip it because it's marked "(opsional)" |
| QRIS shown **immediately** after order | Customer feels pressured to pay NOW. But for preorder, payment is typically later — DP via WA, or bayar saat ambil. Showing QRIS creates wrong expectation |
| Success page says "Pesanan masuk!" | Doesn't communicate that this is a preorder — customer doesn't know what happens next |
| No preorder badge on dashboard | Seller can't distinguish "pesanan hari ini" from "PO untuk minggu depan" at a glance |

**Conclusion: Current defaults serve instant-order (warung makan) but not our actual market.**

---

### Step 3: Should we add a "Mode Pre-order" toggle, or just change defaults?

**Option A: Just change defaults (no toggle)**
- Make delivery_date required, hide QRIS
- Pro: Simplest. No new settings.
- Con: Sellers who want instant QRIS payment can't get it back
- Con: No way to identify which orders are preorder in dashboard

**Option B: "Mode Pre-order" toggle, default ON**
- Single toggle in Pengaturan that changes behavior
- Pro: Seller can toggle off for instant mode
- Pro: Orders tagged `is_preorder: true` for identification
- Con: One more setting to understand

**Option C: Two separate settings**
- "Wajibkan tanggal pengiriman" + "Tampilkan QRIS setelah pesan"
- Pro: Maximum flexibility
- Con: Too granular for UMKM. Two decisions instead of one.

**→ Decision: Option B.** Single "Mode Pre-order" toggle, default ON for new users.

Rationale: UMKM sellers think in one mode — "saya buka PO" or "saya terima pesanan biasa". One toggle matches their mental model. And it bundles the two UX changes (required date + hidden QRIS) into one understandable action.

---

### Step 4: What does "Mode Pre-order ON" actually change?

| Aspect | Pre-order ON (default) | Pre-order OFF |
|---|---|---|
| **Public form subtitle** | "Pre-order sekarang!" | "Pesan sekarang, langsung masuk!" |
| **Delivery date** | **Required**, label: "Tanggal pengiriman / pengambilan *" | Optional, label: "(opsional)" |
| **Date minimum** | Tomorrow | Today |
| **Submit button** | "Kirim Pre-order" | "Kirim Pesanan" |
| **Success header** | "Pre-order tercatat!" | "Pesanan masuk!" |
| **Success message** | "Penjual akan menghubungi kamu untuk konfirmasi dan pembayaran" | (none — QRIS speaks for itself) |
| **QRIS on success page** | **Hidden** | Shown (if seller has QRIS) |
| **"Sudah Bayar" button** | **Hidden** | Shown |
| **Primary CTA** | "Hubungi Penjual via WA" | "Sudah Bayar" |
| **Receipt PNG** | Without QRIS image | With QRIS image |
| **Live page (`/r/[id]`)** | QRIS hidden, "Hubungi Penjual" primary | QRIS shown, "Sudah Bayar" primary |
| **Order tagged** | `is_preorder: true` | `is_preorder: false` |
| **Dashboard form** | Delivery date auto-expanded | Delivery date collapsed (current) |
| **OrderCard badge** | Violet "Pre-order" chip | No chip |

---

### Step 5: Do we need `is_preorder` on orders?

**Yes**, because:
1. Seller might toggle preorder on/off over time → need to know which orders were PO
2. OrderCard needs a field for the badge: `{order.is_preorder && <Badge />}`
3. Filter chip needs a field: `query.eq('is_preorder', true)`
4. Rekap could show "X pre-order, Y regular" breakdown
5. WA message template differs for preorder vs regular

**How it's set:**
- Public orders: `is_preorder = profile.preorder_enabled` at creation time
- Dashboard manual: seller has a "Pre-order" toggle button on the form
- WA bot: follows `profile.preorder_enabled` (v1)

---

### Step 6: Should preorder default be ON for existing users?

Current users: 1 (Toko Aldi — the developer, sells kue).

**Decision: Default ON for ALL users** (new and existing).

Rationale:
- Only 1 existing user, who is the developer asking for this feature
- Kue selling IS preorder
- If any future user needs instant mode, they toggle off

Migration: `ALTER TABLE profiles ADD COLUMN preorder_enabled BOOLEAN DEFAULT true;`

---

### Step 7: What about stock?

Current behavior:
- Public orders: stock decrements immediately (`public-order.service.ts:185-197`)
- Dashboard orders: stock NOT decremented
- WA bot: stock NOT decremented

For preorder:
- **Keep decrementing stock for public preorders.** Rationale: preorder still "claims" the product. If seller has 10 kue keju and 8 are pre-ordered, only 2 should show as available.
- **No reservation system.** Too complex for v1. Stock simply decrements as orders come in.
- **No change needed.** Current stock logic already works for preorder.

---

### Step 8: What about payment flow?

Preorder payment is typically:
1. **Bayar saat ambil** — most common for kue/katering
2. **DP dulu via WA** — seller requests DP, marks it in dashboard
3. **Transfer sebelum kirim** — seller sends payment details via WA

All of these work with the existing system:
- Seller marks DP/Lunas in dashboard edit page ✅
- "Ingatkan Bayar" WA button sends reminder ✅
- Payment status (Belum Bayar/DP/Lunas) tracked ✅

**Only change:** Don't push QRIS payment immediately after ordering. Let the seller control when/how payment happens.

The "Sudah Bayar" claim flow still works for non-preorder orders (when seller toggles preorder OFF).

---

### Step 9: What about the dashboard order form?

When seller creates a manual order with preorder default ON:
1. **Delivery date auto-expanded** — `setShowDelivery(true)` when profile has `preorder_enabled`
2. **"Pre-order" toggle button** — in the toolbar row (alongside Pelanggan, Tanggal, Catatan, Diskon)
3. **Default ON when profile.preorder_enabled is true** — seller can toggle off per-order
4. **Payment mode stays "unpaid"** — already the default, perfect for preorder

**Code change point:** `OrderForm.tsx` line 136-145 (profile load effect):
```tsx
if (profile.preorder_enabled) {
  setShowDelivery(true);
  setIsPreorder(true);
}
```

---

### Step 10: What about the order list?

**Badge:** Violet "Pre-order" chip on OrderCard row 3, before status badge
```
sanji                                    33m lalu
kue coklat x5
📅 Sabtu, 15 Mar
Rp150.000    [Pre-order] [Baru] [Belum Bayar]
```

**Filter:** Add "Pre-order" chip in filter area. Third dimension after Status and Bayar:
```
Pesanan: [Baru] [Diproses] [Dikirim] | Bayar: [Lunas] [DP] [Belum Bayar] | [Pre-order]
```

**No new tab.** Pre-order orders show in Aktif tab alongside regular orders. The filter chip is enough.

---

### Step 11: What about WA messages?

**New preorder confirmation template:**
```
*Pre-order Tercatat* ✅

Hai {customer}! Pre-order kamu sudah dicatat:

{items}
{paymentLine}
Total: Rp{total}

📅 Pengiriman: {delivery_date}

Kami akan hubungi kamu untuk konfirmasi pembayaran.

Terima kasih! 🙏

_Dibuat dengan CatatOrder — catatorder.id_
```

**Customer WA message (on success page, no QRIS):**
```
Halo, saya baru saja pre-order *{orderNumber}* di {businessName}.

{items}
Total: Rp{total}
📅 Pengiriman: {delivery_date}

Mohon konfirmasi pesanan saya. Terima kasih!
```

**Existing templates still work for non-preorder orders.**

---

### Step 12: What about the "Simpan Bukti Pesanan" receipt PNG?

When `is_preorder`:
- **Don't include QRIS image** in the PNG
- Include delivery date prominently
- Include text: "Pre-order — pembayaran saat pengambilan/pengiriman"

When NOT preorder:
- Include QRIS image (if available)
- Current behavior

**Code change point:** `SuccessActions.tsx` line 104: `if (qrisUrl)` → `if (qrisUrl && !isPreorder)`

---

### Step 13: What about the live order page (`/r/[id]`)?

When `is_preorder`:
- Show "Pre-order" badge next to status badge
- **Hide QRIS section** (ReceiptActions)
- **Hide "Sudah Bayar" button**
- Show "Hubungi Penjual via WA" as primary action
- Show delivery date prominently

**Code change points:**
- `page.tsx`: pass `is_preorder` to ReceiptActions
- `ReceiptActions.tsx` line 52: `{showPayment && qrisUrl && !paidConfirmed && !isPreorder && (`
- `ReceiptActions.tsx` line 98: `{showPayment && !qrisUrl && !paidConfirmed && !isPreorder && (`

---

### Step 14: What about rekap?

Minimal change for v1:
- Daily recap: count preorder orders separately in summary (e.g., "3 pre-order untuk besok")
- Monthly report: could add preorder breakdown

This is a v2 enhancement. Not blocking for v1.

---

### Step 15: Edge cases

| Scenario | Handling |
|---|---|
| Seller toggles preorder OFF while having pending preorders | Existing orders keep `is_preorder: true`. New orders from link toko become regular |
| Customer wants to pay preorder immediately | They can contact seller via WA (primary CTA). Seller marks DP/Lunas in dashboard |
| Seller wants DP for preorder | Seller contacts customer via WA, receives payment, marks DP in dashboard edit page |
| Preorder + menunggu (quota exceeded) | Both apply: `is_preorder: true, status: menunggu`. Both badges shown. Order activated when quota purchased |
| Delivery date is tomorrow but seller toggles preorder OFF today | The order was created as preorder, stays preorder. Toggle only affects NEW orders |
| Seller creates manual order and DOESN'T want it as preorder | Toggle off the "Pre-order" button on the form. `is_preorder: false` |
| QRIS not uploaded + preorder OFF | Same as current: "Hubungi via WA" button shown (no change needed) |
| QRIS uploaded + preorder ON | QRIS not shown on success/live page. QRIS still visible as trust signal badge on order form |

---

## Implementation Spec

### Database Migration (033)

```sql
-- profiles: preorder toggle (default ON for main market)
ALTER TABLE profiles ADD COLUMN preorder_enabled BOOLEAN DEFAULT true;

-- orders: preorder flag
ALTER TABLE orders ADD COLUMN is_preorder BOOLEAN DEFAULT false;

-- index for filtering
CREATE INDEX idx_orders_is_preorder ON orders (user_id, is_preorder) WHERE is_preorder = true;
```

### Files to Change

#### Phase 1: Core (Settings + Public Flow)

| # | File | Change | Lines |
|---|------|--------|-------|
| 1 | `features/receipts/types/receipt.types.ts` | Add `preorder_enabled?: boolean` to Profile | L57 |
| 2 | `features/orders/types/order.types.ts` | Add `is_preorder?: boolean` to Order + CreateOrderInput | L27, L43 |
| 3 | `features/receipts/services/receipt.service.ts` | Add `updatePreorderEnabled()` following `updateOrderFormEnabled` pattern | After L170 |
| 4 | `app/(dashboard)/pengaturan/page.tsx` | Add "Mode Pre-order" toggle section after Link Pesanan | After L479 |
| 5 | `lib/services/public-order.service.ts` | Add `preorder_enabled` to profile SELECT + pass to return. Set `is_preorder` on order insert | L37-38, L159 |
| 6 | `app/api/public/orders/route.ts` | Validate delivery_date required when preorder. Pass `isPreorder` to service | L101-108 |
| 7 | `app/(public)/pesan/[slug]/page.tsx` | Pass `preorderEnabled` to PublicOrderForm | L48-58 |
| 8 | `app/(public)/pesan/[slug]/PublicOrderForm.tsx` | Accept `preorderEnabled` prop, make delivery_date required, change labels | L10-20, L438-453 |
| 9 | `app/(public)/pesan/[slug]/sukses/page.tsx` | Pass `isPreorder` (from sessionStorage) to SuccessActions | L15-42 |
| 10 | `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx` | Hide QRIS when preorder, change header/messaging, modify receipt PNG | L104, L352, L403 |
| 11 | `app/(public)/r/[id]/page.tsx` | Fetch `is_preorder` from order, pass to ReceiptActions. Show badge | L45, L226 |
| 12 | `app/(public)/r/[id]/ReceiptActions.tsx` | Accept `isPreorder` prop, hide QRIS + "Sudah Bayar" when preorder | L52, L98 |

#### Phase 2: Dashboard

| # | File | Change | Lines |
|---|------|--------|-------|
| 13 | `features/orders/components/OrderCard.tsx` | Add violet "Pre-order" badge in row 3 | L128 |
| 14 | `features/orders/components/OrderList.tsx` | Add preorderFilter state + "Pre-order" chip | L56, L448 |
| 15 | `features/orders/components/OrderForm.tsx` | Add "Pre-order" toggle, auto-expand delivery, include in payload | L136-145, L636 |
| 16 | `features/orders/services/order.service.ts` | Add `is_preorder` to createOrder insert + `preorderOnly` filter | L183-275, L26-76 |

#### Phase 3: WA + Polish

| # | File | Change | Lines |
|---|------|--------|-------|
| 17 | `lib/utils/wa-messages.ts` | Add `buildPreorderConfirmation()` template | New function |
| 18 | `features/orders/components/WAPreviewSheet.tsx` | Use preorder template when `order.is_preorder` | Conditional |
| 19 | `lib/wa-bot/order-creator.ts` | Set `is_preorder` based on profile `preorder_enabled` | L70-86 |

### Settings UI Design

```
┌──────────────────────────────────────────────┐
│ 🔗 LINK PESANAN                      [toggle]│
│                                               │
│ catatorder.id/tokoaldi          [Simpan]      │
│ [Salin] [Bagikan via WA]       Preview >      │
│                                               │
│ ─────────────────────────────────────────     │
│                                               │
│ 📦 MODE PRE-ORDER                    [toggle] │
│                                               │
│ Pelanggan wajib pilih tanggal pengiriman.     │
│ Pembayaran QRIS tidak ditampilkan setelah     │
│ pesan — kamu yang atur kapan pelanggan bayar. │
│                                               │
│ ─────────────────────────────────────────     │
│                                               │
│ LENGKAPI TOKO (3 TERSISA)                     │
│ ...                                           │
└──────────────────────────────────────────────┘
```

**Toggle behavior:**
- ON (default): green `bg-warm-green`, toast "Mode pre-order diaktifkan"
- OFF: gray `bg-muted`, toast "Mode pre-order dinonaktifkan"
- Analytics: `track("preorder_mode_toggled", { enabled: newValue })`

### Public Form Changes

**When preorder_enabled:**

```diff
  <span className="text-sm text-muted-foreground mt-1">
-   Pesan sekarang, langsung masuk!
+   Pre-order sekarang!
  </span>

  <label>
    <span>Tanggal pengiriman / pengambilan</span>
-   <span className="text-muted-foreground/70">(opsional)</span>
+   <span className="text-destructive">*</span>
  </label>
  <input
    type="date"
    required={preorderEnabled}
-   min={today}
+   min={preorderEnabled ? tomorrow : today}
  />

  <button type="submit">
-   Kirim Pesanan
+   {preorderEnabled ? "Kirim Pre-order" : "Kirim Pesanan"}
  </button>
```

### Success Page Changes

**When isPreorder:**

```diff
  <h1>
-   Pesanan masuk!
+   Pre-order tercatat!
  </h1>

+ <p className="text-sm text-muted-foreground text-center">
+   Pesanan kamu sudah dicatat. Penjual akan menghubungi
+   kamu untuk konfirmasi dan pembayaran.
+ </p>

- {qrisUrl && !paidConfirmed && ( ... QRIS section ... )}
+ {qrisUrl && !paidConfirmed && !isPreorder && ( ... QRIS section ... )}

- {qrisUrl && paidConfirmed && ( ... confirmation ... )}
+ {qrisUrl && paidConfirmed && !isPreorder && ( ... confirmation ... )}

  {/* For preorder: "Hubungi Penjual" becomes primary */}
+ {isPreorder && businessPhone && (
+   <button onClick={handleWhatsApp}>
+     Hubungi Penjual via WA
+   </button>
+ )}

  {/* Receipt PNG: skip QRIS image for preorder */}
- if (qrisUrl) { ... draw QRIS ... }
+ if (qrisUrl && !isPreorder) { ... draw QRIS ... }
```

### OrderCard Badge

```tsx
// OrderCard.tsx, line 128 (row 3 badges)
<div className="flex items-center gap-1.5 flex-nowrap shrink-0">
  {order.is_preorder && (
    <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full
      border items-center bg-violet-50 text-violet-700 border-violet-200">
      Pre-order
    </span>
  )}
  <OrderStatusBadge status={order.status} />
  {paymentChip}
</div>
```

Visual result:
```
sanji                                 33m lalu
kue coklat x5
📅 Sabtu, 15 Mar
Rp150.000  [Pre-order] [Baru] [Belum Bayar]
```

---

## Summary

**One toggle. Better defaults. Same simplicity.**

| What | Decision |
|---|---|
| **Approach** | "Mode Pre-order" toggle in Pengaturan, default ON |
| **Default for new users** | ON (preorder is the main market) |
| **DB changes** | 2 fields: `profiles.preorder_enabled` (bool, default true) + `orders.is_preorder` (bool, default false) |
| **Public form** | Delivery date required, QRIS hidden after ordering |
| **Dashboard** | Violet "Pre-order" badge + filter chip |
| **Stock** | No change (still decrements — preorder claims the product) |
| **Payment** | No change to payment system. Seller manages via WA + dashboard |
| **Status flow** | No change. Preorder follows same Baru → Diproses → Dikirim → Selesai |
| **Scope** | 19 files, 0 architectural changes |

The seller's experience: toggle is already ON → share link → customers pre-order with delivery date → pesanan masuk with "Pre-order" badge → seller processes normally → contacts customer for payment when ready.

---

*Research completed: 2026-03-10*
*Based on: 8 deep-dive research files analyzing 20+ source files*
