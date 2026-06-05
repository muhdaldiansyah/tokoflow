# Preorder Deep Dive: Settings Page, Profile, & All Order Creation Paths

> Date: 2026-03-10
> Scope: How to add preorder-first defaults via a settings toggle, and how each order creation path handles `delivery_date`, `paid_amount`, and status defaults.

---

## 1. Settings Page (`app/(dashboard)/pengaturan/page.tsx`)

### Page Structure (4 sections)

| Section | Lines | Content |
|---------|-------|---------|
| TOKO KAMU | L372-503 | Profile preview + edit link, Link Pesanan (slug + toggle + copy/share/preview), store completeness checklist |
| KUOTA PESANAN | L505-639 | Quota display (remaining), free/pack breakdown, nudge banners, buy pack/unlimited buttons |
| AKUN | L641-677 | Change password, logout, admin link |
| *(No section 2 label)* | — | Section 2 was skipped in naming |

### Toggle Pattern: `order_form_enabled` (L176-187, L411-421)

This is the **only existing toggle** on the settings page. The pattern:

```tsx
// State: profile?.order_form_enabled (boolean, defaults to true via ?? true in service)
// Handler (L176-187):
async function handleToggleOrderForm() {
  if (!profile) return;
  const newValue = !profile.order_form_enabled;
  const success = await updateOrderFormEnabled(newValue);
  if (success) {
    setProfile((prev) => prev ? { ...prev, order_form_enabled: newValue } : prev);
    track("order_form_toggled", { enabled: newValue });
    toast.success(newValue ? "Link pesanan diaktifkan" : "Link pesanan dinonaktifkan");
  } else {
    toast.error("Gagal mengubah pengaturan");
  }
}

// UI (L411-421):
<button
  type="button"
  onClick={handleToggleOrderForm}
  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
    profile?.order_form_enabled !== false ? "bg-warm-green" : "bg-muted"
  }`}
>
  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
    profile?.order_form_enabled !== false ? "translate-x-5" : "translate-x-0"
  }`} />
</button>
```

**Key details to replicate:**
- Toggle is a custom `<button>` with `bg-warm-green` (on) / `bg-muted` (off)
- Knob slides with `translate-x-5` (on) / `translate-x-0` (off)
- Size: `h-6 w-11` (toggle track), `h-5 w-5` (knob)
- Service function: `updateOrderFormEnabled()` in `receipt.service.ts` (L160-170) — simple profile update
- Optimistic state update via `setProfile()`
- Analytics tracking
- Toast feedback

### Service Layer for Toggle Updates (`features/receipts/services/receipt.service.ts`)

**`updateOrderFormEnabled` (L160-170):**
```tsx
export async function updateOrderFormEnabled(enabled: boolean): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from('profiles')
    .update({ order_form_enabled: enabled })
    .eq('id', user.id);
  return !error;
}
```

**`updateProfile` (L82-113):** Generic profile updater, accepts `Partial<Profile>`. Auto-generates slug if `business_name` changes and slug is null.

**`getProfile` (L26-80):** Fetches profile with lazy monthly counter reset (orders_used, receipts_used, packs_bought_this_month).

### Store Completeness Checklist (L356-364)

Located in section 1, after slug controls. Shows incomplete items:
```tsx
const missingItems: { label: string; href: string }[] = [];
if (!profile?.logo_url) missingItems.push({ label: "Tambah foto profil / logo", href: "/profil/edit" });
if (!profile?.business_address) missingItems.push({ label: "Tambah alamat bisnis", href: "/profil/edit" });
if (!profile?.business_phone) missingItems.push({ label: "Tambah No. WhatsApp bisnis", href: "/profil/edit" });
if (!profile?.qris_url) missingItems.push({ label: "Upload QRIS pembayaran", href: "/profil/edit" });
if (productCount === 0) missingItems.push({ label: "Tambah produk", href: "/produk" });
if (productCount > 0 && productsWithImage < productCount) missingItems.push({ label: `${productCount - productsWithImage} produk belum ada foto`, href: "/produk" });
```

Only renders when `hasSlug && missingItems.length > 0` (L483).

---

## 2. Profile Edit Page (`app/(dashboard)/profil/edit/page.tsx`)

### Fields Managed (L24-29)

```tsx
const [form, setForm] = useState({
  full_name: "",
  business_name: "",
  business_address: "",
  business_phone: "",
});
```

