# 06 · Harga & Ekonomi Unit Malaysia

> Pricing strategy, CAC, LTV, payback period modeling untuk MY.

**Versi:** 1.0 · **Diperbarui:** 2026-04-17

---

## 1. Competitor pricing benchmarks (MYR)

| Tier | Products | Monthly price |
|---|---|---|
| **Entry freemium** | Bukku Launch, Orderla Basic | RM 0 |
| **Low paid** | Biztory RM 32.50, Bukku Seed RM 35, Orderla Plus RM 30 | RM 30-45 |
| **Mid** | Bukku Grow RM 65, QNE Cloud RM 62 | RM 50-70 |
| **Premium** | Bukku Prime RM 95, Orderla Pro RM 100, Xero ~RM 130, StoreHub RM 102 | RM 90-150 |
| **Enterprise** | AutoCount RM 1,500 lifetime, Xero Premium RM 330 | RM 200+ |

### Willingness-to-pay anchors

- **MY micro-SME typical SaaS spend: RM 0-50/month** (price-sensitive)
- **Budget bookkeeper fee: RM 149-300/month** (human accountant bottom tier)
- **Premium bookkeeper: RM 800-1,000/month** (handles full books)

Source anchors: [Consistant 2025 bookkeeping guide](https://consistantinfo.com.my/bookkeeping-pricing-in-malaysia-2025-comprehensive-guide-to-current-market-rates-and-strategic-financial-planning/), [YCK Consulting accounting fees](https://yckconsulting.com/accounting/accounting-services-fees-in-malaysia/).

**Critical anchor:** If CatatOrder positioned as "replaces your bookkeeper" = RM 149-300/mo is the reference price. Pricing at RM 29-49/mo is **well below pain threshold**, strong value.

---

## 2. Recommended pricing structure (MYR)

Applying CatatOrder's Indonesian structure to MY pricing context:

| Plan | MY price | ID equivalent | Notes |
|---|---|---|---|
| **Free** | RM 0 | Gratis | 50 pesanan/bulan (sama dengan ID) |
| **Isi Ulang** | RM 9 / 50 pesanan | Rp 15K / 50 pesanan | Pay-as-you-grow — differentiator vs locked sub |
| **Isi Ulang Besar** | RM 19 / 150 pesanan | Rp 25K / 100 pesanan | Better per-order rate |
| **Starter** | RM 19/bulan | Rp 25K/bulan | Unlimited locked monthly |
| **Growth** | **RM 39/bulan** | Rp 39K unlimited | **Recommended primary tier** |
| **Bisnis** | RM 99/bulan | Rp 99K/bulan | SPT PPN equivalent — but MY version = MyInvois upsell (later) |

### Pricing rationale

**Free → Isi Ulang → Starter:** Progressive commitment ladder.
- Free tier to reduce acquisition friction (34% think cloud expensive)
- Isi Ulang (RM 9/50 pesanan) = **unique in MY market** (no competitor has pay-per-use)
- Starter RM 19 = same price as Orderla Plus, cheaper than Bukku Seed (RM 35)

**Growth RM 39 = primary tier:**
- Below Bukku Grow RM 65 = value positioning
- Above Orderla Plus RM 30 = captures those willing to pay for bookkeeping+ordering bundle
- Yearly option: RM 390/year (~17% discount) = RM 32.50/mo effective

**Bisnis RM 99:**
- Same as Orderla Pro (RM 100)
- Features: advanced reports, API, priority support, multi-WA, (future) MyInvois integration
- Targets users graduating from micro → small tier

### Add-ons (Phase 3+)

- **MyInvois integration:** +RM 20/month (for users cross RM 1M threshold)
- **Multi-location inventory:** +RM 15/month
- **Advanced AI insights:** Included in Growth+, skip for Free/Starter

---

## 3. ARPU modeling

Assume mix shift over time as user base matures:

### Year 1 (early adopters — freemium heavy)

| Tier | % of users | ARPU |
|---|---|---|
| Free | 70% | RM 0 |
| Isi Ulang | 20% | ~RM 12/mo avg |
| Starter | 7% | RM 19 |
| Growth | 3% | RM 39 |

**Blended ARPU Y1: ~RM 4/month**

### Year 2 (tested wedge, retention-driven)

| Tier | % of users | ARPU |
|---|---|---|
| Free | 60% | RM 0 |
| Isi Ulang | 15% | ~RM 12 |
| Starter | 15% | RM 19 |
| Growth | 9% | RM 39 |
| Bisnis | 1% | RM 99 |

**Blended ARPU Y2: ~RM 9/month**

### Year 3 (mature, proportion paying grows)

| Tier | % of users | ARPU |
|---|---|---|
| Free | 50% | RM 0 |
| Isi Ulang | 10% | ~RM 12 |
| Starter | 20% | RM 19 |
| Growth | 18% | RM 39 |
| Bisnis | 2% | RM 99 |

**Blended ARPU Y3: ~RM 14/month**

### Paying-user-only ARPU (excluding free tier)

- Y1: ~RM 13/mo
- Y2: ~RM 22/mo
- Y3: ~RM 28/mo

**Compare to ID blended paying ARPU:** ~IDR 30-40K/mo (~RM 8-11/mo). MY ARPU **2-3x ID** at steady state. Justifies higher CAC ceiling.

---

## 4. CAC estimates (MY)

### Channel benchmarks (regional SaaS)

| Channel | Cost per paying customer (MY context) |
|---|---|
| Organic (referral, word-of-mouth) | RM 50-150 |
| TikTok organic content | RM 100-250 |
| Facebook organic (groups, page) | RM 100-250 |
| TikTok paid ads | RM 400-700 |
| Facebook paid ads | RM 400-800 |
| Google paid ads | RM 500-1,000 |
| Partner (UOB-style) | RM 50-200 (pass-through referral fee) |

### Blended CAC by phase

- **Phase 2 (month 0-6):** 100% organic + referral → **CAC RM 100-200**
- **Phase 2 scale (month 6-12):** 60% organic + 40% paid → **CAC RM 200-400**
- **Phase 3+ (post-validation):** 40% organic + 60% paid + partner → **CAC RM 300-500**

### Compare to Indonesia CAC

- ID blended: ~IDR 500K-2M = RM 150-600 per paying customer
- MY blended: ~RM 300-500 at steady state

**MY CAC ~1.5-2x ID** at mature state. Higher than some assume because paid ads are competitive di MY.

---

## 5. LTV / CAC / Payback

### Assumptions

- Monthly churn: 5% (consistent with SMB SaaS benchmark)
- Monthly retention: 95%
- Average customer lifetime: 20 months (1/churn)
- Paying-only ARPU (Y2 blended): RM 22/month

### LTV calculation

- LTV = ARPU × lifetime = **RM 22 × 20 = RM 440**

### Payback period

| Scenario | CAC | ARPU | Payback (months) |
|---|---|---|---|
| Phase 2 early (organic) | RM 150 | RM 22 | 6.8 |
| Phase 2 scale | RM 300 | RM 22 | 13.6 |
| Phase 3 mature | RM 400 | RM 22 | 18.2 |

### LTV/CAC ratio

| Scenario | LTV | CAC | Ratio | Healthy? |
|---|---|---|---|---|
| Phase 2 early (organic) | 440 | 150 | 2.9 | ✅ Marginal |
| Phase 2 scale | 440 | 300 | 1.5 | ⚠️ Weak |
| Phase 3 mature | 440 | 400 | 1.1 | ❌ Unhealthy |

**Industry rule:** LTV/CAC ≥3x = healthy SaaS.

**Read:** Di MY, **paid acquisition sustainable HANYA kalau blended CAC <RM 150** (organic-dominant). Kalau shift ke paid-heavy, economics deteriorate fast.

**Implication:** MY launch **harus organic-first**. Paid ads only after organic flywheel (referral, community, content) proven.

---

## 6. Sensitivity analysis

### If ARPU higher than base (RM 30/month paying)

- LTV = 30 × 20 = RM 600
- Payback @ CAC 400: 13 months
- LTV/CAC: 1.5 (still weak)

### If churn lower than base (3%/month = 33-month lifetime)

- LTV = 22 × 33 = RM 726
- LTV/CAC @ 400 = 1.8 (still below 3x)

### If churn is 3% AND ARPU RM 30

- LTV = 30 × 33 = RM 990
- LTV/CAC @ 400 = 2.5 (close to healthy)

**Takeaway:** Basic economics di MY **stretched thin**. Success requires:
- Organic-dominant acquisition (CAC <RM 200)
- Strong retention (<3% monthly churn)
- ARPU growth via upsell (Bisnis tier, add-ons)

Miss 2 of 3 → unprofitable unit economics.

---

## 7. Subsidy economics — PMKS Digital Grant MADANI

**50% of annual subscription covered, up to RM 5,000 per firm per year.**

### Impact pada customer acquisition

- Growth tier RM 39/mo × 12 = RM 468/yr
- Subsidy: 50% = RM 234
- Customer net pays: RM 234/yr = **RM 19.50/mo effective**

Messaging: **"Rp 39 — but hanya RM 20 setelah subsidi MADANI."**

### Requirement: CatatOrder must be MDEC Digitalisation Partner

- Application process: 1-2 months
- Phase 1 action: Start application pre-Phase 2 so it's ready at launch

### Eligibility exclusions

- Customer must be SSM-registered
- ≥RM 50K annual turnover
- ≥60% Malaysian-owned
- ≥6 months operating

**Excludes:** 40-50% informal tier. So subsidy helps small-tier upgrade path, not true-micro acquisition.

### Net CAC impact

For subsidy-eligible customers, effective CAC drop ~20-30% (lower friction to convert). But subsidy doesn't apply to all users → partial effect.

---

## 8. Revenue projection — 24 month conservative

### Phase 2 launch: Month 0 (conditional Gate 1 pass)

| Month | New paid/mo | Total paid | Blended ARPU | MRR | Cumulative revenue |
|---|---|---|---|---|---|
| 3 | 10 | 30 | RM 18 | RM 540 | RM 1,080 |
| 6 | 15 | 80 | RM 19 | RM 1,520 | RM 7,200 |
| 9 | 20 | 150 | RM 21 | RM 3,150 | RM 20,250 |
| 12 | 25 | 250 | RM 23 | RM 5,750 | RM 46,800 |
| 18 | 35 | 450 | RM 25 | RM 11,250 | RM 122,000 |
| 24 | 40 | 700 | RM 27 | RM 18,900 | RM 252,000 |

**Cumulative 24-month MY revenue: ~RM 250,000 (~IDR 870 juta)**

### Compare to operational cost

From [04-regulasi.md §9](./04-regulasi.md#9-cost-to-launch-summary-tables):
- Year 1 all-in cost: ~RM 52,000
- Year 2 steady state: ~RM 30,000

**24-month operational:** ~RM 82,000.

**Gross margin check:**
- Revenue RM 250K - Ops RM 82K = Net RM 168K contribution
- BUT ini tidak include Ariff compensation (Phase 2 co-founder salary ~RM 6K/mo × 12 = RM 72K)
- Net after Ariff comp: ~RM 96K over 24 months

**Conclusion:** MY Phase 2 launch can hit **operational breakeven by month 12-15** dengan aggressive organic execution. Tidak cover opportunity cost of founder time.

---

## 9. Bottom-line strategic reads

### 1. MY ARPU advantage real but modest

MY ARPU 2-3x ID. Tapi CAC juga 1.5-2x. **Net economic advantage ~30-50% vs ID**, bukan 2-3x.

### 2. Organic-first is non-negotiable

LTV/CAC math mandates organic acquisition dominant. Paid ads hanya after organic proven.

### 3. Subsidy leverage = strategic GTM lever

PMKS MADANI 50% subsidy adalah **biggest non-obvious advantage**. Apply MDEC Digitalisation Partner status di Phase 1.

### 4. Payback period manageable di low-CAC scenario (6-8 bulan)

Kalau CAC <RM 200, payback <9 bulan = acceptable. Mission-critical to control CAC.

### 5. Operational breakeven feasible by month 12-15

Tidak spectacular revenue, tapi self-sustaining. Bukan scaling home run — secondary market profile confirmed.

---

**Cross-references:**
- Operational cost detail → [04-regulasi.md](./04-regulasi.md)
- Payment gateway fees → [05-pembayaran.md](./05-pembayaran.md)
- GTM channels + CAC drivers → [10-go-to-market.md](./10-go-to-market.md)
- Strategic phased plan → [09-rekomendasi.md](./09-rekomendasi.md)

---

## Sources

- [Consistant — Bookkeeping Pricing in Malaysia 2025](https://consistantinfo.com.my/bookkeeping-pricing-in-malaysia-2025-comprehensive-guide-to-current-market-rates-and-strategic-financial-planning/)
- [YCK Consulting — Accounting Services Fees in Malaysia](https://yckconsulting.com/accounting/accounting-services-fees-in-malaysia/)
- [Jin Advisory — Bookkeeping Fees Malaysia Cost Guide](https://jinadvisory.my/en/bookkeeping-fees-malaysia/)
- [Funding Societies — PMKS MADANI 2025](https://fundingsocieties.com.my/msme-digital-grant-madani)
- Competitor pricing sources in [03-lanskap-kompetitif.md](./03-lanskap-kompetitif.md)
