# Tokoflow — Company Profile

> **We handle the receipts. Not the recipes.** — *"Resi kami urus. Resep kamu."*
>
> **Your business. Your website. Your customers.** — *"Bisnes anda. Laman web anda. Customer anda."*

*A comprehensive overview of Tokoflow — what it is, the problem it solves, how it works, who it serves, how it makes money, how it is built, and where it is going.*

**Document status:** Snapshot as of **2026-06-04**. Tokoflow is **pre-launch** — the product is code-complete and deployed to production, but commercial launch is gated on a structured validation phase plus company incorporation and payment-gateway onboarding (see §13). Throughout this document, features are explicitly marked **Live**, **Planned**, or **Deferred** so the picture stays honest.

---

## 1. Executive summary

**Tokoflow is the owned-commerce layer for independent Malaysian businesses that already have demand but do not yet have a selling machine of their own.**

A merchant takes one photo of their products. In seconds they have a shareable shop link. Customers order through that link, pay by DuitNow QR, and every order lands tidy in the merchant's dashboard. Behind the scenes, Tokoflow quietly removes the mechanical residue of running a small business — matching payments, drafting replies, numbering invoices, tracking status — while never touching the two things that belong to the merchant: their craft and their customer relationships.

The strategic thesis: **marketplaces (Shopee, TikTok Shop, Lazada, Foodpanda) are great for discovery, but they own the customer, take 20–35% commission, and decide what the buyer sees next — possibly a competitor.** Tokoflow gives the merchant a channel that is genuinely theirs — a page they own, orders that go to their inbox, customer data they keep, and payment that settles directly to their bank — with **0% commission on direct orders.**

| | |
|---|---|
| **Category** | Owned-commerce SaaS for SMBs (storefront + order management + payments + light compliance) |
| **Market** | Malaysia (Year 1), with Southeast-Asia expansion intent |
| **Pricing** | Free (50 starter orders) · Pro RM 49/mo · Business RM 99/mo · **0% commission on direct orders** |
| **Stage** | Pre-launch; code-complete; production deploy live at https://www.tokoflow.com |
| **Sister product** | Forked from **CatatOrder** (Indonesia) — a separate, MY-localised codebase, not a shared platform |
| **Tech** | Next.js 16 · React 19 · TypeScript · Supabase · Tailwind 4 · Vercel · Gemini 3.5 Flash (via OpenRouter) |

---

## 2. The problem

Three forces squeeze the independent Malaysian seller:

**2.1 Platform dependency.** Anyone can list on TikTok Shop, Shopee, or Foodpanda — but the platform owns the relationship. It charges a commission on every order (typically **20–35%** for F&B delivery and marketplace fees), and when a happy customer wants to buy again, the platform's algorithm decides what they see next. The seller did the work and paid for the attention, but does not own the outcome.

**2.2 Operations eat craft.** A solo maker's day splits into three, not two:

- **Pure craft** — the baking, the sewing, the formulating, the thing they love and are good at.
- **Customer relationship** — the loyal regulars, the school-mom WhatsApp threads, the custom-order conversations. Often valued.
- **Mechanical residue** — chasing payments, matching bank notifications to orders, copying addresses, numbering invoices, updating status, answering the same questions. Pure drag.

Most tools either ignore the residue or, worse, automate the *relationship* and the *craft* too — sending DMs in the merchant's name, regenerating their product photos, auto-replying to complaints. That destroys the very thing that makes a small business worth buying from.

**2.3 Credibility gap (for the more formal end).** Semi-formal SMEs and small manufacturers (IKS — *Industri Kecil dan Sederhana*) often still run their entire digital presence through a personal WhatsApp number. They have real products and real demand, but no channel that *looks* like a company — which costs them trust with business buyers.

