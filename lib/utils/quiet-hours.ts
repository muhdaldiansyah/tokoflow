// Quiet-hours boundary check for push-sending crons.
//
// Stored as TIME on profiles (e.g. "22:00:00" / "06:00:00"), interpreted in
// the merchant's local clock — Asia/Kuala_Lumpur for MY merchants (MYT, UTC+8)
// or Asia/Jakarta for ID merchants (WIB, UTC+7). A null/empty pair means the
// merchant has not configured quiet hours and should always receive pushes.
//
// Window may wrap midnight: 22:00 → 06:00 covers the 22:00 hour AND the
// pre-dawn hours up to (but not including) 06:00.

import { resolveCountry, type Country, type CountryContext } from "@/lib/country";

export function isWithinQuietHours(
  quietStart: string | null | undefined,
  quietEnd: string | null | undefined,
  now: Date = new Date(),
  country: Country | CountryContext | string | null | undefined = "ID",
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

  const ctx =
    typeof country === "object" && country
      ? country
      : resolveCountry(country as string | null | undefined);

  const localNow = new Date(now.getTime() + ctx.tzOffsetMinutes * 60 * 1000);
  const nowMin = localNow.getUTCHours() * 60 + localNow.getUTCMinutes();

  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  return nowMin >= startMin || nowMin < endMin;
}

/**
 * "Is it currently the merchant's local morning?" — used by crons that fire
 * once globally and need to fan out per-merchant by timezone.
 *
 * Returns true if the merchant's local clock is in the [startHour, endHour)
 * window. Default is 06:00–08:00 local, which lines up with Tokoflow's
 * morning-brief push window.
 */
export function isLocalMorning(
  now: Date,
  country: Country | CountryContext | string | null | undefined,
  startHour = 6,
  endHour = 8,
): boolean {
  const ctx =
    typeof country === "object" && country
      ? country
      : resolveCountry(country as string | null | undefined);
  const localNow = new Date(now.getTime() + ctx.tzOffsetMinutes * 60 * 1000);
  const h = localNow.getUTCHours();
  return h >= startHour && h < endHour;
}
