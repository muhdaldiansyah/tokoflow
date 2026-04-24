# 09 · Strategic Recommendation

> Keputusan yang disarankan + phased plan + gates untuk MY expansion.

**Versi:** 1.0 · **Diperbarui:** 2026-04-17 · **Decision owner:** Aldi (founder)

---

## 1. Direct answer ke strategic question

> *"Apakah MY adalah bigger opportunity than ID untuk CatatOrder?"*

### **Jawaban berdasarkan data: TIDAK.**

| Dimensi | Indonesia | Malaysia | Winner |
|---|---|---|---|
| Effective TAM (paying SaaS) | ~1.3-2M businesses | ~40-60K businesses | 🇮🇩 ID (~30x larger) |
| Sudah invested | Play Store, PT Akadevisi, market research, 87-problem depth | Zero capex | 🇮🇩 ID |
| Competitive saturation | Fragmented, no dominant WhatsApp-native player | Orderla.my (3yr head start) + Bukku + 5 more | 🇮🇩 ID |
| CAC | ~IDR 500K-2M (~RM150-600) | ~RM400-1,000 | 🇮🇩 ID |
| ARPU potential | ~IDR 25-50K (~RM7-14) | ~RM19-39 | 🇲🇾 MY |
| WhatsApp adoption | 41% in-conversation payment | 28% in-conversation payment; 51% SME use WA Business | Mixed |
| Regulatory simplicity (entry) | Sudah PT Akadevisi | Sdn Bhd + PDPA + SST = new lift | 🇮🇩 ID |
| Founder proximity | Aldi di ID | Aldi currently di MY; Ariff local | Tied |

**Skor: ID 6 · MY 1 · Tied 1**

### **Posisi yang disarankan:**

> **Indonesia = primary market. Malaysia = secondary reconnaissance.**
>
> MY bukan pivot destination. MY adalah **expansion opportunity yang layak setelah ID PMF terkonfirmasi**, bukan sebelum.

---

## 2. Mengapa "pindah fokus ke MY" adalah trap

Tiga alasan yang sering muncul untuk pivot ke MY, dan kenapa tidak valid:

### Trap 1 — "ARPU MY lebih tinggi, lebih mudah monetize"

**Reality:** ARPU 2-3x bukan compensate untuk CAC 2-3x + competitive saturation + new market learning curve. LTV/CAC ratio likely **sama atau lebih buruk** di MY.

### Trap 2 — "WhatsApp adoption MY tertinggi di SEA (51%)"

**Reality:** Angka ini true tapi misleading. Yang matter adalah:
- **Adoption ≠ willingness-to-pay.** 51% pakai WA Business, tapi <15% bayar untuk SaaS tool.
- **WA API penetration hanya 19%** — segmen yang butuh tool advanced masih kecil.
- **77% SME masih di basic digitalization stage** — bukan digital-native audience.

### Trap 3 — "Ariff excited + Aldi di MY, momentum ada"

**Reality:** Dua data point emosional (Ariff + geographic proximity) tidak mengubah market sizing. Momentum yang benar berasal dari **user menunjukkan WTP**, bukan dari founder energy.

**Heuristic:** *Kalau sebuah keputusan hanya make sense karena kamu sedang merasa frustrated dengan current path, itu biasanya bukan keputusan rasional — itu escape behavior.*

---

## 3. Phased plan — 24 bulan

### **Phase 1: Validate & Ship ID. Reconnaissance MY.** (0-6 bulan)

**Focus allocation: 80% ID · 20% MY**

**Indonesia objectives:**
- ✅ Play Store launch + 50+ paying customers
- ✅ Validate pricing with hard retention data (>80% monthly)
- ✅ Organic growth mechanism proven (referral, community, content)
- ✅ Build moat features: WA parsing accuracy, bookkeeping depth, pricing compass

**Malaysia objectives:**
- Ariff onboarded as advisor (0.5-1% equity, 2-year vest, 6-month cliff)
- 15 qualitative interviews with MY home-biz owners
- Landing page `catatorder.my` (redirect ke .id) dengan BM messaging test
- 5-10 MY testers using CatatOrder (free) — observe usage pattern
- NOT spend cash untuk paid acquisition di MY

**Exit criteria (Gate 1):**
- ID MRR > IDR 30 juta (~RM9K) · retention > 80%
- 15+ MY testers genuinely engaged (weekly active use)
- Ariff delivered on 90-day commitments
- MY WTP validated: 10/15 interview subjects confirm RM15+/month WTP

→ Kalau 3 dari 4 pass, proceed to Phase 2. Kalau <3, extend Phase 1.

---

### **Phase 2: MY soft launch** (6-12 bulan, conditional on Gate 1)

**Focus allocation: 60% ID · 40% MY**