Tokoflow's framing of these problems is documented as a causal **MECE problem tree** (`docs/MECE-PROBLEM-TREE.md`): four strategic problems (channel control, customer relationship, effective platform cost, credibility), two conversion problems (reorder friction, order capture), two operations problems (operations control, payment reconciliation), and one underlying barrier (implementation difficulty).

---

## 3. Mission & vision

**Mission:** *Own your commerce channel — not just a listing on someone else's.*

The analogy the company holds internally: in 1977, computers were for corporations and enthusiasts; Apple believed they should be for everyone — not by making them cheaper, but by making them feel humane, intuitive, and *yours*. Today, selling online is accessible to anyone, but **owning** the channel is not. Tokoflow exists to change that — not by replacing marketplaces (use them for discovery), but by giving every independent Malaysian business their own commerce channel: a page that is theirs, orders that go to their inbox, customer data that belongs to them, and payment that settles directly to their bank. No IT company. No months of setup. Live today.

**Vision (multi-wave):** start as the calmest, fastest way for a Malaysian solo maker to take orders on their own channel; grow into the default owned-commerce layer across Malaysian verticals; and, over 3–5 years, add an *opt-in* discovery directory and a light marketplace **without ever taking the customer relationship away from the merchant** (see §11, marketplace trajectory).

---

## 4. What we believe (operating values)

Six convictions shape every product decision:

1. **Setup should disappear.** If a tool needs a wizard, a tutorial, or a checklist, it has already failed. One photo is all the setup we ask for.
2. **Technology should respect you.** No notifications outside quiet hours (22:00–06:00). No streaks that punish a day off. No red badges that manufacture anxiety.
3. **Hands belong on your work.** When your hands are full — at the wok, the sewing machine, the production line — you should be able to *talk* to your shop. Voice replaces forms.
4. **Every day deserves a kind ending.** Each evening, Tokoflow tells you the story of your day — warm on busy days, gentle on slow ones. Never judging.
5. **Compliance should be invisible.** LHDN, SST, MyInvois — important, but none of it should occupy the merchant's mind. Handled silently in the background.
6. **Your customers belong to you.** Order through a Tokoflow page and that relationship is yours — not a platform's algorithm. No commission on direct sales. No data sold. No recommending your competitors.

The internal shorthand for all of this is one word: **Kontrol** (control) — over the channel, the customer, the order, the payment, the invoice, the repeat purchase, the data, and the credibility.

---

## 5. Product philosophy — the Three-Tier Reality

Every Tokoflow feature must pass **Test 0**: it must serve exactly one of three tiers of a solo maker's day, and serve it in the prescribed way.

| Tier | What it is | Tokoflow's role | How |
|---|---|---|---|
| **Tier 1 — Pure Craft** | What the merchant loves and is good at | **Protect** — never enter | (no software surface; the kitchen stays sacred) |
| **Tier 2 — Customer Relationship** | Loyalty, custom orders, WhatsApp threads | **Amplify** with suggestions, never replace | **Foreground Assist** — drafts replies/messages the *merchant* reviews and sends |
| **Tier 3 — Mechanical Residue** | Admin, payment matching, invoicing, status updates | **Remove** invisibly | **Background Twin** — autonomous, quiet, behind the scenes |

This produces a **two-layer AI architecture**:

- **Background Twin** (Tier 3, autonomous): matches incoming bank/DuitNow notifications to open orders, handles repetitive residue. It *escalates* to the merchant when confidence is low rather than guessing.
- **Foreground Assist** (Tier 2, suggest-only): drafts replies to customer questions, status updates, and follow-ups. **It never sends on its own** — every message carries the reminder that Tokoflow drafts, the merchant sends, and the relationship stays with the merchant.

> *"Background Twin", "Foreground Assist", and "Tier 3" are precision terms for engineering and strategy. The customer- and merchant-facing UI never exposes them — to users it is simply "Tokoflow", in the first person ("I'll handle that").*

---

## 6. The product — what Tokoflow does

### 6.1 The four wedges

