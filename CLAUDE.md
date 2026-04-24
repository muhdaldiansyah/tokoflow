# Tokoflow

> LHDN-ready WhatsApp storefront for Malaysian SMBs.
> Forked from CatatOrder (ID) · Next.js 16 · React 19 · TypeScript · Supabase · Tailwind 4.

**Domain:** https://tokoflow.com
**Target:** Malaysia — RM 1M–5M turnover merchants (LHDN e-Invoice Phase 4 mandate).
**Codebase:** 44.4K LOC · 319 TS/TSX files · 0 user-visible BI strings.
**Status:** Phase 1 + Phase 2 scaffold complete. Pre-launch — ~80-120h Phase 2 code remaining + ops setup. See [HANDOFF.md](./HANDOFF.md).

---

## Core wedge

Tokoflow is a *positioned fork* for Malaysia, riding three stacked wedges:

1. **Compliance (urgent, dated):** native LHDN MyInvois integration. Orderla.my zero; Niagawan building but unshipped. RM 10K individual-invoice rule live 1 Jan 2026; Phase 4 full enforcement 1 Jan 2027.
2. **AI-native (moat):** paste WA chat → order, voice → order, screenshot → order. Gemini Flash Lite via OpenRouter.
3. **Community data (Phase 4 moat):** merchant group-buy + peer benchmarks. Requires density — port after beachhead.

MVP = wedge 1. 2–3 are post-beta differentiators.

## Panic window

- **Now (2026):** relaxation active for RM 1M–5M band, ends 31 Dec 2026
- **Q3 2026:** merchant panic-buying window — launch target
- **Jan 2027:** full enforcement — post-launch defence

---

## Stack differences from CatatOrder (Indonesia)

| Dimension | CatatOrder (ID) | Tokoflow (MY) |
|---|---|---|
| Currency | IDR | MYR (whole ringgit) |
| Locale | id-ID | en-MY |
| Payment | Midtrans Snap QRIS | Billplz (FPX / DuitNow QR / cards) — `lib/billplz/` |
| Tax | e-Faktur / NPWP / NITKU / DJP XML | SST 0%/6% · MyInvois UBL 2.1 JSON · TIN · BRN · SST reg |
| e-Invoice | DJP Coretax upload | LHDN MyInvois API — `lib/myinvois/` |
| Pricing tiers | Rp15K/25K/39K/99K | RM 5 / 8 / 13 / 49 / 99 |
| Timezone | WIB (UTC+7), quiet hours 21:00–05:00 | MYT (UTC+8), quiet hours 22:00–06:00 |
| Language | Bahasa Indonesia | English (BM = Phase 4) |
| Cities | 27 ID cities | 43 MY cities × 16 states (`config/my-cities.ts`) |
| Phone prefix | +62 | +60 |

---

## Database schema

Inherited from CatatOrder with additive migration 077 for MY-specific fields. Legacy ID columns (npwp, nitku, ppn_rate, ppn_amount, trx_code) remain during transition — drop in migration 078 once InvoiceForm rewrite lands (Phase 2 task 1).

### Migration 077 — MY additions

| Table | New columns |
|---|---|
| `profiles` | `brn`, `tin`, `sst_registration_id`, `myinvois_client_id`, `myinvois_client_secret_enc`, `default_sst_rate`. Quiet-hours defaults → MYT 22:00–06:00. |
| `customers` | `tin`, `sst_registration_id`, `brn` |
| `invoices` | `sst_rate`, `sst_amount`, `myinvois_submission_uid`, `myinvois_uuid`, `myinvois_long_id`, `myinvois_status`, `myinvois_submitted_at`, `myinvois_validated_at`, `myinvois_errors`, `buyer_tin`, `buyer_brn`, `buyer_sst_id`, `requires_individual_einvoice` |
| `payment_orders` | `billplz_bill_id`, `billplz_collection_id`, `billplz_url`, `billplz_paid_at` |

### Core tables (inherited)

