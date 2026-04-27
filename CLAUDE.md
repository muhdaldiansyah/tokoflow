# Tokoflow

> **From snap to sold.** The simplest way for anyone to start selling — one photo to launch your shop.
> AI handles the conversation, payment, and paperwork so the merchant can focus on what they make.
> Forked from CatatOrder (ID) · Next.js 16 · React 19 · TypeScript · Supabase · Tailwind 4.

**Domain:** https://tokoflow.com · aliased to production deploy on Vercel
**Target Year 1:** Malaysia, hyperlocal Shah Alam — home F&B mompreneur (Bu Aisyah persona). Concentric expansion to Klang Valley → SEA → global.
**Status:** Phase 1 + Phase 2 code **complete** · "From snap to sold" reposition **shipped** · 80 migrations applied · Pre-launch — gated on Phase 0 validation + Sdn Bhd + Billplz KYB + LHDN prod cert.

> **Strategic compass:** [`docs/positioning/`](./docs/positioning/) is the bible — read [`00-manifesto.md`](./docs/positioning/00-manifesto.md) before any product decision. Every feature must pass the 5 tests.

---

## Wedges (Apple-grade soul, with compliance as silent superpower)

1. **The Photo Magic (Phase 1, planned):** one photo → toko muncul. Iconic interaction. See [`P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md).
2. **AI-native (shipped):** paste WA chat → order, voice → order, screenshot → order. Gemini Flash Lite via OpenRouter. MY SMB vocab, +60 phones, Asia/Kuala_Lumpur.
3. **Community data (shipped, density-gated):** peer benchmark live at `/api/benchmark` (≥10 users/cluster gate). Group-buy pooling deferred to Phase 4.
4. **Silent superpower — LHDN MyInvois (shipped, demoted to Pro tier):** one-tap submit at `/invoices`. Not the hero — RM 1M–5M relaxation runs through 31 Dec 2026, full enforcement 1 Jan 2027. Compliance is *built-in*, not the pitch. See [`01-positioning.md`](./docs/positioning/01-positioning.md) for what Tokoflow is **not**.

---

## Stack differences from CatatOrder (Indonesia)

| Dimension | CatatOrder (ID) | Tokoflow (MY) |
|---|---|---|
| Currency | IDR | MYR (whole ringgit) |
| Locale | id-ID | en-MY |
| Payment | Midtrans Snap QRIS | Billplz (FPX / DuitNow QR / cards) — `lib/billplz/` |
| Tax | e-Faktur / NPWP / NITKU / DJP XML | SST 0%/6% · MyInvois UBL 2.1 JSON · TIN · BRN · SST reg |
| e-Invoice | DJP Coretax upload | LHDN MyInvois API — `lib/myinvois/` |
| Pricing tiers | Rp15K/25K/39K/99K | Free / Pro RM 49 / Business RM 99 (legacy RM 5/8/13 pack model `@deprecated` in `config/plans.ts`, kept for API+DB compat) |
| Timezone | WIB (UTC+7), quiet hours 21:00–05:00 | MYT (UTC+8), quiet hours 22:00–06:00 |
| Language | Bahasa Indonesia | English (BM = Phase 4, not shipped) |
| Cities | 27 ID cities | 44 MY cities × 16 states (DB `cities` + `provinces`, seeded by migration 080) |
| Phone prefix | +62 | +60 (normalised in `lib/utils/phone.ts`) |
| Marketplace integration | Shipped into CatatOrder (commit `f81e083`) | Not ported — Phase 4 item |

Tokoflow and CatatOrder are **sister products**, not a unified codebase. See HANDOFF.md for the multi-country decision rationale.

---

## Database schema

All 81 migrations applied on the Tokoflow Supabase project (`yhwjvdwmwboasehznlfv`, Mumbai region — migrate to Singapore pre-launch). Migration tracker `supabase_migrations.schema_migrations` is in sync with `supabase/migrations/` on the CLI.

### Phase 2 additions (this session)

**Migration 077 — MY tax + MyInvois schema**
| Table | New columns |
|---|---|
| `profiles` | `brn`, `tin`, `sst_registration_id`, `myinvois_client_id`, `myinvois_client_secret_enc`, `default_sst_rate`. Quiet-hours defaults → MYT 22:00–06:00. |
| `customers` | `tin`, `sst_registration_id`, `brn` |
| `invoices` | `sst_rate`, `sst_amount`, `myinvois_submission_uid`, `myinvois_uuid`, `myinvois_long_id`, `myinvois_status`, `myinvois_submitted_at`, `myinvois_validated_at`, `myinvois_errors`, `buyer_tin`, `buyer_brn`, `buyer_sst_id`, `requires_individual_einvoice` |
| `payment_orders` | `billplz_bill_id`, `billplz_collection_id`, `billplz_url`, `billplz_paid_at` |

**Migration 078 — seller-side MY tax snapshot**
| Table | New columns |
|---|---|
| `invoices` | `seller_tin`, `seller_brn`, `seller_sst_registration_id` (captured at invoice-issue time for audit + PDF). |

**Migration 079 — staff accounts + order assignment**
| Table | Columns |
|---|---|
| `staff` (new) | `id`, `user_id` (owner FK), `name`, `phone`, `role` (`owner`\|`assistant`), `active` · RLS scoped to owner |
| `orders` | `assigned_staff_id` FK, `assigned_at` |

**Migration 080 — MY localization for lookup tables**
| Table | Change |
|---|---|
| `business_categories` | Relabelled 16 ID rows to MY-English (`Catering & Nasi Box`, `Kopitiam & Food Stall`, …); added 8 service categories (`tailor`, `kosmetik`, `laundry`, `rental`, `elektronik`, `otomotif`, `pendidikan`, `desain`). 24 active rows. |
| `product_units` | Relabelled 10 ID units (`porsi`→`pax`, `loyang`→`tray`, `gelas`→`glass`, `lembar`→`sheet`, `batang`→`stick`); added 7 (`set`, `cup`, `carton`, `litre`, `package`, `session`, `hour`). 17 active rows. |
| `provinces` | Seeded 16 MY states + federal territories (KL, Selangor, Penang, …). Sort order surfaces Klang Valley first. |
| `cities` | Seeded 44 MY cities mirroring (now-deleted) `config/my-cities.ts`, joined to `provinces` via FK. |

### Core tables (inherited)

| Table | Key columns |
|---|---|
| `profiles` | `orders_used`, `order_credits`, `unlimited_until`, `slug`, `order_form_enabled`, `preorder_enabled`, `bisnis_until`, `referral_code`, plus MY tax fields |
| `communities` + `community_members` + `community_announcements` | Community infra (group-buy pooling still deferred) |
| `orders` | `order_number` (CO-YYMMDD-XXXXXX), `items` JSONB, `subtotal/discount/total`, `paid_amount`, `delivery_date`, `is_preorder`, `status`, `source`, `assigned_staff_id` |
| `customers` | `name`, `phone` (unique per user), `total_orders`, `total_spent`, MY tax fields |
| `products` | `name`, `price`, `category`, `is_available`, `stock`, `unit`, `cost_price` |
| `invoices` | `invoice_number` (INV-YYYY-XXXX), seller/buyer snapshots, MY tax + MyInvois tracking |
| `invoice_counters` | `(user_id, year)` PK — atomic sequential |
| `ai_analyses` | Cached AI recap insights |
| `payment_orders` + `transactions` | Billplz billing |

### Key DB functions

`check_order_limit`, `increment/decrement_orders_used`, `add_order_pack`, `add_order_pack_with_credits`, `activate_unlimited`, `activate_bisnis`, `generate_order/invoice/receipt_number`, `recalculate_customer_stats` (trigger), `increment_referral_commission`, `decrement_product_stock`, `generate_community_invite_code`.

### Legacy-column status

Columns from CatatOrder still present for compat (dropped in a future migration):
- `profiles.npwp`, `profiles.nitku`, `profiles.wp_type`, `profiles.wp_registered_year`
- `invoices.ppn_rate`, `invoices.ppn_amount` — every write path mirrors sst_rate/sst_amount to these columns
- `invoices.seller_npwp`, `invoices.seller_nitku`, `invoices.buyer_npwp`, `invoices.trx_code`
- `customers.npwp`

Every service and API route accepts the new MY field names and writes them alongside the legacy columns, so the drop is safe whenever it happens.

---

## Project structure

```
app/
├── (marketing)/             # /, /features, /pricing, /blog, /about, /contact, /toko, /toko/[city], /community/[slug], /mitra, /coba-aplikasi
├── (auth)/                  # /login, /register, /forgot-password, /reset-password
├── (onboarding)/setup/      # Business type → products → link ready
├── (public)/order/[slug]/   # Customer order form → /[slug] via rewrite (next.config.ts)
├── (public)/r/[id]/         # Public receipt page
├── (dashboard)/             # orders, products, customers, prep, recap, invoices, community, tax, settings, profil, laporan, pengingat, pembayaran
├── (admin)/                 # Internal admin
├── join/[code]/             # Community invite shortlink
└── api/                     # ~100 routes + 5 cron jobs
    ├── billing/             # Billplz payments + webhook
    ├── invoices/[id]/myinvois-{submit,status,cancel}/  # Pro-plan LHDN submit
    ├── invoices/sst-summary/         # Monthly SST summary (RMCD SST-02 helper)
    ├── tax/summary/                  # Annual revenue + SST + MyInvois stats
    ├── staff/ + orders/[id]/assign/  # Phase 2 staff + assignment
    └── public/order-history/         # Customer past-orders lookup (reorder)

features/{orders,customers,products,billing,recap,receipts,referral,invoices,staff,tax,auth}/
lib/
├── billplz/                 # ACTIVE — types, client, verify
├── myinvois/                # ACTIVE — types, generate-json, client
├── copy/index.ts            # Microcopy library — empty/error/loading/confirm/success/empathy templates + jargon-free labels (per docs/positioning/04)
├── pdf/generate-invoice.ts  # EN + TIN/BRN/SST + MyInvois UUID ref
└── supabase/, voice/, offline/, utils/

config/{plans.ts, categories.ts, category-defaults.ts, site.ts, navigation.ts}
scripts/phase-0/             # MyInvois + Billplz sandbox spikes + merchant interview
supabase/migrations/         # 000 (baseline) + 001–080
middleware.ts                # Legacy-route 301s (pesanan→orders etc. + /baru→/new leaf)
```

Subpath renames: `/orders/new` (was `/pesanan/baru`), `/products/new`, `/invoices/new`, `/community/new`.
Legacy paths: `/pembayaran` (payment result), `/pengingat` (reminders), `/profil`, `/laporan` — kept as-is for now (not in the rename map).

---

## Integrations

### Billplz (payment — ACTIVE, sandbox pending real KYB)

- `lib/billplz/` — zero-SDK adapter: `types.ts`, `client.ts`, `verify.ts`, `index.ts`
- Merchant redirects to Billplz-hosted payment page. No Snap popup, no client SDK.
- Webhook verifies HMAC-SHA256 X-Signature with timing-safe comparison.
- Wired at `/api/billing/payments` (create bill) + `/api/billing/webhook` (state changes → plan activation + referral commission).
- Env: `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE_KEY`, `BILLPLZ_BASE_URL` (optional).

### MyInvois (tax — ACTIVE, awaits LHDN production certification)

- `lib/myinvois/` — UBL 2.1 JSON builder + OAuth client_credentials + submit/status/cancel/reject.
- `features/invoices/services/myinvois-adapter.ts` — bridges DB invoice → MyInvois document (proportional discount allocation, walk-in buyer fallback, >RM 10K rule detection).
- Routes: `/api/invoices/[id]/myinvois-{submit,status,cancel}` — Pro-plan gated, idempotent, 72h cancel window enforced. Submit is **one-tap from UI**, not automatic on paid.
- Supplier state codes via `MY_STATE_CODES` in `lib/myinvois/generate-json.ts`.
- Env: `MYINVOIS_CLIENT_ID`, `MYINVOIS_CLIENT_SECRET`, `MYINVOIS_BASE_URL` (defaults preprod in dev), `MYINVOIS_IDENTITY_BASE`.

### Supabase

- Project ref: `yhwjvdwmwboasehznlfv` (Mumbai region — migrate to Singapore `ap-southeast-1` pre-launch).
- `site_url`: `https://tokoflow.com` · `uri_allow_list`: tokoflow.com + www + localhost:3000 + localhost:3101
- **Google OAuth enabled** (client ID in vault + in Supabase auth config). Consent screen is in **Testing** mode — add beta testers to the Test users list until the app is published.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- No auth users yet · 0 rows across tables · 5 storage buckets (order-images, payment-proofs, product-images, profile-photos, qris-codes) re-created by migrations.

### Gemini Flash Lite (AI)

- Via OpenRouter. Used in `/api/recap/analyze`, `/api/voice/parse`, `/api/image/parse`.
- System prompts rewritten for Malaysian SMB context — Malay + English + Manglish examples, +60 phone formats, Asia/Kuala_Lumpur timezone.
- Env: `OPENROUTER_API_KEY`.

---

## Code patterns

- **Service layer:** `fetch("/api/...")`, return null/[] on error. Zero direct Supabase in UI.
- **API routes:** `getAuthenticatedClient(req)` — dual auth: Bearer (mobile) → cookies (web). Destructure as `{ supabase, user }`.
- **Components:** `"use client"`, `useState`, toast via `sonner`.
- **Customer auto-create:** Upsert on order. Phone match first, then name ilike. Stats auto-synced by trigger.
- **Payment derivation:** `derivePaymentStatus()` — paid_amount vs total.
- **Validation:** Items (name non-empty, price ≥ 0, qty ≥ 1), quota (402), delivery dates, slug, storage.
- **View/edit separation:** `/orders/[id]` read-only (redirects to edit), `/orders/[id]/edit` mutations. `/invoices/[id]` detail, `/invoices/[id]/edit` mutations.
- **Modals:** Bottom-sheet for destructive actions (no `confirm()`).
- **Search:** 300ms debounce on all lists.
- **WA messages:** 8 builders in `lib/utils/wa-messages.ts`, all branded `_Sent via Tokoflow — https://tokoflow.com_`.
- **Slug:** `afterFiles` rewrite `/:slug` → `/order/:slug`. Reserved slugs in `lib/utils/slug.ts` include both EN (orders, invoices, …) and legacy ID slugs (pesanan, faktur, …) so legacy-prefix collisions can't happen.
- **Route rename (MY):** `middleware.ts` 301-redirects every legacy ID prefix (`/pesanan` → `/orders`, etc.) and the `/baru` → `/new` leaf so WhatsApp and bookmark links survive.
- **Stock:** Auto-decrement on order, auto-disable at 0, server-side race prevention.
- **Swipe:** Right = advance status, Left = WA.
- **Realtime:** Supabase on `orders` INSERT (toast + sound) + UPDATE (payment claim toast).
- **Offline:** Network-first + IDB fallback. FIFO sync + localStorage lock (30s TTL).
- **Analytics:** `track(event, properties?)` → `events` table + UTM.
- **Progressive disclosure:** Nav items by totalOrders — 0 → 3 menus, 1+ → Customers, 3+ → Community, 5+ → Prep/Recap, 10+ → Invoices.
- **Smart defaults:** `config/category-defaults.ts` — 28 entries map a `business_category` ID to mode (preorder/dine-in/booking), capacity, sample products, and suggested categories. Drives `/setup` step 1 → 2 transition.
- **Pricing compass:** Traffic light 🟢🟡🔴⚫ in ProductForm (net margin after overhead). Peer benchmark via `/api/benchmark` (gated ≥10 users/cluster).
- **Quiet hours:** `profiles.quiet_hours_start/end` (default 22:00–06:00 MYT). Push suppressed during window.
- **Quota nudge:** two-state only — `"none"` until 50 orders used, then `"exhausted"`. No soft/medium/urgent thresholds, no `"X/50 used"` banners (anti-anxiety, see [`docs/positioning/03-features.md`](./docs/positioning/03-features.md)). `TrialBanner` shows a single quiet line at exhausted; settings page surfaces Pro upgrade as the only resolution path.
- **Tax identity gating:** TIN/BRN/SST inputs in `/settings` only render for Pro merchants OR users who already have tax info entered — free-tier merchants don't see the form (compliance is silent superpower).
- **Microcopy:** import from `lib/copy` for empty states, errors, loading, confirmations, success, and the 7 empathy moments. Adds new copy via this library, not inline.
- **MyInvois submission (Pro):** One-tap from `/invoices/[id]` detail or `/invoices/[id]/edit`. Polls `/myinvois-status` every 5s until terminal (valid / invalid / cancelled / rejected) or 2 min timeout. Stores UUID + longId + validation state on the invoice row. 72h cancel modal with reason capture.
- **SST calculation:** Per-invoice toggle (0% / 6%), seeded from `profile.default_sst_rate`. Not per-product-category (that would require schema extension).
- **Staff assignment:** `AssigneePicker` component in `features/staff/components/`. Owner assigns from `/orders/[id]/edit`. Staff CRUD at `/settings/staff`. Phone+PIN staff login deferred to Phase 4.
- **Customer reorder:** `/api/public/order-history` returns last 5 orders for a phone on a merchant. Storefront surfaces past orders with a Reorder button that prefills the cart.
- **Community join:** Cookie `community_code` → auth callback → upsert member + set community_id + set organizer as referrer.

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
- Voice: conversational English, SMB-friendly. Honest copy — never claim something that isn't shipped.

### SEO
- Title: `%s | Tokoflow`. OG 1200×630. `lang="en"`
- JSON-LD: SoftwareApplication (landing), LocalBusiness (store), Organization (community), FAQPage (pricing, contact)
- noindex: auth, dashboard, admin

---

## Cron jobs (`vercel.json`)

| Job | Schedule (UTC) | MYT | Function |
|---|---|---|---|
| invoice-overdue | 07:00 | 15:00 | Mark overdue invoices |
| morning-brief | 22:00 | 06:00 | Push: today's lineup + cost trend (food cost delta ≥ 5pp) + **Hari Sepi** variant when today's revenue <30% of 7-day avg (with >RM 50/day baseline) |
| engagement | 00:00 | 08:00 | Push: onboarding drip · milestone (10/50/100/500/1000) · monthly recap · **Anniversary** (1y/3y/5y) · **Customer Returns** (3+ orders, drip-deduped) · **Pre-Ramadan** (14d before, hard-coded dates 2027-2030) |
| alerts | 00:00 | 08:00 | Push: stock ≤ 3, capacity ≥ 80%, quota exhausted (single trigger at 50, no pre-exhaustion banner per anti-anxiety rules) |
| tax-reminder | 02:00 on day 10 | 10:00 | Pro merchants with unsubmitted invoices, quiet-hours aware (warm tone, not pressure) |

**Mid-Rush** (client-side, not cron): the dashboard's realtime listener counts INSERTs in a 30-min sliding window and surfaces a one-time supportive toast at 5+ orders, 60-min suppressed via sessionStorage.

---

## Environment variables

```
# App
NEXT_PUBLIC_APP_URL=https://tokoflow.com      # required — logout redirect + billing callback
NEXT_PUBLIC_APP_NAME=Tokoflow
NEXT_PUBLIC_APP_DESCRIPTION=…
NEXT_PUBLIC_APP_SCHEMA=public                 # optional — defaults to public

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yhwjvdwmwboasehznlfv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…

# Billplz (payment)
BILLPLZ_API_KEY=
BILLPLZ_COLLECTION_ID=
BILLPLZ_X_SIGNATURE_KEY=
BILLPLZ_BASE_URL=                             # optional — defaults by NODE_ENV

# MyInvois (e-Invoice, Pro plan)
MYINVOIS_CLIENT_ID=
MYINVOIS_CLIENT_SECRET=
MYINVOIS_BASE_URL=                            # optional — defaults to preprod in dev
MYINVOIS_IDENTITY_BASE=

# AI
OPENROUTER_API_KEY=

# Cron
CRON_SECRET=

# Transactional email (password reset, receipts)
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

Google OAuth client id/secret live inside Supabase auth config — **not** in `.env.local`. Supabase handles the OAuth flow server-side.

---

## Phase 0 gates (before public launch)

Scripts at `scripts/phase-0/`. Gate A criteria — all must pass before public launch:

- [ ] `myinvois-spike.ts` returns `submissionUid` + accepted `uuid` from LHDN preprod
- [ ] `billplz-spike.ts` passes X-Signature round-trip (genuine + tamper tests)
- [ ] Niagawan e-Invoice timeline: ≥ 6 months away
- [ ] ≥ 7 of 10 merchant interviews score LHDN panic ≥ 7/10
- [ ] ≥ 6 of 10 merchants willing to pay RM 20–40/month
- [ ] MDEC Digitalisation Partner application cleared (currently: applied, pending)

Fail any → re-evaluate wedge before more code.

---

## Recent reposition pass (2026-04-27)

"From snap to sold" + anti-anxiety + microcopy library, shipped across 5 commits (10bc895 → 6fa38c3). Highlights:

- **Marketing reposition** — landing, features, pricing, about, contact, mitra, toko, coba-aplikasi rewritten around the new tagline; LHDN demoted from hero to silent superpower
- **Pricing collapsed** — UI shows Free / Pro RM 49 / Business RM 99 only; legacy RM 5/8/13 pack constants `@deprecated` (kept for grandfathered users + API/DB compat)
- **Anti-anxiety sweep** — `BeresCelebration` deleted, `OnboardingChecklist` reframed as suggestions (no X/N count or strikethrough), `TrialBanner` collapsed to one quiet line at exhausted only, `getNudgeLevel` simplified to `"none" \| "exhausted"`
- **Compliance gating** — TIN/BRN/SST inputs in settings now gated to Pro merchants or those with tax info already entered
- **Microcopy library** — `lib/copy/index.ts` with empty/error/loading/confirm/success/empathy templates; wired into 4 list empty states (orders, products, customers, invoices)
- **Empathy moments shipped** — Hari Sepi (morning-brief), Customer Returns + Anniversary + Pre-Ramadan (engagement cron), Mid-Rush (realtime client toast)
- **Cron copy rewrite** — removed comparison shaming ("tidier than 90% of SMBs"), robotic factoids ("Science says"), pressure tone, Indonesian leaks
- **Photo Magic plan** — [`docs/positioning/P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md) scopes the 1-photo onboarding ticket (~8-12 days, Phase 1 deliverable)

