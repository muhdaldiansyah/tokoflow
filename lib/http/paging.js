// lib/http/paging.js
export function parseQuery(req, { maxLimit = 200, defaultLimit = 25 } = {}) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || defaultLimit), maxLimit);
  const cursor = url.searchParams.get('cursor') || null;
  const fields = url.searchParams.get('fields'); // e.g. "id,name,price"
  const select = fields ? fields.split(',').map(s => s.trim()).filter(Boolean).join(',') : '*';
  return { url, limit, cursor, select, fieldsSet: !!fields };
}

export function buildNextLink(url, nextCursor) {
  if (!nextCursor) return null;
  const u = new URL(url);
  u.searchParams.set('cursor', String(nextCursor));
  return u.pathname + u.search; // relative
}