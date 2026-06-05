# 09 · Marketplace Trajectory — How Tokoflow Becomes the Efficient Alternative

> **Companion to D-018.** This document expands the 4-stage marketplace roadmap into operational detail, maps Tokoflow against successful tool-to-marketplace analogs, and codifies the "efficient marketplace" thesis that justifies entering a space where PgMall, PrestoMall, and 11street MY all died.
>
> *Versi 1.3 · 19 May 2026 · Added during Stage 1 directory activation.*

---

## TL;DR

Tokoflow becomes a marketplace **in stages**, never simultaneously. Each stage has its own PMF gate. Stage-jumping is the failure mode that killed every prior MY marketplace attempt — we don't make that mistake.

| Stage | When | What's built | What's NOT built | Customer identity | Commission |
|---|---|---|---|---|---|
| 1 — Beachhead | Now → Month 6 | Tool + `/store` directory + per-merchant magic link | Customer accounts, cross-merchant view | Anonymous | 0% all |
| 2 — Soft directory | Month 6-12 | SEO-driven `/store/[city]`, curated featured, opt-in | Cart, accounts, reviews | Anonymous | 0% all |
| 3 — Light marketplace | Year 2 | Customer accounts (Model B), reviews, recommendations, wallet | Cross-merchant cart, escrow | Required | **0% direct, 2-3% marketplace** |
| 4 — Full marketplace | Year 3-5 | Cross-merchant checkout, dispute resolution, logistics aggregation | — | Required | 2-3% all marketplace |

**Two-track economics (the structural innovation):** direct orders stay 0% / merchant-owned. Discovery-attributed orders become 2-3% / platform-mediated. This preserves Refuse #6 on the direct axis while permitting platform identity on the discovery axis.

---

## Why staging matters — the MY marketplace graveyard

Every Malaysian marketplace that tried to be Shopee-from-Day-1 died:

| Platform | Founded | Status | Why it died |
|---|---|---|---|
| PgMall | 2016 | Effectively zombie 2024 | Tried to match Shopee CAC without Sea Group capital. Inflated GMV controversies broke trust. |
| PrestoMall | ~2018 | Shut down 2023 | No defensible niche. Generic horizontal competition. |
| 11street MY | 2014 | Pulled out 2018 | Couldn't differentiate from Lazada/Shopee on price or selection. |
| HipVan MY | ~2017 | Niche shutdown 2020 | Vertical too narrow without ops scale to match. |

**Common failure mode:** horizontal-marketplace ambition without merchant beachhead. Customers don't trust new marketplaces; merchants don't trust new payout systems; the two-sided liquidity collapses before flywheel forms.

**Successful pattern (the playbook Tokoflow follows):**

| Company | Stage 1 (tool) | Stage 2 (directory) | Stage 3+ (marketplace) | Time to marketplace |
|---|---|---|---|---|
| **Toast** | Restaurant POS (2013) | — | Toast Local marketplace (2020) | 7 years |
| **Shopify** | Storefront builder (2006) | — | Shop App (2020) | 14 years |
| **Square** | POS (2009) | Cash App (2013) | Marketplace features layered in | 4-7 years |
| **Substack** | Newsletter tool (2017) | Discover tab (2020) | Network effects (2022+) | 3-5 years |
| **Etsy** | Listing tool (2005) | Built-in directory | Marketplace | Day 1 (vertical-defensible) |

Tokoflow's analog is closest to **Toast + Substack**: vertical defensibility (home F&B mompreneur MY), tool-first PMF (Stage 1), then layered discovery (Stage 2), then marketplace identity (Stage 3+).

**Time horizon expectation:** 3-5 years to Stage 3, not 6 months. Anyone who promises faster is selling fantasy.

---

## The "efficient marketplace" thesis — what makes 2-3% sustainable

Shopee's commission structure (1-7% + transaction fee + ads + payment) yields ~10-15% effective take. That covers ops cost of ~20-30% of GMV — paid customer acquisition (~RM 30-50 CAC), large customer support team (~RM 5-10 per order), dispute and fraud resolution (~RM 2-5 per order), payment processing (~1-2%), and infrastructure.

