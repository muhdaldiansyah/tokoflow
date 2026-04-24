# Preorder Deep Dive: Current Flow Analysis

> Precise line-by-line analysis of delivery_date and QRIS display logic across all public-facing pages.
> Source of truth for implementation planning.

---

## 1. Public Order Form — `app/(public)/pesan/[slug]/PublicOrderForm.tsx`

### Props Interface (lines 10-20)

```ts
interface PublicOrderFormProps {
  slug: string;
  businessName: string;
  frequentItems: PublicFrequentItem[];
  logoUrl?: string;
  businessAddress?: string;
  businessPhone?: string;
  completedOrders: number;
  hasQris: boolean;      // boolean flag — true if profile has qris_url
  qrisUrl?: string;      // actual URL of the QRIS image
}
```

No preorder-related props. No `require_delivery_date`, no `preorder_mode` setting exists anywhere in the codebase.

### State & Defaults (lines 24-31)

```ts
const [deliveryDate, setDeliveryDate] = useState("");   // line 28 — empty string = no date selected
const [showQris, setShowQris] = useState(false);        // line 31 — QRIS modal hidden by default
```

**Default behavior:** delivery_date is always OPTIONAL. No default date is set. The field starts empty.

### delivery_date References

| Line | Context |
|------|---------|
| 28 | State init: `useState("")` |
| 153 | Submit body: `deliveryDate: deliveryDate \|\| undefined` — sends `undefined` if empty |
| 183 | sessionStorage: `deliveryDate: deliveryDate \|\| undefined` — stored for success page |
| 438-453 | The actual `<input type="date">` field |

### delivery_date Field UI (lines 438-453)

```tsx
<div>
  <label className="text-xs font-medium text-foreground mb-1.5 block">
    <span className="flex items-center gap-1">
      <CalendarDays className="w-3.5 h-3.5" />
      Tanggal pengiriman / pengambilan           {/* line 442 */}
    </span>
    <span className="text-muted-foreground/70 font-normal ml-1">(opsional)</span>   {/* line 444 */}
  </label>
  <input
    type="date"
    value={deliveryDate}
    onChange={(e) => setDeliveryDate(e.target.value)}
    min={new Date().toISOString().split("T")[0]}   {/* today as minimum */}
    className="w-full h-12 px-3 bg-white border rounded-lg ..."
  />
</div>
```

