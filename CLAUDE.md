# Tokoflow

> **We handle the receipts. Not the recipes.**
> *"Resi kami urus. Resep kamu."*
> Tokoflow handles mechanical residue (admin, payment matching, invoicing, status updates) invisibly via Background Twin. Customer relationships stay merchant-controlled, amplified by Foreground Assist that suggests but never sends. Pure craft is protected — Tokoflow never enters the kitchen.
> Forked from CatatOrder (ID) · Next.js 16 · React 19 · TypeScript · Supabase · Tailwind 4.

**Domain:** https://tokoflow.com · aliased to production deploy on Vercel
**Target Year 1:** Malaysia, hyperlocal Shah Alam — home F&B mompreneur (Bu Aisyah persona, **PHASE-0-UNVALIDATED**). Wave 2 (Year 2): vertical-first within MY (kosmetik, modest fashion, jasa lokal). Wave 3+: geographic + cross-pattern.
**Status:** Phase 1 + Phase 2 code **complete** · Photo Magic v1 + Repeat Order shipped 2026-05-06 (founder override of synthesis discipline) · Positioning bible v1.2 **locked** (2026-04-28) · 94 migrations applied (092 Phase 0 tracking + 093 Photo Magic columns) · Pre-launch — gated on **Phase 0 adversarial validation** (5 friendly + 5 hostile interviews + manual twin smoke test + AI cost measurement + distribution validation + brand resonance) + Sdn Bhd + Billplz KYB.

> **Strategic compass:** [`docs/positioning/`](./docs/positioning/) is the bible — read [`00-manifesto.md`](./docs/positioning/00-manifesto.md) before any product decision. Every feature must pass **Test 0** (hits one of Three-Tier Reality: Pure Craft / Customer Relationship / Mechanical Residue) + the 5 tests below it.

> **Execution synthesis:** [`docs/SYNTHESIS-2026-05-05.md`](./docs/SYNTHESIS-2026-05-05.md) is the field-applied playbook derived from bible v1.2. Contains: locked decisions (sub-niche, framing arc, distribution thesis), strategic analog mapping (Owner.com + Klaviyo + Substack inheritance), Phase 0 8-week plan with 7 pre-committed triggers (6 kill + 1 rebrand-flag), backup B2B playbook for scenario (c). Refresh after Phase 0 retrospective.

---

## Three-Tier Reality (root product framework)

Hari setiap solo maker terbagi 3, bukan 2. Setiap fitur Tokoflow harus hit one of these tiers (Test 0):

| Tier | What it is | Tokoflow's role | Architecture |
|---|---|---|---|
| **Tier 1 — Pure Craft** | What merchant loves (baking, design, writing) | Protect — never enter | (no surface) |
| **Tier 2 — Customer Relationship** | What merchant often values (Pak Andi loyalty, school moms WA, custom orders) | Amplify with suggestions, never replace | Foreground Assist (suggests, merchant sends) |
| **Tier 3 — Mechanical Residue** | Admin, payment match, invoice, status, repetitive Q&A | Remove invisibly | Background Twin (autonomous) |

> **Internal naming**: "Background Twin", "Foreground Assist", "Three-Tier", "Tier 3" are precision terms for engineering + strategy. **Customer-facing UI must NEVER expose these.** Use "Tokoflow" or first-person *"saya urus"*. See [`04-design-system.md` Internal Architecture Names](./docs/positioning/04-design-system.md).

---

## Wedges (refined 2026-04-28)

