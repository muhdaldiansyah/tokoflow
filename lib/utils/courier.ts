// Courier tracking link auto-detection
//
// Honors migration 088 + 098 philosophy: Tokoflow does NOT integrate with
// courier APIs or poll status. We let the merchant type a free-form
// tracking number, then at render time we infer which courier portal to
// link to from the prefix. The merchant types once; the customer gets a
// clickable shortcut to the carrier's own track-trace page.
//
// Patterns below cover the Malaysian couriers home F&B mompreneurs use
// most (per Phase 0 backup-b2b research). Ordered by specificity — Pos
// Laju and Ninja Van have the most distinctive prefixes, J&T and DHL are
// numeric-only so they're matched last. If no pattern matches, we fall
// back to the merchant-supplied `courier_name` (if any) and skip the
// auto-link.
//
// To add a new courier: append a row to COURIER_PATTERNS. Test prefix
// uniqueness — overlapping patterns return the first match (top-down).

export interface CourierMatch {
  name: string;
  trackUrl: string;
}

interface CourierPattern {
  name: string;
  // Regex tested against the raw tracking number (after trim, upper).
  pattern: RegExp;
  // Returns the carrier-portal URL for this tracking number.
  trackUrl: (trackingNumber: string) => string;
}

// Single source of truth: courier name → tracking-portal URL builder. Used by
// both number-pattern detection (detectCourier) and by courierTrackUrl(), which
// trusts the courier the merchant explicitly picked. Couriers with no public
// lookup portal (Lalamove same-day, Shopee Express in-app, own rider) are
// deliberately absent — they show the raw number with no link.
const COURIER_TRACK_URLS: Record<string, (trackingNumber: string) => string> = {
  "Pos Laju": (n) => `https://tracking.pos.com.my/?trackingNumber=${encodeURIComponent(n)}`,
  "Ninja Van": (n) => `https://www.ninjavan.co/en-my/tracking?id=${encodeURIComponent(n)}`,
  "Skynet": (n) => `https://www.skynet.com.my/track-trace.aspx?awb=${encodeURIComponent(n)}`,
  "J&T Express": (n) => `https://www.jtexpress.my/track?awb=${encodeURIComponent(n)}`,
  "DHL": (n) => `https://www.dhl.com/my-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
  // GDEX has no documented pre-fill query param — link to the official tracking
  // page; the customer pastes the number (the receipt card has a Copy button).
  "GDEX": () => `https://gdexpress.com/tracking/`,
};

const COURIER_PATTERNS: CourierPattern[] = [
  // Pos Laju — registered mail format e.g. EE123456789MY
  { name: "Pos Laju", pattern: /^E[A-Z]\d{9}MY$/, trackUrl: COURIER_TRACK_URLS["Pos Laju"] },
  // Ninja Van Malaysia — NVMY prefix + digits
  { name: "Ninja Van", pattern: /^NVMY[A-Z0-9]+$/, trackUrl: COURIER_TRACK_URLS["Ninja Van"] },
  // Skynet Worldwide Express — letter+digits
  { name: "Skynet", pattern: /^S[A-Z]?\d{8,}$/, trackUrl: COURIER_TRACK_URLS["Skynet"] },
  // J&T Express — 12-digit numeric starting with 6
  { name: "J&T Express", pattern: /^6\d{11}$/, trackUrl: COURIER_TRACK_URLS["J&T Express"] },
  // DHL eCommerce — 10 to 14 digit numeric. Greedy: only used as a fallback when
  // the merchant didn't pick a courier (see courierTrackUrl).
  { name: "DHL", pattern: /^\d{10,14}$/, trackUrl: COURIER_TRACK_URLS["DHL"] },
];

/**
 * Common MY couriers for the picker dropdown. Superset of COURIER_PATTERNS —
 * includes carriers whose tracking numbers are ambiguous (no reliable prefix)
 * so they have no auto-detection pattern, but merchants still select them
 * by name when marking orders as shipped.
 */
export const COURIER_NAMES: string[] = [
  "J&T Express",
  "Pos Laju",
  "GDEX",
  "Ninja Van",
  "DHL",
  "Skynet",
  "Lalamove",
  "Shopee Express",
];

/**
 * Returns the courier name + portal URL if the tracking number matches a
 * known pattern. Returns null when the format doesn't match any known
 * courier — in that case the UI should fall back to displaying the raw
 * tracking number + the merchant-supplied courier_name (if any) without
 * a clickable link.
 */
export function detectCourier(trackingNumber?: string | null): CourierMatch | null {
  if (!trackingNumber) return null;
  const trimmed = trackingNumber.trim().toUpperCase();
  if (!trimmed) return null;
  const match = COURIER_PATTERNS.find((c) => c.pattern.test(trimmed));
  if (!match) return null;
  return { name: match.name, trackUrl: match.trackUrl(trimmed) };
}

/**
 * Portal URL for a courier the merchant explicitly selected (from COURIER_NAMES),
 * when we have one. Trusting the merchant's pick is more reliable than guessing
 * from the number: it fixes couriers whose numbers collide with the greedy
 * patterns (a GDEX numeric would otherwise read as "DHL") and supports couriers
 * with no distinctive number format. Returns null for free-form / own-rider
 * couriers and for ones with no public lookup portal (Lalamove, Shopee Express)
 * — the UI then shows the raw number without a link.
 */
export function courierTrackUrl(
  courierName?: string | null,
  trackingNumber?: string | null,
): string | null {
  if (!courierName || !trackingNumber) return null;
  const builder = COURIER_TRACK_URLS[courierName.trim()];
  return builder ? builder(trackingNumber.trim()) : null;
}
