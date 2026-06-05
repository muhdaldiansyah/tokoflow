# Mode Pre-order — Implementation Plan

> Precise edit-by-edit plan. Each edit includes exact `old_string` and `new_string` for the `Edit` tool.
> Files listed in dependency order. All edits are verified against the current source code.
>
> Generated: 2026-03-10

---

## Phase 0: Database Migration

### File: `supabase/migrations/033_preorder_mode.sql` (NEW)

```sql
-- profiles: preorder toggle (default ON for main market)
ALTER TABLE profiles ADD COLUMN preorder_enabled BOOLEAN DEFAULT true;

-- orders: preorder flag per order
ALTER TABLE orders ADD COLUMN is_preorder BOOLEAN DEFAULT false;

-- Partial index for filtering preorder orders
CREATE INDEX idx_orders_is_preorder ON orders (user_id, is_preorder) WHERE is_preorder = true;
```

Run via Supabase SQL editor or `supabase db push`.

---

## Phase 1: Types & Service Layer (6 edits)

### Edit 1 — `features/receipts/types/receipt.types.ts`

Add `preorder_enabled` to Profile interface.

```
old_string:  order_form_enabled?: boolean;
  qris_url?: string;

new_string:  order_form_enabled?: boolean;
  preorder_enabled?: boolean;
  qris_url?: string;
```

---

### Edit 2 — `features/orders/types/order.types.ts`

Add `is_preorder` to the Order interface, after `delivery_date`.

```
old_string:  delivery_date?: string;
  payment_claimed_at?: string;

new_string:  delivery_date?: string;
  is_preorder?: boolean;
  payment_claimed_at?: string;
```

---

### Edit 3 — `features/orders/types/order.types.ts`

Add `is_preorder` to CreateOrderInput.

```
old_string:  payment_status?: PaymentStatus;
  paid_amount?: number;
}

new_string:  payment_status?: PaymentStatus;
  paid_amount?: number;
  is_preorder?: boolean;
}
```

---

### Edit 4 — `features/receipts/services/receipt.service.ts`

Add `updatePreorderEnabled()` function after `updateOrderFormEnabled()`.

```
old_string:export async function updateOrderFormEnabled(enabled: boolean): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ order_form_enabled: enabled })
    .eq('id', user.id);

  return !error;
}

// RECEIPTS

new_string:export async function updateOrderFormEnabled(enabled: boolean): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ order_form_enabled: enabled })
    .eq('id', user.id);

  return !error;
}

export async function updatePreorderEnabled(enabled: boolean): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ preorder_enabled: enabled })
    .eq('id', user.id);

  return !error;
}

// RECEIPTS
```

---

### Edit 5 — `features/orders/services/order.service.ts`

Add `is_preorder` to the `createOrder` insert object.

```
old_string:      delivery_date: input.delivery_date || null,
      source: input.source || 'manual',
      payment_status: paymentStatus,
    })
    .select()
    .single();

new_string:      delivery_date: input.delivery_date || null,
      source: input.source || 'manual',
      payment_status: paymentStatus,
      is_preorder: input.is_preorder || false,
    })
    .select()
    .single();
```

---

### Edit 6 — `features/orders/services/order.service.ts`

Add `preorderOnly` option to `getOrders`.

```
old_string:export async function getOrders(options?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  activeOnly?: boolean;
  historyOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Order[]> {

new_string:export async function getOrders(options?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  activeOnly?: boolean;
  historyOnly?: boolean;
  preorderOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Order[]> {
```

Add the filter query after the `activeOnly/historyOnly` block:

```
old_string:  if (options?.activeOnly) {
    query = query.not('status', 'in', '("done","cancelled")');
  } else if (options?.historyOnly) {
    query = query.in('status', ['done', 'cancelled']);
  }

  const { data, error } = await query;

new_string:  if (options?.activeOnly) {
    query = query.not('status', 'in', '("done","cancelled")');
  } else if (options?.historyOnly) {
    query = query.in('status', ['done', 'cancelled']);
  }

  if (options?.preorderOnly) {
    query = query.eq('is_preorder', true);
  }

  const { data, error } = await query;
```

---

## Phase 2: Settings Page (2 edits)

### Edit 7 — `app/(dashboard)/pengaturan/page.tsx`

Add import for `updatePreorderEnabled`.

```
old_string:import { getProfile, updateSlug, updateOrderFormEnabled } from "@/features/receipts/services/receipt.service";

new_string:import { getProfile, updateSlug, updateOrderFormEnabled, updatePreorderEnabled } from "@/features/receipts/services/receipt.service";
```

---

### Edit 8 — `app/(dashboard)/pengaturan/page.tsx`

Add `handleTogglePreorder` handler after `handleToggleOrderForm`, and add the UI after the Link Pesanan section. Also add the `Package` icon import.

First, add the `Package` icon to the import:

```
old_string:import { Loader2, Pencil, KeyRound, LinkIcon, Copy, Check, MessageSquare, Zap, Shield, ChevronRight } from "lucide-react";

new_string:import { Loader2, Pencil, KeyRound, LinkIcon, Copy, Check, MessageSquare, Zap, Shield, ChevronRight, Package } from "lucide-react";
```

