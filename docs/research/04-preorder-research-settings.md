# Preorder Research: Settings Page Analysis

## Current Settings Page Structure

**File:** `app/(dashboard)/pengaturan/page.tsx` (680 lines)

### Four Main Sections:

1. **TOKO KAMU (Store Profile Section)** — Lines 372-503
   - Profile preview card with logo, business name, contact
   - Edit button links to `/profil/edit`
   - **Link Pesanan (Order Link)** subsection:
     - Toggle switch for `order_form_enabled` (lines 411-421)
     - Slug input with save validation (lines 424-449)
     - Copy link, Share via WA, and Preview buttons (lines 451-479)
     - Incomplete setup checklist (lines 482-494)

2. **KUOTA PESANAN (Order Quota)** — Lines 505-639
   - Displays remaining orders (free/pack/unlimited)
   - Progress bar for free tier
   - Nudge messages at usage thresholds (soft/medium/urgent)
   - Buy pack and unlimited buttons (Midtrans QRIS)

3. **AKUN (Account)** — Lines 641-677
   - Change password button
   - Logout form
   - Admin panel link (if role=admin)

4. **WhatsApp Settings** — Separate page at `/pengaturan/whatsapp/page.tsx`

## Current Profile Fields Relevant to Order Config

**File:** `features/receipts/types/receipt.types.ts` (lines 31-61)

- `order_form_enabled?: boolean` — Toggle for public order form
- `slug?: string` — Public order link slug
- `qris_url?: string` — QRIS image for payment
- `orders_used`, `order_credits`, `unlimited_until` — Quota fields
- `business_name`, `business_address`, `business_phone`, `logo_url` — Store info

**No existing delivery-related toggles or preorder fields in profile.**

## Profile Edit Page

**File:** `app/(dashboard)/profil/edit/page.tsx` (400 lines)

Currently edits: Full name, business name, address, phone, logo upload/delete, QRIS upload/delete.
**No order configuration toggles** on profile edit page.

## Existing Toggle Pattern

Settings page toggle pattern at line 176-187: `handleToggleOrderForm()` — toggles `order_form_enabled` via profile service update.

## Current Order Delivery Date Handling

- Orders table has `delivery_date` field
- Public order form accepts optional delivery date
- Live order page (`/r/[id]`) displays delivery date
- Dashboard OrderCard does NOT prominently show delivery date

## Where Preorder Toggle Fits

**Best Location: Link Pesanan section** (after "Preview" button, ~line 479)
- New "Pengaturan Pesanan" subsection
- Toggle: "Aktifkan Preorder"
- Helper text about future delivery dates
- Optional: minimum lead time selector

**Alternative:** Profile edit page alongside QRIS settings.

## Plans Config

**File:** `config/plans.ts` — Only order quota pricing. Based on CatatOrder philosophy ("Semua fitur gratis tanpa batas"), preorder would likely be free for all tiers.
