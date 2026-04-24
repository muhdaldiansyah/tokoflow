# Data Inventory for Rekap/Report Feature

> Research completed 2026-03-10. Catalogues ALL data in the CatatOrder database and identifies derived metrics for a rekap feature.

---

## A. Raw Data Available (per table)

### 1. `orders` (primary data source)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users (store owner) |
| `order_number` | VARCHAR(50) | Human-readable ID, format WO-YYYYMMDD-XXXX |
| `customer_id` | UUID | FK to customers (nullable, SET NULL on delete) |
| `customer_name` | VARCHAR(255) | Denormalized customer name |
| `customer_phone` | VARCHAR(20) | Denormalized customer phone |
| `items` | JSONB | Array of `{name: string, price: number, qty: number}` |
| `subtotal` | INTEGER | Sum of item price * qty (in Rupiah, no decimals) |
| `discount` | INTEGER | Discount amount (default 0) |
| `total` | INTEGER | subtotal - discount |
| `paid_amount` | INTEGER | Amount actually paid so far (default 0) |
| `notes` | TEXT | Free-text order notes |
| `source` | VARCHAR(20) | `manual` / `whatsapp` / `order_link` |
| `status` | VARCHAR(20) | `new` / `menunggu` / `processed` / `shipped` / `done` / `cancelled` |
| `payment_status` | VARCHAR(20) | `paid` / `unpaid` / `partial` (derived from paid_amount vs total) |
| `payment_claimed_at` | TIMESTAMPTZ | When customer tapped "Sudah Bayar" (claim, not proof) |
| `proof_url` | TEXT | URL to uploaded payment proof image |
| `delivery_date` | TIMESTAMPTZ | Scheduled delivery date (nullable) |
| `shipped_at` | TIMESTAMPTZ | Timestamp when status changed to shipped |
| `completed_at` | TIMESTAMPTZ | Timestamp when status changed to done |
| `created_at` | TIMESTAMPTZ | Order creation time |
| `updated_at` | TIMESTAMPTZ | Last modification time |

**Indexes:** user_id, status, customer_id, created_at DESC, delivery_date (conditional).
**Realtime:** REPLICA IDENTITY FULL enabled for UPDATE event detection.

### 2. `customers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users (store owner) |
| `name` | VARCHAR(255) | Customer name |
| `phone` | VARCHAR(20) | Phone number (unique per user_id where not null) |
| `address` | TEXT | Address (optional) |
| `notes` | TEXT | Notes about customer |
| `total_orders` | INTEGER | Aggregate: count of orders (maintained by app) |
| `total_spent` | INTEGER | Aggregate: sum of paid_amount across orders |
| `last_order_at` | TIMESTAMPTZ | Timestamp of most recent order |
| `created_at` | TIMESTAMPTZ | When customer was first created |
| `updated_at` | TIMESTAMPTZ | Last modification |

**Indexes:** user_id, (user_id, phone) unique where phone not null.

### 3. `products`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to profiles |
| `name` | TEXT | Product name |
| `price` | INTEGER | Price in Rupiah |
| `sort_order` | INTEGER | Display ordering |
| `image_url` | TEXT | Product photo URL |
| `description` | TEXT | Product description |
| `category` | TEXT | Free-text category (no FK, uses DISTINCT) |
| `is_available` | BOOLEAN | Availability toggle (default true) |
| `stock` | INTEGER | Tracked inventory count (null = unlimited/made-to-order) |
| `unit` | TEXT | Unit of measurement (porsi, box, pcs, etc.) |
| `min_order_qty` | INTEGER | Minimum order quantity (default 1) |
| `created_at` | TIMESTAMPTZ | Creation time |

**Indexes:** user_id, (user_id, category).

### 4. `receipts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `receipt_number` | VARCHAR(50) | Format WS-YYYYMMDD-XXXX |
| `items` | JSONB | Array of `{name: string, price: number, qty: number}` |
| `subtotal` | INTEGER | Sum of item totals |
| `tax` | INTEGER | Tax amount (currently always 0) |
| `total` | INTEGER | subtotal + tax |
| `customer_name` | VARCHAR(255) | Customer name |
| `customer_phone` | VARCHAR(20) | Customer phone |
| `notes` | TEXT | Receipt notes |
| `payment_status` | VARCHAR(20) | `paid` / `unpaid` |
| `image_url` | TEXT | Generated receipt image URL |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last modification |

**Indexes:** user_id, payment_status, created_at DESC.