Then, add the handler after `handleToggleOrderForm`:

```
old_string:  async function handleToggleOrderForm() {
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

  function handleCopyLink() {

new_string:  async function handleToggleOrderForm() {
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

  async function handleTogglePreorder() {
    if (!profile) return;
    const newValue = !(profile.preorder_enabled ?? true);
    const success = await updatePreorderEnabled(newValue);
    if (success) {
      setProfile((prev) => prev ? { ...prev, preorder_enabled: newValue } : prev);
      track("preorder_mode_toggled", { enabled: newValue });
      toast.success(newValue ? "Mode pre-order diaktifkan" : "Mode pre-order dinonaktifkan");
    } else {
      toast.error("Gagal mengubah pengaturan");
    }
  }

  function handleCopyLink() {
```

Now add the Mode Pre-order section in the UI. Insert it as a new `border-t` section inside the TOKO KAMU card, after the Link Pesanan section (after the closing `</div>` of the Link + toggle section and before the checklist):

```
old_string:        {/* Incomplete items — only show when something is missing */}
        {hasSlug && missingItems.length > 0 && (

new_string:        {/* Mode Pre-order */}
        <div className="border-t px-4 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Mode Pre-order</p>
            </div>
            <button
              type="button"
              onClick={handleTogglePreorder}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                (profile?.preorder_enabled ?? true) ? "bg-warm-green" : "bg-muted"
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                (profile?.preorder_enabled ?? true) ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pelanggan wajib pilih tanggal pengiriman. Pembayaran QRIS tidak ditampilkan setelah pesan — kamu yang atur kapan pelanggan bayar.
          </p>
        </div>

        {/* Incomplete items — only show when something is missing */}
        {hasSlug && missingItems.length > 0 && (
```

---

## Phase 3: Public Order Service & API (4 edits)

### Edit 9 — `lib/services/public-order.service.ts`

Add `preorderEnabled` to the `PublicBusinessInfo` interface.

```
old_string:  completedOrders: number;
  hasQris: boolean;
}

new_string:  completedOrders: number;
  hasQris: boolean;
  preorderEnabled: boolean;
}
```

---

### Edit 10 — `lib/services/public-order.service.ts`

Add `preorder_enabled` to the profile SELECT query.

```
old_string:    .select("id, business_name, order_form_enabled, plan_expiry, qris_url, logo_url, business_address, business_phone")

new_string:    .select("id, business_name, order_form_enabled, plan_expiry, qris_url, logo_url, business_address, business_phone, preorder_enabled")
```

---

### Edit 11 — `lib/services/public-order.service.ts`

Add `preorderEnabled` to the return object.

```
old_string:    completedOrders: completedOrders ?? 0,
    hasQris: !!profile.qris_url,
  };

new_string:    completedOrders: completedOrders ?? 0,
    hasQris: !!profile.qris_url,
    preorderEnabled: profile.preorder_enabled ?? true,
  };
```

---

### Edit 12 — `lib/services/public-order.service.ts`

Add `is_preorder` to the order insert in `createPublicOrder`. Also add the `isPreorder` parameter.

```
old_string:export async function createPublicOrder(params: {
  businessId: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; qty: number; price: number }[];
  notes: string;
  deliveryDate?: string;
}): Promise<{ orderId: string; orderNumber: string } | null> {

new_string:export async function createPublicOrder(params: {
  businessId: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; qty: number; price: number }[];
  notes: string;
  deliveryDate?: string;
  isPreorder?: boolean;
}): Promise<{ orderId: string; orderNumber: string } | null> {
```

```
old_string:      source: "order_link",
      status: orderStatus,
    })
    .select("id, order_number")

new_string:      source: "order_link",
      status: orderStatus,
      is_preorder: params.isPreorder || false,
    })
    .select("id, order_number")
```

---

### Edit 13 — `app/api/public/orders/route.ts`

Pass `isPreorder` from the resolved business info to `createPublicOrder`, and validate delivery date when preorder.

```
old_string:    // Create order
    const { deliveryDate } = body;
    const result = await createPublicOrder({
      businessId: business.businessId,
      customerName: String(customerName).trim().slice(0, 100),
      customerPhone: String(customerPhone).trim().slice(0, 20),
      items: sanitizedItems,
      notes: hasNotes ? String(notes).trim().slice(0, 500) : "",
      deliveryDate: deliveryDate && typeof deliveryDate === "string" ? deliveryDate : undefined,
    });

new_string:    // Create order
    const { deliveryDate } = body;

    // Validate delivery date required when preorder mode is ON
    const isPreorder = business.preorderEnabled;
    if (isPreorder && (!deliveryDate || typeof deliveryDate !== "string")) {
      return NextResponse.json({ error: "Tanggal pengiriman wajib diisi untuk pre-order" }, { status: 400 });
    }

    const result = await createPublicOrder({
      businessId: business.businessId,
      customerName: String(customerName).trim().slice(0, 100),
      customerPhone: String(customerPhone).trim().slice(0, 20),
      items: sanitizedItems,
      notes: hasNotes ? String(notes).trim().slice(0, 500) : "",
      deliveryDate: deliveryDate && typeof deliveryDate === "string" ? deliveryDate : undefined,
      isPreorder,
    });
```

