# Plan: Product Page → Marketplace Standard

> Transform CatatOrder's product page from a simple price list into a marketplace-standard catalog
> Date: 2026-03-09

---

## Context

CatatOrder's current product model has **4 fields**: `name`, `price`, `image_url`, `sort_order`. This is a basic price list — not a catalog customers can confidently browse and order from.

Benchmark against GoFood, GrabFood, Tokopedia, Shopee, WhatsApp Catalog, Square, Ecwid, and GloriaFood shows CatatOrder has **2 of 12 standard fields**. Even WhatsApp's native catalog (the simplest reference) has 6.

**20 files** across the codebase reference products. Any schema change ripples through 7 integration points: dashboard product list, public order form, order form chips, autocomplete, AI parsing (voice/paste/image), WA bot, and settings checklist.

---

## New Fields

| Field | Type | Default | Required | Purpose |
|-------|------|---------|----------|---------|
| `description` | TEXT | null | No | What's included — "Nasi + ayam geprek + lalapan" |
| `category` | TEXT | null | No | Group products — "Nasi Box", "Snack", "Minuman" |
| `is_available` | BOOLEAN | true | Yes | Toggle habis/tersedia without deleting |
| `stock` | INTEGER | null | No | null=unlimited (made-to-order), number=tracked with auto-decrement |
| `unit` | TEXT | null | No | "porsi", "box", "pcs", "loyang", "kg", etc. |
| `min_order_qty` | INTEGER | 1 | Yes | Minimum quantity on public order form |

All fields are optional or have safe defaults — zero impact on existing products.

---

## Phase 1: Data Foundation + Dashboard UI

### 1.1 Database Migration

**File**: `supabase/migrations/030_product_catalog_fields.sql`

```sql
-- Add catalog fields to products
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN category TEXT;
ALTER TABLE products ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN stock INTEGER;
ALTER TABLE products ADD COLUMN unit TEXT;
ALTER TABLE products ADD COLUMN min_order_qty INTEGER NOT NULL DEFAULT 1;

-- Index for category grouping queries
CREATE INDEX idx_products_category ON products(user_id, category);
```

### 1.2 Update Types

**File**: `features/products/types/product.types.ts`

Add to `Product` interface:
- `description?: string | null`
- `category?: string | null`
- `is_available: boolean`
- `stock?: number | null`
- `unit?: string | null`
- `min_order_qty: number`

Add to `CreateProductInput`:
- `description?`, `category?`, `unit?`, `stock?`, `min_order_qty?`

Add to `UpdateProductInput`:
- Same optional fields + `is_available`

### 1.3 Update Product Service

**File**: `features/products/services/product.service.ts`

- `getProducts()` — already returns `*`, no query change needed
- `createProduct()` — accept new fields in insert
- `updateProduct()` — accept new fields in update
- Add `getCategories()` — get distinct categories for auto-suggest:
  ```sql
  SELECT DISTINCT category FROM products
  WHERE user_id = ? AND category IS NOT NULL
  ORDER BY category
  ```
- Add `toggleAvailability(id, is_available)` — quick toggle
- Add `decrementStock(productId, qty)` — for stock auto-decrement on order:
  ```sql
  UPDATE products SET stock = stock - qty
  WHERE id = ? AND user_id = ? AND stock IS NOT NULL AND stock >= qty
  -- Then check if stock hit 0, auto-set is_available = false
  ```

### 1.4 Redesign ProductList Component

**File**: `features/products/components/ProductList.tsx`

Current: flat list, 32px thumbnails, inline edit, exposed edit/delete icons, "Kembali" button.

Changes:

**Header:**
- Remove "Kembali" button (Produk is a main nav page)
- Keep product count badge + "+ Tambah Produk" button

**Product rows — grouped by category:**
```
── Nasi Box ──────────────────────────────────
┌──────┐  Nasi Box Ayam Geprek             ⋮
│ 📷   │  Nasi + ayam geprek + lalapan
│80×80 │  Rp25.000 / porsi · Sisa 5
└──────┘  ● Tersedia       Min. 1

── Tanpa Kategori ────────────────────────────
┌──────┐  Kue Biasa                        ⋮
│ 📷   │  Kue rumahan tanpa topping
│80×80 │  Rp10.000 / pcs
└──────┘  ● Tersedia
```

