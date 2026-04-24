# 00 · Ringkasan Eksekutif — Malaysia Market Entry Analysis

> Deep-dive analisis peluang ekspansi CatatOrder ke Malaysia. Keputusan, justifikasi, dan next actions.

**Versi:** 1.0 · **Diperbarui:** 2026-04-17 · **Decision owner:** Aldi

---

## 📋 TL;DR — The decision in one page

### Strategic question
> **Apakah Malaysia adalah pasar yang lebih besar dari Indonesia untuk CatatOrder?**

### Answer
**TIDAK.** Indonesia effective TAM **15-25x lebih besar** dari Malaysia by value. Kompetisi MY lebih saturated (Orderla 3yr head start + Bukku bank partnership). CAC MY 1.5-2x ID. Yang di-advantage hanya ARPU (2-3x).

### But MY is still worth doing
Malaysia adalah **secondary market yang layak**, bukan pivot destination. 3 reasons:

1. **WhatsApp penetration tertinggi di SEA** (90.7% monthly use, 78% SME marketing)
2. **MD Status unlock** — foreign Sdn Bhd paid-up turun dari RM 500K → RM 1K, tax holiday, founder visa
3. **Verified white space** — no MY product unifies "WA ordering + bookkeeping + AI + community" untuk micro tier

### Recommended action

**Phase 1 (Sekarang - Okt 2026):** Fokus 80% Indonesia (selesai Play Store, 50+ paying). 20% MY reconnaissance via Ariff advisor (0.5-1% equity). Invest **~RM 4,000 total** untuk MY Phase 1.

**Phase 2 (Nov 2026+, conditional Gate 1 pass):** Sdn Bhd + MD Status + Billplz + launch MY dengan **Opsi B positioning** (home F&B wedge <RM 1M exempt dari MyInvois). Budget **~RM 52,000 Year 1**.

**Phase 3 (Nov 2027+, conditional Gate 2 pass):** Scale atau Sunset based on data.

---

## 📁 Document index

| # | Dokumen | Fokus |
|---|---|---|
| 00 | **[Ringkasan ini](./00-ringkasan.md)** | Executive summary + navigation |
| 01 | [Ukuran Pasar](./01-ukuran-pasar.md) | MSME landscape, TAM/SAM/SOM |
| 02 | [Adopsi Digital](./02-adopsi-digital.md) | WhatsApp + digital readiness |
| 03 | [Lanskap Kompetitif](./03-lanskap-kompetitif.md) | Orderla, Bukku, Status Quo deep-dive |
| 04 | [Regulasi](./04-regulasi.md) | LHDN, SST, SSM, PDPA, MDEC |
| 05 | [Pembayaran](./05-pembayaran.md) | Payment gateways, DuitNow QR |
| 06 | [Harga & Ekonomi Unit](./06-harga-ekonomi-unit.md) | Pricing, CAC, LTV, payback |
| 07 | [Positioning](./07-positioning.md) | Wedge strategy (Opsi A/B/C) |
| 08 | [Risiko](./08-risiko.md) | 14 risks dengan mitigasi |
| 09 | [Rekomendasi](./09-rekomendasi.md) | Phased plan + Ariff deal |
| 10 | [Go-to-Market](./10-go-to-market.md) | Channels, messaging, launch week |

---

## 🎯 Temuan paling penting

### 1. MyInvois RM 1M exemption (7 Dec 2025)

LHDN menaikkan e-invoice exemption dari RM 500K ke **RM 1 juta**, dan **menghapus Phase 5** (RM 500K-1M tier) sepenuhnya. Target segmen CatatOrder (micro-UMKM <RM 300K) **fully exempt**.

