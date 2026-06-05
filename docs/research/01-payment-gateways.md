# Payment Gateway Research for Multi-Merchant Platform

> Which payment gateway can handle customer→seller payments with auto-confirmation?

---

## Executive Summary

CatatOrder needs automatic payment recording when customers pay UMKM store owners. The current static QRIS approach (manual verification) needs upgrading. Three providers have native marketplace/multi-merchant support: **Xendit (XenPlatform)**, **DOKU (Sub Account)**, and partially **DANA (Gapura)**. Midtrans (current provider) lacks native split payments but can work with a DIY disbursement approach.

---

## 1. Xendit Platform (XenPlatform) ⭐ BEST FIT

### Multi-Merchant Support
- **XenPlatform** is Xendit's dedicated marketplace product
- Create sub-accounts for each UMKM store owner
- Two types: **Managed** (you control KYC/transactions) and **Owned** (seller has dashboard access)
- **Split Rules API** — automatically route commission to CatatOrder + remainder to seller on every transaction

### Payment Methods
- QRIS (dynamic — all wallets: GoPay, OVO, DANA, ShopeePay, LinkAja, banking apps)
- Virtual Account (BCA, BNI, Mandiri, BRI, Permata, CIMB, etc.)
- E-wallets (OVO, DANA, GoPay, ShopeePay, LinkAja, AstraPay, JeniusPay)
- Credit/debit cards
- Retail outlets (Alfamart, Indomaret)
- Direct debit

### Fee Structure

| Method | Fee |
|--------|-----|
| QRIS | 0.63% (VAT inclusive) |
| Virtual Account (non-BCA) | Rp4,000 |
| Virtual Account (BCA) | Rp4,000 |
| DANA / AstraPay | 1.5% |
| OVO | 1.5% |
| ShopeePay | 2% (VAT inclusive) |
| Credit Card | 2.9% + Rp2,000 |
| **XenPlatform fee** | **Rp25,000/active sub-account/month** |
| **In-house transfer** | **0.5% capped at Rp10,000/txn** |

### Seller Onboarding / KYC
- Individual: KTP + selfie (NPWP optional). BPOM if selling food/cosmetics
- Entity: SIUP/NIB, NPWP, company deed
- Xendit performs KYC on your behalf
- Verification: 3-5 business days per sub-account
- Instant activation possible for low-risk individuals

### Settlement Times

| Method | Settlement |
|--------|-----------|
| VA (BRI, BNI, Mandiri, Permata) | Instant/Real-time |
| VA (BCA) | T+1 |
| E-wallets (OVO, DANA, LinkAja) | T+2 |
| QRIS | T+2 |
| Credit Card | T+2 |

### API / SDK Quality
- `xendit-node` v7.0.0 — npm, TypeScript built-in, Node 18+
- Modern REST API, comprehensive webhook system
- Next.js + QRIS + webhook tutorial exists
- Generally rated superior DX vs Midtrans

### Requirements
- Register on Xendit dashboard (KTP + selfie for individual)
- XenPlatform activation requires **entity business** (PT/CV/Yayasan)
- 1-3 business days approval
- No setup or monthly fees beyond per-active-sub-account charge

---

## 2. Midtrans (Current Provider)

### Multi-Merchant Support
- **No native split payment API** for routing funds to sub-merchants
- **Transaction Split** exists but is reporting/settlement feature only
- **Iris/Payouts** — disbursement system (transfer to banks/e-wallets), DIY marketplace approach
- Each merchant would need separate Midtrans account for true multi-merchant (impractical)

### Payment Methods
- QRIS (dynamic, via GoPay integration)
- GoPay (native — unique advantage)
- ShopeePay, DANA
- Virtual Account (BCA, BNI, Mandiri, BRI, Permata, CIMB)
- Credit/debit cards, retail outlets
- Akulaku PayLater, Kredivo

### Fee Structure

| Method | Fee |
|--------|-----|
| QRIS | 0.7% (VAT inclusive) |
| GoPay | 2% |
| ShopeePay | 2% |
| DANA | 1.5% |
| Virtual Account | Rp4,000 |
| Credit Card | 2.9% + Rp2,000 |

### Settlement
- Credit Card: D+1
- VA/Bank Transfer: T+3
- E-wallets/QRIS: H+1 (min Rp50,000)

### Limitations for CatatOrder
- No automatic split payment to sub-merchants
- Would require building custom disbursement layer using Iris
- QRIS fee slightly higher (0.7% vs 0.63%)
- **Advantage:** Already integrated for SaaS billing