Specific UI changes:
- **Image thumbnail**: 32px → 80px (w-20 h-20 rounded-xl)
- **Description**: show below product name as `text-xs text-muted-foreground` (truncate 1 line)
- **Price + unit**: "Rp25.000 / porsi" on same line
- **Stock display**: "Sisa 5" or "Stok: —" (unlimited) next to price, separated by `·`
- **Availability badge**: green dot "Tersedia" / gray dot "Habis" — tappable to toggle
- **Min order**: show "Min. 5" if min_order_qty > 1
- **Category headers**: `text-xs font-bold text-foreground/80 uppercase tracking-wider` section dividers. Products without category go under "Lainnya"
- **Overflow menu (⋮)**: replace exposed pencil/trash icons. Menu items: Edit, Duplikat (future), Hapus. Use h-11 w-11 touch target
- **Touch targets**: all interactive elements min h-11 (44px)

**Add/Edit form:**
- Change from inline row to bottom-sheet modal (consistent with rest of app)
- Fields: Name (required), Price (required), Description (optional), Category (auto-suggest dropdown), Unit (preset dropdown), Stock (optional number input), Min Order Qty (number, default 1)
- Category auto-suggest: show existing categories as chips/dropdown, or type new

**Empty state:**
- Keep current empty state but update text: "Tambah produk supaya muncul di link toko kamu"

### 1.5 Unit Presets

**File**: `config/products.ts` (new)

```typescript
export const UNIT_OPTIONS = [
  { value: "porsi", label: "Porsi" },
  { value: "box", label: "Box" },
  { value: "pcs", label: "Pcs" },
  { value: "loyang", label: "Loyang" },
  { value: "kg", label: "Kg" },
  { value: "pack", label: "Pack" },
  { value: "botol", label: "Botol" },
  { value: "gelas", label: "Gelas" },
] as const;
```

---

## Phase 2: Public Order Form + Stock Integration

### 2.1 Update Public Order Service

**File**: `lib/services/public-order.service.ts`

