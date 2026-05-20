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