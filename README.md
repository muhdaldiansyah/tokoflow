# Tokoflow

Inventory dan sales management untuk UMKM Indonesia. Catat penjualan
multi-channel, hitung profit otomatis per transaksi, pantau stok real-time.

**Status:** Early Access — gratis selama program berjalan untuk merchant
pertama yang membentuk produk ini bersama kami.

---

## Apa yang bisa dilakukan hari ini

### Inventory & Produk
- ✅ CRUD produk dengan SKU, nama, stok, threshold low-stock per produk
- ✅ Multi-warehouse — setiap produk milik satu cabang/lokasi
- ✅ Bundle / komposisi produk dengan auto-deduct stok komponen
- ✅ Stok status auto-categorized (negative / zero / low / normal)
- ✅ Stock adjustments dengan audit trail (alasan + catatan)
- ✅ Incoming goods tracking dengan staging→finalize flow

### Penjualan & Profit
- ✅ Input penjualan multi-channel (Shopee, Tokopedia, TikTok Shop, offline, dll)
- ✅ Profit calculator otomatis: revenue − (modal + packing) × qty − affiliate − marketplace fee
- ✅ Per-channel marketplace fee config
- ✅ Sales history dengan filter date / channel / SKU / customer
- ✅ Summary toggle: per channel / per produk / per tanggal, dengan kolom sortable
- ✅ CSV export

### Customer Attribution
- ✅ Customer directory dengan lifetime stats (orders, total spent, total profit)
- ✅ Per-customer detail page dengan riwayat penjualan
- ✅ Customer dropdown di sales input form
- ✅ Customer filter di sales history
- ✅ Top customers card di dashboard

### Dashboard
- ✅ Real-time metrics: revenue, profit, margin, units sold, today's sales
- ✅ Channel breakdown dengan margin per channel
- ✅ Top produk + top customers
- ✅ Stok perlu perhatian (negatif + kosong + low)
- ✅ Pending sales / incoming
- ✅ Recent activity feed

### Stock Alerts
- ✅ Auto-detection berdasarkan per-produk threshold
- ✅ Bell icon notification dengan unread count (polls 60s)
- ✅ Acknowledge per-SKU atau bulk
- ✅ Auto-resolve saat stok kembali normal

### Multi-user
- ✅ RBAC dengan 2 role: **owner** (full access) dan **staff** (operational)
- ✅ User pertama otomatis jadi owner
- ✅ User management page (owner only) untuk promote/demote
- ✅ Last-owner safeguard: tidak bisa demote owner terakhir

### Mobile / PWA
- ✅ PWA installable — buka di browser HP, "Add to Home Screen"
- ✅ Service worker untuk offline shell caching
- ✅ Barcode scanner page dengan kamera HP (`BarcodeDetector` API)

### Marketplace Integration
- ⚠️ **Scaffolding only** — schema, OAuth flow, dan UI sudah siap.
  Real sync ke Shopee / Tokopedia / TikTok Shop butuh credentials platform
  + implementasi OAuth callback. Lihat `app/api/marketplace/connect/[provider]/route.js`
  untuk spec lengkap.

---

## Belum ada (intentionally)

| Feature | Kenapa belum | Effort kalau mau dibangun |
|---|---|---|
| Real marketplace sync | Butuh Shopee partner account + sandbox creds | 3–5 hari per platform |
| Per-warehouse stok per produk (one SKU, multiple locations) | Tier 4 — butuh `tf_product_inventory` pivot table dan rewrite semua inventory queries | 2–3 hari |
| Email/WhatsApp delivery untuk stock alerts | Butuh SMTP/WA provider + cron config. In-app notification sudah jalan | 1 hari |
| Payment / Midtrans | `/checkout` page sudah ada tapi `/api/payment/*` belum dibangun. Feature-flagged off | 1–2 hari |
| Multi-tenancy (multiple merchants share 1 install) | Strategi sekarang "1 install per merchant" | 1–3 hari standalone |
| Mobile app native + Play Store | PWA approach memberikan 80% value tanpa overhead | — |
| AI insights / forecasting | Out of scope untuk v0.1 | — |

---

## Setup

### Prerequisites

- Node.js 18+ (lihat `.nvmrc`)
- Supabase project (free tier cukup)

### Install

```bash
git clone <repo>
cd tokoflow
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Tokoflow
NEXT_PUBLIC_APP_DESCRIPTION=Inventory and Sales Management System
```

### Apply database schema

The full schema is in `db/schema.sql`, the seed data in `db/seed.sql`. Both
are idempotent.

