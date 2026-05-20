# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working with this repo.

## Quick start

```bash
npm install
cp .env.example .env.local       # then fill in Supabase URL + anon key
npm run dev                       # http://localhost:3000
```

The first user to register at `/register` is auto-promoted to **owner**; every
subsequent signup defaults to **staff**. See [RBAC](#rbac) below.

## Development commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build (runs `prebuild.js` first to clean caches) |
| `npm run start` | Serve the production build |
| `npm run lint` | `next lint` (deprecated in Next 16; eslint CLI migration pending) |
| `npm run verify-imports` | Walks `app/(public)` checking import paths |
| `node --test lib/services/marketplace/**/*.test.js` | Run all 81 marketplace unit tests (signers, webhook verifiers, crypto round-trip). Zero dependencies — uses Node's built-in test runner. |

## Database

Tokoflow uses **Supabase** (Postgres + auth + storage). The full schema is
checked into `db/schema.sql` and is the **single source of truth**. Re-running
it on an existing DB is safe — every `create table` is `if not exists` and every
column add is wrapped in an idempotent `do $$` migration block.

### Apply schema to a fresh project

```bash
# 1. Get your project ref + access token from the Supabase dashboard
SUPABASE_PROJECT=yhwjvdwmwboasehznlfv         # or your project ref
SUPABASE_TOKEN=sbp_xxxxxxxxxxxxxxxxxxx

# 2. Apply schema (idempotent)
node -e "process.stdout.write(JSON.stringify({query:require('fs').readFileSync('db/schema.sql','utf8')}))" \
  | curl -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT/database/query" \
      -H "Authorization: Bearer $SUPABASE_TOKEN" \
      -H "Content-Type: application/json" \
      --data-binary @-

# 3. Apply seed (default marketplace channels + early-access plan)
node -e "process.stdout.write(JSON.stringify({query:require('fs').readFileSync('db/seed.sql','utf8')}))" \
  | curl -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT/database/query" \
      -H "Authorization: Bearer $SUPABASE_TOKEN" \
      -H "Content-Type: application/json" \
      --data-binary @-
```

### Tables

| Table | Purpose |
|---|---|
| `av_profiles` | User profile (1:1 with `auth.users`). Includes `role text` (owner/staff). |
| `tf_products` | Product catalog. Has `low_stock_threshold` and a generated `stock_status` column (`negative` / `zero` / `low` / `normal`). |
| `tf_product_costs` | Per-SKU modal/packing/affiliate costs. 1:1 with `tf_products` via SKU. |
| `tf_marketplace_fees` | Fee % per channel (Shopee, Tokopedia, etc.). |
| `tf_sales_input` | Staging table — sales pending finalization. Status flows `pending → ok → processed`. |
| `tf_sales_transactions` | Finalized sales with full financial breakdown (revenue, profit, all costs). FK to `tf_customers`. |
| `tf_incoming_goods_input` / `tf_incoming_goods` | Same staging→final pattern for stock receipts. |
| `tf_stock_adjustments` | Manual stock corrections with reason + audit trail. |
| `tf_product_compositions` | Bundle/parent → component decomposition. Channel-aware. |
| `tf_customers` | Lightweight customer directory (name, phone, notes). Sales transactions FK to this. |
| `tf_warehouses` | Stock locations. Each product belongs to ONE warehouse via `tf_products.warehouse_id`. |
| `tf_alert_acks` | Per-user (PK = user_id+sku) acknowledgement of stock alerts. |
| `tf_marketplace_connections` | OAuth state for marketplace integrations. Holds encrypted tokens (`access_token_enc` / `refresh_token_enc` — AES-256-GCM), `shop_cipher` (TikTok Shop only), `last_sync_cursor` watermark, `seller_type` (distinguishes Tokopedia Shop from TikTok Shop), and a `connection_meta` jsonb stash. Legacy plaintext columns `access_token` / `refresh_token` exist but are unused by new code. |
| `tf_webhook_events` | Inbox for marketplace webhook deliveries. Webhook routes verify signature + insert row fast; cron `/api/cron/webhook-events-process` drains. Dedup via the partial unique index on `tf_sales_input`. |
| `kn_membership_plans` | Subscription/credit plans (read by `/plans` and `/checkout`). Legacy `kn_` prefix from sibling project. |
| `kn_transactions` | Payment transaction log. |

The `tf_sales_input` and `tf_sales_transactions` tables also have marketplace
back-reference columns — `external_source`, `external_order_id`, `external_item_id`,
`external_update_time`, `marketplace_raw` on input; plus `fee_reconciled_at` on
transactions. A partial unique index `tf_sales_input_external_uniq` on
`(external_source, external_order_id, external_item_id) where external_order_id is not null`
is the hard dedup boundary — duplicate webhook/poll retries upsert cleanly without
double-counting. Manual `/sales` entries have all three NULL and are unaffected.

### Views

- `v_products_with_costs` — joins `tf_products` + `tf_product_costs` + `tf_warehouses`. Includes a `search_tsv` tsvector for full-text search via the `public.simple_unaccent` config.

### Naming prefixes

- `tf_*` — Tokoflow operational tables
- `kn_*` — membership/billing (legacy from sibling project, kept as-is)
- `av_*` — profile (legacy from sibling project)
- `v_*`  — views

## Architecture

Tokoflow is a Next.js 15 (App Router, Turbopack) app with mixed JS/TS,
deployed on Vercel, backed by Supabase. The performance work in `lib/cache/`,
`lib/http/`, and `lib/state/` is real — ETag, cursor pagination, output cache,
HTTP keepalive — match those patterns when adding new endpoints.

### Route organization

- `app/(private)/` — authenticated routes (dashboard, inventory, sales, customers, scanner, etc.)
- `app/(public)/` — unauthenticated routes (landing, login, register, marketing pages)
- `app/api/` — API routes organized by feature
- Auth gate: `middleware.js` redirects unauthenticated users on private routes to `/login`. The matcher is the source of truth for which top-level paths are private.

### Key directories

| Path | Purpose |
|---|---|
| `app/(private)/dashboard/` | Wired to `/api/dashboard` + `/api/customers?with_stats=1`. Shows real metrics, channels, top products, top customers. |
| `app/(private)/products/` | List + new + edit. Server-side data fetch via the view. |
| `app/(private)/sales/` | Sales input form + pending sales table. Customer dropdown is optional. |
| `app/(private)/sales-history/` | Transactions + per-channel/per-product/per-date summary toggle + filters. |
| `app/(private)/customers/` | Customer directory + per-customer detail page (`[id]/page.js`). |
| `app/(private)/warehouses/` | Warehouse CRUD (owner only). |
| `app/(private)/marketplace/` | Marketplace integration management (owner only). Per-shop cards with real sync status, last_webhook_at, seller_type badge, OAuth callback feedback via `?connected=`/`?error=` query params. |
| `app/(private)/scanner/` | Barcode scanner page using `BarcodeDetector` API. |
| `app/(private)/admin/users/` | Owner-only user management with role promotion/demotion. |
| `app/(private)/inventory/` | Stock list with negative/zero/low/normal/alert filters and per-product threshold display. |
| `app/api/marketplace/connect/[provider]/` | POST — builds signed OAuth redirect URL per provider, returns `{ redirect_url }`. Owner-only. Tokopedia returns 410 (absorbed into TikTok Shop). |
| `app/api/marketplace/callback/[provider]/` | GET — OAuth callback handler. Verifies signed `state`, exchanges auth_code for tokens, fetches `shop_cipher` (TikTok Shop), upserts connection with encrypted tokens via `upsertConnectionWithTokens`. Redirects back to `/marketplace?connected=…`. |
| `app/api/marketplace/sync/[id]/` | POST — manual sync trigger. Uses the service-role Supabase client and calls `syncTikTokShopConnection` / `syncShopeeConnection`. Owner-only. |
| `app/api/webhooks/{tiktok-shop,shopee}/` | POST — verify signature against raw body, find connection by `shop_id`, insert into `tf_webhook_events` inbox, handle urgent events (deauthorization) inline. Return 200 fast. Uses service-role client (no session). |
| `app/api/cron/marketplace-sync/` | Vercel Cron every 15 min. Auth via `Bearer $CRON_SECRET`. Fans out `syncTikTokShopConnection` / `syncShopeeConnection` over all active connections, sequentially. |
| `app/api/cron/webhook-events-process/` | Vercel Cron every 2 min. Drains `tf_webhook_events` where status='pending' by running the same sync functions, grouped by connection so multiple events for one shop collapse into one sync call. |
| `app/api/cron/marketplace-fee-reconcile/` | Vercel Cron daily at 03:00. Pulls escrow (Shopee) / statement transactions (TikTok Shop — WIP) for finalized transactions older than 24h and overwrites `marketplace_fee` + `net_profit` with the authoritative settlement numbers. |
| `lib/database/supabase/` | Browser Supabase client. |
| `lib/database/supabase-server/` | Server Supabase client (reads cookies via `next/headers`). **Also exports `createServiceRoleClient()`** — bypasses RLS for webhook handlers and cron jobs. Server-only; requires `SUPABASE_SERVICE_ROLE_KEY`. |
| `lib/services/` | Business logic — inventory, sales, composition, incoming-goods. **Sales/incoming processors copy `customer_id` from input → finalized transaction.** |
| `lib/services/marketplace/` | Marketplace integration plumbing + providers. `crypto.js` (AES-GCM token encryption + HMAC helpers), `errors.js` (MarketplaceError taxonomy + provider classifiers), `http.js` (fetch wrapper with retry/backoff/timeout), `connections.js` (token-aware data access). Provider subfolders `tiktok-shop/` and `shopee/` each contain `signer.js`, `auth.js`, `orders.js`, `webhooks.js`, `sync.js` + colocated `*.test.js` files. |
| `lib/auth/role.js` | `requireOwner(auth)` and `getCurrentRole(auth)` helpers for API gates. |
| `lib/utils/api-response.js` | `successResponse`, `errorResponse`, `handleSupabaseError`. |
| `lib/utils/auth-helpers.js` | `authenticateRequest(request)` — entry point for every API route. |
| `lib/cache/`, `lib/http/`, `lib/state/` | Performance plumbing — LRU cache, cursor encoder, ETag helpers, server timing, global state tags. |

## RBAC

Two roles, gated at both API and UI level.

- **owner** — full access. First user to sign up is auto-promoted via the `handle_new_user` trigger.
- **staff** — operational access. Cannot edit cost data, marketplace fees, delete products/customers, or manage warehouses/users/marketplace connections.

### How to gate a new API route

```js
import { requireOwner } from '../../../lib/auth/role.js';

export async function POST(request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return errorResponse(auth.error, auth.status || 401);

  const gate = await requireOwner(auth);
  if (!gate.ok) return gate.response;        // returns 403 with Indonesian message

  // ... privileged action
}
```

For per-field gates (e.g. PATCH allows name but not cost), use `getCurrentRole(auth)`
and check before applying the field — see `app/api/products/[param]/route.js` PATCH
for the pattern.

### How to hide UI from staff

`PrivateNav` filters menu items via `OWNER_ONLY_PREFIXES`. For per-button hiding:

```jsx
const { profile } = useAuth();
const isOwner = profile?.role === 'owner';
{isOwner && <button onClick={handleDelete}>Delete</button>}
```

### Last-owner safeguard

`PATCH /api/users/[id]/role` refuses to demote a user from `owner` to `staff`
if it's the only remaining owner (HTTP 409). Don't bypass this in code.

## Stock alerts

Alerts are derived live from `tf_products.stock_status` (the generated column).
There's no separate "alerts table" — instead `tf_alert_acks` tracks which
SKU+status combinations the current user has already acknowledged. The unread
feed is the LEFT JOIN difference. This means alerts auto-resolve when stock
returns to normal, and re-fire when a SKU drops back below threshold.

- `GET /api/alerts` returns `{ alerts, counts: { negative, zero, low, total, unread } }`
- `POST /api/alerts/ack` accepts `{ sku, status }` (single) or `{ acknowledge_all: true }` (bulk)
- The bell icon in `PrivateNav` polls every 60s and shows the unread count

## Multi-warehouse

**Minimum viable:** each product belongs to ONE warehouse via `tf_products.warehouse_id`.
A merchant models "cabang Jakarta" vs "cabang Surabaya" by creating separate SKUs
per branch (`ABC-JKT`, `ABC-SBY`). True per-warehouse-stock-per-product is a
Tier 4 follow-up that requires a `tf_product_inventory` pivot table and rewriting
every inventory query.

The migration in `db/schema.sql` backfills all existing products to the
default warehouse so nothing is left with `NULL`.

## Marketplace integration

**Real integration, not scaffolding.** Two providers are supported: **TikTok
Shop Partner Center** and **Shopee Open Platform v2**. Tokopedia is
intentionally NOT a separate integration — the legacy `developer.tokopedia.com`
OpenAPI is being terminated and Tokopedia storefronts are absorbed into TikTok
Shop Partner Center under `seller_type: "Tokopedia Shop"`. One TikTok Shop
OAuth covers both platforms for merchants who have migrated.

The `POST /api/marketplace/connect/tokopedia` endpoint returns **HTTP 410 Gone**
with a message explaining the migration. Don't re-add a Tokopedia-specific
path without reading the research in `memory/` first.

### Architecture — ISV pattern

One set of developer credentials belongs to Tokoflow-the-product:

```
TIKTOKSHOP_APP_KEY  + TIKTOKSHOP_APP_SECRET   (one per install)
SHOPEE_PARTNER_ID   + SHOPEE_PARTNER_KEY      (one per install)
```

Every merchant OAuths their own shop into these same credentials. Merchants
never see a developer portal — they only click "Connect" in `/marketplace`
and approve on the platform's consent screen. The resulting per-shop
`access_token` / `refresh_token` get AES-256-GCM encrypted via
`lib/services/marketplace/crypto.js` and stored in
`tf_marketplace_connections.access_token_enc` / `refresh_token_enc`.

The memory file `feedback_user_no_dev_friction.md` documents this principle:
merchants are end users, NEVER developers. Do not add any flow that asks a
merchant to obtain API keys themselves.

### OAuth flow

1. **Connect** — `POST /api/marketplace/connect/:provider` builds a signed
   redirect URL via the provider's `buildAuthorizeUrl`. A signed `state`
   token (HMAC-SHA256 of `user_id.ts` with `CRON_SECRET` as key) gets
   embedded so the callback can verify CSRF + session continuity.
2. **Merchant approves** on the platform — TikTok Shop scopes are configured
   per-app in Partner Center (not via query param); Shopee approves the shop
   via its auth_partner flow.
3. **Callback** — `GET /api/marketplace/callback/:provider` verifies state,
   exchanges auth_code for tokens via `exchangeAuthCode`, then:
   - **TikTok Shop**: calls `fetchAuthorizedShops` (`GET /authorization/202309/shops`)
     to get one-or-more `shop_cipher` values per authorized shop. Upserts one
     `tf_marketplace_connections` row per shop.
   - **Shopee**: single shop per callback (shop_id comes on the redirect).
     One row per connect.
4. **Redirect back** to `/marketplace?connected=<provider>&shops=N` with a
   success toast, or `?error=<code>` with a failure message.

### Signing — the two provider schemes

**TikTok Shop** (authoritative source: `lib/services/marketplace/tiktok-shop/signer.js`,
algorithm matches the `EcomPHP/tiktokshop-php` SDK's `Client.php#prepareSignature()`):

```
query = { ...callerParams, app_key, timestamp, shop_cipher? }
signable = path +
           sort_keys(query).map(k => k + query[k]).join('') +
           (method!=GET && !multipart ? JSON.stringify(body) : '')
wrapped  = app_secret + signable + app_secret
sign     = lowercase_hex(hmac_sha256(app_secret, wrapped))
```

Passed as `?sign=<hex>`. Access token goes in `x-tts-access-token` header,
NOT `Authorization: Bearer`. Shopless paths (`/authorization/*`, `/seller/*`,
some product uploads) don't need `shop_cipher`.

**Shopee v2** (authoritative source: `lib/services/marketplace/shopee/signer.js`):

```
# Public endpoints (auth_partner, token/get, access_token/get):
base = partner_id + path + timestamp
sign = lowercase_hex(hmac_sha256(partner_key, base))

# Shop-level endpoints (get_order_list, get_order_detail, get_escrow_detail):
base = partner_id + path + timestamp + access_token + shop_id
sign = lowercase_hex(hmac_sha256(partner_key, base))
```

No sorted params, no body signing, no separators. Passed as `?sign=<hex>`.

**Both signers are unit-tested** against known vectors (21 TikTok Shop tests,
16 Shopee tests). Before touching either signer, run
`node --test lib/services/marketplace/<provider>/signer.test.js` to confirm
you haven't regressed. The test file is the specification.

### Sync strategy — webhook + cron backup

- **Primary path: webhook.** `POST /api/webhooks/{tiktok-shop,shopee}` verifies
  signature against the raw body (must read `await request.text()` BEFORE JSON
  parsing), inserts into `tf_webhook_events` inbox, returns 200 within ~100ms.
  The inbox drain cron (`/api/cron/webhook-events-process`, every 2 min)
  picks up pending rows and runs `syncConnection` for each distinct
  `(source, connection_id)`. One sync covers all recent changes via the
  `update_time` cursor.
- **Backstop path: periodic poll.** `/api/cron/marketplace-sync` runs every 15
  minutes, iterates all `is_active=true` connections, and calls the same
  `syncConnection` functions. Catches dropped webhooks and gaps during
  downtime. The sync function reads `last_sync_cursor` and queries
  `update_time_ge = cursor - 5min` (5-minute overlap for safety).
- **Fee reconciliation.** `/api/cron/marketplace-fee-reconcile` runs daily at
  03:00. For Shopee orders older than 24h without `fee_reconciled_at`, it
  calls `get_escrow_detail` to fetch real `commission_fee` / `service_fee`,
  prorates across line items by value, and overwrites
  `tf_sales_transactions.marketplace_fee` + `net_profit`. TikTok Shop
  finance-API reconciliation is scaffolded but not yet implemented — see
  the TODO in that file.

All three cron endpoints require `Authorization: Bearer $CRON_SECRET`. Vercel
Cron sets this header automatically for scheduled invocations. Direct calls
without the header return 401.

### Idempotency

`tf_sales_input` has a partial unique index on
`(external_source, external_order_id, external_item_id) where external_order_id is not null`.
The sync function uses `.upsert(rows, { onConflict: '...', ignoreDuplicates: true })`
so duplicate webhook/poll retries are safe — first write wins and subsequent
identical rows are skipped. Manual `/sales` entries have all three external_*
columns NULL and are unaffected by the constraint.

### Required env vars

```
# Server-side Supabase (bypass RLS for webhook handlers + cron)
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API>

# Token encryption — 32-byte AES-GCM key, base64 encoded
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# ⚠️ Losing this key makes every stored access_token / refresh_token unrecoverable
MARKETPLACE_ENCRYPTION_KEY=<base64 32 bytes>

# Cron shared secret
CRON_SECRET=<any random string, used in Authorization: Bearer header>

# TikTok Shop Partner Center
TIKTOKSHOP_APP_KEY=
TIKTOKSHOP_APP_SECRET=
TIKTOKSHOP_REDIRECT_URI=https://<domain>/api/marketplace/callback/tiktok-shop

# Shopee Open Platform
SHOPEE_PARTNER_ID=
SHOPEE_PARTNER_KEY=
SHOPEE_REDIRECT_URI=https://<domain>/api/marketplace/callback/shopee
SHOPEE_ENVIRONMENT=test    # 'test' = UAT host, 'live' = production
```

### Running marketplace tests

There's no npm script yet. Invoke Node's built-in test runner directly:

```bash
# All marketplace tests (81 tests, ~100ms)
node --test lib/services/marketplace/**/*.test.js

# A specific file
node --test lib/services/marketplace/tiktok-shop/signer.test.js
```

The signer and webhook tests are the critical ones — they prove the HMAC
formulas match what the platforms expect. Any change to a signer MUST keep
these tests green.

### Adding a new marketplace (e.g., Lazada)

The plumbing is reusable. Steps:

1. New folder `lib/services/marketplace/lazada/` with `signer.js`, `auth.js`,
   `orders.js`, `webhooks.js`, `sync.js` following the Shopee/TikTok Shop
   pattern.
2. Add `'lazada'` to `VALID_CHANNELS` / `SUPPORTED_PROVIDERS` in
   `/api/marketplace/route.js`, `/api/marketplace/connect/[provider]/route.js`,
   and the callback route.
3. Add a Lazada card to `PROVIDER_INFO` in `app/(private)/marketplace/page.js`.
4. Add a `syncLazadaConnection` branch in both cron endpoints
   (`marketplace-sync` and `webhook-events-process`).
5. Add `app/api/webhooks/lazada/route.js`.
6. Write `signer.test.js` and `webhooks.test.js` with known vectors before
   any integration attempt.

Expected effort: 1-2 days per marketplace because `crypto.js`, `http.js`,
`errors.js`, `connections.js` are already reusable.

## Payment

`/checkout` and `/plans` are **feature-flagged off** in middleware. Both
routes redirect to `/dashboard` with `?notice=payment-disabled` unless
`NEXT_PUBLIC_PAYMENT_ENABLED=true`. The flag is off because `/api/payment/*`
endpoints (which the checkout page would call) don't exist yet.

To re-enable: build the Midtrans Snap backend (`create-transaction` + webhook
handler + manual-update), then set the env var to `true`.

## PWA + barcode scanner

- `public/site.webmanifest` — Tokoflow PWA manifest with launcher shortcuts
- `public/sw.js` — service worker, network-first for `/api/*` and navigations, cache-first for static. POST/PATCH/DELETE pass through (no offline mutation queue)
- `app/components/ServiceWorkerRegister.js` — registers the SW in production only
- `app/(private)/scanner/page.js` — uses native `BarcodeDetector` API. Falls back to manual SKU input on Safari/Firefox (those browsers don't ship the Shape Detection API). Looks up SKU via `/api/products/[sku]` and offers Catat Penjualan / Tambah produk baru actions.

## Conventions

### When adding a new API route

1. Use `authenticateRequest(request)` from `lib/utils/auth-helpers.js`
2. Use `successResponse` / `errorResponse` / `handleSupabaseError` from `lib/utils/api-response.js`
3. For owner-gated mutations, use `requireOwner(auth)` from `lib/auth/role.js`
4. Add ETag support via `makeETag` + `maybeNotModified` for read-heavy endpoints
5. Use cursor pagination via `lib/http/paging.js` if the result set can grow
6. Match the existing performance patterns — see `app/api/products/route.js` for the reference style

### When adding a new private page

1. Place under `app/(private)/<route>/page.js`
2. Add the route prefix to **both** the `isPrivateRoute` check and the `matcher` array in `middleware.js`
3. Add a nav entry to `app/components/PrivateNav.js` `rawMenu`
4. If it's owner-only, add the route prefix to `OWNER_ONLY_PREFIXES` and gate inside the page with `useAuth().profile?.role === 'owner'` (and consider an inner `router.replace('/dashboard')` for hard-blocking)

### When adding a new schema element

1. Add it to `db/schema.sql` (the source of truth)
2. Wrap any column add in an idempotent `do $$` block so re-running on existing installs works
3. If it's a new table, add it to: the `enable row level security` list, the operational-tables policy loop in the `do $$` policy block, and the `_touch_updated_at` trigger array (if it has `updated_at`)
4. Apply via the management API curl pattern at the top of this file
5. Verify with an `information_schema.columns` probe
6. Run a smoke test that mirrors the API query path

### Don't

- Don't fake external API integration. If credentials are missing, return 501 with a clear message about which env vars are needed. If a feature requires real credentials to test, say so — don't add mock-mode code paths that pretend to work. The user rejected `MARKETPLACE_MOCK_MODE` for exactly this reason.
- Don't bypass the marketplace signer modules and call fetch directly from a route. Every TikTok Shop or Shopee API call must go through `signTikTokShopRequest` / `buildShopeeShopRequest` → `marketplaceFetch` so retries, backoff, and error classification are consistent. The signer test vectors are the contract.
- Don't store marketplace tokens in plaintext. `tf_marketplace_connections.access_token` / `refresh_token` (plain columns) exist for backward compatibility but new code must use `upsertConnectionWithTokens` / `loadConnectionById` from `connections.js`, which encrypt via AES-256-GCM on write and decrypt on read. Losing `MARKETPLACE_ENCRYPTION_KEY` makes all stored tokens unrecoverable.
- Don't re-add a Tokopedia-specific integration path. The legacy Tokopedia OpenAPI is being terminated; Tokopedia storefronts are now accessible via TikTok Shop Partner Center under `seller_type: "Tokopedia Shop"`. The `/api/marketplace/connect/tokopedia` endpoint returns 410 with an explanation — keep it that way.
- Don't ask merchants to create developer accounts, register marketplace apps, or obtain API keys themselves. Merchants are end users, not engineers. The ISV pattern is: one set of developer credentials for Tokoflow, every merchant OAuths into it. See `memory/feedback_user_no_dev_friction.md`.
- Don't call a user-facing API directly from the webhook or cron routes — they have no Supabase session. Use `createServiceRoleClient()` from `lib/database/supabase-server/index.js` instead. That client bypasses RLS and must only be used in server-only paths that have already authenticated themselves (webhook HMAC signature, cron `CRON_SECRET`).
- Don't re-introduce false marketing claims. The honest "Early Access" positioning is in place across all visible pages; don't promise features that don't exist (multi-warehouse beyond v0.1, payment, etc.)
- Don't bypass the `requireOwner` gates client-side without also gating the API. Both layers are intentional defense in depth.
- Don't remove the dead-code header comment in `app/page_data.js` — it documents which exports are stale and shouldn't be wired up.
- Don't refactor unrelated code while making targeted changes. The pre-existing `authResult` undefined bug in `app/api/products/[param]/route.js` was only fixed in Phase 9 because the new RBAC gate made the buggy line reachable.

## Tech stack snapshot

- **Framework:** Next.js 15 (App Router) + Turbopack
- **Language:** Mixed JS / TS (TS config exists, not strictly enforced)
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + auth)
- **UI:** `lucide-react` icons, `framer-motion`, `sonner` toasts, `@tanstack/react-virtual` for long lists
- **State:** React state + Supabase realtime cookies. No global store.

## Business context

Tokoflow is for Indonesian UMKM (small/medium merchants). The differentiator
is **per-transaction profit calculation** with full cost breakdown
(modal + packing + affiliate + marketplace fee), paired with real marketplace
integration for TikTok Shop and Shopee. Bundle / composition support and
channel-aware fee config are also real and working.

The strategic doc at `docs/strategic-analysis.md` is dated 2026-04-07 and was
written BEFORE the decision to build real marketplace integration in Tokoflow.
It recommends porting Tokoflow features to CatatOrder — **that recommendation
is superseded** as of 2026-04-09 (see `memory/project_tokoflow_marketplace_pivot.md`).
The current direction is: Tokoflow is the active product for marketplace/
inventory/profit work, CatatOrder stays in its lane for order/invoice/
receivables. Read the strategic doc for historical context; don't treat its
action plan as current.

Deployment model: "1 install per merchant, no multi-tenancy" (per the
`first user = auto-owner` auth pattern). For customer #1 (Bu Clarice) this
is fine — she's the only merchant on her install. Multi-tenancy can be
revisited when customer #2 arrives.