1. **The Photo Magic v1 (Phase 1, planned):** foto → AI **extract** inventory + pricing metadata. **Photo itself stays untouched** — kitchen-protection: photo IS part of merchant's craft and brand, we don't regenerate or beautify. See [`P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md).
2. **Real moat (4-dimensional)**: **(a)** unstructured input parsing (WA chat screenshots, voice notes, mixed e-wallets) where competitors require structured forms · **(b)** Bahasa-first conversational UX (Manglish, code-switch BM/EN/Mandarin) · **(c)** compliance silent (gated to Pro+, never visible Free tier) · **(d)** buyer experience (storefront from photo + conversational order flow). AI labor is the underlying enabling shift; the moat is what we build on top.
3. **AI-native (shipped):** paste WA chat → order, voice → order, screenshot → order. Gemini Flash Lite via OpenRouter. MY SMB vocab, +60 phones, Asia/Kuala_Lumpur.
4. **Community data (shipped, density-gated):** peer benchmark live at `/api/benchmark` (≥10 users/cluster gate). Group-buy pooling deferred to Phase 4.
5. **Silent superpower — LHDN MyInvois (demoted to Pro/Business gated):** one-tap submit at `/invoices`. **Not Phase 1 hero.** SST RM 500K threshold means most home F&B mompreneur Year 1 don't hit. Surfaces only when merchant approaches threshold. See [`01-positioning.md`](./docs/positioning/01-positioning.md) for full anti-positioning + refuse list.

## What Tokoflow REFUSES to do (positioning weapon)

Restraint > capability messaging. Tokoflow **never**:
1. DM customer atas namamu (relationship is yours)
2. Set harga produkmu (judgment is yours)
3. Auto-reply review/komplain (voice is yours)
4. Post ke social media (brand is yours)
5. Regenerate/beautify foto produk (craft is yours)
6. Klaim ownership customer (data tetap milikmu)
7. Otomatisasi respon emosional (judgment kamu, draft kami)
8. Gamify dengan streak/badge (anti-anxiety)
9. Jual data kamu (never)
10. Lock kamu di platform (cancel 1-tap, ekspor data full)

Full list in [`00-manifesto.md` What We REFUSE to Do](./docs/positioning/00-manifesto.md#what-we-refuse-to-do-added-2026-04-28).

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

All 92 migrations (000 baseline + 001–091) live on the Tokoflow Supabase project (`yhwjvdwmwboasehznlfv`, Mumbai region — migrate to Singapore pre-launch). Migrations 081–091 are post-bible-v1.2 additions: 081 service-role grants, 082 orders undo window, 083 payment_notifications, 084 drop unique-code constraint, 085 new-order email notify, 086 merchant Billplz keys, 087 order_payments, 088 customer delivery ack, 089 unify money columns to NUMERIC(14,2), 090 JSONB shape CHECKs, 091 standalone FK index on `orders.assigned_staff_id`. Migration tracker `supabase_migrations.schema_migrations` should be re-synced after applying 089–091.

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
- **Day-1 nav:** All core surfaces (Today, Orders, Products, Customers, Recap, Settings) visible from signup. Only Invoices + Tax hide behind the Pro gate. The earlier volume-gated cognitive cut was rolled back — hiding Orders/Customers from new merchants made them feel the product was missing.
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

## Phase 0 gates (revised 2026-05-05 — synthesis aligned)

Phase 0 = 8-week adversarial validation. **No Phase 1 build until Gate 0 passes.** Full plans in [`06-roadmap.md` Phase 0](./docs/positioning/06-roadmap.md#phase-0--validation-first-foundation-aprjul-2026-3-months) (strategic) + [`SYNTHESIS-2026-05-05.md`](./docs/SYNTHESIS-2026-05-05.md) (execution) + [`scripts/phase-0/README.md`](./scripts/phase-0/README.md) (operational).

### Validation milestones

- [ ] **5 friendly + 5 hostile interviews** Shah Alam mompreneur (NOT just observation — hostile q first: "what part of jualan you ENJOY?" then "why might Tokoflow NOT work for you?") + brand resonance test (Tokoflow name 1-10 friction)
- [ ] **Manual Twin smoke test**: Aldi as Background Twin for 1 volunteer merchant for 2 weeks via WA admin (cheap, validates trust transfer architecturally)
- [ ] **AI cost measurement** with production-grade prompts (Background Twin + Foreground Assist) at 50-order/month load
- [ ] **Ariff partnership formal** — kopi 2 jam, decide tier (advisor 1.5% / co-founder 5–10%), sign SAFE/MOU. **No casual mode.**
- [ ] Sdn Bhd registration submitted (SSM)
- [ ] **Distribution validation**: Aldi TikTok + komuniti penetration → ≥300 followers + ≥15 inbound DM cumulative by Week 8 (or scenario c backup B2B activated)
- [ ] **Brand resonance**: friction <4/10 average from 10 interviews → keep Tokoflow; ≥4/10 → trigger rebrand decision

### Spike scripts (still required)

- [ ] `myinvois-spike.ts` returns `submissionUid` + accepted `uuid` from LHDN preprod
- [ ] `billplz-spike.ts` passes X-Signature round-trip (genuine + tamper tests)
- [ ] MDEC Digitalisation Partner application cleared (currently: applied, pending)

### Gate 0 pass criteria (all 7 must hit)

1. ✓ ≥7/10 interviews resonate with Three-Tier framework (mechanical residue distinct from valued relationship + craft)
2. ✓ Smoke test merchant rates manual twin >7/10 helpfulness AND no customer noticed AI tone
3. ✓ AI cost ≤ **RM 25/merchant/month** at 50-order/month projected scale (RM 25-30 = retest Week 6 must clear ≤RM 25)
4. ✓ Ariff formal partnership locked (signed) OR Plan B locked
5. ✓ Sdn Bhd in SSM queue
6. ✓ Distribution: ≥300 followers + ≥15 inbound DM cumulative
7. ✓ Brand decision data-backed (keep <4/10 friction OR rebrand ≥4/10 friction)

### Pre-committed triggers — 7 total (6 kill + 1 rebrand-flag)

> No rationalization when emotion arrives. Aligned with [SYNTHESIS-2026-05-05.md §5](./docs/SYNTHESIS-2026-05-05.md).

1. **AI cost**: ≤RM 25 pass / RM 25-30 warning + retest Week 6 / >RM 30 → kill (Pro RM 49 locked)
2. **<7/10 interviews** resonate Three-Tier (kill); <5/10 = catastrophic
3. Smoke test: customer detects AI tone OR merchant trust degrades OR <7/10 helpfulness → reduce twin scope to Foreground Assist only OR kill
4. Ariff declines + Plan B unproven 4 weeks → kill
5. Sdn Bhd structural block + sole-prop alternative non-viable → kill
6. **Distribution**: <300 followers + <15 inbound DM by Week 8 → kill content-led OR activate scenario (c) backup B2B
7. **Brand friction ≥4/10 average** → trigger rebrand decision Week 7 (NOT kill — flag; bias toward keep due to 3-6 week switching cost)

### Phase 1 Gate (post-validation, end Oct 2026) — "Love" operationally defined

≥4/5 must hit:
- Sean Ellis test: ≥40% answer "very disappointed" without Tokoflow
- DAU consistency: ≥70% daily active over 4 weeks
- Spontaneous referral: ≥1 alpha tells another merchant unprompted
- NPS: ≥8 from all 5 alphas
- Self-reported craft hours saved: ≥3 hours/week median

---

## Recent strategic passes

### 2026-04-28 · Bible v1.2 — Three-Tier Reality + 2-Layer Twin (this session)

8 ultrathink rounds + Steve Jobs lateral framing + devil's advocate red-team + critique-driven refinements. **Strategy locked, no code yet.** All in [`docs/positioning/`](./docs/positioning/) (versioned v1.2):

- **Root problem refined**: "operations ate craft" (sweeping) → **Three-Tier Reality** (Pure Craft / Customer Relationship / Mechanical Residue) — D-013
- **Solution architecture**: monolithic "autonomous twin" → **2-layer twin**: Background Twin (Tier 3, autonomous, invisible) + Foreground Assist (Tier 2, suggests, merchant sends). Trust transfer protected. — D-014
- **New tagline**: **"We handle the receipts. Not the recipes."** (Bahasa: *"Resi kami urus. Resep kamu."*). Kitchen line literal. "Less admin. More making." retired as generic. "From snap to sold" demoted to Photo Magic feature tagline.
- **6th iconic moment**: **The Disappearing Work** — felt absence of Tier 3 work, like Touch ID replacing password. New doc [`08-the-disappearing-work.md`](./docs/positioning/08-the-disappearing-work.md).
- **Photo Magic v1 reframed extraction-only** — AI parses inventory/pricing, **leaves photo untouched**. Kitchen-protection enforced.
- **Real moat sharpened** — 4-dimensional: unstructured input + Bahasa-first conversational + compliance silent + buyer experience. Not "AI labor" generic.
- **Wave 1-5 expansion hypothesis** — Wave 1 mompreneur F&B Shah Alam → Wave 2 vertical-first MY (kosmetik/fashion/jasa) → Wave 3 geographic (KL/Penang/SG) → Wave 4 cross-pattern (creator/freelancer) → Wave 5 global. Bridges mission-wedge altitude gap.
- **Phase 0 expanded** — 5 friendly + 5 hostile interviews + manual twin smoke test + AI cost measurement. 5 pre-committed kill triggers.
- **"Love" operationally defined** — Sean Ellis 40% + DAU 70% + spontaneous referral + NPS 8 + 3hr/week craft saved.
- **Phase 2 reframed** — milestone (50 paying) → underlying questions (Q1 retention >70%, Q2 CAC payback <3mo, Q3 K-factor >0.3).
- **Tax demoted** — LHDN MyInvois moved Phase 1 hero → Pro/Business gated (SST RM 500K threshold reality).
- **"What we refuse to do" list** — 10-item explicit restraint declaration as marketing weapon.
- **Distribution hypothesis** — FB groups (Mommies Daily, Ibu-Ibu Bisnes Online MY), TikTok mompreneur creators, WhatsApp komuniti. Anti-channels: LinkedIn, Twitter/X, paid Google Ads.
- **Lifestyle vs venture-scale acceptance** — RM 100-300K MRR ceiling realistic Year 3-5; venture-scale upside not assumption — D-015.
- **Internal vs customer-facing naming discipline** — "Twin/Background/Foreground/Tier 3" never expose to user — D-016.

Decision logs: D-013, D-014, D-015, D-016, D-017 (9 critique-driven refinements).

### 2026-04-27 · "From snap to sold" + anti-anxiety + microcopy

Shipped across 5 commits (10bc895 → 6fa38c3). **Code complete from this pass:**

- **Marketing reposition** — landing, features, pricing, about, contact, mitra, toko, coba-aplikasi rewritten; LHDN demoted from hero to silent superpower
- **Pricing collapsed** — UI shows Free / Pro RM 49 / Business RM 99 only; legacy pack constants `@deprecated`
- **Anti-anxiety sweep** — `BeresCelebration` deleted, `OnboardingChecklist` reframed as suggestions, `TrialBanner` quiet line at exhausted only, `getNudgeLevel` simplified to `"none" \| "exhausted"`
- **Compliance gating** — TIN/BRN/SST inputs in settings gated to Pro merchants or those with tax info entered
- **Microcopy library** — `lib/copy/index.ts` wired into 4 list empty states
- **Empathy moments shipped** — Hari Sepi, Customer Returns, Anniversary, Pre-Ramadan, Mid-Rush
- **Cron copy rewrite** — removed comparison shaming, robotic factoids, pressure tone, Indonesian leaks
- **Photo Magic plan** — [`P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md) scopes 1-photo onboarding ticket

