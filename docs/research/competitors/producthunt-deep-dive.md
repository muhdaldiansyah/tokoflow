# ProductHunt WA Commerce — Feature Deep Dive

> Detailed feature analysis of 12 global WA commerce tools found on ProductHunt.
> None target Indonesian UMKM, but their features inform CatatOrder's roadmap.
>
> Research date: 2026-02-13

---

## Feature Comparison Matrix

| Feature | CatatOrder | TakeApp | Zbooni | Callbell Shop | OnWhatsApp | Quickzu | WhatsAppShop | DialogTab | EasyOrder | Chatmeal | WA Shop | WhatsOrder | Superchat |
|---------|-----------|---------|--------|--------------|------------|---------|-------------|-----------|-----------|----------|---------|------------|-----------|
| **Order lifecycle / status flow** | **YES** | No | No | No | Partial | No | Partial | No | No | No | No | No | No |
| **Digital receipt via WA** | **YES** | No | Yes | No | No | No | No | No | No | No | No | No | No |
| **Daily recap** | **YES** | No | No | No | No | No | No | No | No | No | No | No | No |
| **Monthly reports** | **YES** | Yes | Yes | No | No | No | No | No | Partial | Partial | No | No | No |
| **Customer database** | **YES** | Yes | Yes | No | Yes | No | Yes | No | No | No | No | No | No |
| **Photo OCR (AI)** | **YES** | No | No | No | No | No | No | No | No | No | No | No | No |
| **WA chat parse (AI)** | **YES** | No | No | No | No | No | No | No | No | No | No | No | Yes (AI) |
| **WA branding/viral loop** | **YES** | No | No | No | No | No | No | No | No | No | No | No | No |
| **Product catalog / storefront** | No | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | No |
| **Online payment gateway** | Midtrans | 70+ methods | Stripe etc. | No | No | Stripe, Razorpay | No | Payment links | Yes | 20+ methods | No | Mobile wallet | No |
| **QR code ordering** | No | No | Yes | No | No | **YES** | No | No | **YES** | **YES** | No | **YES** | No |
| **Multi-channel (IG, Messenger)** | No | Instagram | IG, Messenger | IG | No | No | No | WA, IG, Messenger | No | No | No | No | WA, IG, FB, Telegram |
| **Multi-agent / team** | No | Yes ($50) | Yes | Yes (€12+) | No | No | No | **YES** (core) | No | No | No | No | **YES** (core) |
| **AI chatbot** | No | Yes ($50) | No | No | No | No | No | No | No | No | No | No | **YES** (core) |
| **Bahasa Indonesia** | **YES** | No | No | No | No | No | No | No | No | No | No | No | No |
| **Free tier** | **YES** (150 orders) | Yes (limited) | No ($299 setup) | Yes (500 products) | Yes | Yes (10 cat, 100 products) | Yes | 14-day trial | No | 14-day trial | Yes | 7-day trial | Yes (limited) |

---

## 1. TakeApp — The Most Feature-Complete

| Attribute | Value |
|-----------|-------|
| URL | take.app |
| Founded | Singapore |
| Investor | **Meta** |
| Traction | 10,000+ restaurants in Singapore |
| Play Store | Available |

### Pricing

| Plan | Price | Key Limits |
|------|-------|------------|
| **Basic** | Free | 20 images, manual/QR payments, basic features |
| **Business** | $50/month | Unlimited images, custom domain, remove branding, WA API, AI chatbot, multi-store |

### Full Feature List

**Store & Catalog:**
- Online store builder (Shopify-like for WA)
- Product catalog with variants
- Custom domain + SSL
- Custom pages
- Remove TakeApp branding ($50)
- Instagram Business integration
- Google Merchant Center sync

**Order Management:**
- Order dashboard
- Invoice settings + PDF download
- CSV export/import
- Order export

**Payments (70+ methods):**
- Credit card, PayPal, Stripe, Mercado Pago, Xendit
- Payment proof upload
- Store credit payments
- Limit payment method per delivery type

**WhatsApp Suite ($50 plan):**
- WhatsApp Business Platform integration
- Custom message templates + workflows
- Business Chat Inbox
- Broadcast messaging
- Inbox Automations
- **AI Chatbot**

**Membership & Loyalty:**
- Customer login & approval
- Loyalty rewards program
- Exclusive member access
- Wholesale pricing tiers

**Advanced:**
- Multiple stores management
- Multiple staff accounts
- Webhooks
- Store cloning
- Delivery tracking
- Delivery fee by distance
- Booking system
- Discount management
- Analytics + SEO + Meta Pixel
- Integrations: Lalamove, Zapier, Shopify, Shipday

