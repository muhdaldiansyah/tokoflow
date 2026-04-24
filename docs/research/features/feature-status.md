# Feature Status — Detailed Breakdown

> Per-feature analysis: what the research proposes, what CatatOrder already has, gaps, and effort estimates.

---

## Feature #1: AI Chat → Tabel Order (Text Extraction)

**Research Score:** 9.5/10 — MVP Critical
**Status:** ✅ Done

### What the research proposes
- Paste messy WA chat → AI extracts structured order table
- GPT-4o mini for extraction (~Rp 2-8 per order)
- Sub-2 second response, editable output
- "Wow moment" — the core differentiator

### What CatatOrder has

| Component | File | Purpose |
|-----------|------|---------|
| PasteOrderSheet | `features/orders/components/PasteOrderSheet.tsx` | Bottom-sheet UI, 2-phase flow |
| Regex parser | `lib/voice/parse-transcript.ts` | Instant preview — handles Indonesian number words, units, delimiters |
| Gemini API | `app/api/voice/parse/route.ts` | Background AI refinement via OpenRouter → Gemini 3 Flash |

**How it works:**
1. Operator pastes WA text into textarea
2. Phase 1: Instant regex preview via `parseTranscriptToItems()` — shows detected items immediately
3. Phase 2: On "Proses", regex results display as editable cards. Gemini 3 Flash runs in background ("Menyempurnakan dengan AI..."). If AI returns better results, they replace regex results. If AI fails, regex results kept silently.
4. Items with price=0 highlighted red — operator fills manually
5. Product catalog passed to both parser and AI for price matching

### Gaps
- ~~**No paste analytics event**~~ → ✅ `paste_order_parsed` event added
- ~~**No public order analytics**~~ → ✅ `public_order_received` server-side event added (`app/api/public/orders/route.ts`)
- **No text price extraction** — "nasi goreng 25rb" won't extract 25K from text; relies on product catalog
- **Multi-speaker format** — raw WA chat with timestamps/sender names only parsed by Gemini, not regex fallback
- **No item count cap** — pasting very long chats could produce many items

### Effort to close remaining gaps
- Text price extraction in regex: **2-3 hours**
- Other gaps: low priority, edge cases

---

## Feature #2: Invoice Generation (Image Format)

**Research Score:** 9.0/10 — MVP Critical
**Status:** ✅ Done

### What the research proposes
- **Image-format** invoice shareable via WA (displays inline, no download)
- Template with seller logo/brand colors
- Auto-populated from AI extraction — zero additional input
- Viral branding on every invoice shared
- Server-side: Puppeteer or Sharp for HTML-to-image

### What CatatOrder has

| Component | File | Purpose |
|-----------|------|---------|
| Receipt form | `features/receipts/components/ReceiptForm.tsx` | Create receipt with items, customer, payment status |
| Receipt preview | `features/receipts/components/ReceiptPreview.tsx` | Thermal-receipt style in-browser preview |
| Receipt service | `features/receipts/services/receipt.service.ts` | CRUD + WA share as text message |
| Order receipt page | `features/orders/components/OrderReceiptPage.tsx` | Order-based invoice with image share + PDF download |
| Receipt hooks | `features/receipts/hooks/useReceiptWorkflow.ts` | State management for save + WA share |
| Image capture utility | `lib/invoice/generate-image.ts` | `captureInvoiceImage()` via `html-to-image` (2x pixel ratio) |
| PDF generation | `lib/pdf/generate-receipt.ts` | `generateReceiptPDF()` via jsPDF |

**Current invoice system:**
- 300px thermal receipt card rendered in DOM (business header, items, totals, payment status, branding footer)
- **Image share via WA:** `html-to-image` captures receipt card as 2x PNG → `navigator.share({ files })` opens native share sheet on mobile (WA displays inline) → desktop fallback downloads PNG + opens `wa.me` deep link
- **Download Gambar:** Direct PNG download of receipt card
- **Download PDF:** jsPDF generation (secondary option)
- CatatOrder branding ("catatorder.id") on every shared image
- Analytics: `invoice_image_shared` event with `method` property (native_share / download_fallback)

### Remaining gaps (minor)
- **No logo rendering** — `logo_url` exists in `BusinessInfo` type but isn't rendered on receipt card
- **No brand colors/template** — one fixed thermal receipt style
- ~~**Receipt WA share bypasses WAPreviewSheet**~~ → ✅ Riwayat receipt re-send now routes through WAPreviewSheet
- ~~**No `receipt_shared` analytics**~~ → ✅ `receipt_shared` event added in riwayat page
- **Binary payment status on receipts** — paid/unpaid only (orders support partial payments)
- **Image invoice share still uses native share sheet** — different pattern from WAPreviewSheet (intentional: image needs `navigator.share({ files })`)

