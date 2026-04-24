# Activation Support for Low-Literacy UMKM Users: Deep Dive

> Retaining users who made it through the door — the gap between signup and sticky daily habit.

*Last updated: 2026-02-13*

---

## Context

The B2 audit confirmed CatatOrder solves the Digital Literacy Wall (P7) at the product-UX level: 100% Bahasa Indonesia, 44px touch targets, < 2 min onboarding, progressive disclosure, no jargon. But 2 critical gaps remain:

1. **No proactive WA onboarding** — users who struggle silently churn
2. **No first-time guidance** — empty dashboard gives minimal direction

This document is a deep dive into what "activation support" means, what the code currently does, what industry research recommends, and what specifically to build.

---

## What "Activation" Means for CatatOrder

### Activation Event Definition

**Primary:** User creates their first real order with at least 1 item AND a customer name/phone.

Why this definition:
- "Created an order" alone is too easy (could be empty/test)
- "Sent a WhatsApp receipt" is too far down the funnel (adds friction)
- "Created 3+ orders" is too ambitious for initial activation
- First real order with customer data proves the user understands the tool AND has started migrating their workflow from WhatsApp

### Secondary Activation Markers (Correlating with Retention)

- Created 3+ orders in first week
- Sent first WA receipt/order confirmation
- Viewed first daily recap
- Created orders on 3+ different days in first 2 weeks

### Time to Activation Target

- **Target:** First order within first session, under 5 minutes from login
- **Red flag:** Median time-to-first-order > 24 hours means onboarding is broken
- Global median time to activation: ~1 day (Userpilot 2024 benchmark)
- 80% of new mobile app users drop off after the first 3 days

---

## Benchmarks

| Metric | Industry Average | CatatOrder Target | Red Flag |
|--------|-----------------|-------------------|----------|
| SaaS activation rate | 34% (median 25%) | 20-30% | < 15% |
| Day-1 retention | varies | > 40% | < 20% |
| Day-7 retention | varies | > 25% | < 10% |
| Day-30 retention | varies | > 15% | < 5% |
| Monthly churn (paid) | 3-7% | < 5% | > 10% |
| Time to aha moment | ~1 day median | < 5 min | > 15 min |
| Free-to-paid conversion | 2-5% (< $10 ARPU) | 3-5% | < 1% |
| DAU/MAU ratio | varies | > 30% | < 15% |

Sources: Lenny's Newsletter, Userpilot, ChartMogul, First Page Sage, ProductLed

### Indonesian-Specific Context

- Only 30% of Indonesian SMEs willing to spend on SaaS (BCG 2023)
- 60%+ of those willing spend < IDR 5M/year (~$300/yr)
- 65% recognize digital tools as critical, but only 23% actively use them — a 42-point gap
- BukuWarung: 6.5M registered, ~659K MAU = ~10% monthly active rate
- BukuKas: 6.3M registered, no viable monetization, bankrupt Sept 2023
- Majoo: 45K+ paying users with "best-in-market 12-month retention" — the exception
- At Rp49-99K ARPU, only 2.7% of SaaS businesses achieve net retention > 100% (ChartMogul)

### Retention Math

```
Scenario A: 100 new users/month, 10% churn
  Month 1: 100 → Month 6: ~350 → Month 12: ~380 (plateaus)

Scenario B: 50 new users/month, 3% churn
  Month 1: 50 → Month 6: ~275 → Month 12: ~480 (overtakes A, still growing)

Retention 3% vs 10% = difference between compound growth and stagnation.
```

---

## Current Activation Journey (Code Audit)

### Step 1: Signup → First Page Load

**Flow:** Google OAuth → `/api/auth/callback` → redirect to `/pesanan`

- Profile auto-created on first read via upsert (receipt.service.ts:35-51)
- Default profile: `business_name=NULL`, `business_phone=NULL`, `plan="gratis"`, `orders_used=0`
- No verification step, no mandatory profile completion
- **Status: SOLVED** — signup is 1 tap, landing on OrderList is immediate

### Step 2: Empty Dashboard

**What the new user sees** (OrderList.tsx:138-146):
```
"Belum ada pesanan"
"Buat pesanan pertama dengan tombol + di bawah"
```
- FAB button (56px, dark circle, `+` icon) at bottom-right (OrderList.tsx:201-206)
- No checklist, no progress indicator, no sample data
- No pulsing indicator on FAB, no tooltip
- **Status: PARTIALLY SOLVED** — text exists but weak CTA, no visual guidance

