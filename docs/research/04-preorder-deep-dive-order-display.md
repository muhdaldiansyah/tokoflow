# Preorder Deep Dive: Order Display Analysis

> Detailed analysis of OrderList, OrderCard, OrderDetail, OrderForm (edit), and order service
> to understand how orders are displayed and how preorder identification could be integrated.

---

## 1. File Inventory — `features/orders/components/`

| File | Size | Purpose |
|------|------|---------|
| `OrderList.tsx` | 28KB, 689 lines | Main order list page with tabs, search, filters, realtime, bulk actions |
| `OrderCard.tsx` | 7KB, 209 lines | Individual order row in list (swipeable) |
| `OrderStatusBadge.tsx` | 932B, 25 lines | Colored status chip component |
| `OrderForm.tsx` | 56KB, ~1240 lines | Create + Edit order form (dual-purpose) |
| `OrderDetail.tsx` | 19KB, 476 lines | Read-only order detail view with quick actions |
| `HeroSummaryCell.tsx` | 2KB, 58 lines | Today summary card (pending count, revenue) |
| `SwipeConfirmModal.tsx` | 3KB, 88 lines | Bottom-sheet modal for swipe status change |
| `WAPreviewSheet.tsx` | 5.3KB | WA message preview before sending |
| `BatchOrderCard.tsx` | 3.9KB, 117 lines | Card for batch paste orders (not used in main list) |
| `OnboardingChecklist.tsx` | 3.4KB | New user checklist |
| `NudgeCard.tsx` | 2.3KB, 90 lines | Progressive disclosure nudge cards |
| `BeresCelebration.tsx` | 1.3KB, 42 lines | Full-screen "Beres!" animation |
| `InlineHint.tsx` | 654B, 28 lines | Dismissible hint text |
| `VoiceOrderSheet.tsx` | 13.8KB | Voice input sheet |
| `PasteOrderSheet.tsx` | 11.8KB | Paste order sheet |
| `ImageOrderSheet.tsx` | 13.6KB | Image/photo order sheet |
| `OrderReceiptPage.tsx` | 14KB | Receipt page for orders |

---

## 2. Order Type System (`order.types.ts`)

**File:** `features/orders/types/order.types.ts` (84 lines)

### Order Interface (lines 11-34)

```ts
export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
  notes?: string;
  source: OrderSource;
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_date?: string;       // <-- KEY FIELD for preorder
  payment_claimed_at?: string;
  proof_url?: string;
  shipped_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

**Key observations:**
- `delivery_date` is an optional string (ISO datetime)
- `source` is typed as `OrderSource = 'manual' | 'whatsapp' | 'order_link'`
- **No `is_preorder` field exists yet**
- **No `order_type` field exists yet**

### Status Constants (lines 48-66)

```ts
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Baru',
  menunggu: 'Menunggu',
  processed: 'Diproses',
  shipped: 'Dikirim',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const ORDER_STATUS_FLOW: OrderStatus[] = ['new', 'processed', 'shipped', 'done'];