Tokoflow can sustain 2-3% commission **only if** ops cost stays at 5-10% of GMV. The path to that:

| Cost lever | Shopee | Tokoflow target | How |
|---|---|---|---|
| Customer acquisition | RM 30-50 / customer (paid) | RM 5-15 / customer (organic) | Each merchant brings own customer base. Referral program. SEO compounding via `/store/[city]`. |
| Customer support | RM 5-10 / order (large team) | RM 1-3 / order (AI-handled 80%) | Background Twin + Foreground Assist foundation already in code. Vertical = lower dispute complexity. |
| Fraud & disputes | RM 2-5 / order | RM 0.50-2 / order | Strict KYC at signup (Sdn Bhd verified). MY-only Year 1 lowers attack surface. Vertical = lower fraud frequency. |
| Payment processing | ~1-2% | ~1-2% (Billplz) | Same — table stakes. |
| Infrastructure | Opaque, large | Lean (Vercel + Supabase) | Single-region, single-currency, no warehouse, no fleet. |

**Headline:** if AI handles 80%+ of support and CAC stays organic, 2-3% commission is profitable at Stage 3 scale. Toast did this. Substack did this. Etsy did this. None of them subsidized like Shopee.

**What this is NOT permission for:** burning capital on paid CAC to "kickstart" the marketplace. The moment Tokoflow starts paying for customer eyeballs at Shopee-scale, the math breaks and we become PgMall.

---

## Stage-by-stage detail

### Stage 1 — Merchant beachhead (now → Month 6)

**Goal:** 50-100 paying Pro merchants. Phase 0 adversarial validation passes.

**What's built (most already exists):**
- Tool: ordering, products, customers, recap, invoicing, MyInvois Pro-gated
- AI: Background Twin payment matcher, Foreground Assist reply drafts (Year-2 scaffolds shipped 2026-05-06)
- Directory: `/store` + `/store/[city]` activated (commit baa347f → renamed /toko in 01286cf)
- Per-merchant magic link (Model D): **deferred** — build only if Phase 0 Q3 ≥7/10 yes

**What's NOT built:**
- Platform-wide customer accounts (no Model B/C)
- Cross-merchant features
- Reviews, ratings, recommendations
- Wallet, escrow, cross-merchant cart

**Phase 0 gate (8-week validation):**
- ≥7/10 interviews resonate with Three-Tier Reality
- AI cost ≤ RM 25/merchant/month at 50-order load
- ≥300 followers + ≥15 inbound DMs by Week 8 (distribution validation)
- Brand friction <4/10 average (Tokoflow name OK)
- Sdn Bhd in SSM queue
- Ariff partnership locked

**Stage 2 trigger:** Phase 0 PASS + Q4 directory opt-in ≥7/10 yes + ≥30 paying Pro merchants.

---

### Stage 2 — Soft directory (Month 6-12)

**Goal:** SEO-driven discovery, ≥100 merchants across ≥5 MY cities, organic traffic compounding.

**What's built:**
- `/store` directory polished: empty states, featured (newest) section, city chips, category filters (already in DirectoryGrid)
- Per-city pages with hand-curated "Featured this week" rotation (manual at first; automation later)
- SEO push: Google Search Console, structured data audit, sitemap freshness, robots.txt confirms /store indexable
- Onboarding flow strongly encourages merchants to fill city + category (already validated in interview Q4)
- Settings UI shows live `/store/[city]` link to listed merchants (added in this session)
- Footer "Browse stores" link to `/store` (added in this session)

**What's NOT built:**
- Customer accounts (still anonymous browse)
- Reviews, ratings
- Cross-merchant cart
- Algorithmic recommendation

**Stage 3 trigger:** Stage 2 traffic ≥1000 unique visitors/week sustained for 6+ weeks + Q2 marketplace appetite ≥7/10 from a fresh 10-merchant interview wave.

---

### Stage 3 — Light marketplace (Year 2)

**Goal:** First commission revenue stream. Marketplace-driven orders are paying for themselves.

