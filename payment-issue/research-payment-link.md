# Research: Payment Link Solutions for CatatOrder

**Date:** 2026-03-27
**Use Case:** CatatOrder (SaaS order management) generates payment links for orders. Money must go DIRECTLY to seller, NOT pooled in CatatOrder. CatatOrder gets webhook notification.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Xendit xenPlatform](#2-xendit-xenplatform)
3. [Xendit Invoice API vs xenPlatform](#3-xendit-invoice-api-vs-xenplatform)
4. [Midtrans Sub-Merchant / Partner Model](#4-midtrans-sub-merchant--partner-model)
5. [Midtrans Iris (Disbursement)](#5-midtrans-iris-disbursement)
6. [DOKU Split Settlement](#6-doku-split-settlement)
7. [iPaymu Split Payment](#7-ipaymu-split-payment)
8. [OY! Indonesia](#8-oy-indonesia)
9. [Flip Business](#9-flip-business)
10. [Tripay](#10-tripay)
11. [PayDisini](#11-paydisini)
12. [Durianpay](#12-durianpay)
13. [Duitku](#13-duitku)
14. [Mayar.id](#14-mayarid)
15. [Digiflazz](#15-digiflazz)
16. [Regulatory Analysis](#16-regulatory-analysis)
17. [Comparison Matrix](#17-comparison-matrix)
18. [Recommendation for CatatOrder](#18-recommendation-for-catatorder)

---

## 1. Executive Summary

**Core problem:** CatatOrder needs to generate payment links where money goes DIRECTLY to seller accounts, CatatOrder receives webhook, and CatatOrder does NOT hold/pool money.

**Key finding:** There are exactly **2 clean architectural patterns** that work:

| Pattern | How it works | Best provider |
|---------|-------------|---------------|
| **A. Sub-account model** | Each seller is a sub-account under CatatOrder's master. Payment via `for-user-id` header routes money directly to seller's sub-account balance. | **Xendit xenPlatform** |
| **B. Per-seller gateway account** | Each seller registers their own gateway account. CatatOrder creates transactions using seller's API keys. Money goes to seller directly. | **Tripay, iPaymu, PayDisini** |

**Pattern that does NOT solve the problem:**
- Split settlement (DOKU, iPaymu split) -- money still enters platform first, then splits
- Collect-then-disburse (Midtrans + Iris) -- money pools in CatatOrder, then disbursed

---

## 2. Xendit xenPlatform

**Source:** https://docs.xendit.co/docs/xenplatform-overview, https://docs.xendit.co/docs/split-payments

### How It Works

xenPlatform is Xendit's marketplace/platform product. CatatOrder = Master Account. Each seller = Sub-Account.

**Money flow with `for-user-id`:**
```
Customer pays → Xendit → Money goes to SELLER's sub-account balance (NOT master)
                       → Webhook sent to CatatOrder (master)
                       → Seller withdraws to own bank account
```

When you include the `for-user-id` header in API requests, **payment goes straight to the sub-account balance, NOT the master account's balance.**

### Sub-Account Types

| Feature | Managed | Owned |
|---------|---------|-------|
| Dashboard access | Seller has full Xendit dashboard | Master controls everything |
| KYC | Seller does own KYC (KTP required, different from master) | No separate KYC needed |
| Verification wait | 3-5 business days | Immediate |
| Indonesia availability | Available | **Disabled by default** -- must contact Xendit support |
| Best for | Sellers who want visibility | Sellers who just want money |

**IMPORTANT:** Owned sub-accounts are disabled for Indonesia by default. You must contact Xendit support to enable them.

### KYC Requirements (Indonesia)

For **Managed sub-accounts:**
- Seller needs their own KTP (must be different from master account's KTP)
- Seller receives email invitation, must accept (status changes to REGISTERED)
- Then master submits KYC docs
- Wait 3-5 business days for verification
- Each seller must go through this process

### Fees

| Item | Cost (Indonesia) |
|------|-----------------|
| Active sub-account fee | Rp 25,000/month per active sub-account |
| In-house transfer fee | 0.5% per transaction, capped at Rp 10,000 |
| Xendit payment fees | Standard Xendit rates (QRIS 0.7%, VA ~Rp 4,000, etc.) |
| Fee billing | Can be billed to master OR sub-account |

### API Example (Invoice for Sub-Account)

```php
// Create invoice -- money goes to SELLER's balance
$create_invoice_request = new CreateInvoiceRequest([
    'external_id' => 'order-123',
    'description' => 'Pesanan #123',
    'amount' => 150000,
    'currency' => 'IDR',
]);
$for_user_id = "SELLER_BUSINESS_ID_HERE"; // seller's sub-account ID
$result = $apiInstance->createInvoice($create_invoice_request, $for_user_id);
// Returns invoice URL -- customer pays via this link
// Money goes to seller's Xendit balance, NOT CatatOrder
```

### Platform Fee (CatatOrder Revenue)

CatatOrder can charge a platform fee that gets deducted from the seller's payment:
```
Customer pays Rp 100,000
  → Rp 95,000 goes to seller sub-account
  → Rp 5,000 goes to CatatOrder master account (platform fee)
  → Xendit fee deducted from whoever is configured to pay
```

### Settlement to Seller's Bank

- Seller's payment lands in Xendit sub-account balance
- Virtual Account (BRI, BNI, Mandiri, Permata): **instant/real-time settlement**
- Virtual Account (BCA): T+1 business day
- Seller can withdraw to their bank account (free of charge)
- Withdrawal can be on-demand or recurring (auto-withdraw)

### Verdict for CatatOrder

| Pros | Cons |
|------|------|
| Money goes DIRECTLY to seller, never touches CatatOrder | Rp 25,000/month per active seller adds up |
| Webhook to CatatOrder works normally | Managed accounts need KYC per seller (KTP + 3-5 day wait) |
| Platform fee mechanism built-in | Owned accounts disabled in Indonesia by default |
| Seller can see their own dashboard (managed) | Seller must have valid KTP |
| Legal -- CatatOrder never holds money | Integration complexity higher than simple payment link |

**RATING: Best fit for CatatOrder's requirements.** This is the ONLY major provider that truly routes money directly to seller without CatatOrder touching it, with webhook support.

---

## 3. Xendit Invoice API vs xenPlatform

### Can You Use Invoice API Per-Seller WITHOUT xenPlatform?

**No.** The `for-user-id` header that routes money to a sub-account IS the xenPlatform feature. Without xenPlatform:
- Invoice API creates invoices under YOUR (CatatOrder's) account
- Money goes to YOUR Xendit balance
- You must then disburse to sellers manually

### With xenPlatform

- Invoice API + `for-user-id` header = money goes to seller's sub-account
- Same Invoice API, just with an extra header
- Webhook still goes to master account (CatatOrder)

**Conclusion:** You NEED xenPlatform. Invoice API alone does not solve the direct-to-seller problem.

---

## 4. Midtrans Sub-Merchant / Partner Model

**Source:** https://docs.midtrans.com/docs/merchant-administration-portal-partner-multi-outlet

### How It Works

Midtrans has a "Partner/Multi-outlet" feature:
- One partner account (CatatOrder) manages multiple merchant accounts
- Each merchant has its own dashboard (via dashboard.midtrans.com, login as Partner)
- Each merchant has separate transaction history, withdrawal summary
- Uses `X-PARTNER-ID` header in API calls

### Money Flow

**UNCLEAR from documentation.** Key observations:
- Midtrans docs mention per-merchant withdrawal summaries (gross, refund, fees, net)
- Partner can "add Merchants who have not registered yet with Midtrans"
- Suggests each sub-merchant has separate settlement
- But exact settlement flow (direct to merchant bank or through partner) is NOT clearly documented

### KYC / Registration

- Merchants can be added by partner even if not yet registered with Midtrans
- Midtrans likely requires standard merchant verification per sub-merchant
- User role-based access: users only see merchants they're assigned to

### Settlement Timeline Migration (2025)

Midtrans is standardizing `settlement_time` parameters, with migration starting April 2025 and completing June 2025.

### Verdict for CatatOrder

| Pros | Cons |
|------|------|
| Multi-merchant dashboard | Money flow to sub-merchants NOT clearly documented |
| Per-merchant withdrawal tracking | Likely requires Midtrans approval for partner status |
| Established provider (GoTo group) | Less transparent about direct settlement model |
| | Need to contact Midtrans sales for specifics |

**RATING: Possible but unclear.** Must contact Midtrans sales directly. Documentation does not clearly confirm money goes directly to seller without touching partner balance.

---

## 5. Midtrans Iris (Disbursement)

**Source:** https://docs.midtrans.com, LinkedIn Midtrans post

### How It Works (Collect-then-Disburse Model)

```
Customer pays → Midtrans → Money goes to CatatOrder's Midtrans balance
CatatOrder triggers Iris API → Disburse to seller's bank account
```

**This is NOT direct-to-seller.** CatatOrder HOLDS money temporarily.

### Two Schemes

| Scheme | Source of Funds | Use Case |
|--------|----------------|----------|
| Aggregator | Deposit account (topped up) | General disbursement |
| Facilitator | Your own bank account | Direct bank-to-bank |

### Features
- Bulk disbursement (pay many sellers at once)
- Recurring disbursement
- Maker/Approver workflow
- Connects directly to bank hosts

### Verdict for CatatOrder

**DOES NOT MEET REQUIREMENTS.** Money pools in CatatOrder first. This creates:
- Regulatory risk (CatatOrder holds customer funds)
- Need for PJP license potentially
- Operational complexity (managing disbursement timing)

Only useful as a FALLBACK if direct-to-seller is impossible.

---

## 6. DOKU Split Settlement

**Source:** https://docs.doku.com/get-started/manage-business/manage-finances/custom-settlement/split-settlement

### How It Works

```
Customer pays → DOKU → Settlement splits to multiple bank accounts
```

Split settlement divides transaction proceeds to up to 10 recipient bank accounts, based on percentage or fixed amount rules.

### Key Details

- **Configuration:** Via DOKU Dashboard (Reports > Reconciled Transactions) or via API
- **Split methods:** Percentage-based or fixed amount
- **Max recipients:** 10 bank accounts per transaction
- **Constraints:** Only local-to-local or overseas-to-overseas (no mix)
- **Remainder:** If split amounts < total, remainder goes to default account
- **Availability:** Indonesian Business Account only
- **Settlement timing:** H+2 (cards, VA, e-wallet), H+3 (certain cards), H+4 (convenience stores)

### Regulatory

DOKU has PJP Level 1 license from Bank Indonesia, PCI DSS, ISO 27001.

### Verdict for CatatOrder

| Pros | Cons |
|------|------|
| Can split to seller bank account directly | Money still goes through DOKU's system first |
| Rule-based automatic splitting | Not truly "direct to seller" -- it's split settlement |
| Established provider with full BI license | H+2 to H+4 settlement delay |
| Up to 10 recipients per transaction | Requires Indonesian Business Account |
| API available | Configuration is per-transaction, not per-merchant |

**RATING: Partial fit.** Money technically reaches seller's bank account via split, but it's DOKU splitting the settlement, not direct routing. This is closer to "CatatOrder collects, DOKU splits" rather than "money never enters CatatOrder." However, since DOKU handles the splitting, CatatOrder arguably never holds the money -- DOKU does.

**Regulatory gray area:** This might be acceptable if framed as "DOKU holds and splits" rather than "CatatOrder holds."

---

## 7. iPaymu Split Payment

**Source:** https://ipaymu.com/en/split-payment/, https://ipaymu.com/en/api-documentation/

### How It Works

```
Customer pays → iPaymu → Splits to multiple iPaymu accounts (agents/resellers)
```

**Key requirement:** All recipients (sellers) MUST have their own iPaymu account.

### Details

- **Per-split fee:** Rp 150 per split
- **Minimum split amount:** Rp 500
- **Real-time:** Automatic, system-based distribution
- **Requirement:** Each seller needs own iPaymu account
- **Integration:** Via API, custom split logic by merchant

### Alternative: Per-Seller iPaymu Account

Instead of split payment, each seller could have their own iPaymu account. CatatOrder creates payment via seller's API credentials:
```
Customer pays → iPaymu → Money goes to SELLER's iPaymu account
                       → Webhook to CatatOrder
```

This is Pattern B (per-seller gateway account).

### Registration

- iPaymu has easy activation, minimal upfront verification
- Integration can start before account verification
- Licensed by BI as PJSP since March 2018

### Verdict for CatatOrder

| Pros | Cons |
|------|------|
| Split payment built-in | Split still goes through iPaymu first |
| Low per-split fee (Rp 150) | Each seller needs iPaymu account |
| Easy registration | Per-seller account model requires managing multiple API keys |
| BI licensed (PJSP) | Less well-known than Xendit/Midtrans |
| SDK for PHP, Node, Go, Python, .NET, Java | |

**RATING: Good alternative.** Per-seller account model works for direct-to-seller. Split payment model is a simpler but less "pure" solution.

---

## 8. OY! Indonesia

**Source:** https://docs.oyindonesia.com/, https://www.oyindonesia.com/en/receive-money

### How It Works

OY! offers Payment Link API with:
- One-time or Reusable links
- Open or Closed amount
- VA, e-wallet, QRIS, card payments
- Real-time settlement
- 100+ banks, numerous e-wallets

### Multi-Entity Feature

OY! has "Multi Entity Management":
- Parent-subsidiary relationships (1 to N)
- Centralized balance distribution
- Sub-entity can have own payment links
- Free inter-entity transfers
- Combined analytics

### Settlement

- Funds from VA, Payment Links, Invoices → auto-recorded in OY balance (real-time)
- Withdrawal: "Instant with admin fee" or "Manual (free, 2 business days)"

### Verdict for CatatOrder

| Pros | Cons |
|------|------|
| Multi-entity supports sub-merchant model | Need to contact partner@oyindonesia.com for API auth |
| Real-time settlement | Documentation requires partnership approval |
| Sub-entity payment links | Less public documentation compared to Xendit |
| Free inter-entity transfers | Multi-entity feature scope unclear |

**RATING: Potentially viable.** Multi-entity feature could work like xenPlatform, but details are gated behind partnership agreement. Need to contact OY! directly.

---

## 9. Flip Business

**Source:** https://docs.flip.id/docs/accept-payment/v2-integration/

### How It Works

Flip Business "Accept Payment" feature:
```
Customer pays → Flip → Money goes to MERCHANT's (CatatOrder's) bank account
                     → Webhook callback to merchant
```

**Money flows to the account owner, not to a sub-entity.**

### Webhook System

- HTTP POST to specified webhook URL
- Must respond with 200 status
- Retry: 5 times, 2-minute interval
- Statuses: SUCCESSFUL, CANCELLED, FAILED

### Payment Methods

Bank Transfer, Virtual Account, E-Wallet, QRIS, Credit Card, Retail

### Verdict for CatatOrder

**DOES NOT support per-seller model.** Flip is designed as a single-merchant payment acceptance tool. No sub-merchant or split settlement feature found. Money goes to Flip Business account holder.

**RATING: Not suitable** for the direct-to-seller use case. Only works if CatatOrder collects and disburses.

---

## 10. Tripay

**Source:** https://tripay.co.id/developer, https://tripay.co.id/page/terms-and-conditions

### How It Works

Tripay is a payment aggregator, NOT a payment gateway itself. Partners with licensed gateways and banks (OJK-monitored).

**Two payment types:**
- **Closed Payment:** Fixed amount, single-use code
- **Redirect:** Customer directed to Tripay payment page

### Money Flow

```
Customer pays → Partner bank → Tripay holds → Settlement to merchant bank account
```

- Settlement: Automatic when balance reaches threshold
- Minimum withdrawal: Rp 30,000
- Auto-withdraw at configured threshold (processed Mon-Fri 07:00 WIB)
- Withdrawal fee: Rp 7,500 per withdrawal

### Callback/Webhook

- POST to merchant callback URL
- HMAC-SHA256 signature verification
- Statuses: PAID, FAILED, EXPIRED, REFUND
- Retry: 3 times, 2-minute interval

### Per-Seller Model (Pattern B)

**Each seller registers their own Tripay account.** CatatOrder uses seller's Tripay API credentials to create transactions:
```
Customer pays → Tripay → Money to SELLER's Tripay balance → Auto-settle to seller's bank
                       → Webhook to CatatOrder
```

**This works IF:**
- Each seller has own Tripay account (merchant code, API key, private key)
- CatatOrder stores and uses seller's API credentials
- Webhook URL points to CatatOrder's server

### Registration Requirements

- KTP-based registration (easy, no NPWP required for some methods)
- Bank account must match registered name
- Supported banks: BRI, BCA, BNI, BNI Syariah, Mandiri, BSI

### Fees

| Channel | Fee |
|---------|-----|
| QRIS | Rp 750 + 0.7% |
| Virtual Account | ~Rp 4,250 flat |
| E-wallet | ~3% |
| Withdrawal | Rp 7,500 per withdrawal |

### CRITICAL NOTE

**Tripay registration is currently CLOSED for new users.** This makes it non-viable as a new integration unless existing accounts are used.

### Verdict for CatatOrder

| Pros | Cons |
|------|------|
| Easy registration (when open) | **Registration currently CLOSED** |
| Per-seller account model works | Money still passes through Tripay briefly |
| Cheap fees | Managing multiple seller API keys is complex |
| Good webhook system | Withdrawal fee Rp 7,500 per withdrawal |
| Popular with UMKM | Settlement only Mon-Fri 07:00 WIB |

**RATING: Would be good, but registration is CLOSED.** Not viable for new sellers right now.

---

## 11. PayDisini

**Source:** https://payment.paydisini.co.id/docs/

### How It Works

```
POST https://api.paydisini.co.id/v1/
Parameters: api_key, unique_code, service_id, amount, validity, note, signature (MD5)
```

### Money Flow

```
Customer pays → PayDisini → Settlement to merchant account (1x24 hours)
```

All funds flow through PayDisini's platform before settlement.

### Payment Methods

| Category | Options |
|----------|---------|
| Virtual Account | BCA, BRI, BNI, Mandiri, Permata, Danamon, BSI, OCBC, Muamalat |
| QRIS | Standard, Custom, Danamon |
| E-wallet | OVO, DANA, LinkAja |
| Retail | Alfamart, Indomaret |

### Callback/Webhook

- POST to merchant callback URL
- Contains: payment_id, unique_code, status, signature
- IP whitelist: `45.87.242.188`
- Response: JSON success/failure
- Signature: MD5 hash verification

### Settlement

- Virtual Account, QRIS, E-wallet: 1x24 hours
- Retail: 3x24 hours

### Fees

- Bank transfer: Rp 1,500 - Rp 4,900
- Digital methods: 0.7% - 3%
- Minimum transaction: Rp 100 (QRIS)
- Maximum: Rp 50,000,000 (most channels)
- Fee can be passed to customer or absorbed by merchant

### Per-Seller Model

Same as Tripay -- each seller could have own PayDisini account. But PayDisini is a smaller provider.

### KYC

- Basic registration for platform access
- Custom QRIS requires KTP for merchant activation

### Verdict for CatatOrder

| Pros | Cons |
|------|------|
| Simple API | Small/less-known provider |
| Cheap fees | 1-3 day settlement delay |
| Fee can be passed to customer | No built-in sub-merchant model |
| Many payment methods | Per-seller model means managing many accounts |

**RATING: Viable for Pattern B** (per-seller account) but small provider risk. No sub-account model.

---

## 12. Durianpay

**Source:** https://www.durianpay.id/, https://docs.durianpay.id/

### How It Works

Modern B2B payment stack. 20+ local payment methods (VA, e-wallet, cards, QRIS).

### Sub-Account Feature

Durianpay offers:
- **Segregated subaccounts** for merchants or branches
- Balance monitoring per sub-entity
- Transaction tracking per sub-entity
- Automated fund movements via dashboard or API

### Disbursement

- Transfers to 130+ banks and e-wallets
- Split disbursement available (auto-splits large amounts)

### Verdict for CatatOrder

| Pros | Cons |
|------|------|
| Subaccount feature exists | Less documentation publicly available |
| Modern API (RESTful) | Newer/smaller company (founded 2020) |
| 20+ payment methods | Need to contact for sub-account details |

**RATING: Worth exploring.** Sub-account feature exists but details gated. Contact sales.

---

## 13. Duitku

**Source:** https://www.duitku.com/en/, https://docs.duitku.com/api/id/

### How It Works

Standard payment gateway. Per-merchant model. Each project gets merchant code + API key.

### No Sub-Merchant Feature Found

Documentation shows single-merchant model only. No evidence of sub-merchant, split settlement, or marketplace features.

### Verdict for CatatOrder

**RATING: Not suitable** for direct-to-seller model. Single-merchant only.

---

## 14. Mayar.id

**Source:** https://mayar.id/

### What It Is

No-code payment + commerce platform for SMEs. Not a payment gateway API.

### Features

- Payment Links (one-time, reusable)
- Static QRIS, Simple POS
- PayMe (open amount links)
- No-code, no API integration needed
- Integrates with Zapier, Pipedream (5000+ apps)

### Target Market

Content creators, educators, SMEs. Not designed for platform/marketplace model.

### Verdict for CatatOrder

**RATING: Not suitable.** Mayar is a standalone merchant tool, not a platform/marketplace solution. No sub-merchant, no API-first design for platforms.

---

## 15. Digiflazz

**Source:** https://developer.digiflazz.com/

### What It Is

Digiflazz is a **digital product marketplace** (pulsa, game vouchers, etc.), NOT a payment gateway. The webhook is for digital product transactions, not payment acceptance.

### Verdict for CatatOrder

**RATING: Not relevant.** Not a payment gateway. It's a digital product reseller API.

---

## 16. Regulatory Analysis

### Key Regulation: PBI 23/6/PBI/2021

Bank Indonesia regulates all Payment Service Providers (PJP) under this regulation.

### What Requires a PJP License?

1. **Account Issuance Services (AIS)** -- e-wallets
2. **Payment Initiation and/or Acquiring Services (PIAS)** -- payment gateways, acquirers
3. **Account Information Services (AInS)** -- account info aggregators
4. **Remittance Services**

### License Categories and Capital Requirements

| Category | Scope | Minimum Capital |
|----------|-------|----------------|
| Category 1 | All activities | Rp 15 billion |
| Category 2 | AIS + PIAS | Rp 5 billion |
| Category 3 (basic) | Limited, no system for others | Rp 500 million |
| Category 3 (system) | Provides system for other operators | Rp 1 billion |

### Does CatatOrder Need a PJP License?

**Critical question: Is CatatOrder a Payment Service Provider?**

**Arguments that CatatOrder does NOT need PJP:**
- CatatOrder is a SaaS (order management), not a payment processor
- CatatOrder uses licensed PJPs (Xendit, Midtrans, etc.) as backend
- CatatOrder never holds, processes, or settles funds
- Money flows directly between customer and seller via the PJP
- CatatOrder is analogous to a Shopify plugin that triggers payment -- Shopify itself is not a PJP
- The PJP (Xendit/Midtrans) handles all regulated payment activities

**Arguments that CatatOrder MIGHT need scrutiny:**
- CatatOrder generates payment links "on behalf of" sellers
- CatatOrder intermediates the payment flow (even if just passing through API calls)
- If CatatOrder collects funds before disbursing, it IS acting as a payment intermediary

**The safe answer:**
1. **If using xenPlatform (Pattern A):** CatatOrder is clearly NOT a PJP. Xendit (licensed PJP Level 1) handles everything. CatatOrder is just the platform that triggers API calls. Money never touches CatatOrder. **This is legally the safest model.**
2. **If using per-seller accounts (Pattern B):** CatatOrder is just a software that uses seller's own payment gateway credentials. Also safe -- CatatOrder never touches money.
3. **If collect-then-disburse:** DANGEROUS. CatatOrder holds customer funds. Could be interpreted as requiring PJP license.

### Regulatory Recommendations

- **Use Pattern A (xenPlatform) or Pattern B (per-seller accounts)**
- **NEVER pool customer funds in CatatOrder's account**
- **Document that CatatOrder is a SaaS platform, not a PJP**
- **Ensure the licensed PJP (Xendit) handles all payment processing**
- **Consult a fintech lawyer before scaling** (cost ~Rp 5-15 juta for opinion letter)

---

## 17. Comparison Matrix

### Direct-to-Seller Capability

| Provider | Sub-account model | Per-seller account model | Split settlement | Collect + disburse |
|----------|:-:|:-:|:-:|:-:|
| **Xendit xenPlatform** | **YES** | - | YES | - |
| **Midtrans Partner** | UNCLEAR | - | - | YES (Iris) |
| **DOKU** | - | - | YES | - |
| **iPaymu** | - | YES | YES (Rp 150/split) | - |
| **OY! Indonesia** | MAYBE (Multi-entity) | - | - | - |
| **Flip Business** | - | - | - | - |
| **Tripay** | - | YES (but CLOSED) | - | - |
| **PayDisini** | - | YES | - | - |
| **Durianpay** | MAYBE (subaccounts) | - | - | - |
| **Duitku** | - | - | - | - |
| **Mayar** | - | - | - | - |

### Webhook Support

| Provider | Webhook | Retry | Signature |
|----------|:-------:|:-----:|:---------:|
| Xendit | YES | YES | YES |
| Midtrans | YES | YES | YES |
| DOKU | YES | YES | YES |
| iPaymu | YES | - | YES |
| OY! | YES | YES | - |
| Flip | YES | 5x/2min | YES |
| Tripay | YES | 3x/2min | HMAC-SHA256 |
| PayDisini | YES | - | MD5 |
| Durianpay | YES | - | YES |

### Fee Comparison (QRIS)

| Provider | QRIS Fee | Settlement |
|----------|----------|------------|
| Xendit | 0.7% | Real-time (most) |
| Midtrans | 0.7% | H+1 |
| DOKU | ~0.7% | H+2 |
| iPaymu | ~0.7% | Varies |
| Tripay | Rp 750 + 0.7% | Auto at threshold |
| PayDisini | 0.7% | 1x24 hours |

---

## 18. Recommendation for CatatOrder

### Recommended: Xendit xenPlatform (Pattern A)

**Why:**
1. **Only provider with true direct-to-seller routing** via `for-user-id` header
2. Money NEVER touches CatatOrder -- legally clean
3. Built-in platform fee mechanism (CatatOrder's revenue model)
4. Full webhook support to CatatOrder
5. Seller gets own Xendit dashboard (managed accounts)
6. Xendit has PJP Level 1 license -- regulatory compliance handled
7. Settlement: real-time for most VA, instant for QRIS

**Costs per seller:**
- Rp 25,000/month per active sub-account
- 0.5% per in-house transfer (capped Rp 10,000)
- Standard Xendit payment fees on each transaction

**Integration steps:**
1. CatatOrder registers as Xendit Master Account
2. Enable xenPlatform feature
3. For each new seller: Create managed sub-account via API
4. Seller receives email → accepts → submits KTP
5. Wait 3-5 days for KYC verification
6. Once verified: Create invoices with `for-user-id = seller_business_id`
7. Customer pays via invoice link
8. Money goes to seller's Xendit balance
9. CatatOrder receives webhook
10. Seller withdraws to bank (free, auto or manual)

**Challenges to plan for:**
- KYC per seller (3-5 days wait, KTP required) -- need onboarding flow
- Rp 25,000/month per seller -- only viable if seller does sufficient volume
- Owned accounts disabled in Indonesia -- must use Managed accounts (more friction)

### Fallback: iPaymu Per-Seller Account (Pattern B)

**If xenPlatform is too complex or expensive for small sellers:**
1. Each seller registers own iPaymu account (easy, fast activation)
2. CatatOrder stores seller's iPaymu API credentials
3. CatatOrder creates transactions using seller's credentials
4. Money goes to seller's iPaymu account
5. Webhook notifies CatatOrder

**Pros:** Simpler per seller, no platform fee, lower barrier
**Cons:** Managing multiple API keys, seller must register iPaymu themselves

### NOT Recommended

- **Collect-then-disburse** (Midtrans + Iris): Regulatory risk, CatatOrder holds money
- **DOKU Split Settlement**: Money still passes through DOKU in CatatOrder's name first
- **Tripay**: Registration closed for new users
- **Flip**: No sub-merchant model
- **Mayar/Digiflazz/Duitku**: Not designed for this use case

---

## 19. Tambahan: Cheapest All-In Architecture (Deep Dive Session 2)

### iPaymu Accept + Flip Disburse = Rp 1.500/txn

Dari deep dive pricing comparison, kombinasi termurah untuk full marketplace model:

| Step | Provider | Cost |
|---|---|---|
| Customer bayar VA BNI/BRI | iPaymu | **Rp 1.500** |
| CatatOrder terima webhook | — | Rp 0 |
| CatatOrder auto-disburse ke seller | Flip | **Rp 0** (free inter-bank) |
| **Total** | | **Rp 1.500/txn** |

Ini 6x lebih murah dari Xendit all-in (Rp 9.500/txn).

**Kunci**: Flip free disbursement untuk business accounts. Accept + disburse = 2 API integration terpisah, tapi combined cost paling rendah di market.

**Caveat**: Flip free disbursement bisa berubah. iPaymu Rp 1.500 rate perlu di-verify 2026. Tapi bahkan kalau naik 2x, masih cheaper dari Xendit.

### Implikasi untuk CatatOrder Layer 4

Kalau CatatOrder eventually butuh full payment gateway (Layer 4), prioritas provider:

```
1. iPaymu (cheapest accept) + Flip (free disburse) = Rp 1.500/txn
2. Tripay (simple) + Flip (free disburse) = Rp 3.500-4.250/txn
3. Xendit xenPlatform (most features) = Rp 4.500+/txn
4. Midtrans (GoTo ecosystem) = Rp 4.000+/txn
```

---

## Sources

- [Xendit xenPlatform Overview](https://docs.xendit.co/docs/xenplatform-overview)
- [Xendit Split Payments](https://docs.xendit.co/docs/split-payments)
- [Xendit Accept Payments for Sub-Accounts](https://docs.xendit.co/docs/accepting-payments-for-sub-accounts)
- [Xendit Sub-Account Types](https://docs.xendit.co/docs/sub-accounts)
- [Xendit Help: Managed vs Owned](https://help.xendit.co/hc/en-us/articles/6787784288665)
- [Xendit Help: xenPlatform Fee](https://help.xendit.co/hc/en-us/articles/4413990486041)
- [Xendit Help: for-user-id](https://help.xendit.co/hc/en-us/articles/10534695308185)
- [Xendit Invoice API (PHP)](https://github.com/xendit/xendit-php/blob/master/docs/InvoiceApi.md)
- [Xendit Platform Fee Blog](https://www.xendit.co/en/blog/charge-a-platform-fee-using-xenplatform/)
- [Midtrans Partner/Multi-Outlet](https://docs.midtrans.com/docs/merchant-administration-portal-partner-multi-outlet)
- [Midtrans Iris Disbursement](https://athena-docs.midtrans.com/)
- [DOKU Split Settlement](https://docs.doku.com/get-started/manage-business/manage-finances/custom-settlement/split-settlement)
- [iPaymu Split Payment](https://ipaymu.com/en/split-payment/)
- [iPaymu API Documentation](https://ipaymu.com/en/api-documentation/)
- [OY! Indonesia Documentation](https://docs.oyindonesia.com/)
- [Flip Accept Payment](https://docs.flip.id/docs/accept-payment/v2-integration/)
- [Tripay Developer Guide](https://tripay.co.id/developer)
- [PayDisini API Documentation](https://payment.paydisini.co.id/docs/)
- [Durianpay Documentation](https://docs.durianpay.id/)
- [Duitku API Reference](https://docs.duitku.com/api/id/)
- [Mayar.id](https://mayar.id/)
- [Digiflazz Developer Docs](https://developer.digiflazz.com/)
- [PJP Regulation - Schinder Law](https://schinderlawfirm.com/blog/establishment-of-a-payment-service-provider-pjp-company-legal-aspects-and-implementation-challenges-in-indonesia/)
- [BI Payment System Regulation](https://www.bi.go.id/id/publikasi/peraturan/Pages/PBI_222320.aspx)
- [PBI 23 PJP Overview - Bitlion](https://bitlionai.com/framework/pbi-23-penyelenggara-jasa-pembayaran)
- [Payment Gateway License Indonesia - Gaffar](https://gaffarcolaw.com/news-insights/payment-gateway-license-in-indonesia/)