### Step 3: Creating First Order

**OrderForm.tsx:**
- WaPasteInput shown first as green banner (WaPasteInput.tsx:62-76)
- Manual entry: 3 fields (name, price, qty) + `+` button (OrderForm.tsx:217-254)
- Customer section: collapsed by default (line 258-279)
- Payment toggle in sticky footer: Lunas | DP | Belum Bayar (line 337-371)
- Time estimate: WA paste ~30 seconds, manual ~90 seconds
- **Status: SOLVED** — form is minimal and fast

### Step 4: Post-Creation (The Aha Moment)

**What happens** (OrderForm.tsx:157-162):
```javascript
toast.success("Pesanan berhasil dibuat");  // 2-second toast, disappears
router.push(`/pesanan/${order.id}`);       // Redirect to order detail
```

- No celebration modal
- No "next steps" suggestions
- No prompt to send WA confirmation
- No explanation of why this is better than a notebook
- **Status: NOT SOLVED** — aha moment is silent

### Step 5: Return Loop

- Zero post-signup communication (no WA, no email, no push)
- No Day 1/3/7 nudges
- No re-engagement for inactive users
- DailyRecap exists but is manual (user must visit `/rekap` and tap send)
- No automated monthly value report
- **Status: NOT SOLVED** — product is entirely passive after first session

### Step 6: Feature Discovery

- All 9 nav items visible from Day 1
- No contextual suggestions ("You've created 3 orders — try sending a recap!")
- No progressive feature revelation
- **Status: NOT SOLVED** — secondary features invisible to new users

### What's Tracked vs What's Missing

**Tracked:**
- `orders_used` / `receipts_used` (incremented on creation)
- `counter_reset_at` (monthly reset)
- `plan` / `plan_expiry`
- Customer auto-creation
- Order status transitions
- Payment status

**Not tracked:**
- First order created date
- First WA message sent
- Onboarding completion
- Feature adoption (receipt, recap, reminders)
- User signup source (Google vs email)
- Profile completion percentage
- No `first_time`, `onboarding_complete`, `welcome_shown` flags exist

---

## The 5 Churn Risks for Low-Literacy Users

### Risk 1: "I signed up but don't know what to do"

Dashboard loads with empty OrderList. Text says "Buat pesanan pertama dengan tombol + di bawah." For a user with low digital literacy, "tombol +" may not register as the FAB in the bottom-right corner. The spatial disconnect (text in center, action button in corner) creates confusion.

**Impact:** User closes browser tab. Never returns.
**Current mitigation:** None.

### Risk 2: "I created an order but so what?"

After first order, user gets a 2-second toast and a detail page. No explanation of why this is better than their notebook. No prompt to send the order to the customer via WA (which would be the real aha — seeing the professional formatted message).

**Impact:** User thinks "this is the same as writing it down, but on my phone." Returns to notebook.
**Current mitigation:** None.

### Risk 3: "I haven't opened it in 3 days and forgot it exists"

Zero re-engagement. No WA message, no notification, no email. The app is entirely pull-based — user must remember to open it. 80% of new mobile app users drop off after the first 3 days (industry benchmark).

**Impact:** Silent churn. No way to recover the user.
**Current mitigation:** None.

### Risk 4: "I don't know about the other features"

User who only creates orders never discovers daily recap, receipts, payment reminders, or monthly reports. These are behind nav items a low-literacy user may never explore.

**Impact:** User perceives CatatOrder as "just a list" — not meaningfully different from their notebook. The features that create stickiness (daily recap showing revenue, payment reminders reducing unpaid orders) are never encountered.
**Current mitigation:** None.

### Risk 5: "My business name isn't set, so WA messages look broken"

Profile defaults to `business_name=NULL`. WA confirmation messages use businessName from profile (fonnte/client.ts:66): `"- ${businessName}"`. If null, the signature line shows `"- "` — empty, unprofessional.

**Impact:** User sends a WA confirmation, it looks incomplete, they blame the app.
**Current mitigation:** None — no profile completion prompt exists.

---

## How Competitors Handled Activation

### BukuKas (bankrupt, but activation was strong initially)