---

## Phase 4 — deferred (post-launch)

| Item | Effort | Status |
|---|---|---|
| AI order parsing | ~16h | **Shipped** (voice, image, paste — all 3 in `features/orders/components/`) |
| Peer benchmark | ~24h | **Shipped** (`/api/benchmark` + pricing-compass in ProductForm) |
| Komunitas group-buy finish | ~28h | Tables + pages exist; group-buy pooling + announcement push not built |
| TikTok Shop MY sync | ~40h | Not ported. Lives in CatatOrder commit `f81e083`; needs TS port + schema for Tokoflow |
| Shopee MY sync | ~15h after TikTok | 0% |
| BM localization | ~40h | 0% — i18n scaffold not in place |
| Accounting sync (SQL Account, Bukku, AutoCount) | ~60h | 0% |
| Franchise / multi-outlet (Business tier RM 99) | ~60h | 0% |
| Singapore + Brunei cross-border | ~40h | 0% |

---

## Real-world ops (user action — code can't do)

- [ ] Sdn Bhd registration (~4-8 weeks, nominee director acceptable)
- [ ] Malaysian bank account (prereq for Billplz KYB)
- [ ] Billplz merchant account — upload Sdn Bhd docs
- [ ] MyInvois production certification (post Sdn Bhd verification)
- [ ] MDEC Digitalisation Partner certification (6-8 week lag)
- [x] `tokoflow.com` domain procured + Vercel alias live
- [x] Supabase migrations 001-080 applied to project `yhwjvdwmwboasehznlfv`
- [ ] Supabase region migration Mumbai → Singapore (pre-launch)
- [ ] Populate Billplz / MyInvois / OpenRouter / Gmail env vars in Vercel production (currently placeholder/empty for these)
- [ ] Publish Google OAuth consent screen (currently Testing mode — only test users can sign in)

