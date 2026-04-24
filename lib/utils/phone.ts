/**
 * Normalize Malaysian phone number to international format "60...".
 * This is the canonical storage format used across the entire system.
 *
 * Examples:
 *   "0123456789"   → "60123456789"
 *   "+60123456789" → "60123456789"
 *   "60123456789"  → "60123456789"
 *   "123456789"    → "60123456789"
 *   ""             → ""
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";

  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("0")) {
    digits = "60" + digits.slice(1);
  } else if (!digits.startsWith("60")) {
    digits = "60" + digits;
  }

  return digits;
}

/**
 * Format phone for WhatsApp wa.me/ URLs.
 * Alias for normalizePhone — same logic, kept for semantic clarity.
 */
export function formatPhoneForWA(phone: string | null | undefined): string {
  return normalizePhone(phone);
}
