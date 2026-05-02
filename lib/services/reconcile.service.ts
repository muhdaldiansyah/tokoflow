/**
 * Reconciliation scoring — pure functions, no DB.
 *
 * Composite confidence weights (positioning bible §1.3, money-bearing 0.92):
 *   amount    0.50  — how close the transferred amount is to the order total
 *   name      0.30  — fuzzy match between sender name and customer name
 *   recency   0.15  — newer orders score higher (typical pay-on-checkout flow)
 *   delivery  0.05  — orders with delivery date near "now" score slightly higher
 *
 * Total ranges 0.0–1.0. ≥0.92 = auto-link in money-bearing context.
 *
 * Honorific stripping is targeted at MY merchant context — the merchant in
 * the order is "Encik Rizal" but the bank slip says "RIZAL BIN AHMAD".
 */

const HONORIFICS = [
  // Malay
  "encik", "puan", "datin", "datuk", "tuan", "cik",
  // Indonesian (some MY merchants serve ID customers via cross-border)
  "bapak", "bpk", "pak", "ibu", "bu", "mbak", "mas", "kak",
];

const NAME_SUFFIXES = [
  // BIN / BINTI markers — collapse to first identifying token after the marker.
  "bin", "binti", "bt", "b", "a/l", "a/p", "s/o", "d/o",
];

export function normalizeName(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.toLowerCase().trim();
  s = s.replace(/[^a-z\s'\-]/g, " "); // strip punctuation except apostrophe/hyphen
  s = s.replace(/\s+/g, " ").trim();
  // Strip leading honorific
  for (const h of HONORIFICS) {
    if (s.startsWith(h + " ")) {
      s = s.slice(h.length + 1).trim();
      break;
    }
  }
  return s;
}

/**
 * Token-set similarity 0.0–1.0. Strips honorifics + BIN/BINTI markers, then
 * computes |intersection| / max(|setA|, |setB|). Returns 1.0 for empty-vs-empty
 * to avoid surprise auto-matches; that's filtered in scoreReconciliation.
 */
export function nameMatchScore(a: string | null, b: string | null): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;

  const tokensOf = (s: string): Set<string> => {
    const out = new Set<string>();
    for (const tok of s.split(" ")) {
      const t = tok.trim();
      if (!t) continue;
      if (NAME_SUFFIXES.includes(t)) continue;
      if (t.length < 2) continue;
      out.add(t);
    }
    return out;
  };

  const setA = tokensOf(na);
  const setB = tokensOf(nb);
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  for (const t of setA) if (setB.has(t)) overlap += 1;
  return overlap / Math.max(setA.size, setB.size);
}

export function amountMatchScore(
  paymentAmountMyr: number,
  orderTotalMyr: number,
): number {
  if (paymentAmountMyr <= 0 || orderTotalMyr <= 0) return 0;
  const diff = Math.abs(paymentAmountMyr - orderTotalMyr);
  const rel = diff / orderTotalMyr;
  if (rel <= 0.001) return 1.0; // exact (or <0.1% rounding)
  if (rel <= 0.01) return 0.85; // ±1%
  if (rel <= 0.05) return 0.5; // ±5% — likely a fee discrepancy
  return 0;
}

export function recencyScore(
  orderCreatedAt: Date,
  paymentOccurredAt: Date,
): number {
  const lagMs = paymentOccurredAt.getTime() - orderCreatedAt.getTime();
  if (lagMs < 0) return 0; // payment before order is suspicious
  const lagHours = lagMs / (1000 * 60 * 60);
  if (lagHours <= 6) return 1.0;
  if (lagHours <= 24) return 0.7;
  if (lagHours <= 72) return 0.4;
  return 0.1;
}

export function deliveryProximityScore(
  deliveryDate: Date | null,
  paymentOccurredAt: Date,
): number {
  if (!deliveryDate) return 0;
  const diffMs = Math.abs(deliveryDate.getTime() - paymentOccurredAt.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours <= 24) return 1.0;
  if (diffHours <= 72) return 0.5;
  return 0;
}

export interface ReconcileScoreInput {
  paymentAmountMyr: number;
  paymentSenderName: string | null;
  paymentOccurredAt: Date;
  orderTotalMyr: number;
  orderCustomerName: string | null;
  orderCreatedAt: Date;
  orderDeliveryDate: Date | null;
}

export interface ReconcileScores {
  amount: number;
  name: number;
  recency: number;
  delivery: number;
  total: number;
}

const W = { amount: 0.5, name: 0.3, recency: 0.15, delivery: 0.05 };

export function scoreReconciliation(
  input: ReconcileScoreInput,
): ReconcileScores {
  const amount = amountMatchScore(input.paymentAmountMyr, input.orderTotalMyr);
  const name = nameMatchScore(input.paymentSenderName, input.orderCustomerName);
  const recency = recencyScore(input.orderCreatedAt, input.paymentOccurredAt);
  const delivery = deliveryProximityScore(
    input.orderDeliveryDate,
    input.paymentOccurredAt,
  );
  const total =
    amount * W.amount +
    name * W.name +
    recency * W.recency +
    delivery * W.delivery;
  return { amount, name, recency, delivery, total };
}

export const MONEY_BEARING_THRESHOLD = 0.92;

export function meetsAutoLinkThreshold(total: number): boolean {
  return total >= MONEY_BEARING_THRESHOLD;
}