```

**Critical:** `menunggu` is NOT in `ORDER_STATUS_FLOW`. This means:
- Cannot be swiped (swipe uses `ORDER_STATUS_FLOW`)
- Cannot be selected in edit mode status pills (edit uses `ORDER_STATUS_FLOW`)
- But IS rendered by `OrderStatusBadge` (has styling in badge component)

This is the exact precedent for how `preorder` could work -- a visual indicator that exists outside the main flow.

---

## 3. OrderCard — Visual Anatomy (`OrderCard.tsx`)

**File:** `features/orders/components/OrderCard.tsx` (209 lines)

### Props Interface (lines 9-22)

```ts
interface OrderCardProps {
  order: Order;
  selectMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onPointerDown: (id: string) => void;
  cancelLongPress: () => void;
  onClick: (id: string) => void;
  formatTime: (dateStr: string) => string;
  formatDeliveryDate: (dateStr: string) => string;  // <-- passed from OrderList
  onSwipeAdvance?: (order: Order) => void;
  onSwipeWA?: (order: Order) => void;
}
```

### Card Layout (lines 81-143 — `cardContent`)

**Row 1 (lines 96-104):** Customer name + relative time
```
[Customer Name]                    [3m lalu]
```

**Row 2 (lines 106-110):** Items summary (truncated)
```
Nasi Box x10, Snack Box x5
```

**Row 2b (lines 113-119):** Delivery date -- ONLY WHEN SET
```
📅 Hari ini 14:00
```

This is the delivery date display on OrderCard. It uses:
- `Calendar` icon from lucide (`w-3 h-3`)
- `text-xs text-warm-amber` color (amber/orange)
- `formatDeliveryDate()` function passed as prop from OrderList
- `mt-0.5` margin top

**Exact code (lines 113-119):**
```tsx
{order.delivery_date && (
  <p className="flex items-center gap-1 text-xs text-warm-amber mt-0.5">
    <Calendar className="w-3 h-3" />
    {formatDeliveryDate(order.delivery_date)}
  </p>
)}
```

**Spacer (line 121):** `<div className="h-1.5" />`

**Row 3 (lines 123-140):** Total + Badges
```
Rp150.000    [Baru] [Belum Bayar]
```

Badges shown:
1. **Status badge** (always): `<OrderStatusBadge status={order.status} />`
2. **Payment chip** (conditional, lines 73-79):
   - "Sudah Bayar?" — blue, when `payment_claimed_at` is set and payment_status !== "paid"
   - "DP Rp..." — amber, when partial
   - "Belum Bayar" — rose, when unpaid
   - `null` (not shown) when fully paid

**Source badge: DOES NOT EXIST on OrderCard.** Despite CLAUDE.md mentioning source badges in rekap, the OrderCard itself has NO source indicator. The `order.source` field is NOT rendered anywhere on the card.

### Swipe Behavior (lines 59-66)

```ts
const isDoneOrCancelled = order.status === "done" || order.status === "cancelled";

