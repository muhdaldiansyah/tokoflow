/**
 * Deterministic per-merchant avatar color (when no logo is uploaded).
 *
 * Each merchant gets a stable color drawn from an 8-bucket muted palette
 * — picked by hashing the merchant's name. Same name always lands on the
 * same color, so a returning customer sees a consistent shop.
 *
 * Why 8 muted tints (not Tokoflow green): the storefront is the merchant's
 * brand surface, not Tokoflow's. Painting every shop in our brand color
 * stamps Tokoflow over the merchant. Hashed tints give visual identity
 * without merchant work AND without us colonizing their surface.
 *
 * The full Tailwind class names are listed verbatim in the array so the
 * JIT picks them up at build time.
 */
export const AVATAR_PALETTE = [
  { bg: "bg-orange-100", fg: "text-orange-700" },
  { bg: "bg-emerald-100", fg: "text-emerald-700" },
  { bg: "bg-sky-100", fg: "text-sky-700" },
  { bg: "bg-rose-100", fg: "text-rose-700" },
  { bg: "bg-amber-100", fg: "text-amber-700" },
  { bg: "bg-violet-100", fg: "text-violet-700" },
  { bg: "bg-teal-100", fg: "text-teal-700" },
  { bg: "bg-slate-200", fg: "text-slate-700" },
] as const;

export type AvatarColor = (typeof AVATAR_PALETTE)[number];

export function avatarColors(seed: string | null | undefined): AvatarColor {
  const s = (seed ?? "").trim().toLowerCase();
  if (!s) return AVATAR_PALETTE[7]; // neutral slate fallback
  // djb2 hash — small, dependency-free, stable across runtimes.
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