Also add `preorderEnabled` to the `PublicBusinessInfo` import type (already comes from `getPublicBusinessInfo` return value, no import change needed).

---

## Phase 4: Public Order Form (4 edits)

### Edit 14 — `app/(public)/pesan/[slug]/page.tsx`

Pass `preorderEnabled` to `PublicOrderForm`.

```
old_string:    <PublicOrderForm
      slug={slug}
      businessName={business.businessName}
      frequentItems={business.frequentItems}
      logoUrl={business.logoUrl}
      businessAddress={business.businessAddress}
      businessPhone={business.businessPhone}
      completedOrders={business.completedOrders}
      hasQris={business.hasQris}
      qrisUrl={business.qrisUrl}
    />

new_string:    <PublicOrderForm
      slug={slug}
      businessName={business.businessName}
      frequentItems={business.frequentItems}
      logoUrl={business.logoUrl}
      businessAddress={business.businessAddress}
      businessPhone={business.businessPhone}
      completedOrders={business.completedOrders}
      hasQris={business.hasQris}
      qrisUrl={business.qrisUrl}
      preorderEnabled={business.preorderEnabled}
    />
```

---

### Edit 15 — `app/(public)/pesan/[slug]/PublicOrderForm.tsx`

Add `preorderEnabled` to the props interface.

```
old_string:interface PublicOrderFormProps {
  slug: string;
  businessName: string;
  frequentItems: PublicFrequentItem[];
  logoUrl?: string;
  businessAddress?: string;
  businessPhone?: string;
  completedOrders: number;
  hasQris: boolean;
  qrisUrl?: string;
}

new_string:interface PublicOrderFormProps {
  slug: string;
  businessName: string;
  frequentItems: PublicFrequentItem[];
  logoUrl?: string;
  businessAddress?: string;
  businessPhone?: string;
  completedOrders: number;
  hasQris: boolean;
  qrisUrl?: string;
  preorderEnabled: boolean;
}
```

Update the destructuring:

```
old_string:export function PublicOrderForm({ slug, businessName, frequentItems, logoUrl, businessAddress, businessPhone, completedOrders, hasQris, qrisUrl }: PublicOrderFormProps) {

new_string:export function PublicOrderForm({ slug, businessName, frequentItems, logoUrl, businessAddress, businessPhone, completedOrders, hasQris, qrisUrl, preorderEnabled }: PublicOrderFormProps) {
```

---

### Edit 16 — `app/(public)/pesan/[slug]/PublicOrderForm.tsx`

Change subtitle text and delivery_date label/validation. First the subtitle:

```
old_string:        <p className="text-sm text-muted-foreground mt-1">Pesan sekarang, langsung masuk!</p>

new_string:        <p className="text-sm text-muted-foreground mt-1">{preorderEnabled ? "Pre-order sekarang!" : "Pesan sekarang, langsung masuk!"}</p>
```

Change delivery date field — label, required indicator, min date:

```
old_string:          <div>
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
              className="w-full h-12 px-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-warm-green/20 focus:border-warm-green/30 transition-colors text-foreground"
            />
          </div>

new_string:          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                Tanggal pengiriman / pengambilan
              </span>
              {preorderEnabled
                ? <span className="text-warm-rose ml-0.5">*</span>
                : <span className="text-muted-foreground/70 font-normal ml-1">(opsional)</span>
              }
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required={preorderEnabled}
              min={(() => {
                const d = new Date();
                if (preorderEnabled) d.setDate(d.getDate() + 1);
                return d.toISOString().split("T")[0];
              })()}
              className="w-full h-12 px-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-warm-green/20 focus:border-warm-green/30 transition-colors text-foreground"
            />
          </div>
```

---

### Edit 17 — `app/(public)/pesan/[slug]/PublicOrderForm.tsx`

Change submit buttons text. There are two submit buttons: the main one and the sticky bar one.

Main submit button:

```
old_string:              "Kirim Pesanan"
            )}
          </button>
        </div>
      </form>

new_string:              {preorderEnabled ? "Kirim Pre-order" : "Kirim Pesanan"}
            )}
          </button>
        </div>
      </form>
```

Sticky bar submit button:

```
old_string:              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Kirim Pesanan"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Subtle branding */}

new_string:              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                preorderEnabled ? "Kirim Pre-order" : "Kirim Pesanan"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Subtle branding */}
```

---

### Edit 18 — `app/(public)/pesan/[slug]/PublicOrderForm.tsx`

Add delivery date validation in `handleSubmit` and store `isPreorder` in sessionStorage.

```
old_string:    if (!hasItems && !notes.trim()) {
      setError("Pilih item atau tulis pesanan kamu");
      return;
    }

new_string:    if (!hasItems && !notes.trim()) {
      setError("Pilih item atau tulis pesanan kamu");
      return;
    }
    if (preorderEnabled && !deliveryDate) {
      setError("Tanggal pengiriman wajib diisi untuk pre-order");
      return;
    }
```

Store `isPreorder` in sessionStorage:

