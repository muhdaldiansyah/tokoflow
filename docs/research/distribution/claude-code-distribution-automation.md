# CatatOrder Distribution: What Claude Code Can Actually Do

> **Mapping 30 distribution channels to Claude Code capabilities (MCP servers, skills, hooks, bash)**
>
> Research date: 2026-02-27

---

## Quick Summary: The 12 Channels Claude Code Can Meaningfully Automate

Out of 30 distribution channels, Claude Code can meaningfully automate or assist with **12 channels**. The rest require human action (field visits, relationship building, live video).

| # | Channel | Claude Code Role | Key MCP/Tool |
|---|---------|-----------------|--------------|
| 1 | SEO content | **Write all blog posts, optimize, publish** | kwrds.ai + Filesystem |
| 2 | TikTok/Reels scripts | **Write scripts, captions, hashtags** | Xpoz + native |
| 3 | Social media scheduling | **Generate + schedule across platforms** | Metricool / Vista Social |
| 4 | Meta Ads (Click-to-WA) | **Create ad copy, analyze campaigns** | Meta Ads MCP |
| 5 | Google Ads | **Keyword research, ad copy, campaign data** | Google Ads MCP |
| 6 | Landing pages | **Build complete pages** | Filesystem + Figma |
| 7 | Referral program | **Build the code** | Supabase + native |
| 8 | WhatsApp automation | **Send messages, manage templates** | WhatsApp Business MCP |
| 9 | Email marketing | **Draft + send campaigns** | SendGrid / Postmark |
| 10 | Analytics & reporting | **Pull data, generate reports** | Google Analytics MCP |
| 11 | Community content | **Generate daily tips, templates** | Native |
| 12 | Image generation | **Create social media graphics** | DALL-E / Canva MCP |

---

## Recommended MCP Server Stack

### Install These First (Core Distribution Stack)

```bash
# 1. SEO & Keyword Research
claude mcp add --transport stdio kwrds-ai -- npx -y @anthropic/kwrds-ai-mcp

# 2. Social Media Analytics & Scheduling
claude mcp add --transport http metricool https://mcp.metricool.com/mcp \
  --header "Authorization: Bearer YOUR_METRICOOL_KEY"

# 3. Social Media Research (TikTok, Instagram, Twitter trends)
claude mcp add --transport http xpoz https://api.xpoz.ai/mcp \
  --header "Authorization: Bearer YOUR_XPOZ_KEY"

# 4. Google Ads Campaign Management
claude mcp add --transport http google-ads https://googleads.googleapis.com/mcp \
  --header "Authorization: Bearer YOUR_GOOGLE_ADS_TOKEN"

# 5. Meta/Facebook Ads Management
claude mcp add --transport stdio meta-ads -- npx -y @pipeboard/meta-ads-mcp-server

# 6. Google Analytics (Traffic Analysis)
claude mcp add --transport stdio google-analytics -- npx -y @google/google-analytics-mcp

# 7. WhatsApp Business API
claude mcp add --transport stdio whatsapp -- npx -y whatsapp-cloud-api-mcp

# 8. Email Marketing (SendGrid)
claude mcp add --transport stdio sendgrid --env SENDGRID_API_KEY=YOUR_KEY -- npx -y sendgrid-mcp

# 9. Image Generation (DALL-E)
claude mcp add --transport stdio dalle --env OPENAI_API_KEY=YOUR_KEY -- npx -y dall-e-mcp-server

# 10. Canva (Design Templates)
claude mcp add --transport http canva https://api.canva.com/mcp \
  --header "Authorization: Bearer YOUR_CANVA_KEY"

# 11. Supabase (Your Database)
claude mcp add --transport stdio supabase --env SUPABASE_ACCESS_TOKEN=YOUR_TOKEN -- npx -y @supabase/mcp-server

# 12. Web Scraping (Competitor Research)
claude mcp add --transport stdio apify --env APIFY_API_TOKEN=YOUR_TOKEN -- npx -y @anthropic/apify-mcp

# 13. Browser Automation
claude mcp add --transport stdio playwright -- npx -y @anthropic/playwright-mcp

# 14. Notion (Content Calendar)
claude mcp add --transport http notion https://mcp.notion.com/mcp \
  --header "Authorization: Bearer YOUR_NOTION_KEY"

# 15. Workflow Automation
claude mcp add --transport http n8n https://YOUR_N8N_INSTANCE/mcp
```

