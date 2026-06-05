/**
 * Payment dispatcher — pick the right gateway adapter for a country context.
 *
 * Usage:
 *   const ctx = resolveCountry(profile.country);
 *   const gateway = getPaymentGateway(ctx);
 *   const bill = await gateway.createBill({ ... });
 *
 * Routes call this surface only — no gateway-specific imports at the
 * call site, no `if (country === ...)` branching outside this file.
 */

import type { CountryContext, PaymentGatewayName } from "@/lib/country";
import type { PaymentGateway } from "./gateway";
import { billplzAdapter } from "./billplz-adapter";
import { midtransAdapter } from "./midtrans-adapter";

const TABLE: Record<PaymentGatewayName, PaymentGateway> = {
  billplz: billplzAdapter,
  midtrans: midtransAdapter,
};

export function getPaymentGateway(
  ctx: CountryContext | PaymentGatewayName,
): PaymentGateway {
  const name: PaymentGatewayName = typeof ctx === "string" ? ctx : ctx.payment;
  const gateway = TABLE[name];
  if (!gateway) throw new Error(`Unknown payment gateway: ${name}`);
  return gateway;
}

export type { PaymentGateway } from "./gateway";
export type {
  PaymentBillInput,
  PaymentBillResult,
  WebhookEvent,
  NormalizedPaymentStatus,
} from "./gateway";

export { generateReference } from "./billplz-adapter";