```
old_string:        sessionStorage.setItem("catatorder_last_order", JSON.stringify({
          orderNumber: data.orderNumber,
          orderId: data.orderId,
          items,
          total: subtotal,
          notes: notes.trim(),
          customerName: customerName.trim(),
          deliveryDate: deliveryDate || undefined,
        }));

new_string:        sessionStorage.setItem("catatorder_last_order", JSON.stringify({
          orderNumber: data.orderNumber,
          orderId: data.orderId,
          items,
          total: subtotal,
          notes: notes.trim(),
          customerName: customerName.trim(),
          deliveryDate: deliveryDate || undefined,
          isPreorder: preorderEnabled,
        }));
```

---

## Phase 5: Success Page (5 edits)

### Edit 19 — `app/(public)/pesan/[slug]/sukses/page.tsx`

Change the header text to be conditional on preorder. We need the `isPreorder` from the business info since sessionStorage is not available in server component.

```
old_string:  const business = await getPublicBusinessInfo(slug);
  const qrisUrl = business?.qrisUrl;
  const businessPhone = phone || business?.businessPhone;
  const totalAmount = total ? parseInt(total, 10) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-warm-green-light flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-warm-green" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Pesanan masuk!
        </h1>
        <p className="text-sm text-muted-foreground">
          {name || "Penjual"} akan konfirmasi via WhatsApp sebentar lagi ya.
        </p>
      </div>

      <SuccessActions
        qrisUrl={qrisUrl}
        businessPhone={businessPhone}
        orderNumber={order || ""}
        orderId={oid}
        businessName={name || ""}
        slug={slug}
        totalFromUrl={totalAmount}
      />

new_string:  const business = await getPublicBusinessInfo(slug);
  const qrisUrl = business?.qrisUrl;
  const businessPhone = phone || business?.businessPhone;
  const totalAmount = total ? parseInt(total, 10) : 0;
  const isPreorder = business?.preorderEnabled ?? false;

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-warm-green-light flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-warm-green" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-1">
          {isPreorder ? "Pre-order tercatat!" : "Pesanan masuk!"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isPreorder
            ? "Pesanan kamu sudah dicatat. Penjual akan menghubungi kamu untuk konfirmasi dan pembayaran."
            : `${name || "Penjual"} akan konfirmasi via WhatsApp sebentar lagi ya.`
          }
        </p>
      </div>

      <SuccessActions
        qrisUrl={qrisUrl}
        businessPhone={businessPhone}
        orderNumber={order || ""}
        orderId={oid}
        businessName={name || ""}
        slug={slug}
        totalFromUrl={totalAmount}
        isPreorder={isPreorder}
      />
```

---

### Edit 20 — `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx`

Add `isPreorder` to the OrderDetails interface.

```
old_string:interface OrderDetails {
  orderNumber: string;
  orderId?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  notes?: string;
  customerName: string;
  deliveryDate?: string;
}

new_string:interface OrderDetails {
  orderNumber: string;
  orderId?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  notes?: string;
  customerName: string;
  deliveryDate?: string;
  isPreorder?: boolean;
}
```

Add `isPreorder` to the SuccessActionsProps interface.

```
old_string:interface SuccessActionsProps {
  qrisUrl?: string;
  businessPhone?: string;
  orderNumber: string;
  orderId?: string;
  businessName: string;
  slug: string;
  totalFromUrl?: number;
}

new_string:interface SuccessActionsProps {
  qrisUrl?: string;
  businessPhone?: string;
  orderNumber: string;
  orderId?: string;
  businessName: string;
  slug: string;
  totalFromUrl?: number;
  isPreorder?: boolean;
}
```

Update the destructuring:

```
old_string:export function SuccessActions({ qrisUrl, businessPhone, orderNumber, orderId, businessName, slug, totalFromUrl }: SuccessActionsProps) {

new_string:export function SuccessActions({ qrisUrl, businessPhone, orderNumber, orderId, businessName, slug, totalFromUrl, isPreorder }: SuccessActionsProps) {
```

---

### Edit 21 — `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx`

Hide QRIS in receipt PNG when preorder. Change the QRIS image loading condition:

```
old_string:      // Load QRIS image first if available
      let qrisImg: HTMLImageElement | null = null;
      if (qrisUrl) {

new_string:      // Load QRIS image first if available (skip for preorder)
      let qrisImg: HTMLImageElement | null = null;
      if (qrisUrl && !isPreorder) {
```

---

### Edit 22 — `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx`

Hide QRIS payment section and show "Hubungi Penjual via WA" for preorder. Change the QRIS card condition:

```
old_string:      {/* QRIS payment — single unified card */}
      {qrisUrl && !paidConfirmed && (

new_string:      {/* QRIS payment — single unified card (hidden for preorder) */}
      {qrisUrl && !paidConfirmed && !isPreorder && (
```

Hide post-payment confirmation for preorder:

```
old_string:      {/* After "Sudah Bayar" — confirmation state */}
      {qrisUrl && paidConfirmed && (

new_string:      {/* After "Sudah Bayar" — confirmation state (hidden for preorder) */}
      {qrisUrl && paidConfirmed && !isPreorder && (
```

Add preorder WA CTA before the no-QRIS WA button:

