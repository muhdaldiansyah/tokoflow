# 05 · Payment Infrastructure Malaysia

> Payment gateway comparison, DuitNow QR integration, e-wallet landscape.

**Versi:** 1.0 · **Diperbarui:** 2026-04-17

---

## 1. Executive summary

**3 critical findings:**

1. **Semua MY payment gateway kecuali Stripe butuh SSM-registered entity + MY business bank account.** Foreign entity (PT Akadevisi) tanpa Sdn Bhd = hanya bisa Stripe. Tapi Stripe **tidak native support DuitNow QR** (yang mencakup ~35% volume pembayaran MY).
2. **Billplz adalah optimal MVP choice** — FPX + DuitNow QR + cards + e-wallet, free Basic plan, no annual fee, fast onboarding 1-3 hari.
3. **CHIP punya "sub-merchant" model** (seperti Stripe Connect) — CatatOrder bisa onboard UMKM merchants di bawah master account tanpa each merchant KYC terpisah. **Penting untuk informal UMKM tanpa SSM.**

**Recommended stack:**
- **Billplz** sebagai primary (FPX + DuitNow QR + cards untuk customer payment via CatatOrder forms)
- **Curlec Premium** untuk recurring (CatatOrder's own subscription billing)
- **CHIP** sebagai backup + sub-merchant onboarding untuk UMKM tanpa SSM

---

## 2. Full gateway comparison (micro-SME lens)

| Gateway | Setup fee | Annual fee | FPX (B2C) | Credit card | DuitNow QR | E-wallet (TNG/Boost/Grab) | Settlement | Foreign entity OK? | Onboarding |
|---|---|---|---|---|---|---|---|---|---|
| **Billplz Basic** | RM 0 | RM 0 | 1.25% | 1.8% | 1.5% | 1.5% | T+1 FPX / real-time DuitNow | MY biz required | **1-3 days** |
| **Billplz Std** | RM 0 | RM 999 | 0.75% | 1.5% | 1.5% | 1.5% | same | same | same |
| **Toyyibpay** | RM 100 | RM 100/yr | **RM 1 flat** | 2% (min RM1) | 1.5%-2% | 1.5%-2% | T+1 | MY biz required | **1-3 days (easiest)** |
| **iPay88 SME** | RM 488 | RM 500 | 2.7% or RM 0.60 | 2.7% | ~1.5% | ~1.5% | T+2 to T+3 | MY biz required | 5-10 days |
| **iPay88 Enterprise** | RM 1,888 | RM 600 | same | ~1.8% negotiable | same | same | same | same | 5-10 days |
| **SenangPay** | RM 0 | RM 0 | 1.5% (min RM1) | 2.5% (min RM0.65) | 1.8% | 1.8% | T+1 to T+3 | MY biz required | 1-5 days |
| **CHIP (chip-in.asia)** | RM 0 | RM 0 | ~1.25% | 2% | **~1.6%** | ~1.5% | 1-2 biz days | MY biz required | **~1 day (fastest)** |
| **Fiuu (ex-Molpay/Razer)** | Custom | Custom | From RM 0.50 flat | ~2% | ~1.5% | ~1.5% | T+1 to T+2 | MY preferred, enterprise | 7-14 days |
| **Curlec Basic** | RM 0 | RM 0 | 1.5% (min RM1) | 2.4% | Not listed | 1.5% TNG/Boost / 1.5% Grab | Instant–T+1 | MY biz required | 2-5 days |
| **Curlec Premium** | RM 999 | RM 0 | **1.0%** (min RM1) | **2.0%** | Not listed | 1.3% | same | same | same |
| **Stripe MY** | RM 0 | RM 0 | ~1% + RM 1 | **3.0% + RM 1** | ❌ **Not supported** | ❌ Not native | T+7 default | **Global — foreign OK** | 1-3 days |

Sources: [Billplz](https://main.billplz.com/pricing), [Curlec](https://curlec.com/pricing/), [Toyyibpay](https://www.toyyibpay.com/pricing-plans/), [CHIP](https://www.chip-in.asia/collect), [Fiuu](https://fiuu.com/), [HitPay MY guide](https://hitpayapp.com/blog/stripe-alternatives-malaysia), [Ulement](https://ulement.com/the-ultimate-guide-to-choosing-a-payment-gateway-in-malaysia/).

---

## 3. Per-gateway analysis

### Billplz — RECOMMENDED for MVP

**Pros:**
- Paling balanced untuk micro-SME launch
- Free Basic plan, zero annual fee
- Real-time DuitNow settlement
- Strong FPX coverage (semua 18 MY banks)
- Open API + webhooks well-documented
- Popular among indie MY devs, good community support

**Cons:**
- Butuh MY Sdn Bhd + biz bank account
- Basic plan fee 1.25% FPX adalah middle-of-pack; Std plan (0.75%) memerlukan RM 999/yr annual fee

**Verdict:** 🟢 **Primary choice for Phase 2 launch.**

### Toyyibpay — Secondary option

**Pros:**
- **Extreme SME-friendly pricing: RM 1 flat FPX** (unbeatable for small tickets)
- Popular dengan religious/NGO/bootstrapped merchants → brand fit untuk warung-class UMKM
- BM-first dashboard + support

**Cons:**
- Low RM 100 setup + RM 100/year membuat barrier kecil tapi ada
- **10-day card settlement** — cash flow unfriendly
- Dated dashboard/API

**Verdict:** 🟡 **Secondary consideration.** Pertimbangkan kalau Billplz onboarding stuck atau target segmen sangat price-sensitive.

### CHIP (chip-in.asia) — Strategic optionality

**Pros:**
- **Fastest onboarding (~1 day)**, no setup/annual fee
- Clean API, modern stack
- **Sub-merchant model** (seperti Stripe Connect) — CatatOrder bisa onboard UMKM merchants di bawah master account
- BNM-licensed (Estonian-founded)

**Cons:**
- Newer player, less community than Billplz
- Sub-merchant model butuh verification terms ≠ straightforward pass-through

**Strategic importance:** Sub-merchant model kritis untuk **informal UMKM tanpa SSM**. Phase 3 feature: user bisa accept payment langsung via CatatOrder tanpa register payment gateway sendiri.

**Verdict:** 🟢 **Backup + strategic bet.** Integrate di Phase 3 untuk sub-merchant capability.

### Curlec (Razorpay) — Untuk SUBSCRIPTION (CatatOrder own revenue)

**Pros:**
- Best untuk **recurring billing / subscription** (CatatOrder's own product subscription revenue)
- DuitNow AutoDebit specialist
- Merchant acquirer license 2024
- Premium plan 1% FPX beats everyone except Billplz Std

**Cons:**
- Monthly RM 999 Premium fee = only worthwhile at scale
- Not primary for UMKM customer payment

**Verdict:** 🟡 **Use untuk billing CatatOrder's own subscriptions** (not UMKM customer-to-merchant payments). Switch dari Midtrans MY-side di Phase 2.

### iPay88 — NOT RECOMMENDED

**Reason:** High setup + annual fees (RM 488 + RM 500/yr minimum) membuat tidak feasible untuk SaaS platform yang onboard micro-SME. Sustainable only kalau CatatOrder absorbs fees on behalf, yang tidak scale.

### Fiuu (formerly MOLPay / Razer MS) — SKIP

**Reason:** Regional SEA coverage tapi enterprise-leaning + slow onboarding (7-14 hari). Better untuk cross-border ambisi. Tidak cocok untuk MY-only launch.

### SenangPay — Alternative

**Pros:** Free setup, BM-friendly merchant UX
**Cons:** Higher transaction fees vs Billplz

**Verdict:** 🟡 Consider kalau Billplz + Toyyibpay both decline.

### Stripe MY — Fallback for Path A (no MY entity)

**Critical gap:** ❌ **DuitNow QR tidak didukung native** (~35% MY digital payment volume). FPX didukung tapi butuh MY BRN.

**Verdict:** 🔴 **Use only kalau tidak bisa get MY entity.** Tidak sustainable untuk UMKM product.

---

## 4. DuitNow QR — National QR Standard

### What it is

- Operated by **PayNet** (BNM majority-owned)
- Universal MY QR code untuk payments (dari semua banks + e-wallets)
- Mandatory kompatibilitas untuk semua MY e-wallets
- Static (printed) dan dynamic (per-order) QR codes supported

### Fees

- **Merchant Discount Rate (MDR) waiver lifted Oct 2023**
- Typical merchant fee: **0.5% - 1.5%** depending on aggregator
- B2C: consumer pays zero direct fee

### Integration path

- **Direct PayNet integration:** Butuh jadi PayNet member bank atau licensed acquirer → **tidak accessible** untuk SaaS
- **SaaS integration:** Via aggregator (Billplz, CHIP, Curlec, Fiuu semua support)
- **No direct-to-PayNet option** untuk non-banks

### For CatatOrder

- Phase 2: Integrate via Billplz (included by default)
- Dynamic QR untuk per-order payment (user-specific)
- Static QR option untuk flexible payment ("bayar berapa saja")

Source: [PayNet DuitNow QR](https://www.duitnow.my/QR/index.html), [FintechNews MY fee analysis](https://fintechnews.my/39863/payments-remittance-malaysia/paynet-bnm-clarify-the-duitnow-qr-transaction-fee-confusion/).

---

## 5. FPX (Financial Process Exchange)

- Juga operated by PayNet
- Connects **18+ MY banks**
- **Ubiquity: ~95% of MY online bank account holders** can pay via FPX
- B2C flat fee **RM 1.00 per transaction** (bank-side); aggregators bundle into their rate
- Near-universal acceptance — equivalent of Indonesia's virtual account + QRIS combined

**For CatatOrder:** FPX bundled via Billplz/CHIP = table stakes. Customer clicks "Bayar" → pilih bank → redirect to bank login → confirm → return. Flow identical to Indonesia's VA.

---

## 6. E-wallet Landscape MY (2024-2026)

| Rank | Wallet | Owner | Users (est) | Note |
|---|---|---|---|---|
| 1 | **Touch 'n Go eWallet** | CIMB + Ant Group | ~20M | Dominant urban + toll, integrated TnG card |
| 2 | **MAE** | Maybank | High | Bank-owned, high penetration dengan Maybank customers |
| 3 | **GrabPay** | Grab | — | Tied to Grab ecosystem |
| 4 | **Boost** | Axiata | — | SME-focused loyalty features |
| 5 | **ShopeePay** | Sea | — | E-commerce-tied, growing |
| 6 | **BigPay** | AirAsia | — | Travel-focused |

**Critical simplification:** Semua e-wallet ini **accept DuitNow QR**. Artinya integrasi DuitNow QR via aggregator (Billplz/CHIP) **otomatis cover all 6 e-wallets**.

**Compare to Indonesia:** OVO + Dana + GoPay + LinkAja semua butuh integrasi terpisah. MY jauh lebih simple dari perspektif developer.

Source: [Oppotus MY E-wallet 2024](https://www.oppotus.com/malaysias-e-wallet-and-digital-banking-usage-in-2024/).

---

## 7. CRITICAL constraint untuk foreign entity

**Setiap MY gateway KECUALI Stripe butuh:**
- Malaysian SSM-registered entity (Sdn Bhd atau Sole Prop)
- MY business bank account
- Director yang KYC-verified

**3 paths untuk CatatOrder:**

### Path A — No MY entity (lean / Stripe only)

- ✅ Bisa launch immediately
- ❌ No DuitNow QR coverage
- ❌ Card fee 3% (vs 1.8-2% via Billplz)
- ❌ Perceived as "foreign tool" untuk MY user
- **Verdict:** Tidak sustainable untuk UMKM product

### Path B — MY Sdn Bhd (recommended)

- ✅ Unlock Billplz, CHIP, Curlec, Fiuu, Toyyibpay
- ✅ Full payment coverage (FPX + DuitNow QR + cards + e-wallets)
- ⚠️ Butuh RM 500K paid-up (foreign-owned WITHOUT MD status)
- ✅ **WITH MD Status: RM 1K paid-up only**
- **Verdict:** **Correct path with MD Status.**

### Path C — MD Status route (OPTIMAL)

Apply for Malaysia Digital (MDEC) status in parallel dengan Sdn Bhd incorporation:
- Paid-up capital RM 1K (not RM 500K)
- Tax holiday 10 years
- Founder MTEP visa bundle
- Payment gateway unlock

**Verdict:** **Default path. Must pursue.**

Detail di [04-regulasi.md §4](./04-regulasi.md#4-ssm--business-registration).

---

## 8. Integration effort estimate

| Gateway | Integration time (CatatOrder engineering) | Testing |
|---|---|---|
| Billplz | 2-3 weeks (well-documented, modern API) | 1 week |
| CHIP | 2-3 weeks (Stripe-like API) | 1 week |
| Curlec (subscription) | 3-4 weeks (webhook-heavy) | 1-2 weeks |
| Toyyibpay | 2-3 weeks (API older but functional) | 1 week |
| Stripe (fallback) | 1 week (already integrated for other cases) | 0.5 week |
| **Sub-merchant via CHIP** | **6-8 weeks** (onboarding flow + KYC propagation) | 2-3 weeks |

**Total Phase 2 payment integration:** ~5-7 weeks engineering for Billplz + Curlec. Sub-merchant (CHIP) defer ke Phase 3.

---

## 9. Fee structure modeling for CatatOrder pricing

**Assumption:** CatatOrder forward customer payment to UMKM merchant, takes no fee (payment gateway fee absorbed by merchant).

### For UMKM merchant receiving customer payment via CatatOrder form

| Payment method | Rate (Billplz Basic) | On RM 50 order |
|---|---|---|
| FPX | 1.25% | RM 0.63 |
| DuitNow QR | 1.5% | RM 0.75 |
| Credit card | 1.8% | RM 0.90 |
| E-wallet | 1.5% | RM 0.75 |

**Merchant net receive:** RM 49.10 - RM 49.37 (dari RM 50).

**Compare to Indonesia QRIS:** 0.7% = RM 0.35 on RM 50 = merchant receives RM 49.65. MY **sekitar 2x lebih mahal** than ID QRIS untuk merchant.

### For CatatOrder's own subscription billing

Via Curlec Premium:
- FPX: 1% + RM 1 = on RM 39 plan = RM 1.39 fee
- Card: 2% = RM 0.78 fee

Blended ~RM 1/subscription collection. Manageable.

---

## 10. Recommended implementation sequence

### Phase 2 launch (month 0-3)

- [ ] **Billplz** integration (primary gateway) — 2-3 weeks
- [ ] FPX + DuitNow QR tested end-to-end
- [ ] **Curlec Premium** integration untuk CatatOrder subscription billing — 3-4 weeks (kalau Premium worth RM 999/yr upfront)
- [ ] OR use **Stripe** untuk CatatOrder own billing (existing stack) di Phase 2, migrate ke Curlec Phase 3

### Phase 2 grow (month 3-6)

- [ ] **CHIP** sebagai backup (in case Billplz onboarding issues) — 2-3 weeks
- [ ] Testing failover between Billplz → CHIP

### Phase 3 (month 6-12, conditional Gate 2 pass)

- [ ] **CHIP sub-merchant model** untuk informal UMKM onboarding — 6-8 weeks
- [ ] DuitNow AutoDebit untuk recurring langganan orders (customer-side, bukan subscription)

---

## 11. Risks + monitoring

| Risk | Mitigation |
|---|---|
| Billplz onboarding rejected (foreign director concern) | CHIP as backup; also prepare MY local director docs |
| DuitNow QR rate increase by PayNet | Pass through to merchant with 30-day notice |
| Gateway downtime during payment flow | Failover architecture: Billplz primary, CHIP backup, manual bank transfer fallback |
| MY bank KYC for Sdn Bhd lengthy | Budget 2-4 weeks for business bank account opening post-incorporation |

---

## 12. Cost summary (payment-specific)

### Setup (one-time, Phase 2)

- Billplz onboarding: RM 0
- Business bank account (Maybank Biz or CIMB Biz): RM 0 - RM 500 depending on deposit
- Engineering integration Billplz + Curlec: internal resource, ~40-60 hours
- **Total setup cost: ~RM 500**

### Ongoing (per transaction, merchant-side)

- FPX: 1.25% (Billplz Basic) atau 0.75% (Std + RM 999/yr)
- DuitNow QR: 1.5%
- Card: 1.8%
- E-wallet: 1.5%

### CatatOrder own subscription collection

- Curlec Premium: RM 999/yr subscription + 1% FPX transaction = feasible kalau >RM 10K MRR

---

**Cross-references:**
- Sdn Bhd + MD Status context → [04-regulasi.md](./04-regulasi.md)
- Pricing impact on unit economics → [06-harga-ekonomi-unit.md](./06-harga-ekonomi-unit.md)
- Phase 2 launch sequencing → [09-rekomendasi.md](./09-rekomendasi.md)

---

## Sources

- [Billplz Pricing](https://main.billplz.com/pricing)
- [Curlec Pricing](https://curlec.com/pricing/)
- [ToyyibPay Pricing](https://www.toyyibpay.com/pricing-plans/)
- [CHIP Payment Gateway](https://www.chip-in.asia/collect)
- [Fiuu Payment Gateway](https://fiuu.com/)
- [PayNet DuitNow QR](https://www.duitnow.my/QR/index.html)
- [FintechNews MY — DuitNow QR Fees](https://fintechnews.my/39863/payments-remittance-malaysia/paynet-bnm-clarify-the-duitnow-qr-transaction-fee-confusion/)
- [HitPay — Stripe Alternatives Malaysia 2026](https://hitpayapp.com/blog/stripe-alternatives-malaysia)
- [Oppotus — MY E-wallet Usage 2024](https://www.oppotus.com/malaysias-e-wallet-and-digital-banking-usage-in-2024/)
- [Ulement — Top 10 Payment Gateways MY](https://ulement.com/the-ultimate-guide-to-choosing-a-payment-gateway-in-malaysia/)