### CatatOrder vs TakeApp

| Dimension | CatatOrder | TakeApp |
|-----------|-----------|---------|
| Focus | **Order management after WA** | Store builder before WA |
| Order lifecycle | Baru → Diproses → Dikirim → Selesai | No status flow |
| Digital receipt | Yes, with branding | No |
| Daily recap | Yes | No |
| AI features | Photo OCR + WA chat parse | AI chatbot ($50) |
| Price | Rp49K (~$3) | $50/mo |
| Target | Indonesian UMKM | Singapore/global restaurants |
| Language | Bahasa Indonesia | English |

**Key insight:** TakeApp is the most complete WA commerce tool globally but is a **store builder** (catalog → customer → order). CatatOrder is an **order manager** (order arrives via WA → track → receipt → recap). Different workflow direction.

---

## 2. Zbooni — Enterprise Social Commerce

| Attribute | Value |
|-----------|-------|
| URL | zbooni.com |
| Market | UAE, KSA, Egypt, Jordan |
| Play Store | 4.3 stars, 1,460 reviews |
| Funding | VC-funded (undisclosed) |

### Pricing

| Plan | Price | Details |
|------|-------|---------|
| **Integrated** | $299 one-time setup | 3.5% + AED 1 per order + VAT. No monthly fee. |
| **All-in-One** | Unknown | Full platform |
| **Custom** | Contact sales | Enterprise |

### Full Feature List

**Order & Commerce:**
- Mobile cart for instant order creation
- Real-time cart modification
- Messaging-based checkout
- QR code payments (in-person)
- Web-based customer checkout
- e-invoicing compliant digital receipts
- Share and print receipts

**Payments:**
- Visa, Mastercard, Amex
- Google Pay, Apple Pay
- Stripe, Checkout.com, Adyen, Amazon, PayTabs, Noon Payments, Jumia Pay
- Refund management
- Sales Tax/VAT enabled

**Business Dashboard:**
- Sales tracking
- Customer tracking
- Product/service tracking
- Report downloads
- Order values + growth metrics
- Pending payments view
- Repeat purchase analytics

**Marketing:**
- cShop Market (marketplace discovery)
- Personalized collections
- Re-marketing tools
- Automated promotions
- Discount codes
- Direct social media sharing

**Integrations:**
- Shopify, Magento, BigCommerce, WooCommerce

### CatatOrder vs Zbooni

| Dimension | CatatOrder | Zbooni |
|-----------|-----------|--------|
| Setup cost | Rp0 (free tier) | $299 one-time |
| Per-order fee | Rp0 | 3.5% + AED 1 |
| Focus | WA order management | Social commerce platform |
| Market | Indonesia | Middle East (UAE, KSA, Egypt, Jordan) |
| Scale | Micro UMKM | SME to enterprise |

**Key insight:** Zbooni is enterprise-grade social commerce for MENA. The $299 setup + 3.5% per-order fee is completely wrong for Indonesian UMKM. However, their **e-invoicing digital receipts** and **repeat purchase analytics** are features worth noting.

---

## 3. Callbell Shop — Simplest Free Store

| Attribute | Value |
|-----------|-------|
| URL | callbell.shop |
| Traction | 30,000+ users |
| Price | **Free** (storefront) / Platform from €12/mo |

### Full Feature List

**Catalog:**
- Up to 500 products
- Up to 5 photos per product
- Product variants
- Category organization
- Brand color customization

**Orders:**
- Customer sends detailed order message to WA
- Coordinate payment/shipping via WA chat manually
- No built-in order dashboard

**Sharing:**
- Share via WhatsApp link
- Instagram link-in-bio
- Facebook Business Manager sync
- Facebook & Instagram catalog sync

**Delivery:**
- Configurable delivery options
- Pickup option

### CatatOrder vs Callbell Shop

| Dimension | CatatOrder | Callbell Shop |
|-----------|-----------|---------------|
| Order management | Full lifecycle dashboard | Manual (WA chat) |
| Receipt generation | Auto digital receipt | None |
| Price | Rp0-99K | Free |
| Core value | Manage orders | Display products |

**Key insight:** Callbell Shop is a glorified product catalog. Orders arrive as WA messages with no management system. It solves the "show products" problem, not the "manage orders" problem. 30K users proves demand for simple WA selling tools though.

---

## 4. OnWhatsApp — Declining Product

| Attribute | Value |
|-----------|-------|
| URL | onwhatsapp.com |
| Rating | 4.2 stars, 8,555 ratings |
| Status | **No updates in ~1 year. Declining.** |

### Full Feature List