---

## Channel-by-Channel: What Claude Code Can Do

---

### CHANNEL 1: Built-In Product Virality ("Powered By")

**What Claude Code does:** Build the code.

| Task | Tool | How |
|------|------|-----|
| Add "Powered by CatatOrder" to WA message templates | Edit/Write | Edit the WA message template code to include branded footer with signup link |
| Build referral link tracking | Supabase MCP | Create database tables for tracking click-throughs from "Powered by" links |
| A/B test different footer CTAs | Edit/Write | Generate multiple CTA variations, write A/B test logic |
| Track K-factor metrics | Supabase MCP | Query database for viral coefficient calculations |

**Skill to create:**
```
.claude/skills/viral-footer/SKILL.md
---
name: update-viral-footer
description: Update the "Powered by CatatOrder" message in all WA templates
---
```

**Verdict:** Claude Code builds the entire viral loop infrastructure. Then it runs automatically. **HIGH VALUE.**

---

### CHANNEL 2: WhatsApp Group Seeding

**What Claude Code does:** Generate content to share in groups.

| Task | Tool | How |
|------|------|-----|
| Generate daily tips for WA groups | Native | "Write 30 days of order management tips in Bahasa Indonesia" |
| Create free templates (Google Sheet format) | Write | Generate CSV/sheet templates for order tracking |
| Write seeding scripts/DM messages | Native | Generate 10 variations of introduction messages |
| Track which groups convert | Supabase MCP | Build tracking for UTM-tagged links per group |

**Cannot do:** Join groups, post in groups, engage in conversations (requires human).

**Verdict:** Content factory for groups. You still post manually. **MEDIUM VALUE.**

---

### CHANNEL 3: Click-to-WhatsApp Ads (Meta)

**What Claude Code does:** Create ads, analyze performance, optimize.

| Task | Tool | How |
|------|------|-----|
| Write ad copy (10+ variations) | Native | "Generate 10 Click-to-WA ad copies for F&B UMKM in Bahasa Indonesia" |
| Create ad images | DALL-E MCP / Canva MCP | Generate before/after visuals, pain-point creatives |
| Analyze campaign performance | Meta Ads MCP | Pull CPM, CPC, CPA, CTR data. Identify winners. |
| Optimize targeting | Meta Ads MCP | Analyze audience segments, suggest interest targeting |
| Generate A/B test variations | Native + Meta Ads MCP | Write copy variants, set up tests, analyze results |
| Budget recommendations | Meta Ads MCP + Native | Pull spend data, calculate ROAS, suggest budget shifts |

**Skill to create:**
```
.claude/skills/meta-ads/SKILL.md
---
name: meta-ads-report
description: Pull and analyze Meta Ads campaign performance
---
Pull latest campaign data from Meta Ads MCP. Calculate:
1. CPC, CPM, CPA for each ad set
2. Best performing creative
3. Best performing audience
4. Budget reallocation recommendation
Format as markdown table.
```

**Verdict:** Full ad creation → analysis → optimization cycle. **VERY HIGH VALUE.**

---

### CHANNEL 4: Referral Program

**What Claude Code does:** Build the entire system.

| Task | Tool | How |
|------|------|-----|
| Design database schema | Supabase MCP | Create referral_codes, referral_tracking, rewards tables |
| Build referral API endpoints | Write/Edit | Generate Next.js API routes for referral tracking |
| Create referral landing page | Write | Generate landing page with referral code input |
| Write referral invite messages | Native | Generate WhatsApp-friendly referral messages in Bahasa |
| Track referral metrics | Supabase MCP + Google Analytics | Query referral conversion rates, K-factor |
| Automate reward fulfillment | Supabase MCP | Write triggers for automatic free-month credits |

**Verdict:** Claude Code builds the entire referral system end-to-end. **VERY HIGH VALUE.**

---

### CHANNEL 5: Founder-Led Sales

**What Claude Code does:** Prepare materials, not do the selling.

