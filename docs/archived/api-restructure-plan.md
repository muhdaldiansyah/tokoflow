# API Restructure Plan — CatatOrder

## Tujuan

Pindahkan SEMUA direct Supabase calls dari service layer ke API routes, supaya:
- Web app dan mobile app pakai backend yang sama
- Business logic terpusat di server, bukan di browser
- Service files jadi thin API client (`fetch("/api/...")`)

```
SEBELUM:
  Web Component → service.ts → Supabase (langsung dari browser)
  Mobile        → ??? (tidak bisa pakai service.ts)

SESUDAH:
  Web Component → service.ts → fetch("/api/...") → Supabase (server)
  Mobile App    → fetch("/api/...") → Supabase (server)
```

---

## Status: 13 Service Files

| # | Service File | Functions | Direct Supabase? | API Route Exists? | Priority | Status |
|---|-------------|-----------|------------------|-------------------|----------|--------|
| 0 | **Auth helper** | 1 | — | `lib/supabase/api.ts` | — | **DONE** |
| 1 | **product.service.ts** | 9 | ~~Ya, 100%~~ | 5 route files | HIGH | **DONE** |
| 2 | **order.service.ts** | 19 | ~~Ya, ~90%~~ | 14 route files (4 enhanced + 10 new) | HIGH | **DONE** |
| 3 | **customer.service.ts** | 6 | ~~Ya, 100%~~ | 3 route files (2 enhanced + 1 new) | HIGH | **DONE** |
| 4 | **recap.service.ts** | 3 | ~~Ya, 100%~~ | 3 route files (1 enhanced + 2 new) | MEDIUM | **DONE** |
| 5 | **report.service.ts** | 2 | ~~Ya, 100%~~ | 2 route files (new) | MEDIUM | **DONE** |
| 6 | **production.service.ts** | 2 | ~~Ya, 100%~~ | 2 route files (new) | MEDIUM | **DONE** |
| 7 | **reminder.service.ts** | 5 | ~~Ya, 100%~~ | 5 route files (new) | MEDIUM | **DONE** |
| 8 | **receipt.service.ts** | 18 | ~~Ya, 100%~~ | 3 route files (2 new + 1 enhanced) | MEDIUM | **DONE** |
| 9 | **referral.service.ts** | 2 | ~~Ya, 100%~~ | 2 route files (new) | LOW | **DONE** |
| 10 | **visitor.service.ts** | 1 | ~~Ya, 100%~~ | 1 route file (new) | LOW | **DONE** |
| 11 | **invoice.service.ts** | 13 | ~~Ya, 100%~~ | 11 route files (new) | LOW | **DONE** |
| 12 | **piutang.service.ts** | 3 | ~~Ya, 100%~~ | 3 route files (new) | LOW | **DONE** |
| 13 | **analyze.service.ts** | 2 | TIDAK (sudah fetch) | Ya, sudah benar | — | **DONE** |

**Progress: 85/85 functions migrated — 100% COMPLETE**

---

## Phase 1 — DONE (2026-03-16)

### Step 0: Auth Helper — DONE

**File:** `lib/supabase/api.ts`

```typescript
getAuthenticatedClient(req: NextRequest) → { supabase, user }
```

- Cek `Authorization: Bearer <token>` header dulu (mobile)
- Kalau tidak ada, fallback ke `createClient()` cookies (web)
- Bearer path pakai `@supabase/supabase-js` `createClient` dengan token di global headers
- Cookie path pakai existing `@supabase/ssr` `createServerClient`
- Return type: `{ supabase: SupabaseClient, user: User | null }`
- Semua route Phase 1 sudah pakai helper ini

---

### Part 1: product.service.ts — DONE

**API Routes (5 files baru):**

