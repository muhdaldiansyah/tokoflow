# Implementation Roadmap — Adjusted for Current Codebase

> The original research assumes a greenfield build. CatatOrder v2.2.0 already has 5 of 10 features done and 2 partial. This roadmap covers **remaining work only**, re-prioritized based on what exists.

---

## Original vs. Adjusted Roadmap

### Original Research Roadmap

| Phase | Features | Timeline |
|-------|----------|----------|
| V1 MVP | #1 AI Extraction, #2 Invoice Image, #5 Daily P&L | Week 1-3 |
| V2 Growth | #3 Piutang Reminder, #10 SAK EMKM, #7 Catalog, #8 Customer DB | Month 2-3 |
| V3 Advanced | #4 QRIS, #6 Screenshot OCR, #9 HPP Calculator | Month 4+ |

### Adjusted Roadmap (what's actually left)

| Phase | Work | Est. Effort | Depends On | Status |
|-------|------|-------------|------------|--------|
| **Now** | Quick wins + gap fixes | 2-3 days | Nothing | ✅ Done |
| **V-Next** | Auto-reminders | 2-3 days | WABA for sending | ✅ Done |
| **V-Later** | SAK EMKM + per-order payments | 2-3 weeks | User data + WABA | Pending |
| ~~**V-Later**~~ | ~~Screenshot OCR~~ | ~~4-6 days~~ | ~~Nothing~~ | ✅ Done |
| **V3+** | HPP Calculator | 1 week | Product catalog maturity | Pending |