**Infrastructure:**
- **Apply MDEC Malaysia Digital (MD) Status** — critical: menurunkan paid-up capital dari RM 500K → RM 1K (foreign-owned Sdn Bhd). Tanpa ini MY entry finansial tidak reasonable. See [04-regulasi.md](./04-regulasi.md#md-status--the-unlock).
- Setup Sdn Bhd dengan Ariff sebagai local director + 15-20% Sdn Bhd shareholder (4yr vest, 1yr cliff)
- Apply **MTEP founder visa** (bundled dengan MD Status)
- Register `catatorder.my` under Sdn Bhd
- **Migrate MY user data ke Supabase Singapore** (PDPA compliance — India adequacy unconfirmed)
- Integrate **Billplz** (primary — FPX + DuitNow QR + cards) + CHIP (backup, sub-merchant)
- Use **Curlec Premium** untuk CatatOrder's own subscription billing (future switch dari Midtrans)
- Proper i18n (BM default, English secondary)
- Full PDPA compliance (RM 10-30K one-time + outsourced DPO RM 500-2,000/mo)
- Apply **MDEC Digitalisation Partner** status (unlocks PMKS MADANI 50% subsidy in messaging)

**Product:**
- Localize UI (BM complete, English partial)
- Currency MYR + phone +60 + date format
- WA parsing for Bahasa Melayu informal

**Pricing (MY):**
- Free: 50 pesanan/bulan
- Starter: RM19/bulan atau isi ulang RM29/100 pesanan
- Growth: RM39/bulan unlimited
- Pro: RM99/bulan (matching ID Bisnis tier scaled)

**GTM:**
- Community-led: Ariff recruit 5 "champion" home-biz owners (free Growth tier + case study)
- TikTok organic Bahasa Melayu — 3 post/week, home-biz tutorial
- Facebook group seeding: PUMM, Usahawan Kuih Malaysia, etc.
- Referral program RM30 credit both sides
- NO paid ads di 3 bulan pertama

**Exit criteria (Gate 2):**
- 100+ MY paying customers
- MRR MY > RM3,000 (~IDR 10M equivalent)
- Retention cohort 3-month >60%
- Organic acquisition proof (referral >30% of new signups)

→ Kalau pass, Phase 3. Kalau tidak, extend atau sunset.

---

### **Phase 3: Scale atau Sunset** (12-24 bulan)

**Scenario A — Scale (Gate 2 passed, momentum strong):**
- Ariff transition ke part-time co-founder (bigger equity grant, 4yr vest)
- Paid acquisition experiments (TikTok ads, FB ads) with strict CAC cap RM300
- Integrate DuitNow QR, e-wallet (TnG, GrabPay)
- Consider MyInvois integration kalau user base mulai graduate past RM1M revenue
- Content expansion: BM podcast, SME MY newsletter partnership

**Scenario B — Sunset (Gate 2 failed, MY tidak traction):**
- Preserve existing MY users (grandfathered pricing)
- Pause new MY acquisition
- Re-focus 100% ID
- Retain `catatorder.my` domain + Sdn Bhd (optionality)
- Ariff offboard gracefully (retain advisor equity already vested)

**Decision criteria 24-month:**
- MY MRR > RM50K = clear scale signal → continue
- MY MRR RM10-50K = secondary market, maintain mode
- MY MRR <RM10K = sunset

---

## 4. Resource allocation detail

### Cost Phase 1 (reconnaissance only)

| Item | Cost |
|---|---|
| Ariff advisor (0.5-1% equity, no cash) | RM0 cash |
| Landing page `catatorder.my` dev | RM1,500 one-time |
| 15 user interviews (tools, voucher incentive) | RM500 |
| Legal (advisor agreement template) | RM1,000 |
| Misc (research tools, subscriptions) | RM1,000 |
| **Total Phase 1 (6 bulan)** | **~RM4,000 (~IDR 14 juta)** |

### Cost Phase 2 (soft launch)

Based on detailed research in [04-regulasi.md §9](./04-regulasi.md#9-cost-to-launch-summary-tables):

| Item | Cost |
|---|---|
| Sdn Bhd incorporation (SSM + secretary setup) | RM 3,000 one-time |
| **Paid-up capital with MD Status waiver** | **RM 1,000** (not RM 500K) |
| MD Status application (self-filed) | RM 0 |
| MTEP founder visa | RM 1,500 |
| Company secretary annual | RM 1,800/year |
| Registered office | RM 1,800/year |
| Local resident director (nominee if no MY partner) | RM 6,000/year |
| Tax agent + accountant | RM 4,800/year |
| PDPA compliance + outsourced DPO | RM 15,000 one-time + RM 9,600/year |
| Trademark (1 class) | RM 2,500 one-time |
| Billplz / CHIP onboarding | RM 0 |
| Supabase SG migration (engineering) | internal ~40-60 hours |
| BM translation (professional) | RM 5,000-10,000 one-time |
| Community manager MY part-time | RM 1,500/mo × 6 = RM 9,000 |
| Misc operational | RM 3,000 |
| **Total Phase 2 Year 1** | **~RM 52,000 (~IDR 180 juta)** |
| **Total steady state Y2+** | **~RM 30,000/year** |

### Expected Phase 2 revenue (optimistic)

- Month 3: 30 paying × RM29 avg = RM870 MRR
- Month 6: 80 paying × RM32 avg = RM2,560 MRR
- Month 9: 150 paying × RM34 avg = RM5,100 MRR
- Month 12: 250 paying × RM36 avg = RM9,000 MRR

Cumulative 12-month MY revenue: ~RM40-50K. Close to breakeven operational cost.

---

## 5. Ariff deal structure

### Phase 1 — Advisor (0-6 bulan)

- **Role:** MY advisor + local representative
- **Equity:** 0.5-1% common stock, 2-year vesting, 6-month cliff
- **Cash:** RM0
- **Commitment:** 5-8 hours/week
- **Deliverables (90 days):**
  - Recruit 15 MY home-biz tester
  - Conduct 15 user interviews with written summary
  - Produce 3-5 testimonial video (BM) for social proof
  - Benchmark competitor UX (Orderla, Bukku) with first-hand notes
- **Exit clause:** Kalau 90-day deliverables <60% complete, advisor ends, equity forfeited (per cliff).

### Phase 2 — Co-founder (6-12 bulan, conditional)

- **Role:** MY Managing Director, Sdn Bhd local director
- **Equity:** 15-20% Sdn Bhd shares (Indonesian parent retains 80-85%) + 2-3% parent company equity
- **Vesting:** 4 years, 1-year cliff (resets from Phase 2 start)
- **Cash:** RM3,000-5,000/bulan (part-time) atau RM6,000-8,000 (full-time quit MSU)
- **Commitment:** 20-30 hours/week (part-time) atau full-time
- **Deliverables:**
  - 100+ paying MY customer dalam 6 bulan
  - MY GTM strategy document + executed playbook
  - Local BM community manager hired

### Phase 3 — Scale (12+ bulan)

- Kalau MY scale (Gate 2 passed): Ariff full-time, package review, equity top-up kalau needed
- Kalau sunset: Ariff offboard, retain vested equity (0.5-1% parent + proportional Sdn Bhd)

---

## 6. What NOT to do

**Jangan:**

1. ❌ **Pivot full ke MY.** ID PMF is achievable dan ID market fundamentally lebih besar.
2. ❌ **Kasih Ariff 50%+ Sdn Bhd pre-validation.** Irreversible commitment pre-data.
3. ❌ **Build MyInvois integration** sampai ada 50+ MY paying yang butuh (segmen target tidak butuh).
4. ❌ **Kompete head-on dengan Orderla.my** di fitur ordering. Compete di wedge yang berbeda (home F&B niche + bookkeeping).
5. ❌ **Paid acquisition di MY** sebelum bukti organic acquisition works.
6. ❌ **Translate semua UI day 1** — translate incrementally on demand.
7. ❌ **Setup Sdn Bhd sebelum Gate 1 passed** — premature legal overhead.
8. ❌ **Promise Ariff equity bigger than vested reality** — written agreement protects both.

---

## 7. Decision today (2026-04-17)

Based on current state (ID Play Store in progress, Aldi di MY bertemu Ariff, l.wl.co issue solved):

**Immediate actions:**

1. **Lanjutkan ID as primary.** Selesaikan Play Store launch, onboarding, 50-user paying milestone.
2. **Ariff advisor agreement.** Draft dalam 2 minggu, 0.75% equity, 2yr vest, 6mo cliff, 90-day deliverables.
3. **MY reconnaissance only.** Ariff start recruiting 15 interview subjects in 30 days.
4. **Landing page `catatorder.my`.** Redirect to `.id` for now, add BM messaging A/B test.
5. **Monitor 5 early warning signals** monthly (see 08-risiko.md).

**Re-evaluate Gate 1 di Oktober 2026** (6 bulan dari sekarang).

---

## 8. Philosophical close

Pasar yang lebih kecil tapi sudah kamu understand **deeply** adalah opportunity yang lebih besar daripada pasar yang lebih besar tapi asing.

Indonesia punya 1,300x market size MY dalam UMKM count. Kamu sudah 87-problem-deep di Indonesia. Kamu punya PT, punya traction, punya empathy dengan user.

MY bukan prize yang bigger — MY adalah distraction yang disguised sebagai opportunity, *kecuali* kamu treat it as strictly secondary reconnaissance.

**Build where you already know the terrain. Reconnoiter where you don't.**

---

**Cross-references:**
- Risk register → [08-risiko.md](./08-risiko.md)
- Positioning Opsi B → [07-positioning.md](./07-positioning.md)
- GTM playbook detail → [10-go-to-market.md](./10-go-to-market.md)
- Market sizing → [01-ukuran-pasar.md](./01-ukuran-pasar.md)
- Competitor detail → [03-lanskap-kompetitif.md](./03-lanskap-kompetitif.md)
