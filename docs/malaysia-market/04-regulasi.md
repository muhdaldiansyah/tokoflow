# 04 · Regulatory Landscape Malaysia

> LHDN e-invoice, SST/DST, SSM, PDPA, MDEC — dan apa artinya untuk CatatOrder.

**Versi:** 1.0 · **Diperbarui:** 2026-04-17 · **Flagged:** Beberapa area butuh konsultasi lawyer sebelum Phase 2

---

## 1. Executive summary regulatory

3 temuan yang mengubah kalkulasi entry:

1. **MyInvois exempt <RM1M** (raised dari RM500K per 7 Dec 2025). Target segment CatatOrder (micro-UMKM <RM300K) **tidak terkena compliance burden** e-invoice.
2. **MD Status (MDEC Malaysia Digital)** adalah game-changer. Paid-up capital drop dari RM500K → **RM1,000** + tax holiday + MTEP founder visa. Tanpa ini, entry cost brutal.
3. **PDPA 2024/2025 amendment** jauh lebih strict dari sebelumnya. RM1M fine max, 72-hour breach notification, mandatory DPO untuk "large-scale" processing. **Supabase Mumbai adequacy belum confirmed** → kemungkinan migrate MY data ke Supabase Singapore.

**Net impact:** Dengan MD status + tanpa MyInvois burden + Supabase SG migration, regulatory entry cost realistic Year 1 ~**RM52,000** (sudah include Sdn Bhd + PDPA + trademark). Manageable.

---

## 2. LHDN e-Invoice (MyInvois)

### Rollout phases (post-Dec 2025 revision)

| Phase | Revenue (FY2022 turnover) | Mandatory go-live |
|---|---|---|
| 1 | > RM 100M | 1 Aug 2024 |
| 2 | RM 25M – RM 100M | 1 Jan 2025 |
| 3 | RM 5M – RM 25M | 1 Jul 2025 |
| 4 | RM 1M – RM 5M | 1 Jan 2026 |
| **5 (CANCELLED)** | **RM 500K – RM 1M** | **Previously 1 Jul 2026 — ELIMINATED** |
| **Exempt** | **< RM 1M** | **Permanently exempt** |