### 5. `profiles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK, FK to auth.users |
| `full_name` | VARCHAR(255) | Owner's name |
| `email` | TEXT | Email |
| `avatar_url` | TEXT | Profile photo |
| `role` | VARCHAR(20) | Always 'user' |
| `business_name` | VARCHAR(255) | Store/business name |
| `business_address` | TEXT | Business address |
| `business_phone` | VARCHAR(20) | Business phone |
| `logo_url` | TEXT | Business logo URL |
| `slug` | TEXT | Unique URL slug for public order link |
| `order_form_enabled` | BOOLEAN | Whether public order form is active |
| `qris_url` | TEXT | QRIS image URL for payment |
| `receipts_used` | INTEGER | Monthly receipt count (resets) |
| `receipts_limit` | INTEGER | Receipt limit per month (-1 = unlimited) |
| `orders_used` | INTEGER | Monthly order count (resets on month change) |
| `orders_limit` | INTEGER | Legacy order limit (-1 = unlimited) |
| `order_credits` | INTEGER | Purchased pack credits (never expire, default 0) |
| `unlimited_until` | TIMESTAMPTZ | End of unlimited period (from 3rd pack or direct purchase) |
| `packs_bought_this_month` | INTEGER | Pack purchases this month (resets monthly) |
| `counter_reset_at` | TIMESTAMPTZ | Tracks last monthly reset |
| `ai_credits_used` | INTEGER | AI credit usage (legacy, now -1 unlimited) |
| `ai_credits_limit` | INTEGER | AI credit limit (legacy, now -1 unlimited) |
| `ai_credits_topup` | INTEGER | Top-up AI credits (legacy) |
| `plan` | VARCHAR(20) | Current plan: 'free' |
| `plan_expiry` | TIMESTAMPTZ | Plan expiration (legacy) |
| `first_wa_sent_at` | TIMESTAMPTZ | Activation metric: first WA share |
| `onboarding_drip` | JSONB | Drip message tracking: `{"day0": "2026-...", "day1": "..."}` |
| `created_at` | TIMESTAMPTZ | Account creation |
| `updated_at` | TIMESTAMPTZ | Last profile update |

### 6. `reminders`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `receipt_id` | UUID | FK to receipts (nullable) |
| `order_id` | UUID | FK to orders (nullable) |
| `reminder_type` | VARCHAR(20) | `receipt` / `order` |
| `day_offset` | INTEGER | Days after creation (1, 3, or 7) |
| `scheduled_at` | TIMESTAMPTZ | When reminder is scheduled to fire |
| `sent_at` | TIMESTAMPTZ | When actually sent (null if pending) |
| `status` | VARCHAR(20) | `pending` / `sent` / `failed` / `cancelled` |
| `fonnte_response` | JSONB | API response from sending service |
| `message_text` | TEXT | The reminder message content |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last modification |

### 7. `ai_analyses`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `analysis_type` | TEXT | `daily` / `monthly` |
| `period_key` | TEXT | Date string (YYYY-MM-DD for daily, YYYY-MM for monthly) |
| `insights` | TEXT | AI-generated analysis text |
| `data_snapshot` | JSONB | Snapshot of data used for analysis |
| `created_at` | TIMESTAMPTZ | When analysis was generated |

**Unique:** (user_id, analysis_type, period_key).

### 8. `events` (analytics)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `event` | TEXT | Event name (e.g. `public_order_received`) |
| `properties` | JSONB | Event-specific data (slug, item_count, subtotal, UTM params) |
| `created_at` | TIMESTAMPTZ | Event timestamp |

**Indexes:** (user_id, created_at DESC), (event, created_at DESC).

### 9. `wa_connections`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to profiles |
| `wa_phone_number_id` | TEXT | WhatsApp Cloud API phone number ID |
| `wa_business_id` | TEXT | WABA ID |
| `access_token` | TEXT | AES-256-GCM encrypted token |
| `is_active` | BOOLEAN | Connection active status |
| `display_phone_number` | TEXT | Human-readable phone number |
| `display_name` | TEXT | WA Business display name |
| `token_expires_at` | TIMESTAMPTZ | Token expiration |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last modification |

### 10. `wa_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `connection_id` | UUID | FK to wa_connections |
| `customer_phone` | TEXT | Customer's phone number |
| `status` | TEXT | `collecting` / `confirming` / `completed` / `cancelled` |
| `raw_messages` | JSONB | Array of raw message objects |
| `parsed_items` | JSONB | AI-parsed items from conversation |
| `customer_name` | TEXT | Extracted customer name |
| `expires_at` | TIMESTAMPTZ | Session expiry (default now + 3 min) |
| `created_at` | TIMESTAMPTZ | Session start |
| `updated_at` | TIMESTAMPTZ | Last activity |