| Table | Key columns |
|---|---|
| `profiles` | `orders_used`, `order_credits`, `unlimited_until`, `slug`, `order_form_enabled`, `preorder_enabled`, `bisnis_until`, `referral_code`, plus MY tax fields |
| `communities` + `community_members` + `community_announcements` | Komunitas infra (Phase 4 port target) |
| `orders` | `order_number` (CO-YYMMDD-XXXXXX), `items` JSONB, `subtotal/discount/total`, `paid_amount`, `delivery_date`, `is_preorder`, `status`, `source` |
| `customers` | `name`, `phone` (unique per user), `total_orders`, `total_spent`, MY tax fields |
| `products` | `name`, `price`, `category`, `is_available`, `stock`, `unit`, `cost_price` |
| `invoices` | `invoice_number` (INV-YYYY-XXXX), seller/buyer snapshots, MY tax + MyInvois tracking |
| `invoice_counters` | `(user_id, year)` PK — atomic sequential |
| `ai_analyses` | Cached AI recap insights |
| `payment_orders` + `transactions` | Billplz billing |

### Key DB functions

`check_order_limit`, `increment/decrement_orders_used`, `add_order_pack`, `add_order_pack_with_credits`, `activate_unlimited`, `activate_bisnis`, `generate_order/invoice/receipt_number`, `recalculate_customer_stats` (trigger), `increment_referral_commission`, `decrement_product_stock`, `generate_community_invite_code`.

---

## Project structure

```
app/
├── (marketing)/             # /, /features, /pricing, /blog, /about, /contact, /toko, /toko/[city], /komunitas/[slug], /mitra
├── (auth)/                  # /login, /register, /forgot-password, /reset-password
├── (onboarding)/setup/      # Business type → products → link ready
├── (public)/pesan/[slug]/   # Customer order form → /[slug] via rewrite
├── (public)/r/[id]/         # Public receipt page
├── (dashboard)/             # pesanan, produk, pelanggan, persiapan, rekap, faktur, komunitas, pajak, pengaturan, profil
├── (admin)/                 # Internal admin
├── join/[code]/             # Community invite shortlink
└── api/                     # ~60 routes + 5 cron jobs
    ├── billing/             # Billplz payments + webhook
    └── invoices/[id]/myinvois-{submit,status,cancel}/route.ts

features/{orders,customers,products,billing,recap,receipts,referral,invoices,auth}/
lib/
├── billplz/                 # ACTIVE — types, client, verify, index
├── myinvois/                # ACTIVE — types, generate-json, client, index
├── efaktur/                 # LEGACY — delete post Phase 2 task 1+2
└── supabase/, voice/, offline/, pdf/, utils/

config/{plans.ts, my-cities.ts, business-types.ts, categories.ts, navigation.ts, site.ts}
scripts/phase-0/             # MyInvois + Billplz sandbox spikes + merchant interview
supabase/migrations/         # 001–077 (077 = MY tax schema)
```

---

## Integrations

### Billplz (payment — ACTIVE)

- `lib/billplz/` — zero-SDK adapter: `types.ts`, `client.ts`, `verify.ts`, `index.ts`
- Merchant redirects to Billplz-hosted payment page. No Snap popup, no client SDK.
- Webhook verifies HMAC-SHA256 X-Signature with timing-safe comparison.
- Wired at `/api/billing/payments` (create bill) + `/api/billing/webhook` (state changes → plan activation + referral commission).
- Env: `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE_KEY`, `BILLPLZ_BASE_URL` (optional).

### MyInvois (tax — ACTIVE, awaits LHDN production certification)

- `lib/myinvois/` — UBL 2.1 JSON builder + OAuth client_credentials + submit/status/cancel/reject.
- `features/invoices/services/myinvois-adapter.ts` — bridges DB invoice → MyInvois document (proportional discount allocation, walk-in buyer fallback, >RM 10K rule detection).
- Routes: `/api/invoices/[id]/myinvois-{submit,status,cancel}` — Pro-plan gated, idempotent, 72h cancel window enforced.
- Supplier state codes via `MY_STATE_CODES` in `lib/myinvois/generate-json.ts`.
- Env: `MYINVOIS_CLIENT_ID`, `MYINVOIS_CLIENT_SECRET`, `MYINVOIS_BASE_URL` (defaults preprod in dev).

### Gemini Flash Lite (AI)

- Via OpenRouter. Used in `/api/recap/analyze`, `/api/voice/parse`, `/api/image/parse`.
- System prompts rewritten for Malaysian SMB context + RM formatting + EN.
- Env: `OPENROUTER_API_KEY`.

### Supabase

- Inherited Mumbai region. Plan: migrate to Singapore (ap-southeast-1) for MY deploy.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## Code patterns