- **60% improvement in new user activation** over 6 months using lifecycle-aware UI
- App "doesn't appear the same for every user" — new users saw simplified view focused on first action, experienced users saw full feature set
- Designed as "a layer on top of WhatsApp" — users didn't change routines
- RFM analysis revealed churn causes → built features to reactivate
- Grew 25x during COVID with 54% CMGR from Jan 2020
- **Died because:** Free product, no monetization, $140M burned on paid acquisition

**Lesson:** Lifecycle-aware onboarding works. But acquisition without monetization kills you.

### BukuWarung (alive, pivoted)

- 6.5M registered merchants, ~659K MAU
- Physical roadshows across hundreds of Indonesian cities
- In-person training significantly increased adoption
- Pivoted from bookkeeping to EDC/Mini ATM (payments company now)

**Lesson:** In-person works but doesn't scale. WA-based follow-up is the scalable equivalent.

### GoBiz (Gojek)

- "Daftar Mandiri" (Self-Registration): 3-stage process eliminated need for sales visits
- 265K culinary UMKMs joined during pandemic
- Key insight: reducing dependency on humans for onboarding was the unlock

**Lesson:** Self-service onboarding must be dead simple. CatatOrder already has this.

### Majoo (the comp to study)

- 45K+ paying users with best-in-market 12-month retention
- Revenue: $79.6M in 2024
- End-to-end SaaS with real monetization
- Unlike BukuKas/BukuWarung, Majoo built paying users from the start

**Lesson:** Paying users who retain > free users who don't. Focus on activation that leads to conversion.

---

## WhatsApp as Onboarding Channel

### Why WA, Not Email

| Metric | WhatsApp | Email | SMS |
|--------|----------|-------|-----|
| Open rate | **98%** | 20-25% | 90% |
| Click-through rate | **45-60%** | 2-5% | 6-7% |
| Conversion rate (drip) | **40-50%** | 2-5% | ~3% |
| Users in Indonesia | **112M** | ~80M | declining |

Sources: Wapikit, AISensy, YCloud

Since Nov 2024, all service conversations on WhatsApp are free in Indonesia.

### Recommended Onboarding Drip Sequence

**Day 0 (Immediate post-signup):**
```
Halo {{nama}}! Selamat datang di CatatOrder.
Catat pesanan pertama kamu sekarang — cuma butuh 30 detik.
→ catatorder.id/pesanan/baru
```
Purpose: Drive to first action

**Day 1 (If no order created):**
```
{{nama}}, belum sempat catat pesanan?
Tinggal isi nama item dan harga — otomatis rapi!
→ catatorder.id/pesanan/baru
```
Purpose: Nudge to aha moment

**Day 3 (If 1+ orders):**
```
Keren! Kamu sudah catat {{count}} pesanan.
Tau nggak, kamu bisa kirim struk digital ke pelanggan langsung lewat WA?
→ catatorder.id/pesanan
```
Purpose: Feature discovery (receipts)

**Day 3 (If 0 orders):**
```
{{nama}}, pesanan dari WhatsApp makin banyak?
CatatOrder bantu kamu rapikan semuanya. Coba catat 1 pesanan aja dulu.
→ catatorder.id/pesanan/baru
```
Purpose: Re-engagement

**Day 7 (Active users):**
```
Minggu ini sudah {{count}} pesanan tercatat!
Lihat rekap harian kamu dan pantau omset hari ini.
→ catatorder.id/rekap
```
Purpose: Feature discovery (recap)

**Day 7 (Inactive):**
```
{{nama}}, gimana pengalaman pakai CatatOrder?
Ada yang bingung atau kurang? Balas pesan ini, saya bantu.
```
Purpose: Feedback + support

**Day 14 (Inactive):**
```
{{nama}}, ada pesanan yang belum tercatat?
Pelanggan kamu layak dilayani dengan lebih rapi. Balik ke CatatOrder yuk.
→ catatorder.id
```
Purpose: Last re-engagement attempt

**Day 30 (Active, approaching limit):**
```
Bulan ini kamu sudah {{count}} pesanan tercatat!
Mau lanjut tanpa batas? Upgrade ke Plus cuma Rp49K/bulan.
→ catatorder.id/pengaturan
```
Purpose: Convert free → paid

### Key WA Message Design Principles