| Task | Tool | How |
|------|------|-----|
| Create pitch deck/one-pager | Write | Generate a markdown/HTML one-pager for pasar demos |
| Write demo scripts | Native | "Write a 2-minute demo script for warung owners in Bahasa" |
| Create QR code landing pages | Write | Generate city-specific landing pages with QR codes |
| Track demo-to-signup conversion | Supabase MCP | Build tracking for field sales metrics |
| Generate follow-up WA messages | Native | "Write 5 follow-up messages for merchants who saw the demo" |

**Cannot do:** Visit pasar, demo the product, build relationships (requires human).

**Verdict:** Prepares all materials. You do the walking. **MEDIUM VALUE.**

---

### CHANNEL 6: Community (Own WA Groups)

**What Claude Code does:** Content engine for the community.

| Task | Tool | How |
|------|------|-----|
| Generate 30 days of daily tips | Native | Batch-generate Bahasa Indonesia F&B business tips |
| Create "template of the week" | Write | Generate order tracking templates, pricing calculators |
| Write poll questions | Native | Generate engaging poll content for community |
| Create educational mini-guides | Write | "Write a 500-word guide on pricing strategy for katering" |
| Schedule content calendar | Notion MCP | Plan and organize 30-day community content calendar |

**Cannot do:** Manage group dynamics, respond to members, build trust (requires human).

**Verdict:** Generates all community content. You post and engage. **MEDIUM VALUE.**

---

### CHANNEL 7: TikTok/Reels Organic Content

**What Claude Code does:** Write all scripts, captions, hashtags. Generate thumbnails.

| Task | Tool | How |
|------|------|-----|
| Write video scripts (batch) | Native | "Write 20 TikTok scripts about WA order management chaos" |
| Generate hook variations | Native | "Write 50 first-line hooks in Bahasa Indonesia for F&B owners" |
| Research trending hashtags | Xpoz MCP | Search TikTok trending hashtags in Indonesia F&B niche |
| Analyze competitor content | Xpoz MCP | Pull engagement data from competitor TikTok accounts |
| Write carousel text | Native | Generate 7-slide carousel scripts with problem→solution arc |
| Create thumbnail/cover images | DALL-E MCP / Canva MCP | Generate eye-catching cover images for videos |
| Optimize posting schedule | Metricool MCP | Analyze best posting times from account data |
| Generate captions | Native | Write captions with CTAs and hashtag blocks |

**Skill to create:**
```
.claude/skills/tiktok-batch/SKILL.md
---
name: tiktok-batch
description: Generate a week of TikTok content
---
Generate 5 TikTok video scripts for CatatOrder:
1. Hook (first 3 seconds) - must grab attention
2. Problem statement (3-10 seconds)
3. Solution demo (10-25 seconds)
4. CTA (last 5 seconds)
5. Caption with hashtags
6. Posting time recommendation

Format each as a separate markdown section.
Topic focus: $ARGUMENTS
```

**Cannot do:** Record video, edit video, post to TikTok (requires human + video editor).

**Verdict:** Complete pre-production pipeline. You record and post. **HIGH VALUE.**

---

### CHANNEL 8: Nano/Micro-Influencer Partnerships

**What Claude Code does:** Find influencers, draft outreach, track ROI.

| Task | Tool | How |
|------|------|-----|
| Research nano influencers | Xpoz MCP + Apify MCP | Search TikTok/Instagram for food UMKM creators by hashtag, engagement rate |
| Draft outreach DM templates | Native | Generate 10 personalized DM templates for influencer outreach |
| Create content briefs | Write | Generate detailed briefs for influencer content |
| Track influencer campaign ROI | Supabase MCP + Google Analytics | Build UTM links per influencer, track conversions |
| Generate contract/agreement | Native | Write simple partnership agreement template |

**Cannot do:** Build relationships, negotiate, manage ongoing partnerships (requires human).

**Verdict:** Research + content prep. You DM and manage. **MEDIUM VALUE.**

---

### CHANNEL 9: Pain Point SEO (Bahasa Indonesia)

**What Claude Code does:** THE ENTIRE PIPELINE. This is where Claude Code adds the most value.