```
old_string:      {/* No QRIS — single WA button */}
      {!qrisUrl && businessPhone && (

new_string:      {/* Preorder — primary CTA is "Hubungi Penjual via WA" */}
      {isPreorder && businessPhone && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20bd5a] active:bg-[#1da851] transition-colors"
        >
          <MessageCircle className="w-4.5 h-4.5" />
          Hubungi Penjual via WA
        </button>
      )}

      {/* No QRIS — single WA button (not for preorder, handled above) */}
      {!isPreorder && !qrisUrl && businessPhone && (
```

---

### Edit 23 — `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx`

Change WA message routing for preorder — use customer order message instead of QRIS confirmation.

```
old_string:  function handleWhatsApp() {
    if (orderDetails) {
      const message = qrisUrl
        ? buildQrisConfirmationMessage({
            orderNumber: orderDetails.orderNumber,
            orderId: orderDetails.orderId || orderId,
            items: orderDetails.items,
            total: orderDetails.total,
            customerName: orderDetails.customerName,
            notes: orderDetails.notes,
          })
        : buildCustomerOrderMessage({
            orderNumber: orderDetails.orderNumber,
            orderId: orderDetails.orderId || orderId,
            items: orderDetails.items,
            total: orderDetails.total,
            customerName: orderDetails.customerName,
            notes: orderDetails.notes,
          });
      openWhatsAppPublic(message, businessPhone);
    } else {
      const receiptLink = orderId ? `\n\nStruk: catatorder.id/r/${orderId}` : "";
      const prefix = qrisUrl ? "Saya sudah bayar via QRIS untuk pesanan" : "Saya baru saja pesan";
      const message = `Halo, ${prefix} *${orderNumber}*.${receiptLink}\n\nMohon dikonfirmasi ya. Terima kasih!`;
      openWhatsAppPublic(message, businessPhone);
    }
  }

new_string:  function handleWhatsApp() {
    if (orderDetails) {
      const message = (qrisUrl && !isPreorder)
        ? buildQrisConfirmationMessage({
            orderNumber: orderDetails.orderNumber,
            orderId: orderDetails.orderId || orderId,
            items: orderDetails.items,
            total: orderDetails.total,
            customerName: orderDetails.customerName,
            notes: orderDetails.notes,
          })
        : buildCustomerOrderMessage({
            orderNumber: orderDetails.orderNumber,
            orderId: orderDetails.orderId || orderId,
            items: orderDetails.items,
            total: orderDetails.total,
            customerName: orderDetails.customerName,
            notes: orderDetails.notes,
          });
      openWhatsAppPublic(message, businessPhone);
    } else {
      const receiptLink = orderId ? `\n\nStruk: catatorder.id/r/${orderId}` : "";
      const prefix = (qrisUrl && !isPreorder) ? "Saya sudah bayar via QRIS untuk pesanan" : "Saya baru saja pesan";
      const message = `Halo, ${prefix} *${orderNumber}*.${receiptLink}\n\nMohon dikonfirmasi ya. Terima kasih!`;
      openWhatsAppPublic(message, businessPhone);
    }
  }
```

---

## Phase 6: Live Order Page (3 edits)

### Edit 24 — `app/(public)/r/[id]/page.tsx`

Add `is_preorder` to the order query and pass to `ReceiptActions`.

```
old_string:    .select("order_number, customer_name, items, subtotal, discount, total, paid_amount, notes, status, delivery_date, payment_claimed_at, created_at, user_id")

new_string:    .select("order_number, customer_name, items, subtotal, discount, total, paid_amount, notes, status, delivery_date, is_preorder, payment_claimed_at, created_at, user_id")
```

Add `preorder_enabled` to profile query:

```
old_string:    .select("business_name, logo_url, slug, business_phone, qris_url")

new_string:    .select("business_name, logo_url, slug, business_phone, qris_url, preorder_enabled")
```

Add a "Pre-order" badge in the status badge area:

```
old_string:          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className={`inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center ${statusConfig.chipClass}`}>
              {statusConfig.label}
            </span>

new_string:          <div className="flex items-center justify-center gap-1.5 mb-3">
            {order.is_preorder && (
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-violet-50 text-violet-700 border-violet-200">
                Pre-order
              </span>
            )}
            <span className={`inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center ${statusConfig.chipClass}`}>
              {statusConfig.label}
            </span>
```

Pass `isPreorder` to `ReceiptActions`:

```
old_string:        <ReceiptActions
          orderId={id}
          orderNumber={order.order_number}
          waPhone={waPhone}
          slug={profile?.slug}
          qrisUrl={profile?.qris_url}
          total={order.total}
          showPayment={!isPaid && status !== "done" && status !== "cancelled"}
          businessName={businessName}
          paymentClaimedAt={order.payment_claimed_at}
        />

new_string:        <ReceiptActions
          orderId={id}
          orderNumber={order.order_number}
          waPhone={waPhone}
          slug={profile?.slug}
          qrisUrl={profile?.qris_url}
          total={order.total}
          showPayment={!isPaid && status !== "done" && status !== "cancelled"}
          businessName={businessName}
          paymentClaimedAt={order.payment_claimed_at}
          isPreorder={!!order.is_preorder}
        />
```

---

### Edit 25 — `app/(public)/r/[id]/ReceiptActions.tsx`

Add `isPreorder` prop and hide QRIS/payment sections when preorder.