- **Service layer:** `fetch("/api/...")`, return null/[] on error. Zero direct Supabase in UI
- **API routes:** `getAuthenticatedClient(req)` — dual auth: Bearer (mobile) → cookies (web)
- **Components:** `"use client"`, `useState`, toast via `sonner`
- **Customer auto-create:** Upsert on order. Phone match first, then name ilike. Stats auto-synced by trigger
- **Payment derivation:** `derivePaymentStatus()` — paid_amount vs total
- **Validation:** Items (name non-empty, price ≥ 0, qty ≥ 1), quota (402), delivery dates, slug, storage
- **View/edit separation:** `/pesanan/[id]` read-only, `/pesanan/[id]/edit` mutations
- **Modals:** Bottom-sheet for destructive actions (no `confirm()`)
- **Search:** 300ms debounce on all lists
- **WA messages:** 8 builders in `lib/utils/wa-messages.ts`, all branded `_Sent via Tokoflow — https://tokoflow.com_`
- **Slug:** `afterFiles` rewrite `/:slug` → `/pesan/:slug`. Reserved slugs in `slug.ts`
- **Stock:** Auto-decrement on order, auto-disable at 0, server-side race prevention
- **Swipe:** Right = advance status, Left = WA
- **Realtime:** Supabase on `orders` INSERT (toast + sound) + UPDATE (payment claim toast)
- **Offline:** Network-first + IDB fallback. FIFO sync + localStorage lock (30s TTL)
- **Analytics:** `track(event, properties?)` → `events` table + UTM
- **Progressive disclosure:** Nav items by totalOrders — 0 → 3 menus, 1+ → Pelanggan, 3+ → Komunitas, 5+ → Persiapan/Rekap, 10+ → Faktur
- **Smart defaults:** `config/business-types.ts` — 10 types auto-set mode, capacity, units, `overheadEstimatePct`
- **Pricing compass:** Traffic light 🟢🟡🔴⚫ in ProductForm (net margin after overhead). Peer benchmark via `/api/benchmark` (gated ≥10 users/cluster)
- **Quiet hours:** `profiles.quiet_hours_start/end` (default 22:00–06:00 MYT). Push suppressed during window
- **MyInvois submission (Pro):** 1-click from invoice detail (Phase 2 task 2). Auto-handles >RM 10K rule. Stores UUID + longId + validation status
- **Community join:** Cookie `community_code` → auth callback → upsert member + set community_id + set organizer as referrer

---

## UI patterns

### Dashboard
- Colors: warm bg `hsl(35 20% 97%)`, cards `hsl(36 15% 99%)`. Marketing: `bg-white`
- Cards: `rounded-xl border bg-card shadow-sm`
- Primary CTA: `h-9 px-3 bg-warm-green text-white rounded-lg`
- Text hierarchy: L1 `font-semibold text-foreground` → L2 values → L3 `text-foreground` → L4 `text-muted-foreground`
- Inputs: `h-11 px-3 bg-card border rounded-lg shadow-sm`
- Touch targets: min `h-11` (44px)

### Marketing
- Containers: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- CTAs: `bg-green-600 text-white hover:bg-green-700`
- Voice: conversational English, SMB-friendly

### SEO
- Title: `%s | Tokoflow`. OG 1200×630. `lang="en"`
- JSON-LD: SoftwareApplication (landing), LocalBusiness (store), Organization (community), FAQPage (pricing, contact)
- noindex: auth, dashboard, admin

---

## Cron jobs (`vercel.json`)

| Job | Schedule (UTC) | MYT | Function |
|---|---|---|---|
| invoice-overdue | 07:00 | 15:00 | Mark overdue invoices |
| morning-brief | 22:00 | 06:00 | Push: today's orders summary + cost trend alert (food cost delta ≥ 5pp) |
| engagement | 00:00 | 08:00 | Push: death valley + milestones + monthly review |
| alerts | 00:00 | 08:00 | Push: stock ≤ 3, capacity ≥ 80%, quota approaching, quota exhausted |

---

## Environment variables

```
NEXT_PUBLIC_APP_URL=https://tokoflow.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Billplz (payment)
BILLPLZ_API_KEY=
BILLPLZ_COLLECTION_ID=
BILLPLZ_X_SIGNATURE_KEY=
BILLPLZ_BASE_URL=              # optional — defaults by NODE_ENV

# MyInvois (e-Invoice, Pro plan)
MYINVOIS_CLIENT_ID=
MYINVOIS_CLIENT_SECRET=
MYINVOIS_BASE_URL=             # optional — defaults to preprod in dev

# AI
OPENROUTER_API_KEY=

# Cron
CRON_SECRET=
```

