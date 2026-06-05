import type { CountryContext } from "@/lib/country";
import { resolveCountry } from "@/lib/country";

/**
 * Format a money amount in the merchant's local currency.
 *
 * MYR examples:  1234.5  → "RM 1,234.50"   |   0 → "RM 0"
 * IDR examples:  150_000 → "Rp 150.000"    |   0 → "Rp 0"
 *
 * IDR has no fractional minor unit — sen-equivalent rounding is dropped.
 */
export function formatMoney(
  amount: number,
  ctx: CountryContext | string | null | undefined = "ID",
): string {
  const c = typeof ctx === "object" && ctx ? ctx : resolveCountry(ctx as string | null | undefined);

  if (amount === 0) return `${c.currencySymbol} 0`;

  const formatted = amount.toLocaleString(c.locale, {
    minimumFractionDigits: c.currency === "IDR" ? 0 : 0,
    maximumFractionDigits: c.currency === "IDR" ? 0 : 2,
  });

  return `${c.currencySymbol} ${formatted}`;
}

/**
 * Convert a major-unit amount (RM / Rp) to the gateway's smallest unit.
 *
 * Billplz expects MYR cents:  RM 49.00 → 4900
 * Midtrans expects IDR rupiah: Rp 99,000 → 99000  (no fractional)
 */
export function toMinorUnits(
  amount: number,
  ctx: CountryContext | string | null | undefined = "ID",
): number {
  const c = typeof ctx === "object" && ctx ? ctx : resolveCountry(ctx as string | null | undefined);
  return Math.round(amount * c.minorUnitFactor);
}

/** Inverse of `toMinorUnits` — gateway response → display amount. */
export function fromMinorUnits(
  minor: number,
  ctx: CountryContext | string | null | undefined = "ID",
): number {
  const c = typeof ctx === "object" && ctx ? ctx : resolveCountry(ctx as string | null | undefined);
  return c.minorUnitFactor === 1 ? minor : minor / c.minorUnitFactor;
}

/**
 * Parse a money input string into a number.
 *
 * Accepts MYR-style "RM 1,234.50" / "1234.50" and IDR-style "Rp 150.000" / "150000".
 * Returns NaN if the input cannot be parsed.
 */
export function parseMoney(
  input: string,
  ctx: CountryContext | string | null | undefined = "ID",
): number {
  const c = typeof ctx === "object" && ctx ? ctx : resolveCountry(ctx as string | null | undefined);

  // Strip currency symbol + whitespace
  let cleaned = input.replace(/[^\d.,-]/g, "");

  if (c.currency === "IDR") {
    // Indonesian: dot is thousand separator, comma is decimal (rare for whole rupiah)
    cleaned = cleaned.replace(/\./g, "");
    cleaned = cleaned.replace(",", ".");
  } else {
    // MYR: comma is thousand separator, dot is decimal
    cleaned = cleaned.replace(/,/g, "");
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}