```
old_string:interface ReceiptActionsProps {
  orderId: string;
  orderNumber: string;
  waPhone?: string | null;
  slug?: string | null;
  qrisUrl?: string | null;
  total: number;
  showPayment: boolean;
  businessName: string;
  paymentClaimedAt?: string | null;
}

new_string:interface ReceiptActionsProps {
  orderId: string;
  orderNumber: string;
  waPhone?: string | null;
  slug?: string | null;
  qrisUrl?: string | null;
  total: number;
  showPayment: boolean;
  businessName: string;
  paymentClaimedAt?: string | null;
  isPreorder?: boolean;
}
```

Update destructuring:

```
old_string:export function ReceiptActions({ orderId, orderNumber, waPhone, slug, qrisUrl, total, showPayment, businessName, paymentClaimedAt }: ReceiptActionsProps) {

new_string:export function ReceiptActions({ orderId, orderNumber, waPhone, slug, qrisUrl, total, showPayment, businessName, paymentClaimedAt, isPreorder }: ReceiptActionsProps) {
```

Hide QRIS + Sudah Bayar for preorder:

```
old_string:      {/* QRIS + Sudah Bayar — only if unpaid and QRIS available */}
      {showPayment && qrisUrl && !paidConfirmed && (

new_string:      {/* QRIS + Sudah Bayar — only if unpaid, QRIS available, not preorder */}
      {showPayment && qrisUrl && !paidConfirmed && !isPreorder && (
```

Hide Sudah Bayar without QRIS for preorder:

```
old_string:      {/* Sudah Bayar without QRIS — simple button */}
      {showPayment && !qrisUrl && !paidConfirmed && (

new_string:      {/* Sudah Bayar without QRIS — simple button (not for preorder) */}
      {showPayment && !qrisUrl && !paidConfirmed && !isPreorder && (
```

Hide post-claim confirmation for preorder:

```
old_string:      {/* After "Sudah Bayar" — confirmation state */}
      {showPayment && paidConfirmed && (

new_string:      {/* After "Sudah Bayar" — confirmation state (not for preorder) */}
      {showPayment && paidConfirmed && !isPreorder && (
```

Update Hubungi Penjual condition to always show for preorder:

```
old_string:      {/* Hubungi Penjual — only if NOT in payment flow */}
      {waPhone && (!showPayment || (showPayment && !paidConfirmed && !qrisUrl)) && !paidConfirmed && (

new_string:      {/* Hubungi Penjual — always for preorder, otherwise only if NOT in payment flow */}
      {waPhone && (isPreorder || (!showPayment || (showPayment && !paidConfirmed && !qrisUrl)) && !paidConfirmed) && (
```

---

## Phase 7: Dashboard Order Card & List (4 edits)

### Edit 26 — `features/orders/components/OrderCard.tsx`

Add violet "Pre-order" badge before the status badge in row 3.

```
old_string:          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            <OrderStatusBadge status={order.status} />

new_string:          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {order.is_preorder && (
              <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-violet-50 text-violet-700 border-violet-200">
                Pre-order
              </span>
            )}
            <OrderStatusBadge status={order.status} />
```

---

### Edit 27 — `features/orders/components/OrderList.tsx`

Add `preorderFilter` state and "Pre-order" chip in filter area.

Add state:

```
old_string:  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | null>(null);

new_string:  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | null>(null);
  const [preorderFilter, setPreorderFilter] = useState(false);
```

Pass `preorderOnly` to fetch:

```
old_string:    const { orders: data, fromCache: cached } = await fetchOrdersWithCache({
      status: statusFilter || undefined,
      paymentStatus: paymentFilter || undefined,
      activeOnly: activeTab === "active" ? true : undefined,
      historyOnly: activeTab === "history" ? true : undefined,
      search: debouncedSearch || undefined,
      offset: 0,
    });

new_string:    const { orders: data, fromCache: cached } = await fetchOrdersWithCache({
      status: statusFilter || undefined,
      paymentStatus: paymentFilter || undefined,
      activeOnly: activeTab === "active" ? true : undefined,
      historyOnly: activeTab === "history" ? true : undefined,
      preorderOnly: preorderFilter || undefined,
      search: debouncedSearch || undefined,
      offset: 0,
    });
```

Update the `loadMore` to pass preorder filter too:

```
old_string:    const data = await getOrders({
      status: statusFilter || undefined,
      paymentStatus: paymentFilter || undefined,
      activeOnly: activeTab === "active" ? true : undefined,
      historyOnly: activeTab === "history" ? true : undefined,
      search: debouncedSearch || undefined,
      offset: orders.length,
    });

new_string:    const data = await getOrders({
      status: statusFilter || undefined,
      paymentStatus: paymentFilter || undefined,
      activeOnly: activeTab === "active" ? true : undefined,
      historyOnly: activeTab === "history" ? true : undefined,
      preorderOnly: preorderFilter || undefined,
      search: debouncedSearch || undefined,
      offset: orders.length,
    });
```

Add `preorderFilter` to the `useEffect` dependency array:

```
old_string:  useEffect(() => {
    loadOrders();
  }, [activeTab, statusFilter, paymentFilter, debouncedSearch]);

new_string:  useEffect(() => {
    loadOrders();
  }, [activeTab, statusFilter, paymentFilter, preorderFilter, debouncedSearch]);
```

