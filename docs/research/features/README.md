# Feature Research — CatatOrder

> Analysis of 10 feature candidates from the WhatsApp Order-to-Invoice Bridge scoring document, mapped against the current CatatOrder v2.2.0 codebase.

**Source:** `~/Downloads/Feature-Research-Scoring-WA-Invoice-Bridge.md` (March 2, 2026)

---

## Feature Map

| # | Feature | Research Score | Status | Notes |
|---|---------|---------------|--------|-------|
| 1 | AI Chat → Tabel Order | 9.5/10 | ✅ Done | PasteOrderSheet + Gemini Flash refinement |
| 2 | Invoice Generation (Image) | 9.0/10 | ✅ Done | Image capture via html-to-image + native share / download |
| 3 | Piutang Tracker + Auto-Reminder | 9.0/10 | ✅ Done | Auto D+1/D+3/D+7 reminders + Pengingat dashboard |
| 4 | QRIS / Payment Link in Invoice | 8.0/10 | ✅ Done | Static QRIS on invoices + public order success page |
| 5 | Daily P&L Dashboard | 8.5/10 | ✅ Done | DailyRecap + MonthlyReport + Excel export |
| 6 | Screenshot/Image OCR | 7.0/10 | ✅ Done | ImageOrderSheet + Gemini 3 Flash vision |
| 7 | Auto Product Catalog | 7.5/10 | ✅ Done | Full CRUD + quick-pick chips + autocomplete |
| 8 | Customer Database | 7.0/10 | ✅ Done | Auto-create from orders, piutang view, history |
| 9 | HPP Calculator (COGS) | 6.5/10 | ❌ Not Built | No implementation |
| 10 | Financial Export (SAK EMKM) | 8.0/10 | ❌ Not Built | No implementation |

**Summary:** 8 Done, 2 Not Built

---

## Documents

| File | Content |
|------|---------|
| [scoring-analysis.md](scoring-analysis.md) | Original scoring methodology + our assessment per feature |
| [feature-status.md](feature-status.md) | Detailed per-feature breakdown with file paths, gaps, effort |
| [implementation-roadmap.md](implementation-roadmap.md) | Adjusted V1/V2/V3 priorities for remaining work |

---

## Priority Matrix — Remaining Work

### ✅ Quick Wins — COMPLETED (2026-03-02)
All 7 quick-win tasks from the "Now" phase are done:
- `paste_order_parsed` analytics event (already existed)
- `receipt_shared` analytics event
- WAPreviewSheet for receipt re-send, recap WA send, piutang reminder
- Customer address/notes edit UI
- Server-side `public_order_received` analytics

### High Impact (do next)
- ~~**Feature #3 gap:** Auto-scheduled WA reminders~~ → ✅ Done (auto D+1/D+3/D+7 via wa.me deep link; Cloud API swap when WABA unblocks)

### Medium Impact (after distribution validates)
- **Feature #10:** SAK EMKM financial export — needs 3+ months of data first
- ~~**Feature #6:** Screenshot OCR~~ → ✅ Done (ImageOrderSheet + Gemini 3 Flash vision via OpenRouter)

### Low Impact (V3+)
- **Feature #9:** HPP Calculator — breaks zero-input promise, requires manual cost entry

---

*Last updated: 2026-03-02*
