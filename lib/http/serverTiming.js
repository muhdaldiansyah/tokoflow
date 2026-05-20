export function withServerTiming(startMs, extra = {}) {
  const dur = Date.now() - startMs;
  const parts = [`total;dur=${dur}`];
  for (const [k, v] of Object.entries(extra)) parts.push(`${k};dur=${v}`);
  return parts.join(', ');
}