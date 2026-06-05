# Pricing Validation — CatatOrder

> Evidence supporting the Gratis / Rp49K (Plus) / Rp99K (Pro) pricing tiers.

---

## Current CatatOrder Pricing

| Tier | Price | Limit |
|------|-------|-------|
| Gratis | Rp0 | 150 orders/month |
| Plus | Rp49K/month | Higher limits |
| Pro | Rp99K/month | Unlimited + advanced features |

---

## Evidence: Freemium Is Correct for UMKM

### From Distribution Audit (5 Companies)

| Company | Free Tier | Paid Price | Conversion | Lesson |
|---------|-----------|-----------|------------|--------|
| BukuWarung | Free forever (full product) | N/A (fintech revenue) | N/A | Too generous free = hard to monetize |
| BukuKas | Free forever | Never had paid | 0% | Free forever with no plan = DEATH |
| Moka | 14-day trial | Rp299-799K/month | High (field sales) | No free tier works WITH sales team |
| Majoo | 14-day trial | Rp199-599K/month | High (field sales) | Same as Moka |
| iReap | Free forever (Lite) | Rp150-300K/month (Pro) | 2-5% | **Freemium works for self-serve** |

**Why freemium for CatatOrder:**
1. No field sales team = can't do free trial (nobody to follow up and close)
2. UMKM are suspicious of "free trial" = afraid of charges
3. Free tier builds trust + word of mouth (iReap model)
4. Volume gate (not feature gate) is the right conversion trigger

### Global Freemium Benchmarks

| Metric | Value |
|--------|-------|
| Visitor-to-signup | 13.3% |
| Free-to-paid conversion | 2.6% (global average) |
| Expected for Indonesian UMKM | 1-2% (higher price sensitivity) |

---

## Evidence: Rp49K Is the Sweet Spot

### Competitor Pricing Landscape

| App | Lowest Paid | Target | Downloads |
|-----|------------|--------|-----------|
| **CatatOrder** | **Rp49K** | **UMKM WA orders** | **New** |
| Kasir Pintar Pro | Rp55K | UMKM broadly | 1M+ |
| iReap Pro | Rp99-150K | Small retail | 100K+ |
| Olsera Basic | Rp128K | Retail & F&B | 10K+ |
| Pawoon Pro | Rp299K | Cafe, restaurant | 100K+ |
| Moka POS | Rp299K | Cafe, salon, SME | 500K+ |
| Majoo Starter | Rp249K | Growing SME | 100K+ |

**CatatOrder at Rp49K sits between free apps (BukuWarung, iReap Lite) and the Rp55K+ POS tier.**

### The Gap

```
Free (BukuWarung, OttoPay)    Rp49K (CatatOrder)    Rp55K+ (Kasir Pintar)    Rp249K+ (Majoo/Moka)
        ↑                           ↑                        ↑                         ↑
   Pivoting/unfocused          ALONE HERE              Full POS              Enterprise SME
```

### Price Anchoring from StrukKu Research

- Gap between free WA manual and Rp55K+ bookkeeping apps = **nothing in between**
- BukuWarung Play Store reviews: users want simpler, not more features
- Rp49K = price of 1 custom cake ingredient for bakers
- Rp49K < 1% of monthly revenue for most UMKM (average Rp5M+ profit)

### STRUK.AI Pricing Signal

| Tier | Price | Target |
|------|-------|--------|
| Free | Rp0 | 50 receipts/month |
| Pro | Rp149K/mo | Small business |
| Business | Rp299K/mo | Team + accountant export |

The STRUK.AI research validated Rp149K at the mid-tier. CatatOrder's Rp49-99K is correctly positioned below this for simpler order management.

---

## Evidence: Volume Gate > Feature Gate

### Optimal Free Tier Sizing

- Too generous (BukuWarung: unlimited free) = nobody upgrades
- Too stingy (5 free transactions) = not enough to experience value
- **Sweet spot: 100-150 transactions/month free** = enough to prove value, not enough for a real business at scale

**CatatOrder's 150 orders/month free limit:**
- Enough for a small UMKM to fully try the product
- Active UMKM with 200+ orders/month will naturally hit the limit
- Upgrade at Rp49K is a no-brainer: Rp49K / 200 orders = Rp245/order

### The Organic Upgrade Trigger

> "When a baker with 200 orders/month hits the 150-order free limit, upgrading at Rp49K is obvious."

Key insight from synthesis.md: The upgrade trigger should be ORGANIC, not pressured.

---

## Willingness to Pay Evidence

| Signal | Source |
|--------|--------|
| Kasir Pintar has 1M+ downloads at Rp55K Pro | warungstrive-01 |
| iReap converts 2-5% to Rp150-300K Pro | synthesis.md |
| Home bakers pay for Jotform, IG promotion, packaging | rrf-v3.md |
| WOs pay Aksana Rp389K+/month | kill-switch-v3.md |
| UMKM prefer monthly billing (monthly cash flow mindset) | synthesis.md |
| QRIS: 15M micro-merchants joined digital payments in 2024 | warungstrive-01 |

---

## Payment Infrastructure

CatatOrder uses **Midtrans Starter Pack** (VA, GoPay, QRIS) — matching UMKM payment preferences.

---

## Source Files
- `kernel/research/distribution-audit/synthesis.md` — Pricing lessons, freemium benchmarks, conversion rates
- `kernel/memory/research/strukku-validation-research-2026-01-25.md` — Gap between free WA and Rp55K+
- `kernel/memory/research/warungstrive-01-competitor-analysis.md` — 9-app competitor pricing table
- `kernel/memory/research/struk-ai-opportunity-2026-01-11.md` — STRUK.AI Rp149K pricing, global exits
- `kernel/research/39-rrf-scoring/rrf-v3.md` — WTP evidence per vertical
