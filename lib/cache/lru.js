// simple, fast, GC-friendly LRU with TTL
export function createLRU({ max = 1000, ttlMs = 3000 } = {}) {
  const m = new Map();

  function get(key) {
    const node = m.get(key);
    if (!node) return null;
    if (node.exp <= Date.now()) { m.delete(key); return null; }
    // move to end (recently used)
    m.delete(key);
    m.set(key, node);
    return node.val;
  }

  function set(key, val) {
    if (m.size >= max) {
      // delete oldest (Map iteration is insertion order)
      const oldest = m.keys().next().value;
      if (oldest !== undefined) m.delete(oldest);
    }
    m.set(key, { val, exp: Date.now() + ttlMs });
  }

  return { get, set };
}