**What's built:**
- **Customer accounts (Model B)** — Tokoflow platform identity via Supabase Auth + `app_metadata.role = "customer"`. Phone-OTP or email signup.
- Customer dashboard: orders across merchants discovered via Tokoflow
- Reviews + ratings (merchant-moderated, abuse-reportable)
- Algorithmic ranking on `/store` (vertical-aware: same-city > same-category > recency-weighted)
- Wallet (Tokoflow Cash) — same-day payout to merchants
- Trust signals: verification badge (Sdn Bhd verified, MyInvois enabled, 100+ orders shipped)

**Two-track commission live:**
- `orders.referral_source = "marketplace"` → 2-3% commission charged to merchant on payout
- `orders.referral_source = "direct"` (or NULL) → 0% commission, merchant takes full
- Backend wired via existing `referral_source` column (migration 060 — was always intended for this)

**What's NOT built:**
- Cross-merchant cart (each order still per-merchant)
- Centralized escrow
- Dispute resolution at scale
- Logistics integration

**Stage 4 trigger:** Stage 3 unit economics positive (commission revenue > marketplace ops cost) sustained for 2 quarters + ≥5000 customer accounts active.

---

### Stage 4 — Full marketplace (Year 3-5)

**Goal:** Compete head-on with Shopee/Foodpanda on UX (not on price subsidy).

**What's built:**
- Cross-merchant cart + unified checkout
- Escrow: Tokoflow holds funds until customer confirms receipt; 3-day auto-release otherwise
- Dispute resolution flow
- Fraud detection ML
- Customer-facing mobile app (PWA → native via Capacitor when usage data justifies)
- Logistics aggregation: unified courier dispatch (Lalamou, Grab, Pos Laju) via single merchant interface
- Sponsored placement (transparent — clearly labeled "Sponsored", merchant-bid, max 1 of 6 cards)