> **Image invoice (#2):** ✅ Completed — client-side capture via `html-to-image`, native share on mobile, download fallback on desktop.

---

## Phase: Now — Quick Wins ✅ COMPLETED (2026-03-02)

All 7 quick-win tasks implemented.

| Task | Feature | Status |
|------|---------|--------|
| Add `paste_order_parsed` analytics event | #1 | ✅ Already existed in OrderForm.tsx |
| Add `receipt_shared` analytics event | #2 | ✅ Done — `riwayat/page.tsx` |
| Route receipt WA share through WAPreviewSheet | #2 | ✅ Done — `riwayat/page.tsx` |
| Route recap WA send through WAPreviewSheet | #5 | ✅ Done — `DailyRecap.tsx` |
| Route piutang reminder through WAPreviewSheet | #3 | ✅ Done — `CustomerList.tsx` |
| Add address/notes fields to customer edit UI | #8 | ✅ Done — `pelanggan/[id]/page.tsx` |
| Add public order form analytics (server-side) | #1 | ✅ Done — `api/public/orders/route.ts` (`public_order_received`) |

---

## Phase: V-Next — Auto-Reminders (2-3 days)

### ✅ Image Invoice Generation (Feature #2) — COMPLETED

Implemented using `html-to-image` (client-side capture) instead of server-side rendering. Simpler, no server cost, no cold starts.

**What was built:**
- `lib/invoice/generate-image.ts` — `captureInvoiceImage()` wrapper around `toPng()` with 2x pixel ratio
- `OrderReceiptPage.tsx` — 3-button layout: "Kirim WA" (image share), "Gambar" (download PNG), "PDF" (download PDF)
- Mobile: `navigator.share({ files })` → native share sheet → WA displays image inline
- Desktop fallback: auto-download PNG + open `wa.me` deep link with text message
- Analytics: `invoice_image_shared` event tracked on every share
- CatatOrder branding visible at bottom of every image

### ✅ Auto-Scheduled Reminders (Feature #3 gap) — COMPLETED

**What was built:**
- `features/orders/services/reminder.service.ts` — `scheduleOrderReminders()` auto-creates D+1, D+3, D+7 reminders with pre-built messages when unpaid order is created (with phone). Duplicate prevention via day_offset check.
- `cancelOrderReminders()` — auto-cancels all pending reminders when order is marked paid (integrated at 5 points in `order.service.ts`: `createOrder`, `updateOrder`, `recordPayment`, `bulkMarkPaid`, `deleteOrder`)
- `app/(dashboard)/pengingat/page.tsx` — Central dashboard with "Terlambat & Hari Ini" / "Mendatang" sections. "Kirim WA" via WAPreviewSheet → marks sent. Cancel with double-tap confirm.
- Navigation: Bell icon in sidebar + mobile drawer
- DB: `021_order_reminders.sql` — `order_id`, `reminder_type`, `day_offset` on `reminders` table; RLS checks ownership via either receipts or orders
- Sending: wa.me deep link via WAPreviewSheet. When WABA unblocks, swap to Cloud API templates.
- Analytics: `reminder_sent`, `reminder_cancelled` events

---

## Phase: V-Later — Reports + OCR + Per-Order Payments (2-3 weeks)

Features that need user data accumulation or external dependencies.

### SAK EMKM Financial Export (Feature #10)

**Prerequisite:** Users need 3+ months of order data for meaningful reports.

**Steps:**
1. Research SAK EMKM template requirements (Laporan Laba Rugi, Posisi Keuangan, Arus Kas)
2. Build aggregation queries from orders/payments data
3. PDF generation with SAK EMKM template
4. Export button in monthly report page

**Effort: 6-9 days**
**Timing:** Only useful after users have 3+ months of data → earliest Q3 2026

### Screenshot OCR (Feature #6) — ✅ DONE

Implemented as standalone `ImageOrderSheet` component with "Foto" button in OrderForm. Gemini 3 Flash vision via OpenRouter. Same 2-phase flow as PasteOrderSheet (upload → editable preview). Analytics: `image_order_parsed`.

### Per-Order Payment Links (Feature #4 extension)

**Current:** Midtrans used for SaaS billing only.
**Extension:** Generate per-order Snap transactions so operator's customers can pay digitally.

**Steps:**
1. "Buat Link Bayar" button on order detail
2. Generate Midtrans Snap transaction for order amount
3. Share payment link via WA to customer
4. Webhook updates order `paid_amount` on successful payment

**Effort: 3-5 days**
**Dependency:** Works independently of WABA (uses Snap redirect URL, not WA API)

---

## Phase: V3+ — HPP Calculator (1 week)

### HPP Calculator (Feature #9)

**Why last:** Breaks the zero-input promise. Requires manual cost entry — friction risk for UMKM adoption.

**Steps:**
1. Per-product cost fields (bahan baku, operasional, kemasan)
2. Calculator: total cost + target margin → recommended selling price
3. Margin indicator on product list (green/yellow/red)

**Effort: 4-6 days**
**Risk:** May see low adoption — consider as "Pro" tier feature

---

## Dependency Graph

```
[✅ Now: Quick Wins — DONE]
    │
    ├──→ [✅ Image Invoice — DONE] ──→ [V-Later: Per-Order QRIS in Invoice]
    │
    ├──→ [✅ Auto-Reminders — DONE (wa.me)] ──→ [WABA Resolution] ──→ [Cloud API Auto-Send]
    │
    ├──→ [✅ Screenshot OCR — DONE]
    │
    ├──→ [V-Later: SAK EMKM] (needs 3+ months data)
    │
    └──→ [V3+: HPP Calculator] (independent, low priority)
```

**Critical path:** Quick wins, Image Invoice, and Auto-Reminders are done. Next: Per-Order Payments or distribution-first.

---

## Remaining Features Ranked by Impact

| Rank | Feature | Impact | Effort | ROI |
|------|---------|--------|--------|-----|
| ~~1~~ | ~~Image Invoice (#2)~~ | ~~Very High~~ | ~~3-5 days~~ | ✅ Done |
| ~~1~~ | ~~Auto-Reminders (#3 gap)~~ | ~~High~~ | ~~2-3 days~~ | ✅ Done |
| 1 | Per-Order Payments (#4 ext) | High — closes payment loop | 3-5 days | Medium-High |
| 3 | SAK EMKM Export (#10) | Medium — retention + lock-in | 6-9 days | Medium |
| ~~4~~ | ~~Screenshot OCR (#6)~~ | ~~Low-Medium — accessibility~~ | ~~4-6 days~~ | ✅ Done |
| 5 | HPP Calculator (#9) | Low — breaks UX promise | 4-6 days | Low |

---

## What NOT to Build

Based on the research + codebase analysis:

1. **Don't rebuild what's working** — Features #1, #5, #7, #8 are solid. Polish only.
2. **Don't build auto-labels/CRM before having users** — Feature #8 gaps (labels, segmentation) are V3+ at best. Need 50+ users to justify.
3. **Don't build HPP before distribution validates** — If users don't adopt the core flow, cost calculators are irrelevant.
4. ~~**Don't invest in OCR until text paste adoption is measured**~~ → ✅ Built — low effort, complements paste + voice as third input mode.

---

*Last updated: 2026-03-02 (screenshot OCR implemented)*