### Effort to close remaining gaps
- Logo rendering on receipt card: **1-2 hours**
- Brand color customization: **1-2 days** (needs UI for color picker + template variants)
- These are polish, not blockers — the viral loop (image in WA) is working

---

## Feature #3: Piutang Tracker + Auto-Reminder

**Research Score:** 9.0/10 — V2 Priority
**Status:** ✅ Done

### What the research proposes
- Auto-track receivables from invoice/order data
- WA Business API reminders at D+1, D+3, D+7 after due date
- No separate data entry needed
- Natural upsell for paid tier

### What CatatOrder has

| Component | File | Purpose |
|-----------|------|---------|
| Piutang tab | `features/customers/components/CustomerList.tsx` | Aggregated unpaid per customer |
| WA reminder button | Same file | Manual "Ingatkan via WA" via WAPreviewSheet |
| Reminders table | DB: `reminders` | `order_id`/`receipt_id`, `reminder_type`, `day_offset`, `scheduled_at`, `sent_at`, `status` |
| Piutang service | `features/orders/services/order.service.ts` | `getPiutangSummary()` aggregation |
| Reminder service | `features/orders/services/reminder.service.ts` | `scheduleOrderReminders()`, `cancelOrderReminders()`, `getPendingReminders()`, `markReminderSent()`, `cancelReminder()` |
| Pengingat page | `app/(dashboard)/pengingat/page.tsx` | Central reminder dashboard with grouped view + WA send |

**Current piutang + reminder system:**
- Piutang tab appears in CustomerList when total debt > 0
- Shows per-customer unpaid total (derived from `paid_amount < total` on orders)
- **Auto-scheduled reminders:** D+1, D+3, D+7 reminders auto-created when unpaid order is created (with customer phone). Pre-built reminder messages with escalating urgency. Duplicate prevention via day_offset check.
- **Auto-cancelled:** All pending reminders cancelled when order marked paid (via `recordPayment`, `updateOrder`, `bulkMarkPaid`, or `deleteOrder`)
- **Pengingat dashboard:** Central page in sidebar nav (Bell icon). Two sections: "Terlambat & Hari Ini" (red/amber accents) and "Mendatang". Each card shows order/receipt number, customer, outstanding amount, relative date. "Kirim WA" opens WAPreviewSheet with pre-built message → marks reminder as sent. Cancel with double-tap confirm.
- **Sending via wa.me deep link** (WAPreviewSheet). When WABA unblocks, swap to Cloud API templates with minimal changes.
- Analytics: `reminder_sent`, `reminder_cancelled` events
- DB migration: `021_order_reminders.sql` — extended `reminders` table with `order_id`, `reminder_type`, `day_offset`; RLS policies check ownership via either receipts or orders

### Remaining gaps (minor)
- **WA Cloud API blocked** — WABA restricted in Meta, pending Business Verification + Advanced Access. Currently uses wa.me deep link (manual send). When WABA unblocks, swap to Cloud API templates.
- **No due date on orders** — reminders scheduled relative to order creation date, not a due date

---

## Feature #4: QRIS / Payment Link in Invoice

**Research Score:** 8.0/10 — V2-V3
**Status:** ✅ Done (Static QRIS)

### What the research proposes
- Embed QRIS/payment link in customer-facing invoices
- Per-order payment collection
- Xendit or Midtrans integration
- V2-V3 timing due to regulatory/technical complexity

### What CatatOrder has

| Component | File | Purpose |
|-----------|------|---------|
| Payment service | `features/billing/services/payment-service.ts` | Creates Midtrans Snap transactions (SaaS billing) |
| Midtrans client | `lib/midtrans/client.ts` | Snap client initialization |
| Webhook | `app/api/billing/webhook/` | SHA-512 signature verification |
| Payment pages | `app/(dashboard)/pembayaran/` | Success/pending/failed UI |
| QRIS upload | `app/(dashboard)/profil/edit/page.tsx` | Upload personal QRIS image from bank/e-wallet |
| QRIS on invoice | `features/orders/components/OrderReceiptPage.tsx` | Shows QRIS on receipt when order not fully paid |
| QRIS on public success | `app/(public)/pesan/[slug]/sukses/page.tsx` | Shows QRIS after customer submits order via link |
| QRIS storage | `supabase/migrations/022_add_qris_url.sql` | `profiles.qris_url` column + `qris-codes` bucket |
| Public business info | `lib/services/public-order.service.ts` | Includes `qrisUrl` in public-facing data |