### 11. `wa_messages` (audit log)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `connection_id` | UUID | FK to wa_connections |
| `wa_message_id` | TEXT | Unique WA message ID (dedup) |
| `direction` | TEXT | `inbound` / `outbound` |
| `from_phone` | TEXT | Sender phone |
| `to_phone` | TEXT | Recipient phone |
| `message_type` | TEXT | Message type (text, image, etc.) |
| `content` | JSONB | Message content |
| `session_id` | UUID | FK to wa_sessions (nullable) |
| `created_at` | TIMESTAMPTZ | Message timestamp |

### 12. `payment_orders` (SaaS billing)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `plan_code` | VARCHAR(20) | Plan/product code (`pack` / `unlimited`) |
| `billing_cycle` | VARCHAR(20) | `monthly` / `yearly` |
| `status` | VARCHAR(20) | `pending` / `completed` / `failed` / `cancelled` / `challenge` |
| `amount` | INTEGER | Payment amount in Rupiah |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

### 13. `transactions` (Midtrans)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `payment_order_id` | UUID | FK to payment_orders |
| `midtrans_order_id` | VARCHAR(100) | Unique Midtrans reference |
| `status` | VARCHAR(50) | Midtrans transaction status |
| `payment_type` | VARCHAR(50) | Payment method (e.g. QRIS) |
| `gross_amount` | INTEGER | Charged amount |
| `raw_response` | JSONB | Full Midtrans webhook payload |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

### 14. `plans` (reference data)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | VARCHAR(20) | Unique plan code |
| `name` | VARCHAR(50) | Display name |
| `description` | TEXT | Plan description |
| `price_monthly` | INTEGER | Monthly price |
| `price_yearly` | INTEGER | Yearly price |
| `receipts_limit` | INTEGER | Receipt limit per month |
| `orders_limit` | INTEGER | Order limit per month |
| `features` | JSONB | Feature list array |
| `is_active` | BOOLEAN | Whether plan is available |

### 15. `webhook_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | VARCHAR(100) | Midtrans order ID |
| `event_type` | VARCHAR(50) | Webhook event type |
| `payload` | JSONB | Full webhook payload |
| `status` | VARCHAR(20) | `success` / `failed` / `ignored` |
| `error_message` | TEXT | Error details if failed |
| `created_at` | TIMESTAMPTZ | Received time |

### Storage Buckets

| Bucket | Public | Contents |
|--------|--------|----------|
| `payment-proofs` | Yes | Payment proof images per order |
| `qris-codes` | Yes | Static QRIS images per user |
| `product-images` | Yes | Product photos (1MB limit, image types) |
| `profile-photos` | Yes | Business logos/profile photos (2MB limit) |

---

## B. Derived Metrics (what can be calculated)

### Order Volume Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total orders per period | `orders.created_at` | COUNT where created_at in period |
| Orders by status breakdown | `orders.status` | COUNT GROUP BY status |
| Orders by source breakdown | `orders.source` | COUNT GROUP BY source (manual/whatsapp/order_link) |
| Active orders (pipeline) | `orders.status` | COUNT where status NOT IN (done, cancelled, menunggu) |
| Completion rate | `orders.status` | COUNT(done) / COUNT(all non-cancelled) |
| Cancellation rate | `orders.status` | COUNT(cancelled) / COUNT(all) |
| Average orders per day | `orders.created_at` | COUNT / days in period |
| Order growth rate | `orders.created_at` | Period-over-period % change in order count |
| Average items per order | `orders.items` | AVG(array length of items JSONB) |
| Average order value (AOV) | `orders.total` | SUM(total) / COUNT (non-cancelled) |
| Median order value | `orders.total` | PERCENTILE_CONT(0.5) of total |
| Order value distribution | `orders.total` | Histogram buckets of total values |
| Orders with delivery date | `orders.delivery_date` | COUNT where delivery_date IS NOT NULL |
| Orders with discount | `orders.discount` | COUNT where discount > 0, SUM(discount) |
| Menunggu orders (quota-blocked) | `orders.status` | COUNT where status = 'menunggu' |