**Core:**
- Online catalog creation
- Receive orders on WA (personal or business number)
- No commissions on sales
- Order management (tracking, monitoring)
- Customer accounts

**Additional:**
- Catalog management
- Email marketing
- Returns management
- Inventory management
- Channel management
- SEO management
- Promotions management
- Multi-store management

### CatatOrder vs OnWhatsApp

| Dimension | CatatOrder | OnWhatsApp |
|-----------|-----------|------------|
| Status | Active, maintained | Declining, stale |
| UX | Clean, mobile-first | "Clunky" (user reviews) |
| Support | Active | Slow response |

**Key insight:** OnWhatsApp had the right idea (catalog + orders + no commission) but execution failed. UX issues and abandonment killed it. Validates the market need but shows that **maintenance and UX quality** matter.

---

## 5. Quickzu — Restaurant-Focused WA Store

| Attribute | Value |
|-----------|-------|
| URL | quickzu.com |
| Market | 50+ countries (India, Singapore, Malaysia, etc.) |
| Focus | Restaurants & local food businesses |

### Pricing

| Plan | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 1 location, 10 categories, 100 products |
| **Premium Monthly** | $5/mo | Unlimited categories/items, WA support |
| **Premium Yearly** | $50/year | Same as monthly |

### Full Feature List

**Store:**
- Unique shop link (name.quickzu.com)
- Custom domain + SSL (Premium)
- Multiple theme options
- QR code builder

**Products:**
- Product variants
- Unlimited categories/products (Premium)
- Custom pricing

**Orders:**
- Customer orders → WA message to owner
- Live order management dashboard
- Delivery, pickup, or in-store options
- Dine-in features (table ordering)

**Payments:**
- Bank details + payment URL
- Stripe integration (Premium)
- Razorpay integration (Premium)
- Coupon/discount system
- 0% commission

**Analytics:**
- Business dashboard with KPIs
- Google Analytics integration
- Facebook Pixel integration

**Other:**
- Appointment booking
- Multi-language (Spanish, English, Malay, etc.)
- White-label reseller solution

### CatatOrder vs Quickzu

| Dimension | CatatOrder | Quickzu |
|-----------|-----------|---------|
| Focus | Order management | Store builder (restaurant focus) |
| Price | Rp49K (~$3) | $5/mo ($60/yr) |
| Order lifecycle | Full status flow | No status tracking |
| QR code | No | Yes |
| Dine-in | No (not relevant) | Yes |

**Key insight:** Quickzu at $5/mo is cheap but restaurant-focused (dine-in, table ordering, QR menus). Not relevant for Indonesian UMKM receiving WA orders for kue/jahit/katering. But their **$5/mo price point** and **QR code ordering** are interesting reference points.

---

## 6. WhatsAppShop — Homepreneur Focus

| Attribute | Value |
|-----------|-------|
| URL | whatsappshop (ProductHunt) |
| Target | Homepreneurs, creatives, FB sellers |

### Features

- Build a shop to sell items through WhatsApp
- All orders sent to WA number
- Dashboard: manage orders, customers, products, categories
- Product listing with images
- Category management

### CatatOrder vs WhatsAppShop

