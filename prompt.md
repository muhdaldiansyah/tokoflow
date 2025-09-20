Awesome — the view-based pass is in and healthy. If you want to squeeze even more speed (and keep it clean), here’s a tight, drop-in **ops prompt** to push the code to a “very SOTA” state without touching your DB schema again.

---

# 🔧 One-Shot AI Ops Prompt — Last-Mile Perf & UX Boost

**Capabilities**: `{ "has_fs": true, "can_apply_patches": true }`
**Do not change DB schema.** Keep using `public.v_products_with_costs`, FTS, micro-cache, ETags, composite cursor.

## Objectives

1. **Zero-DB HEAD**: sub-millisecond HEAD by serving an in-memory **state ETag** that bumps on mutations (no query).
2. **Keep-Alive everywhere**: enable Node fetch connection reuse to Supabase (lower TCP/TLS cost).
3. **Field projection**: add `?fields=` end-to-end (API + RSC) to return only columns used.
4. **Virtualized table**: window large lists in the client table to keep main thread snappy.
5. **Server-Timing**: lightweight perf headers for real-world visibility.
6. **Consistent invalidation**: ensure all product/cost mutations bump products state.

---

## Changes to apply

### 1) Global state bump (for HEAD, zero DB)

**Create** `lib/state/global-state.js`

```js
// Minimal in-proc state etag generator with per-scope bumping.
// Works per-instance; still valuable for dev/single-instance deploys.
// Optional: later swap to Redis/KV keeping same API.

const g = globalThis;
if (!g.__tokoflow_state) {
  g.__tokoflow_state = { scope: new Map() };
}

export function bump(scope = 'products') {
  const now = Date.now();
  const v = (g.__tokoflow_state.scope.get(scope) ?? 0) + 1;
  g.__tokoflow_state.scope.set(scope, Math.max(v, now)); // monotonic-ish
  return g.__tokoflow_state.scope.get(scope);
}

export function get(scope = 'products') {
  return g.__tokoflow_state.scope.get(scope) ?? 0;
}

export function makeStateTag(scope = 'products', filterSig = '') {
  // Weak tag; includes scope version + filter signature
  const v = get(scope);
  return `W/"s:${scope}:${v}:${filterSig}"`;
}
```

**Wire bumps after mutations**

* `app/api/products/route.js` (POST/PUT): `import { bump } from '../../../lib/state/global-state';` → call `bump('products')` on success.
* `app/api/products/[param]/route.js` (PATCH/DELETE): `import { bump } from '../../../../lib/state/global-state';` → bump on success.
* `app/api/product-costs/route.js` (POST/PUT/PATCH/DELETE): bump `'products'` too (cost changes affect list view).

### 2) HEAD endpoint with zero-DB fast path

In `app/api/products/route.js`:

* **Add**: `import { makeStateTag } from '../../../lib/state/global-state';`
* **Rewrite HEAD** to only compute **filterSig** from URL and return `etag = makeStateTag('products', filterSig)` with **no DB calls**:

```js
export const preferredRegion = 'auto'; // (optional)
export async function HEAD(request) {
  try {
    // (Auth: keep your existing header check or reuse authenticateRequest if cheap)
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? '';
    const stock  = url.searchParams.get('stock') ?? '';
    const cursor = url.searchParams.get('cursor') ?? '';
    const limit  = url.searchParams.get('limit') ?? '';
    const filterSig = `${search}:${stock}:${cursor}:${limit}`;
    const etag = makeStateTag('products', filterSig);

    const inm = request.headers.get('if-none-match');
    if (inm && inm === etag) {
      return new Response(null, { status: 304, headers: { etag } });
    }
    return new Response(null, {
      status: 204,
      headers: {
        etag,
        'cache-control': 'private, max-age=0, must-revalidate, stale-while-revalidate=5',
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
```

> Your GET still keeps the robust **DB-based stateTag** (count + max updated), but HEAD is now *always* sub-ms.