| Route File | Method | Function | Notes |
|-----------|--------|----------|-------|
| `app/api/products/route.ts` | GET | `getProducts()` | Sort by sort_order, filter deleted_at |
| `app/api/products/route.ts` | POST | `createProduct()` | Auto sort_order (max+1), optional fields via spread |
| `app/api/products/[id]/route.ts` | GET | `getProduct()` | Single by id + user_id |
| `app/api/products/[id]/route.ts` | PUT | `updateProduct()` | All UpdateProductInput fields |
| `app/api/products/[id]/route.ts` | DELETE | `deleteProduct()` | Soft delete (set deleted_at) |
| `app/api/products/categories/route.ts` | GET | `getCategories()` | DISTINCT + dedupe in JS |
| `app/api/products/sales/route.ts` | GET | `getProductSales()` | Aggregate from orders.items |
| `app/api/products/[id]/stock/route.ts` | PATCH | `decrementStock()` | Atomic: read → decrement → auto-disable if 0 |

**Service refactor:** 0 Supabase imports. All 9 functions → `fetch("/api/...")`.
`toggleAvailability()` tetap wrapper yang call `updateProduct()` via fetch — tidak perlu endpoint sendiri.

---

### Part 2: order.service.ts — DONE

**Enhanced routes (4 files):**

| Route File | Changes |
|-----------|---------|
| `GET /api/orders` | +15 filter params: paymentStatus, customerId, activeOnly, historyOnly, preorderOnly, dineInOnly, langgananOnly, dateFrom, dateTo, dateField, offset. Range-based pagination |
| `POST /api/orders` | +delivery_date, is_preorder, is_dine_in, is_langganan, table_number, image_urls. Phone normalization |
| `PUT /api/orders/[id]` | +Customer upsert on phone change, old/new customer stats, delivery_date, is_preorder, is_dine_in, is_langganan, table_number, image_urls, proof_url |
| `PATCH /api/orders/[id]/status` | Switched to auth helper (was createClient) |

**New routes (10 files):**

| Route File | Method | Function |
|-----------|--------|----------|
| `app/api/orders/counts/route.ts` | GET | `getOrderCountsByMonth(year, month)` |
| `app/api/orders/delivery-counts/route.ts` | GET | `getDeliveryCountsByMonth(year, month)` |
| `app/api/orders/suggestions/route.ts` | GET | `getItemSuggestions()` — returns ALL items (products + orders + receipts) |
| `app/api/orders/frequent-items/route.ts` | GET | `getFrequentItems()` — top 12 available products |
| `app/api/orders/summary/route.ts` | GET | `getTodaySummary()` — parallel queries: created today + delivery today + unpaid count |
| `app/api/orders/piutang/route.ts` | GET | `getPiutangSummary()` — aggregate by customer |
| `app/api/orders/[id]/payment/route.ts` | POST | `recordPayment(amount)` — increment paid_amount, derive status, update customer stats |
| `app/api/orders/bulk/paid/route.ts` | POST | `bulkMarkPaid(ids)` — mark multiple paid + customer stats |
| `app/api/orders/bulk/status/route.ts` | POST | `bulkUpdateStatus(ids, status)` — batch status update |
| `app/api/orders/check-limit/route.ts` | GET | `checkOrderLimit()` — RPC check_order_limit |
| `app/api/orders/by-customer/route.ts` | GET | `getRecentOrdersByCustomer(name, limit)` |

**Service refactor:** 18/19 functions → `fetch("/api/...")`.

Exceptions & decisions:
- **`uploadPaymentProof`** — tetap client-side Supabase Storage (file upload butuh browser). URL disimpan via `PUT /api/orders/[id]` (proof_url field)
- **`getItemSuggestions`** — API return semua items, client cache di memory + filter lokal per keystroke (fast autocomplete UX). `clearItemSuggestionsCache()` tetap ada
- **Reminder scheduling** — tetap di service layer sebagai side-effect setelah API call. `scheduleOrderReminders()` dan `cancelOrderReminders()` di-call setelah `createOrder`, `updateOrder`, `recordPayment`, `deleteOrder`, `bulkMarkPaid`. Akan dipindah ke server di Phase 2 (reminder.service migration)
- **`calculateTotals`** — tetap ada di service (unused saat ini, kept for reference). API routes punya logic sendiri inline

---

### Part 3: customer.service.ts — DONE

**Enhanced routes (2 files):**