Plus two image upload fields:
- `logoUrl` — profile photo / logo (storage bucket: `profile-photos`)
- `qrisUrl` — QRIS payment image (storage bucket: `qris-codes`)

### Save Flow (L162-172)

```tsx
const handleSave = async () => {
  setIsSaving(true);
  const updated = await updateProfile(form);  // calls receipt.service.ts updateProfile
  if (updated) {
    toast.success("Profil berhasil disimpan");
    router.push("/pengaturan");  // redirects back to settings
  } else {
    toast.error("Gagal menyimpan profil");
  }
  setIsSaving(false);
};
```

**No delivery_date or payment defaults here.** Profile edit only handles identity + QRIS. Any new preorder default toggle should go on `/pengaturan`, not `/profil/edit`.

---

## 3. Profile Interface (`features/receipts/types/receipt.types.ts`)

### Current Fields (L31-61)

```typescript
export interface Profile {
  id: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  role: string;
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  logo_url?: string;
  receipts_used: number;
  receipts_limit: number;
  orders_used: number;
  orders_limit: number;
  ai_credits_used: number;
  ai_credits_limit: number;
  ai_credits_topup: number;
  order_credits: number;
  unlimited_until?: string | null;
  packs_bought_this_month: number;
  plan: string;
  plan_expiry?: string;
  counter_reset_at?: string;
  first_wa_sent_at?: string;
  onboarding_drip?: Record<string, string>;
  slug?: string;
  order_form_enabled?: boolean;
  qris_url?: string;
  created_at: string;
  updated_at: string;
}
```

**No preorder-related fields exist yet.** A new field like `default_preorder: boolean` would need to be added here.

---

## 4. Order Creation Path 1: Dashboard (`features/orders/services/order.service.ts`)

### `createOrder` Function (L183-275)

**paid_amount default logic (L215):**
```tsx
const paidAmount = input.paid_amount ?? (input.payment_status === 'paid' ? total : 0);
```

If `paid_amount` is not explicitly set:
- `payment_status === 'paid'` → `paid_amount = total`
- Otherwise → `paid_amount = 0`

**delivery_date handling (L232):**
```tsx
delivery_date: input.delivery_date || null,
```
Simply passes through from input. No default.

**status:** Not explicitly set in the insert — defaults to DB default (which is `'new'`).

**source (L233):**
```tsx
source: input.source || 'manual',
```

### `CreateOrderInput` Interface (`features/orders/types/order.types.ts` L36-46)

```typescript
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

---

## 5. Order Creation Path 2: Dashboard Form UI (`features/orders/components/OrderForm.tsx`)

### State Initialization (L50-70)

```tsx
// Payment mode — defaults to "unpaid" for new orders
const [paymentMode, setPaymentMode] = useState<"paid" | "dp" | "unpaid">(
  initialOrder
    ? initialOrder.paid_amount >= initialOrder.total && initialOrder.total > 0
      ? "paid"
      : initialOrder.paid_amount > 0
        ? "dp"
        : "unpaid"
    : "unpaid"   // <-- DEFAULT FOR NEW ORDERS
);

// Delivery date — empty by default for new orders
const [deliveryDate, setDeliveryDate] = useState(
  initialOrder?.delivery_date
    ? new Date(initialOrder.delivery_date).toISOString().slice(0, 16)
    : ""          // <-- DEFAULT: EMPTY (no delivery date)
);

// Delivery section visibility — hidden by default for new orders
const [showDelivery, setShowDelivery] = useState(!!initialOrder?.delivery_date);
```

### Submit Handler (L418-555)

**paid_amount calculation from paymentMode (L450):**
```tsx
const paidAmount = paymentMode === "paid" ? finalTotal : paymentMode === "dp" ? (parseInt(dpAmount) || 0) : 0;
```

**delivery_date passthrough (L511):**
```tsx
delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
```

**Save & New reset (L528):**
```tsx
setPaymentMode("unpaid");  // resets to unpaid
setDeliveryDate("");         // clears delivery date
setShowDelivery(false);      // hides delivery section
```

### Delivery Date UI (L887-999)

Toggle button at L629-636:
```tsx
<button
  type="button"
  onClick={() => setShowDelivery(!showDelivery)}
  className={`... ${showDelivery || deliveryDate ? "bg-warm-green-light ..." : "bg-card ..."}`}
