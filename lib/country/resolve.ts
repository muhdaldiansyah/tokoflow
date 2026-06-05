/**
 * Country axis — Tokoflow's tenant dimension.
 *
 * Every country-coupled decision (currency, payment gateway, e-invoice
 * provider, locale, timezone, phone format, tax rules) flows through
 * `resolveCountry()`. No `if (country === "MY")` branching elsewhere.
 *
 * Default is ID — Tokoflow is the Indonesia deployment of this codebase.
 * A NULL/unknown `profiles.country` resolves to ID; only an explicit "MY"
 * selects the (dormant) Malaysia context. Migration 110 flips the DB column
 * default to 'ID' so trigger-created profiles inherit it.
 */

export type Country = "MY" | "ID";

export const COUNTRIES = ["MY", "ID"] as const satisfies readonly Country[];

export type Currency = "MYR" | "IDR";
export type CurrencySymbol = "RM" | "Rp";
export type Locale = "en-MY" | "id-ID";
export type Timezone = "Asia/Kuala_Lumpur" | "Asia/Jakarta";
export type PaymentGatewayName = "billplz" | "midtrans";
export type EInvoiceProviderName = "myinvois" | "efaktur";

export interface CountryContext {
  /** ISO 3166-1 alpha-2 code. Tenant axis. */
  code: Country;

  // — Money —
  currency: Currency;
  currencySymbol: CurrencySymbol;
  /** Smallest currency unit per major unit. MYR has 100 sen; IDR has 0 (no fractional). */
  minorUnitFactor: 100 | 1;

  // — Locale & time —
  locale: Locale;
  tz: Timezone;
  /** Minutes east of UTC. MYT = +480, WIB = +420. */
  tzOffsetMinutes: 480 | 420;

  // — Phone —
  /** International dial prefix without "+". MY = 60, ID = 62. */
  phonePrefix: "60" | "62";
  /** Example phone for placeholder text. */
  phoneExample: string;

  // — Payment & tax —
  payment: PaymentGatewayName;
  einvoice: EInvoiceProviderName;
  /** Common name of the consumption tax. */
  taxName: "SST" | "PPN";
  /** Allowed tax rate values (percent). */
  taxRates: readonly number[];
  /** Field label for tax identification number. */
  taxIdLabel: "TIN" | "NPWP";
  /** Field label for business registration number. */
  busRegLabel: "BRN" | "NIB";
  /** Field label for tax registration ID. */
  taxRegLabel: "SST Reg" | "PKP NPWP";
  /** Common name of the legal entity form for the operating company. */
  legalEntity: "Sdn Bhd" | "PT";

  // — Operations —
  /** Default quiet hours window in local clock, used when merchant hasn't set it. */
  quietHoursDefault: { start: `${number}:${number}`; end: `${number}:${number}` };
  /** Free-tier starter order quota (same across countries today, kept here for symmetry). */
  freeOrderQuota: number;

  // — Domain & branding —
  /** Public domain Tokoflow operates on for this country. */
  domain: "tokoflow.com" | "tokoflow.co.id";
}

const MY: CountryContext = {
  code: "MY",
  currency: "MYR",
  currencySymbol: "RM",
  minorUnitFactor: 100,
  locale: "en-MY",
  tz: "Asia/Kuala_Lumpur",
  tzOffsetMinutes: 480,
  phonePrefix: "60",
  phoneExample: "012-345 6789",
  payment: "billplz",
  einvoice: "myinvois",
  taxName: "SST",
  taxRates: [0, 6],
  taxIdLabel: "TIN",
  busRegLabel: "BRN",
  taxRegLabel: "SST Reg",
  legalEntity: "Sdn Bhd",
  quietHoursDefault: { start: "22:00", end: "06:00" },
  freeOrderQuota: 50,
  domain: "tokoflow.com",
};

const ID: CountryContext = {
  code: "ID",
  currency: "IDR",
  currencySymbol: "Rp",
  minorUnitFactor: 1,
  locale: "id-ID",
  tz: "Asia/Jakarta",
  tzOffsetMinutes: 420,
  phonePrefix: "62",
  phoneExample: "0812-3456-7890",
  payment: "midtrans",
  einvoice: "efaktur",
  taxName: "PPN",
  taxRates: [0, 11, 12],
  taxIdLabel: "NPWP",
  busRegLabel: "NIB",
  taxRegLabel: "PKP NPWP",
  legalEntity: "PT",
  quietHoursDefault: { start: "21:00", end: "05:00" },
  freeOrderQuota: 50,
  domain: "tokoflow.co.id",
};

const TABLE: Record<Country, CountryContext> = { MY, ID };

/**
 * Resolve a country code to its full operational context.
 * Pass NULL/undefined to get ID (Tokoflow's default deployment country).
 */
export function resolveCountry(code: Country | string | null | undefined): CountryContext {
  if (code === "MY") return MY;
  return ID;
}

/** Type guard — narrows arbitrary string to a valid Country code. */
export function isCountry(code: unknown): code is Country {
  return code === "MY" || code === "ID";
}

/**
 * Best-effort country inference from a phone number.
 * "0123456789"     → MY (10 digits, leading 0, no other country signal)
 * "+60123456789"   → MY
 * "+6281234567890" → ID
 * "081234567890"   → ID (12 digits, leading 0)
 *
 * Use this as a *suggestion* on signup forms — always confirm with the merchant.
 */
export function inferCountryFromPhone(phone: string | null | undefined): Country | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("60")) return "MY";
  if (digits.startsWith("62")) return "ID";

  // Heuristic on national-format numbers: ID national numbers are typically
  // 10-13 digits (08xx + 8-10 more). MY national numbers are 10-11 digits
  // (01x + 7-8 more). Fall back on length when prefix is ambiguous.
  if (digits.startsWith("08")) return "ID";
  if (digits.startsWith("01")) return "MY";

  return null;
}

/** Lookup by domain — used by middleware/edge to set country cookie default. */
export function countryFromHost(host: string | null | undefined): Country | null {
  if (!host) return null;
  const lower = host.toLowerCase();
  // Tokoflow is Indonesia-first: only an explicit .my host selects Malaysia.
  if (lower.endsWith(".my") || lower.endsWith("tokoflow.my")) return "MY";
  return "ID";
}

export { MY as MY_CONTEXT, ID as ID_CONTEXT, TABLE as COUNTRY_TABLE };