**Key insight:** WhatsAppShop targets homepreneurs (similar to CatatOrder's baker/tailor audience) but with a store-first approach. Has a basic order dashboard, which is closer to CatatOrder than other catalog tools. However, no evidence of active development or significant traction.

---

## 7. DialogTab — Multi-Agent Sales Platform

| Attribute | Value |
|-----------|-------|
| URL | dialogtab.com |
| Focus | Conversational commerce for e-commerce teams |
| Shopify | Available as Shopify app |

### Pricing

| Plan | Monthly | Annually | Key Features |
|------|---------|----------|-------------|
| **Start** | $30/agent | $24/agent | 1 channel, email support, 3-month retention |
| **Grow** | $45/agent | $36/agent | 3 channels, WA Business API ($49/mo add-on), group & labels, product search |
| **Scale** | $60/agent | $48/agent | E-commerce full feature, API, phone support, 12-month retention |
| **Enterprise** | Custom | Custom | Contact sales |

**WA Business API add-on: Starting from $49/mo extra.**

### Features

- Multi-agent chat panel (team collaboration)
- Multi-channel: WA, Messenger, Instagram, Live Chat
- Built-in cart for in-chat ordering
- Product search from catalog without leaving chat
- Payment link generation
- Assign conversations to team members
- Tag colleagues, internal chat
- Chrome extension available
- 14-day free trial

### CatatOrder vs DialogTab

| Dimension | CatatOrder | DialogTab |
|-----------|-----------|-----------|
| Price | Rp49K (~$3) | $30-60/agent/mo + $49 WA API |
| Target | Solo UMKM owner | E-commerce teams with agents |
| Model | Self-serve | Agent-assisted sales |
| Complexity | Simple | Enterprise-grade |

**Key insight:** DialogTab is for e-commerce companies with sales teams — completely wrong for solo UMKM owners who manage their own WA. The per-agent pricing model alone disqualifies it. But their **built-in cart for in-chat ordering** is an interesting UX pattern.

---

## 8. EasyOrder — COVID-Era QR Menu

| Attribute | Value |
|-----------|-------|
| URL | easy-order.ca |
| Origin | Canada |
| Launch | 2021 (COVID-era) |

### Pricing

| Plan | Price |
|------|-------|
| Monthly | From $100 CAD/mo |
| Commission | 0% |
| Setup | 24-48 hours (they build it for you) |

### Features

- Digital menu with photos, descriptions, pricing
- QR code for dine-in and takeout
- Contactless ordering
- Central order dashboard with real-time updates
- Instant alerts (app, email, printer)
- Multiple payment options
- Facebook Business + Google My Business sync
- Analytics
- Unlimited orders

### CatatOrder vs EasyOrder

**Key insight:** $100 CAD/mo (~Rp1.1M) for a restaurant QR menu tool. Completely wrong price/market for Indonesian UMKM. But the "24-48 hour setup done-for-you" model is interesting — CatatOrder could offer personal WA onboarding as an equivalent.

---

## 9. Chatmeal — Dead Product

| Attribute | Value |
|-----------|-------|
| URL | chatmeal.com → **redirects to domain sale page (HugeDomains)** |
| Status | **DEAD** — domain for sale |
| ProductHunt | Listed Jan 2025 |

### Features (when alive)

- Restaurant digital menu creation
- Delivery, takeaway, dine-in, table booking via WA
- 20+ payment methods
- Cash on Delivery or payment link
- QR code + social media sharing
- Order + earnings reports
- No 30% delivery platform fee

### Key Insight

**Chatmeal died within ~1 year of ProductHunt launch.** Domain is now for sale. Validates that WA food ordering is a competitive space where products fail fast. The "no 30% delivery fee" positioning wasn't enough to survive.

---

## 10. WhatsApp Shop — Google Sheets Add-on

| Attribute | Value |
|-----------|-------|
| Type | Google Sheets add-on |
| ProductHunt | Nov 2024 |

### Features

- Launch online store from Google Sheets
- Orders sent to WhatsApp
- Catalog managed in spreadsheet
- No separate app/dashboard needed

### Key Insight

Clever hack but fragile — relies on Google Sheets as database. No order management, no receipts, no analytics. Interesting as a "zero-setup" concept but not a real competitor.

---

## 11. WhatsOrder — Cheapest WA Ordering

| Attribute | Value |
|-----------|-------|
| URL | whatsorder.com |
| Pricing | **$1.67/mo ($19.99/year)** |
| Market | 50+ countries |

### Features

- Form builder (business name, WA number, product list with prices/images)
- Shareable ordering link
- Orders sent as pre-filled WA messages
- Dashboard for form management
- QR code support
- Google Sheets integration for catalog
- Item modifiers and variants
- Multi-currency + multi-language
- Brand color customization
- Embeddable on website
- 0% commission, no ads
- 99.95% uptime

### Setup Process

1. Copy Google Sheets template
2. Fill product catalog
3. Publish sheet
4. Paste URL → generates WhatsOrder link
5. Test → purchase license key

### CatatOrder vs WhatsOrder

| Dimension | CatatOrder | WhatsOrder |
|-----------|-----------|------------|
| Price | Rp49K (~$3/mo) | $1.67/mo |
| Model | Order management dashboard | Order form generator |
| After order arrives | Full lifecycle tracking | Nothing — just WA message |
| Receipt | Digital receipt via WA | None |
| Recap/reports | Daily + monthly | None |

**Key insight:** WhatsOrder is the cheapest WA ordering tool ($1.67/mo) but it's ONLY a form builder. It generates a link → customer fills form → pre-filled WA message sent. No order tracking after that. CatatOrder's value is what happens **after** the order arrives.

---

## 12. Superchat — Enterprise WA Automation

| Attribute | Value |
|-----------|-------|
| URL | superchat.com |
| Origin | Germany |
| Focus | Multi-channel messaging automation |

### Pricing

| Plan | Price | Details |
|------|-------|---------|
| **Free** | €0/mo | 1 WA number, basic features |
| **Basic** | €89/mo | 1 WA number |
| **Professional** | €149/mo | 3 WA numbers |
| **Advanced** | €299/mo | Full features |

**Note:** AI, Automations, Integrations, Analytics are add-ons. Fully functional setup = ~€250+/mo.

### Features

- Unified inbox (WA, IG, FB Messenger, Live Chat, Telegram)
- AI-powered chatbots
- No-code automation builder
- Broadcast messaging
- WhatsApp Business API integration
- Industry-specific templates
- Multi-channel customer conversations
- Team collaboration
- Analytics dashboard

### CatatOrder vs Superchat

| Dimension | CatatOrder | Superchat |
|-----------|-----------|-----------|
| Price | Rp49K (~$3) | €89-299/mo |
| Target | Solo UMKM | European SMEs with teams |
| Focus | Order management | Multi-channel messaging |
| AI | Photo OCR + chat parse | AI chatbot + automations |

**Key insight:** Superchat is enterprise messaging infrastructure (€250+/mo fully loaded). No order management features. Their **no-code automation builder** and **AI chatbot** are interesting for future reference but completely wrong segment/price.

---

## Summary: What CatatOrder Can Learn

### Features NO competitor has (CatatOrder's unique advantages)

| Feature | CatatOrder | Others |
|---------|-----------|--------|
| Order lifecycle with status flow | YES | 0 of 12 have this |
| Daily recap via WA | YES | 0 of 12 |
| WA branding viral loop | YES | 0 of 12 |
| WA chat text parsing (AI) | YES | 0 of 12 |
| Photo OCR for receipts | YES | 0 of 12 |
| Bahasa Indonesia | YES | 0 of 12 |

### Features worth considering for CatatOrder's roadmap

| Feature | Who Has It | Relevance to CatatOrder | Priority |
|---------|-----------|------------------------|----------|
| **QR code for ordering** | Quickzu, WhatsOrder, EasyOrder, Zbooni | Customers scan QR → fill order form → sends to WA. Could complement CatatOrder's public catalog. | MEDIUM |
| **Payment link per order** | DialogTab, Zbooni, TakeApp | Send payment link with order confirmation. Integrates with Midtrans. | MEDIUM |
| **Product catalog / storefront** | All 12 | CatatOrder could add a simple public catalog page. BUT keep focus on order management. | LOW |
| **Discount / coupon codes** | TakeApp, Quickzu, Zbooni | Simple discount field already exists in CatatOrder. Coupons would add complexity. | LOW |
| **Delivery fee by distance** | TakeApp | Relevant for katering/kue delivery. Could auto-calculate based on customer address. | LOW |
| **Customer reviews** | TakeApp | Social proof on catalog page. Only relevant if CatatOrder adds public catalog. | LOW |
| **Multi-language** | Quickzu, WhatsOrder | Not needed — CatatOrder is Bahasa Indonesia only by design. | NONE |
| **Multi-agent / team** | DialogTab, Superchat, TakeApp | Only relevant when UMKM grows beyond solo owner. Future feature. | FUTURE |
| **AI chatbot** | TakeApp, Superchat | Auto-reply to common WA questions. Could help busy UMKM during Lebaran rush. | FUTURE |

### The fundamental split in WA commerce tools

```
CATALOG-FIRST (all 12 ProductHunt tools):
  Build store → Display products → Customer picks → Order arrives on WA
  Problem solved: "How do customers find my products?"

ORDER-FIRST (CatatOrder — unique):
  Order arrives on WA → Record in system → Track status → Send receipt → Daily recap
  Problem solved: "How do I manage orders after they arrive?"
```

**CatatOrder solves the AFTER problem. Everyone else solves the BEFORE problem.** These are complementary, not competing. A CatatOrder user could use Callbell Shop for their catalog AND CatatOrder for order management.

---

## Source Data

- TakeApp: take.app, help.take.app, innovationiseverywhere.com, saasworthy.com
- Zbooni: zbooni.com/pricing, zbooni.com/features, Google Play (4.3 stars)
- Callbell Shop: callbell.shop, toolspedia.io, ProductHunt
- OnWhatsApp: saasworthy.com, ProductHunt reviews
- Quickzu: quickzu.com, quickzu.gitbook.io, saasworthy.com
- WhatsAppShop: ProductHunt listing
- DialogTab: dialogtab.com/pricing, Shopify App Store, ProductHunt
- EasyOrder: easy-order.ca, ProductHunt
- Chatmeal: chatmeal.com (DEAD — redirects to HugeDomains), ProductHunt
- WhatsApp Shop: ProductHunt (Nov 2024)
- WhatsOrder: whatsorder.com, Gumroad
- Superchat: superchat.com, capterra.com, ProductHunt