- `getPublicBusinessInfo()`:
  - Return new fields: `description`, `category`, `is_available`, `stock`, `unit`, `min_order_qty`
  - Filter `is_available = true` (don't show unavailable products to customers)
  - **Remove 8-item cap** — return all available products, grouped
  - Order by: `category ASC NULLS LAST, sort_order ASC`

- Update `PublicBusinessInfo.frequentItems` type:
  ```typescript
  frequentItems: {
    name: string;
    price: number;
    image_url?: string | null;
    description?: string | null;
    category?: string | null;
    stock?: number | null;
    unit?: string | null;
    min_order_qty: number;
  }[]
  ```

### 2.2 Redesign Public Order Form

**File**: `app/(public)/pesan/[slug]/PublicOrderForm.tsx`

Current: flat 2-column grid of up to 8 product cards.

Changes:

**Grouped by category:**
```
── Nasi Box ──────────────────
┌─────────┐  ┌─────────┐
│  📷     │  │  📷     │
│ Ayam    │  │ Ikan    │
│ Geprek  │  │ Bakar   │
│ Rp25K   │  │ Rp28K   │
│ /porsi  │  │ /porsi  │
│  [+]    │  │  [+]    │
└─────────┘  └─────────┘

── Snack ─────────────────────
┌─────────┐  ┌─────────┐
│  📷     │  │ 📷      │
│ Risol   │  │ Lemper  │
│ Rp4K    │  │ Rp3K    │
│ /pcs    │  │ /pcs    │
│ Sisa 12 │  │ Habis   │  ← grayed out
│  [+]    │  │         │
└─────────┘  └─────────┘
```

Specific changes:
- **Category section headers**: same style as dashboard — `text-xs font-bold uppercase tracking-wider`
- **Products without category**: show without section header (or "Menu" header if mixed with categorized)
- **No 8-item cap**: show all available products
- **Description**: show on card below product name (1-2 lines, `text-[11px] text-muted-foreground`)
- **Unit**: show after price — "Rp25.000 / porsi"
- **Stock**: show "Sisa 12" on card if stock is tracked and low (< 20). Hide if unlimited
- **Unavailable products**: do NOT show (filtered server-side by `is_available = true`)
- **Min order qty**: when customer taps product, start qty at `min_order_qty` instead of 1. Show "Min. 5" label below +/- buttons if > 1
- **Stock enforcement**: +/- buttons max out at remaining `stock`. Show "Maks. 5" if limited
- **Sticky cart bar**: update to show unit — "3 item · Rp75.000"

### 2.3 Stock Auto-Decrement on Order Creation

Three order creation paths must decrement stock:

**A. Public order form** (`app/api/public/orders/route.ts`):
- After successful order creation, for each item:
  - Find matching product by name
  - Call `decrementStock(productId, qty)`
  - If stock hits 0, auto-set `is_available = false`

**B. Manual order** (`features/orders/services/order.service.ts` → `createOrder()`):
- Same logic after order save

**C. WA bot** (`lib/wa-bot/order-creator.ts`):
- Same logic after order creation

**Stock restoration on cancel:**
- When order status changes to `cancelled`, restore stock:
  - Find matching products by item names
  - Increment stock back
  - Re-enable `is_available` if stock > 0

---

## Phase 3: Order Form + Autocomplete + AI

### 3.1 Update Order Form Quick-Pick Chips

**File**: `features/orders/services/order.service.ts`

- `getFrequentItems()`:
  - Filter `is_available = true`
  - Return `unit` field
  - Remove 8-item hardcap (or increase to 12)

- `getItemSuggestions()`:
  - Include `description` and `unit` in cached item data
  - Filter unavailable products from suggestions
  - Show unit in suggestion display

**File**: `features/orders/components/OrderForm.tsx`

- Quick-pick chips: show unit after price — "Nasi Box Ayam · Rp25K/porsi"
- Autocomplete dropdown: show description as secondary line
- Decrement stock after manual order save

### 3.2 Update AI Parsing Sheets

**Files**: `VoiceOrderSheet.tsx`, `PasteOrderSheet.tsx`, `ImageOrderSheet.tsx`

- Pass `description` field to AI context for better item matching
- Product reference becomes: `{ name, price, description }` instead of `{ name, price }`
- This helps AI distinguish "Nasi Box Ayam" from "Nasi Box Ikan" when customer says vague terms

### 3.3 Update WA Bot

**File**: `lib/wa-bot/session.ts`

- Include `description` in product list sent to AI for parsing
- Include `is_available` — if customer tries to order unavailable product, bot can respond: "Maaf, [product] sedang habis"

### 3.4 Update Receipt Item Input

**File**: `features/receipts/components/ItemInput.tsx`

- Show unit in autocomplete suggestions
- Filter unavailable products

### 3.5 Update Settings Checklist

**File**: `app/(dashboard)/pengaturan/page.tsx`

- Update product setup checklist to show:
  - "X produk" (existing)
  - "X dengan foto" (existing)
  - "X dengan kategori" (new — encourage categorization)

### 3.6 Drag-to-Reorder

**File**: `features/products/components/ProductList.tsx`

- Add drag handle icon (⠿ / GripVertical from lucide) on left side of each product row
- Use a lightweight DnD solution (e.g., `@dnd-kit/core` or native HTML drag)
- Reorder within same category
- On drop: batch-update `sort_order` for affected products
- Mobile: long-press to initiate drag (consistent with guide documentation)

---

## Phase 4: Future (Not in Scope Now)

These are documented for future reference but NOT implemented in this plan:

### 4.1 Variants / Modifiers
- Modifier groups: "Pilih Level Pedas" (wajib), "Tambahan" (opsional)
- Each modifier: name + price adjustment
- Requires new `product_modifiers` JSONB field or separate table
- Changes to: public order form, order items structure, WA bot, all AI parsing sheets

### 4.2 Discount Price
- `discount_price` field — show strikethrough original + discounted price
- "~~Rp30.000~~ Rp25.000 / porsi"

### 4.3 Product Search (Dashboard)
- Search bar on product list page
- Only needed when product count > 20

### 4.4 Bulk Actions
- Multi-select products → bulk delete, bulk category change, bulk toggle availability

### 4.5 Product Duplication
- "Duplikat" in overflow menu → create copy with "(Copy)" suffix

---

## Files Changed Summary

| Phase | File | Change Type | Effort |
|-------|------|-------------|--------|
| 1 | `supabase/migrations/030_product_catalog_fields.sql` | New | Low |
| 1 | `features/products/types/product.types.ts` | Edit | Low |
| 1 | `features/products/services/product.service.ts` | Edit | Medium |
| 1 | `features/products/components/ProductList.tsx` | Rewrite | **High** |
| 1 | `config/products.ts` | New | Low |
| 2 | `lib/services/public-order.service.ts` | Edit | Medium |
| 2 | `app/(public)/pesan/[slug]/PublicOrderForm.tsx` | Major edit | **High** |
| 2 | `app/(public)/pesan/[slug]/page.tsx` | Edit | Low |
| 2 | `app/api/public/orders/route.ts` | Edit | Medium |
| 2 | `features/orders/services/order.service.ts` | Edit | Medium |
| 2 | `lib/wa-bot/order-creator.ts` | Edit | Medium |
| 3 | `features/orders/components/OrderForm.tsx` | Edit | Medium |
| 3 | `features/orders/components/VoiceOrderSheet.tsx` | Edit | Low |
| 3 | `features/orders/components/PasteOrderSheet.tsx` | Edit | Low |
| 3 | `features/orders/components/ImageOrderSheet.tsx` | Edit | Low |
| 3 | `features/receipts/components/ItemInput.tsx` | Edit | Low |
| 3 | `lib/wa-bot/session.ts` | Edit | Low |
| 3 | `app/(dashboard)/pengaturan/page.tsx` | Edit | Low |

**Total: 18 files** (2 new, 16 edited)

---

## Migration Safety

- All new columns have defaults or are nullable — **zero breaking change**
- Existing products continue to work without any data backfill
- `is_available` defaults to `true` — all existing products stay visible
- `min_order_qty` defaults to `1` — existing behavior preserved
- `stock = null` means unlimited — existing make-to-order behavior preserved
- Public order form gracefully degrades: no category = no grouping, no description = no description shown

---

## Testing Checklist

### Phase 1
- [ ] Migration runs without error on existing data
- [ ] Existing products appear correctly (all new fields null/default)
- [ ] Can create product with all new fields
- [ ] Can edit all new fields inline
- [ ] Availability toggle works (tap to switch)
- [ ] Products grouped by category in dashboard
- [ ] Products without category shown under "Lainnya"
- [ ] Image upload still works at 80px size
- [ ] Delete confirmation modal still works
- [ ] Overflow menu (⋮) opens with Edit/Hapus options

### Phase 2
- [ ] Public form shows only `is_available = true` products
- [ ] Public form groups products by category
- [ ] Public form shows description on cards
- [ ] Public form shows unit after price
- [ ] Public form shows "Sisa X" for stocked products
- [ ] Public form starts qty at min_order_qty
- [ ] Public form caps qty at remaining stock
- [ ] Stock decrements after public order submission
- [ ] Stock decrements after manual order creation
- [ ] Stock decrements after WA bot order creation
- [ ] Auto-habis when stock hits 0
- [ ] Stock restores on order cancellation
- [ ] All available products shown (no 8-item cap)

### Phase 3
- [ ] Quick-pick chips show unit
- [ ] Autocomplete shows description
- [ ] Unavailable products filtered from suggestions
- [ ] AI parsing uses description for better matching
- [ ] WA bot rejects unavailable products gracefully
- [ ] Settings checklist shows category count
- [ ] Drag-to-reorder works within categories

---

*Plan created: 2026-03-09*
