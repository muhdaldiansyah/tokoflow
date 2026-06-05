# UX Best Practices: Order Confirmation & Payment Flow

> Research on mobile payment UX, trust signals, conversion optimization, and micro-interactions

---

## 1. Mobile-First Order Success Pages

### Essential Elements (Baymard Institute + ConvertCart)

Every order success page must include:

1. **Clear success confirmation** — green checkmark/banner with "Pesanan Berhasil"
2. **Order number** — prominent, copyable (not buried in muted text)
3. **Order summary** — items, quantities, prices, total (collapsible on mobile)
4. **Delivery/pickup date** — reduces anxiety
5. **Payment status** — paid/unpaid/pending
6. **Next steps** — "Pesanan akan diproses oleh penjual"
7. **Contact/support link** — 91% of disappointed customers leave without feedback
8. **Edit/cancel option** — within a time window

### Platform Patterns

**Tokopedia/Shopee:**
- Step-based checkout with progress indicators
- Countdown for payment completion
- Direct links to order tracking

**GoFood/GrabFood:**
- No separate "success page" — flows directly into live tracking
- Real-time progress bar
- Reduced opacity for unavailable items

**Shopify POS:**
- Three stages: Cart summary → Receipt → Thank you
- Each customizable with branding

### Key Mobile Rules
- Touch targets: min 44x44px (h-11 in Tailwind)
- 1-second delay = ~7% conversion drop
- 53% abandon if page takes >3 seconds
- Mobile wallets: 54% of global online transactions

---

## 2. QRIS Payment UX Patterns