**Current payment system:**
- **SaaS billing:** Midtrans Snap — VA (Rp4K fee), GoPay (2%), QRIS (0.7%) for CatatOrder subscription
- **Static QRIS for customer payments:** Operator uploads their existing personal QRIS (from BCA, BRI, GoPay, etc.) in Profil > Edit. QRIS image displayed on:
  - Invoice receipt (only when order is NOT fully paid) — captured by `html-to-image`, so every shared receipt PNG includes QRIS
  - Public order success page (after customer submits via `/[slug]`)
- Payment confirmation remains manual (operator marks paid in app)

### Remaining gaps
- **No per-order dynamic QRIS** — static image (same QRIS for all orders), no amount pre-filled
- **No auto-payment reconciliation** — operator manually marks orders as paid
- Per-order Midtrans Snap integration would enable dynamic amounts + auto-status updates, but adds complexity and transaction fees

### Effort for dynamic per-order payments (future)
- Reuse Midtrans Snap for per-order: **3-5 days**
- Payment webhook → order status update: **1 day**

---

## Feature #5: Daily P&L Dashboard

**Research Score:** 8.5/10 — MVP Critical
**Status:** ✅ Done

### What the research proposes
- Auto-generated daily summary from order data
- Total orders, revenue, average order value, top products
- Zero additional input — leverages Feature #1 data
- WA message summary or in-app dashboard

### What CatatOrder has

| Component | File | Purpose |
|-----------|------|---------|
| DailyRecap | `features/recap/components/DailyRecap.tsx` | Date nav, stats, top items, export, WA send |
| MonthlyReport | `features/recap/components/MonthlyReport.tsx` | Month nav, stats, top items/customers, daily table |
| Recap service | `features/recap/services/recap.service.ts` | Daily data aggregation + export rows |
| Report service | `features/recap/services/report.service.ts` | Monthly data aggregation + export rows |

