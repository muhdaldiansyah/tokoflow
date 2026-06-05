# Scoring Analysis — Feature Research vs. CatatOrder Codebase

> Original scoring from `Feature-Research-Scoring-WA-Invoice-Bridge.md` mapped against CatatOrder v2.2.0.

---

## Scoring Methodology (from research)

Each feature scored 1–10 across six dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Pain Severity | 20% | How much does this problem hurt daily operations? |
| Frequency | 15% | How often does the pain occur? |
| Market Size | 15% | How many UMKM sellers face this problem? |
| Willingness to Pay | 15% | Would sellers pay to solve this? |
| Technical Feasibility | 20% | Can we build this quickly and cheaply? |
| Competitive Gap | 15% | Is there an unserved opportunity? |

---

## Per-Feature Assessment

### Feature #1: AI Chat → Tabel Order (9.5/10) — ✅ DONE

**Research proposes:** Paste messy WA chat → AI extracts structured order table. Zero manual input. GPT-4o mini.

**CatatOrder has:** `PasteOrderSheet` with 2-phase flow — instant regex preview + Gemini 3 Flash background refinement. Editable items, product catalog price matching, red highlight for missing prices.

**Assessment:** Exceeds the research spec. Two-layer parsing (regex instant + AI refinement) is more resilient than pure-AI approach. Uses Gemini instead of GPT-4o mini — same capability tier, different provider.

**Gaps:**
- No analytics event for paste parsing (voice has `voice_order_parsed`, paste has nothing)
- Regex parser doesn't extract prices from text (e.g., "nasi goreng 25rb") — relies on product catalog
- Multi-speaker WA chat format only handled by Gemini, not regex fallback

---

### Feature #2: Invoice Generation (9.0/10) — ⚠️ PARTIAL

**Research proposes:** Image-format invoice shareable via WA. Image displays inline in WA (no download needed). Template with seller logo/brand. Auto-populated from AI extraction. Viral branding on every invoice.

**CatatOrder has:**
- Text-based receipt system (`features/receipts/`) — thermal receipt style preview in-browser
- WA share as text message (not image) via `wa.me` deep link
- `OrderReceiptPage` for order-based invoices (browser render only)
- No image generation, no PDF export, no logo rendering

**Assessment:** CatatOrder has a receipt system but it's text-only. The research specifically recommends **image format** because WA displays images inline — customers see it immediately without opening. This is the key gap. The text receipt is functional but loses the viral/professional impact.

**Gaps:**
- No server-side image generation (research suggests Puppeteer/Sharp)
- No PDF generation (`lib/pdf/generate-receipt.ts` referenced in CLAUDE.md does not exist)
- `logo_url` in `BusinessInfo` type but never rendered
- Receipt WA share bypasses `WAPreviewSheet` (inconsistent UX)
- Receipt payment status is binary (paid/unpaid) — no partial payment
- Receipt number uses `Math.random()` with no uniqueness constraint

---

### Feature #3: Piutang Tracker + Auto-Reminder (9.0/10) — ✅ DONE

**Research proposes:** Auto-track receivables from invoice data. WA Business API reminders at D+1, D+3, D+7. No separate data entry.

**CatatOrder has:**
- Piutang tab in CustomerList — shows aggregated unpaid per customer
- Auto-scheduled D+1/D+3/D+7 reminders on unpaid order creation (with phone)
- Auto-cancellation when order marked paid (5 integration points in order service)
- Central Pengingat dashboard with grouped view (overdue/today + upcoming)
- "Kirim WA" via WAPreviewSheet with pre-built reminder messages
- `reminders` table extended with `order_id`, `reminder_type`, `day_offset`
- Analytics: `reminder_sent`, `reminder_cancelled` events

**Assessment:** Feature complete. Auto-scheduling and dashboard implemented. Sending uses wa.me deep link (operator previews + sends manually via WAPreviewSheet). Cloud API auto-send ready to swap in when WABA unblocks.

**Remaining:**
- WA Cloud API sending blocked (WABA restricted, pending Business Verification) — wa.me works now

---

### Feature #4: QRIS / Payment Link in Invoice (8.0/10) — ✅ DONE

**Research proposes:** Embed QRIS/payment link in invoice. Xendit or Midtrans. 0.7-2.9% fees. V2-V3 timing.

**CatatOrder has:** Full Midtrans Snap integration — VA, GoPay, QRIS. Webhook verification. Plan activation. Payment pages (success/pending/failed).

**Assessment:** Done and live for billing/subscription payments. However, the research envisions payment links **embedded in customer-facing invoices** (per-order payments), not just SaaS billing. Per-order QRIS is a separate use case.

**Note:** The research placed this at V2-V3 and CatatOrder has it for billing. Per-order payment links for customers would be a new feature.

---

### Feature #5: Daily P&L Dashboard (8.5/10) — ✅ DONE

**Research proposes:** Auto-generated daily summary from order data. Total orders, revenue, average order value, top products. Zero additional input.

**CatatOrder has:**
- `DailyRecap`: date navigation, total orders, revenue by payment status, order status counts, top 10 items by revenue, new customers count, monthly usage progress
- `MonthlyReport`: month navigation, status breakdown, top items, top customers, daily breakdown table
- Excel export for both
- WA send for daily recap
- Analytics events tracked