1. **Photo Magic** *(Live)* — one photo of the merchant's products → AI extracts shop name, story, menu items, and prices, and the shop is live in seconds. **The photo itself is never regenerated or beautified** — it is part of the merchant's craft and brand (kitchen-protection). Photo Magic *reads*; it does not invent.
2. **AI-native order capture** *(Live)* — paste a WhatsApp chat, speak a voice note, or screenshot an order, and Tokoflow parses it into a structured order (items, quantities, customer, delivery date, notes). Built for Malaysian SMB vocabulary — Malay, English, Manglish code-switch, +60 phone formats, Asia/Kuala_Lumpur time.
3. **Community data** *(Live, density-gated)* — an anonymised peer benchmark ("sellers near you price kek lapis at RM 6, you're at RM 5") that only surfaces once a cluster has ≥10 users, so no individual is exposed. Group-buy pooling is deferred.
4. **Silent compliance — LHDN MyInvois** *(Live, Pro-gated)* — one-tap e-Invoice submission and SST reporting, surfaced only when the merchant is large enough to need it. It is a *silent superpower*, not the pitch — most Year-1 home sellers never cross the SST registration threshold.

### 6.2 The merchant journey (end to end)

1. **Onboarding** *(Live).* Sign up (email or Google). Either snap one photo (Photo Magic) or use a short manual wizard (business category → a few products → store link). No business-type dropdowns, no forms-heavy setup.
2. **Storefront** *(Live).* A clean public page at `tokoflow.com/<your-slug>` — the merchant's photo, story, and menu, with a conversational order flow. Optionally listed on the public directory at `tokoflow.com/store` (opt-in, free), but the direct link works regardless.
3. **Order capture** *(Live).* Customers self-order through the link (no app to install). Orders arrive in the dashboard with a real-time toast + sound; offline-tolerant (network-first with local fallback).
4. **Payment** *(Live).* The customer pays by static DuitNow QR (zero merchant setup) or, if the merchant connects their own gateway, an in-browser FPX/e-wallet checkout — funds settle **directly to the merchant's bank**; Tokoflow never holds the money (see §7). For QR orders, Tokoflow gates the order behind an uploaded payment receipt and offers the merchant an optional **AI receipt check** (advisory only — the model extracts amount/status/date, code judges, the merchant decides).
5. **Fulfilment** *(Live).* Two dimensions — *timing* (scheduled / on-demand) × *fulfilment* (delivery / pickup / dine-in). For deliveries, the merchant marks the order shipped with a courier + tracking number; the customer's receipt shows an "On the way" card with a one-tap link to the carrier's tracking page (Pos Laju, J&T, Ninja Van, GDEX, DHL auto-detected). Tokoflow does **not** integrate courier APIs — the merchant ships however they want; Tokoflow only displays the destination event.
6. **Invoicing & tax** *(Live; MyInvois Pro-gated).* Sequential auto-numbered invoices; SST at 0% or 6% computed to the sen; one-tap LHDN MyInvois (UBL 2.1) submission with a 72-hour cancel window; a monthly SST summary ready to copy into the RMCD SST-02 return.
7. **Insights & care** *(Live).* A warm daily brief ("today's lineup", cost-trend nudges, a "quiet day" note when revenue dips), a monthly story, customer-return recognition, seasonal awareness (e.g., pre-Ramadan). Anti-anxiety by design — no streaks, no "X/50 used" banners.

### 6.3 The customer journey (end to end)

Discover (via a shared link or the directory) → open a clean shop page → add items / set quantities / leave notes → choose delivery or pickup and enter an address if needed → pay by DuitNow QR or gateway checkout → receive a receipt page with live status ("Received → Processing → Shipped → Done") → track the parcel or confirm receipt. No account, no app, no friction.

---

## 7. Payment architecture

