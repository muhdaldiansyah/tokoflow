/**
 * Reserved slugs — all existing route segments that would conflict
 * with the root-level vanity URL rewrite (tokoflow.com/[slug]).
 */
const RESERVED_SLUGS = new Set([
  // Marketing
  "features", "pricing", "about", "contact", "blog", "privacy", "terms",
  // Auth
  "login", "register", "forgot-password", "reset-password",
  // Dashboard — MY (post route rename)
  "orders", "customers", "products", "recap", "prep", "invoices",
  "community", "tax", "settings",
  // Dashboard — legacy (ID) slugs preserved so stored business slugs that
  // happen to match one of the old routes don't silently collide with the
  // permanent redirect handler.
  "pesanan", "pelanggan", "produk", "rekap", "persiapan", "faktur",
  "komunitas", "pajak", "pengaturan", "pesan",
  // Other dashboard
  "laporan", "reminders", "pengingat", "profil", "pembayaran",
  // System
  "api", "admin", "mitra", "ref", "r",
  // Directory
  "toko", "cari", "direktori",
]);

/**
 * Check if a slug is reserved (conflicts with existing routes).
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Generate a URL-safe slug from a business name.
 * "Warung Bu Rina" → "warung-bu-rina"
 * No prefix stripping — full name as-is, operator customizes in Settings.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // strip non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, "") // trim leading/trailing hyphens
    .slice(0, 50); // max 50 chars
}

/**
 * Validate a slug: lowercase, alphanumeric + hyphens, 3–50 chars.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}