| Route File | Changes |
|-----------|---------|
| `POST /api/customers` | +Phone normalization via `normalizePhone()`, +npwp field |
| `GET/PUT /api/customers/[id]` | +DELETE handler, +phone normalization di PUT, +npwp field |

**New routes (1 file):**

| Route File | Method | Function |
|-----------|--------|----------|
| `app/api/customers/find-or-create/route.ts` | POST | `findOrCreateByPhone(phone, name)` — uses `.maybeSingle()` |

**Service refactor:** 0 Supabase imports. All 6 functions → `fetch("/api/...")`.
Phone normalization sekarang di server (API route), bukan di service.

---

## Phase 1 File Inventory

### New files created (19):
```
lib/supabase/api.ts                              # Auth helper

app/api/products/route.ts                         # GET + POST
app/api/products/[id]/route.ts                    # GET + PUT + DELETE
app/api/products/categories/route.ts              # GET
app/api/products/sales/route.ts                   # GET
app/api/products/[id]/stock/route.ts              # PATCH

app/api/orders/counts/route.ts                    # GET
app/api/orders/delivery-counts/route.ts           # GET
app/api/orders/suggestions/route.ts               # GET
app/api/orders/frequent-items/route.ts            # GET
app/api/orders/summary/route.ts                   # GET
app/api/orders/piutang/route.ts                   # GET
app/api/orders/[id]/payment/route.ts              # POST
app/api/orders/bulk/paid/route.ts                 # POST
app/api/orders/bulk/status/route.ts               # POST
app/api/orders/check-limit/route.ts               # GET
app/api/orders/by-customer/route.ts               # GET

app/api/customers/find-or-create/route.ts         # POST
```

### Enhanced files (4):
```
app/api/orders/route.ts                           # +full filters, +all order fields
app/api/orders/[id]/route.ts                      # +customer upsert, +stats, +all fields
app/api/orders/[id]/status/route.ts               # +auth helper
app/api/customers/route.ts                        # +phone normalization, +npwp
app/api/customers/[id]/route.ts                   # +DELETE, +phone normalization, +npwp
```

### Refactored services (3):
```
features/products/services/product.service.ts     # 0 Supabase imports → all fetch
features/orders/services/order.service.ts         # 1 Supabase import (uploadPaymentProof only) → rest fetch
features/customers/services/customer.service.ts   # 0 Supabase imports → all fetch
```

### TypeScript: 0 errors

---

## Phase 2 — DONE (2026-03-16)

### Part 4: recap.service.ts — DONE
- `GET /api/recap` enhanced: full DailyRecap + profile quota (replaced simplified version)
- `GET /api/recap/export` new: daily export rows
- Service: 0 Supabase imports, `getRecapData()` + `getDailyRecap()` both call same endpoint

### Part 5: report.service.ts — DONE
- `GET /api/recap/monthly` new: full MonthlyReport (314 lines — piutang aging, customer ranking, daily breakdown)
- `GET /api/recap/monthly/export` new: monthly export rows
- Service: 0 Supabase imports

### Part 6: production.service.ts — DONE
- `GET /api/production` new: production list by delivery date
- `GET /api/production/export` new: Excel export data
- Service: 0 Supabase imports

### Part 7: reminder.service.ts — DONE
- 5 new routes: `/api/reminders/schedule-order`, `/cancel-order`, `/pending`, `/[id]/sent`, `/[id]/cancel`
- Service: 0 Supabase imports. order.service side-effects now route through API internally

### Part 8: receipt.service.ts — DONE
- `GET/PUT /api/profile` new: profile CRUD with lazy counter reset + auto-slug + all toggles
- `PUT /api/profile/slug` new: slug update with uniqueness
- `GET /api/receipts/unpaid` new
- Service: 0 Supabase imports. 19 functions → all fetch. Profile functions kept in same file (11+ import paths)

### Phase 2 File Inventory
- **14 new** route files + **1 enhanced** + **5 services** refactored
- **TypeScript: 0 errors**

---

## Phase 3 — DONE (2026-03-16)

### Part 9: referral.service.ts — DONE
- `GET /api/referral/stats` — referral code, balances, referred/active counts (parallel queries)
- `GET /api/referral/users` — referred user list with payment totals
- Service: 0 Supabase imports