- Short messages — UMKM owners scan, don't read paragraphs
- Single CTA per message — never give 2 options
- Time-sensitive framing — "sekarang", "hari ini"
- Value-first, not feature-first — "rapikan pesanan" not "fitur manajemen order"
- 100% Bahasa Indonesia, casual register
- No "kami" language — use product name or "saya"
- Include clickable link (auto-linkified in WA)

### Implementation Notes

- For 0-100 users: Manual WA (send yourself via Fonnte dashboard or personal WA)
- After 100+ users: Automate using Fonnte API with cron/scheduled function
- Infrastructure exists: Fonnte is already integrated (`lib/fonnte/client.ts`), just not wired to onboarding

---

## Monthly Value Report (Retention Reinforcement)

### Template

```
REKAP BULANAN - CatatOrder
{{bulan}} {{tahun}}
━━━━━━━━━━━━━━━━━━━━━

Pesanan bulan ini: {{count}}
Total pendapatan tercatat: Rp{{revenue}}
Pelanggan baru: {{new_customers}}

Kamu sudah menghemat ~{{hours}} jam kerja manual bulan ini!

Terima kasih sudah pakai CatatOrder. Ada masukan? Balas pesan ini.

_Dibuat dengan CatatOrder — catatorder.id_
```

### Why This Works

Users see CONCRETE NUMBERS showing value they've received. This increases retention because they realize the product is actually useful. Churn decreases when users can quantify their benefit.

### Timing

End of every month, automatically sent to all active users who had 1+ orders that month.

---

## Usage-Based Nudges (Trigger Messages)

| Trigger | Message | Goal |
|---------|---------|------|
| No input today (active user) | "Jangan lupa catat pesanan hari ini!" | Habit formation |
| Approaching free limit (80%) | "Kamu sudah pakai {{used}} dari 150 pesanan gratis bulan ini." | Pre-conversion awareness |
| Hit free limit | "Kuota pesanan habis. Upgrade ke Plus cuma Rp49K supaya nggak kehabisan." | Convert to paid |
| 7 days inactive | "Lama nggak login! Ada {{count}} pesanan minggu lalu yang belum tercatat?" | Re-engagement |
| Milestone: 10 orders | "Sudah 10 pesanan tercatat! Coba kirim rekap harian ke WA pribadimu." | Feature discovery |
| Milestone: 50 orders | "Wow, 50 pesanan! Bisnis kamu makin rapi. Share CatatOrder ke teman yuk?" | Referral ask |
| Milestone: 100 orders | "100 pesanan tercatat! Terima kasih sudah percaya." | Celebration + retention |

### Implementation

- For 0-100 users: Manual (check usage weekly, send messages by hand)
- After 100+: Automate with cron checking `profiles.orders_used` and `profiles.created_at`

---

## What to Build (Prioritized)

### Priority 1: First-Order Celebration + Guided Next Action

**What:** After first order created, show a modal/bottom sheet instead of just a toast:

```
"Pesanan pertama tercatat!
Sekarang kamu bisa kirim konfirmasi ke pelanggan lewat WA."
[Kirim ke WhatsApp]  [Nanti]
```

**Why:** BukuKas improved activation by 60% with lifecycle-aware UI. The contrast between "messy WA" and "formatted order" IS the aha — but only if the user actually sends the WA message and sees the result.

**Mechanism:** Check if `orders_used === 1` after creation. If yes, show celebration instead of standard toast. Redirect to order detail with "Kirim ke WhatsApp" button highlighted.

**Impact:** HIGH — directly addresses Churn Risk 2 ("I created an order but so what?")

### Priority 2: WA Onboarding Sequence (Day 0/1/3/7)

**What:** Automated WA messages using Fonnte (see full sequence above).

**Why:** WA has 98% open rate. This is the highest-ROI retention channel in Indonesia. Fonnte is already integrated. Directly addresses Churn Risk 3 ("I forgot it exists").

**Mechanism:** New `onboarding_messages` table or lightweight cron checking `profiles.created_at` and `orders_used` to decide which message to send. Manual for first 100 users.

**Impact:** HIGH — addresses Churn Risk 1 and 3

### Priority 3: Business Name Prompt on First Order

**What:** Before or after first order, prompt: "Isi nama bisnismu supaya pesanan terlihat profesional di WA."

**Why:** Without `business_name`, all WA messages have blank signature (`"- "` instead of `"- Toko Kue Bu Ani"`). Makes the viral loop feel broken. Directly addresses Churn Risk 5.