Add "Pre-order" filter chip after the payment chips in the filter UI:

```
old_string:              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider pr-0.5">Bayar</span>
                {PAYMENT_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setPaymentFilter(paymentFilter === chip.value ? null : chip.value as PaymentStatus)}
                    className={`shrink-0 inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
                      paymentFilter === chip.value
                        ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                        : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

new_string:              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider pr-0.5">Bayar</span>
                {PAYMENT_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setPaymentFilter(paymentFilter === chip.value ? null : chip.value as PaymentStatus)}
                    className={`shrink-0 inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
                      paymentFilter === chip.value
                        ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                        : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <span className="shrink-0 w-px bg-border self-stretch my-1.5" />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreorderFilter(!preorderFilter)}
                  className={`shrink-0 inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
                    preorderFilter
                      ? "bg-violet-50 border-violet-200 text-violet-700"
                      : "bg-muted/50 border-border text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Pre-order
                </button>
              </div>
            </div>
```

Update the filter dot indicator to include preorderFilter:

```
old_string:                {(statusFilter || paymentFilter) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warm-green" />
                )}

new_string:                {(statusFilter || paymentFilter || preorderFilter) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warm-green" />
                )}
```

---

### Edit 28 — `features/orders/components/OrderForm.tsx`

Add "Pre-order" toggle button for manual orders and auto-expand delivery when preorder profile enabled.

Add `isPreorder` state after `showDelivery`:

```
old_string:  const [showDelivery, setShowDelivery] = useState(!!initialOrder?.delivery_date);
  const [showNotes, setShowNotes] = useState(!!initialOrder?.notes);

new_string:  const [showDelivery, setShowDelivery] = useState(!!initialOrder?.delivery_date);
  const [isPreorder, setIsPreorder] = useState(initialOrder?.is_preorder || false);
  const [showNotes, setShowNotes] = useState(!!initialOrder?.notes);
```

Auto-expand delivery and set preorder when profile has `preorder_enabled`, in the profile load effect:

```
old_string:      const profile = await getProfile();
      if (profile) {
        setOrdersUsedBefore(profile.orders_used || 0);
        if (profile.business_name) {
          setSavedBusinessName(profile.business_name);
        }
      }

new_string:      const profile = await getProfile();
      if (profile) {
        setOrdersUsedBefore(profile.orders_used || 0);
        if (profile.business_name) {
          setSavedBusinessName(profile.business_name);
        }
        if (profile.preorder_enabled ?? true) {
          setShowDelivery(true);
          setIsPreorder(true);
        }
      }
```

Add `is_preorder` to `createOrder` call (online path):

```
old_string:    const order = await createOrder({
      items: finalItems,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      notes: notes || undefined,
      discount: discountAmount,
      delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      paid_amount: paidAmount,
      source: "manual",
    });

new_string:    const order = await createOrder({
      items: finalItems,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      notes: notes || undefined,
      discount: discountAmount,
      delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      paid_amount: paidAmount,
      source: "manual",
      is_preorder: isPreorder,
    });
```

Add `is_preorder` to `updateOrder` call (edit path):

```
old_string:      const updated = await updateOrder(initialOrder.id, {
        items: finalItems,
        customer_name: customerName || "",
        customer_phone: customerPhone || "",
        notes: notes || "",
        discount: discountAmount,
        paid_amount: paidAmount,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      } as Partial<Order>);

new_string:      const updated = await updateOrder(initialOrder.id, {
        items: finalItems,
        customer_name: customerName || "",
        customer_phone: customerPhone || "",
        notes: notes || "",
        discount: discountAmount,
        paid_amount: paidAmount,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        is_preorder: isPreorder,
      } as Partial<Order>);
```

Add `is_preorder` to offline create path:

```
old_string:      await createOrderOffline({
        items: finalItems,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        notes: notes || undefined,
        discount: discountAmount,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        paid_amount: paidAmount,
        source: "manual",
      });

new_string:      await createOrderOffline({
        items: finalItems,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        notes: notes || undefined,
        discount: discountAmount,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        paid_amount: paidAmount,
        source: "manual",
        is_preorder: isPreorder,
      });
```

Add "Pre-order" toggle button after the "Tanggal" button in the toggle buttons area. Also add the `Package` icon import:

```
old_string:import { ArrowLeft, Plus, Trash2, User, Check, MessageSquare, FileText, Percent, Pencil, CalendarDays, Lightbulb, Sparkles, Bell, Receipt } from "lucide-react";

new_string:import { ArrowLeft, Plus, Trash2, User, Check, MessageSquare, FileText, Percent, Pencil, CalendarDays, Lightbulb, Sparkles, Bell, Receipt, Package } from "lucide-react";
```

```
old_string:          <button
            type="button"
            onClick={() => setShowDelivery(!showDelivery)}
            className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border transition-colors ${showDelivery || deliveryDate ? "bg-warm-green-light border-warm-green/30 text-warm-green" : "bg-card border-border text-foreground/70 shadow-sm hover:bg-muted hover:text-foreground"}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Tanggal</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}

