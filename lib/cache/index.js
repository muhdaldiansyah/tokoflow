import { createLRU } from './lru';

// one singleton per server process (works in dev & serverless workers)
export const outputCache = global._tokoflow_output_cache
  || (global._tokoflow_output_cache = createLRU({ max: 1000, ttlMs: 3000 }));

export function clearPrefix(prefix) {
  for (const k of outputCache.keys()) {
    if (k.startsWith(prefix)) outputCache.delete(k);
  }
}