**Forever NOT built (Refuses preserved at Stage 4):**
- Algorithm that requires pay-to-play visibility (Refuse #1 of the original list — distinct from sponsored slots)
- Customer DM-to-merchant outside merchant's WA channel (Refuse #1: relationship is merchant's)
- Auto-reply on merchant's behalf (Refuse #7: judgment is merchant's)
- Streak / badge gamification (Refuse #8: anti-anxiety)
- Selling merchant or customer data (Refuse #9: never)
- Platform lock-in (Refuse #10: cancel + export always one tap)

**Financial sanity check:** at Stage 4 scale (10K paying merchants × RM 49/mo subscription + 2% on RM 30M/month GMV marketplace commission), revenue ≈ RM 5.88M subscription/mo + RM 600K commission/mo = RM 6.48M/mo = ~RM 78M ARR. That's ~5% of Shopee MY revenue 2023 (~USD 300M) at 10K merchants. Realistic ceiling for Year 3-5 with founder-led, lean team.

---

## What Stage 3 customer accounts look like (preview only — not built yet)

The customer account decision was deferred in v1.2 (Refuse #6 ambiguous on cross-merchant view). D-018 resolves: **introduce platform-wide customer accounts ONLY at Stage 3**, gated by Phase 0 + Stage 2 validation. Until then, customers stay anonymous on `/store` + transactional via merchant's `/[slug]` flow.

**Model B (the chosen Stage 3 customer account model):**
- Auth: Supabase Auth, `app_metadata.role = "customer"`
- Identity: phone (OTP via WA) OR email + password
- Surface: `/my` dashboard showing orders across merchants discovered via Tokoflow
- Refuse #6 preservation: customer's phone + name + delivery_address still belongs to each merchant they ordered from (per-order data). Tokoflow stores **identity** (phone + name on platform account) but **NOT transaction data ownership** (merchant retains those columns on `orders` + `customers`).

**Phased intro (within Stage 3):**
- Sub-phase 3.1: customer accounts available but optional (sign-in not required to browse or order via direct link)
- Sub-phase 3.2: marketplace-discovery flow gates checkout behind customer account (account required to order via `/store` discovery; direct merchant link stays guest-friendly)
- Sub-phase 3.3: reviews + recommendations launch (Phase 0 of customer-side network effects)

**Hard guardrails (will not be broken at Stage 3+):**
- Customer can delete account → all per-merchant relationship data stays with the merchants (anonymized: phone removed, orders historical-only). Account deletion never deletes the merchant's customers row.
- Merchant can export full customer + order history at any time (`/settings/export`)
- Customer cannot DM merchant outside the merchant's own WhatsApp number (Refuse #1)
- No customer-side leaderboards, badges, streaks (Refuse #8)

---

## Phase 0 questions tied to this trajectory

Added to [`scripts/phase-0/merchant-interview.md` §8](../../scripts/phase-0/merchant-interview.md) (Marketplace appetite, 3 min):

| Q | What it validates | Threshold |
|---|---|---|
| Q1 — Marketplace dependency % | Switching cost from existing platform | descriptive baseline |
| Q2 — 2-3% commission willingness | Stage 3 marketplace appetite | avg ≥7/10 → proceed Stage 3 planning |
| Q3 — Magic-link useful? | Model D per-merchant validation | ≥7/10 yes → build Model D immediately |
| Q4 — Directory opt-in? | Stage 2 directory adoption | ≥7/10 yes → invest in directory SEO/curation |
| Q5 — Trust differentiator | Defensibility signal | open-ended, look for themes |

**Decision matrix from interview outcome:**

| Q2 avg | Q3 ≥7/10 | Q4 ≥7/10 | Outcome |
|---|---|---|---|
| ≥7 | yes | yes | Full path — Stage 2 → Stage 3 planning |
| ≥7 | yes | no | Build Model D + Stage 3 marketplace; downplay directory |
| ≥7 | no | yes | Build Stage 2 directory + Stage 3 marketplace; skip Model D |
| 4-6 | any | yes | Stage 2 only (directory). Defer Stage 3 indefinitely. |
| 4-6 | any | no | Stay Stage 1. Re-interview in 6 months. |
| <4 | any | any | **Pure tool play.** Freeze marketplace pivot. v1.3 unwound. |

---

## What overrides v1.2 (and what doesn't)

**Refined:**
- Refuse #6 — direct-axis preservation explicit, discovery-axis platform identity permitted at Stage 3+

**Added:**
- 4-stage roadmap
- Two-track commission economics
- Customer account decision matrix (deferred to Stage 3)
- Phase 0 marketplace validation questions

**Preserved (v1.2 holds, no change):**
- Three-Tier Reality (D-013)
- 2-Layer Twin: Background autonomous + Foreground suggest-only (D-014)
- Lifestyle vs venture-scale acceptance (D-015)
- Internal vs customer-facing naming separation (D-016)
- Refuses #1, #2, #3, #4, #5, #7, #8, #9, #10 — unchanged
- Pricing tiers: Free / Pro RM 49 / Business RM 99 (D-008)
- Wave 1 segment: home F&B mompreneur Shah Alam (D-006)
- "We handle the receipts. Not the recipes." tagline

---

## The honest part

**This trajectory might fail.** Reasons it could:
- Phase 0 Q2 returns <4/10 — merchants don't actually want marketplace
- Stage 1 PMF fails entirely — no path to Stage 2
- Stage 2 traffic flat — directory doesn't compound
- Stage 3 unit economics negative — 2-3% commission doesn't cover ops at small scale
- Capital exhaustion before Stage 3 (founder-led, no raise yet)
- Shopee retaliates with predatory pricing at Tokoflow's small scale

**If we kill at any stage:** the company can retain Stage 1 (merchant tool) and earn from subscriptions alone (RM 49-99/mo per merchant). RM 5.88M ARR at 10K Pro merchants is not venture-scale but is lifestyle-business viable (D-015 already covered this).

**If we hit Stage 3:** Tokoflow becomes the first MY-native marketplace that doesn't strip merchant ownership. That's defensible because Shopee can't unbundle without alienating their existing commission take.

**If we hit Stage 4:** ~RM 78M ARR at 10K paying merchants, ~5% of Shopee MY revenue scale. Strong lifestyle business or modest venture exit, depending on growth curve.

---

*Versi 1.3 · 19 May 2026 · Companion to D-018. v1.2 archive (`00-manifesto.md` → `08-the-disappearing-work.md`) preserved unchanged.*