### Part 10: visitor.service.ts — DONE
- `GET /api/analytics/visitors` — full visitor stats with period/monthly support, trend, referrers, peak hour, top products
- Service: 0 Supabase imports

### Part 11: invoice.service.ts — DONE
- 11 new routes: `/api/invoices` (GET+POST), `/[id]` (GET+PUT+DELETE), `/[id]/status` (PATCH), `/[id]/payment` (POST), `/by-order/[orderId]` (GET), `/from-order` (POST), `/export` (POST), `/quota` (GET), `/exportable` (GET), `/ppn-summary` (GET)
- Service: 0 Supabase imports. 13 functions → all fetch

### Part 12: piutang.service.ts — DONE
- `GET /api/piutang` — summary (outstanding, overdue count)
- `GET /api/piutang/by-customer` — per-customer aging breakdown
- `GET /api/piutang/overdue` — overdue invoice list
- Service: 0 Supabase imports

### Phase 3 File Inventory
- **17 new** route files + **4 services** refactored
- **TypeScript: 0 errors**

---

## Ringkasan Effort

| Part | Service | Endpoints | Refactor | Effort | Status |
|------|---------|-----------|----------|--------|--------|
| 0 | auth helper | 1 | all routes | — | **DONE** |
| 1 | product | 5 routes | 9 fungsi | — | **DONE** |
| 2 | order | 14 routes | 19 fungsi | — | **DONE** |
| 3 | customer | 3 routes | 6 fungsi | — | **DONE** |
| 4 | recap | 3 routes | 3 fungsi | — | **DONE** |
| 5 | report | 2 routes | 2 fungsi | — | **DONE** |
| 6 | production | 2 routes | 2 fungsi | — | **DONE** |
| 7 | reminder | 5 routes | 5 fungsi | — | **DONE** |
| 8 | receipt + profile | 4 routes | 18 fungsi | — | **DONE** |
| 9 | referral | 2 routes | 2 fungsi | — | **DONE** |
| 10 | visitor | 1 route | 1 fungsi | — | **DONE** |
| 11 | invoice | 11 routes | 13 fungsi | — | **DONE** |
| 12 | piutang | 3 routes | 3 fungsi | — | **DONE** |
| 13 | analyze | 0 | 0 | — | **DONE** |

---

## Urutan Eksekusi

```
Phase 1 — AUTH + HIGH PRIORITY ✅ DONE (2026-03-16)
  0. Auth helper (dual cookie + token)               ✅
  1. product.service.ts (9 fungsi, 5 route files)     ✅
  2. order.service.ts (19 fungsi, 14 route files)     ✅
  3. customer.service.ts (6 fungsi, 3 route files)    ✅

Phase 2 — MEDIUM PRIORITY ✅ DONE (2026-03-16)
  4. recap.service.ts (3 fungsi, 3 route files)      ✅
  5. report.service.ts (2 fungsi, 2 route files)      ✅
  6. production.service.ts (2 fungsi, 2 route files)   ✅
  7. reminder.service.ts (5 fungsi, 5 route files)     ✅
  8. receipt.service.ts (18 fungsi, 4 route files)     ✅

Phase 3 — LOW PRIORITY ✅ DONE (2026-03-16)
  9. referral.service.ts (2 fungsi, 2 route files)     ✅
  10. visitor.service.ts (1 fungsi, 1 route file)       ✅
  11. invoice.service.ts (13 fungsi, 11 route files)    ✅
  12. piutang.service.ts (3 fungsi, 3 route files)      ✅
```

---

## Aturan Migration Per Service

Untuk SETIAP service file, langkah yang sama:

1. **Buat/perkuat API route** — pindahkan Supabase query ke `app/api/[resource]/route.ts`, pakai `getAuthenticatedClient()` dari `lib/supabase/api.ts`
2. **Refactor service** — ganti `supabase.from(...)` dengan `fetch("/api/...")`
3. **Test web** — pastikan web app masih jalan
4. **Test API langsung** — curl/Postman untuk verify mobile bisa pakai
5. **Commit per service** — 1 commit per service, jangan campur