>
  <CalendarDays className="w-3.5 h-3.5" />
  <span className="text-xs font-medium">Tanggal</span>
</button>
```

When expanded (L887-999), shows:
- Quick chips: "Hari Ini", "Besok", "Tanggal lain"
- Optional time picker (appears after date selected)
- Clear (X) button

### Profile Load in OrderForm (L136-159)

Profile is loaded on mount for new orders only:
```tsx
useEffect(() => {
  if (isEdit) return;
  async function loadProfile() {
    const profile = await getProfile();
    if (profile) {
      setOrdersUsedBefore(profile.orders_used || 0);
      if (profile.business_name) {
        setSavedBusinessName(profile.business_name);
      }
    }
  }
  loadProfile();
  // ...
}, [isEdit, searchParams]);
```

**This is where a preorder default could be applied.** After loading profile, check `profile.default_preorder` and:
1. Set `setShowDelivery(true)` — auto-expand delivery section
2. Optionally pre-set `setDeliveryDate()` to tomorrow
3. Keep `paymentMode` as `"unpaid"` (already the default, matches preorder)

---

## 6. Order Creation Path 3: Public Order Form (`app/(public)/pesan/[slug]/PublicOrderForm.tsx`)

### delivery_date Handling (L28, L439-453)

```tsx
const [deliveryDate, setDeliveryDate] = useState("");

// UI: date input (L439-453)
<label className="text-xs font-medium text-foreground mb-1.5 block">
  <span className="flex items-center gap-1">
    <CalendarDays className="w-3.5 h-3.5" />
    Tanggal pengiriman / pengambilan
  </span>
  <span className="text-muted-foreground/70 font-normal ml-1">(opsional)</span>
</label>
<input
  type="date"
  value={deliveryDate}
  onChange={(e) => setDeliveryDate(e.target.value)}
  min={new Date().toISOString().split("T")[0]}
  ...