**Mechanism:** In OrderForm or post-creation flow, if `profile.business_name` is null, show a single input field: "Nama bisnis (untuk struk WA)".

**Impact:** HIGH — trivial to build, significant impact on WA message quality and viral loop

### Priority 4: Enhanced Empty State

**What:** Replace plain text empty state with:
- Visual element (emoji or simple inline illustration)
- "Pesanan pertama cuma 30 detik" copy
- Large green CTA button in-content (not just the FAB)
- Optional: "Atau tempel chat WA langsung" secondary CTA

**Why:** The FAB is 56px but positioned in the corner. Low-literacy users may not connect center text to corner button. In-content CTA eliminates spatial disconnect. Addresses Churn Risk 1.

**Impact:** MEDIUM — improves first-session guidance

### Priority 5: 3-Step Onboarding Checklist

**What:** On dashboard (above OrderList), show a collapsible card:
```
Mulai pakai CatatOrder:
[x] Daftar akun
[ ] Catat pesanan pertama
[ ] Kirim konfirmasi ke pelanggan via WA
```
Disappears after all 3 completed.

**Why:** Progress indicators increase completion rates. 3 steps (not more) is the right cognitive load. Shows users there's more to do beyond just creating an order.

**Mechanism:** Derived from existing data: step 1 = always done (they're logged in), step 2 = `orders_used > 0`, step 3 = needs a `first_wa_sent` flag or check.

**Impact:** MEDIUM — addresses Churn Risk 1 and 4

---

## What NOT to Build (Anti-Patterns)

| Anti-Pattern | Why It Fails | Source |
|---|---|---|
| Full tutorial walkthrough | Low-literacy users skip/dismiss. Learning by doing is 3x more effective. | SAGE Journals UI study |
| Feature tour on first login | Overwhelming. Users need ONE thing first, not a tour of everything. | Appcues progressive onboarding |
| Email-based onboarding | 20% open rate vs 98% WA. UMKM don't check business email. | AISensy WA statistics |
| Gamification / badges | Adds complexity. UMKM owners want to run their business, not collect badges. | BukuWarung feature bloat lesson |
| Mandatory profile before first order | Adds friction before value. Prompt business name AFTER first order, not before. | GoBiz "Daftar Mandiri" success |
| Hiding nav items for new users | Confuses returning users who heard about features. Use contextual suggestions instead. | BukuKas lifecycle UI lesson |
| Aggressive upgrade prompts | At masa awal (all free), upgrade prompts are confusing. Wait until limits matter. | BukuKas death spiral lesson |

---

## Referral System (Future — After Activation Is Solved)

### Simple Version (No Tracking Code)

```
"Share CatatOrder ke 1 teman, dapat 1 bulan gratis"
→ User forwards link
→ Friend signs up
→ Original user gets credit
```

### When to Trigger Referral Ask

1. After aha moment (first WA send)
2. After first payment
3. In monthly value report
4. After milestones (50 orders, 100 orders)

### Advanced Version (With Tracking)

- Referral code in dashboard
- Track which friend signed up from which code
- Reward: 1 referral = 1 month free OR Rp25K credit

**Note:** Don't build referral tracking until there are 50+ active users. Manual tracking works before that.

---

## WA Branding URL Fix (Trivial but Critical)

All 11 instances of branding say `_Dibuat dengan CatatOrder_` with **no URL**.

The viral loop research specifies: `_Dibuat dengan CatatOrder (catatorder.id)_` — the URL should be included so recipients can discover the tool. In WhatsApp, URLs are auto-linkified into tappable links.

### Files to Update

- `lib/fonnte/client.ts` — lines 68, 114, 140, 166 (4 message builders)
- `features/orders/components/OrderDetail.tsx` — lines 167, 201, 243 (3 share functions)
- `features/orders/hooks/useOrderWorkflow.ts` — line 133
- `features/receipts/hooks/useReceiptWorkflow.ts` — line 199
- `app/(dashboard)/riwayat/page.tsx` — line 52

**Change:** `_Dibuat dengan CatatOrder_` → `_Dibuat dengan CatatOrder — catatorder.id_`

**Impact:** HIGH — trivial fix, enables the entire viral discovery loop

---

## Implementation Phases

### Phase 1: Quick Wins (1-2 sessions)

1. WA branding URL fix (all 11 instances)
2. Business name prompt on first order creation
3. Enhanced empty state with in-content CTA

### Phase 2: Aha Moment (1 session)

4. First-order celebration modal with "Kirim ke WhatsApp" CTA
5. Add `first_wa_sent` tracking flag to profiles

### Phase 3: Return Loop (2-3 sessions)

6. Manual WA onboarding sequence (Day 0/1/3/7 messages)
7. Monthly value report template (manual send via Fonnte)
8. 3-step onboarding checklist on dashboard

### Phase 4: Automation (When 100+ users)

9. Automated WA drip via Fonnte cron
10. Automated monthly value report
11. Usage-based nudge triggers
12. Referral tracking system

---

## Metrics to Track Weekly

```
AKTIVASI MINGGU INI:
  Signup baru:           [X]
  Buat pesanan pertama:  [X] / [signup] = [%] activation rate
  Kirim WA pertama:      [X] / [signup] = [%] value loop completion
  Aktif (login 2x+):    [X]
  Churn (7d inactive):  [X]

RETENTION:
  Day-1 retention:       [X]%
  Day-7 retention:       [X]%

AHA MOMENT:
  Median time to first order: [X] minutes
  % who send first WA: [X]%
```

Review every Friday. 30 minutes. Course-correct weekly, not monthly.

---

## Sources

### Industry Data
- Lenny's Newsletter — SaaS activation rate benchmarks (34% average, 25% median)
- Userpilot — Time to Value Benchmark Report 2024 (median ~1 day)
- ChartMogul — SaaS Retention Report (2.7% achieve > 100% NRR at < $10 ARPU)
- First Page Sage — Freemium conversion rates (3-5% for < $10 ARPU)
- ProductLed — PLG activation metrics (20-40% target)
- BCG — Indonesia Fintech Industry Report (30% UMKM willing to pay for SaaS)
- Dollar Pocket — SaaS Pricing Benchmarks (localized pricing converts 34% better)

### WhatsApp Data
- Wapikit — Global WhatsApp Business Statistics 2025 (112M users Indonesia)
- AISensy — 50 WhatsApp Business Statistics (98% open rate)
- YCloud — 100+ WhatsApp Statistics 2026

### Competitor Analysis
- CleverTap — BukuKas Case Study (60% activation improvement)
- Branch — BukuKas Co-founder Interview (WhatsApp-as-infrastructure strategy)
- The Runway Ventures — Lummo Collapse Analysis ($140M burned)
- ANTARA News — GoBiz "Daftar Mandiri" Innovation
- Majoo — SaaS Innovation for UMKM (45K+ paying users)
- GetLatka — Majoo Revenue ($79.6M in 2024)
- Warta Ekonomi — BukuWarung Roadshow

### UX Research
- SAGE Journals — UI Design for Low-Literate Users (structured affordance-based cueing)
- ACM — Actionable UI Guidelines for Low-Literate Users
- UXPin — Empty State UX Best Practices
- Userpilot — Empty State Design in SaaS
- Appcues — Aha Moment Guide, Progressive Onboarding, Mobile Onboarding
- Chameleon — Successful User Onboarding
- UXCam — 10 Apps with Great Onboarding
- UserOnBoarding Academy — Progressive Onboarding
- Plotline — In-App Nudges Ultimate Guide
- CleverTap — Welcome Push Notifications
- Insaim Design — SaaS Onboarding Best Practices 2025 (500ms delay = 8% activation drop)

### Indonesian Market
- Market Research Indonesia — Digital SME Adoption Accelerating (63% use digital tools)
- Semantic Scholar — Digital Transformation of MSMEs
- UNAS Journal — Transformation of UMKM in Digital Era

### WA Drip Campaign Design
- Whautomate — Ultimate Guide to WhatsApp Drip Campaigns
- Gallabox — WhatsApp Drip Marketing
- Zixflow — WhatsApp Drip Campaigns
- Interakt — Send WhatsApp Drip Campaign
- Zoko — Ultimate Guide WhatsApp Drip Marketing

### Retention & Churn
- Vitally — SaaS Churn Rate Benchmarks
- Amplitude — What is Activation Rate
- ProductLed — Activation Velocity at Shopify

---

*This document synthesizes the B2 audit findings, industry research, competitor analysis, and code audit into a single actionable reference for building activation support in CatatOrder.*