new_string:          <button
            type="button"
            onClick={() => setShowDelivery(!showDelivery)}
            className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border transition-colors ${showDelivery || deliveryDate ? "bg-warm-green-light border-warm-green/30 text-warm-green" : "bg-card border-border text-foreground/70 shadow-sm hover:bg-muted hover:text-foreground"}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Tanggal</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPreorder(!isPreorder);
              if (!isPreorder && !showDelivery) setShowDelivery(true);
            }}
            className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border transition-colors ${isPreorder ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-card border-border text-foreground/70 shadow-sm hover:bg-muted hover:text-foreground"}`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Pre-order</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
```

Reset preorder state in Save & New:

```
old_string:        setPaymentMode("unpaid");
        setDpAmount("");
        setDeliveryDate("");
        setShowDelivery(false);

new_string:        setPaymentMode("unpaid");
        setDpAmount("");
        setDeliveryDate("");
        setShowDelivery(false);
        setIsPreorder(false);
```

---

## Phase 8: WA Messages & WA Bot (2 edits)

### Edit 29 — `lib/utils/wa-messages.ts`

Add `buildPreorderConfirmation` function after `buildOrderConfirmation`.

```
old_string:export function buildOrderWithStatus(order: Order): string {

new_string:export function buildPreorderConfirmation(order: Order): string {
  return `*Pre-order Tercatat* \u2705

Hai ${order.customer_name || "Kak"}! Pre-order kamu sudah dicatat:

${formatItemsDash(order.items)}
${DIVIDER}
*Total: Rp${order.total.toLocaleString("id-ID")}*${paymentLine(order)}${deliveryLine(order)}

Kami akan hubungi kamu untuk konfirmasi pembayaran.

Terima kasih! \uD83D\uDE4F

${BRANDING}`;
}

export function buildOrderWithStatus(order: Order): string {
```

---

### Edit 30 — `lib/wa-bot/order-creator.ts`

Add `is_preorder` to the WA bot order insert based on the seller's profile `preorder_enabled` setting.

```
old_string:    // Check quota — if exhausted, order goes to "menunggu"
    const { data: hasQuota } = await supabase.rpc('check_order_limit', { p_user_id: userId });
    const orderStatus = hasQuota ? 'new' : 'menunggu';

    // Create order
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
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
      });

new_string:    // Check quota — if exhausted, order goes to "menunggu"
    const { data: hasQuota } = await supabase.rpc('check_order_limit', { p_user_id: userId });
    const orderStatus = hasQuota ? 'new' : 'menunggu';

    // Check if seller has preorder mode enabled
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('preorder_enabled')
      .eq('id', userId)
      .single();
    const isPreorder = sellerProfile?.preorder_enabled ?? true;

    // Create order
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
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
        is_preorder: isPreorder,
      });
```

---

## Phase 9: Offline Sync (1 edit)

### Edit 31 — `lib/offline/sync.ts`

Add `preorderOnly` to the `FetchOptions` interface so it passes through to `getOrders`.

```
old_string:interface FetchOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  activeOnly?: boolean;
  historyOnly?: boolean;
  offset?: number;
}

new_string:interface FetchOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  activeOnly?: boolean;
  historyOnly?: boolean;
  preorderOnly?: boolean;
  offset?: number;
}
```

Also update the cache bypass condition to include `preorderOnly`:

```
old_string:      if (!options?.offset && !options?.status && !options?.paymentStatus && !options?.search && !options?.activeOnly && !options?.historyOnly) {

new_string:      if (!options?.offset && !options?.status && !options?.paymentStatus && !options?.search && !options?.activeOnly && !options?.historyOnly && !options?.preorderOnly) {
```

---

## Summary

| Phase | Files | Edits | What |
|-------|-------|-------|------|
| 0 | 1 new migration | 1 | DB: `profiles.preorder_enabled`, `orders.is_preorder`, index |
| 1 | 4 files | 6 | Types + service layer |
| 2 | 1 file | 2 | Settings page toggle |
| 3 | 3 files | 5 | Public order service + API |
| 4 | 2 files | 5 | Public order form UI |
| 5 | 2 files | 5 | Success page |
| 6 | 2 files | 2 | Live order page |
| 7 | 3 files | 4 | Dashboard OrderCard, OrderList, OrderForm |
| 8 | 2 files | 2 | WA messages + WA bot |
| 9 | 1 file | 1 | Offline sync passthrough |
| **Total** | **19 files** | **~32 edits** | |

### Implementation Order

1. Migration (Phase 0) — run first, no code deps
2. Types & service (Phase 1) — foundation everything else depends on
3. Settings page (Phase 2) — independent, seller can toggle
4. Public service + API (Phase 3) — service layer for public flow
5. Public form (Phase 4) — depends on Phase 3
6. Success page (Phase 5) — depends on Phase 3
7. Live order page (Phase 6) — depends on Phase 1
8. Dashboard (Phase 7) — depends on Phase 1
9. WA (Phase 8) — depends on Phase 1
10. Offline sync (Phase 9) — depends on Phase 7

### Not in Scope (v2 Enhancements)

- Rekap preorder breakdown
- Delivery date calendar picker on public form
- Available delivery days configuration
- Preorder-specific AI insights
- WAPreviewSheet auto-selecting preorder template

---

*Generated: 2026-03-10*
