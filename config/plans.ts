// Plans — country-aware pricing.
//
// Tokoflow pricing is now sourced from the `pricing_tiers` table (migration 096):
//   MY: Free / Pro RM 49 / Business RM 99
//   ID: Gratis / Pro Rp 99,000 / Business Rp 199,000
//
// The constants below remain as MY-side defaults for code paths that haven't
// been migrated to the country-aware helpers yet. The pack/medium-pack/unlimited
// code paths are kept intact so the existing payment routes and Supabase RPCs
// (`add_order_pack`, `activate_unlimited`) continue to compile and run.

import type { Country, CountryContext } from "@/lib/country";
import { resolveCountry } from "@/lib/country";
import { formatMoney as fmtMoney } from "@/lib/currency/format";

export const FREE_STARTER_ORDERS = 50;
/** @deprecated Use FREE_STARTER_ORDERS. */
export const FREE_MONTHLY_ORDERS = FREE_STARTER_ORDERS;

// === Pro tier — current daily-driver paid plan ===
// Display label is "Pro" in both markets. Legacy code name "bisnis" is kept for
// backward compatibility with existing imports and the `bisnis_until` column.
export const BISNIS_CODE = "bisnis";
export const BISNIS_CODE_ANNUAL = "bisnis_annual";
export const BISNIS_PRICE = 49; // annual per-month equivalent (display price)
export const BISNIS_PRICE_MONTHLY = 79; // month-to-month (no commitment)
export const BISNIS_PRICE_ANNUAL_TOTAL = 588; // RM 49 × 12, billed once

// === Business tier — Phase 4, not yet wired ===
export const BUSINESS_CODE = "business";
export const BUSINESS_PRICE = 99; // MY default

// === Legacy quota top-up (deprecated, kept for API + DB compat) ===
/** @deprecated Tier collapsed to Free / Pro / Business per D-008. */
export const PACK_ORDERS = 50;
/** @deprecated */
export const PACK_PRICE = 5;
/** @deprecated */
export const PACK_CODE = "pack";
/** @deprecated */
export const UNLIMITED_PACK_THRESHOLD = 3;
/** @deprecated */
export const MEDIUM_PACK_ORDERS = 100;
/** @deprecated */
export const MEDIUM_PACK_PRICE = 8;
/** @deprecated */
export const MEDIUM_PACK_CODE = "medium_pack";
/** @deprecated */
export const UNLIMITED_CODE = "unlimited";
/** @deprecated */
export const UNLIMITED_PRICE = 13;

// === Country-aware pricing ===

export interface PricingTier {
  planCode: string;
  displayName: string;
  amount: number;
  currency: "MYR" | "IDR";
  country: Country;
}

/**
 * In-memory pricing table. Mirrors the seed in `supabase/migrations/096_country_pricing_and_gateway.sql`.
 * The DB row is the source of truth at runtime; this table is the fallback
 * when a route hasn't yet been migrated to read from the DB.
 */
const FALLBACK_PRICING: Record<Country, Record<string, PricingTier>> = {
  MY: {
    free:          { planCode: "free",          displayName: "Free",     amount: 0,   currency: "MYR", country: "MY" },
    bisnis:        { planCode: "bisnis",        displayName: "Pro",      amount: 79,  currency: "MYR", country: "MY" },
    bisnis_annual: { planCode: "bisnis_annual", displayName: "Pro",      amount: 588, currency: "MYR", country: "MY" },
    business:      { planCode: "business",      displayName: "Business", amount: 99,  currency: "MYR", country: "MY" },
  },
  ID: {
    free:     { planCode: "free",     displayName: "Gratis",   amount: 0,      currency: "IDR", country: "ID" },
    bisnis:   { planCode: "bisnis",   displayName: "Pro",      amount: 99000,  currency: "IDR", country: "ID" },
    business: { planCode: "business", displayName: "Business", amount: 199000, currency: "IDR", country: "ID" },
  },
};

/**
 * Resolve a plan code to its pricing tier in the merchant's country.
 *
 * Returns null for unknown codes — the legacy pack/medium-pack/unlimited
 * codes are MY-only and not represented here.
 */
export function getPricingTier(
  planCode: string,
  country: Country | CountryContext | string | null | undefined = "MY",
): PricingTier | null {
  const ctx =
    typeof country === "object" && country
      ? country
      : resolveCountry(country as string | null | undefined);
  return FALLBACK_PRICING[ctx.code][planCode] ?? null;
}

/** Country-aware list of active tiers (Free / Pro / Business). */
export function listPricingTiers(
  country: Country | CountryContext | string | null | undefined = "MY",
): PricingTier[] {
  const ctx =
    typeof country === "object" && country
      ? country
      : resolveCountry(country as string | null | undefined);
  const table = FALLBACK_PRICING[ctx.code];
  return [table.free, table.bisnis, table.business];
}

// Helper: get total orders remaining (starter allowance + pack credits)
export function getOrdersRemaining(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): number {
  if (profile.unlimited_until && new Date(profile.unlimited_until) > new Date()) {
    return Infinity;
  }
  const used = profile.orders_used ?? 0;
  const credits = profile.order_credits ?? 0;
  const freeRemaining = Math.max(0, FREE_STARTER_ORDERS - used);
  return freeRemaining + credits;
}

export function isUnlimited(profile: {
  unlimited_until?: string | null;
}): boolean {
  if (!profile.unlimited_until) return false;
  return new Date(profile.unlimited_until) > new Date();
}

export function isOrderQuotaExhausted(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): boolean {
  return getOrdersRemaining(profile) <= 0;
}

export function getFreeOrdersUsed(profile: {
  orders_used?: number;
}): number {
  return Math.min(profile.orders_used ?? 0, FREE_STARTER_ORDERS);
}

// Two-state nudge: nothing until the starter quota actually runs out.
// Anti-anxiety per docs/positioning/03-features.md — no soft/medium/urgent
// thresholds, no "X/50 used" persistent banners.
export function getNudgeLevel(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): "none" | "exhausted" {
  if (isUnlimited(profile)) return "none";
  const credits = profile.order_credits ?? 0;
  if (credits > 0) return "none";
  return (profile.orders_used ?? 0) >= FREE_STARTER_ORDERS ? "exhausted" : "none";
}

export function isBisnis(profile: {
  bisnis_until?: string | null;
}): boolean {
  if (!profile.bisnis_until) return false;
  return new Date(profile.bisnis_until) > new Date();
}

/**
 * Format a price for display in the merchant's country.
 * Backward-compatible single-arg form returns MY-flavored "RM N".
 */
export function formatPrice(
  price: number,
  country: Country | CountryContext | string | null | undefined = "MY",
): string {
  return fmtMoney(price, country);
}
