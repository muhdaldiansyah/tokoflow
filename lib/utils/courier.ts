// Courier tracking link helper (Tokoflow = Indonesia).
//
// Honors migration 088 + 098 philosophy: Tokoflow does NOT integrate with
// courier APIs or poll status. The merchant types a free-form tracking
// number (resi) and picks the courier when marking an order shipped; at
// render time we link to that courier's track-trace page. The customer gets
// a clickable shortcut (the receipt card also has a Copy button).
//
// Indonesian resi numbers are NOT reliably prefix-detectable across couriers
// (JNE / J&T / SiCepat / AnterAja formats overlap), so we do NOT guess the
// courier from the number — we trust the courier the merchant explicitly
// picked (courierTrackUrl). detectCourier is kept for API compatibility but
// returns null (no auto-detection); the UI then shows the raw resi and, when
// the merchant picked a courier, a track link via courierTrackUrl.

export interface CourierMatch {
  name: string;
  trackUrl: string;
}

// Single source of truth: courier name → tracking-portal URL builder. Couriers
// whose tracking is in-app only (GoSend, GrabExpress, own rider) are absent —
// they show the raw resi with no link. Where a courier exposes a working
// query param we pre-fill the resi; otherwise we link to its tracking page.
const COURIER_TRACK_URLS: Record<string, (resi: string) => string> = {
  "JNE": () => `https://www.jne.co.id/id/tracking/trace`,
  "J&T Express": () => `https://jet.co.id/track`,
  "SiCepat": () => `https://www.sicepat.com/checkAwb`,
  "AnterAja": () => `https://anteraja.id/tracking`,
  "Ninja Xpress": (n) => `https://www.ninjaxpress.co/id-id/tracking?id=${encodeURIComponent(n)}`,
  "Pos Indonesia": () => `https://www.posindonesia.co.id/id/tracking`,
  "TIKI": () => `https://www.tiki.id/id/track`,
  "Lion Parcel": (n) => `https://lionparcel.com/track?awb=${encodeURIComponent(n)}`,
  "ID Express": () => `https://idexpress.com/`,
  "SAP Express": () => `https://sap-express.id/tracking`,
};

/**
 * Couriers for the picker dropdown. Superset of COURIER_TRACK_URLS — includes
 * in-app-only couriers (GoSend, GrabExpress) that have no public lookup portal
 * but merchants still select by name when marking orders as shipped.
 */
export const COURIER_NAMES: string[] = [
  "JNE",
  "J&T Express",
  "SiCepat",
  "AnterAja",
  "Ninja Xpress",
  "Pos Indonesia",
  "TIKI",
  "Lion Parcel",
  "ID Express",
  "SAP Express",
  "GoSend",
  "GrabExpress",
];

/**
 * Indonesian resi numbers are not reliably prefix-detectable, so we never guess
 * the courier from the number. Always returns null — kept for API
 * compatibility with callers that expect the previous auto-detect behavior.
 * The UI falls back to the merchant-supplied courier_name + courierTrackUrl.
 */
export function detectCourier(_trackingNumber?: string | null): CourierMatch | null {
  return null;
}

/**
 * Portal URL for a courier the merchant explicitly selected (from COURIER_NAMES).
 * Returns null for in-app / own-rider couriers with no public lookup portal
 * (GoSend, GrabExpress) — the UI then shows the raw resi without a link.
 */
export function courierTrackUrl(
  courierName?: string | null,
  trackingNumber?: string | null,
): string | null {
  if (!courierName || !trackingNumber) return null;
  const builder = COURIER_TRACK_URLS[courierName.trim()];
  return builder ? builder(trackingNumber.trim()) : null;
}