**Implikasi:** CatatOrder tidak perlu build MyInvois integration untuk launch. Offer sebagai upsell untuk graduating users. **[Detail →](./04-regulasi.md#2-lhdn-e-invoice-myinvois)**

### 2. MD Status (MDEC Malaysia Digital) = game-changer

Tax incentive + paid-up capital waiver:

- **Foreign-owned Sdn Bhd: RM 500,000 paid-up → RM 1,000 dengan MD Status** (500x reduction)
- Tax holiday 10 years (0% IP income, 5-10% non-IP)
- MTEP founder visa bundle
- Import duty exemption

Tanpa MD Status, MY entry tidak feasible secara finansial. **[Detail →](./04-regulasi.md#md-status--the-unlock)**

### 3. Orderla.my lebih lemah dari yang diasumsikan

Direct competitor analysis menemukan:

- **Zero external funding** (Tracxn)
- **~800 Instagram followers** untuk 14K claimed accounts (91.6:1 ratio = most dormant)
- **~RM 1,400 GMV/merchant/year** average = 1 tiny transaksi sebulan per merchant
- Founder publicly admits architectural limits (April 2025 blog)
- Laggy server, broken notifications (iOS review)
- **No bookkeeping at all** — just ordering form
- **No MyInvois** support

**Implikasi:** Orderla adalah category leader-by-default, bukan strong incumbent. Beatable on product + distribution dalam 12-18 bulan. **[Detail →](./03-lanskap-kompetitif.md#2-orderlamy--deep-dive-kompetitor-paling-direct)**

### 4. PDPA 2024/2025 stricter — Supabase migration needed

MY PDPA amendment in force 2025:
- Max fine RM 300K → **RM 1,000,000**
- Breach notification: **72 hours** (mandatory)
- DPO must be MY-resident untuk "large-scale" processing
- Cross-border transfer: **India adequacy UNCONFIRMED**

**Action item:** Migrate MY user data dari Supabase Mumbai ke Supabase Singapore di Phase 2. Engineering ~1-2 sprints. **[Detail →](./04-regulasi.md#5-pdpa--major-20242025-overhaul-attention-required)**

### 5. No MY BukuKas-equivalent exists

Momentum Works dan Tracxn research confirms **tidak ada MY equivalent** dari Indonesian BukuKas/BukuWarung. 76.5% MY SMEs adalah micro-enterprise yang currently served by:
- WhatsApp + paper (free, useless)
- Bukku Seed RM 35/mo (accountant-tilted, heavy)

**Implikasi:** CatatOrder's "Rp 15K isi ulang" model translates perfectly — **unique in MY market**. **[Detail →](./03-lanskap-kompetitif.md#5-indirect-competitor-status-quo)**

### 6. Billplz + CHIP + Curlec = optimal payment stack

- **Billplz** primary (FPX + DuitNow QR + cards + e-wallets, free Basic, fast onboarding)
- **CHIP** backup + sub-merchant model (penting untuk informal UMKM tanpa SSM)
- **Curlec Premium** untuk CatatOrder's own subscription collection

**All require MY Sdn Bhd.** Confirms MD Status path essential. **[Detail →](./05-pembayaran.md)**

### 7. PMKS Digital Grant MADANI = 50% subsidy leverage

MY government subsidy covers 50% of SaaS cost, up to RM 5,000/firm/year. At Growth RM 39/mo → customer pays effective **RM 20/mo**.

**Action item:** Register CatatOrder sebagai **MDEC Digitalisation Partner** di Phase 1. Unlocks this in marketing messaging. **[Detail →](./02-adopsi-digital.md#8-government-subsidies--key-distribution-lever)**

---

## 📊 Numbers that matter

### Market sizing

| Metric | Indonesia | Malaysia | Ratio |
|---|---|---|---|
| Total MSMEs | ~66M | 1,086,386 | 61x |
| Microenterprises | ~64M | 761,897 | 84x |
| GDP per capita | $4,925 | $11,874 | MY 2.4x |
| Effective TAM (paying) | ~1.3-2M | ~40-60K | ID 30x |
| 3-yr SOM (5% capture) | 65-100K users | 2-3K users | ID 30x |
| 3-yr SOM ARR | IDR 200-390M | IDR 8-16M | ID 15-25x |

### Operational economics

| Scenario | Year 1 cost | Year 2+ steady |
|---|---|---|
| Phase 1 reconnaissance | ~RM 4,000 | — |
| Phase 2 lean (no MY entity) | RM 29,500 | ~RM 13,000 |
| **Phase 2 recommended (MY Sdn Bhd + MD Status)** | **~RM 52,000** | **~RM 30,000/yr** |

### Expected revenue (Phase 2, conservative)

| Month | Paying users | MRR |
|---|---|---|
| 6 | 80 | RM 1,520 |
| 12 | 250 | RM 5,750 |
| 18 | 450 | RM 11,250 |
| 24 | 700 | RM 18,900 |

**Cumulative 24-month MY revenue:** ~RM 250,000 (~IDR 870 juta)
**Operational breakeven:** Month 12-15

### Unit economics

- Paying ARPU Y2 blended: **RM 22/month**
- LTV (20-month avg lifetime): **RM 440**
- Target CAC: <RM 200 (organic-dominant) → LTV/CAC 2.2 (acceptable)
- Payback period: 6-8 months (organic) → 13+ months (paid-heavy)

---

## 🚦 Gates — Kapan proceed, kapan pause

### Gate 1 — End of Phase 1 (Oct 2026)

Pass criteria (need 3 of 4):
- ✅ ID MRR > IDR 30 juta · retention > 80%
- ✅ 15+ MY testers genuinely engaged
- ✅ Ariff delivered 90-day commitments
- ✅ MY WTP validated: 10/15 interviews confirm RM 15+/mo WTP

→ **Pass:** Proceed to Phase 2 (MY soft launch)
→ **Fail:** Extend Phase 1 by 3 months atau sunset MY

### Gate 2 — End of Phase 2 (Oct 2027)

Pass criteria:
- ✅ 100+ MY paying customers
- ✅ MRR MY > RM 3,000 (~IDR 10M)
- ✅ 3-month retention cohort >60%
- ✅ Organic acquisition proof (referral >30% new signups)

→ **Pass:** Scale (Phase 3) — Ariff → co-founder, paid ads with RM 300 CAC cap, DuitNow AutoDebit, partnership play
→ **Fail:** Sunset atau maintain mode (preserve existing MY users, pause acquisition, refocus ID)

---

## ⚠️ Risiko paling kritis

### #1 — Distraksi pre-PMF Indonesia (Severity 9/9)

Split focus = neither market achieves PMF = runway habis. **80/20 rule non-negotiable sampai ID PMF validated.** **[Mitigasi →](./08-risiko.md#r3--product-market-fit-di-id-belum-solid-distraksi-ke-my-memperburuk)**

### #2 — CAC/LTV tidak sehat (Severity 7/9)

MY paid ads CAC 2-3x ID. Sustainable only organic-first. **Paid ads hanya setelah organic flywheel proven.** **[Mitigasi →](./08-risiko.md#r6--caclitv-ratio-tidak-sehat)**

### #3 — Ariff commitment collapse (Severity 6/9)

Partnership/nominee structures failing without proper vesting + deliverables. **Structured 0.5-1% advisor equity, 2yr vest, 6mo cliff, 90-day deliverables.** **[Mitigasi →](./08-risiko.md#r7--ariff-commitment-collapse--divergent-incentives)**

### #4 — Market size insufficient (Severity 6/9)

MY TAM realistic 40-60K paying. MRR ceiling ~RM 60-90K (~ID 200-300M). Cukup lifestyle, tidak scale ambitious. **Treat MY sebagai secondary, bukan primary.** **[Mitigasi →](./08-risiko.md#r1--market-size-insufficient-untuk-sustain-dedicated-team)**

---

## 🗓️ Timeline ringkas

```
2026
├── Apr (sekarang)  ↓
├── May-Oct: Phase 1 — 80% ID focus, 20% MY recon via Ariff
│            Goal: ID 50+ paying · MY 15 interviews + testers
├── Oct:    Gate 1 decision
│
├── Nov-Dec: (if Gate 1 pass) Sdn Bhd + MD Status + infrastructure
│
2027
├── Jan-Mar: Phase 2 launch — BM-first, Billplz, TikTok organic
├── Apr-Jun: Scale organic channels, referral program
├── Jul-Oct: Partnership exploration (Bank Islam, TNG)
├── Oct:    Gate 2 decision
│
├── Nov+:   Phase 3 — Scale (Ariff co-founder, paid, MyInvois)
│           OR Sunset (maintain, refocus ID)
```

---

## 🎬 Actions hari ini (17 Apr 2026)

### Immediate (next 2 weeks)

1. **Draft Ariff advisor agreement** — 0.75% equity, 2yr vest, 6mo cliff, 90-day deliverables (15 interviews, 10 testers, 5 testimonials)
2. **Land `catatorder.my` page** — redirect to `.id`, with BM A/B messaging test
3. **Monitor LHDN announcements** quarterly (watch for threshold changes)

### Phase 1 setup (30-60 days)

4. **Ariff begins recruiting** 15 MY home-biz testers dari network
5. **Apply MDEC Digitalisation Partner** status (1-2 month process)
6. **Engineering plan:** Supabase SG migration pre-Phase 2
7. **Engage MY compliance lawyer** untuk 2-hour scoping session (RM 2-3K)
8. **Trademark filing** "CatatOrder" MY class 9 + 35 (~RM 3,400)

### Ongoing Phase 1 (6 months)

9. **5 early warning signals monitor monthly** ([08-risiko.md §6](./08-risiko.md#6-early-warning-system--5-signals-to-watch))
10. **Re-evaluate Gate 1** Oktober 2026

---

## 💡 Philosophy: apa yang sebenarnya sedang di-test

> *Pasar yang lebih kecil tapi sudah kamu understand deeply adalah opportunity yang lebih besar daripada pasar yang lebih besar tapi asing.*

Indonesia 30x lebih besar MY. Aldi sudah 87-problem deep di Indonesia. Punya PT, traction, empathy, Play Store in progress.

Malaysia bukan prize bigger — Malaysia adalah **distraction disguised as opportunity**, KECUALI strictly diperlakukan sebagai secondary reconnaissance.

**Build where you already know the terrain. Reconnoiter where you don't.**

---

## 🔗 Quick navigation

- Serious about MY? Baca [09-rekomendasi.md](./09-rekomendasi.md) untuk full action plan
- Compete concern? Baca [03-lanskap-kompetitif.md](./03-lanskap-kompetitif.md)
- Cost question? Baca [04-regulasi.md §9](./04-regulasi.md#9-cost-to-launch-summary-tables)
- Unit economics? Baca [06-harga-ekonomi-unit.md](./06-harga-ekonomi-unit.md)
- GTM tactical? Baca [10-go-to-market.md](./10-go-to-market.md)
- Risk mapping? Baca [08-risiko.md](./08-risiko.md)

---

**Research methodology:** Analisis ini disusun melalui chain-of-thought dengan 3 parallel research agents (market intel + competitive + regulatory/payment) menggunakan web search + direct source fetch dari DOSM, SSM, LHDN, MDEC, competitor websites, LinkedIn, Tracxn, App Store, SEC filings. Semua angka cited dengan source. Data yang uncertain di-flag explicit untuk lawyer/tax consultation.

**Research date:** 17 April 2026
**Primary agents:** MY market + digital (DOSM/MDEC/OCBC), Competitive (Orderla/Bukku/15 others), Regulatory + Payment (LHDN/MDEC/SSM/BNM/BIllplz/CHIP)