Smooth payment is treated as a four-level roadmap. The guiding principle: **Tokoflow never holds the merchant's money** — funds always settle to the merchant's own bank, which keeps Tokoflow out of Money-Services-Business (MSB) licensing risk.

| Level | How it works | Merchant setup | Status |
|---|---|---|---|
| **1 — Static DuitNow QR** | Customer scans the merchant's QR, uploads a receipt, merchant verifies (with optional AI triage) | Upload a QR image | **Live** |
| **2 — Gateway checkout (Billplz)** | FPX / DuitNow / card / e-wallet in-browser, auto-confirmed via webhook | Connect own Billplz account (needs business registration) | **Live** |
| **3 — ToyyibPay** | Wider e-wallet coverage (TNG, ShopeePay, GrabPay, Boost) | Lighter registration | **Planned** (registration requirements to be verified before building) |
| **4 — Sub-merchant (CHIP)** | Tokoflow registers once as a marketplace operator; each merchant enters only a **bank account number**; the gateway routes funds directly to them | Bank account number only | **Planned** (post-Sdn-Bhd; the long-term target) |

Level 4 (via CHIP, a BNM-licensed gateway with a modern Stripe-like API) is the strategic destination: zero onboarding friction for the merchant, full payment visibility for the Background Twin's matching, and the rails for an *opt-in* marketplace commission split later (direct orders stay 0%; marketplace-attributed orders 2–3%).

---

## 8. What Tokoflow refuses to do

Restraint is a positioning weapon. Tokoflow **never**:

1. DMs a customer in the merchant's name — the relationship is theirs.
2. Sets the merchant's prices — judgment is theirs.
3. Auto-replies to reviews or complaints — voice is theirs.
4. Posts to social media — brand is theirs.
5. Regenerates or beautifies product photos — craft is theirs.
6. Claims ownership of customer data — data stays theirs.
7. Automates emotional responses — judgment is theirs, the draft is ours.
8. Gamifies with streaks or badges — anti-anxiety.
9. Sells the merchant's data — ever.
10. Locks the merchant in — one-tap cancel, full data export.

