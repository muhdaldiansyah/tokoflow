# Tokoflow

> **We handle the receipts. Not the recipes.**
> *"Resi kami urus. Resep kamu."*
>
> Tokoflow handles mechanical residue (admin, payment matching, invoicing, status updates) invisibly via Background Twin. Customer relationships stay merchant-controlled, amplified by Foreground Assist that suggests but never sends. Pure craft is protected — Tokoflow never enters the kitchen.

**Status:** Bible **v1.3** (2026-05-19, [D-018](./docs/positioning/07-decisions.md#d-018--marketplace-trajectory--4-stage-roadmap-refuse-6-refined-2026-05-19) marketplace trajectory + Refuse #6 refined). Phase 1 + Phase 2 + Year-2 AI scaffolds code complete · `/store` directory **activated** 2026-05-19 (Stage 1 of 4-stage roadmap) · **109 migrations** on Singapore Supabase · Security hardening + customer order flow UX overhaul shipped 2026-05-28 · QR pay-first receipt gate + AI receipt triage shipped 2026-06-04 · launch-readiness polish sweep 2026-06-04 (14 commits, AI model → Gemini 3.5 Flash — see Recent passes) · Google OAuth wired (testing mode) · production deploy live at https://www.tokoflow.com · pre-launch — gated on Phase 0 8-week adversarial validation (5 friendly + 5 hostile interviews + 14-day smoke test + AI cost measurement + distribution validation + brand resonance + marketplace appetite) + Sdn Bhd + Billplz KYB.

**Strategic compass:** [`docs/positioning/`](./docs/positioning/) — read [`00-manifesto.md`](./docs/positioning/00-manifesto.md) before product decisions. Every feature must pass **Test 0** (hits one of the Three-Tier Reality: Pure Craft / Customer Relationship / Mechanical Residue) + the 5 tests below it.

**Execution playbook:** [`docs/SYNTHESIS-2026-05-05.md`](./docs/SYNTHESIS-2026-05-05.md) — Phase 0 8-week plan, 7 pre-committed triggers (6 kill + 1 rebrand-flag), strategic analog mapping (Owner.com + Klaviyo + Substack inheritance), backup B2B playbook for scenario (c).

**Company profile:** [`docs/COMPANY-PROFILE.md`](./docs/COMPANY-PROFILE.md) — the comprehensive end-to-end overview in English (problem → mission → product + merchant/customer journeys → payment architecture → pricing → moat → tech → roadmap → status), every feature marked Live / Planned / Deferred. The shareable, non-engineering description of Tokoflow.

**Target Year 1:** Malaysia — two confirmed segments: **(A) IKS manufacturer / semi-formal SME** (credibility-first, validated by first organic user AmeenAleem, Kedah — called Tokoflow "our own company website") + **(B) mompreneur / home-based seller, Shah Alam** (order-chaos-first, Bu Aisyah persona, **PHASE-0-UNVALIDATED**). Phase 0 interview scope expanded to include IKS manufacturers, not only F&B mompreneurs. Wave 2 (Year 2): vertical-first within MY (kosmetik, modest fashion, jasa lokal). Wave 3+: geographic + cross-pattern.

**Codebase:** ~50K LOC · ~115 API routes · 5 cron jobs · **0% commission on direct merchant-link orders** (any future marketplace-driven discovery is opt-in per [D-018](./docs/positioning/07-decisions.md#d-018--marketplace-trajectory--4-stage-roadmap-refuse-6-refined-2026-05-19) Stage 3) · merchants own their customers.

## What it does

A merchant takes one photo of their kitchen, counter, or dagangan. In seconds they have a shop link they can share to WhatsApp / IG / TikTok. Customers self-order, DuitNow QR settles payment, every order lands tidy in the merchant's dashboard. Background Twin matches incoming bank notifications to open orders autonomously. Foreground Assist drafts replies for the merchant to review and send — never sends on its own. The dashboard runs warm and quiet — no streaks, no anxiety counters, no "X/50 used" banners. Compliance (LHDN MyInvois e-Invoice) is *built-in* on the Pro tier as a silent superpower, not the pitch.

## The Three-Tier Reality (root product framework)

Setiap fitur Tokoflow harus hit one of these tiers (Test 0):

| Tier | What it is | Tokoflow's role | Architecture |
|---|---|---|---|
| **Tier 1 — Pure Craft** | What merchant loves (baking, design, writing) | Protect — never enter | (no surface) |
| **Tier 2 — Customer Relationship** | Loyalty, custom orders, school-mom WA threads | Amplify with suggestions, never replace | **Foreground Assist** — `/api/assist/reply-draft` (drafts only) |
| **Tier 3 — Mechanical Residue** | Admin, payment matching, invoicing, status updates | Remove invisibly | **Background Twin** — `/api/twin/payment-match` (autonomous) |

> "Background Twin", "Foreground Assist", "Tier 3" are precision terms for engineering + strategy. **Customer-facing UI never exposes these** — see internal-naming rule in [`docs/positioning/04-design-system.md`](./docs/positioning/04-design-system.md).

## The four wedges

1. **Photo Magic v1** *(shipped 2026-05-06 — see [`P4-photo-magic-plan.md`](./docs/positioning/P4-photo-magic-plan.md))*: one photo → toko muncul. AI extracts inventory + pricing metadata; **photo itself stays untouched** (kitchen-protection: foto IS part of merchant's craft).
2. **AI-native** *(shipped)*: paste WhatsApp chat → order, voice → order, screenshot → order. Plus Background Twin payment matcher + Foreground Assist reply drafter (Year-2 scaffolds shipped 2026-05-06). Gemini 3.5 Flash via OpenRouter (model id centralized in `lib/ai/model.ts` with a fallback chain). MY SMB vocab, +60 phones, Asia/Kuala_Lumpur.
3. **Community data** *(shipped, density-gated)*: peer benchmark live at `/api/benchmark` (≥10 users/cluster gate). Group-buy pooling deferred to Phase 4.
4. **Silent superpower — LHDN MyInvois** *(shipped, demoted to Pro/Business tier)*: one-tap submit at `/invoices`. Not the pitch — most home F&B mompreneur Year 1 don't hit the SST RM 500K threshold. Surfaces only when relevant.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · shadcn/ui |
| Database | Supabase (Singapore region · `ap-southeast-1`) · 109 migrations |
| Auth | Supabase Auth (email + Google OAuth in testing mode) |
| Payment | Static DuitNow QR (zero setup, live) · Billplz FPX/DuitNow QR (`lib/billplz/`, live) · ToyyibPay FPX/TNG/ShopeePay/GrabPay (planned next — IC-only registration) · Sub-merchant model post-Sdn Bhd (zero merchant setup, direct bank routing) |
| Tax / e-Invoice | LHDN MyInvois UBL 2.1 JSON (`lib/myinvois/`) + 72h cancel window |
| AI | Gemini 3.5 Flash via OpenRouter — model id centralized in `lib/ai/model.ts` (fallback chain), prompts in `lib/ai/twin-prompts.ts` (Background Twin + Foreground Assist) |
| Microcopy | `lib/copy/` — voice canon templates per [`docs/positioning/04-design-system.md`](./docs/positioning/04-design-system.md) |
| Deploy | Vercel (auto-deploy on push to `main`) |

## Pricing (MYR)

Three tiers per [`docs/positioning/05-pricing.md`](./docs/positioning/05-pricing.md) (D-008):

| Tier | Price | Included |
|---|---|---|
| **Free** | RM 0/mo | First 50 orders free — one-time starter quota, no monthly reset (migration 104) · all core features (store link, AI parse, recap, customer directory, basic invoices) |
| **Pro** | **RM 49/mo** | Unlimited orders + voice/photo order parsing + pricing whisper + one-tap LHDN MyInvois submit + SST 0/6% reporting + receivables tracking |
| **Business** | RM 99/mo | Pro + multi-staff (2 included, +RM 15/extra) + advanced (still dignifying) analytics + priority support |

The legacy RM 5 / 8 / 13 quota top-up packs are `@deprecated` in `config/plans.ts` — kept for API + DB compat for any grandfathered users; not surfaced in current UI.

## Payment architecture (decided 2026-05-22)

Smooth payment has four levels. Strategy locked after deep analysis of Malaysian payment landscape vs Phase 0 merchant persona.

| Level | What happens | Merchant setup | When |
|---|---|---|---|
| **1 — Static QR** | Customer scans DuitNow QR, manual verify | Upload QR image | **Live now** |
| **2 — Billplz** | FPX checkout in-browser, auto-confirm via webhook | Billplz account (needs business reg) | **Live now** |
| **3 — ToyyibPay** | FPX + TNG + ShopeePay + GrabPay + Boost, auto-confirm | IC-only claim **unverified** — check toyyibpay.com/register | **Pending verification** |
| **4 — Sub-merchant** | Zero merchant setup — enter bank account number only, Tokoflow routes payment directly | Bank account number only | **Post-Sdn Bhd (target)** |

**ToyyibPay status:** Prior note said IC-only, but internal research (`docs/malaysia-market/05-pembayaran.md`) lists "MY biz required". Verify before building. If IC-only confirmed → 2-3 day bridge implementation. If Sdn Bhd required → skip and go straight to Level 4.

**Level 4 is the correct long-term architecture:** Tokoflow registers as marketplace operator on **CHIP (chip-in.asia)** — modern API, BNM-licensed, fastest onboarding (~1 day), no setup fee. Merchant enters bank account number only. Customer pays → gateway routes funds directly to merchant's bank — Tokoflow never holds funds, no MSB license risk. Enables marketplace commission split for D-018 Stage 3+ (direct orders 0%, marketplace-attributed 2-3%). Full incorporation sequence: [`docs/ops/sdn-bhd-roadmap.md`](./docs/ops/sdn-bhd-roadmap.md).

## Recent passes

### 2026-06-04 · Launch-readiness polish sweep (14 commits)

A per-area pre-launch tidy across payment, shipment, AI, onboarding, invoicing, and marketing. Commits `ec1172e` → `7295e55`.

- **QR / order flow.** Reject-back-to-"Menunggu bayar" wired into the live edit page (`OrderForm`) with a WhatsApp re-pay draft; the dead `OrderDetail` component deleted. The `awaiting_payment` ghost-order gate (migration 109) extended from `/api/orders` to **every merchant aggregate read** — prep/production, today's lineup, reconcile, credit-readiness, the full recap/report family, tax, summary, by-customer, `customers/[id]`, delivery-counts, community stats, and the morning-brief / alerts / engagement crons (37 filters across 21 files). `upload-proof` now sends a "receipt re-uploaded" email (not a 2nd "new order") after a reject, and the per-order proof cap counts only payment-proof URLs.
- **Shipment.** Receipt page shows an "On the way" card for shipped orders even without a tracking number (own rider / Lalamove / Grab). Courier tracking links key off the merchant's selected courier (fixes GDEX numerics that read as DHL) + GDEX added. Delivery to an **unpriced zone is blocked** (Switch-to-pickup / message-seller path) instead of silently charging RM 0 — a blank rate means "not served", an explicit `0` means "free".
- **AI.** Model id centralized in `lib/ai/model.ts`, passed as the OpenRouter `models` fallback array across all 6 AI features; primary moved off the unstable `-preview` to **`google/gemini-3.5-flash`** with `google/gemini-2.5-flash` fallback. Phase-0 cost script re-measured at the new model + previously-missing vision scenarios → **RM 2.65/merchant/month** (PASS_AMPLE, well under the ≤RM 25 gate).
- **Referral hidden** behind `REFERRAL_ENABLED` (footer, `/mitra`, register banner, settings card, orders CTA) — the commission calc is deferred (wrong amount + RM 0 on annual).
- **Onboarding.** Setup wizard + `PhotoMagicEntry` migrated off the legacy `#1a4d35` to the `warm-green` token; leftover Indonesian strings translated to English.
- **Invoicing / tax.** SST computed to **2 decimals (sen)** in both write paths + the form — was whole-ringgit (an IDR-port leftover) and didn't match the per-line MyInvois calc. `faktur` → `invoices`; `pajak_viewed` → `tax_viewed`. *(8% service tax / goods sales-tax options deferred — they touch the MyInvois tax-type stack.)*
- **Marketing honesty.** Removed claims that aren't shipped: AI "generates beautiful product photos" (onboarding extracts; the photo stays untouched — Refuse #5), "voice setup", a "Voice Ask" Q&A over your data (voice only parses orders), and "weekly stories" (only daily + monthly recaps ship). Features + pricing aligned to reality across all 21 marketing pages.

### 2026-06-04 · QR pay-first receipt gate + AI receipt triage + payment-flow UX

Store-link DuitNow QR orders now gate on a payment receipt before they reach the merchant, and the merchant gets an AI assist to verify it. Commits `0264b2c` → `4b25b0d`.

- **Receipt-gated QR orders.** Migration 109 adds `orders.awaiting_payment`. A store-link order placed via DuitNow QR is created `awaiting_payment = true` and hidden from every active merchant view (orders list, packing, today counts) until the customer uploads a receipt — `/api/public/orders/[id]/upload-proof` then flips it false, the order appears, and the merchant gets the (now-deferred) new-order email. A **"Menunggu bayar"** chip on `/orders` surfaces the awaiting bucket so reserved stock is never invisibly stuck. Non-QR orders (preorder pay-later, Billplz, langganan) are unaffected.
- **QR success page rebuilt** (`SuccessActions.tsx`). Three numbered steps — ① Pay with DuitNow QR (+ explicit "open your bank app → scan from gallery → pay" microcopy the old flow omitted) → ② Upload payment receipt (required, button gated) → ③ Payment done. The "Save receipt / View status" shortcut is hidden until payment is confirmed (customers can't skip to status without paying); the post-payment state was de-duplicated (single "View order status"; the QR-flow header moved into `SuccessActions` so it reflects the live paid state instead of a stale "pay now"). Recolored from amber/orange to the warm-green brand.
- **AI receipt triage** (advisory). `POST /api/orders/[id]/verify-proof-ai` reads the uploaded receipt with the vision model (reusing the `image/parse` pattern), extracts amount / status / date / recipient, and compares them to the order **deterministically in code** (the model only extracts; code judges). The reusable `ProofAiCheck` component renders a "Check receipt with AI" button + verdict chips in the order edit page's Payment Proof section. NOT a fraud guarantee — a screenshot can be forged, so the merchant still sets the payment status; it is triage that catches wrong-amount / old-screenshot / failed-status cases. On-demand to bound AI cost.
- **Working tree recovered.** The local checkout had been clobbered by a stray `create-next-app` skeleton (a macOS Trash restore overwrote `app/` routes + `package.json`); restored from HEAD — production was never affected.

Resolved (this pass): **reject-back-to-"Menunggu bayar" is now wired into the live edit page** (`OrderForm`). A "Reject receipt" action — gated to unpaid store-link (`order_link`) orders that have a customer-uploaded receipt — opens a confirm modal, POSTs `/api/orders/[id]/reject-payment` (sets `awaiting_payment = true`, clears the claim so the order leaves the active list), and offers a WhatsApp draft asking the customer to pay again (Tokoflow drafts, merchant sends). A fresh customer upload reveals the order again, closing the loop. The dead `OrderDetail` component (841 lines, imported nowhere since `/orders/[id]` redirects to `/edit`) was **deleted** — the edit page is now the single verification surface (customer receipt + AI check + payment-status toggle + reject). Optional follow-up: rejection is not yet recorded in `order_status_logs`, so the merchant's history timeline doesn't show a "receipt rejected" entry, and after a page refresh there's no "already rejected" marker (the order still sits in the Menunggu bayar bucket as the signal).

### 2026-05-23 · Marketing refresh to English + MECE problem tree + Master Brand Strategy v1.0

- **Landing page fully translated to English.** All remaining Malay text removed from `app/(marketing)/page.tsx` (BM echo line in hero deleted; 3-card `entryPaths` headings/bodies/CTAs translated; Problem Selector + Calculator section titles translated) and `MarketplaceCostCalculator.tsx` (all labels, dynamic strings, and CTA button). Commit `9fae7ec`.
- **About page repositioned** to owned-commerce thesis v0.3. Mission reframed from "democratize selling" to "own your commerce channel, not just a listing on someone else's platform". `targetUsers` updated — IKS & small manufacturers, Health & wellness, Independent retailers added; generic entries removed.
- **3-card problem selector shipped.** Three self-selection cards on the landing page: (1) serious product but digital channel still WhatsApp — IKS/credibility angle; (2) WhatsApp order chaos — mompreneur angle; (3) platform cost unclear — marketplace-heavy seller angle. Card 3 anchors to `#calculator`.
- **Marketplace Cost Calculator shipped.** `MarketplaceCostCalculator.tsx` — interactive client component: avg order value × orders/month × effective platform cost % → estimated monthly savings vs Tokoflow RM 49. Break-even order count displayed. CTA button renders only when saving > 0.
- **MECE problem tree written.** `docs/MECE-PROBLEM-TREE.md` — causal problem tree in 4 layers: Layer 1 Strategic (channel control, customer relationship, effective platform cost, credibility) → Layer 2 Conversion (reorder friction, order capture) → Layer 3 Operations (operations control, payment reconciliation) → Layer 4 Barrier (implementation barrier). Demand sequencing matrix (already felt / partially felt / needs surfacing). Segment playbooks for IKS vs mompreneur. 3-level messaging hierarchy. Locked as basis for copy, demo scripts, and pitch.
- **Master Brand Strategy v1.0 drafted (conversation artifact).** Positioning refined: *"Tokoflow adalah owned-commerce layer untuk bisnes independen Malaysia yang sudah punya demand, tapi belum punya mesin jualan sendiri."* Brand essence (internal): **Kontrol**. Brand essence (external): *"Bisnes anda. Laman web anda. Customer anda."* Language discipline: "bisnes independen" for positioning strategy; "bisnes anda" for conversion copy. Logo direction: **K-flow monogram** — rounded letter K formed from commerce flow lines, lowercase wordmark `tokoflow`, one dominant metaphor, must read as K at favicon/icon size. Color decision pending: teal + deep navy (new) vs warm-green (existing) — migration cost acknowledged. Font: Satoshi or Manrope (Plus Jakarta Sans dropped). Avoid: food bowl, literal shop/awning, receipt, delivery pin, AI sparkle. Tone: modern Malay-English commerce language.
- **First organic IKS user signal.** AmeenAleem (IKS manufacturer, Kedah) signed up organically and called Tokoflow "our own company website" — validating the IKS credibility angle independent of the mompreneur hypothesis. Confirms two-segment picture: IKS = credibility-first, mompreneur = order-chaos-first.

### 2026-05-20 · Store mode 2D + QoL improvements + 5 bug fixes

Commits `6af0c1f`, `97a8323`, `3596ad5`.

- **Two-dimension store mode (Timing × Fulfillment).** Migrations 101–102. Settings UI redesigned from binary Pre-order/Walk-in toggle into TIMING radio (Scheduled / On-demand) × FULFILLMENT conditional checkboxes (Scheduled → Delivery + Pickup; On-demand → Pickup + Dine-in). Switching timing auto-clears incompatible fulfillment. Public order form: shows fulfillment picker when merchant enables both options; delivery address field conditional on selection.
- **Order status timeline.** `order_status_logs` table (migration 101) tracks every status change — who, when, from→to, with `changed_by_name` snapshot. `StatusTimeline` component (dot-line, newest-first) rendered inside the order edit form. Fire-and-forget insert pattern.
- **Recap → Report rename.** `/recap` URL → `/report`; sidebar label updated; `middleware.ts` 301-redirects `/recap` + `/rekap` → `/report` so old WA links survive.
- **Invoices opened to all users.** Removed `requiresBisnis` gate from navigation — all merchants see Invoices in sidebar.
- **"New order" button.** Was "Log order" — renamed on orders list + today view.
- **Invoice product grid.** Tap-to-add catalog items directly in new-invoice form.
- **5 bug fixes:** (1) discount now appears in WA messages; (2) transfer amount wrong → now uses `order.total` (unique_code mechanism deprecated for MY); (3) delivery address missing in order form → corrected delivery_enabled default for preorder merchants; (4) order history by phone removed from storefront (privacy: phone numbers get reused); (5) payment screenshot upload added to QR receipt page (`/api/public/orders/[id]/upload-proof`, gallery picker, 5 MB cap).

### 2026-05-19 · Bible v1.3 + Stage 1 marketplace activation + Phase 0 launch readiness

Three-commit sweep landing the marketplace trajectory founder discussion surfaced 2026-05-19. Commits `baa347f`, `01286cf`, `1265c4f`, `a9f7a9d`.

- **Bible v1.3 promoted.** [D-018 marketplace trajectory](./docs/positioning/07-decisions.md#d-018--marketplace-trajectory--4-stage-roadmap-refuse-6-refined-2026-05-19) codifies a 4-stage roadmap (beachhead → soft directory → light marketplace → full marketplace) over 3-5 years. **Refuse #6 refined** — direct-axis stays 0% commission / merchant-owned; discovery-axis gets platform identity at Stage 3+ with 2-3% commission on marketplace-attributed orders. Two-track economics wired via the `orders.referral_source` column that migration 060 quietly anticipated. Companion strategic doc [`09-marketplace-trajectory.md`](./docs/positioning/09-marketplace-trajectory.md) maps Tokoflow against successful tool-to-marketplace analogs (Toast, Shopify, Square, Substack, Etsy) and the MY marketplace graveyard (PgMall, PrestoMall, 11street MY). v1.2 archive (`00-manifesto.md` → `08-the-disappearing-work.md`) preserved unchanged.
- **Stage 1 directory activated.** `next.config.ts` redirect dropped; `/store` and `/store/[citySlug]` now serve. Renamed `/toko` → `/store` for English-UI consistency (commit `01286cf`) with permanent 301 from `/toko/*` so any in-flight shared link survives.
- **Shipment tracking shipped.** Migration 098 adds `delivery_address`, `tracking_number`, `courier_name` to orders. `lib/utils/courier.ts` auto-detects Pos Laju, J&T, Ninja Van, Skynet, DHL from tracking-number prefix and renders clickable links to each carrier's portal. Address + tracking flow through receipt, ack page, OrderDetail, and the `buildOrderWithStatus` WA template. Honors migration 088's "destination event only, no courier-as-entity" philosophy.
- **Directory polish.** `/store` hero gained a tagline + city-chip strip; `/store/[citySlug]` now validates slug against the cities table — invalid slugs 404, valid empty cities render a "{City} is open for sellers" CTA instead of dead-ending on `notFound()`. Settings UI shows a live `/store/[city]` link to listed merchants (and a nudge to fill city + category if blank). OnboardingChecklist on `/orders` surfaces "Complete profile to appear on directory" once the merchant has products. Marketing nav gained a "Browse" link; landing hero gained a soft "browse local sellers" secondary CTA.
- **Phase 0 interview script §8.** Five marketplace appetite questions added with decision thresholds tied to Stage 2/3 rollout (Q2 ≥7/10 → marketplace planning, Q3 ≥7/10 → build Model D magic link).
- **Privacy + Terms refreshed.** Privacy gains explicit directory-listing disclosure (exactly what is public vs private) and a section on receipt/ack token URLs being unguessable + not indexed. Terms gain §5 codifying the 0%-direct contract and the opt-in nature of any future marketplace commission. Both dated 2026-05-19.
- **robots.txt hardened.** Disallow list expanded from 2 paths to 23 — covers auth pages, dashboard, admin, token URLs (`/r/`, `/a/`), and `/setup`. `/store` and `/store/[city]` stay explicitly indexable.
- **Ariff Danial UX feedback addressed** (commit `fe71971`). The post-status-change WA popup got `subHeader: "Status updated to X — notify customer?"` + `secondaryLabel: "Skip"` instead of "Cancel" (Cancel misread as "undo the status change"). Added inline "Send status update on WhatsApp" link under the status pills so the merchant doesn't have to scroll to the top WA dropdown. Ten Indonesian strings ("Kirim", "Kirim Struk", "Tanpa Nomor", "Status diubah ke X" toast in OrderDetail + SwipeConfirmModal, etc.) translated to English; the customer-facing payment-reminder WA template rewritten end-to-end.

### 2026-05-18 · Tokoflow → Tokoflow rebrand + Singapore Supabase re-provision

Codebase ported into the dedicated `tokoflow` GitHub repo (commit `cc7be85`). 943 string occurrences of `tokoflow`/`Tokoflow`/`TOKOFLOW` replaced across 130 files (`tokoflow.com` domains, `com.tokoflow.app` bundle IDs, and intentional `tokoflow.co.id` Indonesian-region refs preserved). 842 files / ~166K LOC. Fresh Supabase project provisioned in Singapore (`emcuvtqafisspsefsoiy`, `ap-southeast-1`); all 97 migrations applied cleanly via `supabase db push`. Migration 095 bug fixed in-flight (`business_categories.slug` and `product_units.name` don't exist — fixed to `id` and `label`). Old Tokoflow Supabase left dormant (fresh-start decision, no data migration). Google OAuth client recreated in the `tokoflow` Google Cloud project. Production deploy verified at `https://www.tokoflow.com` (200). 8 of 14 Vercel production env vars live; the CLI stdin-piping silent-empty bug was confirmed and the workflow shifted to the Vercel REST API.

### 2026-05-06 · Overnight build — Phase 0 enabling infra + Year-2 scaffolds + audit pass

Single commit `6f4d988` on main. 26 features + 11 audit-fix bugs. Full diary in [`docs/CHANGES-2026-05-06.md`](./docs/CHANGES-2026-05-06.md). Highlights:

- **Phase 0 admin tooling** — `/admin/phase-0` dashboard (12 sub-metrics → 7 SYNTHESIS triggers) + interviews/distribution/smoke-test entry forms + Markdown retrospective export with auto-decision (KILL/PASS/PARTIAL/PENDING).
- **Background Twin** — `/api/twin/payment-match` autonomous payment matcher, ESCALATE on <80% confidence.
- **Foreground Assist** — `/api/assist/reply-draft` draft-only reply suggestions; response always carries reminder *"Tokoflow drafts. You send. Customer relationship stays with you."*
- **AI test console** — `/admin/ai-test` for prompt calibration with sample DuitNow notif + WA history.
- **Photo Magic v1** — `PhotoMagicEntry` (camera capture + canvas resize) + `/api/onboarding/photo-magic/persist` (atomic INSERT-then-DELETE).
- **Repeat Order** — `/api/customers/[id]/reorder` per Klaviyo customer-ownership inheritance.
- **Migrations 089–093 live** — money-type unification, jsonb shape constraints, FK indexes, phase_0_* tracking tables, photo_magic columns. All applied to Supabase via Management API.
- **AI prompts source-of-truth in `lib/ai/twin-prompts.ts`** with `callTwinAI` helper (20s AbortController timeout, OpenRouter rankings, AI usage propagation).
- **Audit fixes** — callTwinAI timeout, Phase 0 export decision logic, OrderForm double-decode, dead `"founder"` role check, midRush restraint violation, Phase 0 entry-form network errors, PhotoMagicEntry shape guard, prompt sync.

### 2026-04-28 · Bible v1.2 lock — Three-Tier Reality + 2-Layer Twin

Strategic-only pass (no code). Root problem refined from "operations ate craft" → Three-Tier Reality. Solution architecture refined from monolithic twin → 2-layer twin (Background autonomous + Foreground suggest-only). New tagline locked: "We handle the receipts. Not the recipes." Full record in [`docs/positioning/`](./docs/positioning/) and decision log D-013/D-014/D-015/D-016/D-017.

### 2026-04-27 · "From snap to sold" marketing reposition + anti-anxiety sweep

Five commits (`10bc895` → `6fa38c3`). Anti-anxiety: removed BeresCelebration, reframed OnboardingChecklist, simplified `getNudgeLevel` to two states. Compliance gating on TIN/BRN/SST inputs. Microcopy library at `lib/copy/index.ts`. 7 empathy moments wired (Hari Sepi, Customer Returns, Anniversary, Pre-Ramadan, Mid-Rush, etc.).

Full history in `docs/positioning/07-decisions.md` and the commit log.

## What's remaining

### Phase 0 validation gates (8-week adversarial validation)

Tools to run Phase 0 are live (`/admin/phase-0` + AI cost script + smoke-test diary). What still needs to actually happen:

- [ ] **5 friendly + 5 hostile interviews** Shah Alam mompreneur — log via `/admin/phase-0/interviews`
- [ ] **Manual Twin smoke test** — Aldi as Background Twin for 1 volunteer merchant for 14 days; daily log via `/admin/phase-0/smoke-test`
- [ ] **AI cost measurement** at 50-order/month load — run `npx tsx scripts/phase-0/ai-cost/measure.ts --full` (target: ≤RM 25/merchant/month; >RM 30 is kill trigger)
- [ ] **Distribution validation** — Aldi TikTok + komuniti penetration → ≥300 followers + ≥15 inbound DM cumulative by Week 8 (or activate scenario c backup B2B); log weekly via `/admin/phase-0/distribution`
- [ ] **Brand resonance** — friction <4/10 average from 10 interviews → keep Tokoflow; ≥4/10 → trigger rebrand decision
- [ ] **Ariff partnership formal** — kopi 2 jam, decide tier (advisor 1.5% / co-founder 5–10%), sign SAFE/MOU
- [ ] LHDN MyInvois preprod spike returns a valid `submissionUid` + `uuid`
- [ ] Billplz sandbox X-Signature round-trip passes (genuine + tamper tests)
- [ ] MDEC MD Status application submitted + cleared (not yet applied)

If any kill trigger fires → written go/no-go memo within 7 days + formal D-XXX entry in `docs/positioning/07-decisions.md`. No rationalization when emotion arrives.

### Real-world ops (your action)

**MDEC MD Status** (apply at mdec.com.my — not yet applied; enables RM 1K vs RM 500K paid-up for Sdn Bhd) → **Sdn Bhd** registration via company secretary → **Malaysian bank account** (Maybank/CIMB Biz) → **CHIP marketplace operator** application (Level 4 target, apply immediately post-Sdn Bhd) + **Billplz merchant KYB** in parallel (Level 2 bridge) → **ToyyibPay** verify IC-only claim first, implement only if confirmed → **MyInvois production certification** (post-Sdn Bhd) → populate Billplz + MyInvois env vars in Vercel production (Supabase + OpenRouter + Gmail already live) → publish Google OAuth consent screen. Full sequence: [`docs/ops/sdn-bhd-roadmap.md`](./docs/ops/sdn-bhd-roadmap.md).

### Phase 4 — post-launch growth

Komunitas group-buy finish (~28h) · TikTok Shop MY sync (~40h) · Shopee MY sync (~15h) · BM localization full (~40h) · Accounting sync (SQL Account / Bukku / AutoCount, ~60h) · Franchise / multi-outlet mode (~60h) · Singapore + Brunei cross-border (~40h).

## Getting started (local dev)

```bash
npm install
# Populate .env.local from the vault — see /Users/muhamadaldiansyah/base/vault/credentials/tokoflow.md
# (Supabase URL + anon/service keys, OpenRouter, Gmail, optional Billplz + MyInvois once issued.)
npm run dev                           # http://localhost:3000
```

**Phase 0 sandbox spikes** (before going live):

```bash
cp scripts/phase-0/.env.phase-0.example scripts/phase-0/.env.phase-0
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/myinvois-spike.ts
npx tsx --env-file=scripts/phase-0/.env.phase-0 scripts/phase-0/billplz-spike.ts
```

**Applying migrations to a fresh Supabase project**:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_…
supabase link --project-ref <your-ref>
supabase db push --linked --yes
```

## Project layout

```
app/
├── (marketing)/      # landing, pricing, features, about, contact, blog, toko, mitra, coba-aplikasi, community/[slug]
├── (auth)/           # /login, /register, /forgot-password, /reset-password
├── (onboarding)/     # /setup — Photo Magic banner above step 1 (1-photo onboarding entry)
├── (public)/         # /[slug] customer order form (rewrites to /order/[slug]) · /r/[id] receipt
├── (dashboard)/      # orders, products, customers (with Repeat button), prep, report (was recap — 301 redirect in middleware), invoices, community, tax, settings (+ staff), profil, laporan, pengingat, pembayaran
├── (admin)/          # phase-0 (dashboard + interviews + distribution + smoke-test), ai-test, users, registrations, lookup, mitra, analytics
└── api/              # ~115 routes — including:
                      #   /twin/payment-match (Background Twin)
                      #   /assist/reply-draft (Foreground Assist — drafts only)
                      #   /orders/[id]/status + /orders/bulk/status (+ status log insert)
                      #   /public/orders/[id]/upload-proof (customer payment screenshot)
                      #   /admin/phase-0/{interviews,distribution,smoke-test,export}
                      #   /onboarding/photo-magic + /persist
                      #   /customers/[id]/reorder
                      #   /invoices/[id]/myinvois-{submit,status,cancel}, /tax/summary, etc.

features/             # orders, products, customers, invoices, staff, tax, recap, referral, auth, onboarding (PhotoMagicEntry)
lib/
├── ai/twin-prompts.ts  # production prompts (PAYMENT_MATCH, CUSTOMER_MEMORY, REPLY_DRAFT, PATTERN_DETECTION) + callTwinAI helper (20s timeout, AI usage propagation)
├── billplz/          # zero-SDK adapter
├── myinvois/         # UBL 2.1 builder + OAuth client + submit/status/cancel
├── copy/             # microcopy library — empty/error/loading/confirm/success/empathy + jargon-free labels
├── pdf/              # A4 invoice PDF with MyInvois UUID + longId reference
├── utils/quiet-hours.ts  # shared MYT quiet-hours boundary check
└── supabase/, voice/, offline/, utils/

config/               # plans, site, categories, category-defaults, navigation
docs/                 # positioning/ strategic compass · SYNTHESIS-2026-05-05.md execution playbook · CHANGES-2026-05-06.md overnight diary
scripts/phase-0/      # sandbox spikes + 10-merchant interview · ai-cost measurement · distribution README · backup-b2b playbook
supabase/migrations/  # 000 (baseline) + 001-109, all applied to live Singapore Supabase
middleware.ts         # legacy-route 301 redirects
```

## Known issues

- **Vercel production env vars** — Supabase (URL + anon + service_role) + `OPENROUTER_API_KEY` + `GMAIL_USER` + `GMAIL_APP_PASSWORD` + `CRON_SECRET` are live (set 2026-05-18 via Vercel REST API). `BILLPLZ_*` and `MYINVOIS_*` remain placeholders until the real merchant accounts + LHDN preprod credentials are issued.
- **Vercel CLI stdin-piping bug (v52, confirmed 2026-05-18)** — `printf '%s' "value" | vercel env add KEY production` silently stores an empty encrypted string. Use the Vercel REST API (`POST /v10/projects/{id}/env` with JSON body + `upsert=true`) instead. The auth token lives at `~/Library/Application Support/com.vercel.cli/auth.json`.
- **Google OAuth** in Testing mode — only emails on the Test users list can sign in. Publish the consent screen before private beta (blocked on Privacy URL hosting + production logo).
- **Customer accounts deferred** — per [D-018](./docs/positioning/07-decisions.md#d-018--marketplace-trajectory--4-stage-roadmap-refuse-6-refined-2026-05-19) Stage 3 (Year 2). Today customers order anonymously via merchant's `/[slug]` page; receipt + ack pages served via unguessable UUID URLs. Phase 0 §8 Q3 + Q2 validate Model D and Model B respectively before they get built.

(Vercel auto-deploy was silent ~Apr 9 to Apr 27; resolved by re-granting the GitHub App access to this repo + `vercel git disconnect && vercel git connect` to flush the stale link.)

## Documentation

- [`docs/positioning/`](./docs/positioning/) — strategic compass (start with `00-manifesto.md`)
- [`docs/positioning/09-marketplace-trajectory.md`](./docs/positioning/09-marketplace-trajectory.md) — v1.3 companion: 4-stage roadmap, analog mapping, customer-account decision matrix
- [`docs/MECE-PROBLEM-TREE.md`](./docs/MECE-PROBLEM-TREE.md) — causal problem tree: 8 problems in 3 layers + 1 barrier, demand sequencing, segment playbooks (IKS / mompreneur), 3-level messaging hierarchy — locked 2026-05-23
- [`docs/SYNTHESIS-2026-05-05.md`](./docs/SYNTHESIS-2026-05-05.md) — execution playbook (Phase 0 8-week plan + 7 pre-committed triggers + scenario-c backup)
- [`docs/CHANGES-2026-05-06.md`](./docs/CHANGES-2026-05-06.md) — overnight build session diary (26 features + 11 audit-fix bugs)
- [`docs/ops/sdn-bhd-roadmap.md`](./docs/ops/sdn-bhd-roadmap.md) — step-by-step: MDEC MD Status → Sdn Bhd → bank account → CHIP Level 4 (for Danial)
- [CLAUDE.md](./CLAUDE.md) — full technical spec (stack, schema, patterns, integrations, env, known issues)
- [HANDOFF.md](./HANDOFF.md) — status, open work, Phase 0 gates, deployment checklist
- [scripts/phase-0/merchant-interview.md](./scripts/phase-0/merchant-interview.md) — 10-merchant validation script (5 friendly + 5 hostile)

## License

Private — all rights reserved.
