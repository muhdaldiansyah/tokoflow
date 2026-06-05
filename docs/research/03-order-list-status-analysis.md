# 03 — Order List & Status System Analysis

## Order Status System

- **Status enum**: `'new' | 'menunggu' | 'processed' | 'shipped' | 'done' | 'cancelled'`
- **ORDER_STATUS_FLOW** (swipeable progression): `['new', 'processed', 'shipped', 'done']`
- **Menunggu is NOT in the flow** — excluded from swipe actions
- File: `features/orders/types/order.types.ts` (lines 7, 66)

## Menunggu Handling (Key Precedent for Preorder)

- Created when quota is exhausted (public orders or WA bot)
- Amber color (`text-amber-500`)
- Cannot be swiped right (advance status)
- Gets activated to `'new'` when user purchases quota pack via RPC calls `add_order_pack` or `activate_unlimited`
- Displayed in live order page (`/r/[id]`) with clock icon
- Files: `lib/services/public-order.service.ts`, `lib/wa-bot/order-creator.ts`, `app/(public)/r/[id]/page.tsx`

## OrderCard Component

- Location: `features/orders/components/OrderCard.tsx`
- Displays: customer name, items summary, delivery date (if set), total, status badge, payment badge
- Swipe gestures (80px threshold, 0.3 damping):
  - Right swipe: advances status (disabled for done/cancelled/menunggu)
  - Left swipe: opens WA share
- Selection mode: checkbox appears, long-press (500ms) or context menu enables bulk operations
- File lines: 59-66 (swipe disable logic), 81-140 (card content)

## OrderStatusBadge

- Location: `features/orders/components/OrderStatusBadge.tsx`
- Maps status to color chips: `h-6 px-2 text-[11px] font-medium rounded-full border`
- Menunggu style: `bg-amber-50 text-amber-600 border-amber-200`

## OrderList Page

- Location: `app/(dashboard)/pesanan/page.tsx` → `features/orders/components/OrderList.tsx`
- **Tabs**: "Aktif" (excludes done/cancelled) and "Riwayat" (only done/cancelled)
- **Status filters (Aktif tab)**: Baru, Diproses, Dikirim
- **Status filters (Riwayat tab)**: Selesai, Dibatalkan
- **Payment filters**: Lunas, DP, Belum Bayar
- Debounced search (300ms) on name, phone, order number
- Bulk actions (unlocked after 10 orders): mark paid, change status, long-press to select
- 50-item pagination with "Load more"
- Realtime notifications for new orders and payment claims
- Offline pending orders (with "Menunggu sinkronisasi" badge) prepended to list

## Source Field

- Type: `'manual' | 'whatsapp' | 'order_link'`
- **Not displayed on OrderCard** in current UI
- Could be shown as small icon or tag if needed

## Key Files for Preorder Feature

1. `features/orders/types/order.types.ts` — Status enum, ORDER_STATUS_FLOW
2. `features/orders/components/OrderCard.tsx` — Render preorder indicator
3. `features/orders/components/OrderStatusBadge.tsx` — Badge styling
4. `features/orders/components/OrderList.tsx` — Filter/display logic
5. `app/(public)/r/[id]/page.tsx` — Public receipt page
6. `useSwipeGesture.ts` — Gesture logic (model for disabling)
7. `lib/services/public-order.service.ts` — Quota check logic

## Preorder Integration Points

- Would fit as a **new value/flag** similar to menunggu positioning
- Should probably block right-swipe like menunggu does (until delivery date)
- Needs filter chip in OrderList (probably in Aktif tab)
- Needs badge styling in OrderStatusBadge
- Could show in payment chip area or as overlay badge on OrderCard