**Key observations:**
- Label: "Tanggal pengiriman / pengambilan"
- Explicitly marked "(opsional)" — line 444
- min date = today (can't pick past dates)
- No max date constraint
- No validation in `handleSubmit()` — the field is never checked for presence
- Field is ALWAYS visible — no conditional rendering, no toggle, no profile setting to hide/show it

### QRIS References on Order Form

| Line | Context |
|------|---------|
| 18-19 | Props: `hasQris: boolean`, `qrisUrl?: string` |
| 31 | State: `showQris` — controls modal visibility |
| 305 | Trust signals section: only renders if `businessAddress \|\| businessPhone \|\| hasQris \|\| completedOrders >= 10` |
| 324-333 | QRIS trust badge: shows "QRIS" chip if `hasQris` is true. Clicking calls `setShowQris(true)` only if `qrisUrl` exists |
| 524-551 | QRIS modal: renders only if `showQris && qrisUrl` — shows the QRIS image full-screen |

**QRIS on order form is purely informational** — a trust signal badge + optional preview modal. No payment happens here. The actual QRIS payment flow happens on the success page and live order page.

### Form Submission Data Flow (lines 143-194)

1. `POST /api/public/orders` with body: `{ slug, customerName, customerPhone, items, notes, deliveryDate, website (honeypot) }`
2. On success, stores to `sessionStorage("catatorder_last_order")`:
   ```ts
   { orderNumber, orderId, items, total, notes, customerName, deliveryDate }
   ```
3. Redirects to `/${slug}/sukses?name=...&order=...&phone=...&oid=...&total=...`
   - NOTE: `deliveryDate` is NOT in the URL params — only in sessionStorage
   - `total` IS in the URL params as a fallback if sessionStorage is unavailable

### Required vs Optional Fields

| Field | Required? | Validation |
|-------|-----------|------------|
| customerName | YES | line 111: `!customerName.trim()` check |
| customerPhone | YES | lines 116-128: trim + regex (10-15 digits, starts 0/62) |
| items OR notes | YES (one of) | line 129: `!hasItems && !notes.trim()` |
| notes | Conditional | Required only if no items selected |
| deliveryDate | NO | No validation at all. Sent as `undefined` if empty |
| honeypot | hidden | line 154: `website: honeypot` — bot detection |

---

## 2. Order Form Page — `app/(public)/pesan/[slug]/page.tsx`

### Data Flow (lines 21-59)

```
slug → getPublicBusinessInfo(slug) → business object → PublicOrderForm props
```

**What `getPublicBusinessInfo` returns** (from `lib/services/public-order.service.ts`, lines 14-26):

```ts
interface PublicBusinessInfo {
  businessId: string;
  businessName: string;
  orderFormEnabled: boolean;
  planExpired: boolean;
  frequentItems: PublicFrequentItem[];
  qrisUrl?: string;          // from profile.qris_url
  logoUrl?: string;
  businessAddress?: string;
  businessPhone?: string;
  completedOrders: number;
  hasQris: boolean;           // !!profile.qris_url
}
```

**Profile query** (service file line 37-39):
```ts
.select("id, business_name, order_form_enabled, plan_expiry, qris_url, logo_url, business_address, business_phone")
```

No preorder settings fetched. No `require_delivery_date` column exists in the `profiles` table.

**Props passed to form** (page lines 48-58):
- `hasQris={business.hasQris}` — boolean
- `qrisUrl={business.qrisUrl}` — the URL string or undefined

---

## 3. Success Page — `app/(public)/pesan/[slug]/sukses/page.tsx`

### Data Flow (lines 10-42)

```
URL params: { name, order, phone, oid, total }
slug → getPublicBusinessInfo(slug) → business.qrisUrl, business.businessPhone
```

**QRIS source (line 15):** `const qrisUrl = business?.qrisUrl;`
- Fetched fresh from the profile via `getPublicBusinessInfo`
- If seller has a QRIS URL in their profile, it's passed to SuccessActions

**Props to SuccessActions (lines 34-42):**
```tsx
<SuccessActions
  qrisUrl={qrisUrl}                           // from profile
  businessPhone={businessPhone}               // from URL param or profile
  orderNumber={order || ""}                   // from URL param
  orderId={oid}                               // from URL param
  businessName={name || ""}                   // from URL param
  slug={slug}
  totalFromUrl={totalAmount}                  // from URL param, parseInt
/>
```

---

## 4. Success Actions — `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx`

### OrderDetails interface (lines 10-18)

```ts
interface OrderDetails {
  orderNumber: string;
  orderId?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  notes?: string;
  customerName: string;
  deliveryDate?: string;     // optional — only present if customer set one
}
```

### Data Source (lines 36-45)

```ts
const raw = sessionStorage.getItem("catatorder_last_order");
if (raw) { setOrderDetails(JSON.parse(raw)); }
```

**Degrades gracefully** — if sessionStorage is unavailable, `orderDetails` stays null. The page still works using URL params for orderNumber, total, etc.

### delivery_date References

| Line | Context |
|------|---------|
| 17 | Interface: `deliveryDate?: string` |
| 136-137 | Receipt PNG height calc: `if (orderDetails?.deliveryDate) h += lineH + 2 * scale;` |
| 228-237 | Receipt PNG rendering: draws "Pengiriman: {formatted date}" if deliveryDate exists |
| 342-347 | On-screen display in order summary card |

### delivery_date Display (lines 342-347)

```tsx
{orderDetails.deliveryDate && (
  <p className="text-xs text-muted-foreground flex items-center gap-1">
    <CalendarDays className="w-3 h-3" />
    {new Date(orderDetails.deliveryDate).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    })}
  </p>
)}
```

Only shown if `deliveryDate` was provided. No label prefix — just the formatted date with a calendar icon.

### delivery_date in Receipt PNG (lines 228-237)

```ts
if (orderDetails?.deliveryDate) {
  y += 2 * scale;
  ctx.fillStyle = "#888888";
  ctx.font = `${smallFont}px -apple-system, sans-serif`;
  const dateStr = new Date(orderDetails.deliveryDate).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  ctx.fillText(`Pengiriman: ${dateStr}`, pad, y + smallFont);
  y += lineH;
}
```

Label in receipt image: "Pengiriman: {date}"

### QRIS Display Conditions

**Condition 1: QRIS card shown (line 352)**
```tsx
{qrisUrl && !paidConfirmed && (
```
- Shows if: `qrisUrl` exists AND user hasn't clicked "Sudah Bayar"
- Contains: QRIS image, total amount, "Simpan Bukti Pesanan" download, "Sudah Bayar" button
- This is the PRIMARY payment flow

**Condition 2: Post-payment confirmation (line 403)**
```tsx
{qrisUrl && paidConfirmed && (
```
- Shows if: `qrisUrl` exists AND user clicked "Sudah Bayar"
- Contains: checkmark, "Menunggu konfirmasi penjual", "Konfirmasi via WA" button, "Lihat QRIS lagi" link

**Condition 3: No QRIS, just WA (line 431)**
```tsx
{!qrisUrl && businessPhone && (
```
- Shows if: NO `qrisUrl` AND `businessPhone` exists
- Contains: single "Hubungi via WhatsApp" button

**Bottom row (lines 443-459):** Always shown — "Simpan Bukti" + "Pesan Lagi" buttons

### WA Message Routing (lines 67-92)

```ts
function handleWhatsApp() {
  if (orderDetails) {
    const message = qrisUrl
      ? buildQrisConfirmationMessage({...})    // "Saya sudah bayar via QRIS..."
      : buildCustomerOrderMessage({...});       // "Saya baru saja pesan..."
    openWhatsAppPublic(message, businessPhone);
  } else {
    // Fallback without order details
    const prefix = qrisUrl ? "Saya sudah bayar via QRIS untuk pesanan" : "Saya baru saja pesan";
    const message = `Halo, ${prefix} *${orderNumber}*.${receiptLink}...`;
    openWhatsAppPublic(message, businessPhone);
  }
}
```

**Key:** If `qrisUrl` exists, WA message assumes QRIS payment happened. If no `qrisUrl`, it's a generic order confirmation message.

### "Simpan Bukti Pesanan" — Canvas Receipt (lines 95-301)

The PNG receipt includes (in order):
1. Business name (centered, bold)
2. Order number (monospace)
3. Separator line
4. Item list (name x qty + price)
5. Total amount
6. Notes (italic, gray) — if exists
7. Delivery date ("Pengiriman: ...") — if exists
8. QRIS image (55% width) — **only if `qrisUrl` exists** (line 104: `if (qrisUrl)`)
9. Receipt URL (`catatorder.id/r/{orderId}`) — if orderId exists
10. "Dibuat dengan CatatOrder" branding

---

## 5. Live Order Page — `app/(public)/r/[id]/page.tsx`

### Data Source (lines 40-47)

Server-side fetch with service role:
```ts
const { data: order } = await supabase
  .from("orders")
  .select("order_number, customer_name, items, subtotal, discount, total,
           paid_amount, notes, status, delivery_date, payment_claimed_at,
           created_at, user_id")
  .eq("id", id)
  .single();
```

Profile fetch (lines 52-56):
```ts
const { data: profile } = await supabase
  .from("profiles")
  .select("business_name, logo_url, slug, business_phone, qris_url")
  .eq("id", order.user_id)
  .single();
```

### delivery_date References

| Line | Context |
|------|---------|
| 45 | Query: selects `delivery_date` from orders |
| 84-91 | Formatting: converts to localized date string or null |
| 166-172 | Rendered in a border-b section |

### delivery_date Display (lines 83-91, 165-172)

```ts
// Line 84-91: Formatting
const deliveryDate = order.delivery_date
  ? new Date(order.delivery_date).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
  : null;
```

```tsx
{/* Line 166-172: Rendering */}
{deliveryDate && (
  <div className="px-5 py-2.5 border-b flex items-center gap-2">
    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    <span className="text-xs text-muted-foreground">Pengiriman:</span>
    <span className="text-xs font-medium text-foreground">{deliveryDate}</span>
  </div>
)}
```

Label: "Pengiriman:" — only shown if delivery_date exists.

### QRIS Display — Passed to ReceiptActions (lines 226-236)

```tsx
<ReceiptActions
  orderId={id}
  orderNumber={order.order_number}
  waPhone={waPhone}
  slug={profile?.slug}
  qrisUrl={profile?.qris_url}           // from profile, can be null
  total={order.total}
  showPayment={!isPaid && status !== "done" && status !== "cancelled"}   // line 233
  businessName={businessName}
  paymentClaimedAt={order.payment_claimed_at}
/>
```

**`showPayment` condition (line 233):**
```ts
showPayment={!isPaid && status !== "done" && status !== "cancelled"}
```
Where `isPaid = paidAmount >= total && total > 0` (line 75).

So QRIS + "Sudah Bayar" shows when: order is NOT fully paid AND status is NOT done/cancelled.

### Payment Badge Logic (lines 121-135)

```tsx
{isPaid && (   <span>Lunas</span>   )}
{isPartial && (   <span>Bayar Sebagian</span>   )}
{!isPaid && !isPartial && total > 0 && (   <span>Belum Bayar</span>   )}
```

Where:
- `isPaid`: `paidAmount >= total && total > 0`
- `isPartial`: `paidAmount > 0 && paidAmount < total`

---

## 6. Receipt Actions — `app/(public)/r/[id]/ReceiptActions.tsx`

### Props (lines 8-18)

```ts
interface ReceiptActionsProps {
  orderId: string;
  orderNumber: string;
  waPhone?: string | null;
  slug?: string | null;
  qrisUrl?: string | null;
  total: number;
  showPayment: boolean;        // computed by parent: !isPaid && !done && !cancelled
  businessName: string;
  paymentClaimedAt?: string | null;   // if already claimed, starts in confirmed state
}
```

### Initial State (line 21)

```ts
const [paidConfirmed, setPaidConfirmed] = useState(!!paymentClaimedAt);
```

If `payment_claimed_at` already exists, the component starts in the "confirmed" state.

### QRIS Display Conditions

**Condition 1: QRIS + Sudah Bayar (line 52)**
```tsx
{showPayment && qrisUrl && !paidConfirmed && (
```
Shows if: payment is applicable (`showPayment`) AND seller has QRIS AND user hasn't claimed payment.
Contains: QRIS image (200px max), total amount, "Simpan QRIS" download, "Sudah Bayar" button.

**Condition 2: Sudah Bayar without QRIS (line 98)**
```tsx
{showPayment && !qrisUrl && !paidConfirmed && (
```
Shows if: payment applicable but NO QRIS. Just a bare "Sudah Bayar" button.

**Condition 3: Post-claim confirmation (line 111)**
```tsx
{showPayment && paidConfirmed && (
```
Shows if: payment applicable and user already claimed. Shows checkmark + "Menunggu konfirmasi penjual" + optional "Konfirmasi via WA" + "Lihat QRIS lagi" link.

**Condition 4: Hubungi Penjual WA button (line 144)**
```tsx
{waPhone && (!showPayment || (showPayment && !paidConfirmed && !qrisUrl)) && !paidConfirmed && (
```
Complex condition — shows WA contact button when:
- `waPhone` exists AND
- Either: `showPayment` is false (already paid/done/cancelled)
- OR: `showPayment` is true but no QRIS and not yet claimed (in this case it replaces the WA button from condition 2, but note condition 2 also renders — effectively both show)

Wait, actually re-reading: condition 2 (line 98) renders a "Sudah Bayar" button. Then condition 4 (line 144) checks `showPayment && !paidConfirmed && !qrisUrl` which is the same truth conditions. So when there's no QRIS but payment is applicable, the user sees BOTH the "Sudah Bayar" button AND the "Hubungi Penjual" WA button.

**Condition 5: Pesan Lagi (line 157)**
```tsx
{slug && (
```
Always shown if slug exists.

---

## 7. API Route — `app/api/public/orders/route.ts`

### delivery_date Handling (line 101-108)

```ts
const { deliveryDate } = body;                                          // line 101
const result = await createPublicOrder({
  ...
  deliveryDate: deliveryDate && typeof deliveryDate === "string"         // line 108
    ? deliveryDate : undefined,
});
```

No validation on deliveryDate format, no min/max date enforcement server-side. Just checks it's a string.

### Stock Validation (lines 87-98)

Server-side stock check before order creation — prevents overselling even if client is stale.

---

## 8. Service Layer — `lib/services/public-order.service.ts`

### Order Creation (lines 124-224)

```ts
delivery_date: params.deliveryDate || null,    // line 161
```

Stored as `null` if not provided. Column type is `timestamptz` (from migration 016).

### Quota Check (lines 145-146)

```ts
const { data: hasQuota } = await supabase.rpc("check_order_limit", { p_user_id: params.businessId });
const orderStatus = hasQuota ? "new" : "menunggu";
```

Over-quota orders get `status: "menunggu"` instead of `"new"`.

---

## 9. Database — `supabase/migrations/016_add_delivery_date.sql`

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date timestamptz;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders (user_id, delivery_date)
  WHERE delivery_date IS NOT NULL;
```

Column type: `timestamptz` (timestamp with timezone). Nullable. No default value.

---

## Summary: Current Defaults & Behavior

### delivery_date

| Aspect | Current Behavior |
|--------|-----------------|
| Default value | Empty string (no date) |
| Required? | NO — always optional, marked "(opsional)" |
| Label | "Tanggal pengiriman / pengambilan" |
| Min date | Today (client-side only via HTML min attribute) |
| Max date | None |
| Server validation | None — only checks `typeof === "string"` |
| DB column | `timestamptz`, nullable, no default |
| Success page display | Shows formatted date if provided, hidden if not |
| Receipt PNG | "Pengiriman: {date}" if provided |
| Live order page | "Pengiriman: {date}" in its own border-b row |
| Seller control? | NONE — no profile setting to require/hide this field |

### QRIS Display

| Page | Condition to Show QRIS | What's Shown |
|------|----------------------|--------------|
| Order form (trust signal) | `hasQris` is true | Small "QRIS" badge text |
| Order form (modal) | `showQris && qrisUrl` (user taps badge) | Full QRIS image in modal |
| Success page | `qrisUrl` exists (from profile) | QRIS image + total + "Simpan Bukti" + "Sudah Bayar" |
| Success page (post-claim) | `qrisUrl && paidConfirmed` | Checkmark + "Menunggu konfirmasi" + WA button |
| Live order `/r/[id]` | `showPayment && qrisUrl && !paidConfirmed` | QRIS image + total + "Simpan QRIS" + "Sudah Bayar" |
| Live order (no QRIS) | `showPayment && !qrisUrl && !paidConfirmed` | Just "Sudah Bayar" button |
| Live order (post-claim) | `showPayment && paidConfirmed` | Checkmark + "Menunggu konfirmasi" |

### `showPayment` Derivation (live order page)

```
showPayment = !isPaid && status !== "done" && status !== "cancelled"
isPaid = paidAmount >= total && total > 0
```

So QRIS/payment UI is hidden when:
- Order is fully paid (`paid_amount >= total`)
- Order status is "done"
- Order status is "cancelled"

### Data Flow Between Pages

```
[Order Form] --(POST /api/public/orders)--> [API] --(createPublicOrder)--> [DB]
     |
     |-- sessionStorage("catatorder_last_order"):
     |   { orderNumber, orderId, items, total, notes, customerName, deliveryDate }
     |
     |-- URL redirect: /${slug}/sukses?name=...&order=...&phone=...&oid=...&total=...
     |   (NOTE: deliveryDate NOT in URL — only sessionStorage)
     v
[Success Page] -- reads sessionStorage for order details
     |          -- fetches qrisUrl fresh from profile via getPublicBusinessInfo(slug)
     |
     v
[Live Order /r/{id}] -- server-side fetch from DB (order + profile)
                      -- completely independent from sessionStorage
                      -- has its own qrisUrl from profile query
```

### What Does NOT Exist (as of v2.8.0)

- No `preorder_mode` or `require_delivery_date` column in `profiles`
- No seller setting to make delivery_date required
- No seller setting to set a default delivery lead time
- No seller setting to set available delivery days
- No preorder-specific status or workflow
- No delivery date validation beyond HTML `min` attribute
- No server-side date validation (past dates could theoretically be submitted via API)
- No "preorder" terminology anywhere in the codebase (grep returns 0 results in code files)

*Generated: 2026-03-10*
