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
| `tf_marketplace_connections` | OAuth state for marketplace integrations (channel, shop_id, tokens, sync timestamps). |
| `kn_membership_plans` | Subscription/credit plans (read by `/plans` and `/checkout`). Legacy `kn_` prefix from sibling project. |
| `kn_transactions` | Payment transaction log. |

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
| `app/(private)/marketplace/` | Marketplace integration management (owner only) — currently scaffolding. |
| `app/(private)/scanner/` | Barcode scanner page using `BarcodeDetector` API. |
| `app/(private)/admin/users/` | Owner-only user management with role promotion/demotion. |
| `app/(private)/inventory/` | Stock list with negative/zero/low/normal/alert filters and per-product threshold display. |
| `lib/database/supabase/` | Browser Supabase client. |
| `lib/database/supabase-server/` | Server Supabase client (reads cookies via `next/headers`). |
| `lib/services/` | Business logic — inventory, sales, composition, incoming-goods. **Sales/incoming processors copy `customer_id` from input → finalized transaction.** |
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

## Marketplace integration (scaffolding)

`/marketplace` page + `tf_marketplace_connections` table + 3 stub endpoints
(`/api/marketplace`, `/api/marketplace/connect/[provider]`, `/api/marketplace/sync/[id]`)
are in place but **do not perform real OAuth or data sync yet**. Each route
file has a TODO comment block with the exact spec for the platform it targets:

- **Shopee Open Platform** — HMAC-SHA256 signed `auth_partner` flow
- **Tokopedia Mitra OAuth** — `/v2/orders` polling
- **TikTok Shop Partner Center** — `/api/orders/search`

Required env vars (all empty by default — see `.env.example`):

```
SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_REDIRECT_URI
TOKOPEDIA_CLIENT_ID, TOKOPEDIA_CLIENT_SECRET, TOKOPEDIA_REDIRECT_URI
TIKTOKSHOP_APP_KEY, TIKTOKSHOP_APP_SECRET, TIKTOKSHOP_REDIRECT_URI
```

When you implement a real OAuth flow, replace the `501` return in
`/api/marketplace/connect/[provider]/route.js` with the redirect URL builder.
The `tf_marketplace_connections` row already gets created as `is_active=false`
on first connect attempt — flip to `is_active=true` when OAuth succeeds.

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

- Don't fake external API integration. If credentials are missing, return 501 with a clear message about which env vars are needed — the marketplace endpoints are the reference pattern.
- Don't re-introduce false marketing claims. The honest "Early Access" positioning is in place across all visible pages; don't promise features that don't exist (multi-warehouse beyond v0.1, real-time marketplace sync, payment, etc.)
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
(modal + packing + affiliate + marketplace fee), not the marketplace
integration itself (which is scaffolded but not yet live). Bundle / composition
support and channel-aware fee config are also real and working.

The strategic doc at `docs/strategic-analysis.md` describes the relationship
to a sibling product (CatatOrder) — read it before suggesting any major
direction change. The TL;DR is "1 install per merchant, no multi-tenancy".