/>
```

### Submit (L147-153)

```tsx
body: JSON.stringify({
  slug,
  customerName: customerName.trim(),
  customerPhone: customerPhone.trim(),
  items,
  notes: notes.trim(),
  deliveryDate: deliveryDate || undefined,
  website: honeypot,
}),
```

### Profile Fields That Flow to Public Form

`PublicOrderForm` receives props from server component. These come from `getPublicBusinessInfo()`:
- `businessName` — from `profile.business_name`
- `logoUrl` — from `profile.logo_url`
- `businessAddress` — from `profile.business_address`
- `businessPhone` — from `profile.business_phone`
- `qrisUrl` — from `profile.qris_url`
- `frequentItems` — from `products` table
- `completedOrders` — count of done orders
- `hasQris` — `!!profile.qris_url`
- `orderFormEnabled` — from `profile.order_form_enabled`

**No preorder default field is currently passed to the public form.** To make delivery_date required or pre-populated on the public form, `getPublicBusinessInfo()` would need to include a `defaultPreorder` flag, and `PublicOrderForm` would need to receive and act on it.

### paid_amount in Public Orders

Always `0`. Set in `createPublicOrder()` at L159:
```tsx
paid_amount: 0,
```
This is hardcoded — public orders are always unpaid. This already matches preorder behavior.

---

## 7. Order Creation Path 4: Public API Validation (`app/api/public/orders/route.ts`)

### delivery_date handling (L101-108)

```tsx
const { deliveryDate } = body;
const result = await createPublicOrder({
  // ...
  deliveryDate: deliveryDate && typeof deliveryDate === "string" ? deliveryDate : undefined,
});
```

Simply validates it's a string and passes through. No required check. No default.

### Stock validation (L87-98)

Server-side validation against `business.frequentItems` stock levels.

---

## 8. Order Creation Path 5: Public Order Service (`lib/services/public-order.service.ts`)

### `createPublicOrder` (L124-224)

**paid_amount (L159):** Always `0`:
```tsx
paid_amount: 0,
```

**delivery_date (L161):**
```tsx
delivery_date: params.deliveryDate || null,
```

**status (L146-147):** Quota-dependent:
```tsx
const { data: hasQuota } = await supabase.rpc("check_order_limit", { p_user_id: params.businessId });
const orderStatus = hasQuota ? "new" : "menunggu";
```

**source (L162):**
```tsx
source: "order_link",
```

---

## 9. Order Creation Path 6: WA Bot (`lib/wa-bot/order-creator.ts`)

### `createOrderFromSession` (L11-122)

**paid_amount (L62):** Always `0`:
```tsx
const paidAmount = 0;
```

**delivery_date:** **NOT SET AT ALL.** The insert (L70-86) does not include `delivery_date`:
```tsx
{
  user_id: userId,
  order_number: orderNumber,
  customer_id: customerId,
  customer_name: customerName,
  customer_phone: customerPhone,
  items,
  subtotal,
  discount: 0,
  total,
  paid_amount: paidAmount,
  source: 'whatsapp',
  status: orderStatus,
  payment_status: paymentStatus,
}
```
Missing `delivery_date` means it defaults to `null` in the DB.

**status (L66-67):** Quota-dependent, same as public:
```tsx
const { data: hasQuota } = await supabase.rpc('check_order_limit', { p_user_id: userId });
const orderStatus = hasQuota ? 'new' : 'menunggu';
```

**source:** Always `'whatsapp'`.

---

## 10. WA Message Templates (`lib/utils/wa-messages.ts`)

### delivery_date in WA Messages

**`deliveryLine` helper (L27-30):**
```tsx
function deliveryLine(order: Order): string {
  if (!order.delivery_date) return "";
  return `\nTanggal: ${new Date(order.delivery_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`;
}
```

Used in:
- `buildOrderConfirmation` (L37-47) — `${deliveryLine(order)}` after order number
- `buildOrderWithStatus` (L49-61) — `${deliveryLine(order)}` after status line
- `buildCelebrationConfirmation` (L141-151) — `${deliveryLine(order)}` after order number

**Not used in:**
- `buildPaymentReminder` (L63-81) — no delivery date shown
- `buildShareLinkMessage` (L83-85) — store link share, no order context
- `buildCustomerOrderMessage` (L87-110) — customer WA message to seller, no delivery date
- `buildQrisConfirmationMessage` (L112-139) — QRIS confirmation, no delivery date

### paid_amount / payment in WA Messages

**`paymentLine` helper (L19-25):**
```tsx
function paymentLine(order: Order): string {
  const remaining = order.total - (order.paid_amount || 0);
  if (order.paid_amount > 0 && order.paid_amount < order.total) {
    return `\nDibayar: Rp${order.paid_amount.toLocaleString("id-ID")}\n*Sisa: Rp${remaining.toLocaleString("id-ID")}*`;
  }
  return "";
}
```

Only shows if partial payment. If fully paid or unpaid, returns empty string.

---

## 11. Summary: What Changes for Preorder-First Behavior

### Current Defaults vs Preorder Defaults

| Aspect | Current Default | Preorder Default |
|--------|----------------|-----------------|
| `paymentMode` (dashboard) | `"unpaid"` | `"unpaid"` (already correct) |
| `paid_amount` (public/WA) | `0` | `0` (already correct) |
| `showDelivery` (dashboard) | `false` | `true` (auto-expand) |
| `deliveryDate` (dashboard) | `""` | Tomorrow or empty (user picks) |
| `delivery_date` required (public) | Optional | Could become required |
| `delivery_date` (WA bot) | Not set | Could parse from chat |

### Implementation Plan: Adding a `default_preorder` Profile Toggle

#### Database
- Add column: `ALTER TABLE profiles ADD COLUMN default_preorder boolean DEFAULT false;`

#### TypeScript Interface
- Add to `Profile` in `features/receipts/types/receipt.types.ts` (after L57):
  ```typescript
  default_preorder?: boolean;
  ```

#### Service Layer
- Add `updateDefaultPreorder(enabled: boolean)` in `receipt.service.ts`, following `updateOrderFormEnabled` pattern (L160-170)

#### Settings Page (`app/(dashboard)/pengaturan/page.tsx`)
- Add new toggle in TOKO KAMU section (after link pesanan controls, before checklist)
- Replicate the `handleToggleOrderForm` / toggle button UI pattern exactly
- Label: "Mode Preorder" or "Default Preorder"
- Description: "Tampilkan tanggal delivery secara default di form pesanan"
- Track: `track("default_preorder_toggled", { enabled: newValue })`

#### Dashboard Order Form (`features/orders/components/OrderForm.tsx`)
- In `loadProfile()` effect (L138-145), after loading profile:
  ```tsx
  if (profile.default_preorder) {
    setShowDelivery(true);
    // Optionally pre-set to tomorrow:
    // const tmr = new Date();
    // tmr.setDate(tmr.getDate() + 1);
    // setDeliveryDate(tmr.toISOString().slice(0, 16));
  }
  ```

#### Public Order Form (`PublicOrderForm.tsx`)
- Pass `defaultPreorder` from `getPublicBusinessInfo()` → `PublicOrderForm` props
- If true: mark delivery_date as required (not optional), auto-expand
- In `getPublicBusinessInfo()` (L37-38), add `default_preorder` to SELECT

#### WA Bot (`order-creator.ts`)
- Could add `delivery_date` field to insert if parsed from chat
- No change needed for default_preorder toggle — WA bot doesn't use form UI

---

## 12. Exact Code Locations Summary

| File | Line(s) | What |
|------|---------|------|
| `app/(dashboard)/pengaturan/page.tsx` | L176-187 | Toggle handler pattern (`handleToggleOrderForm`) |
| `app/(dashboard)/pengaturan/page.tsx` | L411-421 | Toggle UI pattern (custom switch button) |
| `app/(dashboard)/pengaturan/page.tsx` | L372-503 | TOKO KAMU section (where new toggle would go) |
| `features/receipts/services/receipt.service.ts` | L160-170 | `updateOrderFormEnabled` (pattern to replicate) |
| `features/receipts/services/receipt.service.ts` | L82-113 | `updateProfile` (generic updater) |
| `features/receipts/types/receipt.types.ts` | L31-61 | `Profile` interface (add field here) |
| `features/orders/components/OrderForm.tsx` | L50-57 | `paymentMode` state init (default: `"unpaid"`) |
| `features/orders/components/OrderForm.tsx` | L65-66 | `deliveryDate` state init (default: `""`) |
| `features/orders/components/OrderForm.tsx` | L70 | `showDelivery` state init (default: `false`) |
| `features/orders/components/OrderForm.tsx` | L136-145 | Profile load effect (where to apply preorder default) |
| `features/orders/components/OrderForm.tsx` | L450 | `paidAmount` calculation from `paymentMode` |
| `features/orders/components/OrderForm.tsx` | L511 | `delivery_date` passthrough to `createOrder` |
| `features/orders/components/OrderForm.tsx` | L528-530 | Save & New reset (resets paymentMode/deliveryDate) |
| `features/orders/components/OrderForm.tsx` | L629-636 | Delivery toggle button UI |
| `features/orders/components/OrderForm.tsx` | L887-999 | Delivery date section (chips + time picker) |
| `features/orders/services/order.service.ts` | L215 | `paidAmount` default logic in `createOrder` |
| `features/orders/services/order.service.ts` | L232 | `delivery_date` passthrough in insert |
| `features/orders/types/order.types.ts` | L36-46 | `CreateOrderInput` interface |
| `lib/services/public-order.service.ts` | L37-38 | Profile SELECT in `getPublicBusinessInfo` |
| `lib/services/public-order.service.ts` | L159 | `paid_amount: 0` (hardcoded for public) |
| `lib/services/public-order.service.ts` | L161 | `delivery_date` passthrough |
| `app/api/public/orders/route.ts` | L101-108 | `deliveryDate` validation and passthrough |
| `app/(public)/pesan/[slug]/PublicOrderForm.tsx` | L28 | `deliveryDate` state init |
| `app/(public)/pesan/[slug]/PublicOrderForm.tsx` | L439-453 | Delivery date input (optional) |
| `app/(public)/pesan/[slug]/PublicOrderForm.tsx` | L152-153 | `deliveryDate` in submit body |
| `lib/wa-bot/order-creator.ts` | L62 | `paidAmount = 0` (hardcoded) |
| `lib/wa-bot/order-creator.ts` | L70-86 | Insert — missing `delivery_date` |
| `lib/utils/wa-messages.ts` | L27-30 | `deliveryLine()` helper |
| `lib/utils/wa-messages.ts` | L38 | `deliveryLine` used in order confirmation |
| `lib/utils/wa-messages.ts` | L52 | `deliveryLine` used in order with status |
| `lib/utils/wa-messages.ts` | L19-25 | `paymentLine()` helper |
| `config/plans.ts` | Full file | Quota constants and helpers |