const { containerRef, handlers: swipeHandlers, isSwiping } = useSwipeGesture({
  onSwipeRight: () => onSwipeAdvance?.(order),
  onSwipeLeft: () => onSwipeWA?.(order),
  disabled: selectMode,
  disableRight: isDoneOrCancelled,  // <-- disables advance swipe for done/cancelled
});
```

**Swipe conditions:**
- Right swipe (advance status): disabled for `done` and `cancelled`
- Left swipe (WA): always enabled
- Both disabled in select mode

**`menunggu` status is NOT explicitly disabled for swipe**, but since `menunggu` is not in `ORDER_STATUS_FLOW`, `getNextStatus()` returns `null` for it (line 24-30), meaning the swipe right action label would be empty and `onSwipeRight` would still fire but `SwipeConfirmModal` would not render (line 662-675 in OrderList checks for `nextStatus`).

### Where a Preorder Badge Could Go

**Option A: After delivery date, before spacer (between lines 119-121)**
```
Nasi Box x10, Snack Box x5
📅 Besok 10:00
[Pre-order]                        <-- new badge here
```
Problem: This puts it in the middle content area, separate from other badges.

**Option B: In Row 3 badge group (line 128-139), before or after status badge**
```
Rp150.000    [Pre-order] [Baru] [Belum Bayar]
```
This is the most natural location. Add before `OrderStatusBadge`:
```tsx
{order.is_preorder && (
  <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-violet-50 text-violet-700 border-violet-200">
    Pre-order
  </span>
)}
<OrderStatusBadge status={order.status} />
```

**Option C: Replace/augment the delivery date line**
```
📅 Pre-order · Besok 10:00
```
Combine preorder indicator with delivery date in one line.

**Recommendation: Option B** — keeps badge pattern consistent with existing status/payment badges. The badge row already handles 2-3 chips; adding one more is natural.

---

## 4. OrderStatusBadge (`OrderStatusBadge.tsx`)

**File:** `features/orders/components/OrderStatusBadge.tsx` (25 lines)

```tsx
const STATUS_CHIP_STYLES: Record<OrderStatus, string> = {
  new: "bg-warm-blue-light text-warm-blue border-warm-blue/20",
  menunggu: "bg-amber-50 text-amber-600 border-amber-200",
  processed: "bg-warm-amber-light text-warm-amber border-warm-amber/20",
  shipped: "bg-warm-purple-light text-warm-purple border-warm-purple/20",
  done: "bg-warm-green-light text-warm-green border-warm-green/20",
  cancelled: "bg-warm-rose-light text-warm-rose border-warm-rose/20",
};
```

Badge dimensions: `h-6 px-2 text-[11px] font-medium rounded-full border`

**Color palette already used:**
- Blue: new
- Amber/Yellow: menunggu, processed
- Purple: shipped
- Green: done
- Rose/Red: cancelled

**Available colors for preorder badge:**
- **Violet/Purple** — distinct from shipped (which uses `warm-purple`). Use `bg-violet-50 text-violet-700 border-violet-200`
- **Indigo** — `bg-indigo-50 text-indigo-700 border-indigo-200`
- **Teal** — `bg-teal-50 text-teal-700 border-teal-200`

**Note:** The preorder badge should NOT be an `OrderStatusBadge` since preorder is not a status. It should be a separate inline chip rendered alongside it.

---

## 5. OrderList — Tabs, Filters, Summary (`OrderList.tsx`)

**File:** `features/orders/components/OrderList.tsx` (689 lines)

### Tab System (lines 29-32)

```ts
const MAIN_TABS = [
  { label: "Aktif", value: "active" as const },
  { label: "Riwayat", value: "history" as const },
];
```

Two tabs only. No "Pre-order" tab exists.

### Filter Chips (lines 34-49)

**Active tab status chips (lines 34-38):**
```ts
const ACTIVE_STATUS_CHIPS = [
  { label: "Baru", value: "new", type: "status" },
  { label: "Diproses", value: "processed", type: "status" },
  { label: "Dikirim", value: "shipped", type: "status" },
];
```

**History tab status chips (lines 40-43):**
```ts
const HISTORY_STATUS_CHIPS = [
  { label: "Selesai", value: "done", type: "status" },
  { label: "Dibatalkan", value: "cancelled", type: "status" },
];
```

**Payment chips (lines 45-49):**
```ts
const PAYMENT_CHIPS = [
  { label: "Lunas", value: "paid", type: "payment" },
  { label: "DP", value: "partial", type: "payment" },
  { label: "Belum Bayar", value: "unpaid", type: "payment" },
];
```

**Filter UI layout (lines 445-486):** Behind a toggle button (SlidersHorizontal icon). Shows:
- "Pesanan" label + status chips
- Vertical divider
- "Bayar" label + payment chips

Each chip toggles its filter on/off.

### Filter State (lines 56-57)

```ts
const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | null>(null);
```

**No preorder filter state exists.** Adding one would require:
1. A new state: `const [preorderFilter, setPreorderFilter] = useState<boolean | null>(null);`
2. OR: Adding "Pre-order" as a special chip type in the filter UI
3. Passing the filter to `getOrders()` service

### How Filter Chips Query Data

Filter state flows to `loadOrders()` (line 189-210):

```ts
const { orders: data, fromCache: cached } = await fetchOrdersWithCache({
  status: statusFilter || undefined,
  paymentStatus: paymentFilter || undefined,
  activeOnly: activeTab === "active" ? true : undefined,
  historyOnly: activeTab === "history" ? true : undefined,
  search: debouncedSearch || undefined,
  offset: 0,
});
```

This calls `fetchOrdersWithCache()` which wraps `getOrders()`.

### `formatDeliveryDate()` Function (lines 314-327)

Defined in OrderList, passed as prop to OrderCard:

```ts
function formatDeliveryDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const deliveryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (deliveryDay.getTime() === today.getTime()) return `Hari ini ${timeStr}`;
  if (deliveryDay.getTime() === tomorrow.getTime()) return `Besok ${timeStr}`;

  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + ` ${timeStr}`;
}
```

Outputs: "Hari ini 14:00", "Besok 10:00", "15 Mar 09:00"

### Realtime Subscriptions (lines 125-175)

Two subscriptions on `orders` table:
1. **INSERT** — for new orders from `order_link` or `whatsapp` source → toast + sound + list refresh
2. **UPDATE** — for `payment_claimed_at` changes → toast + sound + list refresh

Both call `loadOrders()` to refresh the list.

### OrderCard Rendering in List (lines 558-583)

```tsx
<OrderCard
  order={order}
  selectMode={isPending ? false : selectMode}
  isSelected={selectedIds.has(order.id)}
  onSelect={...}
  onLongPress={...}
  onPointerDown={...}
  cancelLongPress={...}
  onClick={isPending ? () => {} : (id) => router.push(`/pesanan/${id}/edit`)}
  formatTime={formatTime}
  formatDeliveryDate={formatDeliveryDate}
  onSwipeAdvance={...}
  onSwipeWA={...}