### Revenue Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| Gross revenue (total billed) | `orders.total` | SUM(total) where status != cancelled |
| Collected revenue (cash in) | `orders.paid_amount` | SUM(paid_amount) where status != cancelled |
| Outstanding (piutang) | `orders.total - paid_amount` | SUM(total - paid_amount) where total > paid_amount, status != cancelled |
| Revenue by payment status | `orders.payment_status` | SUM(total) GROUP BY payment_status |
| Daily revenue trend | `orders.created_at, total` | SUM(total) GROUP BY DATE(created_at) |
| Revenue by source channel | `orders.source, total` | SUM(total) GROUP BY source |
| Discount total given | `orders.discount` | SUM(discount) where discount > 0 |
| Net revenue (after discounts) | `orders.subtotal, discount` | SUM(subtotal - discount) |
| Revenue per order by source | `orders.source, total` | AVG(total) GROUP BY source |
| Month-over-month revenue growth | `orders.created_at, total` | % change in SUM(total) vs previous period |
| Revenue from repeat customers | `orders.customer_id` | SUM(total) where customer has >1 order |
| Revenue from new customers | `orders.customer_id` | SUM(total) where customer's first order is in period |

### Payment & Collection Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| Collection rate (%) | `orders.paid_amount, total` | SUM(paid_amount) / SUM(total) * 100 |
| Fully paid rate | `orders.payment_status` | COUNT(paid) / COUNT(all non-cancelled) |
| Partial payment count | `orders.payment_status` | COUNT where payment_status = 'partial' |
| Unpaid order count and total | `orders.payment_status, total` | COUNT + SUM(total) where payment_status = 'unpaid' |
| Payment claim rate | `orders.payment_claimed_at` | COUNT(claimed) / COUNT(all from order_link) |
| Claim-to-payment lag | `orders.payment_claimed_at, completed_at` | Time between customer claim and seller marking paid |
| Piutang aging | `orders.created_at, paid_amount, total` | Outstanding amount bucketed by age (0-7d, 7-14d, 14-30d, 30d+) |
| Piutang by customer | `orders.customer_id, paid_amount, total` | SUM(outstanding) GROUP BY customer |
| Average time to full payment | `orders.created_at, updated_at` | AVG time between creation and paid_amount reaching total |
| Payment proof upload rate | `orders.proof_url` | COUNT(proof_url IS NOT NULL) / COUNT(all) |

### Product Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| Top products by quantity | `orders.items` | SUM(qty) GROUP BY item name, across all orders |
| Top products by revenue | `orders.items` | SUM(price * qty) GROUP BY item name |
| Product revenue contribution (%) | `orders.items` | Product revenue / total revenue * 100 |
| Product frequency (orders containing) | `orders.items` | COUNT of orders containing each product |
| Average qty per order per product | `orders.items` | AVG(qty) GROUP BY item name |
| Product price changes over time | `orders.items, created_at` | Track price values for same item name across time |
| Category revenue breakdown | `products.category + orders.items` | Match items to catalog categories, SUM revenue per category |
| Catalog coverage | `products + orders.items` | % of ordered items that match catalog products |
| Stock turnover rate | `products.stock + orders.items` | Units sold / average stock level per product |
| Products never ordered | `products LEFT JOIN orders.items` | Products in catalog not appearing in any order |
| Out-of-stock frequency | `products.stock, is_available` | Count of products where stock hit 0 |
| Product count per category | `products.category` | COUNT GROUP BY category |
| Active vs inactive products | `products.is_available` | COUNT GROUP BY is_available |
| Average product price | `products.price` | AVG(price) across catalog |
| Price range | `products.price` | MIN, MAX, distribution |

### Customer Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total unique customers | `customers` | COUNT |
| New customers per period | `customers.created_at` | COUNT where created_at in period |
| Customer growth rate | `customers.created_at` | Period-over-period % change |
| Customer lifetime value (LTV) | `customers.total_spent` | AVG(total_spent) across all customers |
| Top customers by spending | `customers.total_spent` | ORDER BY total_spent DESC |
| Top customers by order count | `customers.total_orders` | ORDER BY total_orders DESC |
| Average order frequency | `customers.total_orders, created_at, last_order_at` | total_orders / months since first order |
| Customer retention (repeat rate) | `orders.customer_id` | Customers with >1 order / total customers |
| One-time vs repeat customers | `customers.total_orders` | COUNT where total_orders = 1 vs > 1 |
| Average orders per customer | `customers.total_orders` | AVG(total_orders) |
| Average spend per customer | `customers.total_spent` | AVG(total_spent) |
| Days since last order (recency) | `customers.last_order_at` | NOW() - last_order_at for each customer |
| Churned customers | `customers.last_order_at` | Customers with last_order_at > 30/60/90 days ago |
| Customer acquisition channel | `orders.source + customer_id` | First order source per customer |
| Customer piutang ranking | `orders.customer_id, paid_amount, total` | Outstanding debt per customer |
| Customers with address | `customers.address` | COUNT where address IS NOT NULL |