> **Note on tagline migration** (resolved 2026-05-05): the brand-level tagline "We handle the receipts. Not the recipes." (BM: "Resi kami urus. Resep kamu.") is live on landing/features/pricing/layout metadata. "From snap to sold" and "Less admin. More making." have been retired from marketing copy. "From snap to sold" remains reserved as the Photo Magic onboarding feature-line per bible v1.2.

---

## Positioning Loop — continuous radical search (started 2026-05-01)

> **Mode operasi: CONTINUOUS LOOP.** A 20-cycle adversarial positioning search is wired up to find a positioning that beats v1.2 — radical, not refined. While the loop is running, this section governs cycle behavior.

**What:** 20 cycles rotating through HYPOTHESIZE_RADICAL → RED_TEAM (3 personas: Bu Aisyah / Steve Jobs Maximalist / YC Devil's Advocate) → RESEARCH (competitor + cross-domain analogy) → SYNTHESIZE → LATERAL_JUMP → CONSTRAINT_HARDEN → DELETE_PASS, optimizing 8 dimensions toward all-≥9 convergence.

**Brain:** [`docs/positioning/loop/LOOP_INSTRUCTIONS.md`](./docs/positioning/loop/LOOP_INSTRUCTIONS.md) — full mandate, mode procedures, scoreboard, convergence criteria, forbidden phrases.

**Wrapper:** `scripts/run-positioning-loop.sh` — Layer 3 of the infinite-loop stack. Per-cycle = fresh `claude -p` session, context resets every cycle, MAX_CYCLES=20, CYCLE_TIMEOUT=2400s.

**State (disk = truth):**
- `runs/.loop-counter` — last completed cycle (wrapper-managed)
- `docs/positioning/loop/current-best.md` — leading positioning hypothesis
- `docs/positioning/loop/scoreboard.md` — 8-dim scores + history
- `docs/positioning/loop/CHANGELOG.md` — one line per cycle
- `docs/positioning/loop/{hypotheses,critiques,research,synthesis}/cycle-NNN.md` — per-cycle artifacts
- `docs/positioning/loop/CONVERGED.md` — sentinel (wrapper detects → stops loop)

**Per-cycle rules:**
1. Read `$LOOP_CYCLE` env var → know your cycle number → look up mode in table.
2. Read disk state first (current-best.md, scoreboard.md, last 3 CHANGELOG lines, latest cycle artifact).
3. Execute exactly ONE cycle per the mode procedure in LOOP_INSTRUCTIONS.md. Use ultrathink.
4. Write artifact to correct subdir, append CHANGELOG line, update INDEX/scoreboard.
5. Exit cleanly. Wrapper handles next session.
6. Never run multiple cycles in one session. Never ask the user mid-cycle. Never modify v1.2 archive files (`00-manifesto.md` through `08-the-disappearing-work.md`).

**Recovery from compaction or fresh session mid-loop:**
1. `cat runs/.loop-counter` → last completed cycle. Next = +1 (or read `$LOOP_CYCLE`).
2. Read last 3 lines of `CHANGELOG.md` → know what was just done.
3. Read latest artifact under `loop/{hypotheses,critiques,research,synthesis}/` → know prior context.
4. Resume from the next cycle. Disk is the answer — do not ask the user "where were we?".

**v1.2 baseline scoreboard (cycle 0):** SimpIT 6 / ZeroExt 3 / AInative 5 / JobsUX 5 / RevPot 5 / Magic 4 / 60sDemo 5 / Defense 6 → avg **4.9**. Goal: ≥9 across all 8.

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

*Last updated: 2026-05-05 · Audit pass: cron schedules corrected, money types unified to NUMERIC(14,2) (089), JSONB shape CHECKs (090), FK index gap closed (091), MyInvois demoted off /features into a footnote, deprecated pack pricing removed from /pricing, quiet-hours now enforced in push crons, lib/copy wired into recap surfaces, Indonesian leak ("di bulan", stray "Rp") fixed in MonthlyReport, internal architecture names sanitised from code comments. Bible v1.2 strategy unchanged. Launch-blocked on **Phase 0 adversarial validation** (interviews + smoke test + AI cost measurement) + Sdn Bhd + Billplz KYB. Phase 1 build starts only after Gate 0 passes ~end Jul 2026.*
