# Tokoflow

> **Resi kami urus. Resep kamu.**
>
> Tokoflow handles the mechanical residue (admin, payment matching, invoicing, status updates) invisibly via the Background Twin. Customer relationships stay merchant-controlled, amplified by Foreground Assist that suggests but never sends. Pure craft is protected — Tokoflow never enters the kitchen.

> **🇮🇩 Tokoflow is the Indonesia deployment of the Kedaiflow (Malaysia) codebase.**
> Same multi-country code (Kedaiflow was forked from Tokoflow → Kedaiflow → originally from CatatOrder ID); Tokoflow runs the **`ID`** side of the `country` axis (`lib/country/resolve.ts`). Everything country-coupled — currency **IDR (Rp)**, payment **Midtrans** (QRIS / VA / e-wallet), e-invoice **e-Faktur (DJP/Coretax)**, tax **PPN**, phone **+62**, timezone **WIB** — flows through the merchant's country. The Malaysia path (Billplz / MyInvois / SST / RM) stays in the tree but **dormant**.

**Status:** Code complete + localized for Indonesia · Next.js 16 / React 19 / TypeScript / Tailwind 4 / Supabase · **111 migrations** on the Tokoflow Supabase project (`yhwjvdwmwboasehznlfv`, country default `ID`) · marketing site + dashboard in **Bahasa Indonesia** · `next build` green · pre-launch — gated on a **Midtrans** merchant account + the **e-Faktur/Coretax** integration (see *What's remaining*).

> ⚠️ Much of the *strategy / positioning* prose under [`docs/`](./docs/) (Phase 0, the positioning "bible", personas, Sdn Bhd roadmap) and the older entries in [CLAUDE.md](./CLAUDE.md) still reflect the **Malaysia** market and are pending an Indonesia rewrite. The **product, code, schema, currency, payment, tax, and copy** are localized to Indonesia; the **go-to-market strategy docs are MY-legacy**.

## What it does

A merchant takes one photo of their dagangan. In seconds they have a shop link to share on WhatsApp / IG / TikTok. Customers self-order, pay via **QRIS / transfer / e-wallet (Midtrans)** or scan a static QRIS, and every order lands tidy in the merchant's dashboard. The Background Twin matches incoming bank/e-wallet notifications to open orders autonomously; Foreground Assist drafts replies for the merchant to review and send — never sends on its own. The dashboard runs warm and quiet — no streaks, no anxiety counters. Compliance (**e-Faktur / PPN**) is built-in on the Pro tier as a silent superpower, surfacing only when the merchant approaches the PKP threshold.

## Indonesia localization (the country axis)

`lib/country/resolve.ts` is the single source of truth; `resolveCountry()` defaults to **ID**.

| Dimension | Indonesia (active) | Malaysia (dormant) |
|---|---|---|
| Currency | IDR — `Rp` (no fractional) | MYR — `RM` |
| Locale / timezone | `id-ID` · Asia/Jakarta (WIB) | `en-MY` · Asia/Kuala_Lumpur (MYT) |
| Payment gateway | **Midtrans** (QRIS, VA, GoPay/OVO/DANA/ShopeePay) — `lib/payment/midtrans-adapter.ts` | Billplz — `lib/payment/billplz-adapter.ts` |
| e-Invoice | **e-Faktur / Coretax** — `lib/einvoice/efaktur-adapter.ts` | MyInvois — `lib/myinvois/` |
| Tax | **PPN** (0 / 11 / 12%) · NPWP / NIB / PKP · PKP threshold Rp 4.8 M/yr | SST (0 / 6%) · TIN / BRN |
| Phone | **+62** (`lib/utils/phone.ts`) | +60 |
| Couriers | JNE, J&T, SiCepat, AnterAja, Ninja Xpress, Pos Indonesia, TIKI, Lion Parcel, … (`lib/utils/courier.ts`) | Pos Laju, Ninja Van, … |
| Geo | 38 ID provinces + major cities (migration 111) | 16 MY states + 44 cities (deactivated) |
| Pricing | Gratis / Pro **Rp 99.000** / Business **Rp 199.000** (`pricing_tiers`) | Free / RM 49 / RM 99 |
| Copy | Bahasa Indonesia (marketing + customer flow) | English |

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · shadcn/ui |
| Database | Supabase — project `yhwjvdwmwboasehznlfv` · 111 migrations |
| Auth | Supabase Auth (email + Google OAuth, testing mode) |
| Payment | Static QRIS (zero setup) · Midtrans Snap (QRIS / VA / e-wallet, `lib/payment/`) |
| Tax / e-Invoice | e-Faktur / Coretax (`lib/einvoice/`) — Pro tier, one-tap |
| AI | Gemini Flash via OpenRouter — model id in `lib/ai/model.ts`, prompts in `lib/ai/twin-prompts.ts` (country-keyed; ID variants for voice/image/twin/assist) |
| Deploy | Vercel (`tokoflow` project, auto-deploy on push to `main`) |

## Pricing (IDR)

| Tier | Price | Included |
|---|---|---|
| **Gratis** | Rp 0 | First 50 orders (one-time starter quota, no monthly reset) · core features (shop link, AI parse, recap, customer directory, invoices) |
| **Pro** | **Rp 99.000/bln** | Unlimited orders + voice/photo order parsing + pricing whisper + one-tap e-Faktur + PPN reporting + receivables tracking |
| **Business** | **Rp 199.000/bln** | Pro + multi-staff accounts + order assignment + priority support |

Seeded per-country in the `pricing_tiers` table (migration 096); the dashboard upgrade + `/api/billing/payments` resolve the amount from the merchant's country.

## Payment architecture (Indonesia)

1. **Static QRIS** — merchant uploads their QRIS image (Settings → Profile); customer scans, uploads a payment proof, merchant confirms (AI receipt triage assists). Live, zero setup.
2. **Midtrans Snap** — gateway checkout (QRIS / VA / GoPay / OVO / DANA / ShopeePay), auto-confirm via webhook, funds direct to the merchant. Code is wired (`lib/payment/midtrans-adapter.ts`, selected by the country axis); **needs `MIDTRANS_SERVER_KEY`** from a real Midtrans account.

0% commission from Tokoflow on direct merchant-link orders.

## Getting started (local dev)

```bash
npm install
# .env.local is populated from the vault — see
# /Users/muhamadaldiansyah/base/vault/credentials/tokoflow.md
npm run dev          # http://localhost:3000
```

> If the Settings/marketing pages show stale text after pulling, restart the dev
> server (server components don't always hot-reload): kill `next dev` and re-run.

## Environment variables

```
# App
NEXT_PUBLIC_APP_URL=https://tokoflow.co.id
NEXT_PUBLIC_APP_NAME=Tokoflow
NEXT_PUBLIC_APP_DESCRIPTION=Resi kami urus. Resep kamu.

# Supabase (project yhwjvdwmwboasehznlfv)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=          # CLI / Management API only (migrations)

# Payment — Midtrans (Indonesia). Sandbox key starts SB-Mid-server-, prod Mid-server-
MIDTRANS_SERVER_KEY=
MIDTRANS_SNAP_URL=             # optional, defaults by key prefix
MIDTRANS_API_URL=             # optional

# AI · email · cron
OPENROUTER_API_KEY=
GMAIL_USER=
GMAIL_APP_PASSWORD=
CRON_SECRET=
HERE_API_KEY=                 # optional reverse-geocode; falls back to Nominatim

# Malaysia path (dormant) — leave empty for the ID deployment
BILLPLZ_API_KEY=  BILLPLZ_COLLECTION_ID=  BILLPLZ_X_SIGNATURE_KEY=  BILLPLZ_BASE_URL=
MYINVOIS_CLIENT_ID=  MYINVOIS_CLIENT_SECRET=  MYINVOIS_BASE_URL=  MYINVOIS_IDENTITY_BASE=  MYINVOIS_SECRET_KEY=
```

Google OAuth client id/secret live inside Supabase auth config, not in `.env.local`.

## Database

All migrations live under `supabase/migrations/` (`000` baseline + `001`–`111`) and are applied to the Tokoflow Supabase project **`yhwjvdwmwboasehznlfv`**. Apply via the Supabase Management API (PAT in the vault) or `supabase db push`. Indonesia-specific migrations:

- **110** — country column defaults → `ID` (profiles/customers/invoices/cities/provinces), WIB quiet hours, PPN tax-rate CHECKs (0/6/11/12).
- **111** — Bahasa Indonesia `business_categories` + `product_units` labels, MY geo deactivated, **38 ID provinces + 88 major cities** seeded.

> The Tokoflow Supabase project (`yhwjvdwmwboasehznlfv`) is **separate** from the Kedaiflow project `emcuvtqafisspsefsoiy` (Singapore, the Malaysia deployment) — do not cross-write.

## Project layout

```
app/
├── (marketing)/   # landing, pricing, features, about, contact, blog, store, mitra, coba-aplikasi — Bahasa Indonesia
├── (auth)/        # login, register, forgot/reset-password
├── (onboarding)/  # /setup — Photo Magic 1-photo onboarding
├── (public)/      # /[slug] customer order form (→ /order/[slug]) · /r/[id] receipt · /a/[token] ack
├── (dashboard)/   # orders, products, customers, prep, report, invoices, community, tax, settings (+ staff), profil
├── (admin)/       # internal tooling (phase-0, ai-test, users, …) — still MY-context
└── api/           # ~115 routes incl. twin/payment-match, assist/reply-draft, onboarding/photo-magic, billing, tax
features/          # orders, products, customers, invoices, staff, tax, recap, billing, auth, onboarding
lib/
├── country/       # resolve.ts — the MY|ID axis (defaults ID)
├── payment/       # gateway dispatcher + midtrans-adapter (active) + billplz-adapter (dormant)
├── einvoice/      # efaktur-adapter (active) + myinvois-adapter (dormant)
├── currency/format.ts · utils/{phone,courier,wa-messages}.ts · ai/ · supabase/ · copy/ · pdf/
config/            # plans, site, categories, navigation
supabase/migrations/  # 000 + 001–111
```

## Recent passes

### 2026-06-05/06 · Indonesia localization (Kedaiflow MY → Tokoflow ID)

Replaced the old Tokoflow codebase (Next 15 / JS / marketplace-era) with the Kedaiflow codebase and ran it as Indonesia. Marketplace integrations (Shopee, TikTok Shop) were dropped (archive branch `archive/pre-kedaiflow-id-migration-2026-06-05`). Highlights:

- **Country axis → ID default**; ~10 hardcoded `"MY"` fallbacks flipped; dormant MY path preserved.
- **DB** reset + all 111 migrations re-applied to `yhwjvdwmwboasehznlfv`; migrations 110–111 set ID defaults + seed ID geo/labels.
- **Currency app-wide** → Rp (`lib/utils/format.ts` `formatRupiah`/`formatCurrency` were emitting RM despite the name; fixed) + a 60-file `en-MY`→`id-ID` sweep.
- **Functional layer** → ID: phone input (was rejecting `08xx` numbers), WhatsApp messages, couriers, payment routing (Midtrans), tax labels (PPN/NPWP/NIB/e-Faktur), geocode bounds (was Malaysia-only), Photo-Magic onboarding prompt.
- **Marketing site + tax dashboard + settings** rewritten to Bahasa Indonesia + Indonesia context (UU PDP, DJP/Coretax, Jakarta, UMKM/IKM, Rp pricing, QRIS/Midtrans).
- **Vercel production env** synced (Supabase/OpenRouter/Gmail/CRON/APP_*).

(Pre-migration Malaysia history lives in the git log + the older CLAUDE.md entries.)

## What's remaining

- [ ] **Midtrans account** → set `MIDTRANS_SERVER_KEY` in Vercel (code + UI ready). Decide per-merchant vs platform model.
- [ ] **e-Faktur / Coretax integration** — the invoice e-invoice *submit* flow backend is still MyInvois (MY); the ID adapter exists but the Coretax submit flow + DJP credentials are a dedicated project.
- [ ] **Domain** — point `tokoflow.co.id` DNS to Vercel (APP_URL already set).
- [ ] **Bahasa Indonesia for the rest of the dashboard** — core dashboard UI strings are still English (currency/labels are ID-correct; full BI copy is a follow-up). No i18n scaffold yet.
- [ ] **Strategy/positioning docs + `/admin` tooling** — rewrite from the MY market to Indonesia.
- [ ] Google OAuth consent screen publish (testing mode).

## Documentation

- [CLAUDE.md](./CLAUDE.md) — technical spec (stack, schema, patterns, integrations, env). Top section + the 2026-06 changelog reflect the Indonesia state; deeper strategy sections are MY-legacy.
- [HANDOFF.md](./HANDOFF.md) — status & open work (MY-legacy, pending ID refresh).
- `docs/` — strategic/positioning compass (MY-context, pending Indonesia rewrite).

## License

Private — all rights reserved.