---

## Phase 0 gates (before Phase 2 proper)

Scripts at `scripts/phase-0/`. Gate A criteria — all must pass:

- [ ] `myinvois-spike.ts` returns `submissionUid` + accepted `uuid` from LHDN preprod
- [ ] `billplz-spike.ts` passes X-Signature round-trip (genuine + tamper tests)
- [ ] Niagawan e-Invoice timeline: ≥ 6 months away
- [ ] ≥ 7 of 10 merchant interviews score LHDN panic ≥ 7/10
- [ ] ≥ 6 of 10 merchants willing to pay RM 20–40/month
- [ ] MDEC Digitalisation Partner application submitted

Fail any → re-evaluate wedge before Phase 2 coding.

---

## Phase 2 remaining work (~80-120h)

Priority order:

| # | Task | File / scope | Effort |
|---|---|---|---|
| 1 | **Rewrite InvoiceForm.tsx** | `features/invoices/components/InvoiceForm.tsx` (353 lines) — replace NPWP/NITKU/PPN inputs with TIN/BRN/SST; wire "Submit to MyInvois" button + polling UI | 12-16h |
| 2 | **Rewrite InvoiceDetail.tsx** | `features/invoices/components/InvoiceDetail.tsx` (383 lines) — show MyInvois UUID / QR / longId; cancel button (72h window) | 8-12h |
| 3 | **Tax engine refactor** | 3 routes: `/api/tax/pph-calculation`, `/api/tax/rekap`, `/api/tax/omzet-summary` — drop Indonesian PPh monthly, add SST annual | 12h |
| 4 | **Staff accounts + assignment** | NEW feature. Schema + API + UI + order-assignment flow. Orderla complaint #1. | 10-16h |
| 5 | **Customer accounts + 1-tap reorder** | NEW feature. Orderla founder-admitted gap. | 10-16h |
| 6 | **Delete `lib/efaktur/`** | Unblocked after tasks 1+2 (3 files still import: `app/(dashboard)/faktur/page.tsx`, `InvoiceDetail.tsx`, the lib itself) | 2h |
| 7 | **Clean 20 NPWP/NITKU references** | Service-layer cleanup after migration 078 drops legacy columns | 4-6h |
| 8 | **Private beta prep** | Analytics instrumentation + onboarding tune + Pro tier gating | 8h |

## Route rename (separate risky PR, 20-30h)

42 internal link sites + 9 directory renames + middleware 301 redirects:
`/pesanan` → `/orders` · `/produk` → `/products` · `/pelanggan` → `/customers` · `/persiapan` → `/prep` · `/rekap` → `/recap` · `/faktur` → `/invoices` · `/komunitas` → `/community` · `/pajak` → `/tax` · `/pengaturan` → `/settings` · `/pesan/[slug]` → `/order/[slug]`

## Phase 4 deferred (~320h total, post-launch)

- Port CatatOrder komunitas + group-buy (~40h)
- Port AI order parsing from chat/screenshot (~16h)
- Port peer benchmark (~24h)
- TikTok Shop MY sync (~40h)
- BM localization — rural MY expansion (~40h)
- Native accounting sync (SQL Account, Bukku, AutoCount) (~60h)
- Franchise / multi-outlet mode — Business tier (~60h)
- Singapore + Brunei cross-border (~40h)

---

## Real-world ops (user action — code can't do)

- Sdn Bhd registration (~4-8 weeks, nominee director acceptable)
- Malaysian bank account (prereq for Billplz KYB)
- Billplz merchant account — upload Sdn Bhd docs
- MyInvois production certification (post Sdn Bhd verification)
- MDEC Digitalisation Partner certification (6-8 week lag)
- Procure `tokoflow.com` domain + Vercel deployment
- Apply migrations 001-077 to fresh Supabase project (Singapore region)

---

*Last updated: 2026-04-24 · Phase 1 complete (44.4K LOC, 319 files, 0 BI residuals) · Phase 2 scaffolded (MyInvois + Billplz live) · ~100-150h Phase 2 code remaining + ops setup before public launch.*
