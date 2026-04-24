# Preorder Research: Order Creation & DB Functions

## Three Order Creation Flows

### 1. Public Order Link (`/pesan/[slug]`)
- **Files:** `lib/services/public-order.service.ts` + `app/api/public/orders/route.ts`
- **Auth:** None (service role)
- **Quota:** `check_order_limit()` RPC → `status: 'new' | 'menunggu'`
- **Stock:** Decrements immediately in loop (lines 185-197 of service.ts)
- **Payment:** Derived as 'unpaid' (no payment collected)
- **Source:** `'order_link'`

### 2. Dashboard Manual Order (`/pesanan/baru`)
- **File:** `features/orders/services/order.service.ts` → `createOrder()` (lines 183-275)
- **Auth:** Required (getUser())
- **Quota:** NOT checked (always creates as 'new', never 'menunggu')
- **Stock:** NOT decremented
- **Payment:** Derived from `paid_amount` parameter
- **Source:** `'manual'`

### 3. WhatsApp Bot Order
- **File:** `lib/wa-bot/order-creator.ts` → `createOrderFromSession()` (lines 11-122)
- **Auth:** None (service role, resolved via connection)
- **Quota:** `check_order_limit()` RPC → `status: 'new' | 'menunggu'`
- **Stock:** NOT decremented
- **Payment:** Fixed as `paid_amount: 0` → derived as 'unpaid'
- **Source:** `'whatsapp'`

## Database Functions (migration 028)

- `check_order_limit(p_user_id UUID)` → BOOLEAN: Checks unlimited_until → free 50 → order_credits
- `increment_orders_used(p_user_id UUID)` → void: Monthly reset, consumes quota in priority order
- `add_order_pack(p_user_id UUID)` → JSONB: +50 credits; 3rd pack sets unlimited_until, activates menunggu→new
- `activate_unlimited(p_user_id UUID)` → JSONB: Sets unlimited_until to end of month, activates menunggu→new

## Payment Status Derivation

**File:** `features/orders/types/order.types.ts` (lines 80-84)
```
paid_amount >= total → 'paid'
paid_amount > 0 → 'partial'
else → 'unpaid'
```

## Stock Decrement

Only happens in public orders (`lib/services/public-order.service.ts:176-198`):
- Searches products by name
- Decrements if stock !== null
- Auto-sets `is_available=false` when stock hits 0
- Product service has `decrementStock()` (lines 108-138) but only exposed for manual use

## Preorder Insertion Points

- **Public orders:** After stock check (line 86-98) but before decrement
- **Dashboard:** In `createOrder` before insert, or after insert
- **WA bot:** After payment status derivation, before order insert

## Stock Implications for Preorder

- Preorder should likely NOT decrement stock immediately (reserve pattern), or use separate tracking
- Need to track preorder qty separately from regular inventory
- May need `is_preorder` flag on orders table and/or new status