| Task | Tool | How |
|------|------|-----|
| Keyword research | kwrds.ai MCP | Find long-tail Bahasa Indonesia keywords with volume + competition data |
| Competitor SERP analysis | Apify MCP / Playwright MCP | Scrape top 10 results for target keywords, analyze content |
| Generate blog posts (batch) | Native + Write | "Write 10 SEO-optimized blog posts in Bahasa Indonesia" |
| Optimize existing content | Read + Edit | Read current posts, suggest title/meta/heading improvements |
| Generate programmatic city pages | Write | Create 10+ city-specific pages: "Aplikasi Catat Pesanan di [Kota]" |
| Internal linking strategy | Grep + Edit | Find and add internal links across all content |
| Track rankings | SE Ranking MCP | Monitor keyword position changes over time |
| Generate schema markup | Write | Add FAQ, HowTo, Product schema to pages |
| Content calendar planning | Notion MCP | Create and manage editorial calendar in Notion |
| Build sitemap | Write | Generate/update sitemap.xml with all new pages |

**Skill to create:**
```
.claude/skills/seo-blog/SKILL.md
---
name: seo-blog
description: Generate an SEO-optimized blog post in Bahasa Indonesia
---
1. Research keyword: $ARGUMENTS using kwrds.ai MCP
2. Analyze top 3 SERP results
3. Write 1,500-2,000 word blog post in Bahasa Indonesia
4. Include: H1, H2, H3 headers optimized for keyword
5. Add meta title (60 chars) and meta description (155 chars)
6. Include internal links to existing content
7. Add FAQ section with 3-5 questions
8. Save to content/blog/ directory as MDX file
```

**Complete workflow automation with hook:**
```json
{
  "hooks": {
    "Stop": [{
      "matcher": "seo-blog",
      "hooks": [{
        "type": "command",
        "command": "echo 'New blog post created' | osascript -e 'display notification'"
      }]
    }]
  }
}
```

**Verdict:** Claude Code can do 90% of the SEO work autonomously. **HIGHEST VALUE CHANNEL.**

---

### CHANNEL 10: Facebook Group Infiltration

**What Claude Code does:** Generate all the content you'll post.

| Task | Tool | How |
|------|------|-----|
| Generate value-first posts (batch) | Native | "Write 20 helpful FB posts about F&B order management in Bahasa Indonesia" |
| Create shareable infographics | DALL-E MCP / Canva MCP | Generate visual tips, checklists, comparison graphics |
| Research active FB groups | Apify MCP | Scrape FB group directories for UMKM/F&B communities |
| Write comment templates | Native | Generate helpful replies to common questions |

**Cannot do:** Post in groups, engage in comments, build reputation (requires human).

**Verdict:** Content factory. You post and engage. **MEDIUM VALUE.**

---

### CHANNEL 11: WhatsApp Channel (Broadcast)

**What Claude Code does:** Generate all broadcast content + potentially send via API.

| Task | Tool | How |
|------|------|-----|
| Generate 30 days of broadcast content | Native + Write | Batch-create daily tips, success stories, feature highlights |
| Send broadcasts | WhatsApp Business MCP | Programmatically send messages to channel followers |
| Track engagement | WhatsApp Business MCP | Monitor delivery, read rates |
| Create visual content for broadcasts | DALL-E MCP / Canva MCP | Generate images for each broadcast |

**Verdict:** Full content + delivery pipeline if WA Business MCP is configured. **HIGH VALUE.**

---

### CHANNEL 12: Google Ads

**What Claude Code does:** Full campaign management.

| Task | Tool | How |
|------|------|-----|
| Keyword research | Google Ads MCP | Pull keyword ideas, volume, CPC, competition |
| Write ad copy | Native | Generate responsive search ad headlines + descriptions |
| Analyze campaign performance | Google Ads MCP | Pull campaign, ad group, keyword data. Calculate ROAS. |
| Negative keyword management | Google Ads MCP | Identify wasted spend, add negative keywords |
| Budget optimization | Google Ads MCP + Native | Analyze cost per conversion by keyword, reallocate budget |
| Generate landing page | Write | Create keyword-specific landing pages |

**Verdict:** Full ad management cycle. **VERY HIGH VALUE.**

---

### CHANNEL 13: Freemium / Pricing

**What Claude Code does:** Build the pricing infrastructure.

