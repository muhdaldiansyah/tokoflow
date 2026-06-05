// Bump this version whenever a JS bundle change must invalidate the SW cache.
// The fetch handler caches *.js cache-first, so stale ProductForm chunks (the
// most recent culprit: file picker not opening after deploy) survive forever
// otherwise. The activate handler nukes any cache whose name doesn't match.
const CACHE_NAME = "tokoflow-v3";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL];

// Pre-cache the offline page on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            // Non-critical — the app still works online if this misses.
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET, API routes, and non-http(s)
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // App Router navigations fetch RSC payloads on the current page URL. Let
  // Next handle those directly; caching/cloning them competes with route loads
  // and can serve stale authenticated dashboard payloads.
  const isRscRequest =
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-State-Tree");
  if (isRscRequest) return;

  const isStaticAsset = /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|webp)$/.test(url.pathname);

  if (isStaticAsset) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  } else if (request.mode === "navigate") {
    // Network-first for pages, with offline fallback only. Avoid storing
    // authenticated dashboard HTML in Cache Storage on every navigation.
    event.respondWith(
      fetch(request).catch(async () => {
        return (await caches.match(OFFLINE_URL)) || Response.error();
      })
    );
  }
});