### Time-based / Pattern Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| Peak hour of day | `orders.created_at` | COUNT GROUP BY EXTRACT(HOUR FROM created_at) |
| Peak day of week | `orders.created_at` | COUNT GROUP BY EXTRACT(DOW FROM created_at) |
| Busiest dates | `orders.created_at` | COUNT GROUP BY DATE, ORDER BY count DESC |
| Daily order trend (sparkline) | `orders.created_at` | COUNT per day over last 7/14/30 days |
| Weekly revenue trend | `orders.created_at, total` | SUM(total) GROUP BY ISO week |
| Delivery date lead time | `orders.created_at, delivery_date` | AVG(delivery_date - created_at) in days |
| Order processing time | `orders.created_at, shipped_at, completed_at` | AVG time from created_at to shipped_at, shipped_at to completed_at |
| Fulfillment speed | `orders.created_at, completed_at` | AVG(completed_at - created_at) for done orders |
| Seasonal patterns | `orders.created_at, total` | Revenue/volume by month across years |
| Weekend vs weekday orders | `orders.created_at` | Compare Sat+Sun vs Mon-Fri volume |
| Morning vs afternoon vs evening | `orders.created_at` | Volume by time blocks (WIB timezone) |

### Quota / Business Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| Free quota usage | `profiles.orders_used` | orders_used / 50 * 100 (%) |
| Pack credits remaining | `profiles.order_credits` | Current credit balance |
| Packs purchased this month | `profiles.packs_bought_this_month` | Current count |
| Unlimited status | `profiles.unlimited_until` | Active/expired/never |
| Projected quota exhaustion date | `profiles.orders_used + orders trend` | At current rate, when will free 50 run out |
| Order link adoption | `orders.source = 'order_link'` | % of all orders from order_link |
| WhatsApp bot adoption | `orders.source = 'whatsapp'` | % of all orders from WhatsApp |
| Source channel mix over time | `orders.source, created_at` | Trend of source proportions |

### Reminder / Follow-up Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| Reminders sent | `reminders.status` | COUNT where status = 'sent' |
| Reminder effectiveness | `reminders + orders` | Orders that became paid after reminder sent |
| Pending reminders | `reminders.status` | COUNT where status = 'pending' |
| Cancelled reminders | `reminders.status` | COUNT where status = 'cancelled' |

### WhatsApp Channel Metrics

| Metric | Source | Calculation |
|--------|--------|-------------|
| WA sessions total | `wa_sessions` | COUNT |
| WA session completion rate | `wa_sessions.status` | COUNT(completed) / COUNT(all) |
| WA messages volume | `wa_messages` | COUNT by direction (inbound/outbound) |
| WA order conversion rate | `wa_sessions + orders` | Completed sessions / all sessions |
| Average messages per session | `wa_messages.session_id` | COUNT GROUP BY session_id, then AVG |

### Receipt Metrics (legacy/secondary)

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total receipts | `receipts` | COUNT |
| Receipt revenue | `receipts.total` | SUM(total) |
| Unpaid receipts | `receipts.payment_status` | COUNT where unpaid |
| Receipt items overlap with orders | `receipts.items + orders.items` | Compare item names across both systems |

---

## C. Cross-table Insights

### 1. Orders x Customers: Customer Segmentation

- **RFM Analysis (Recency, Frequency, Monetary):** Combine `customers.last_order_at` (recency), `customers.total_orders` (frequency), and `customers.total_spent` (monetary) to segment customers into tiers (VIP, loyal, at-risk, lost).
- **Customer cohort retention:** Group customers by `created_at` month, then track how many return in subsequent months via `orders.created_at`.
- **New vs returning customer revenue split:** For each period, separate revenue from customers whose `created_at` is within vs before the period.
- **Customer-specific piutang risk:** Customers with high `total_spent` but high outstanding balance across orders may be high-risk.

### 2. Orders x Products: Product Performance