| Task | Tool | How |
|------|------|-----|
| Implement usage-based limits | Edit/Write | Code order count limits, plan gates |
| Build upgrade prompts | Edit/Write | Code in-app upgrade triggers when approaching limits |
| Create pricing page | Write | Generate pricing comparison page |
| Track conversion funnel | Supabase MCP + Google Analytics | Query free-to-paid conversion rates |
| A/B test pricing tiers | Edit/Write + Supabase | Implement pricing experiments |

**Verdict:** Builds the entire pricing system. **HIGH VALUE.**

---

### CHANNEL 14: Food Supplier Partnerships

**What Claude Code does:** Create partnership materials only.

| Task | Tool | How |
|------|------|-----|
| Write partnership proposal | Native + Write | Generate partnership pitch deck/document |
| Create co-branded materials | DALL-E MCP / Canva MCP | Generate co-branded flyers, QR codes |
| Build partner tracking | Supabase MCP | Create partner referral tracking system |
| Draft partnership agreement | Native | Generate simple MOU template |

**Cannot do:** Find partners, build relationships, negotiate (requires human).

**Verdict:** Prepares materials. You build relationships. **LOW-MEDIUM VALUE.**

---

### CHANNEL 15: AI Onboarding Bot

**What Claude Code does:** Build the entire bot.

| Task | Tool | How |
|------|------|-----|
| Design conversation flow | Native + Write | Generate the complete chatbot conversation tree |
| Build WA bot integration | Edit/Write | Code the WhatsApp Cloud API integration |
| Write all bot messages (Bahasa) | Native + Write | Generate every message in the onboarding flow |
| Test bot flows | Playwright MCP | Automated testing of bot conversation paths |
| Monitor bot performance | Supabase MCP | Track completion rates, drop-off points |

**Verdict:** Claude Code builds the entire bot. **VERY HIGH VALUE.**

---

### CHANNEL 16-30: Remaining Channels (Lower Claude Code Impact)