```bash
SUPABASE_PROJECT=<your-project-ref>
SUPABASE_TOKEN=<your-management-api-token>     # from supabase.com/dashboard

# Apply schema
node -e "process.stdout.write(JSON.stringify({query:require('fs').readFileSync('db/schema.sql','utf8')}))" \
  | curl -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT/database/query" \
      -H "Authorization: Bearer $SUPABASE_TOKEN" \
      -H "Content-Type: application/json" \
      --data-binary @-

# Apply seed (default channels + early-access plan + default warehouse)
node -e "process.stdout.write(JSON.stringify({query:require('fs').readFileSync('db/seed.sql','utf8')}))" \
  | curl -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT/database/query" \
      -H "Authorization: Bearer $SUPABASE_TOKEN" \
      -H "Content-Type: application/json" \
      --data-binary @-
```

### Run

```bash
npm run dev          # http://localhost:3000
```

Open `/register`, sign up. **Your first signup auto-becomes owner.** Subsequent
signups default to staff and need an owner to promote them via `/admin/users`.

### Production build

```bash
npm run build
npm run start
```

Or deploy to Vercel — `vercel.json` is configured.

---

## Project structure

```
.
├── app/
│   ├── (private)/                # Authenticated pages
│   │   ├── dashboard/             # Real metrics + channel/product/customer rankings
│   │   ├── products/              # Product CRUD with cost editing (owner)
│   │   ├── sales/                 # Sales input form + pending list
│   │   ├── sales-history/         # Filterable transaction list + summary toggle
│   │   ├── customers/             # Customer directory + per-customer detail
│   │   ├── inventory/             # Stock list with status filters + threshold
│   │   ├── incoming-goods/        # Stock receipt staging
│   │   ├── stock-adjustments/     # Manual corrections with audit trail
│   │   ├── product-compositions/  # Bundle definitions
│   │   ├── marketplace-fees/      # Per-channel fee config (owner)
│   │   ├── product-costs/         # Per-SKU cost config (owner)
│   │   ├── warehouses/            # Warehouse management (owner)
│   │   ├── marketplace/           # Marketplace integration scaffolding (owner)
│   │   ├── scanner/               # Barcode scanner using BarcodeDetector API
│   │   └── admin/users/           # User management with role promotion (owner)
│   ├── (public)/                  # Marketing + auth pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── tentang/
│   │   ├── layanan/
│   │   ├── investasi/
│   │   └── panduan/
│   ├── api/                       # API routes
│   │   ├── alerts/                # Stock alert feed + acknowledge
│   │   ├── customers/             # Customer CRUD + lifetime stats
│   │   ├── dashboard/             # Summary + analytics
│   │   ├── inventory/             # Stock + adjustments + movements
│   │   ├── marketplace/           # Connection mgmt (scaffolding)
│   │   ├── marketplace-fees/      # Fee CRUD (owner-gated mutations)
│   │   ├── product-compositions/  # Bundle CRUD
│   │   ├── product-costs/         # Cost CRUD (owner-gated)
│   │   ├── products/              # Product CRUD with view-based GET
│   │   ├── sales/                 # Sales input + transactions + summary + export
│   │   ├── incoming-goods/        # Receipt CRUD
│   │   ├── process/               # Batch processors (sales, incoming-goods)
│   │   ├── users/                 # User mgmt API (owner-only)
│   │   └── warehouses/            # Warehouse CRUD (owner-gated mutations)
│   └── components/                # Shared UI (PrivateNav, Footer, etc.)
├── lib/
│   ├── auth/role.js               # requireOwner / getCurrentRole gates
│   ├── cache/                     # LRU output cache
│   ├── database/                  # Supabase clients (server + browser)
│   ├── http/                      # ETag, paging, cursor, server-timing
│   ├── services/                  # Business logic (sales, inventory, etc.)
│   ├── state/                     # Global state tags for cache invalidation
│   └── utils/                     # api-response, auth-helpers, format
├── db/
│   ├── schema.sql                 # Single source of truth — idempotent
│   └── seed.sql                   # Default marketplace channels + plan + warehouse
├── public/
│   ├── site.webmanifest           # PWA manifest
│   ├── sw.js                      # Service worker
│   └── images/
├── docs/
│   ├── feature-audit.md           # Feature inventory
│   └── strategic-analysis.md      # Product strategy + CatatOrder relationship
├── middleware.js                  # Auth gate + payment feature flag
├── CLAUDE.md                      # AI agent guidance (read this first if using Claude Code)
└── README.md                      # You are here
```

---

## Environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | — | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | ✅ | — | Base URL for OG tags + email links |
| `NEXT_PUBLIC_APP_NAME` | — | `TokoFlow` | App title |
| `NEXT_PUBLIC_APP_DESCRIPTION` | — | — | Meta description |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | — | — | Google Analytics |
| `NEXT_PUBLIC_PAYMENT_ENABLED` | — | `false` | Set to `true` to un-feature-flag `/checkout` and `/plans` (only after the Midtrans backend is built) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | — | — | Midtrans Snap client key (when enabled) |
| `SHOPEE_PARTNER_ID` | — | — | Shopee Open Platform partner ID |
| `SHOPEE_PARTNER_KEY` | — | — | Shopee partner key (HMAC signing) |
| `SHOPEE_REDIRECT_URI` | — | — | Shopee OAuth callback URL |
| `TOKOPEDIA_CLIENT_ID` | — | — | Tokopedia Mitra client ID |
| `TOKOPEDIA_CLIENT_SECRET` | — | — | Tokopedia client secret |
| `TOKOPEDIA_REDIRECT_URI` | — | — | Tokopedia OAuth callback URL |
| `TIKTOKSHOP_APP_KEY` | — | — | TikTok Shop app key |
| `TIKTOKSHOP_APP_SECRET` | — | — | TikTok Shop app secret |
| `TIKTOKSHOP_REDIRECT_URI` | — | — | TikTok Shop OAuth callback URL |

---

## RBAC quick reference

| Action | Staff | Owner |
|---|---|---|
| Login + use dashboard | ✅ | ✅ |
| View / search / create products | ✅ | ✅ |
| Edit product cost fields | ❌ 403 | ✅ |
| Delete products | ❌ 403 | ✅ |
| View marketplace fees | ✅ (read) | ✅ |
| Edit marketplace fees | ❌ 403 | ✅ |
| Input sales / process sales | ✅ | ✅ |
| Create / edit customers | ✅ | ✅ |
| Delete customers | ❌ 403 | ✅ |
| Add incoming goods / stock adjustments | ✅ | ✅ |
| Manage warehouses | ❌ | ✅ |
| Connect marketplace | ❌ | ✅ |
| Manage users / change roles | ❌ | ✅ |

The first user to register at `/register` is auto-promoted to **owner**.
Every subsequent signup defaults to **staff**. The owner can promote staff
via `/admin/users`.

---

## Tech stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** Mixed JavaScript + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + auth + storage)
- **UI:** lucide-react, framer-motion, sonner
- **PWA:** native service worker + manifest
- **Barcode:** native `BarcodeDetector` API (Chrome/Edge/Samsung Internet)

---

## Development

### Adding a new feature

1. Read `CLAUDE.md` first — it documents the conventions
2. Schema changes go in `db/schema.sql` (always idempotent)
3. New API routes use `authenticateRequest` + `successResponse`/`errorResponse`
4. Owner-only mutations gate via `requireOwner(auth)` from `lib/auth/role.js`
5. New private pages need entries in **both** `middleware.js` and `app/components/PrivateNav.js`

### Running tests

There are currently no automated tests. The validation strategy is:

1. `node --check <file>` for route files (real parser)
2. End-to-end SQL probe via the Supabase Management API after schema changes
3. Manual smoke test in `npm run dev`

### Deployment

Push to a Vercel-connected branch. `vercel.json` sets `maxDuration: 30` for
all API routes, and the build runs `prebuild.js` to clean caches.

Make sure all required env vars from the table above are set in the Vercel
dashboard before deploying.

---

## Roadmap

| Tier | Item | Status |
|---|---|---|
| 0 | Database rebuild from code | ✅ |
| 0 | Honest marketing copy | ✅ |
| 1 | Dashboard wired to real data | ✅ |
| 1 | Stock alert visibility | ✅ |
| 1 | Per-product profit drill-down | ✅ |
| 1 | Customer filter in sales history | ✅ |
| 2 | Customer directory + attribution | ✅ |
| 2 | Customer detail page | ✅ |
| 2 | Top customers on dashboard | ✅ |
| 2 | Basic RBAC (owner / staff) | ✅ |
| 2 | User management UI | ✅ |
| 2 | Stock alert in-app notifications | ✅ |
| 3 | Multi-warehouse (single warehouse per product) | ✅ |
| 3 | Marketplace API connection scaffolding | ✅ |
| 3 | PWA + barcode scanner | ✅ |
| 3 | Real Shopee OAuth implementation | ⏳ needs partner creds |
| 3 | Email/WhatsApp alert delivery | ⏳ needs SMTP/WA provider |
| 3 | Midtrans payment backend | ⏳ feature-flagged off |
| 4 | Per-warehouse stock per product (`tf_product_inventory` pivot) | ⏳ |
| 4 | Multi-tenancy (multiple merchants per install) | ⏳ |
| 4 | iOS Safari barcode polyfill | ⏳ |

---

## Support

- **Bug reports / feature requests:** WhatsApp the dev team (link in app footer)
- **Documentation:** `CLAUDE.md` for technical conventions, `docs/strategic-analysis.md` for product strategy
- **Database schema:** `db/schema.sql` is the single source of truth
