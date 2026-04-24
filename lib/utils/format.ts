/**
 * Shared formatting utilities — single source of truth.
 * Import from here instead of defining inline formatters.
 */

/** Format number as Indonesian Rupiah: 1500000 → "Rp1.500.000" */
export function formatRupiah(amount: number): string {
  if (amount === 0) return "Rp0";
  return `RM ${amount.toLocaleString("en-MY")}`;
}

/** Format number as Rupiah with Intl (includes "MYR" prefix): 1500000 → "Rp 1.500.000" */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Format ISO date string to Indonesian locale: "2026-03-21" → "21 Mar 2026" */
export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format ISO date string to short: "2026-03-21" → "21 Mar" */
export function formatShortDate(d: string): string {
  const date = new Date(d + (d.includes("T") ? "" : "T00:00:00"));
  return date.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

/** Format ISO timestamp to time: "2026-03-21T14:30:00Z" → "14:30" */
export function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

/** Format ISO date string to long Indonesian locale: "2026-03-21" → "21 Maret 2026" */
export function formatDateLong(d: string): string {
  return new Date(d).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Calculate percentage: pct(3, 10) → "30%" */
export function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}