### Timer/Countdown
- Show visible countdown next to QR code
- When <2 min remaining: change timer color to red/warning
- When expired: show "Refresh QR" button (don't auto-refresh)
- Midtrans GoPay/QRIS: 15 min default. ShopeePay: 5 min

### Auto-Detect Payment
- Poll status endpoint every 3-5 seconds OR use WebSocket/SSE
- Show subtle "Menunggu pembayaran..." with pulsing animation
- Auto-transition to success screen on webhook confirmation

### "Sudah Bayar" Button Patterns
- **Static QRIS (no webhook):** Essential — trigger manual verification or "Menunggu konfirmasi penjual" state
- **Dynamic QRIS (webhook):** Fallback — "Belum terdeteksi? Hubungi penjual"
- After tap: show "Menunggu konfirmasi penjual" + seller WA contact as escape hatch

### Progressive Disclosure
1. Order summary with total amount
2. QRIS image + clear instructions
3. Countdown timer + waiting state
4. Auto-transition to success OR manual confirmation

### QRIS Tap (2025)
- BI launched QRIS Tap (NFC) in March 2025
- Touch-and-go without scanning — emerging pattern

---

## 3. WhatsApp-Integrated Commerce UX

### Order Confirmation Messages
- 98% open rate for WhatsApp messages
- Template structure:
  - Customer name + order number
  - Item summary (name, qty, price)
  - Total + payment method
  - Delivery date/time
  - Next steps
  - Support contact
  - Branding footer
- Include buttons: "Lacak Pesanan," "Hubungi Kami," "Pesan Lagi"

### Reducing Web→WhatsApp Friction
- **Pre-filled messages:** `wa.me/{number}?text={encoded}` with order details
- **Single tap:** No intermediate screens
- **Context preservation:** Message should contain enough info (order number, items, total) — seller shouldn't need follow-up questions
- **No login required:** Guest checkout is critical — 63% abandon if forced to create account

### WhatsApp Flows (Meta, 2025)
- Interactive in-chat forms for appointments, orders, checkout
- **158% higher conversion** than web forms
- 80%+ completion rates
- Future capability to watch

---

## 4. Trust Signals on Payment Pages

### Security Badges
- Trust badges increase conversion by **12.6%** average; premium seals up to **48%**
- Multiple trust signals = **32% conversion increase** average
- **Limit to 3 badges per section** — more = diminishing returns
- Place **next to payment forms**, not in footer
- Must be responsive on mobile

### Store/Seller Trust Indicators
- Verified seller badge (profile photo, business name)
- Order count social proof: "500+ pesanan diproses"
- Address + phone + business hours
- **19% abandon** because they don't trust site with payment info (Baymard)

### Order Summary Clarity
- Itemized breakdown: name, qty, unit price
- Subtotal, discounts, delivery fee, **bold total**
- For UMKM: keep simple — no hidden fees

### Guarantee Messaging
- "Hubungi penjual jika ada masalah" with direct WA link
- WhatsApp contact itself is a trust signal — customers can reach seller directly

---

## 5. Post-Purchase Experience

### Order Tracking
- Visual **progress bar** (Baru → Diproses → Dikirim → Selesai)
- Tracking pages viewed **4.6 times per order** — prime branding real estate
- For UMKM: simple status page + WhatsApp notifications

### Status Update Notifications
- WhatsApp ideal channel (98% open vs 20% email)
- Key updates: confirmed, payment received, preparing, shipped/ready, complete
- Each includes order number + link to details

### Re-Order Flow
- "Pesan Lagi" button on success page and order history
- Pre-fill cart with previous items for one-tap re-ordering
- High-value for food/catering (weekly repeat orders)

---

## 6. Conversion Optimization

### Reducing Drop-Off
- Average cart abandonment: **70.19%**
- Fixing solvable UX issues: **+35% conversion lift**
- One-page checkout: **+37% conversion** (BigCommerce)
- Max **3-4 steps** with progress indicators
- **63% abandon** without guest checkout

### Payment Method Presentation
- Most popular method first (QRIS in Indonesia)
- Recognizable payment logos (GoPay, OVO, DANA, ShopeePay)
- In-page form (no redirects) reduces friction
- For single payment method (QRIS): present clearly without choice paralysis

### Guest Checkout
- Make most prominent option — 62% of sites fail to do this
- Only ask essentials: name, phone, items, delivery date

---

## 7. Micro-Interactions & Animations

### Success Animations
- Checkmark animation (Stripe pattern) — reinforces trust
- Confetti: use selectively (first order or large orders)
- Lottie animations: [check mark](https://lottiefiles.com/782-check-mark-success), [confetti](https://lottiefiles.com/59945-success-confetti)
- "Dynamic rewards should grow more complex as achievements get bigger"

### Loading States
- **Skeleton screens** perceived as faster than spinners (NN/g)
- 2-10 seconds: skeleton or looped indicator
- >10 seconds: progress indicator
- 3-step visual: "Mengirim pesanan" → "Memproses..." → "Selesai!"

### Haptic Feedback
- Payment success: 50-80ms vibration
- Strategic haptics: **+27% form completion**, **+18% time on page**
- CatatOrder already implements: `hapticSuccess(50ms)`, `hapticAction(80ms)`, `hapticDestructive(double-pulse)` ✓
- Less is more — save for important moments

---

## Key Takeaways for CatatOrder

1. **Show order summary on success page** — items, total, delivery date. Currently missing entirely
2. **Make order number prominent + copyable** — currently 12px at 60% opacity
3. **Add "Sudah Bayar" button** → "Menunggu konfirmasi penjual" state with seller WA as escape hatch
4. **Progressive disclosure** — summary → QRIS → waiting → success
5. **Persist customer info** — localStorage by slug for repeat orders
6. **Success animation** — Lottie checkmark on order submission
7. **Trust signals** — seller photo, order count, guarantee messaging
8. **Remove/improve auto-open WA** — currently disruptive (navigates away in 2s)

---

## Sources
- [Order Confirmation: 25 Best Practices — ConvertCart](https://www.convertcart.com/blog/order-confirmation-page)
- [Baymard: Order Confirmation Page](https://baymard.com/blog/order-confirmation-page)
- [Baymard: Mobile Receipt Examples](https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/receipt)
- [Shopee vs Tokopedia UX — Medium](https://medium.com/design-bootcamp/shopee-vs-tokopedia-ux-lessons)
- [GoFood Ordering UX — Medium](https://dndesign.medium.com/improving-gofoods-ordering-experience)
- [Trust Badges & Conversions — Emplicit](https://emplicit.co/how-to-use-trust-badges-for-higher-conversions/)
- [Ecommerce Trust Signals — BigCommerce](https://www.bigcommerce.com/blog/ecommerce-trust-signals/)
- [Checkout Optimization 2025 — Financial IT](https://financialit.net/blog/checkoutoptimisation-paymentexperience/)
- [Skeleton Screens — NN/g](https://www.nngroup.com/articles/skeleton-screens/)
- [Haptics in Mobile UX — Saropa](https://saropa-contacts.medium.com/2025-guide-to-haptics)
- [WhatsApp Order Confirmation — Wati](https://www.wati.io/en/blog/order-confirmation/)
- [WhatsApp Flows Guide — Sanoflow](https://sanoflow.io/en/collection/whatsapp-business-api/whatsapp-flows-complete-guide/)
- [Post-Purchase UX — Baymard](https://baymard.com/blog/post-checkout-ux-best-practices)
- [Order Tracking Design — Wonderment](https://www.wonderment.com/blog/design-best-practices-for-ecommerce-order-tracking-pages)
