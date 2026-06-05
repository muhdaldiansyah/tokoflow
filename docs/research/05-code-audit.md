# Code Audit: Public Order & Success Page

> Bugs, UX pain points, and quick wins in the current implementation

---

## P0 — Critical Bugs

### 1. Stock never decremented for public orders
**File:** `lib/services/public-order.service.ts` (lines 147-163)

`decrementStock()` requires `supabase.auth.getUser()` (authenticated context). Public orders use service role client. No stock decrement call exists in `createPublicOrder` or the API route. A product with `stock: 5` can receive 50+ orders through the public form — all showing "Sisa 5."

### 2. No server-side stock validation
**File:** `app/api/public/orders/route.ts` (lines 73-77)

`sanitizedItems` processing doesn't check stock at all. If two customers simultaneously see "Sisa 1" and both order, both succeed. No server-side guard.

### 3. `customer_id` not linked to created order
**File:** `lib/services/public-order.service.ts` (lines 147-163)

Order insert has no `customer_id` field. Customer upsert happens after (lines 174-188), but order is never updated with the resulting customer ID. Public orders are orphaned from customer records.

---

## P1 — Major UX Issues

### 4. No order summary on success page
**File:** `app/(public)/pesan/[slug]/sukses/page.tsx`

Success page shows only: checkmark, "Pesanan masuk!", business name, order number (tiny text). Zero recap — no items, no total, no customer name. Customer can't verify what they ordered without opening WhatsApp.

### 5. Auto-open WhatsApp is disruptive
**File:** `SuccessActions.tsx` (lines 44-65)

Auto-opens WA after 2 seconds. On mobile, navigates user away before reading confirmation. If user returns, `autoOpened = true` — no visual feedback about what happened. Race condition between two useEffects (lines 33-41 and 44-65) — timer may fire with `orderDetails` still null.

### 6. sessionStorage is fragile
**File:** `SuccessActions.tsx` (lines 33-40)

If user opens success URL in new tab, incognito, or sessionStorage unavailable — all item details are lost. Fallback WA message is bare "saya baru saja pesan (WO-...)" with no items or total.

### 7. No phone validation
**File:** `PublicOrderForm.tsx` (lines 96-104)

Validates phone is not empty, but no format check. Customer can enter "abc" or "123." No minimum length, no digit-only enforcement. `type="tel"` helps on mobile but doesn't prevent invalid input.

---

## P2 — UX Improvements

### 8. Name/phone fields before catalog = drop-off
**File:** `PublicOrderForm.tsx` (lines 308-335)

Customers forced to provide personal info before browsing the menu. Best practice: show catalog first, collect info at checkout.

### 9. No cart review before submission
**File:** `PublicOrderForm.tsx` (lines 436-466)

Sticky bar shows only item count + total. Can't review individual items/quantities/prices. No expandable cart or review step.

### 10. No repeat customer info persistence
Returning customers re-enter name and phone every time. No localStorage persistence keyed by slug.

### 11. Order number barely visible
**File:** `sukses/page.tsx` (lines 32-35)

Order number: `text-xs text-muted-foreground/60` — 12px at 60% opacity. Customer's only proof of order is the least visible element.

### 12. Two WA buttons create confusion
**File:** `SuccessActions.tsx`

When QRIS present: "Konfirmasi Pembayaran via WA" (green, inside QRIS card) AND "Hubungi Penjual via WA" (outlined, outside). Subtle difference — one sends QRIS confirmation, other sends general order message. Easy to tap wrong one.

### 13. "Menunggu" status invisible to customer
**File:** `lib/services/public-order.service.ts` (line 145)

Over-quota orders get `status: "menunggu"` but success page says "Pesanan masuk!" identically. Customer has no idea their order is in limbo.

---

## P2 — Accessibility

### 14. No `aria-label` on +/- buttons
**File:** `PublicOrderForm.tsx` (lines 226-241)

Screen readers announce these as unlabeled buttons. Need `aria-label="Kurangi jumlah {item.name}"`.

### 15. QRIS image has generic alt text
**File:** `SuccessActions.tsx` (line 137)

`alt="QRIS"` — should be "QRIS pembayaran {businessName}."

### 16. Error messages not announced
**File:** `PublicOrderForm.tsx` (line 416)

No `role="alert"` or `aria-live="polite"`. Screen readers won't announce validation errors.

### 17. `animate-pulse` on "Membuka WhatsApp..."
**File:** `SuccessActions.tsx` (line 173)

Should respect `prefers-reduced-motion`.

---

## P3 — Technical Debt

### 18. Rate limiter ineffective on serverless
**File:** `app/api/public/orders/route.ts` (lines 6-18)

In-memory `Map` resets on every cold start. Near-zero protection in Vercel serverless.

### 19. No CSRF protection on public order API
Only honeypot field (catches basic bots). No CSRF token, no origin check, no Turnstile/reCAPTCHA.

### 20. `planExpired` fetched but never used
**File:** `lib/services/public-order.service.ts` (lines 44-46)

Computed but never checked anywhere.

### 21. `getPublicBusinessInfo` called twice
**File:** `sukses/page.tsx` (line 14)

Redundant DB query — same data already partially available from URL params.

### 22. No duplicate order prevention
No protection against double-submission. `isSubmitting` is a client-side guard dependent on React state timing.

---

## P3 — Missing Features

### 23. No delivery date/time field
`orders` table has `delivery_date` but public form omits it. Customers write in notes — unstructured, easy to miss.

### 24. No delivery address field
For delivery businesses (catering, food delivery) — must use notes field.

### 25. No order tracking after submission
Customer has no way to check status. Receipt page `/r/[id]` exists but:
- Doesn't show current status
- No link from success page UI (only in WA message text)

### 26. No confirmation notification to customer
System relies on customer manually sending WA to seller. If they skip WA, no confirmation in their possession.

### 27. Receipt page has no link back to store
`/r/[id]` shows order but no "Pesan lagi" or link to `/{slug}`.

---

## Quick Wins (High Impact, Low Effort)

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| 1 | Show order summary on success page (from sessionStorage) | Low | ⭐⭐⭐ |
| 2 | Make order number prominent + copy button | Low | ⭐⭐⭐ |
| 3 | Persist customer name/phone in localStorage by slug | Low | ⭐⭐⭐ |
| 4 | Add phone number format validation (10+ digits, starts 0/62/+62) | Low | ⭐⭐ |
| 5 | Move name/phone below catalog | Low | ⭐⭐ |
| 6 | Add `role="alert"` to error messages | Low | ⭐ |
| 7 | Add "Lihat Struk" link on success page (receipt URL exists) | Low | ⭐⭐ |
| 8 | Remove/improve auto-open WA (make opt-in or add countdown + cancel) | Medium | ⭐⭐⭐ |
| 9 | Add server-side stock validation in API route | Medium | ⭐⭐⭐ |
| 10 | Decrement stock on public order creation (use service role) | Medium | ⭐⭐⭐ |
| 11 | Link `customer_id` to order after upsert | Medium | ⭐⭐ |
| 12 | Add delivery date picker to public form | Medium | ⭐⭐ |

---

## Priority Matrix

```
                    HIGH IMPACT
                        │
   Fix stock bugs ──────┤────── Show order summary
   (P0 bugs)            │       (P1 UX)
                        │
   Stock validation ────┤────── Persist customer info
                        │       (localStorage)
LOW ────────────────────┼──────────────────── HIGH
EFFORT                  │                    EFFORT
                        │
   aria-labels ─────────┤────── Delivery date picker
   (a11y)               │
                        │
   role="alert" ────────┤────── Cart review step
                        │
                    LOW IMPACT
```