(Refuse #6 has a single, disclosed refinement on the *discovery* axis only: a future opt-in marketplace directory may attribute discovery and apply a 2–3% commission on marketplace-driven orders — but direct orders remain 0% and transaction data stays merchant-owned.)

---

## 9. Target market

**Year 1: Malaysia, two confirmed segments.**

- **Segment A — IKS manufacturer / semi-formal SME** *(credibility-first).* Validated by the first organic user, **AmeenAleem** (an IKS manufacturer in Kedah), who described Tokoflow as *"our own company website"* when sharing it with his business network. Entry pain: looking professional, owning a real digital channel beyond a personal WhatsApp number.
- **Segment B — mompreneur / home-based seller** *(order-chaos-first).* Persona "Bu Aisyah", Shah Alam. Entry pain: taming WhatsApp order chaos, getting paid cleanly, keeping repeat customers. Still **unvalidated** — the focus of the Phase 0 validation.

**Who it is for, broadly:** F&B and home kitchens, catering and meal-prep, IKS and small manufacturers, cosmetics and skincare, fashion and modest wear, crafters and tailors, health and wellness, and independent retailers — businesses that already have a real product and real customers and are ready to own their channel.

**Expansion hypothesis (waves):** Wave 1 — mompreneur F&B + IKS (Klang Valley / Kedah). Wave 2 (Year 2) — vertical-first within Malaysia (kosmetik, modest fashion, local services). Wave 3+ — geographic (KL, Penang, Singapore, Brunei) and cross-pattern (creators, freelancers). Lifestyle-to-venture scale is held honestly: an RM 100–300K MRR ceiling in Years 3–5 is realistic; venture-scale upside is an upside, not an assumption.

---

## 10. Business model & pricing

Revenue is **subscription-only** today — Tokoflow takes **0% commission on direct merchant-link orders.**

| Tier | Price | Included |
|---|---|---|
| **Free** | RM 0/mo | First **50 orders free** (a one-time starter quota — no monthly reset), plus all core features: store link, AI order parsing, recap, customer directory, basic invoices |
| **Pro** | **RM 49/mo** | Unlimited orders, smart reminders, the pricing whisper (peer benchmark), one-tap LHDN MyInvois + SST 0/6% reporting, receivables tracking, and removal of the "Made with Tokoflow" footer |
| **Business** | RM 99/mo | Everything in Pro, plus multi-staff accounts (2 included, +RM 15/extra), order assignment to staff, and priority support |

Annual Pro is RM 49/month (RM 588/year); month-to-month is RM 79. (Legacy quota top-up packs exist in the database for backward compatibility but are not surfaced in the current UI.)

The **future, opt-in** revenue line (marketplace stage, Year 2+) is a 2–3% commission on *marketplace-attributed* discovery orders only — never on the merchant's own direct orders.

---

## 11. Competitive positioning & the moat

**The moat is four-dimensional**, built on top of the underlying shift in AI labour:

1. **Unstructured-input parsing** — WhatsApp chat screenshots, voice notes, mixed e-wallets — where competitors require structured forms.
2. **Bahasa-first conversational UX** — Manglish and BM/EN/Mandarin code-switch, tuned to how Malaysian SMBs actually talk.
3. **Silent compliance** — LHDN MyInvois / SST built in but gated, never cluttering the Free experience.
4. **Buyer experience** — a real storefront from one photo, plus a conversational order flow that needs no app.

**Strategic analog mapping:** the merchant-ownership thesis of **Owner.com**, the customer-data and lifecycle discipline of **Klaviyo**, and the "you own your audience" stance of **Substack**.

**The marketplace trajectory (Decision D-018) — a 4-stage roadmap over 3–5 years:**

1. **Beachhead** — tool-only, 0% commission, merchant owns everything. *(Live)*
2. **Soft directory** — opt-in listing at `/store` for discovery; direct link still primary. *(Live — Stage 1 activated)*
3. **Light marketplace** — discovery attribution with a 2–3% commission on marketplace-driven orders only; customer accounts (opt-in). *(Planned, gated on validation)*
4. **Full marketplace** — a two-sided network, still preserving direct-order ownership. *(Future)*

Two-track economics are wired from the start (an `orders.referral_source` column): **direct = 0%, marketplace-attributed = 2–3%.** Malaysia's marketplace graveyard (PgMall, PrestoMall, 11street MY) is treated as a cautionary study — the directory is deliberately *opt-in* and *additive*, never a tax on the merchant's own channel.

---

## 12. Technology & architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · shadcn/ui (warm, anti-anxiety design system) |
| Database | Supabase (PostgreSQL, Singapore region `ap-southeast-1`) · 109 migrations · row-level security throughout |
| Auth | Supabase Auth — email + Google OAuth |
| AI | **Gemini 3.5 Flash** via OpenRouter — model id centralised in `lib/ai/model.ts` with an automatic fallback to Gemini 2.5 Flash. Powers order parsing (photo / voice / paste), Photo Magic onboarding, the daily recap, AI receipt triage, and the Background Twin / Foreground Assist. Measured AI cost ≈ **RM 2.65 / merchant / month** at 50 orders |
| Payments | Static DuitNow QR (live) · Billplz FPX/DuitNow (live) · ToyyibPay (planned) · CHIP sub-merchant (planned) |
| Tax / e-Invoice | LHDN MyInvois (UBL 2.1 JSON), SST 0/6%, 72-hour cancel window |
| Hosting / CI | Vercel — auto-deploy on push to `main` |

**Architecture principles:** a clean service layer (UI never touches the database directly); dual auth (Bearer for mobile, cookies for web); server-authoritative money math; offline-tolerant order capture; real-time order events; and a consistent anti-anxiety microcopy library. Customer relationships and the merchant's craft are protected at the architecture level — there is simply no surface that DMs customers, regenerates photos, or auto-sends in the merchant's name.

---

## 13. Compliance, trust & data ownership

- **Tax / e-Invoice:** LHDN MyInvois (Malaysia's mandated e-Invoicing) is built in and one-tap, gated to the Pro tier and surfaced only when the merchant approaches the SST registration threshold (RM 500,000 for most taxable services). SST is calculated to the sen and reconciled against the official RMCD SST-02 process.
- **Payments:** funds never flow through Tokoflow — they settle to the merchant's own bank, avoiding MSB licensing exposure.
- **Data ownership:** the merchant's customer list is theirs; it is never sold, and a full export plus one-tap cancellation is guaranteed. The opt-in directory publishes only business-public fields (name, description, city, category, logo, products) — never email, phone, address, or tax identifiers.
- **Privacy of order/receipt links:** receipt and delivery-acknowledgement pages live at unguessable token URLs that are not indexed by search engines.

---

## 14. Current status & traction

- **Product:** code-complete across Phase 1, Phase 2, and Year-2 AI scaffolds. Production deploy live at https://www.tokoflow.com.
- **Engineering maturity:** ~50K lines of code, ~115 API routes, 5 scheduled jobs, 109 database migrations applied on the live Singapore Supabase project.
- **Early signal:** one organic IKS sign-up (AmeenAleem, Kedah) who independently framed Tokoflow as "our own company website" — validating the credibility-first angle for Segment A.
- **Launch gate (not yet cleared):** commercial launch is deliberately blocked on a structured **Phase 0 adversarial validation** — 5 friendly + 5 hostile merchant interviews, a 14-day manual "Background Twin" smoke test, AI-cost measurement (target ≤ RM 25/merchant/month — currently ≈ RM 2.65), a distribution test, a brand-resonance check, and a marketplace-appetite probe — with seven pre-committed kill/continue triggers. Plus: **Sdn Bhd incorporation** (SSM), a **Malaysian business bank account**, and **Billplz KYB** (Know-Your-Business) onboarding.

---

## 15. Company & team

- **Origin:** Tokoflow is forked from **CatatOrder**, an Indonesian sister product, then fully re-localised for Malaysia (currency MYR, locale en-MY, +60 phones, Asia/Kuala_Lumpur, MYT quiet hours, MY states/cities, Billplz/MyInvois replacing the Indonesian stack). The two are deliberately *sister products*, not one shared platform.
- **Structure:** founder-led and pre-incorporation; **Sdn Bhd registration is a Phase 0 milestone** (MDEC MD Status is being pursued to enable the lower paid-up requirement). A Malaysian co-founder / advisor partnership is in progress to ground local distribution and trust.
- **Operating discipline:** development runs against a versioned strategic "bible" (`docs/positioning/`) and a continuous adversarial positioning loop; every feature must pass Test 0 before it is built.

---

## 16. The shape of the thing, in one paragraph

Tokoflow is a humane, AI-native, owned-commerce layer for independent Malaysian sellers. It turns one photo into a real shop, captures orders without forms, settles payment straight to the merchant's bank at 0% commission, and quietly clears the mechanical residue of running a small business — while refusing, on principle, to touch the merchant's craft or their customer relationships. It is pre-launch by choice: the team is validating love and trust with real merchants before scaling, because the whole point is a tool people *keep* — one that disappears into the work, and gives every evening a kind ending.

---

*Maintained alongside the strategic compass in [`docs/positioning/`](./positioning/) (start with `00-manifesto.md`) and the execution playbook [`SYNTHESIS-2026-05-05.md`](./SYNTHESIS-2026-05-05.md). For the live engineering picture, see the repository [`README.md`](../README.md) and [`CLAUDE.md`](../CLAUDE.md). Last updated 2026-06-04.*