**Assessment:** Exceeds the research spec. Monthly report is a bonus. Excel export adds tangible business value (sharable with partners/accountants).

**Gaps:**
- No trend visualization (charts/graphs) — all tabular
- No comparison period (today vs yesterday, this month vs last)
- Recap uses `created_at` not `delivery_date` — orders for future delivery appear in today's recap
- Daily recap WA send bypasses `WAPreviewSheet`

---

### Feature #6: Screenshot/Image OCR (7.0/10) — ❌ NOT BUILT

**Research proposes:** GPT-4o vision processes WA chat screenshots. Covers less tech-savvy users. ~$0.001-0.003 per image. V2-V3 priority.

**CatatOrder has:** `OCRResult` type stub in `receipt.types.ts` with a `confidence` field — placeholder only. No upload UI, no vision API call, no processing logic.

**Assessment:** Not built. The type stub suggests it was considered. Text paste covers 70-80% of use cases per the research. Lower priority.

---

### Feature #7: Auto Product Catalog (7.5/10) — ✅ DONE

**Research proposes:** AI learns products from order history. Auto-suggests in new orders. Fuzzy matching for abbreviations. Living catalog.

**CatatOrder has:**
- Full product CRUD (`features/products/`)
- Quick-pick chips (products first by `sort_order`, then history items, capped at 8)
- Autocomplete in order form (products take priority over history)
- Product prices feed into paste/voice parsing
- `clearItemSuggestionsCache()` on every mutation

**Assessment:** Done and goes beyond the research. Research envisions auto-learning; CatatOrder has explicit CRUD plus learning from history. The quick-pick chips and autocomplete create the "system gets smarter" effect the research describes.

**Gaps:**
- No fuzzy matching for abbreviations ("nasgor" → "Nasi Goreng") in product lookup — Gemini handles this in paste parsing only
- No drag-to-reorder despite `sort_order` column
- No categories, images, or variant pricing

---

### Feature #8: Customer Database (7.0/10) — ✅ DONE

**Research proposes:** Auto-build from extracted orders. Name, phone, order history, total spend, payment behavior. Labels auto-assigned. Segmentation queries.

**CatatOrder has:**
- Auto-create via `findOrCreateByPhone()` on order creation
- List sorted by `last_order_at`, searchable
- Piutang tab with per-customer unpaid totals
- Detail page: stats, order history, inline edit, delete
- `CustomerPicker` for order/receipt forms

**Assessment:** Done. Core functionality matches the research. Missing the advanced CRM features (auto-labels, segmentation queries, "show me customers who haven't ordered in 30 days").

**Gaps:**
- No auto-labels or segmentation engine
- No RFM (Recency/Frequency/Monetary) scoring
- `address` and `notes` fields in schema but no UI
- Customer history fetched by phone search, not FK join
- No customer creation from customer list (only auto-created from orders)

---

### Feature #9: HPP Calculator (6.5/10) — ❌ NOT BUILT

**Research proposes:** Simple cost calculator. Input raw material + operational costs → recommended price with target margin. V3 priority because it breaks zero-input promise.

**CatatOrder has:** Nothing.

**Assessment:** Correctly deprioritized. Research acknowledges this breaks the core UX promise. Manual cost entry = friction = low adoption risk for UMKM.

---

### Feature #10: Financial Export / SAK EMKM (8.0/10) — ❌ NOT BUILT

**Research proposes:** Auto-generate SAK EMKM-compliant financial reports from 3-6 months of accumulated data. Income statement, balance sheet, cash flow, transaction log. PDF/docx. Retention driver + switching cost.

**CatatOrder has:** Excel export of daily/monthly order data — but not SAK EMKM formatted. No income statement, balance sheet, or cash flow generation.

**Assessment:** Not built. Requires accumulated data to be meaningful (research says 3+ months). The Excel export is a stepping stone. The lock-in/retention value is high once users have data.

---

## Summary Matrix

| Feature | Score | Status | Gap Size |
|---------|-------|--------|----------|
| #1 AI Chat → Order | 9.5 | ✅ Done | Small (analytics, price extraction) |
| #2 Invoice (Image) | 9.0 | ⚠️ Partial | **Large** (need image generation) |
| #3 Piutang + Reminder | 9.0 | ✅ Done | Auto D+1/D+3/D+7 + Pengingat dashboard |
| #4 QRIS / Payment Link | 8.0 | ✅ Done | Small (per-order payments not built) |
| #5 Daily P&L Dashboard | 8.5 | ✅ Done | Small (charts, comparisons) |
| #6 Screenshot OCR | 7.0 | ❌ Not Built | Full build needed |
| #7 Product Catalog | 7.5 | ✅ Done | Small (fuzzy match, categories) |
| #8 Customer Database | 7.0 | ✅ Done | Small (labels, segmentation) |
| #9 HPP Calculator | 6.5 | ❌ Not Built | Full build needed |
| #10 SAK EMKM Export | 8.0 | ❌ Not Built | Full build needed |

---

*Last updated: 2026-03-02*