/>
```

**Click handler:** `router.push(`/pesanan/${id}/edit`)` — goes directly to edit page, NOT detail page.

### Where Preorder Filter Could Be Added

**Option A: As a chip in the status filter row**

Add to `ACTIVE_STATUS_CHIPS`:
```ts
const ACTIVE_STATUS_CHIPS = [
  { label: "Baru", value: "new", type: "status" },
  { label: "Diproses", value: "processed", type: "status" },
  { label: "Dikirim", value: "shipped", type: "status" },
  { label: "Pre-order", value: "preorder", type: "preorder" },  // new
];
```

But this mixes filter types. Status and preorder are orthogonal dimensions.

**Option B: Separate section in filter UI**

After the "Bayar" section, add a "Tipe" section:
```
Pesanan: [Baru] [Diproses] [Dikirim] | Bayar: [Lunas] [DP] [Belum Bayar] | Tipe: [Pre-order]
```

**Option C: Dedicated toggle above or below tabs**

A simpler "Hanya Pre-order" toggle checkbox/switch.

**Recommendation: Option B** — consistent with existing pattern, adds a 3rd filter dimension.

---

## 6. Order Detail Page (`app/(dashboard)/pesanan/[id]/page.tsx`)

**File:** `app/(dashboard)/pesanan/[id]/page.tsx` (10 lines)

**This page immediately redirects to the edit page:**

```ts
export default async function PesananDetailPage({ params }) {
  const { id } = await params;
  redirect(`/pesanan/${id}/edit`);
}
```

There is NO separate read-only detail page served from this route. The `OrderDetail.tsx` component exists but is NOT currently mounted by any page route (it was likely replaced by the redirect-to-edit pattern).

### OrderDetail.tsx Component (476 lines)

Despite not being mounted, `OrderDetail.tsx` is a fully functional read-only detail view. Key sections:

**Header (lines 151-172):** Customer name + order number + date + "Kembali" button

**Quick action buttons (lines 175-207):**
- "Kirim WA" (green)
- "Kirim Struk" (link)
- "Ingatkan Bayar" (when unpaid)
- "Edit" (link to edit page)

**Quick status actions (lines 210-235):**
- Advance status button (when not done/cancelled)
- "Tandai Lunas" button (when not paid)

**Card content (lines 238-409):**

1. **Delivery Date (lines 241-255):**
```tsx
{order.delivery_date && (
  <div className="space-y-1">
    <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
      Tanggal Delivery / Ambil
    </p>
    <p className="text-sm text-foreground">
      {new Date(order.delivery_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>
  </div>
)}
```
Full date with weekday, e.g., "Senin, 15 Maret 2026 14:00"

2. **Customer (lines 258-268)**
3. **Items list (lines 271-327)** — with subtotal, discount, total, payment status badge, partial amounts
4. **Notes (lines 330-335)**
5. **Payment proof (lines 338-407)** — collapsible image viewer

**Source display: NOT SHOWN in OrderDetail.** The `order.source` field is not rendered anywhere in this component.

**Where preorder badge could go in OrderDetail:**
- After the header, before quick actions (new info chip between lines 172 and 175)
- OR inside the card, before or after the delivery date section
- A violet "Pre-order" badge next to the order number in the subtitle

---

## 7. Edit Page (`app/(dashboard)/pesanan/[id]/edit/page.tsx`)

**File:** `app/(dashboard)/pesanan/[id]/edit/page.tsx` (45 lines)

Simply loads the order and renders `<OrderForm initialOrder={order} />`.

### OrderForm in Edit Mode — Key Sections

**File:** `features/orders/components/OrderForm.tsx` (~1240 lines)

#### Delivery Date in Edit Mode

**State initialization (lines 65-70):**
```ts
const [deliveryDate, setDeliveryDate] = useState(
  initialOrder?.delivery_date
    ? new Date(initialOrder.delivery_date).toISOString().slice(0, 16)
    : ""
);
const [showDelivery, setShowDelivery] = useState(!!initialOrder?.delivery_date);
```

**Toggle button (lines 629-636):**
```tsx
<button
  type="button"
  onClick={() => setShowDelivery(!showDelivery)}
  className={`h-9 px-3 ... ${showDelivery || deliveryDate ? "bg-warm-green-light ..." : "bg-card ..."}`}
>
  <CalendarDays className="w-3.5 h-3.5" />
  <span className="text-xs font-medium">Tanggal</span>
</button>
```

**Date picker (lines 886-999):**
- "Hari Ini" / "Besok" / "Tanggal lain" quick-select chips
- Optional time picker
- Clear button
- Label: "Tanggal Delivery / Ambil"

**Save handler (lines 463-471):**
```ts
const updated = await updateOrder(initialOrder.id, {
  items: finalItems,
  customer_name: customerName || "",
  customer_phone: customerPhone || "",
  notes: notes || "",
  discount: discountAmount,
  paid_amount: paidAmount,
  delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
} as Partial<Order>);
```

#### Status Selector in Edit Mode (lines 1085-1111)

Only shown for edit mode when status is not cancelled:

```tsx
{isEdit && initialOrder && initialOrder.status !== "cancelled" && (
  <div className="space-y-1.5">
    <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
      Status Pesanan
    </p>
    <div className="flex items-center gap-1.5 flex-wrap">
      {ORDER_STATUS_FLOW.map((status) => {
        const isActive = orderStatus === status;
        // ... chip styling per status
        return (
          <button key={status} onClick={() => setOrderStatus(status)} ...>
            {ORDER_STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  </div>
)}
```

Uses `ORDER_STATUS_FLOW` which is `['new', 'processed', 'shipped', 'done']`. `menunggu` and `cancelled` are excluded.

#### Where Preorder Checkbox Could Go in OrderForm

**For new orders (create mode):** Below the toggle buttons area (line 620-682), add a "Pre-order" checkbox/toggle. Or: auto-derive from delivery_date.

**For edit mode:** Show as a read-only badge in the header area (line 592-615), or as a toggleable checkbox if we want sellers to be able to change it.

Suggested location: After the "Tanggal" toggle button (line 636), add:
```tsx
<button
  type="button"
  onClick={() => setIsPreorder(!isPreorder)}
  className={`h-9 px-3 ... ${isPreorder ? "bg-violet-50 border-violet-200 text-violet-700" : "..."}`}
>
  <Package className="w-3.5 h-3.5" />
  <span className="text-xs font-medium">Pre-order</span>
</button>
```

---

## 8. Order Service — Query Layer (`order.service.ts`)

**File:** `features/orders/services/order.service.ts` (808 lines)

### `getOrders()` Function (lines 26-76)

```ts
export async function getOrders(options?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  activeOnly?: boolean;
  historyOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Order[]> {
```

Query construction:
1. Base: `select('*').eq('user_id', user.id).order('created_at', { ascending: false })`
2. Status filter: `.eq('status', options.status)`
3. Payment filter: `.eq('payment_status', options.paymentStatus)`
4. Search: `.or('order_number.ilike...customer_name.ilike...customer_phone.ilike...')`
5. Active tab: `.not('status', 'in', '("done","cancelled")')`
6. History tab: `.in('status', ['done', 'cancelled'])`

**No `is_preorder` filter exists.** To add one:
```ts
if (options?.preorderOnly) {
  query = query.eq('is_preorder', true);
}
```

### `createOrder()` Function (lines 183-275)

Creates order with:
```ts
const { data, error } = await supabase
  .from('orders')
  .insert({
    user_id: user.id,
    order_number: generateOrderNumber(),
    customer_id: customerId,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    items: input.items,
    subtotal,
    discount: input.discount || 0,
    total,
    paid_amount: paidAmount,
    notes: input.notes,
    delivery_date: input.delivery_date || null,
    source: input.source || 'manual',
    payment_status: paymentStatus,
  })
```

To add preorder support, add `is_preorder: input.is_preorder || false` to the insert.

### `CreateOrderInput` Type (lines 36-46 in types)

```ts
export interface CreateOrderInput {
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  discount?: number;
  delivery_date?: string;
  source?: OrderSource;
  payment_status?: PaymentStatus;
  paid_amount?: number;
}
```

Would need: `is_preorder?: boolean;`

### `getTodaySummary()` (lines 667-716)

Currently queries:
- Orders created today
- Orders with delivery today
- Deduplicates
- Returns pending count, revenue, etc.

Could add preorder count to the summary.

---

## 9. Swipe Gesture Hook (`useSwipeGesture.ts`)

**File:** `features/orders/hooks/useSwipeGesture.ts` (140 lines)

### Configuration Constants (lines 10-12)
```ts
const DEADZONE = 10;   // pixels before direction is locked
const THRESHOLD = 80;  // pixels to trigger action
const DAMPING = 0.3;   // rubber-band past threshold
```

### Options (lines 3-8)
```ts
interface UseSwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  disabled?: boolean;       // disables all swiping (e.g., select mode)
  disableRight?: boolean;   // disables right swipe only (e.g., done/cancelled)
}
```

### Preorder Swipe Considerations

Currently `OrderCard` sets `disableRight: isDoneOrCancelled` (line 65). For preorder orders:
- **Should swipe work?** Yes -- preorder orders still follow Baru -> Diproses -> Dikirim -> Selesai flow.
- **But for `menunggu` preorders:** Swipe right would fail because `menunggu` has no next status in `ORDER_STATUS_FLOW`. This is the correct behavior -- menunggu orders should not be swipeable until activated.
- **No changes needed to swipe for preorder.**

---

## 10. Summary: delivery_date Display Across Components

| Component | Where | How | Line(s) |
|-----------|-------|-----|---------|
| **OrderCard** | Row 2b, below items summary | `Calendar` icon + `formatDeliveryDate()` in amber text (`text-warm-amber`) | 113-119 |
| **OrderDetail** | Card section, first field | Full date with weekday/time in section labeled "Tanggal Delivery / Ambil" | 241-255 |
| **OrderForm (edit)** | Collapsible section | Date picker with Hari Ini/Besok/Tanggal lain chips + optional time | 886-999 |
| **OrderList** | Not directly | Defines `formatDeliveryDate()` function (lines 314-327), passes to OrderCard | 314-327, 572 |
| **HeroSummaryCell** | Implicit | `getTodaySummary()` queries orders with `delivery_date` today | N/A (in service) |

---

## 11. Summary: Source Badge/Indicator Across Components

| Component | Source Display | Details |
|-----------|---------------|---------|
| **OrderCard** | **NONE** | `order.source` is not rendered. No badge, no icon, no text. |
| **OrderDetail** | **NONE** | `order.source` is not rendered. |
| **OrderForm** | **NONE** | Source is set to `"manual"` on create but not displayed. |
| **OrderList** | Implicit in realtime | Only used in INSERT handler to determine toast text ("via WA") — not visible on cards. |
| **DailyRecap** | Yes | `SOURCE_LABELS` mapping: `{ manual: "Manual", whatsapp: "WhatsApp", order_link: "Link Toko" }` |
| **MonthlyReport** | Yes | Same `SOURCE_LABELS` mapping. |

**The order source is NOT displayed on OrderCard or OrderDetail.** It is only shown in rekap reports.

---

## 12. Summary: Where Preorder Identification Could Be Added

### A. OrderCard Badge (highest visibility)

**Location:** Row 3 badge group, `OrderCard.tsx` line 128, before `<OrderStatusBadge />`

```tsx
<div className="flex items-center gap-1.5 flex-nowrap shrink-0">
  {order.is_preorder && (
    <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-violet-50 text-violet-700 border-violet-200">
      Pre-order
    </span>
  )}
  <OrderStatusBadge status={order.status} />
  {paymentChip && (...)}
</div>
```

Badge stack would be: `[Pre-order] [Baru] [Belum Bayar]` (up to 3 badges)

### B. OrderCard Delivery Date Line (enhancement)

**Location:** `OrderCard.tsx` lines 113-119

For preorder orders with delivery_date, enhance the line:
```tsx
{order.delivery_date && (
  <p className="flex items-center gap-1 text-xs text-warm-amber mt-0.5">
    <Calendar className="w-3 h-3" />
    {order.is_preorder ? "PO · " : ""}{formatDeliveryDate(order.delivery_date)}
  </p>
)}
```

### C. OrderList Filter Chip

**Location:** `OrderList.tsx` line 448, filter chip area

Add after payment chips section:
```tsx
<span className="shrink-0 w-px bg-border self-stretch my-1.5" />
<div className="flex items-center gap-1.5 shrink-0">
  <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider pr-0.5">Tipe</span>
  <button
    type="button"
    onClick={() => setPreorderFilter(preorderFilter ? null : true)}
    className={`shrink-0 inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
      preorderFilter
        ? "bg-violet-50 border-violet-200 text-violet-700"
        : "bg-muted/50 border-border text-foreground/70 ..."
    }`}
  >
    Pre-order
  </button>
</div>
```

### D. OrderDetail / OrderForm Header

**Location:** `OrderDetail.tsx` line 157 or `OrderForm.tsx` line 597

Add a chip after the order number:
```tsx
<p className="text-sm text-muted-foreground">
  {order.order_number}
  {order.is_preorder && (
    <span className="ml-1.5 inline-flex h-4 px-1.5 text-[9px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200 align-middle">
      Pre-order
    </span>
  )}
  {" · "}{new Date(order.created_at).toLocaleDateString("id-ID", {...})}
</p>
```

### E. OrderForm — Preorder Toggle (for manual orders)

**Location:** `OrderForm.tsx` line 636 (after Tanggal toggle button)

Add toggle button in the row of toggles (Pelanggan, Tanggal, Catatan, Diskon):
```tsx
<button
  type="button"
  onClick={() => setIsPreorder(!isPreorder)}
  className={`h-9 px-3 ... ${isPreorder ? "bg-violet-50 border-violet-200 text-violet-700" : "..."}`}
>
  <Package className="w-3.5 h-3.5" />
  <span className="text-xs font-medium">Pre-order</span>
</button>
```

### F. getOrders() Service Query

**Location:** `order.service.ts` line 26-76

Add `preorderOnly?: boolean` to options:
```ts
if (options?.preorderOnly) {
  query = query.eq('is_preorder', true);
}
```

---

## 13. Color Scheme for Preorder Badge

Used colors in existing badge system:

| Color | Used By | CSS Classes |
|-------|---------|-------------|
| Blue | new status | `bg-warm-blue-light text-warm-blue border-warm-blue/20` |
| Blue | "Sudah Bayar?" claim | `bg-warm-blue-light text-warm-blue border-warm-blue/20` |
| Amber | menunggu, processed, DP | `bg-warm-amber-light text-warm-amber border-warm-amber/20` |
| Purple | shipped | `bg-warm-purple-light text-warm-purple border-warm-purple/20` |
| Green | done, Lunas | `bg-warm-green-light text-warm-green border-warm-green/20` |
| Rose | cancelled, Belum Bayar | `bg-warm-rose-light text-warm-rose border-warm-rose/20` |

**Recommended for preorder:** Violet (`bg-violet-50 text-violet-700 border-violet-200`)
- Visually distinct from all existing colors
- Semantic fit: violet is associated with "special" or "premium" in UI conventions
- Does not conflict with shipped (which uses `warm-purple`, a different shade)

---

## 14. Required Changes Summary

### Types (`order.types.ts`)
- Add `is_preorder?: boolean` to `Order` interface
- Add `is_preorder?: boolean` to `CreateOrderInput` interface

### DB Migration
- `ALTER TABLE orders ADD COLUMN is_preorder BOOLEAN DEFAULT false;`
- `ALTER TABLE profiles ADD COLUMN preorder_enabled BOOLEAN DEFAULT false;`
- Index: `CREATE INDEX idx_orders_is_preorder ON orders (user_id, is_preorder) WHERE is_preorder = true;`

### OrderCard (`OrderCard.tsx`)
- Add preorder badge in Row 3 badge group (before `OrderStatusBadge`)
- Optionally enhance delivery date line with "PO" prefix

### OrderList (`OrderList.tsx`)
- Add `preorderFilter` state
- Add "Pre-order" chip in filter area
- Pass filter to `getOrders()`

### OrderForm (`OrderForm.tsx`)
- Add preorder toggle button (for manual orders)
- Include `is_preorder` in create/update payloads

### OrderDetail (`OrderDetail.tsx`)
- Add preorder badge in header subtitle

### order.service.ts
- Add `preorderOnly` option to `getOrders()`
- Include `is_preorder` in `createOrder()` insert
- Include `is_preorder` in `CreateOrderInput` handling

### Public order flow (separate files, not analyzed here)
- Check `preorder_enabled` on profile
- Set `is_preorder: true` on order creation
- Modify success page and live page messaging

---

*Generated: 2026-03-10*
*Source files analyzed: 17 component files, 2 service files, 1 types file, 1 hooks file, 2 page files*
