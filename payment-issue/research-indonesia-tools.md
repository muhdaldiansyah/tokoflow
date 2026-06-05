# Research: ALL Indonesian Tools for Payment Verification (Online Sellers / WA Commerce)

> Last updated: 2026-03-27
> Scope: Every tool in the Indonesian market that addresses payment verification for online sellers, especially WA/social commerce sellers.

---

## TABLE OF CONTENTS

1. [Payment Gateway Aggregators (API-based)](#1-payment-gateway-aggregators)
2. [Bank Mutation Monitoring Services](#2-bank-mutation-monitoring-services)
3. [Payment Link / Invoice Platforms](#3-payment-link--invoice-platforms)
4. [WhatsApp-Native Payment Solutions](#4-whatsapp-native-payment-solutions)
5. [E-commerce Builders with Auto Payment](#5-e-commerce-builders-with-auto-payment)
6. [POS Systems with Payment Integration](#6-pos-systems-with-payment-integration)
7. [Omnichannel Commerce Platforms](#7-omnichannel-commerce-platforms)
8. [QRIS-Focused Providers](#8-qris-focused-providers)
9. [Comparison Matrix](#9-comparison-matrix)
10. [Key Insights for CatatOrder](#10-key-insights-for-catatorder)

---

## 1. PAYMENT GATEWAY AGGREGATORS

These are API-first payment gateways that provide virtual accounts, e-wallets, QRIS, and webhook/callback for automatic payment verification.

### 1.1 Tripay.co.id
- **URL**: https://tripay.co.id
- **How it works**: Payment gateway aggregator. Merchant creates transaction via API, customer pays to VA/QRIS/e-wallet/retail, Tripay sends callback (webhook) to merchant server when payment confirmed. Two channel types: DIRECT (all on your site) and REDIRECT (customer goes to Tripay page).
- **Payment verification method**: Automatic via webhook/callback. HMAC-SHA256 signature validation. Callback retries up to 3x with 2-min intervals. IP whitelist required (95.111.200.230).
- **Pricing (flat fees)**:
  - VA: BCA Rp 5,500 | BRI/BNI/Mandiri/Permata/CIMB/BSI/OCBC/Danamon/Muamalat Rp 4,250
  - QRIS: Rp 750 + 0.7%
  - E-wallet (OVO/DANA/ShopeePay): 3%
  - Retail (Alfamart/Indomaret): Rp 3,500
  - No setup fee, no monthly fee
- **API/Webhook**: Full REST API. Webhook with HMAC-SHA256 signature. Open Payment & Closed Payment types. Fee calculator API. Transaction listing API.
- **Target market**: Small-medium merchants, developers, indie sellers. Registered as PSE (Electronic System Provider).
- **Unique approach**: One of the cheapest aggregators. Very developer-friendly. WordPress/WooCommerce plugin available. Open Payment channel lets merchants receive to a persistent VA number.

### 1.2 PayDisini
- **URL**: https://paydisini.co.id
- **How it works**: Micro payment gateway aggregator. Merchant creates transaction via POST API, customer pays, PayDisini sends callback to merchant URL.
- **Payment verification method**: Server-to-server POST callback. Signature verification via MD5 hash (key + unique_code + 'CallbackStatus'). IP whitelist validation.
- **Pricing (flat fees)**:
  - VA: BCA Rp 4,900 | BRI/Mandiri/Permata/Danamon Rp 2,500 | BNI Rp 4,000 | BSI Rp 3,500 | OCBC Rp 1,500 | Muamalat Rp 3,500
  - E-wallet (OVO/DANA/LinkAja): 3%
  - QRIS: 0.7%-0.9%
  - Retail (Alfamart/Indomaret): Rp 2,500
  - Settlement: 1x24h (bank), 3x24h (retail)
  - No setup/monthly fee. Free registration.
- **API/Webhook**: REST API at api.paydisini.co.id/v1/. Endpoints: new transaction, check status, cancel, payment channels, payment guide. MD5 signature.
- **Target market**: Micro merchants, digital product sellers, hosting companies. Very low barrier to entry.
- **Unique approach**: Among the cheapest VA fees in Indonesia (OCBC at Rp 1,500). Simple API suitable for solo developers.

### 1.3 Duitku
- **URL**: https://www.duitku.com
- **How it works**: Payment gateway + disbursement. Merchant integrates via API, customers pay through 25+ channels, Duitku sends webhook notification on payment.
- **Payment verification method**: Automatic webhook callback on successful payment. API for status checking.
- **Pricing**:
  - VA: ~Rp 4,000 flat (some channels MDR + Rp 1,000 incl. VAT)
  - Credit card: ~2.9% + Rp 2,000
  - QRIS: 0.7%
  - E-wallet: varies
  - Normal price ~Rp 7,500/transaction for some methods
  - No registration fee, no maintenance fee
- **API/Webhook**: Full API documentation at docs.duitku.com. Sandbox testing environment. Webhook callbacks.
- **Target market**: UMKM to enterprise. Strong WordPress/WooCommerce integration. Popular with indie developers.
- **Unique approach**: Flat fee model attractive for small merchants. Settlement < 24 hours. Integrated disbursement (send money out).

### 1.4 Midtrans (GoTo Group)
- **URL**: https://midtrans.com
- **How it works**: Full-stack payment gateway. Multiple integration modes: Snap (popup/redirect), Core API (full control), Payment Link (no-code). Automatic webhook on payment status change.
- **Payment verification method**: Server-to-server notification (webhook). Signature key verification. Transaction status API for verification.
- **Pricing**:
  - VA: from Rp 4,000 flat
  - Credit card: 2.9% + Rp 2,000
  - QRIS: 0.7%
  - E-wallets: varies by provider
  - No subscription fee, no integration fee
- **API/Webhook**: Comprehensive API (Core API, Snap API). SDKs for multiple languages. Sandbox environment. Webhook with signature validation.
- **Target market**: Startups to enterprise. Part of GoTo ecosystem. Massive merchant base.
- **Unique approach**: Most widely used in Indonesia. Snap integration is very quick to set up. Payment Link feature for no-code sellers.

### 1.5 Xendit
- **URL**: https://www.xendit.co
- **How it works**: Payment gateway + disbursement + payment links. API-first approach. Webhook notifications on payment events.
- **Payment verification method**: Webhook callbacks with signature verification. Transaction status polling API. Real-time notifications.
- **Pricing**:
  - VA: ~Rp 4,000 flat
  - Credit card: ~2.9% + Rp 2,000
  - QRIS: 0.7%
  - E-wallets: OVO 2.73-3.18%, ShopeePay 2-4%, DANA/LinkAja 1.5-3%
  - No setup/monthly fee
- **API/Webhook**: Excellent developer documentation. SDKs for PHP, Node, Java, Python. Batch disbursement API. Recurring billing. xenInvoice for no-code payment links.
- **Target market**: Modern startups, tech-savvy UMKM. Strong in SEA region.
- **Unique approach**: xenInvoice allows creating payment links shareable via WhatsApp/social media without website. Fast account activation. 140+ bank disbursement.

### 1.6 iPaymu
- **URL**: https://ipaymu.com
- **How it works**: Payment aggregator as a service. Supports payment acceptance + COD + escrow. WhatsApp Bot for transaction monitoring.
- **Payment verification method**: Webhook callback. WhatsApp Bot for real-time balance/transaction alerts. API status checking.
- **Pricing**:
  - VA: Rp 3,500-4,500 (varies by bank)
  - Credit card: 2.5% + Rp 2,000
  - QRIS: 0.7% + 1.8% (H+0) or 0.7% (H+2)
  - Static QRIS offline: 0%-0.3%
  - Direct Debit: 1.4% + Rp 2,000 (GPN/BNI/BTN) or Rp 5,000 (Mandiri/BRI)
  - Convenience store: Rp 4,000 + 1.8% (H+0) or Rp 4,000 (H+3)
  - COD: 3%
  - No activation/monthly fees
- **API/Webhook**: REST API (JSON/XML). Official SDKs on GitHub. Direct API for one-call payment code generation. Split Payment feature.
- **Target market**: UMKM, e-commerce, developers. Strong COD and escrow features.
- **Unique approach**: WhatsApp Bot for QRIS balance checking and transaction monitoring. COD payment support. Escrow service. Split payment for marketplace models.

### 1.7 DOKU
- **URL**: https://www.doku.com
- **How it works**: Pioneer payment gateway in Indonesia (since 2003). 45+ payment methods. Includes PayChat (WhatsApp payment) and payment links.
- **Payment verification method**: Webhook/callback notification. PayChat for in-WhatsApp payment completion.
- **Pricing**:
  - VA: Rp 4,000 flat
  - Credit card: 2.80% + Rp 2,000
  - QRIS: 0.7%
  - E-wallets: DOKU/DANA 1.5%, OVO 2-3.18%, ShopeePay 2-4%, LinkAja 2-3.5%
  - Minimarket: Alfamart Rp 5,000, Indomaret Rp 6,500
  - PayLater: 1.5-2.3%
  - No setup fee, no monthly fee
- **API/Webhook**: Comprehensive API. PayChat API for WhatsApp integration. Bank Account Validation API (Rp 500/request).
- **Target market**: Enterprise to UMKM. 150,000+ merchants. Oldest player in Indonesia.
- **Unique approach**: **DOKU PayChat** -- in-WhatsApp payment solution. Customers chat, order, and pay directly in WhatsApp without switching apps. Bill Broadcast for bulk invoice via WA. Dashboard + API options.

### 1.8 NICEPAY
- **URL**: https://nicepay.co.id
- **How it works**: Payment gateway with Merchant Aggregator model. Single API for all payment methods. Real-time merchant panel.
- **Payment verification method**: Webhook callback. Real-time back office analytics. Single API integration.
- **Pricing**: Transaction-based fees. Specific rates not publicly listed. Shorter admin process via aggregator model.
- **API/Webhook**: Single API for all payment types. Integration with 30+ shopping carts. 24/7 customizable APIs.
- **Target market**: Marketplace, enterprise. PCI DSS Level 1 certified. Licensed by BI since 2017.
- **Unique approach**: Korean parent company (NICE Information Service). Global-grade infrastructure with local compliance. Merchant Aggregator model accelerates onboarding.

### 1.9 Winpay
- **URL**: https://www.winpay.id
- **How it works**: Payment gateway with SNAP API integration (Bank Indonesia standard). 25+ payment methods. Payment Link feature for social media sellers.
- **Payment verification method**: Webhook notifications. SNAP API with asymmetric signature validation per BI standards.
- **Pricing**: Transaction-based. Specific public rates not listed. Competitive for UMKM.
- **API/Webhook**: SNAP API integration (BI standard). Customized plugins. Technical docs at docs.winpay.id. Apiary API docs.
- **Target market**: UMKM to enterprise. Focused on BI SNAP compliance.
- **Unique approach**: Partners with Innovasia for WhatsApp payment integration. SNAP API compliance means future-proof BI interoperability. Payment Link for social sellers via Winpay app.

### 1.10 Faspay
- **URL**: https://faspay.co.id
- **How it works**: Indonesia's first registered payment gateway (since 2003). 50+ payment methods. 30+ payment partners.
- **Payment verification method**: Webhook/callback. Real-time transaction dashboard.
- **Pricing**:
  - Credit card: Rp 2,000 + bank MDR (direct) or Rp 2,000 + 2.7% (aggregator)
  - Retail: Rp 5,000
  - Recurring billing available
  - PCI-DSS Level I certified
- **API/Webhook**: Payment API with anti-fraud features. Settlement reports for accounting. Recurring payment API.
- **Target market**: Startups, UMKM to corporate. Special UMKM program.
- **Unique approach**: Recurring/subscription billing feature. One of the oldest, most established players. Detailed settlement reports.

### 1.11 Durianpay
- **URL**: https://www.durianpay.id
- **How it works**: Modern payment infrastructure. Accept payments + automated payouts to 130+ banks/e-wallets via single API.
- **Payment verification method**: Webhook callbacks. API for transaction status. Sandbox testing environment.
- **Pricing**: Competitive per-transaction fees. Custom plans available. No hidden fees.
- **API/Webhook**: RESTful API. Up to 10,000 API requests/minute. Sandbox mode. Bulk disbursement API.
- **Target market**: Startups, fintech, modern businesses. BI PSP Category 2 licensed.
- **Unique approach**: Combined payment acceptance + disbursement in single platform. Very high API rate limits. PCI DSS + ISO 27001 certified.

### 1.12 Sakurupiah
- **URL**: https://sakurupiah.id
- **How it works**: Payment gateway aggregator focused on UMKM. QRIS, VA, e-wallet, PPOB support.
- **Payment verification method**: Instant webhooks/callbacks. Real-time dashboard.
- **Pricing**: Low transaction fees. Free registration (ID only, 5-min activation). No monthly fees.
- **API/Webhook**: Developer API. Plugin integrations. Webhook/callback support.
- **Target market**: UMKM, thin-margin businesses. Fastest onboarding.
- **Unique approach**: Extremely fast onboarding (verification in hours). Settlement H+0 to H+1. Cheapest QRIS integration for micro merchants.

### 1.13 OY! Indonesia
- **URL**: https://www.oyindonesia.com
- **How it works**: Payment acceptance + fund routing to multiple bank accounts. Payment links via API or dashboard.
- **Payment verification method**: Webhook callback. Payment link with status tracking. WhatsApp notification integration.
- **Pricing**:
  - Inter-bank transfer: Rp 4,000
  - E-wallet transfer: Rp 2,000
  - No integration fees
- **API/Webhook**: Full API for payment links, disbursement. Send WhatsApp API for auto-sending payment links. Multi-account routing.
- **Target market**: Businesses needing payment acceptance + disbursement.
- **Unique approach**: Send payment link directly to customer WhatsApp from dashboard. Route single payment to up to 10 recipient accounts. Transparent dashboard pricing.

### 1.14 LinkQu
- **URL**: https://www.linkqu.id
- **How it works**: Money transfer platform with payment gateway features. VA, QRIS, disbursement, e-wallet, payment link.
- **Payment verification method**: Webhook/callback. API status checking.
- **Pricing**: Interbank transfer Rp 4,000. Low admin fees. Free via mobile app.
- **API/Webhook**: API for VA, QRIS, disbursement. Transfers to 136+ banks. API disbursement < 1 hour for large transactions.
- **Target market**: UMKM, businesses needing fast disbursement.
- **Unique approach**: Licensed by BI. ISO 27001:2022. Fast disbursement as key differentiator. Payment link for online stores.

### 1.15 Pivot Payment
- **URL**: https://pivot-payment.com
- **How it works**: Modern payment provider with 25+ payment methods. API or hosted checkout page options.
- **Payment verification method**: Webhook/callback. Real-time dashboard.
- **Pricing**: Transaction-based. Promo: Rp 1B fee subsidy for new merchants (Sep-Dec 2025).
- **API/Webhook**: API integration + ready-to-use checkout page. Smart routing optimization.
- **Target market**: Growing businesses. Licensed by BI. PCI DSS + ISO 27001.
- **Unique approach**: 24/7 instant payouts to 200+ banks/VA/e-wallets, even on weekends. Smart payment routing for higher authorization rates.

### 1.16 YUKK Payment Gateway
- **URL**: https://yukk.co.id
- **How it works**: Payment gateway focused on QRIS and UMKM digitalization. QRIS, VA, payment links, bank transfers.
- **Payment verification method**: QRIS scan verification. Dashboard monitoring.
- **Pricing**: QRIS: 0% MDR for micro (<Rp 100K), 0.3% for others. Free QRIS registration.
- **API/Webhook**: API available. Dashboard for transaction management.
- **Target market**: Micro to small enterprises (UMKM). Government digitalization alignment.
- **Unique approach**: 0% MDR QRIS for micro transactions. Aligned with BI's micro enterprise digitalization program.

### 1.17 Paylabs
- **URL**: https://paylabs.co.id
- **How it works**: Payment gateway with QRIS, bank transfer, paylater, EDC. Simple dashboard.
- **Payment verification method**: API callback. QRIS scan verification.
- **Pricing**: Competitive/transparent. Free QRIS registration. Specific rates not publicly listed.
- **API/Webhook**: Developer API. Quick integration. QRIS QR code generation API.
- **Target market**: UMKM, entrepreneurs. Easy onboarding.
- **Unique approach**: Focus on simplicity. Free QRIS creation. 24/7 support. Global security standards.

### 1.18 Espay
- **URL**: https://espay.id
- **How it works**: Payment gateway for online (e-commerce) and offline (merchant). B2C and B2B. SNAP API compliant.
- **Payment verification method**: Callback to Payment URL on payment completion. JSON response required within 5 seconds.
- **Pricing**: Transaction-based. Not publicly listed.
- **API/Webhook**: SNAP API (BI standard). QRIS QR-MPM generation API. Fund disbursement API. E-wallet linkage API. Sandbox portal.
- **Target market**: E-commerce, merchants, enterprises.
- **Unique approach**: E-wallet linkage API lets merchants view customer wallet balance/points. Real-time fund disbursement. Part of DANA ecosystem.

### 1.19 HitPay
- **URL**: https://hitpayapp.com
- **How it works**: All-in-one payment platform. Online store builder + payment links + POS. No subscription.
- **Payment verification method**: Automatic via integrated payment gateway. Dashboard tracking.
- **Pricing**: Pay per transaction only. No setup/subscription/minimum monthly. Free online store builder.
- **API/Webhook**: API available. WooCommerce plugin. Payment links.
- **Target market**: MSMEs, creators, social commerce sellers. SEA-wide platform.
- **Unique approach**: Free online store builder included. Scan To Pay for offline. No subscriptions at all. WhatsApp support.

### 1.20 Digiflazz
- **URL**: https://digiflazz.com
- **How it works**: Marketplace for digital products (pulsa, data, game vouchers, electricity tokens). NOT a payment gateway -- it's a B2B digital product aggregator with API.
- **Payment verification method**: API callbacks for transaction status. Buyer/seller API connection.
- **Pricing**: Based on product margins. Commission-based model.
- **API/Webhook**: REST API for buyers and sellers. SDK available. Developer portal at developer.digiflazz.com.
- **Target market**: Digital product resellers, top-up websites, PPOB businesses.
- **Unique approach**: Not a payment gateway per se, but a digital product supply chain. Useful for PPOB/top-up businesses that need product fulfillment, not payment processing.

---

## 2. BANK MUTATION MONITORING SERVICES

These services solve payment verification by monitoring bank account mutations (incoming transfers) and matching them to orders -- the core alternative to payment gateways for sellers using direct bank transfer.

### 2.1 Moota.co
- **URL**: https://moota.co
- **How it works**: Connects to bank internet banking accounts. Automatically checks mutations every few minutes. When a matching payment arrives, it triggers webhook/notification to auto-confirm the order.
- **Payment verification method**: Bank mutation scraping via internet banking. Matches incoming amount (often with unique code) to pending orders. Automatic verification + activation.
- **Pricing**:
  - Rp 100,000/month per bank account (= 100,000 points, 1 point = 1 Rupiah)
  - Or Rp 1,500/day per account
  - Flat rate regardless of transaction volume
  - Deposit system: Rp 50,000 - Rp 2,500,000
- **API/Webhook**: Full API at app.moota.co/developer/docs. Webhook/push notifications. Email notifications. Plugins for WooCommerce, Easy Digital Downloads, aMember.
- **Supported banks**: BCA, BCA Syariah, BNI, BNI Syariah, BRI, BRI Syariah, Mandiri, Mandiri Syariah, Muamalat.
- **Target market**: Online stores using bank transfer. WooCommerce shops. Any business that receives direct bank transfers.
- **Unique approach**: THE pioneer of bank mutation monitoring in Indonesia. No payment gateway needed -- works with your existing bank accounts. Team management with selective access. Unlimited websites/accounts. Excel export.

### 2.2 Mutasibank.co.id
- **URL**: https://mutasibank.co.id
- **How it works**: Cloud-based automatic 24/7 bank mutation monitoring. Real-time notifications on incoming transactions.
- **Payment verification method**: Bank mutation monitoring. Notifications via SMS, Email, WhatsApp, Telegram, URL Callback.
- **Pricing**: Starting from Rp 2,000/day per account. Free 7-day trial.
- **API/Webhook**: URL Callback (webhook). Multiple notification channels.
- **Supported banks**: BCA, Mandiri, BNI, BRI (and others).
- **Target market**: Online stores, any business with bank transfer payments.
- **Unique approach**: Multi-channel notifications (SMS + Email + WA + Telegram + Webhook). Very affordable daily pricing.

### 2.3 CekMutasi.co.id
- **URL**: https://cekmutasi.co.id
- **How it works**: Automatic bank payment validation system. Multi-account management in one dashboard. Mutation robot checks accounts periodically.
- **Payment verification method**: Automated mutation checking. Unique nominal matching. IP-whitelisted API access.
- **Pricing**: Not publicly listed (site was in maintenance). Estimated similar to competitors (~Rp 1,500-2,000/day).
- **API/Webhook**: REST API with API key + IP whitelist. Developer docs at cekmutasi.co.id/developer.
- **Supported banks**: BRI, BNI, BCA, Mandiri, OVO, GoPay.
- **Target market**: Online stores, hosting companies, digital product sellers.
- **Unique approach**: Also supports e-money (OVO, GoPay) mutation checking alongside bank accounts.

### 2.4 MesinOtomatis.com
- **URL**: https://mesinotomatis.com
- **How it works**: Bank mutation auto-checking + WhatsApp Gateway + SMS Gateway. Checks mutations every 90-360 seconds with automated captcha resolution.
- **Payment verification method**: Bank mutation scraping. Webhook for auto-confirmation. Automated captcha solving for iBanking access.
- **Pricing**:
  - Bank Gateway: Rp 900/day
  - WhatsApp Gateway: Rp 5,900/day
  - SMS Gateway: Rp 4,900/day
  - Free 7-day trial
  - 20% referral commission
- **API/Webhook**: Full API endpoints. Webhook notifications. Email + Telegram + WhatsApp alerts.
- **Supported banks**: BCA, Mandiri, BNI, BRI, BSI (personal + business accounts).
- **Target market**: Small online stores, hosting companies.
- **Unique approach**: Cheapest bank mutation service (Rp 900/day). Combined bank + WhatsApp + SMS gateway. Automated captcha resolution.

### 2.5 Bukubank.com
- **URL**: https://bukubank.com
- **How it works**: Bank mutation checking + automatic payment verification using unique codes. Checks mutations every 15 minutes.
- **Payment verification method**: Unique nominal code matching. Automatic verification when matching payment found. Webhook + email + Telegram notifications.
- **Pricing**: Rp 1,500/day per account. ~835 customers managing ~960 accounts (as of 2023).
- **API/Webhook**: API + plugin integrations. Webhook. Google Authenticator (2FA) security.
- **Supported banks**: BCA, BRI, BNI, Mandiri, Mandiri Syariah, BNI Syariah, BRI Syariah, BSI.
- **Target market**: Online stores, small businesses.
- **Unique approach**: 11 servers across 3 countries (US, Singapore, Indonesia). Reseller/affiliate program.

### 2.6 alMutasi.com
- **URL**: https://almutasi.com
- **How it works**: Automatic bank mutation checking with unique nominal verification. Enterprise-grade security with AI-based features.
- **Payment verification method**: Unique nominal verification. Webhook + push notifications + Telegram + Email.
- **Pricing**: Fixed cost regardless of transaction volume. Supports 5 personal + business accounts.
- **API/Webhook**: Webhook, push notifications, Telegram, email.
- **Supported banks**: BRI, BCA, BNI, Mandiri, Sinarmas, BSI.
- **Target market**: Small to medium online businesses.
- **Unique approach**: AI-based security features. Modern encryption. Fixed cost model. Transaction notes for tracking.

### 2.7 BillingOtomatis (by Domosquare)
- **URL**: Via domosquare.com
- **How it works**: Pioneer of automatic bank checking in Indonesia. Multi-bank monitoring in single panel. WordPress plugin available.
- **Payment verification method**: Bank mutation monitoring. WordPress/WooCommerce auto-confirmation plugin.
- **Pricing**: Not publicly listed.
- **Supported banks**: Major Indonesian banks via internet banking.
- **Target market**: Hosting companies, WordPress-based stores.
- **Unique approach**: Tight WooCommerce/WordPress integration. Pioneer in the space. Used widely by Indonesian hosting providers.

---

## 3. PAYMENT LINK / INVOICE PLATFORMS

These provide payment links that can be shared via WhatsApp/social media, with automatic verification on payment.

### 3.1 Mayar.id
- **URL**: https://mayar.id
- **How it works**: No-code payment and commerce platform. Create payment links, sell products/services, accept payments -- all without coding.
- **Payment verification method**: Automatic via integrated payment gateway. Webhook notification. WhatsApp + Telegram integration.
- **Pricing**:
  - Plans: Starter Rp 0/month, Business Rp 349K/month, Enterprise custom
  - Platform fee: 1.5% (Starter), 1% (Business), 0% (Enterprise) for payment links
  - Gateway fees: VA Rp 4,000, Credit card 2.6% + Rp 2,000, QRIS 0.7%, PayLater 1.7%
  - Minimarket: Rp 5,000-7,500
- **API/Webhook**: Headless API. Docs at docs.mayar.id. Zapier + Pipedream integration (5000+ apps).
- **Target market**: Creators, freelancers, UMKM, educators, course sellers. No-code audience.
- **Unique approach**: Specifically designed for non-technical sellers. Sell digital content, courses, webinars, events, coaching, memberships, physical products. Reusable + one-time payment links. PayMe (open amount). Static QRIS. Simple POS.

### 3.2 Paper.id
- **URL**: https://www.paper.id
- **How it works**: B2B invoicing and digital payment platform. Create invoices, send via WhatsApp/email/SMS with payment link embedded. Auto-reminders.
- **Payment verification method**: Automatic when customer pays via embedded payment link. 30+ payment methods.
- **Pricing**:
  - Free tier: unlimited invoices, higher transaction fees
  - PaperPlus: Rp 3,000/day (lower fees)
  - Fee can be charged to buyer or seller
- **API/Webhook**: Enterprise API with OCR, three-way matching. ERP integration.
- **Target market**: B2B businesses, suppliers, wholesalers. 700,000+ businesses.
- **Unique approach**: Invoices sent via WhatsApp with 2x faster payment vs email. Pay suppliers with credit card for extended payment terms. OCR for converting paper invoices to digital.

### 3.3 Winme
- **URL**: https://www.winme.id
- **How it works**: Payment link platform for creators and UMKM. One checkout link for products/services. Share via WA/IG/TikTok.
- **Payment verification method**: Automatic via integrated payment methods (VA, QRIS, e-wallet, Alfamart).
- **Pricing**: One-time fee of Rp 25,000. No revenue cut. No monthly fee.
- **API/Webhook**: Dashboard-based. No complex API needed.
- **Target market**: Social media sellers, WA sellers, creators, UMKM.
- **Unique approach**: Rp 25,000 one-time fee -- cheapest in category. No revenue share. Designed specifically for sellers who sell via DM/WhatsApp and need a checkout link. No ID required to start.

### 3.4 Kirimi.id
- **URL**: https://kirimi.id
- **How it works**: WhatsApp automation platform. Broadcast, auto-reply, team management. Integrates with payment gateways (especially Mayar) to auto-send invoices via WA.
- **Payment verification method**: Integrates with payment platforms. Auto-sends payment proof/receipt via WhatsApp after payment confirmed.
- **Pricing**: From Rp 29,000/month. Free tier available.
- **API/Webhook**: Unofficial WhatsApp API. Integration with Mayar and other platforms.
- **Target market**: Online stores, WA sellers needing broadcast + auto-invoice.
- **Unique approach**: Not a payment gateway -- it's the WA automation layer. Connects payment gateway notifications to WhatsApp customer communication. 80% operational time savings on billing.

---

## 4. WHATSAPP-NATIVE PAYMENT SOLUTIONS

These enable payment within or tightly coupled to WhatsApp conversations.

### 4.1 DOKU PayChat
- **URL**: https://www.doku.com (PayChat product)
- **How it works**: In-WhatsApp payment solution. Customer chats, browses products, and pays directly inside WhatsApp Business -- no app switching. Chatbot-driven flow.
- **Payment verification method**: Automatic via DOKU payment gateway integrated into WA chat. Real-time dashboard shows chat + order + payment status.
- **Pricing**: Monthly subscription per package. No setup fee. Transaction fees per DOKU gateway rates.
- **API/Webhook**: Dashboard (no-code) or API integration. Bill Broadcast for bulk WA invoices. Syncs with internal business systems.
- **Target market**: Any business selling via WhatsApp. F&B, services, retail.
- **Unique approach**: TRUE in-chat payment -- customer never leaves WhatsApp. Bill Broadcast = mass WA invoicing. Most complete WhatsApp commerce payment solution in Indonesia.

### 4.2 Innovasia (Payment on WhatsApp)
- **URL**: https://innovasia.id
- **How it works**: First "Payment on WhatsApp" solution in Indonesia using Meta's WhatsApp Business Platform. Entire buy flow (chat > order > payment) happens in WhatsApp.
- **Payment verification method**: Payment processed through Winpay (BI-authorized PSP). CRM + DataHub integration for payment context.
- **Pricing**: Not publicly listed. Custom pricing.
- **API/Webhook**: API for WA payment notifications. CRM integration. DataHub for customer behavior tracking.
- **Target market**: Businesses wanting payment-driven WA conversations.
- **Unique approach**: First-mover in payment-on-WhatsApp in Indonesia. Combines payment with CRM data and customer behavior analytics. Partnership with Winpay for BI compliance.

### 4.3 iPaymu WhatsApp Bot
- **URL**: https://ipaymu.com/whatsapp-payment-bot/
- **How it works**: Smart QRIS WhatsApp Bot. Check balance, check transactions, monitor business -- all through WhatsApp/Telegram chatbot.
- **Payment verification method**: Real-time transaction alerts via WhatsApp. QRIS payment monitoring.
- **Pricing**: Included with iPaymu account. Transaction fees per iPaymu rates.
- **Target market**: iPaymu merchants wanting mobile monitoring.
- **Unique approach**: Not for customer payment -- for MERCHANT monitoring. Check balances and transactions without opening dashboard.

---

## 5. E-COMMERCE BUILDERS WITH AUTO PAYMENT

Platforms that provide an online store + built-in automatic payment verification.

### 5.1 OrderOnline.id
- **URL**: https://orderonline.id
- **How it works**: Web-based order management platform. Auto WA/SMS/email notifications. Checkout form builder. Integrated payment gateway for e-payment.
- **Payment verification method**:
  - E-Payment: automatically marked PAID after payment
  - Bank Transfer: manual verification required (check if funds arrived)
  - COD: confirm with customer before shipping
- **Pricing**: Subscription-based (tiers not specified in research).
- **API/Webhook**: Integration with Moota for bank mutation auto-confirmation. WA auto-notification.
- **Target market**: Online sellers, WA sellers, social commerce. A/B testing support.
- **Unique approach**: Integration with Moota means bank transfers CAN be auto-verified. Auto WA/SMS/email follow-up notifications. A/B testing for checkout optimization.

### 5.2 Berdu.id
- **URL**: https://berdu.id
- **How it works**: Indonesian website builder focused on online stores. Drag & drop builder. Auto payment confirmation to bank accounts.
- **Payment verification method**: Auto-confirms payments to registered bank accounts without extra fees. Integrated with Midtrans and Duitku payment gateways.
- **Pricing**:
  - Pemula: Rp 75,000/month
  - Basic: Rp 295,000/month
  - Most Popular: Rp 395,000/month
  - Master: Rp 795,000/month
- **API/Webhook**: Midtrans/Duitku gateway integration. Auto shipping cost calculation (JNE, J&T, POS, Sicepat, etc.).
- **Target market**: Small business owners wanting their own branded online store.
- **Unique approach**: Free auto payment confirmation to bank accounts (no extra charge). Website builder + e-commerce in one. Auto stock updates on sale.

### 5.3 Lakuuu
- **URL**: https://lakuuu.id
- **How it works**: Website & e-commerce builder for UMKM. Integrated with shipping companies and online payment providers.
- **Payment verification method**: Auto-integrated with payment providers. Details of specific verification method not publicly documented.
- **Pricing**: Not publicly detailed.
- **Target market**: UMKM wanting professional online presence.
- **Unique approach**: Product management + social media integration + SEO + digital marketing in one platform.

### 5.4 Setoko
- **URL**: https://play.google.com/store/apps/details?id=id.setoko
- **How it works**: App to create online shop with own catalog. Orders go directly to WhatsApp.
- **Payment verification method**: Orders handled via WhatsApp. Payment verification likely manual.
- **Pricing**: Free app.
- **Target market**: Small sellers wanting their own catalog without marketplace competition.
- **Unique approach**: Own product catalog that doesn't compete with other sellers (unlike marketplace). WA-integrated ordering.

---

## 6. POS SYSTEMS WITH PAYMENT INTEGRATION

Point-of-sale systems that handle payment verification for offline + online channels.

### 6.1 Moka POS (by GoTo)
- **URL**: https://www.mokapos.com
- **How it works**: Cloud-based POS. Accepts all e-wallets (GoPay, OVO, ShopeePay, DANA, LinkAja, Kredivo, Akulaku) via QRIS. Debit/credit card via GoBiz PLUS EDC.
- **Payment verification method**: QRIS scan auto-verification. Card payment via integrated EDC. T+1 settlement.
- **Pricing**: Subscription-based (POS software fee + transaction MDR).
- **Target market**: SMEs, F&B, retail. Part of GoTo ecosystem.
- **Unique approach**: GoTo ecosystem integration. Accept all payment methods without additional devices (QRIS from any app). GoBiz PLUS EDC for cards.

### 6.2 iSeller
- **URL**: https://www.isellercommerce.com
- **How it works**: Cloud-based POS + online store. iSeller Pay for integrated payments. QRIS, cards, digital wallets.
- **Payment verification method**: iSeller Pay: auto-encrypted payment status sent to system. QRIS auto-verification. One-swipe security for credit cards.
- **Pricing**: Subscription-based. Covers 35+ cities in Indonesia.
- **API/Webhook**: Online store + POS integration. Order fulfillment across channels.
- **Target market**: Retail and restaurant businesses.
- **Unique approach**: True omnichannel -- POS + online store in one system. iSeller Pay meets all BI 2018 regulations. QRIS as mandatory standard.

### 6.3 Pawoon
- **URL**: https://www.pawoon.com
- **How it works**: Cloud-based POS. Cash, card, digital payments (GoPay, OVO, DANA). Offline mode with data sync.
- **Payment verification method**: Digital payment auto-verification via integrated providers. Offline data stored and synced when online.
- **Pricing**:
  - Free: 1 POS, max 300 transactions/month
  - Paid: Rp 199,000/month (unlimited transactions + locations)
- **Target market**: Small businesses. Operating since 2013.
- **Unique approach**: Free tier available. Offline mode -- transactions stored locally and sync later. 18+ financial reports. Multi-outlet management.

### 6.4 Cashlez
- **URL**: https://www.cashlez.com
- **How it works**: mPOS + payment gateway. Bluetooth card reader for credit/debit. QRIS, VA, BNPL, QR cross-border, prepaid. Online + offline.
- **Payment verification method**: mPOS auto-verification via Cashlez Reader (Bluetooth). QRIS scan verification. Real-time dashboard.
- **Pricing**: Transaction-based MDR. No details publicly listed.
- **API/Webhook**: Modular API. Dashboard integration. Real-time reporting.
- **Target market**: SMEs to enterprise. IPO'd company (IDX: CASH). Licensed by BI since 2019.
- **Unique approach**: Combined mPOS hardware + payment gateway software. Cross-border QR payments. Free cashier app for MSMEs. Publicly traded.

### 6.5 Opaper
- **URL**: https://www.opaper.app
- **How it works**: F&B-specific ordering + payment system. QR scan at table > order on phone > pay from phone. No app download needed.
- **Payment verification method**: Auto via Xendit payment gateway (OJK supervised). Payment recorded in POS with auto receipt printing.
- **Pricing**: Free app. POS equipment packages available for purchase.
- **API/Webhook**: Integrated with Xendit for payment. Bluetooth printer for receipts + kitchen.
- **Target market**: F&B businesses (restaurants, cafes, catering).
- **Unique approach**: QR-to-order-to-pay flow eliminates cashier lines. Kitchen printer integration. Anti-fraud (order details auto-recorded). Dine-in + reservation + website + marketplace orders in single channel.

---

## 7. OMNICHANNEL COMMERCE PLATFORMS

### 7.1 Jubelio
- **URL**: https://jubelio.com
- **How it works**: Omnichannel platform connecting all marketplace + online store + POS. Unified inventory, orders, payments.
- **Payment verification method**: Jubelio Store: VA/credit card/e-wallet/QRIS/retail auto-verification. Jubelio POS: QRIS from all wallet/banking apps.
- **Pricing**: Subscription-based (multiple tiers).
- **Target market**: Multi-channel sellers managing Shopee + Tokopedia + own store + offline.
- **Unique approach**: Reconciliation of payments and bookkeeping across all channels. Single dashboard for online + offline.

### 7.2 SIRCLO
- **URL**: https://sirclo.com
- **How it works**: Omnichannel commerce enabler. SIRCLO Store for own store. Multi-marketplace management. Payment gateway integration.
- **Payment verification method**: Integrated payment gateway partners. Auto-verification on supported payment methods.
- **Pricing**: Not publicly listed.
- **Target market**: Enterprise brands. Acquired Orami (parenting platform) for social commerce.
- **Unique approach**: Enterprise-grade omnichannel. Social commerce through community-driven approach.

### 7.3 SmartSeller (formerly Ngorder)
- **URL**: https://smartseller.co.id
- **How it works**: Multi-marketplace management platform. Order management, stock sync, bulk product upload.
- **Payment verification method**: Bank transaction monitoring for confirmation. OrderPay digital wallet. Cash/digital/installment options.
- **Pricing**: Subscription-based.
- **Target market**: Multi-marketplace sellers. 50,000+ active users.
- **Unique approach**: OrderPay internal wallet. Barcode scanning for quick product input. Auto tracking number notifications.

### 7.4 Desty (by Mekari)
- **URL**: https://www.desty.app
- **How it works**: Omnichannel commerce. Connect Shopee, Tokopedia, TikTok Shop, Lazada, Blibli. Auto-connects payment + logistics.
- **Payment verification method**: Auto via integrated payment methods. POS integration for offline.
- **Pricing**: Subscription-based.
- **Target market**: UMKM to medium businesses. ~1M merchants. Acquired by Mekari (2025).
- **Unique approach**: Desty Page for digital payment + e-wallet conversion. Marketplace chat aggregation with WA integration (+40% faster responses). POS works offline.

### 7.5 Tokoko
- **URL**: https://tokoko.id
- **How it works**: Lightweight (5MB) app for micro merchants. Invoice + payment creation. Online shop with orders, payments, delivery, chat.
- **Payment verification method**: Payment processed through DOKU (BI authorized). Credit card (Visa/Mastercard) support for invoice payment.
- **Pricing**: Free app. Transaction fees via DOKU.
- **Target market**: Mom and pop economy. 3.5M+ registered merchants across 750 cities. Tier 2/3 locations. Part of BukuWarung ecosystem.
- **Unique approach**: Ultra-lightweight (5MB). Designed for micro merchants in rural/tier-3 areas. Create online shop in 15 seconds. DOKU as payment processor.

---

## 8. QRIS-FOCUSED PROVIDERS

### 8.1 Youtap
- **URL**: https://www.youtap.id
- **How it works**: Business management + QRIS payment technology. Pioneered CPM (Customer Presented Mode) -- merchant scans customer QR.
- **Payment verification method**: QRIS MPM (Static): customer scans merchant QR. QRIS CPM: merchant scans customer QR, 2-second processing, 0% error rate.
- **Pricing**: 0% MDR promotion on Youtap Starter (as of June 2025). Standard QRIS MDR otherwise.
- **Target market**: UMKM. 90% of QRIS merchants are UMKM.
- **Unique approach**: CPM (Customer Presented Mode) pioneer -- 2-second payment with 0% error. 0% MDR promo. Also offers Belanja Stok (stock purchasing) with QRIS.

### 8.2 Fazz (formerly PayFAZZ + Xfers)
- **URL**: https://fazz.com
- **How it works**: Agent-driven banking network. Warung agents provide financial services (transfers, top-ups, bill payments). QRIS for accepting payments.
- **Payment verification method**: QRIS auto-verification. Agent-based verification for cash services.
- **Pricing**: QRIS settlement in 30 seconds. Agent commission model.
- **API/Webhook**: API for 2000+ digital products/financial services. StraitsX for stablecoin (XIDR).
- **Target market**: Rural/unbanked micro businesses (warung). Tier 2/3 Indonesia.
- **Unique approach**: Agent-driven model for areas without digital infrastructure. QRIS settlement in 30 seconds (fastest in market). Also serves fintech companies via API layer.

---

## 9. COMPARISON MATRIX

### Payment Gateways -- Fee Comparison (VA / QRIS)

| Provider | VA Fee (BCA) | VA Fee (Others) | QRIS Fee | Setup | Monthly |
|----------|-------------|-----------------|----------|-------|---------|
| **Tripay** | Rp 5,500 | Rp 4,250 | 0.7% + Rp 750 | Free | Free |
| **PayDisini** | Rp 4,900 | Rp 1,500-4,000 | 0.7-0.9% | Free | Free |
| **Duitku** | ~Rp 4,000 | ~Rp 4,000 | 0.7% | Free | Free |
| **Midtrans** | ~Rp 4,000 | ~Rp 4,000 | 0.7% | Free | Free |
| **Xendit** | ~Rp 4,000 | ~Rp 4,000 | 0.7% | Free | Free |
| **iPaymu** | Rp 4,500 | Rp 3,500-4,500 | 0.7% | Free | Free |
| **DOKU** | Rp 4,000 | Rp 4,000 | 0.7% | Free | Free |
| **Faspay** | - | - | - | Free | Free |
| **YUKK** | - | - | 0% (micro) / 0.3% | Free | Free |

### Bank Mutation Services -- Pricing Comparison

| Provider | Daily Cost | Supported Banks | API | Webhook | WA Notify |
|----------|-----------|----------------|-----|---------|-----------|
| **Moota** | Rp 1,500 | BCA/BNI/BRI/Mandiri/Muamalat + Syariah | Yes | Yes | No |
| **MesinOtomatis** | Rp 900 | BCA/BNI/BRI/Mandiri/BSI | Yes | Yes | Yes |
| **Mutasibank** | Rp 2,000 | BCA/BNI/BRI/Mandiri+ | Yes | Yes | Yes |
| **Bukubank** | Rp 1,500 | BCA/BNI/BRI/Mandiri + Syariah | Yes | Yes | No |
| **CekMutasi** | ~Rp 1,500-2,000 | BCA/BNI/BRI/Mandiri + OVO/GoPay | Yes | Yes | No |
| **alMutasi** | Fixed/month | BCA/BNI/BRI/Mandiri/Sinarmas/BSI | Yes | Yes | No |

### WhatsApp-Native Payment Solutions

| Provider | Type | No-Code? | In-WA Payment? | Price |
|----------|------|----------|----------------|-------|
| **DOKU PayChat** | Full WA commerce | Yes + API | Yes | Subscription |
| **Innovasia** | WA payment platform | API-first | Yes | Custom |
| **Kirimi.id** | WA automation | Yes | No (sends links) | From Rp 29K/mo |
| **OY! Payment Link** | Payment link via WA | Yes + API | No (sends links) | Per transaction |
| **Winme** | Checkout link | Yes | No (sends links) | Rp 25K one-time |

---

## 10. KEY INSIGHTS FOR CATATORDER

### The Landscape Has Three Layers

**Layer 1: Payment Gateways (Tripay, Midtrans, Xendit, etc.)**
- Require customer to pay to a virtual account/QRIS/e-wallet
- Auto-verify via webhook -- SOLVED problem
- BUT: require merchant to integrate API, handle settlement, manage gateway account
- Cost: Rp 3,500-5,500 per VA transaction + QRIS 0.7%

**Layer 2: Bank Mutation Monitors (Moota, Mutasibank, etc.)**
- Monitor existing bank accounts for incoming transfers
- Match to orders via unique nominal codes
- No need for payment gateway -- works with regular bank transfer
- Cost: Rp 900-2,000/day flat regardless of volume
- THE solution closest to CatatOrder's problem space

**Layer 3: WhatsApp-Native Payment (DOKU PayChat, Innovasia)**
- Payment happens inside WhatsApp
- Newest category, still evolving
- Most aligned with WA commerce sellers

### What Nobody Does

1. **No tool combines order recording (from WA chat) + payment verification + customer management** in a single flow for WA sellers.
2. Bank mutation monitors verify payment but don't help with ORDER management.
3. Payment gateways require redirecting customers away from WhatsApp.
4. DOKU PayChat is the closest to "sell and get paid in WA" but is a DOKU product (enterprise-oriented, subscription-based).

### The Gap CatatOrder Can Fill

The Indonesian WA seller today either:
- Uses NO verification (manually checks bank app) -- most common
- Uses Moota/mutation monitor (only checks payment, no order link)
- Uses OrderOnline.id + Moota (two separate tools)
- Uses a payment gateway + own store (requires technical setup)

**Nobody provides**: Record order from WA conversation > Generate unique payment reference > Auto-verify payment > Update order status > Notify seller -- as a single integrated flow designed for WA sellers.

### Pricing Reference Points
- WA sellers will pay Rp 900-1,500/day for mutation monitoring
- WA sellers will pay Rp 3,500-5,500 per verified transaction via PG
- WA sellers will pay Rp 25,000-75,000/month for basic tools
- Enterprise solutions (DOKU PayChat, Innovasia) are priced higher

---

## 11. TAMBAHAN DARI DEEP DIVE (2026-03-27, session ke-2)

### 11.1 iPaymu — VA Rate Termurah di Indonesia

Detail pricing yang belum ada di section 1:

| Bank VA | iPaymu | Tripay | PayDisini | Xendit | Midtrans |
|---|---|---|---|---|---|
| **BNI** | **Rp 1.500** | Rp 4.250 | Rp 4.000 | Rp 4.500 | Rp 4.000 |
| **BRI** | **Rp 1.500** | Rp 4.250 | Rp 2.500 | Rp 4.500 | Rp 4.000 |
| **Mandiri** | Rp 2.500 | Rp 4.250 | Rp 2.500 | Rp 4.500 | Rp 4.500 |
| **BCA** | Rp 4.000 | Rp 5.500 | Rp 4.900 | Rp 4.500 | Rp 4.500 |
| **Permata** | **Rp 1.500** | Rp 4.250 | Rp 2.500 | Rp 4.500 | — |

iPaymu juga punya **Payment Sharing** (split payment native) — bisa auto-split antara seller dan CatatOrder tanpa escrow manual. Ini differentiator vs Tripay/PayDisini yang single-merchant only.

*Pricing perlu di-verify ulang, data dari training knowledge May 2025.*

### 11.2 Flip Accept Payment + Free Disbursement — Cheapest All-In

Kombinasi Flip yang belum ter-highlight:

```
Accept via Flip VA: Rp 3.000-4.500 per transaksi
Disburse via Flip ke seller: Rp 0 (free inter-bank transfer untuk bisnis)
───────────────────────────────────────────────────
Total all-in: Rp 3.000-4.500 per transaksi
```

Vs Xendit:
```
Accept via Xendit VA: Rp 4.500
Disburse via Xendit: Rp 5.000
───────────────────────
Total all-in: Rp 9.500 per transaksi
```

**Flip = 2-3x lebih murah dari Xendit untuk marketplace model.**

Disbursement Flip: real-time / within minutes setelah trigger. Jadi combined flow bisa achieve near T+0 untuk seller.

*Catatan: Flip free disbursement mungkin promotional/strategic pricing — verify apakah masih berlaku di 2026.*

### 11.3 Cost Modeling (1.000 transaksi/bulan, avg Rp 150K)

| Skenario | Accept | Disburse | Total/bulan | Per-txn |
|---|---|---|---|---|
| **iPaymu VA (BNI/BRI) + manual** | Rp 1.5M | Rp 6.5M (bank manual) | Rp 8M | Rp 8.000 |
| **iPaymu VA + Flip disburse** | Rp 1.5M | **Rp 0** | **Rp 1.5M** | **Rp 1.500** |
| Tripay VA + Flip disburse | Rp 4.25M | Rp 0 | Rp 4.25M | Rp 4.250 |
| Xendit VA + Xendit disburse | Rp 4.5M | Rp 5M | Rp 9.5M | Rp 9.500 |
| **QRIS (any provider)** | **Rp 1.05M** | + disburse | Rp 1.05M+ | **Rp 1.050** |

**Clear winner untuk Layer 4: iPaymu accept + Flip disburse = Rp 1.500/txn all-in.**
**QRIS bahkan lebih murah (Rp 1.050) tapi perlu seller pakai QR baru.**

### 11.4 SNAP Standard — Future-Proofing

Bank Indonesia sedang rollout **SNAP (Standar Nasional Open API Pembayaran)** — standar API untuk semua bank. Implikasi:

- Moota-style scraping akan eventually digantikan oleh proper API-based mutation checking
- **Brick.io** sudah pakai bank API resmi (bukan scraping) di mana tersedia — lebih reliable dari Moota
- Brick pricing enterprise, tapi kalau SNAP-compliant aggregator muncul yang lebih murah → switch dari Moota

**Timeline**: Full SNAP adoption masih rolling out 2025-2027. Monitor.

---

## SOURCES

### Payment Gateways
- [Tripay Developer](https://tripay.co.id/developer)
- [PayDisini API Docs](https://payment.paydisini.co.id/docs/)
- [Duitku Docs](https://docs.duitku.com/)
- [Midtrans](https://midtrans.com)
- [Xendit](https://www.xendit.co/en/)
- [iPaymu Pricing](https://ipaymu.com/en/pricing/)
- [DOKU Pricing](https://www.doku.com/en-us/pricing)
- [NICEPAY](https://nicepay.co.id/en/)
- [Winpay](https://www.winpay.id/)
- [Faspay](https://faspay.co.id/en/)
- [Durianpay](https://www.durianpay.id/)
- [Sakurupiah](https://sakurupiah.id/)
- [OY! Indonesia](https://www.oyindonesia.com/)
- [LinkQu](https://www.linkqu.id/)
- [Pivot Payment](https://pivot-payment.com/)
- [YUKK](https://yukk.co.id/)
- [Paylabs](https://paylabs.co.id/)
- [Espay](https://espay.id/)
- [HitPay](https://hitpayapp.com/)
- [Digiflazz](https://digiflazz.com/)

### Bank Mutation Services
- [Moota](https://moota.co/)
- [Mutasibank](https://mutasibank.co.id/)
- [CekMutasi](https://cekmutasi.co.id/)
- [MesinOtomatis](https://mesinotomatis.com/)
- [Bukubank](https://bukubank.com/)
- [alMutasi](https://almutasi.com/)

### Payment Links / Invoice
- [Mayar.id](https://mayar.id/)
- [Paper.id](https://www.paper.id/)
- [Winme](https://www.winme.id/)
- [Kirimi.id](https://kirimi.id/)

### WhatsApp Payment
- [DOKU PayChat](https://www.doku.com/blog/doku-paychat)
- [Innovasia](https://innovasia.id/)
- [iPaymu WA Bot](https://ipaymu.com/en/whatsapp-payment-bot/)

### E-commerce Builders
- [OrderOnline.id](https://orderonline.id/)
- [Berdu.id](https://berdu.id/)
- [Lakuuu](https://lakuuu.id/)
- [Setoko](https://play.google.com/store/apps/details?id=id.setoko)

### POS Systems
- [Moka POS](https://www.mokapos.com/)
- [iSeller](https://www.isellercommerce.com/)
- [Pawoon](https://www.pawoon.com/)
- [Cashlez](https://www.cashlez.com/)
- [Opaper](https://www.opaper.app/)

### Omnichannel
- [Jubelio](https://jubelio.com/)
- [SIRCLO](https://sirclo.com/)
- [SmartSeller](https://smartseller.co.id/)
- [Desty](https://www.desty.app/)
- [Tokoko](https://tokoko.id/)

### QRIS
- [Youtap](https://www.youtap.id/)
- [Fazz](https://fazz.com/)
