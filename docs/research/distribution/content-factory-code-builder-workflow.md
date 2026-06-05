# CatatOrder: Content Factory + Code Builder — Complete Workflow Design

> **Deep dive analysis: The optimal workflow for using Claude Code as a content production engine AND code builder for CatatOrder distribution**
>
> Research date: 2026-02-27

---

## Table of Contents

1. [Chain of Thought: Why This Matters](#why-this-matters)
2. [Current State Assessment](#current-state)
3. [All Decisions That Need To Be Made](#all-decisions)
4. [Content Factory: Complete Pipeline Design](#content-factory)
5. [Code Builder: Complete Technical Spec](#code-builder)
6. [The Unified Workflow: Content Factory + Code Builder](#unified-workflow)
7. [Weekly Schedule for a Solo Founder](#weekly-schedule)
8. [Implementation Sequence (What to Build First)](#implementation-sequence)
9. [Risk Analysis & Mitigation](#risks)

---

## 1. Chain of Thought: Why This Matters {#why-this-matters}

**The reasoning chain:**

1. CatatOrder is a $3-6/month SaaS → max CAC $12-24
2. Traditional paid acquisition burns cash fast at this price point
3. The two highest-ROI strategies are: (a) content that compounds over time (SEO, social), and (b) product features that grow themselves (virality, referrals)
4. A solo founder can't manually produce enough content OR build enough growth features
5. Claude Code can be both: a **content factory** (producing 20-40 content pieces/month) AND a **code builder** (building referral systems, onboarding bots, programmatic pages)
6. But doing both at once without a clear workflow leads to chaos
7. Therefore: we need a **single unified workflow** that alternates between content production and code building, with clear decision points

**The core insight:** Content factory and code builder are NOT separate workstreams. They are **interdependent**. The code builder creates infrastructure (blog system, referral tracking, city pages) that the content factory then fills. The content factory creates demand (blog traffic, social awareness) that the code builder converts (onboarding bot, upgrade prompts).

---

## 2. Current State Assessment {#current-state}

### What Exists (Verified in Codebase)

| Component | Status | Location | Implication |
|-----------|--------|----------|-------------|
| Blog posts | 5 articles, hardcoded page.tsx | `app/(marketing)/blog/` | **BLOCKER** — can't scale content without fixing this |
| Blog index | Hardcoded posts array | `app/(marketing)/blog/page.tsx:16-62` | Must migrate to dynamic |
| WA branding | "Dibuat dengan CatatOrder" | `lib/utils/wa-messages.ts:5` | Viral loop foundation EXISTS |
| UTM tracking | Full implementation | `lib/analytics.ts:3-56` | Analytics-ready |
| Events table | Exists with UTM columns | `supabase/migrations/019_create_events.sql` | Can track everything |
| Products table | Exists | `supabase/migrations/018_create_products.sql` | Menu digitization ready |
| WA bot | Code-complete | `lib/wa-bot/` | **BLOCKED** by WABA verification |
| Referral system | Does NOT exist | — | Must build from scratch |
| Programmatic pages | Do NOT exist | — | Must build from scratch |
| Sitemap | Dynamic | `app/sitemap.ts` | Ready for new pages |
| SEO keywords | 32 keywords configured | `config/site.ts` | Good foundation |
| Plans | 3 tiers (Gratis/Warung/Toko) | DB schema | Pricing exists |
| Database | 14+ tables, 19 migrations | `supabase/migrations/` | Mature schema |

### What's Blocking Scale

```
CRITICAL PATH:

Blog is hardcoded page.tsx
    → Can't produce 10+ posts/month
    → Can't do programmatic SEO
    → Can't automate content publishing
    → MUST migrate to MDX or CMS first

WA bot is WABA-restricted
    → Onboarding bot can't launch
    → WA drip sequences can't run
    → Referral invite via WA blocked
    → MUST complete Meta Business Verification

No referral system
    → Zero viral growth mechanism (besides WA branding)
    → No way to incentivize word-of-mouth
    → MUST build from scratch
```

---

## 3. All Decisions That Need To Be Made {#all-decisions}

### DECISION 1: Blog Content System Architecture

**The question:** How should blog content be stored and rendered?

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **A. MDX files in repo** | Git-based, version controlled, Claude Code can write directly, fast builds, no external dependency | Need to set up MDX pipeline, content lives in repo | 4-6 hours |
| **B. Headless CMS (Sanity/Contentful)** | Visual editor, non-dev can publish, image handling built-in | External dependency, cost ($), API calls slow builds, Claude Code can't write directly | 8-12 hours |
| **C. Supabase as CMS** | Already using Supabase, no new dependency, Claude Code can write via MCP | No visual editor, must build admin UI, slower than file-based | 6-8 hours |
| **D. Keep page.tsx but use template** | Simplest change, keep current architecture | Still can't scale efficiently, each post needs manual routing | 2-3 hours |

**Recommendation: Option A — MDX files in repo**

Reasoning:
- Claude Code writes MDX files directly to `content/blog/` → `git push` → deployed
- No external dependency or cost
- `next-mdx-remote` or `@next/mdx` handles rendering
- Frontmatter for metadata (title, date, description, keywords, tags)
- `generateStaticParams()` for dynamic routing
- Programmatic city pages use the same MDX pattern
- ISR (Incremental Static Regeneration) for fast updates

**Sub-decisions for Option A:**

| Sub-decision | Options | Recommendation |
|-------------|---------|----------------|
| MDX library | `next-mdx-remote` vs `@next/mdx` vs `contentlayer` | `next-mdx-remote` — most flexible, works with App Router |
| Content directory | `content/blog/` vs `app/(marketing)/blog/[slug]/` | `content/blog/` — separation of content from code |
| Frontmatter schema | What fields? | `title`, `description`, `date`, `tags[]`, `keywords[]`, `image`, `author`, `canonical` |
| Image handling | Local `public/blog/` vs external CDN | Local `public/blog/` — simple, free on Vercel |
| Code highlighting | `rehype-highlight` vs `rehype-pretty-code` vs none | None initially — blog posts are business content, not technical |
| Table of contents | Auto-generate from headings? | Yes — use `remark-toc` plugin |
| Reading time | Calculate automatically? | Yes — use `reading-time` remark plugin |
| Related posts | Manual or auto? | Manual via frontmatter `relatedPosts: [slug1, slug2]` |

---

### DECISION 2: Programmatic SEO Page Architecture

**The question:** How to implement city-specific landing pages at scale?

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **A. Dynamic route with data file** | Single template, data in JSON/TS, Claude Code generates data | All pages look similar, limited customization | 3-4 hours |
| **B. MDX per city** | Each city page can be unique, rich content, good for SEO | More work per city, larger repo | 4-6 hours |
| **C. Hybrid (template + optional MDX override)** | Best of both: consistent base + custom content when needed | More complex to build | 6-8 hours |

**Recommendation: Option A first, upgrade to C later**

Start simple:
- Route: `app/(marketing)/kota/[city]/page.tsx`
- Data: `data/cities.ts` with city name, population, F&B stats, local keywords
- Template renders: "Aplikasi Catat Pesanan WhatsApp di {City}" with city-specific stats
- `generateStaticParams()` returns all cities
- `generateMetadata()` creates unique SEO metadata per city

**Sub-decisions:**

| Sub-decision | Options | Recommendation |
|-------------|---------|----------------|
| Number of cities | 10 / 34 provinces / 500+ kabupaten | Start with **34 provincial capitals** → expand to kabupaten later |
| URL pattern | `/kota/[city]` vs `/[city]` vs `/aplikasi-pesanan-[city]` | `/kota/[city]` — clear hierarchy, won't conflict with other routes |
| Unique content per city | Same template / unique intro / fully unique | Same template with **city-specific stats + local testimonial slot** |
| Internal linking | Auto-link from blog posts to nearest city? | Yes — blog posts mention cities → auto-link to city pages |
| Schema markup | LocalBusiness vs SoftwareApplication | `SoftwareApplication` with `areaServed` per city |

---

### DECISION 3: Referral System Design

**The question:** What type of referral program, what rewards, what tracking?

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **A. Double-sided (both get 1 free month)** | Proven model, strong incentive both sides | Revenue cost = 2 months per referral | 6-8 hours |
| **B. One-sided (referrer gets 1 free month)** | Simpler, lower cost per referral | Less incentive for referred user | 5-7 hours |
| **C. Credit-based (referrer gets Rp credits)** | Flexible, can use credits for anything | More complex, needs credit system | 8-10 hours |
| **D. Tiered (more referrals = bigger rewards)** | Gamification, super-referrers emerge | More complex tracking, communication | 10-12 hours |

**Recommendation: Option A — Double-sided (1 free month each)**

Reasoning:
- At ARPU Rp 49-99K, giving away 2 months costs Rp 98-198K per successful referral
- If referred user stays 6+ months, ROI is 3-6x
- "Ajak teman, kalian berdua dapat 1 bulan GRATIS" is a simple, compelling message
- WA-native sharing makes this trivially easy to distribute

**Sub-decisions:**

| Sub-decision | Options | Recommendation |
|-------------|---------|----------------|
| Referral code format | Username-based (`/r/warungbudi`) vs random (`/r/X7K9M2`) vs phone-based | **Username-based** — memorable, shareable in WA, doubles as vanity URL |
| Attribution window | 7 days / 30 days / forever | **30 days** — standard, fair, trackable |
| Reward trigger | On signup / on first payment / after 7 days active | **On first payment** — prevents gaming, ensures quality |
| Max referrals | Unlimited / capped at 12 (1 year free) / monthly cap | **Unlimited** — don't limit super-referrers, they're your best salespeople |
| Referral tracking | Server-side cookie / URL param / both | **URL param (`?ref=username`)** + server-side storage — WA doesn't support cookies well |
| Fraud prevention | IP dedup / email dedup / phone dedup | **Phone dedup** — each WA number can only be referred once |
| Dashboard | Referrer sees stats? | Yes — simple page showing: referral link, total referred, pending, rewarded |
| Notification | When referral converts? | WA message to referrer: "Teman kamu baru upgrade! Kamu dapat 1 bulan gratis" |

**Database schema (to build):**

```sql
-- referral_codes table
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,  -- username-based
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id),
  referred_id UUID REFERENCES profiles(id),
  referral_code_id UUID REFERENCES referral_codes(id),
  status TEXT DEFAULT 'pending',  -- pending, converted, rewarded, expired
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  UNIQUE(referred_id)  -- each user can only be referred once
);

-- referral_rewards table
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  referral_id UUID REFERENCES referrals(id),
  reward_type TEXT DEFAULT 'free_month',
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### DECISION 4: Content Production Frequency & Mix

**The question:** How many pieces of content per week, and what types?

| Content Type | Effort per Piece | SEO Value | Social Value | Conversion Value |
|-------------|-----------------|-----------|-------------|-----------------|
| Blog post (1,500-2,000 words) | 20 min (Claude) + 15 min (review) | HIGH | Medium | Medium |
| City page | 5 min (Claude) + 5 min (review) | HIGH | Low | High |
| TikTok script | 5 min (Claude) + 2 hr (record/edit) | None | HIGH | Medium |
| Instagram carousel | 10 min (Claude) + 30 min (design) | None | HIGH | Medium |
| WA group tip | 3 min (Claude) + 1 min (post) | None | Medium | Low |
| WA broadcast | 3 min (Claude) + 1 min (send) | None | Low | Medium |
| Ad copy variation | 5 min (Claude) + 5 min (upload) | None | None | HIGH |

**Recommendation: Weekly production targets**

| Content Type | Per Week | Per Month | Claude Code Time | Human Time |
|-------------|----------|-----------|-----------------|------------|
| Blog posts | 2 | 8-10 | 40 min | 2.5 hours (review + publish) |
| City pages | 5 (first month: 34) | 5-10 | 25 min | 50 min |
| TikTok scripts | 3 | 12 | 15 min | 6 hours (record/edit) |
| IG carousels | 2 | 8 | 20 min | 2 hours (design) |
| WA group tips | 5 | 20 | 15 min | 25 min |
| WA broadcasts | 2 | 8 | 6 min | 8 min |
| Ad copy batches | 1 batch (10 variants) | 1-2 batches | 15 min | 30 min |
| **TOTAL** | | | **~2.5 hrs/month** | **~12 hrs/month** |

**Sub-decisions:**

| Sub-decision | Options | Recommendation |
|-------------|---------|----------------|
| Blog language | Bahasa only / English only / bilingual | **Bahasa Indonesia only** — 2.7x more engagement, 100% of target market |
| Blog tone | Formal / conversational / mixed | **Conversational** ("lu/gue" casual Jakarta Indonesian) — matches F&B UMKM owners |
| Blog length | 800 / 1,500 / 2,500 words | **1,500-2,000 words** — sweet spot for SEO + readability |
| Keyword strategy | Head terms / long-tail / question-based | **Long-tail + question-based** — lower competition, higher intent |
| Content pillar topics | How many pillars? | **4 pillars**: (1) Order Management, (2) Digital Receipts/Struk, (3) Business Growth Tips, (4) WhatsApp Business |
| TikTok content style | Educational / comedy / before-after / POV | **Before-after + POV** — "POV: orderan masuk 50 tapi kamu pake CatatOrder" |
| Carousel format | Problem-solution / tips list / comparison / tutorial | **Problem-solution** — slide 1: problem, slides 2-6: solution steps, slide 7: CTA |

---

### DECISION 5: WA Onboarding Bot Flow

**The question:** What's the optimal conversation flow for the onboarding bot?

**Context:** WA bot code is complete in `lib/wa-bot/` but blocked by WABA verification. Design now, deploy when unblocked.

**Recommended flow (state machine):**

```
START
  ├─→ [User sends first message or clicks referral link]
  ├─→ WELCOME
  │     "Halo! 👋 Selamat datang di CatatOrder.
  │      Mau langsung coba catat pesanan pertama?"
  │     [Ya, langsung!] → SETUP_MENU
  │     [Mau tau dulu] → EXPLAIN
  │
  ├─→ EXPLAIN
  │     "CatatOrder bantu kamu catat semua pesanan WA
  │      dalam 1 dashboard. Nggak ada lagi yang kelewat."
  │     [Cobain sekarang] → SETUP_MENU
  │     [Lihat fitur] → FEATURES
  │
  ├─→ FEATURES
  │     Interactive list of features with buttons
  │     [Mulai sekarang] → SETUP_MENU
  │
  ├─→ SETUP_MENU
  │     "Oke! Pertama, kasih tau nama usaha kamu"
  │     [User types business name] → SETUP_CATEGORY
  │
  ├─→ SETUP_CATEGORY
  │     "Usaha kamu di bidang apa?"
  │     [Makanan] [Minuman] [Katering] [Lainnya]
  │     → SETUP_PRODUCT
  │
  ├─→ SETUP_PRODUCT
  │     "Mau tambahin produk pertama kamu?
  │      Kirim nama produk + harganya."
  │     [User sends product] → confirm → SETUP_COMPLETE
  │     [Nanti aja] → SETUP_COMPLETE
  │
  ├─→ SETUP_COMPLETE
  │     "Mantap! Usaha kamu udah siap.
  │      Sekarang tiap ada pesanan, tinggal forward ke sini.
  │      Mau coba kirim pesanan pertama?"
  │     → FIRST_ORDER or END
  │
  └─→ DRIP_SEQUENCE (automated follow-ups)
        Day 0: Setup completion confirmation
        Day 1: "Udah ada pesanan masuk? Kirim aja ke sini"
        Day 3: "💡 Tips: Kamu bisa kirim struk digital ke pelanggan"
        Day 7: "📊 Ini rekap mingguan kamu. Mau lihat dashboard lengkap?"
        Day 14: "🚀 Upgrade ke Warung buat fitur lengkap — cuma Rp 49K/bulan"
        Day 30: "Gimana CatatOrder selama sebulan? Ada masukan?"
```

**Sub-decisions:**

| Sub-decision | Options | Recommendation |
|-------------|---------|----------------|
| Bot persona | Formal / friendly / playful | **Friendly** — like a helpful teman, casual Bahasa |
| State storage | In-memory / Redis / PostgreSQL | **PostgreSQL** (Supabase) — already exists, persistent, queryable |
| Timeout handling | Auto-expire sessions after X hours | **24 hours** — resume where left off if they come back |
| Error handling | Retry / fallback to human / ignore | **Fallback message** + log for human review |
| Menu digitization | Photo OCR / manual input / template | **Manual input** first (type product name + price), add photo OCR later |
| Multi-language | Bahasa only / auto-detect / ask | **Bahasa only** — 100% of target market |
| Analytics events | What to track? | `bot_start`, `bot_setup_complete`, `bot_first_order`, `bot_drop_off_at_{stage}` |

---

### DECISION 6: "Powered By" Viral Footer Optimization

**The question:** The footer exists but how to maximize its viral potential?

**Current state:** `_Dibuat dengan CatatOrder — catatorder.id_` in `lib/utils/wa-messages.ts:5`

**Sub-decisions:**

| Sub-decision | Options | Recommendation |
|-------------|---------|----------------|
| CTA text | Current / "Coba gratis" / "Mulai dari Rp 0" / A/B test | **A/B test 3 variants** — measure click-through rate |
| Link format | `catatorder.id` / `catatorder.id/?ref=STORENAME` / short link | **`catatorder.id/?ref=STORENAME`** — automatic referral tracking per store |
| Link tracking | UTM only / referral code / both | **Both** — UTM for analytics, ref code for reward attribution |
| Frequency | Every message / only receipts / configurable | **Every receipt + order confirmation** (not every single message — too spammy) |
| Opt-out for paid | Let paid users remove branding? | **No** — even paid users keep it. This is the #1 growth engine. Maybe remove at Rp 199K+ tier |

**Recommended A/B test variants:**

```
A: "_Dibuat dengan CatatOrder — catatorder.id_"  (current)
B: "_✨ Catat pesanan WA otomatis → catatorder.id_"
C: "_📱 Nggak mau ketinggalan pesanan? catatorder.id — Gratis!_"
```

---

### DECISION 7: Analytics & Attribution Architecture

**The question:** How to track the full funnel from content → signup → activation → payment?

**Current state:** UTM tracking exists (`lib/analytics.ts`) + events table. But no funnel visualization.

**Sub-decisions:**

| Sub-decision | Options | Recommendation |
|-------------|---------|----------------|
| Analytics tool | Custom only / Fathom / Plausible / Google Analytics | **Fathom** ($14/mo) — privacy-first, simple, Indonesian traffic-friendly. Keep custom events for internal |
| Attribution model | First-touch / last-touch / multi-touch | **First-touch** — at this stage, knowing which channel brought them is most valuable |
| Funnel stages | What to track? | `visit` → `signup` → `setup_complete` → `first_order` → `7_day_active` → `paid` |
| Referral attribution | Separate from UTM or combined? | **Combined** — `?utm_source=referral&utm_medium=wa&ref=USERNAME` |
| Reporting frequency | Real-time / daily / weekly | **Weekly** — solo founder doesn't need real-time. Claude Code generates weekly report. |
| Dashboard | Custom admin / Fathom / Supabase dashboard | **Fathom for traffic** + **custom admin page for business metrics** (already exists at admin route) |

---

### DECISION 8: A/B Testing Infrastructure

**The question:** How sophisticated should A/B testing be?

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **A. No A/B testing** | Zero effort | No optimization data | 0 hours |
| **B. Manual A/B (alternate by day)** | Simple, no code needed | Not statistically rigorous | 0 hours |
| **C. Feature flags with Supabase** | Full control, server-side, queryable | Must build flag system | 4-6 hours |
| **D. External tool (PostHog/LaunchDarkly)** | Professional, proven | External dependency, cost | 2-3 hours |

**Recommendation: Option B now, upgrade to C when traffic justifies it**

At current scale (early stage), alternate blog post CTAs, landing page headlines, and WA footer text by day/week. Track which performs better via events table. Build proper A/B testing when you have 1,000+ monthly visitors.

---

### DECISION 9: Email Marketing System

**The question:** Should CatatOrder have email marketing alongside WA?

| Option | Pros | Cons |
|--------|------|------|
| **A. No email** | Zero maintenance, WA-first aligns with market | Missing blog subscribers, nurture sequences |
| **B. Basic email capture only** | Collect emails for future use, low effort | No immediate ROI |
| **C. Full email marketing** | Nurture sequences, blog digests, retention campaigns | Time-consuming, most UMKM owners don't check email often |

**Recommendation: Option B — Capture emails on blog, don't build sequences yet**

Indonesian UMKM owners live on WhatsApp, not email. But capturing emails on the blog is near-zero effort and creates an asset for later. Add a simple "Mau tips bisnis mingguan? Daftar gratis" form on blog posts. Store in Supabase.

---

### DECISION 10: Content Calendar & Publishing Workflow

**The question:** How to organize content production across all channels?

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **A. Notion** | Visual, collaborative, many templates | External dependency, manual sync | 1-2 hours setup |
| **B. GitHub Issues** | In-repo, Claude Code can manage via CLI | Not visual, poor calendar view | 0 hours |
| **C. Simple markdown file** | In-repo, Claude Code writes directly, zero friction | No calendar view, manual tracking | 30 min |
| **D. Notion MCP** | Claude Code can read/write, visual | MCP setup complexity | 2-3 hours |

**Recommendation: Option C — Markdown file in repo**

Create `content/calendar.md` that Claude Code updates each week. Simple table format:

```markdown
## Week of 2026-03-03

| Day | Content | Type | Status | Channel |
|-----|---------|------|--------|---------|
| Mon | "5 Kesalahan Catat Pesanan" | Blog | draft | SEO |
| Tue | Before/after TikTok script | Script | ready | TikTok |
| Wed | City page: Surabaya | City | published | SEO |
| Thu | "Tips harga menu" carousel | Carousel | draft | Instagram |
| Fri | WA broadcast: weekly tip | Broadcast | scheduled | WhatsApp |
```

---

## 4. Content Factory: Complete Pipeline Design {#content-factory}

### The 7-Stage Content Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTENT FACTORY PIPELINE                         │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 1.IDEATE │→│ 2.RESEARCH│→│ 3.CREATE  │→│ 4.REVIEW  │          │
│  │ Claude   │  │ Claude   │  │ Claude   │  │ HUMAN    │          │
│  │ + kwrds  │  │ + Apify  │  │ + Write  │  │ 15 min   │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│       │                                          │                  │
│       │              ┌──────────┐  ┌──────────┐  │                  │
│       │              │ 7.MEASURE│←│ 6.AMPLIFY │←┘                  │
│       │              │ Claude   │  │ Claude   │                     │
│       │              │ + GA     │  │ + social │  ┌──────────┐      │
│       │              └──────────┘  └──────────┘←│ 5.PUBLISH │      │
│       │                    │                     │ HUMAN    │      │
│       └────────────────────┘ (feedback loop)     │ git push │      │
│                                                  └──────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### Stage 1: IDEATE (Claude Code)

**Input:** Previous performance data, keyword research, competitor gaps
**Output:** Content calendar for the week

**Claude Code workflow:**
```
1. Read content/calendar.md — what's been published?
2. Query kwrds.ai MCP — what keywords have volume + low competition?
3. Read existing blog posts — what topics haven't been covered?
4. Check competitor content (if Apify MCP configured)
5. Generate 10 topic ideas with working titles
6. Score by: search volume × relevance × uniqueness
7. Pick top 5 for the week
8. Write to content/calendar.md
```

**Decision point:** Human reviews calendar before production begins. Can swap/reprioritize.

### Stage 2: RESEARCH (Claude Code)

**Input:** Approved topic from calendar
**Output:** Research brief with sources, data points, competitor analysis

**Claude Code workflow:**
```
1. Search kwrds.ai for primary + related keywords
2. Fetch top 3 SERP results (WebFetch or Apify MCP)
3. Analyze competitor content: word count, headings, questions answered
4. Identify content gap: what do competitors miss?
5. Find Indonesian-specific data points (stats, quotes)
6. Write research brief to content/research/[topic-slug].md
```

### Stage 3: CREATE (Claude Code)

**Input:** Research brief
**Output:** Complete content piece (MDX blog post, TikTok script, carousel text, etc.)

**Claude Code workflow for BLOG POST:**
```
1. Read research brief
2. Write 1,500-2,000 word blog post in Bahasa Indonesia
3. Format as MDX with frontmatter:
   ---
   title: "..."
   description: "..." (155 chars max)
   date: "2026-MM-DD"
   tags: ["pesanan", "whatsapp"]
   keywords: ["catat pesanan wa", "order management"]
   image: "/blog/[slug]-og.png"
   ---
4. Include:
   - H2/H3 headers optimized for keywords
   - FAQ section (3-5 questions → FAQ schema)
   - Internal links to existing content
   - CTA: "Coba CatatOrder gratis →"
   - Reading time calculation
5. Save to content/blog/[slug].mdx
```

**Claude Code workflow for TIKTOK SCRIPT:**
```
1. Read research brief or topic from calendar
2. Write script with structure:
   - Hook (0-3s): Attention-grabbing first line
   - Problem (3-10s): Pain point F&B owner feels
   - Solution (10-25s): How CatatOrder solves it
   - CTA (25-30s): "Link di bio / catatorder.id"
3. Write caption with hashtags
4. Save to content/tiktok/[slug].md
```

**Claude Code workflow for INSTAGRAM CAROUSEL:**
```
1. Read topic from calendar
2. Write 7-slide carousel:
   - Slide 1: Hook/question (big text)
   - Slides 2-5: Solution steps
   - Slide 6: Before/after comparison
   - Slide 7: CTA + branding
3. Write caption with hashtags
4. Save to content/instagram/[slug].md
```

**Content Waterfall — 1 blog post → 15+ pieces:**
```
1 blog post "5 Kesalahan Catat Pesanan WA"
    ├→ 1 TikTok script (60s version)
    ├→ 1 TikTok script (15s hook version)
    ├→ 1 Instagram carousel (7 slides)
    ├→ 1 Instagram single-image post
    ├→ 3 WA group tips (1 per key point)
    ├→ 1 WA broadcast message
    ├→ 2 Tweet/Threads posts
    ├→ 1 Facebook group post
    ├→ 3 Ad copy variations (for Meta Ads)
    └→ 1 Email newsletter blurb (when ready)
    = 15 content pieces from 1 blog post
```

**Claude Code skill for content waterfall:**
```
Prompt: "Take blog post [slug] and generate all derivative content pieces"
Output: All 15 pieces saved to respective content/ subdirectories
```

### Stage 4: REVIEW (Human)

**Input:** Draft content from Claude Code
**Output:** Approved content (with edits if needed)

**Human workflow (15 min per blog post):**
```
1. Read the generated MDX file
2. Check for:
   - Accuracy (no false claims about CatatOrder features)
   - Tone (casual Bahasa, not robotic)
   - Cultural relevance (references make sense for Indonesian audience)
   - CTA alignment (links to correct pages)
3. Quick edit in VS Code / directly in the MDX file
4. Mark as "ready" in content/calendar.md
```

**Quality control checklist:**
- [ ] No AI-sounding phrases ("dalam era digital", "di zaman modern ini")
- [ ] Uses "kamu/lo" not "Anda" (casual tone)
- [ ] Mentions real scenarios F&B owners face
- [ ] CTA links are correct and working
- [ ] Keywords appear naturally, not stuffed
- [ ] No competitor names mentioned negatively
- [ ] Images have alt text

### Stage 5: PUBLISH (Human — 5 min)

**Workflow:**
```bash
# Review the content
git diff

# Commit and push
git add content/blog/[slug].mdx
git commit -m "Add blog post: [title]"
git push

# Vercel auto-deploys on push
# Sitemap auto-updates via app/sitemap.ts
```

**Note:** After blog system migration to MDX, new blog posts deploy automatically on `git push`. No manual work beyond the push.

### Stage 6: AMPLIFY (Claude Code)

**Input:** Published blog post
**Output:** All derivative social content scheduled for the week

**Claude Code workflow:**
```
1. Read the published blog post
2. Run content waterfall → generate 15 derivative pieces
3. Save all to content/ subdirectories
4. Update content/calendar.md with posting schedule
5. (If Metricool MCP configured) Schedule social posts
```

**Human posts manually to:**
- TikTok (record video using the script)
- Instagram (create visual using carousel text)
- WA groups (copy-paste the tips)
- Facebook groups (copy-paste the posts)

### Stage 7: MEASURE (Claude Code)

**Input:** 1 week of published content performance
**Output:** Performance report + insights for next week

**Claude Code workflow (weekly):**
```
1. (If Google Analytics MCP configured) Pull traffic data
2. (If Fathom configured) Check page views per blog post
3. Read events table via Supabase MCP — conversion events
4. Calculate:
   - Blog post views per article
   - Top performing content
   - UTM source breakdown
   - Signup conversion rate by source
5. Generate weekly report to content/reports/week-[date].md
6. Feed insights back to Stage 1 for next week
```

---

## 5. Code Builder: Complete Technical Spec {#code-builder}

### Priority Order (What to Build First)

Based on **impact × effort × dependency chain**:

```
PHASE 1: INFRASTRUCTURE (Week 1-2) — enables everything else
  1. Blog MDX migration [4-6 hrs] ← content factory BLOCKED without this
  2. Programmatic city pages [3-4 hrs] ← instant SEO boost

PHASE 2: GROWTH LOOPS (Week 3-4) — builds viral mechanisms
  3. Referral system [6-8 hrs] ← the primary growth engine
  4. "Powered by" optimization [2-3 hrs] ← optimize existing viral loop

PHASE 3: CONVERSION (Week 5-6) — converts visitors to users
  5. Landing page A/B testing [3-4 hrs] ← test headlines, CTAs
  6. Upgrade prompts [2-3 hrs] ← free → paid conversion

PHASE 4: AUTOMATION (When WABA unblocks)
  7. WA onboarding bot [4-6 hrs] ← automated 24/7 activation
  8. WA drip sequence [3-4 hrs] ← retention + upgrade nudges
  9. Email capture + basic nurture [2-3 hrs] ← blog subscriber list
```

### BUILD 1: Blog MDX Migration

**Goal:** Replace hardcoded page.tsx blog posts with MDX-based dynamic blog system.

**Technical spec:**

```
Files to create:
  content/blog/
    pesanan-wa-numpuk.mdx         (migrate existing)
    format-order-whatsapp.mdx     (migrate existing)
    struk-digital-tanpa-printer.mdx
    rekap-penjualan-harian.mdx
    orderan-lebaran-numpuk.mdx

  app/(marketing)/blog/[slug]/page.tsx    (dynamic route)
  lib/mdx.ts                              (MDX utilities)

Files to modify:
  app/(marketing)/blog/page.tsx           (read from content/ instead of hardcoded array)
  app/sitemap.ts                          (include MDX blog posts)
  package.json                            (add next-mdx-remote, gray-matter, reading-time)

Files to delete:
  app/(marketing)/blog/pesanan-wa-numpuk/page.tsx
  app/(marketing)/blog/format-order-whatsapp/page.tsx
  app/(marketing)/blog/struk-digital-tanpa-printer/page.tsx
  app/(marketing)/blog/rekap-penjualan-harian/page.tsx
  app/(marketing)/blog/orderan-lebaran-numpuk/page.tsx
```

**Key code patterns:**

```typescript
// lib/mdx.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export function getAllPosts() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
  return files.map(file => {
    const { data } = matter(fs.readFileSync(path.join(BLOG_DIR, file), 'utf8'))
    return { slug: file.replace('.mdx', ''), ...data }
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getPost(slug: string) {
  const file = fs.readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), 'utf8')
  const { data, content } = matter(file)
  return { frontmatter: data, content }
}
```

```typescript
// app/(marketing)/blog/[slug]/page.tsx
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPost, getAllPosts } from '@/lib/mdx'

export async function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }) {
  const { frontmatter } = getPost(params.slug)
  return {
    title: frontmatter.title,
    description: frontmatter.description,
    // ... full SEO metadata
  }
}
```

### BUILD 2: Programmatic City Pages

**Goal:** Create 34 city-specific landing pages for SEO.

**Technical spec:**

```
Files to create:
  data/cities.ts                           (city data: name, population, F&B stats)
  app/(marketing)/kota/[city]/page.tsx     (dynamic route + template)

Files to modify:
  app/sitemap.ts                           (include city pages)
```

**City data structure:**

```typescript
// data/cities.ts
export const cities = [
  {
    slug: "jakarta",
    name: "Jakarta",
    province: "DKI Jakarta",
    population: "10.6 juta",
    umkmCount: "1.2 juta+",
    fbBusinesses: "200K+",
    localTerm: "warung makan Jakarta",
    testimonialSlot: true,
  },
  {
    slug: "surabaya",
    name: "Surabaya",
    province: "Jawa Timur",
    // ...
  },
  // ... 34 cities total
]
```

### BUILD 3: Referral System

**Goal:** Complete double-sided referral system (ajak teman, berdua dapat 1 bulan gratis).

**Technical spec:**

```
Database (Supabase migrations):
  020_create_referral_system.sql
    - referral_codes table
    - referrals table
    - referral_rewards table
    - RLS policies
    - Indexes

Files to create:
  app/(app)/referral/page.tsx              (referral dashboard for logged-in users)
  app/api/referral/generate/route.ts       (generate referral code)
  app/api/referral/track/route.ts          (track referral click)
  app/api/referral/convert/route.ts        (convert referral on payment)
  app/(marketing)/r/[code]/page.tsx        (referral landing page — redirects to signup with ref param)
  lib/referral.ts                          (referral utilities)

Files to modify:
  app/(marketing)/page.tsx                 (capture ?ref= param)
  app/(app)/layout.tsx                     (show referral link in sidebar/nav)
  lib/analytics.ts                         (track referral events)
```

### BUILD 4: "Powered By" Optimization

**Goal:** Maximize click-through rate from WA message footer.

**Technical spec:**

```
Files to modify:
  lib/utils/wa-messages.ts                 (A/B test footer text, add ref= tracking)
  lib/analytics.ts                         (track "powered_by_click" event)

Logic:
  1. Each store gets a unique ref code (from referral system)
  2. Footer includes: "Dibuat dengan CatatOrder — catatorder.id/?ref={STORE_CODE}"
  3. Track clicks by store → attribute new signups to referring store
  4. Auto-reward referring store when new signup pays
```

### BUILD 5: Landing Page A/B Testing

**Goal:** Test different headlines, CTAs, and hero sections on the marketing page.

**Technical spec (simple version):**

```
Files to modify:
  app/(marketing)/page.tsx                 (add variant logic)
  lib/analytics.ts                         (track variant impressions + conversions)

Logic:
  1. On page load, assign visitor to variant A or B (50/50 based on random)
  2. Store variant in sessionStorage
  3. Track "page_view" event with variant
  4. Track "signup_click" event with variant
  5. After 2 weeks, compare conversion rates
```

### BUILD 6: Upgrade Prompts

**Goal:** Nudge free users to upgrade when they hit usage limits.

**Technical spec:**

```
Files to create:
  components/upgrade-prompt.tsx            (reusable upgrade prompt modal/banner)

Files to modify:
  app/(app)/orders/page.tsx               (show prompt when approaching limit)
  app/(app)/receipts/page.tsx             (show prompt for premium receipt features)

Logic:
  1. Free plan: 50 orders/month limit
  2. At 40 orders: yellow banner "Kamu udah pake 40/50 pesanan bulan ini"
  3. At 50 orders: modal "Upgrade ke Warung — Rp 49K/bulan — unlimited pesanan"
  4. Track "upgrade_prompt_shown" and "upgrade_prompt_clicked" events
```

---

## 6. The Unified Workflow: Content Factory + Code Builder {#unified-workflow}

### The Weekly Rhythm

```
MONDAY    → Code Builder (build features that enable content)
TUESDAY   → Content Factory (produce this week's content)
WEDNESDAY → Content Factory (review + publish + amplify)
THURSDAY  → Code Builder (bug fixes, optimizations)
FRIDAY    → Measure + Plan (analytics review, plan next week)
WEEKEND   → Record TikTok videos (batch 3 videos in 2 hours)
```

### How They Feed Each Other

```
CODE BUILDER creates infrastructure:
  Blog MDX system      →  Content Factory can now produce blog posts at scale
  City pages           →  Content Factory has 34 new pages to optimize
  Referral system      →  Content Factory creates referral invite messages
  Upgrade prompts      →  Content Factory writes upgrade-related content

CONTENT FACTORY creates demand:
  Blog traffic         →  Code Builder tracks which pages convert → optimize
  Social awareness     →  Code Builder adds social proof to landing page
  WA group engagement  →  Code Builder builds better onboarding from insights
  Ad performance       →  Code Builder optimizes landing page based on ad data
```

### The Claude Code Session Structure

**Monday: Code Builder Session (2-3 hours)**
```
claude "Build/improve [specific feature from the build queue]"
  → Claude Code writes code
  → Claude Code runs tests
  → You review + deploy
```

**Tuesday: Content Factory Session (1-2 hours)**
```
claude "Generate this week's content based on the calendar"
  → Claude Code reads content/calendar.md
  → Produces: 2 blog posts + 3 TikTok scripts + 2 carousels + 5 WA tips
  → Saves all to content/ directories
  → You spend 30 min reviewing
```

**Wednesday: Publish + Amplify (1 hour)**
```
claude "Run the content waterfall for the published blog posts"
  → Claude Code reads published posts
  → Generates all derivative content
  → You publish to platforms manually
```

**Friday: Measure + Plan (30 min)**
```
claude "Generate weekly report and plan next week's content"
  → Claude Code pulls analytics data
  → Generates performance report
  → Proposes next week's content calendar
  → You review and approve
```

---

## 7. Weekly Schedule for a Solo Founder {#weekly-schedule}

### Total Time Budget: ~15 hours/week

```
┌─────────────────────────────────────────────────────────────────────┐
│ MONDAY (3 hrs)                                                      │
│                                                                     │
│ 09:00-11:00  Claude Code: Build feature from queue                 │
│ 11:00-11:30  Review code, commit, deploy                           │
│ 11:30-12:00  Product work (customer support, admin)                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ TUESDAY (2.5 hrs)                                                   │
│                                                                     │
│ 09:00-10:00  Claude Code: Generate week's content batch            │
│ 10:00-10:30  Review blog posts (accuracy, tone)                    │
│ 10:30-11:00  Review social content (scripts, carousels)            │
│ 11:00-11:30  Post to WA groups (copy-paste tips)                   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ WEDNESDAY (2 hrs)                                                   │
│                                                                     │
│ 09:00-09:30  Publish blog posts (git push)                         │
│ 09:30-10:00  Claude Code: Generate content waterfall               │
│ 10:00-10:30  Post to Instagram + Facebook groups                   │
│ 10:30-11:00  Schedule WA broadcasts                                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ THURSDAY (2.5 hrs)                                                  │
│                                                                     │
│ 09:00-10:00  Claude Code: Bug fixes, optimizations                 │
│ 10:00-10:30  Customer outreach (DM potential users)                │
│ 10:30-11:00  Community engagement (WA groups, FB groups)           │
│ 11:00-11:30  Respond to user feedback                              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ FRIDAY (1.5 hrs)                                                    │
│                                                                     │
│ 09:00-09:30  Claude Code: Weekly report + analytics                │
│ 09:30-10:00  Review report, identify wins + problems               │
│ 10:00-10:30  Plan next week's content + code priorities            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ WEEKEND (3.5 hrs — flexible)                                        │
│                                                                     │
│ SAT 10:00-12:00  Record 3 TikTok videos (batch)                   │
│ SUN 10:00-11:00  Edit videos + schedule posts                      │
│ SUN 11:00-11:30  Pasar/warung visit (optional field sales)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

TIME BREAKDOWN:
  Claude Code sessions:  ~5 hrs/week  (code + content generation)
  Human review/editing:  ~3 hrs/week  (review, approve, edit)
  Manual distribution:   ~3 hrs/week  (posting, engagement)
  Video production:      ~3.5 hrs/week (record + edit TikTok)
  Strategy/planning:     ~0.5 hrs/week (Friday planning)
  TOTAL:                 ~15 hrs/week
```

---

## 8. Implementation Sequence (What to Build First) {#implementation-sequence}

### The Critical Path

```
WEEK 1-2: FOUNDATION
  ┌─────────────────────────────────────────┐
  │ Day 1-2: Blog MDX Migration             │
  │   → Install next-mdx-remote, gray-matter│
  │   → Create lib/mdx.ts                   │
  │   → Migrate 5 existing posts to MDX     │
  │   → Create [slug] dynamic route         │
  │   → Update blog index page              │
  │   → Update sitemap                      │
  │                                         │
  │ Day 3-4: Programmatic City Pages        │
  │   → Create data/cities.ts (34 cities)   │
  │   → Create /kota/[city] route           │
  │   → Generate metadata + schema          │
  │   → Update sitemap                      │
  │                                         │
  │ Day 5: First Content Batch              │
  │   → Claude Code: 5 new blog posts       │
  │   → Claude Code: Content waterfall      │
  │   → Review + publish                    │
  └─────────────────────────────────────────┘
  MILESTONE: Blog system scalable, 10 blog posts + 34 city pages live

WEEK 3-4: GROWTH LOOPS
  ┌─────────────────────────────────────────┐
  │ Day 1-3: Referral System                │
  │   → Create migration + tables           │
  │   → Build API routes                    │
  │   → Create referral dashboard           │
  │   → Create /r/[code] landing page       │
  │   → Integrate with signup flow          │
  │                                         │
  │ Day 4: "Powered By" Optimization        │
  │   → Add ref= tracking to WA footer      │
  │   → Connect to referral system          │
  │   → Set up A/B test variants            │
  │                                         │
  │ Day 5: Content Batch #2                 │
  │   → Claude Code: 5 more blog posts      │
  │   → Claude Code: Referral invite content│
  │   → Claude Code: WA group tips batch    │
  └─────────────────────────────────────────┘
  MILESTONE: Referral system live, 20 blog posts + 34 city pages, viral loop optimized

WEEK 5-6: CONVERSION
  ┌─────────────────────────────────────────┐
  │ Day 1-2: Landing Page A/B Testing       │
  │   → Implement variant logic             │
  │   → Track variant impressions           │
  │   → Test 2 headline variants            │
  │                                         │
  │ Day 3: Upgrade Prompts                  │
  │   → Build upgrade prompt component      │
  │   → Add usage limit warnings            │
  │   → Track conversion events             │
  │                                         │
  │ Day 4: Email Capture                    │
  │   → Add email form to blog posts        │
  │   → Store in Supabase                   │
  │   → Simple "thanks" confirmation        │
  │                                         │
  │ Day 5: Content Batch #3                 │
  │   → Claude Code: 5 more blog posts      │
  │   → Claude Code: Ad copy batch          │
  │   → Claude Code: Full content waterfall │
  └─────────────────────────────────────────┘
  MILESTONE: Full conversion funnel, 25 blog posts, ad copy ready

WEEK 7-8+: AUTOMATION (when WABA unblocks)
  ┌─────────────────────────────────────────┐
  │ WA Onboarding Bot                       │
  │ WA Drip Sequences                       │
  │ Meta Ads launch                         │
  │ Ongoing content production              │
  │ Analytics-driven optimization           │
  └─────────────────────────────────────────┘
```

### The First Claude Code Session (Day 1)

The very first thing to do:

```
You: "Migrate the CatatOrder blog from hardcoded page.tsx to MDX.
      - Install next-mdx-remote and gray-matter
      - Create content/blog/ directory
      - Migrate all 5 existing blog posts to MDX format with frontmatter
      - Create dynamic [slug] route
      - Update blog index to read from content/
      - Update sitemap
      - Ensure all SEO metadata (JSON-LD, OpenGraph) is preserved"
```

This unblocks the entire content factory.

---

## 9. Risk Analysis & Mitigation {#risks}

### Risk 1: AI Content Quality

**Risk:** Claude-generated content sounds robotic or generic
**Probability:** Medium
**Impact:** High (damages brand, hurts SEO)

**Mitigation:**
- Always review before publishing (never auto-publish)
- Create a style guide file that Claude Code reads: `content/style-guide.md`
- Include examples of good vs bad writing in the style guide
- Feed back rejected content to improve future prompts
- Keep a "banned phrases" list: "di era digital", "dalam dunia yang semakin", "tak bisa dipungkiri"

### Risk 2: Blog Migration Breaks SEO

**Risk:** Changing blog structure causes URL changes → lose existing rankings
**Probability:** Low (if done carefully)
**Impact:** High

**Mitigation:**
- Keep exact same URL slugs: `/blog/pesanan-wa-numpuk` stays `/blog/pesanan-wa-numpuk`
- Preserve all metadata (title, description, canonical URL)
- Keep JSON-LD structured data
- Add redirects if any URLs change
- Test with `next build` before deploying

### Risk 3: Referral System Gaming

**Risk:** Users create fake accounts to get free months
**Probability:** Medium
**Impact:** Low (small revenue loss)

**Mitigation:**
- Phone number dedup (each WA number can only be referred once)
- Reward triggers on first PAYMENT, not signup
- Monitor for patterns (same IP, same device, rapid signups)
- Cap free months at some reasonable limit if needed later

### Risk 4: Content Factory Burns Budget

**Risk:** Producing content costs money (Claude Code API, tools, MCP subscriptions) without clear ROI
**Probability:** Low
**Impact:** Medium

**Mitigation:**
- Track every piece of content → signup attribution
- Start with free/cheap channels (Claude Code + free MCP servers)
- Don't pay for premium MCP servers until organic traffic hits 1,000/month
- Monthly ROI review: cost of content production vs signups generated

### Risk 5: WABA Stays Blocked

**Risk:** Meta Business Verification never completes → WA bot can't launch
**Probability:** Medium (Meta verification is notoriously slow)
**Impact:** High (blocks onboarding bot, drip sequences)

**Mitigation:**
- Build everything else first (blog, referral, city pages, content)
- Use WA personal/business app for manual engagement
- Consider using WA Business API alternatives (360dialog, Gupshup)
- Prepare all bot content so it's ready to deploy the moment verification completes

### Risk 6: Solo Founder Burnout

**Risk:** 15 hrs/week on marketing + product development + customer support
**Probability:** High
**Impact:** High

**Mitigation:**
- Claude Code reduces content production from 40+ hrs to 5 hrs/week
- Batch content production (Tuesday) to avoid context switching
- Take breaks on weekends if TikTok recording feels like a chore
- Automate everything possible before scaling effort
- Focus on the channels with proven ROI, ruthlessly cut underperformers

---

## Summary: The 10 Decisions Checklist

| # | Decision | Recommended | Status |
|---|----------|-------------|--------|
| 1 | Blog system architecture | MDX files in repo | DECIDE |
| 2 | Programmatic SEO architecture | Dynamic route + data file, 34 cities | DECIDE |
| 3 | Referral system design | Double-sided, 1 free month each, username-based codes | DECIDE |
| 4 | Content frequency & mix | 2 blog + 3 TikTok + 2 carousel + 5 WA tips per week | DECIDE |
| 5 | WA onboarding bot flow | State machine, friendly tone, PostgreSQL state | DECIDE (blocked by WABA) |
| 6 | "Powered by" optimization | A/B test 3 variants + ref= tracking | DECIDE |
| 7 | Analytics & attribution | Fathom + custom events, first-touch, weekly reports | DECIDE |
| 8 | A/B testing infrastructure | Manual alternation now, feature flags later | DECIDE |
| 9 | Email marketing | Capture only (blog form), no sequences yet | DECIDE |
| 10 | Content calendar tool | Markdown file in repo | DECIDE |

**Once all 10 decisions are made, the implementation sequence is clear and Claude Code can execute the entire plan.**

---

*This document synthesizes findings from: codebase exploration (14 tables, 5 blog posts, WA bot, UTM tracking), content factory workflow research (7-stage pipeline, AI-powered production, Bahasa Indonesia considerations), and code builder best practices research (referral architecture, WA bot design, programmatic SEO, A/B testing).*

*Next step: Review decisions, approve or modify, then execute Week 1 — Blog MDX Migration.*
