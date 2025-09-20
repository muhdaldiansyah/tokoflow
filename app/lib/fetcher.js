// app/lib/fetcher.js
const inflight = new Map();
const bodyCache = new Map(); // key -> { etag, json }

export async function apiFetch(path, { method = 'GET', body, signal, retry = 1, timeoutMs = 10000 } = {}) {
  const key = `${method}:${path}:${body ? JSON.stringify(body) : ''}`;
  if (inflight.has(key)) return inflight.get(key);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(new DOMException('Timeout', 'AbortError')), timeoutMs);

  async function run() {
    const res = await fetch(path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal || controller.signal,
      credentials: 'same-origin',
      cache: 'no-store' // let server-side ETag decide 304
    });
    if (res.status === 401) {
      location.href = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
      throw new Error('Unauthorized');
    }
    if (!res.ok && retry > 0) {
      await new Promise(r => setTimeout(r, 300));
      return run(method, path, { body, signal, retry: retry - 1, timeoutMs });
    }
    return res;
  }

  const p = run().finally(() => { clearTimeout(t); inflight.delete(key); });
  inflight.set(key, p);
  return p;
}

export async function apiJSON(path, opts) {
  const res = await apiFetch(path, opts);
  return res.status === 204 ? null : res.json();
}

/**
 * HEAD-first fetcher with ETag-aware caching
 * Optimized for GET requests that support HEAD validation
 */
export async function fetchJSON(url, opts = {}) {
  const key = url + JSON.stringify(opts?.params || {});
  if (inflight.has(key)) return inflight.get(key);

  const run = (async () => {
    try {
      // 1) HEAD check for cache validation
      const prev = bodyCache.get(key);
      const head = await fetch(url, {
        method: 'HEAD',
        credentials: 'include',
        headers: opts.headers || {}
      });

      const etag = head.headers.get('etag');

      // Early returns for cache hits
      if (head.status === 304 && prev) return prev.json; // unchanged
      if (head.ok && prev && etag && prev.etag === etag) return prev.json; // same tag

      // 2) GET with If-None-Match for new/changed data
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          ...(opts.headers || {}),
          ...(etag ? { 'If-None-Match': etag } : {}),
        },
        credentials: 'include',
        cache: 'no-cache', // let ETag handle caching
      });

      // Handle 304 from GET request
      if (res.status === 304 && prev) return prev.json;

      // Handle auth redirects
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      const resTag = res.headers.get('etag');

      // Cache the response with its ETag
      if (resTag) {
        bodyCache.set(key, { etag: resTag, json });
      }

      return json;
    } catch (error) {
      // If HEAD/GET fails, try fallback to basic fetch
      if (error.name === 'TypeError') {
        console.warn('HEAD-first fetch failed, falling back to basic fetch:', error);
        const res = await fetch(url, {
          method: 'GET',
          headers: opts.headers || {},
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Fallback request failed: ${res.status}`);
        return res.json();
      }
      throw error;
    }
  })().finally(() => inflight.delete(key));

  inflight.set(key, run);
  return run;
}