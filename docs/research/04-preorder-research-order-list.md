# Preorder Research: Order List, Types & Cards

## Order List Page Structure

**File:** `features/orders/components/OrderList.tsx` (690 lines)

- **Tabs:** "Aktif" and "Riwayat" (line 29-32)
- **Filters:** Status and Payment chips, collapsible (lines 34-49)
- **Search:** 300ms debounced by order number, customer name, phone (lines 56-59, 106-108)
- **Summary Card:** `<HeroSummaryCell>` — pending count, today's revenue, unpaid count (line 423)
- **Pagination:** 50 orders/page with "Load more" (line 51)

## Order Type Definition

**File:** `features/orders/types/order.types.ts`

Core fields:
- `source: OrderSource` (line 24) → `'manual' | 'whatsapp' | 'order_link'`
- `status: OrderStatus` (line 25) → `'new' | 'menunggu' | 'processed' | 'shipped' | 'done' | 'cancelled'`
- `delivery_date?: string` (line 27)
- `payment_claimed_at?: string` (line 28)
- `paid_amount: number` (line 22)

**Order Status Flow:** `['new', 'processed', 'shipped', 'done']` (line 66) — menunggu/cancelled EXCLUDED

**Payment derivation:** `derivePaymentStatus(paidAmount, total)` (lines 80-84)

## OrderCard Component

**File:** `features/orders/components/OrderCard.tsx` (210 lines)

Display rows:
- Row 1: Customer name + relative time (lines 97-104)
- Row 2: Items summary + delivery date badge if set (lines 106-119)
- Row 3: Total price + status badge + payment chip (lines 124-140)

**Payment Chip Logic (lines 73-79):**
- "Sudah Bayar?" — if `payment_claimed_at` set but not fully paid (blue)
- "DP Rp..." — partial payment (amber)
- "Belum Bayar" — unpaid (red)

## Order Status Badge Styling

**File:** `features/orders/components/OrderStatusBadge.tsx`

- `new` → warm-blue
- `menunggu` → amber-600 (SPECIAL)
- `processed` → warm-amber
- `shipped` → warm-purple
- `done` → warm-green
- `cancelled` → warm-rose

## How Order Sources are Displayed

Source field is stored but NOT shown on OrderCard. Used for:
- Realtime toast notifications (line 133-135 in OrderList): `order_link` and `whatsapp` get different suffixes
- Rekap source breakdown (Manual/Link Toko/WhatsApp)

## Status Filtering

**Aktif tab:** Excludes done/cancelled → shows new, menunggu, processed, shipped
- Filter chips: Baru, Diproses, Dikirim (ACTIVE_STATUS_CHIPS lines 34-38)

**Riwayat tab:** Only done/cancelled
- Filter chips: Selesai, Dibatalkan (HISTORY_STATUS_CHIPS lines 40-43)

## Menunggu Special Handling

- Over-quota orders from public form / WA bot get `status: "menunggu"`
- Excluded from `ORDER_STATUS_FLOW` → can't be swiped/advanced
- Activated to "new" when user buys pack/unlimited (RPCs)
- Styled differently: amber-600 background
- Shown on public receipt page with clock icon

## Swipe Actions & Conditions

**File:** `features/orders/hooks/useSwipeGesture.ts`

- **Swipe Right (advance status):** Disabled for done/cancelled/menunggu. Shows next status in green action bg
- **Swipe Left (WA):** Always available unless selectMode. Opens WAPreviewSheet
- Threshold: 80px, Damping: 0.3, Deadzone: 10px

## Preorder Identification Opportunities

1. **Badge:** Add to OrderCard row 3 alongside status + payment chips
2. **Filter:** Add "Pre-order" chip in ACTIVE_STATUS_CHIPS
3. **Field:** Add `is_preorder: boolean` to Order interface
4. **Display options:** Status badge style, dedicated "Pre-order" chip, calendar icon with delivery date
5. **Query filter:** Add `preorderOnly` option to `getOrders()` in order.service.ts