**Current recap system:**
- **Daily:** Total orders, revenue by payment status (lunas/DP/belum bayar), order status counts, top 10 items by revenue, new customers, monthly usage progress
- **Monthly:** All daily metrics + top 10 customers by spend + daily breakdown table
- **Excel export** for both daily and monthly (`.xlsx` via `generateExcel()`)
- **WA send** for daily recap (text message to operator's own phone)
- **Timezone:** WIB (UTC+7) boundaries
- **Analytics:** `recap_viewed`, `recap_exported`, `report_viewed`, `report_exported`

### Gaps (minor)
- No charts/graphs — all tabular data
- No comparison periods (today vs yesterday, month-over-month)
- Recap uses `created_at` not `delivery_date` — future-delivery orders appear in creation day's recap
- ~~WA send bypasses WAPreviewSheet~~ → ✅ Recap WA send now routes through WAPreviewSheet

### Effort to close gaps
- Chart visualization (e.g., recharts): **2-3 days**
- Comparison periods: **1-2 days**
- These are enhancements, not blockers

---

## Feature #6: Screenshot/Image OCR → Order Table

**Research Score:** 7.0/10 — V2-V3
**Status:** ✅ Done

### What the research proposes
- GPT-4o vision processes WA chat screenshots
- Covers less tech-savvy users
- ~$0.001-0.003 per image
- Text paste covers 70-80%, this handles the remaining 20-30%

### What CatatOrder has

| Component | File | Purpose |
|-----------|------|---------|
| ImageOrderSheet | `features/orders/components/ImageOrderSheet.tsx` | Bottom-sheet UI, 2-phase flow (upload → preview) |
| Image parse API | `app/api/image/parse/route.ts` | Gemini 3 Flash vision via OpenRouter |
| OrderForm integration | `features/orders/components/OrderForm.tsx` | "Foto" button (Camera icon) next to Tempel/Suara |

**How it works:**
1. Operator taps "Foto" button in order form
2. Phase 1: File picker with camera capture (`accept="image/*"` + `capture="environment"`). Shows image preview thumbnail. 10MB max client-side check.
3. On "Proses", image sent as base64 data URL to `/api/image/parse` with product catalog. Spinner: "Mengekstrak pesanan dari gambar..."
4. Phase 2: Editable item cards (same UI as PasteOrderSheet). Items with price=0 highlighted red. Operator can edit name/qty/price, remove items.
5. "Tambahkan" merges items into order form (same `handleParsedItems` logic as paste/voice)
6. No Supabase storage — screenshots are ephemeral (base64 round-trip only)
7. Analytics: `image_order_parsed` event with `item_count`

### Remaining gaps (minor)
- **No image compression** — large screenshots sent as full base64 (mitigated by 10MB cap)
- **No multi-image support** — one screenshot at a time
- `OCRResult` type stub in `features/receipts/types/receipt.types.ts` still exists (unused legacy placeholder)

---

## Feature #7: Auto Product Catalog

**Research Score:** 7.5/10 — V2
**Status:** ✅ Done

### What the research proposes
- AI learns products from order history
- Auto-suggests in new orders
- Fuzzy matching for name variations ("nasgor" → "Nasi Goreng")
- Living catalog that improves over time

### What CatatOrder has

| Component | File | Purpose |
|-----------|------|---------|
| Product CRUD | `features/products/services/product.service.ts` | Create, read, update, delete |
| Product list UI | `features/products/components/ProductList.tsx` | Inline add/edit, delete with modal |
| Quick-pick chips | `features/orders/` (OrderForm) | Top 8 items: products first, then history |
| Autocomplete | `features/orders/` (ItemInput) | Products take priority over history prices |

**Current product system:**
- Explicit product CRUD (not auto-learned, but manually managed + history-augmented)
- Quick-pick chips show products by `sort_order`, then history items, capped at 8
- Product prices feed into paste parsing and voice parsing
- `clearItemSuggestionsCache()` on every mutation
- Analytics: `product_added`, `product_updated`, `product_deleted`

### Gaps (minor)
- No fuzzy matching for abbreviations in product lookup (only Gemini handles "nasgor" → "Nasi Goreng")
- No drag-to-reorder despite `sort_order` column
- No categories, images, variant pricing, or bulk import
- No "auto-learn from orders" — products are manually created

### Effort to close gaps
- Auto-suggest new products from order history: **1-2 days**
- Fuzzy matching: **1 day**
- Drag-to-reorder: **1 day**

---

## Feature #8: Customer Database with Labels & History

**Research Score:** 7.0/10 — V2
**Status:** ✅ Done

### What the research proposes
- Auto-build from extracted orders
- Name, phone, order history, total spend, payment behavior
- Auto-labels based on behavior (new, repeat, VIP)
- Segmentation queries ("customers who haven't ordered in 30 days")

### What CatatOrder has

| Component | File | Purpose |
|-----------|------|---------|
| Customer service | `features/customers/services/customer.service.ts` | CRUD + `findOrCreateByPhone` |
| Customer list | `features/customers/components/CustomerList.tsx` | Search, piutang tab, WA reminder |
| Customer picker | `features/customers/components/CustomerPicker.tsx` | Inline search/select for forms |
| Customer detail | `app/(dashboard)/pelanggan/[id]/page.tsx` | Stats, history, edit, delete |

**Current customer system:**
- Auto-created from orders via `findOrCreateByPhone()` (upsert on phone)
- List sorted by `last_order_at`, searchable by name/phone (300ms debounce)
- Piutang tab with per-customer unpaid totals
- Detail page: total orders, total paid, total unpaid, full order history
- `CustomerPicker` used in order and receipt forms

### Gaps
- **No auto-labels** (new/repeat/VIP) — no labeling system at all
- **No segmentation engine** — no "inactive for 30 days" or "top 10 by revenue" queries
- **No RFM scoring** (Recency/Frequency/Monetary)
- ~~`address` and `notes` fields in schema/types but no UI to set them~~ → ✅ Address + notes inputs added to customer edit form
- History fetched by phone search, not FK — phone changes break history
- No customer creation from customer list page

### Effort to close gaps
- Auto-labels (based on order count/recency): **1-2 days**
- Segmentation filters in list: **2-3 days**

---

## Feature #9: HPP Calculator (Cost of Goods Sold)

**Research Score:** 6.5/10 — V3
**Status:** ❌ Not Built

### What the research proposes
- Simple calculator: input raw material + operational costs → recommended price with margin
- Integrate with Product Catalog for per-product HPP
- **Breaks zero-input promise** — requires manual cost entry
- V3 because of friction risk

### What CatatOrder has
Nothing.

### Effort
- Calculator UI + logic: **3-5 days**
- Integration with product catalog: **1 day**
- **Total: 4-6 days**
- **Risk:** Low adoption due to manual input requirement

---

## Feature #10: Financial Export (SAK EMKM Compliance)

**Research Score:** 8.0/10 — V2
**Status:** ❌ Not Built

### What the research proposes
- Auto-generate SAK EMKM-compliant reports from 3-6 months of data
- Income statement (Laporan Laba Rugi)
- Balance sheet summary (Laporan Posisi Keuangan)
- Cash flow statement (Laporan Arus Kas)
- Transaction log with timestamps
- PDF/docx format
- Retention driver (high switching cost)

### What CatatOrder has
- Excel export of daily/monthly order data — but not SAK EMKM formatted
- No income statement, balance sheet, or cash flow generation
- No docx/PDF report generation

### Effort
- SAK EMKM template research: **1 day**
- Income statement generation from order data: **2-3 days**
- Cash flow statement: **1-2 days**
- PDF/docx generation: **2-3 days**
- **Total: 6-9 days**
- **Prerequisite:** User needs 3+ months of accumulated order data

---

*Last updated: 2026-03-02 (screenshot OCR via Gemini vision)*