- **Catalog vs non-catalog orders:** Compare `orders.items` names against `products.name` to see how many orders use catalog products vs free-text items.
- **Product pair analysis (frequently bought together):** Mine `orders.items` arrays for item combinations that co-occur in the same order.
- **Category performance:** Match order item names to `products.category` to compute category-level revenue and volume.
- **Price variance detection:** Compare `orders.items[].price` against `products.price` for the same product to detect if sellers are giving custom prices.
- **Stock vs demand mismatch:** Compare `products.stock` with order velocity to identify products that frequently sell out or have excess inventory.

### 3. Orders x Source: Channel Effectiveness

- **Channel AOV comparison:** Average order value from `order_link` vs `whatsapp` vs `manual` orders.
- **Channel payment behavior:** Payment collection rate by source channel (do order_link customers pay faster?).
- **Channel growth trend:** Over time, how is the mix of manual/whatsapp/order_link shifting?
- **Order link conversion funnel:** `events.public_order_received` vs total page visits (if tracked) per slug.

### 4. Orders x Time: Operational Insights

- **Delivery date accuracy:** Orders with `delivery_date` vs actual `completed_at` to measure on-time delivery rate.
- **Processing pipeline bottleneck:** Average time spent in each status (new -> processed -> shipped -> done) to identify slow stages.
- **Rush order detection:** Orders where `delivery_date - created_at` is very small (same-day or next-day).
- **Payment collection timeline:** For unpaid orders, how many days typically pass before `paid_amount` reaches `total`.

### 5. Orders x Reminders: Collection Effectiveness

- **Reminder ROI:** Compare collection rates for orders WITH reminders vs WITHOUT.
- **Optimal reminder timing:** Which `day_offset` (1, 3, or 7 days) has the highest success rate (order marked paid after reminder sent)?
- **Customers who respond to reminders:** Which customers typically pay after reminders vs those who don't.

### 6. Customers x Products: Preference Mapping

- **Customer product preferences:** Which products each customer orders most frequently (from `orders.items` joined on `customer_id`).
- **Product cross-sell opportunities:** Customers who buy product A but never product B (where A and B are commonly bought together by other customers).

### 7. Events x Orders: Behavioral Analytics

- **UTM attribution:** Match `events.properties.utm_source` with `orders.created_at` to attribute revenue to marketing channels.
- **Feature usage correlation:** Track events (e.g., `public_order_received`) alongside order volume to measure feature impact.

### 8. Payment Orders x Profile: SaaS Revenue

- **Pack purchase patterns:** How often does the user buy packs, and does purchase frequency correlate with order volume growth?
- **Upgrade triggers:** What order volume level triggers a pack purchase or unlimited subscription?
- **Revenue per user (SaaS):** SUM(`payment_orders.amount`) where status = completed per user.

### 9. WA Sessions x Orders: Bot Performance

- **Bot conversion rate:** `wa_sessions` completed -> `orders` created with source = 'whatsapp' within session timeframe.
- **Bot vs manual order quality:** Compare AOV, payment rates, and completion rates between WA bot orders and manual orders.
- **Session drop-off points:** Analyze `wa_sessions.status` distribution (collecting -> cancelled vs completed) to understand where customers abandon.

---

## Summary

**Total tables:** 15 (including plans, webhook_logs)
**Primary data tables for rekap:** 4 (orders, customers, products, receipts)
**Supporting tables:** 5 (events, reminders, ai_analyses, wa_sessions, wa_messages)
**Billing tables:** 3 (payment_orders, transactions, webhook_logs)
**Config tables:** 2 (plans, wa_connections)
**User table:** 1 (profiles)

**Already computed in existing services:**
- Daily recap: order count, status breakdown, revenue (total/paid/partial/unpaid/collected), new customers, top items (recap.service.ts)
- Monthly report: all daily metrics + daily breakdown, top customers, top items, orders by status (report.service.ts)
- Today summary: pending count, today revenue, today order count, link order count, unpaid count (order.service.ts)
- Piutang summary: total debt, customer debt ranking (order.service.ts)
- AI analysis: daily and monthly insights with comparison data (analyze API route)

**Not yet computed (opportunities for new rekap features):**
- Source channel breakdown and trends
- Customer segmentation (RFM, retention cohorts)
- Product pair analysis / frequently bought together
- Processing time / fulfillment speed analytics
- Payment collection timeline and aging
- Delivery date accuracy / on-time rate
- Reminder effectiveness metrics
- Peak hour / day-of-week patterns
- Customer acquisition channel attribution
- Quota usage projections
- Category-level revenue analysis
- Stock turnover and demand forecasting
