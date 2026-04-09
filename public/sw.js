// public/sw.js
//
// Tokoflow service worker — minimal offline shell.
//
// Strategy:
//   - API requests (/api/*)            → network-first, cache as fallback
//   - Navigations (HTML)               → network-first, cache as fallback
//   - Static assets (/_next/static/*)  → cache-first (immutable)
//   - Images / icons                   → stale-while-revalidate
//
// This isn't a full offline-first implementation (that needs a sync queue,
// IndexedDB for mutations, conflict resolution — see lib/services/offline-queue.js
// in CatatOrder for the reference design). It IS enough to keep the app
// usable on a flaky mobile connection: previously-loaded pages render
// instantly, and stale data is shown if the network drops mid-fetch.

const CACHE_VERSION = 'tokoflow-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const PRECACHE = [
  '/dashboard',
  '/inventory',
  '/sales',
  '/scanner',
  '/site.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {/* don't block install */}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GETs — POST/PATCH/DELETE need to fail loudly when offline
  // so the user knows their action didn't go through.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // API: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Navigation requests: network-first with cached fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    /\.(png|jpg|jpeg|svg|webp|woff2?|ttf|css|js)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}
