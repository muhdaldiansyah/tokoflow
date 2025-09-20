// app/lib/fetcher.js
const inflight = new Map();

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