// Order quota pricing constants (MYR, whole ringgit)
export const FREE_MONTHLY_ORDERS = 50;
export const PACK_ORDERS = 50;
export const PACK_PRICE = 5;
export const PACK_CODE = "pack";
export const UNLIMITED_PACK_THRESHOLD = 3; // 3rd pack = unlimited rest of month

// Medium pack
export const MEDIUM_PACK_ORDERS = 100;
export const MEDIUM_PACK_PRICE = 8;
export const MEDIUM_PACK_CODE = "medium_pack";

// Unlimited monthly plan
export const UNLIMITED_CODE = "unlimited";
export const UNLIMITED_PRICE = 13;

// Bisnis / Pro tier — currently LHDN e-Invoice + unlimited faktur.
// Legacy "bisnis" code name kept for backward compatibility with existing imports
// and the `bisnis_until` DB column. Display label is "Pro" in MY market.
export const BISNIS_CODE = "bisnis";
export const BISNIS_PRICE = 49;

// Business monthly plan (franchise / API / white-label — Phase 4, not yet wired)
export const BUSINESS_CODE = "business";
export const BUSINESS_PRICE = 99;

// Nudge thresholds (orders used in free tier)
export const NUDGE_SOFT = 40;
export const NUDGE_MEDIUM = 45;
export const NUDGE_URGENT = 48;

// Helper: get total orders remaining (free + pack credits)
export function getOrdersRemaining(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): number {
  // Unlimited
  if (profile.unlimited_until && new Date(profile.unlimited_until) > new Date()) {
    return Infinity;
  }
  const used = profile.orders_used ?? 0;
  const credits = profile.order_credits ?? 0;
  const freeRemaining = Math.max(0, FREE_MONTHLY_ORDERS - used);
  return freeRemaining + credits;
}

// Helper: check if unlimited is active
export function isUnlimited(profile: {
  unlimited_until?: string | null;
}): boolean {
  if (!profile.unlimited_until) return false;
  return new Date(profile.unlimited_until) > new Date();
}

// Helper: check if order quota is exhausted
export function isOrderQuotaExhausted(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): boolean {
  return getOrdersRemaining(profile) <= 0;
}

// Helper: get free orders used this month
export function getFreeOrdersUsed(profile: {
  orders_used?: number;
}): number {
  return Math.min(profile.orders_used ?? 0, FREE_MONTHLY_ORDERS);
}

// Helper: get nudge level based on usage
export function getNudgeLevel(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): "none" | "soft" | "medium" | "urgent" | "exhausted" {
  if (isUnlimited(profile)) return "none";
  const used = profile.orders_used ?? 0;
  const credits = profile.order_credits ?? 0;

  // If they have pack credits, no nudge on free tier
  if (credits > 0) return "none";

  if (used >= FREE_MONTHLY_ORDERS) return "exhausted";
  if (used >= NUDGE_URGENT) return "urgent";
  if (used >= NUDGE_MEDIUM) return "medium";
  if (used >= NUDGE_SOFT) return "soft";
  return "none";
}

// Helper: check if bisnis tier is active
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
