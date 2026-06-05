/**
 * Shared formatting utilities — single source of truth.
 * Import from here instead of defining inline formatters.
 */

/**
 * Format a number as Indonesian Rupiah: 150000 → "Rp 150.000".
 * IDR has no fractional minor unit, so decimals are dropped.
 */
export function formatRupiah(amount: number): string {
  if (amount === 0) return "Rp 0";
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

/** Format number as IDR currency with Intl: 150000 → "Rp 150.000" */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format ISO date string to short Indonesia locale: "2026-03-21" → "21 Mar 2026" */
export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format ISO date string to short: "2026-03-21" → "21 Mar" */
export function formatShortDate(d: string): string {
  const date = new Date(d + (d.includes("T") ? "" : "T00:00:00"));
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/** Format ISO timestamp to time: "2026-03-21T14:30:00Z" → "14:30" */
export function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** Format ISO date string to long Indonesia locale: "2026-03-21" → "21 Maret 2026" */
export function formatDateLong(d: string): string {
  return new Date(d).toLocaleDateString("id-ID", {
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