---

## 3. DOKU — Alternative with Native Marketplace

### Multi-Merchant Support
- **Sub Account API** — create accounts for partners, transact on their behalf, split payments
- **Split Settlement** — define rules per payment (marketplace/platform/franchise use)
- Only works for Aggregator merchants

### Payment Methods
- 45+ methods: QRIS, VA, e-wallets, cards, BNPL (Akulaku, Kredivo), minimarket

### Fee Structure

| Method | Fee |
|--------|-----|
| QRIS | 0.7% |
| Virtual Account | Rp4,000 |
| Credit Card | 2.8% + Rp2,000 |
| DANA | 1.5% |
| OVO | 2-3.18% |

### Verdict
Solid alternative to Xendit. Sub Account + Split Settlement covers the use case. But older developer tooling and smaller community.

---

## 4. Other Providers

| Provider | Marketplace Support | QRIS Fee | Verdict |
|----------|-------------------|----------|---------|
| **Durianpay** | None | 0.7% | Not suitable |
| **Fazz** | Partial (API for marketplaces) | Unknown | Worth exploring later |
| **OY! Indonesia** | None (payment links only) | 0.7% | Payment link approach only |
| **Flip** | None (disbursement only) | N/A | Payout layer, not primary gateway |
| **Stripe Connect** | Not available in Indonesia | N/A | Not viable |
| **PayMongo** | Philippines only | N/A | Not applicable |
| **DANA Gapura** | Sub-merchant mgmt | 0.7% | Niche — DANA-only payments |
| **GoPay Direct** | Individual merchant only | 0% | Not programmable for SaaS |
| **OVO Direct** | No external API | N/A | Only via aggregator |

---

## 5. Regulatory Notes

### PJP License
- **CatatOrder does NOT need a PJP license** — use a licensed provider (Xendit/Midtrans/DOKU)
- BI Regulation No. 10/2025 legitimizes sub-account models

### QRIS MDR (March 15, 2025)

| Merchant Category | Transaction Amount | MDR |
|-------------------|-------------------|-----|
| Micro (< Rp400M/year) | < Rp500,000 | **0%** |
| Micro | > Rp500,000 | 0.3% |
| Small/Medium/Large | All | 0.7% |

Most UMKM food orders are < Rp500K → **0% MDR** for micro merchants.

---

## Comparison Table

| Provider | Marketplace | QRIS Fee | SDK | Settlement | Best For |
|----------|------------|----------|-----|------------|----------|
| **Xendit** | Native (XenPlatform) | 0.63% | xendit-node (TS) | Instant-T+2 | CatatOrder ⭐ |
| **Midtrans** | DIY (Iris payout) | 0.7% | midtrans-client | H+1 to T+3 | Current setup |
| **DOKU** | Native (Sub Account) | 0.7% | REST API | H+1 | Alternative |
| **OY!** | Payment links | 0.7% | REST API | Real-time VA | Simple approach |

---

## Sources
- [Xendit XenPlatform](https://www.xendit.co/en/products/xenplatform/)
- [Xendit Split Payments](https://docs.xendit.co/docs/split-payments)
- [Xendit Pricing](https://www.xendit.co/en-id/pricing/)
- [Xendit Node.js SDK](https://www.npmjs.com/package/xendit-node)
- [Xendit QRIS + Next.js Tutorial](https://www.sandimaulanajuhana.com/articles/xendit-qris-webhook-nextjs)
- [Midtrans QRIS API](https://docs.midtrans.com/reference/qris)
- [Midtrans Iris/Payouts](https://docs.midtrans.com/docs/disbursement-overview)
- [DOKU Sub Account](https://dashboard.doku.com/docs/docs/jokul-sub-account/jokul-sub-account-overview/)
- [DOKU Split Settlement](https://dashboard.doku.com/docs/docs/finance/split-settlement-overview/)
- [Bank Indonesia QRIS MDR](https://www.bi.go.id/id/publikasi/ruang-media/cerita-bi/Pages/mdr-qris.aspx)
- [BI PJP Regulation 2025](https://www.makarim.com/news/new-payment-systems-provider-framework)
- [Payment Gateway Comparison 2025](https://wartaekonomi.co.id/read583685/perbandingan-payment-gateway-indonesia-2025-midtrans-vs-xendit-vs-doku-untuk-pemilik-usaha)
