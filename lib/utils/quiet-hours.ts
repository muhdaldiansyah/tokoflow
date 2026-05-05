// Quiet-hours boundary check for push-sending crons.
//
// Stored as TIME on profiles (e.g. "22:00:00" / "06:00:00"), interpreted in
// the merchant's local clock — Asia/Kuala_Lumpur (MYT, UTC+8). A null/empty
// pair means the merchant has not configured quiet hours and should always
// receive pushes.
//
// Window may wrap midnight: 22:00 → 06:00 covers the 22:00 hour AND the
// pre-dawn hours up to (but not including) 06:00.

export function isWithinQuietHours(
  quietStart: string | null | undefined,
  quietEnd: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!quietStart || !quietEnd) return false;

  const parse = (t: string): number | null => {
    const [hStr, mStr] = t.split(":");
    const h = Number(hStr);
    const m = Number(mStr ?? "0");
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };

  const startMin = parse(quietStart);
  const endMin = parse(quietEnd);
  if (startMin === null || endMin === null) return false;
  if (startMin === endMin) return false;

  const mytNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const nowMin = mytNow.getUTCHours() * 60 + mytNow.getUTCMinutes();

  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  return nowMin >= startMin || nowMin < endMin;
}
