/**
 * E-Invoice dispatcher — pick the right provider for a country context.
 *
 * Usage:
 *   const ctx = resolveCountry(profile.country);
 *   const provider = getEInvoiceProvider(ctx);
 *   const result = await provider.submit({ invoice, merchant, customer, ctx });
 *
 * Routes call this surface only — no provider-specific imports at the
 * call site, no `if (country === ...)` branching outside this file.
 */

import type { CountryContext, EInvoiceProviderName } from "@/lib/country";
import type { EInvoiceProvider } from "./provider";
import { myinvoisAdapter } from "./myinvois-adapter";
import { efakturAdapter } from "./efaktur-adapter";

const TABLE: Record<EInvoiceProviderName, EInvoiceProvider> = {
  myinvois: myinvoisAdapter,
  efaktur: efakturAdapter,
};

export function getEInvoiceProvider(
  ctx: CountryContext | EInvoiceProviderName,
): EInvoiceProvider {
  const name: EInvoiceProviderName = typeof ctx === "string" ? ctx : ctx.einvoice;
  const provider = TABLE[name];
  if (!provider) throw new Error(`Unknown e-Invoice provider: ${name}`);
  return provider;
}

export type { EInvoiceProvider } from "./provider";
export type {
  EInvoiceMerchantProfile,
  EInvoiceCustomer,
  EInvoiceSubmitResult,
  EInvoiceStatusResult,
  EInvoiceCancelResult,
  EInvoiceLifecycleStatus,
} from "./provider";
