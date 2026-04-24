# Preorder Research: Public Order Form, Success Page & Live Page

## Full Customer Order Flow

### 1. Form Entry (`app/(public)/pesan/[slug]/PublicOrderForm.tsx`)
- Customer fills: name, phone, item selections (qty controls), optional notes, optional delivery date
- Customer info saved to localStorage for repeat orders
- Order data stored in sessionStorage before submission

### 2. Form Submission (`app/api/public/orders/route.ts`)
- Validates: name, phone format (10-15 digits, starts 0/62), at least 1 item OR notes
- Rate limiting: max 10 orders/hour per IP
- Honeypot field check
- Stock validation against product catalog
- Order created with status `"new"` OR `"menunggu"` (if quota exceeded)
- Increments `orders_used` and decrements product stock
- Customer auto-created via upsert

### 3. Success Page (`app/(public)/pesan/[slug]/sukses/page.tsx` + `SuccessActions.tsx`)
- Shows "Pesanan masuk!" header
- Displays order number (copyable)
- Order summary card (items, total, notes, delivery date)
- **QRIS card section** (only if `qrisUrl` exists AND NOT yet claimed)
- "Sudah Bayar" button → payment claim
- "Simpan Bukti Pesanan" (Canvas-generated PNG receipt)
- "Pesan Lagi" link

### 4. Live Order Page (`app/(public)/r/[id]/page.tsx`)
- Server-rendered with full order details
- Status badge + progress bar
- Delivery date display
- Payment status badges
- Items breakdown
- QRIS card + "Sudah Bayar" (if unpaid)
- "Hubungi Penjual" WA link
- "Pesan Lagi" button

## QRIS Display Logic

**Conditions for showing QRIS:**
- Success page: `{qrisUrl && !paidConfirmed && (...)}`
- Live page: `{showPayment && qrisUrl && !paidConfirmed && (...)}`
- Where `showPayment = !isPaid && status !== "done" && status !== "cancelled"`

**QRIS requires:**
- `qrisUrl` from seller profile (uploaded in `/pengaturan`)
- Order is unpaid (`paid_amount < total`)
- Hidden after "Sudah Bayar" claim

## Delivery Date Implementation

- **Form:** Optional date picker (type="date"), min = today
- **Submission:** Passed as `deliveryDate` string in request body
- **Storage:** `orders.delivery_date` (timestamptz)
- **Display:** Success page summary, live page with icon, receipt image, WA messages via `deliveryLine()` helper

## Payment Claim Flow

1. Customer clicks "Sudah Bayar" → `POST /api/public/orders/[id]/claim-payment`
2. Sets `payment_claimed_at` to current timestamp
3. UI shows: "Menunggu konfirmasi penjual"
4. Seller sees "Sudah Bayar?" badge on dashboard order card

## Success Page Structure (SuccessActions.tsx)

Sections in order:
1. Order number with copy button
2. Order summary card (items, notes, delivery date)
3. **QRIS payment card** (if `qrisUrl && !paidConfirmed`)
4. Confirmation state (if `paidConfirmed`) — checkmark + "Menunggu konfirmasi penjual"
5. No-QRIS WA fallback (if `!qrisUrl && businessPhone`)
6. Secondary row: "Simpan Bukti" + "Pesan Lagi"

## Preorder Integration Points

1. **Hide QRIS:** Add `isPreorder` condition: `{qrisUrl && !paidConfirmed && !isPreorder && (...)}`
2. **Show preorder messaging:** Replace payment section with preorder-specific info
3. **Intercept at order creation:** `route.ts` line 101 — check delivery_date to determine preorder
4. **Modify success page:** `SuccessActions.tsx` lines 30-65 — preorder state handling
5. **Update live page:** `ReceiptActions.tsx` lines 20-95 — conditional QRIS
6. **DB:** Add `orders.is_preorder` boolean OR derive from delivery_date logic

## Key File Paths

| Purpose | File | Lines |
|---------|------|-------|
| Form UI | `app/(public)/pesan/[slug]/PublicOrderForm.tsx` | 22-554 |
| Form submission | `app/api/public/orders/route.ts` | 20-138 |
| Create order logic | `lib/services/public-order.service.ts` | 124-224 |
| Success page layout | `app/(public)/pesan/[slug]/sukses/page.tsx` | 10-50 |
| Success actions | `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx` | 30-462 |
| QRIS display (success) | `app/(public)/pesan/[slug]/sukses/SuccessActions.tsx` | 352-400 |
| QRIS display (live) | `app/(public)/r/[id]/ReceiptActions.tsx` | 52-95 |
| Live order page | `app/(public)/r/[id]/page.tsx` | 37-247 |
| Payment claim API | `app/api/public/orders/[id]/claim-payment/route.ts` | 7-70 |
| WA message builders | `lib/utils/wa-messages.ts` | 87-139 |