---

## Known issues (as of 2026-04-24)

- ~~**Vercel auto-deploy is silent.**~~ Resolved 2026-04-27. GitHub App grant + `vercel git disconnect && vercel git connect` flushed the stale link. Pushes to `main` now deploy automatically again.
- **Vercel production env vars** were stored as empty encrypted strings when the project was set up. Sync from `.env.local` → Vercel via the REST API (not the CLI — CLI stdin piping silently stored empties). Some Phase 0 service env vars (`BILLPLZ_*`, `MYINVOIS_*`, `OPENROUTER_API_KEY`, `GMAIL_*`) are still unset in production because we don't have the creds yet.
- **Test-mode Google OAuth.** Only emails added to the Test users list in Google Cloud Console can sign in. Publish the consent screen before private beta.
- **Supabase region** is Mumbai — move to Singapore (`ap-southeast-1`) before public launch for MYT latency.

---

## Credentials

Vault at `~/base/vault/credentials/tokoflow.md`:
- Supabase project ref, anon key, service role key, access token (never in repo, never in .env.example)
- Google OAuth client id + secret (enabled on Supabase auth, not in app env)

---

*Last updated: 2026-04-27 · "From snap to sold" reposition + anti-anxiety + microcopy + 4 new empathy moments shipped · Vercel auto-deploy restored · Launch-blocked on Phase 0 validation + real-world ops.*