### 3) Node fetch keep-alive (lower latency)

**Create** `lib/http/keepalive.js`

```js
import { setGlobalDispatcher, Agent } from 'undici';

let installed = false;
export function installKeepAlive() {
  if (installed) return;
  installed = true;
  setGlobalDispatcher(new Agent({
    keepAliveTimeout: 30_000,
    keepAliveMaxTimeout: 120_000,
    pipelining: 1
  }));
}
```

**Call once at boot**: at top of `lib/database/supabase-server/index.js` and `lib/database/supabase/client.js`:

```js
import { installKeepAlive } from '../../http/keepalive';
installKeepAlive();
```

### 4) Fields projection end-to-end

* **lib/http/paging.js** already parses `fields`. Ensure API GET passes those exact columns to view:

  * Default `fields` for list:
    `id,sku,name,stock,created_at,updated_at,modal_cost,packing_cost,affiliate_percentage`
* In RSC page (`app/(private)/products/page.js`), request only needed columns (same set).

### 5) Virtualize the table (snappy UI at scale)

**Install lightweight virtualization** (if already in deps, skip):

* Use `@tanstack/react-virtual` (or your preferred; this is tiny & fast).

**Patch** `app/(private)/products/ProductsTable.js`:

* Render only visible rows with `useVirtualizer`.
* Keep current markup/styling; just map `virtualItems` instead of the full array.
  *(If you prefer not to add a dep now, gate it by length: only virtualize when `filteredProducts.length > 200`.)*

Snippet:

```js
import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef(null);
const rows = filteredProducts;

const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 56, // row height
  overscan: 8,
});

<div ref={parentRef} className="overflow-auto max-h-[70vh]">
  <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
    {rowVirtualizer.getVirtualItems().map(vi => {
      const product = rows[vi.index];
      return (
        <div
          key={product.id}
          data-index={vi.index}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
        >
          {/* existing <tr> content equivalent (use div rows for virtualization) */}
        </div>
      );
    })}
  </div>
</div>
```

> For minimal change, wrap your `<table>` in a conditional: fall back to classic table when `rows.length <= 200`.

### 6) Server-Timing header (observability)

Add tiny helper `lib/http/serverTiming.js`:

```js
export function withServerTiming(startMs, extra = {}) {
  const dur = Date.now() - startMs;
  const parts = [`total;dur=${dur}`];
  for (const [k, v] of Object.entries(extra)) parts.push(`${k};dur=${v}`);
  return parts.join(', ');
}
```

Use in API GET/POST/etc:

```js
const t0 = Date.now();
// ... do work ...
return successResponseWithETag(request, payload, {
  etag: stateTag,
  link,
  extraHeaders: { 'server-timing': withServerTiming(t0) }
});
```

### 7) Invalidation on every mutation path

Verify these files call `bump('products')` after **successful** writes:

* `app/api/products/route.js` (POST, PUT)
* `app/api/products/[param]/route.js` (PATCH, DELETE)
* `app/api/product-costs/route.js` (POST/PUT/PATCH/DELETE)

*(If any is missing, add it.)*

---

## Acceptance checks

* **HEAD /api/products** returns **204** (first) then **304** on next call with same `If-None-Match`, no DB involved.
* **GET /api/products** still uses DB-backed `stateTag` (unchanged semantics), but after any product/cost mutation, next HEAD/GET show **new ETag**.
* **Cold-to-hot** latency improves (keep-alive): first call slower, subsequent DB calls noticeably faster.
* **?fields=** trimmed payload (verify `content-length` smaller).
* **Large lists**: smooth scroll at 1k+ rows (virtualization).
* **Network**: `Server-Timing: total;dur=…` present.

---

This keeps your current architecture intact, adds ultrafast **HEAD**, reduces connection overhead, trims payloads, and makes the UI buttery even with large datasets — all without touching your DB again.