Source: [LHDN official](https://www.hasil.gov.my/en/e-invoice/implementation-of-e-invoicing-in-malaysia/e-invoice-implementation-timeline/), [Sovos Dec 2025](https://sovos.com/regulatory-updates/vat/malaysia-mandatory-e-invoicing-exemption-threshold-increased/), [RTC Suite](https://rtcsuite.com/malaysias-new-rm1-million-e-invoicing-threshold-a-focused-update/).

### Grace period

Setiap phase dapat **6 bulan relaxation period** — consolidated e-invoices allowed, descriptions flexible, no Section 120 Income Tax Act penalties for non-compliance.

### Implication untuk CatatOrder

**Micro-UMKM CatatOrder segment (<RM1M) fully exempt.** Ini finding yang paling valuable:

- ❌ **Tidak perlu build MyInvois integration** untuk launch
- ❌ **Tidak perlu urus Peppol access point**
- ❌ **Tidak perlu LHDN digital certificate**
- ✅ **Offer MyInvois sebagai upsell feature** untuk users yang graduate past RM1M (future)
- ✅ **Competitive differentiation** vs Bukku: "Kami fokus di bisnis yang belum butuh e-invoice, Bukku untuk yang sudah butuh"

### Integration path (future upsell)

Kalau akhirnya dibangun (Phase 2/3):

- **MyInvois REST API** (free portal oleh LHDN) — direct integration
- Atau via **PEPPOL-compliant middleware** (Sovos, Storecove, Avalara)
- Format: **UBL 2.1 XML** via HTTPS dengan OAuth 2.0 auth
- Digital signature via LHDN-issued certificate required for production
- Typical one-time dev cost: **RM15,000 – RM50,000** (engineering + testing)
- **No LHDN platform fees**

### Unresolved — butuh lawyer consultation

**Mid-year migration trigger:** LHDN tidak explicit apa yang terjadi saat bisnis cross RM1M setelah 1 Jan 2026. Apakah langsung kena Phase 4, atau mulai next fiscal year? Tax agent consultation needed (anticipated in Phase 2 when first user graduates).

---

## 3. SST (Sales and Service Tax) + Digital Services Tax

### Registration thresholds + rates

- **SST threshold:** RM500,000 annual turnover (resident businesses). Wajib daftar dalam 28 days cross threshold.
- **Rate (standard):** 8% service tax sejak 1 Mar 2024 (beberapa services masih 6%: F&B restoran, telco, parking)
- **Digital Services Tax (DST) untuk foreign providers:** separate regime, RM500K rolling 12-month threshold, **juga 8%** per 1 Mar 2024

### Critical untuk CatatOrder (PT Akadevisi Indonesia selling into MY)

Sebagai foreign SaaS, CatatOrder **harus register sebagai Foreign Registered Person (FRP)** via Royal Malaysian Customs MySToDS portal menggunakan Form DST-01 **setelah** MY-source revenue cross RM500K rolling 12 months.

Post-registration:
- **Collect 8% DST** pada semua subscription fees ke MY customers (**baik B2C maupun B2B** — MY uniquely taxes B2B digital services, beda dari kebanyakan VAT regime)
- **Quarterly Form DST-02** filings
- **Penalty late registration:** sampai RM30,000 fine / 2 years imprisonment

### Pricing implication untuk CatatOrder MY (IDR → MYR)

Asumsi CatatOrder MY pricing:
- Free: 0
- Starter: RM 19/bulan
- Growth: RM 39/bulan
- Pro: RM 99/bulan

Untuk hit RM500K annual ARR dengan rata-rata blended RM30/user/bulan = **~1,400 paying users** needed.

**Timeline estimate:** Kalau Phase 2 launch Nov 2026 dengan growth 30 new paying/bulan, hit 1,400 users ~Jul 2030. Artinya ada **3-4 tahun runway tanpa DST burden**.

Setelah cross: price adjustment — pilihan (a) absorb 8% (MRR impact 8%), atau (b) pass-through ke customer (messaging challenge: price naik 8%).

### Strategic implication

**Short-term (<RM500K MY ARR):** Zero SST/DST burden. Jangan register prematurely — complexity tanpa benefit.

**Monitoring:** Track MY MRR monthly. Alert saat approach RM30K MRR (=RM360K ARR) → prepare DST registration dokumen.

---

## 4. SSM + Business Registration

### Sdn Bhd (Private Limited Company) — main path

| Item | Cost / Requirement |
|---|---|
| SSM incorporation fee | **RM 1,010** (incl. tax) |
| Minimum paid-up capital (local ownership) | RM 2 |
| **Minimum paid-up capital (foreign-owned, non-MD status)** | **RM 500,000** (general) · RM 1M (WRT) · RM 2.5M (manufacturing) |
| **Minimum paid-up capital WITH MD STATUS** | **RM 1,000** |
| Resident director (mandatory) | At least 1 "ordinarily resident" in MY |
| Company secretary (mandatory, licensed) | RM 1,200 – RM 2,400/year |
| Foreign ownership | 100% allowed in tech/SaaS/services (not WRT-restricted) |
| Annual audit | Required UNLESS revenue ≤RM 3M + assets ≤RM 10M + ≤30 employees (2025 rule) |
| Timeline | **1-3 working days** kalau dokumen complete |
| Annual compliance (secretary + filing + tax agent) | RM 2,000 – RM 6,000/year |

**Key:** **MD Status (MDEC) waiver** menurunkan paid-up capital requirement dari RM500K → RM1K untuk foreign-owned tech SaaS. Ini 500x lebih kecil. **Tanpa MD status, MY entry secara finansial tidak reasonable.**

### Sole Proprietor / Enterprise

| Item | Cost |
|---|---|
| Trade name | RM 60/year |
| Personal name | RM 30/year |
| **Eligibility** | **Malaysian citizens / PRs only — foreigners CANNOT register** |

❌ Aldi (Indonesian) **tidak bisa** register sole-prop MY. Harus via Sdn Bhd.

### Informality

~60-70% MY micro-enterprises operate informally atau sole-prop under personal name (DOSM proxy estimate, no official hard figure). Mirip dengan Indonesia.

**Implication:** Banyak CatatOrder potential MY customer tidak SSM-registered. **Jangan gate product pada SSM number** — accept user tanpa SSM, like in Indonesia.

### MD Status — the unlock

**Malaysia Digital (MD) Status, MDEC** — key incentive untuk tech SaaS:

Effective 1 Mar 2026 (new framework):

| Benefit | Detail |
|---|---|
| Tax | 0% on qualifying IP income + 5% or 10% on non-IP income (up to 10 years) OR 60%–100% Investment Tax Allowance |
| Qualifying activities | AI, big data, IoT, cybersecurity, **cloud services** (SaaS fits), blockchain, creative media |
| Paid-up capital requirement | **RM 1,000** (not RM 500K) |
| Employee requirement | ≥2 full-time employees earning avg ≥RM 5,000/month (= RM 10K/month payroll min) |
| Opex requirement | ≥RM 50,000/year |
| Import duty exemption | IT equipment |
| Founder visa | Linked to MTEP (see below) |

**For CatatOrder: MD status is near-mandatory.** Tanpa ini, foreign-owned paid-up requirement RM500K = RM1.75 miliar IDR modal yang tidak produktif. Dengan MD status, RM1,000 = ~IDR 3.5 juta.

**Application:** Self-filed via MDEC portal, ~30 days processing. Free (tidak ada application fee).

Source: [MDEC Malaysia Digital](https://www.mdec.my/malaysiadigital), [Tax Incentive](https://www.mdec.my/malaysiadigital/tax-incentive).

---

## 5. PDPA — Major 2024/2025 Overhaul (attention required)

### Personal Data Protection (Amendment) Act 2024

In force **1 Jan 2025** (phased through **1 Jun 2025**). Key changes:

| Item | Old (pre-2025) | **New (2025)** |
|---|---|---|
| Max fine (principle breach) | RM 300,000 | **RM 1,000,000** |
| Max imprisonment | 2 years | **3 years** |
| Data Protection Officer | Not required | **Mandatory for "large-scale"** (1 Jun 2025), must be MY-resident |
| Breach notification | Not required | **72 hours** to Commissioner, 7 days to data subjects |
| Breach notif failure fine | n/a | Up to RM 250K (breach alone) / RM 1M (material) |
| Cross-border transfer regime | White-list | **Abolished** → replaced by "adequacy / similar law / consent / TIA" |

Source: [Mayer Brown](https://www.mayerbrown.com/en/insights/publications/2025/07/from-legislative-reform-to-practical-guidance-key-amendments-to-malaysias-pdpa-and-the-launch-of-cross-border-transfer-guidelines), [Shearn Delamore](https://www.shearndelamore.com/whats-new/publications/pdpa-malaysia-compliance-guide/), [HHQ](https://hhq.com.my/posts/navigating-malaysias-mandatory-personal-data-breach-notification-obligations-under-the-pdpa/).

### Cross-border data transfer — CRITICAL

Under Cross-Border Personal Data Transfer Guidelines (29 Apr 2025):

- **Indonesia (UU PDP 2022):** Substantially similar to MY PDPA → transfer **likely permitted** under "similar law" basis, BUT **Transfer Impact Assessment (TIA)** must be completed and documented
- **Singapore (PDPA 2012):** Generally accepted as adequate
- **India (DPDP Act 2023):** **Adequacy status vis-à-vis MY PDPA UNCONFIRMED** by MY Commissioner

### ⚠️ CatatOrder issue: Supabase Mumbai

**CatatOrder's current Supabase instance is in Mumbai (India).** Per PDPA 2024/2025:

- India adequacy is unconfirmed
- Need either (a) migrate MY customer data ke Supabase Singapore region, atau (b) rely on explicit consent with TIA documentation

**Recommendation:** **Migrate MY data ke Supabase Singapore** at Phase 2 launch. Lebih clean legally, dan Singapore latency ke MY lebih baik dari Mumbai.

Engineering effort: ~1-2 sprint untuk setup multi-region Supabase + data routing logic based on user country.

### DPO (Data Protection Officer) threshold

"Large-scale" tidak punya hard numeric threshold. Factors: number of data subjects, volume/variety/sensitivity, duration, geographic scope.

SaaS dengan thousands of MY UMKM + their customer PII (names, phones, orders) **likely qualifies as large-scale**. DPO must be MY-resident.

**Options:**
- Hire locally: senior compliance FTE RM 8-15K/bulan = terlalu mahal untuk early stage
- **Outsourced DPO-as-a-Service:** RM 500 – RM 2,000/bulan = reasonable

### Compliance cost estimate

| Item | Cost |
|---|---|
| Initial PDPA compliance project (policy, TIA, data mapping, breach runbook) | RM 10K – RM 30K one-time (law firm + consultant) |
| Outsourced DPO-as-a-Service | RM 6K – RM 24K/year |
| Class of Data Users registration | Free but mandatory |

### Indonesia UU PDP comparison

| Aspect | Indonesia | Malaysia |
|---|---|---|
| Max fine | 2% annual revenue | RM 1M |
| DPO required | Public bodies / large-scale | Same, but MY-resident |
| Breach notification | "ASAP" | **72 hours** (stricter) |
| Criminal penalties | Limited | **Explicit, 3 years** (stricter) |

**Implication:** MY PDPA ~20% more strict operationally than ID. Berlaku untuk data MY user specifically; existing ID user tidak affected.

---

## 6. Founder visas (Indonesian founders)

Two MDEC-administered paths:

| Program | Use case | Annual income req | Allows MY company | Duration |
|---|---|---|---|---|
| **DE Rantau Nomad Pass** | Remote work for overseas clients | ~USD 24,000/yr | **No** — cannot run MY Sdn Bhd | 3-12 months, renewable |
| **MTEP (MY Tech Entrepreneur Program)** | Incorporate + run MY tech startup | Varies | **Yes** | MTEP New (1 year) or MTEP Experienced (5 years) |

**For CatatOrder:** MTEP is the correct path. Aldi apply MTEP New (1 year) dulu → confirm Phase 2 traction → MTEP Experienced (5 years) post-confirmation.

- Application: free via MDEC
- Processing: ~30 days
- Requirements: business plan + financial evidence

Source: [MDEC DE Rantau](https://www.mdec.my/derantau), [Foundingbird MTEP 2026 Guide](https://foundingbird.com/my/guides/the-complete-mtep-visa-guide/).

---

## 7. Trademark (MyIPO)

| Item | Cost |
|---|---|
| TM5 application fee | RM 250 per class |
| Publication fee (after examination) | RM 450 |
| Basic gov fees total | **RM 700** per class |
| Agent / lawyer fees (optional) | RM 1,000 – RM 2,500 typical |
| Timeline | ~18 months end-to-end (6-12mo examination + 2mo gazette) |

**Recommendation:** Register "CatatOrder" trademark MY class 9 (software) + class 35 (retail services) in Phase 1. Total ~RM 1,400 gov fees + RM 2K lawyer = RM 3,400 one-time.

**Madrid Protocol option** untuk international: bisa designate ID + MY + SG dari single filing. Explore jika Phase 3 SG/TH expansion.

---

## 8. Consumer protection + other

- **Consumer Protection Act 1999 + Electronic Trade Transactions Regulations 2012** — online sellers harus display name, address, contact, complaint redress, clear pricing, T&C
- Tidak onerous tapi mandatory
- **KPDN** (Kementerian Perdagangan) actively enforces mis-selling
- No mandated refund window specifically beyond "reasonable time"

### BNM Fintech Sandbox

- BNM Regulatory Sandbox untuk fintech — **TIDAK applicable** untuk CatatOrder (ordering + bookkeeping SaaS, bukan fintech)
- **Kecuali** product pivot ke embedded lending/BNPL (future, if partnership dengan Funding Societies-equivalent)

---

## 9. Cost-to-launch summary tables

### Scenario A — LEAN (no MY entity, Stripe only)

| Item | One-time | Monthly | Annual |
|---|---|---|---|
| Stripe signup | RM 0 | RM 0 | RM 0 |
| Stripe fees (~3% volume) | — | variable | — |
| DST registration (MySToDS) kalau cross RM500K MY ARR | RM 0 | RM 0 | Quarterly filings ~RM 1,500/qtr |
| PDPA compliance (outsourced DPO + policy) | RM 15,000 | RM 1,000 | RM 12,000 |
| Trademark (1 class) | RM 2,500 | — | — |
| **Total Year 1 baseline** | **RM 17,500** | **RM 1,000** | **~RM 29,500 Y1** |

**Tradeoff:** Tanpa DuitNow QR / FPX coverage → product-market fit risk signifikan di MY (warung tidak bisa accept local payment method).

### Scenario B — RECOMMENDED (MY Sdn Bhd + MD Status)

| Item | One-time | Monthly | Annual |
|---|---|---|---|
| Sdn Bhd incorporation (SSM + secretary setup) | RM 3,000 | — | — |
| Paid-up capital (MD Status waiver) | **RM 1,000** (not RM 500K) | — | — |
| MD Status application (self-filed) | RM 0 | — | — |
| Company secretary | — | — | RM 1,800 |
| Registered office | — | RM 150 | RM 1,800 |
| MTEP visa (founder) | RM 1,500 | — | — |
| Local resident director (nominee if no MY partner) | — | — | RM 6,000 |
| Tax agent + accountant | — | — | RM 4,800 |
| Audit (often waived if small) | — | — | RM 5,000 (worst case) |
| PDPA compliance + outsourced DPO | RM 15,000 | RM 800 | RM 9,600 |
| Trademark (1 class) | RM 2,500 | — | — |
| Billplz / CHIP onboarding | RM 0 | — | — |
| **Total Year 1** | **~RM 23,000** | **~RM 950** | **~RM 52,000 Y1** |
| **Total steady state Y2+** | | | **~RM 30,000/yr** |

### Trigger thresholds untuk additional cost

| Trigger | Additional cost |
|---|---|
| MY revenue > RM 500K/yr | SST/DST 8% collected + quarterly filings |
| MY user grow past RM 1M (individual user) | Offer MyInvois upsell feature (CatatOrder build: RM 15-50K one-time) |
| MY revenue > RM 3M/yr | Mandatory annual audit (RM 5-15K/yr extra) |
| "Large-scale" data processing confirmed | Dedicated resident DPO (RM 6-24K/yr) |

---

## 10. Flags / butuh lawyer consultation

Sebelum Phase 2 launch:

1. **Mid-year MyInvois migration** — LHDN tidak explicit; tax agent confirmation needed
2. **PDPA "large-scale" trigger** — specialist opinion apakah thousands of MY UMKM + their customer PII qualifies
3. **Cross-border MY → Supabase Mumbai** — lawyer confirmation + formal TIA + practical migrate to SG
4. **CHIP sub-merchant model + MY acquiring license** — verify apakah UMKM onboarded via platform perlu individual SSM, atau bisa pakai CatatOrder master merchant account (critical untuk informal UMKM tanpa SSM)
5. **Nominee director service agreement** — tight fiduciary liability + service agreement, lawyer-drafted RM 2-4K
6. **MY informality stats** — DOSM / SME Corp 2024 MSME Insights report untuk exact figures

---

## 11. Recommended regulatory path

### Pre-Phase 2 (preparation)

- [ ] Monitor LHDN announcements quarterly (RM 1M threshold change risk)
- [ ] Engineer plan Supabase SG migration
- [ ] Draft MD Status application (self-filed)
- [ ] Engage MY tax/compliance lawyer untuk 2-hour scoping session (~RM 2-3K)
- [ ] Trademark filing "CatatOrder" MY class 9 + 35

### Phase 2 launch (conditional Gate 1 pass)

- [ ] Incorporate Sdn Bhd dengan MD Status (RM 1K paid-up)
- [ ] MTEP visa application for Aldi
- [ ] PDPA compliance project (policy, TIA, data map, breach runbook)
- [ ] Migrate MY user data ke Supabase Singapore
- [ ] Appoint outsourced DPO
- [ ] Setup Billplz as primary gateway (detail di `05-pembayaran.md`)

### Phase 3 (scale, conditional Gate 2 pass)

- [ ] Monitor approach to RM 500K MY ARR → prepare DST registration
- [ ] Build MyInvois integration kalau first paying user cross RM 1M
- [ ] Engage local accounting firm (bukan hanya agent)

---

**Cross-references:**
- Payment gateway detail (Billplz, CHIP, dll) → [05-pembayaran.md](./05-pembayaran.md)
- Cost breakdown integrated with pricing model → [06-harga-ekonomi-unit.md](./06-harga-ekonomi-unit.md)
- Phased recommendation → [09-rekomendasi.md](./09-rekomendasi.md)

---

## Sources

- [LHDN — e-Invoice Implementation Timeline](https://www.hasil.gov.my/en/e-invoice/implementation-of-e-invoicing-in-malaysia/e-invoice-implementation-timeline/)
- [Sovos — Malaysia Mandatory E-Invoicing Threshold Increased, Dec 2025](https://sovos.com/regulatory-updates/vat/malaysia-mandatory-e-invoicing-exemption-threshold-increased/)
- [RTC Suite — RM1M e-Invoicing Threshold Update](https://rtcsuite.com/malaysias-new-rm1-million-e-invoicing-threshold-a-focused-update/)
- [ClearTax MY — E-Invoice Implementation Phases](https://www.cleartax.com/my/en/different-phases-implementation-timelines-einvoicing-malaysia)
- [PwC MY — Service Tax guide](https://www.pwc.com/my/en/publications/mtb/service-tax.html)
- [Bestar Asia — Malaysia DST Compliance 2025](https://www.bestar-asia.com/post/the-essentials-of-malaysia-digital-services-tax-dst-2025-compliance-for-foreign-businesses)
- [MySToDS — Foreign Service Provider guide](https://mystods.customs.gov.my/about-mystods)
- [ASEAN Briefing — Malaysia DST](https://www.aseanbriefing.com/doing-business-guide/malaysia/taxation-and-accounting/digital-service-tax-malaysia)
- [SSM — Table of Fees](https://www.ssm.com.my/Pages/Services/Registration-of-Business-(ROB)/table-of-fees/Table-of-Fees.aspx)
- [ShineWing TY Teoh — Sdn Bhd 2026 guide](https://shinewingtyteoh.com/how-register-company-sdn-bhd-malaysia)
- [Mondaq / Aqran Vijandran — Foreign Investor Sdn Bhd 2025](https://www.mondaq.com/inward-foreign-investment/1667706/how-to-set-up-a-sdn-bhd-in-malaysia-a-complete-guide-for-foreign-investors-2025)
- [Mayer Brown — PDPA Amendments + Cross-Border Guidelines](https://www.mayerbrown.com/en/insights/publications/2025/07/from-legislative-reform-to-practical-guidance-key-amendments-to-malaysias-pdpa-and-the-launch-of-cross-border-transfer-guidelines)
- [Shearn Delamore — PDPA Compliance Guide](https://www.shearndelamore.com/whats-new/publications/pdpa-malaysia-compliance-guide/)
- [HHQ — Data Breach Notification Obligations](https://hhq.com.my/posts/navigating-malaysias-mandatory-personal-data-breach-notification-obligations-under-the-pdpa/)
- [DLA Piper — MY Data Protection](https://www.dlapiperdataprotection.com/index.html?c=MY&t=law)
- [MDEC — Malaysia Digital](https://www.mdec.my/malaysiadigital)
- [MDEC — Tax Incentive](https://www.mdec.my/malaysiadigital/tax-incentive)
- [MDEC — DE Rantau](https://www.mdec.my/derantau)
- [Foundingbird — MTEP Visa Guide 2026](https://foundingbird.com/my/guides/the-complete-mtep-visa-guide/)
- [MyIPO — Trademark Forms and Fees](https://www.myipo.gov.my/trademark-forms-and-fees/)
