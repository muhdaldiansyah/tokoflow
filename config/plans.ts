// Plans (MYR, whole ringgit) — simplified to the 3 tiers from
// docs/positioning/05-pricing.md (D-008): Free / Pro RM 49 / Business RM 99.
//
// The pack/medium-pack/unlimited code paths are kept intact so the existing
// payment routes and Supabase RPCs (`add_order_pack`, `activate_unlimited`)
// continue to compile and run, but the dashboard UI no longer surfaces them.
// Any merchant who already topped up before the simplification keeps their
// credits via `getOrdersRemaining`. New monetisation goes through Pro.

export const FREE_MONTHLY_ORDERS = 50;

// === Pro tier — current daily-driver paid plan ===
// Display label is "Pro" in MY market. Legacy code name "bisnis" is kept for
// backward compatibility with existing imports and the `bisnis_until` column.
export const BISNIS_CODE = "bisnis";
export const BISNIS_PRICE = 49;

// === Business tier — Phase 4, not yet wired ===
export const BUSINESS_CODE = "business";
export const BUSINESS_PRICE = 99;

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

// Helper: get total orders remaining (free + pack credits)
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
  const freeRemaining = Math.max(0, FREE_MONTHLY_ORDERS - used);
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
  return Math.min(profile.orders_used ?? 0, FREE_MONTHLY_ORDERS);
}

// Two-state nudge: nothing until the free quota actually runs out.
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
  return (profile.orders_used ?? 0) >= FREE_MONTHLY_ORDERS ? "exhausted" : "none";
}

export function isBisnis(profile: {
  bisnis_until?: string | null;
}): boolean {
  if (!profile.bisnis_until) return false;
  return new Date(profile.bisnis_until) > new Date();
}

export function formatPrice(price: number): string {
  if (price === 0) return "RM 0";
  return `RM ${price}`;
}
