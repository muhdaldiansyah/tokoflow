export const ROUTES = {
  // Marketing
  HOME: "/",
  PRICING: "/pricing",
  FEATURES: "/features",
  ABOUT: "/about",
  CONTACT: "/contact",
  TERMS: "/terms",
  PRIVACY: "/privacy",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Dashboard (main landing is /orders)
  DASHBOARD: "/orders",
  ORDERS: "/orders",
  ORDERS_NEW: "/orders/new",
  CUSTOMERS: "/customers",
  RECAP: "/report",
  LAPORAN: "/laporan",

  REMINDERS: "/pengingat",
  PROFILE: "/profil",
  SETTINGS: "/settings",
  SETTINGS_BILLING: "/settings/billing",

  // Payment
  PAYMENT_SUCCESS: "/pembayaran/berhasil",
  PAYMENT_ERROR: "/pembayaran/gagal",
  PAYMENT_PENDING: "/pembayaran/pending",

  // Admin
  ADMIN: "/admin",
} as const;

export const PROTECTED_ROUTES = [
  "/orders",
  "/customers",
  "/report",
  "/laporan",

  "/pengingat",
  "/profil",
  "/settings",
  "/pembayaran",
  "/admin",
];

export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
];

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
} as const;

export const REFERRAL_COMMISSION_RATE = 0.30;
export const REFERRAL_DURATION_MONTHS = 6;
export const REFERRAL_SIGNUP_BONUS = 2; // RM 2 credited to the referrer when a referred user makes their first order (matches marketing copy on /mitra)

// Temporarily hide the referral / partner program from ALL user-facing surfaces
// (footer link, /mitra page, register banner, settings card, orders CTA) while
// the commission calculation is reworked. Backend (API routes, webhook, DB
// columns) stays intact — flip back to `true` to re-surface everything.
// Annotated `boolean` (not the `false` literal) so the gated branches don't
// read as statically unreachable to TypeScript.
export const REFERRAL_ENABLED: boolean = false;
