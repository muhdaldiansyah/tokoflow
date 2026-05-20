// lib/http/cursor.js
export function encodeCursor({ updated_at, id }) {
  const payload = { u: updated_at, i: id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor) {
  try {
    const { u, i } = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    return (u && i) ? { updated_at: u, id: i } : null;
  } catch {
    return null;
  }
}