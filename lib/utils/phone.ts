import { resolveCountry, type Country, type CountryContext } from "@/lib/country";

/**
 * Normalize a phone number to international format without the "+" sign.
 *
 * Country defaults to MY for backward compat with existing call sites that
 * predate the dual-country (ID + MY) refactor. All new code paths should
 * pass an explicit country derived from the merchant's profile.
 *
 * MY examples:
 *   "0123456789"   → "60123456789"
 *   "+60123456789" → "60123456789"
 *   "60123456789"  → "60123456789"
 *
 * ID examples:
 *   "081234567890"  → "6281234567890"
 *   "+6281234567890" → "6281234567890"
 *   "6281234567890"  → "6281234567890"
 */
export function normalizePhone(
  phone: string | null | undefined,
  country: Country | CountryContext | string | null | undefined = "ID",
): string {
  if (!phone) return "";

  const ctx =
    typeof country === "object" && country
      ? country
      : resolveCountry(country as string | null | undefined);
  const prefix = ctx.phonePrefix;

  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("0")) {
    digits = prefix + digits.slice(1);
  } else if (!digits.startsWith(prefix)) {
    digits = prefix + digits;
  }

  return digits;
}

/**
 * Format phone for WhatsApp wa.me/ URLs.
 * Alias for `normalizePhone` — same logic, kept for semantic clarity.
 */
export function formatPhoneForWA(
  phone: string | null | undefined,
  country: Country | CountryContext | string | null | undefined = "ID",
): string {
  return normalizePhone(phone, country);
}