| Channel | Claude Code Can Do | Cannot Do |
|---------|-------------------|-----------|
| **Government programs** | Write applications, proposals | Navigate bureaucracy, attend meetings |
| **IG Broadcast** | Generate content, create images | Post manually (no IG MCP for broadcasting) |
| **Threads** | Write posts | Post (no direct Threads MCP yet) |
| **UMKM events** | Create booth materials, flyers, QR pages | Attend events |
| **POS partnerships** | Build API integrations | Business development |
| **Payment integrations** | Build Midtrans/Xendit code | — (fully automatable) |
| **Bank partnerships** | Write proposals | Institutional relationships |
| **Telco bundling** | Write proposals | Institutional relationships |
| **YouTube tutorials** | Write scripts, descriptions, thumbnails | Record/edit video |
| **Email drip** | Build entire sequence + send | — (fully automatable) |
| **Product Hunt** | Write launch copy, prepare assets | Community engagement |
| **Delivery integration** | Build GoSend/Grab API code | — (fully automatable) |
| **Accounting integration** | Build Jurnal/BukuKas API code | — (fully automatable) |
| **AI content at scale** | Generate 20+ articles/month | — (this IS Claude Code's job) |

---

## THE RECOMMENDED APPROACH: What to Build NOW

Based on maximum impact × Claude Code capability, here are the **top 5 things to do right now** using Claude Code:

### 1. SEO Content Machine (HIGHEST ROI)

```
Ask Claude Code to:
1. Research 50 Bahasa Indonesia keywords using kwrds.ai MCP
2. Write 10 blog posts (1,500-2,000 words each)
3. Generate programmatic city pages for 10 cities
4. Create sitemap and internal linking
5. Add schema markup to all pages
```

**Time:** 2-3 hours of Claude Code work → 10 blog posts + 10 city pages
**Manual effort:** Review + publish
**Expected result:** 500-2,000 organic visits/month after 6 months

### 2. Meta Ads Content Factory

```
Ask Claude Code to:
1. Generate 20 ad copy variations (Bahasa Indonesia)
2. Create 10 ad images using DALL-E/Canva
3. Write landing page for Click-to-WA flow
4. Set up UTM tracking for each ad variant
```

**Time:** 1-2 hours of Claude Code work → 20 ad copies + 10 images + landing page
**Manual effort:** Upload to Meta Ads Manager, set budget
**Expected result:** Ready-to-launch ad campaign

### 3. TikTok Script Library

```
Ask Claude Code to:
1. Research trending F&B hashtags via Xpoz MCP
2. Write 20 video scripts with hooks, body, CTA
3. Generate 20 caption + hashtag blocks
4. Create carousel slide copy for 5 carousel posts
5. Design cover images via DALL-E
```

**Time:** 1-2 hours → 20 video scripts + 5 carousel scripts + graphics
**Manual effort:** Record, edit, post
**Expected result:** 1 month of TikTok content ready

### 4. Referral System

```
Ask Claude Code to:
1. Design Supabase schema for referral tracking
2. Build API endpoints for referral codes, tracking, rewards
3. Create referral landing page
4. Write 10 referral invite message templates (Bahasa Indonesia)
5. Build automated reward fulfillment
```

**Time:** 3-4 hours → Complete referral system
**Manual effort:** Deploy and test
**Expected result:** Functioning referral program

### 5. WhatsApp Onboarding Bot

```
Ask Claude Code to:
1. Design conversation flow (signup → setup → first order)
2. Build WhatsApp Cloud API integration
3. Write all bot messages in Bahasa Indonesia
4. Implement menu digitization flow
5. Build WA drip sequence (Day 0/1/3/7/14/30)
```

**Time:** 4-6 hours → Complete onboarding bot
**Manual effort:** Deploy and monitor
**Expected result:** Automated 24/7 onboarding

---

## Skills to Create in .claude/skills/

```
.claude/skills/
├── seo-blog/SKILL.md           # Generate SEO blog posts
├── tiktok-batch/SKILL.md       # Generate TikTok scripts
├── meta-ads-report/SKILL.md    # Analyze Meta Ads performance
├── google-ads-report/SKILL.md  # Analyze Google Ads performance
├── social-post/SKILL.md        # Generate social media posts
├── community-tips/SKILL.md     # Generate community tips
├── wa-broadcast/SKILL.md       # Generate WA Channel content
├── competitor-analysis/SKILL.md # Analyze competitor content
├── weekly-report/SKILL.md      # Generate weekly growth report
└── city-page/SKILL.md          # Generate programmatic city pages
```

---

## Hooks to Set Up

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "echo 'File written' >> /tmp/claude-activity.log"
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "osascript -e 'display notification \"Claude Code task complete\" with title \"CatatOrder\"'"
        }]
      }
    ]
  }
}
```

---

## What Claude Code CANNOT Do (Human Required)

| Activity | Why Human Required |
|----------|-------------------|
| Visit pasar/food courts | Physical presence |
| Record TikTok/Reels videos | Camera + personality |
| Post in WA/FB groups | Accounts + engagement |
| Build influencer relationships | Trust + negotiation |
| Attend UMKM events | Physical presence |
| Navigate government bureaucracy | Institutional knowledge |
| Customer support conversations | Empathy + judgment |
| Partnership negotiations | Relationship building |

---

## The Bottom Line

**Claude Code's role in CatatOrder distribution:**

| What Claude Code Does Best | Impact |
|---------------------------|--------|
| **SEO content at scale** | Write 10 blog posts in 2 hours (would take a writer 2 weeks) |
| **Ad copy + creative** | Generate 20 ad variations in 30 minutes |
| **TikTok script factory** | Create 1 month of scripts in 1 hour |
| **Build referral system** | Complete system in 3-4 hours |
| **Build onboarding bot** | Complete bot in 4-6 hours |
| **Analytics + reporting** | Pull data from GA/Meta/Google Ads, generate insights |
| **Landing page builder** | Create complete pages in 30 minutes |
| **Community content** | Generate 30 days of tips in 15 minutes |

**Estimated time savings:** 40-60 hours/month of content creation and analytics work automated. At a freelancer rate of Rp 100K/hour, that's Rp 4-6M/month in saved labor — more than the entire ad budget.

**What to install first:**
1. kwrds.ai MCP (SEO)
2. Meta Ads MCP (paid acquisition)
3. Google Analytics MCP (tracking)
4. Xpoz MCP (social media research)
5. Supabase MCP (your database)

Then use Claude Code to execute the top 5 tasks listed above.
