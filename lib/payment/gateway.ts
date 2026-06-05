/**
 * Country-agnostic payment gateway interface.
 *
 * Two concrete implementations:
 * - Billplz (MY) — `lib/payment/billplz-adapter.ts` (wraps existing lib/billplz/)
 * - Midtrans (ID) — `lib/payment/midtrans-adapter.ts` (Snap API)
 *
 * Routes obtain the right adapter via `getPaymentGateway(ctx)` and call this
 * surface only — no `if (country === ...)` branching at the call site.
 */

import type { PaymentGatewayName } from "@/lib/country";

export interface PaymentBillInput {
  email: string;
  name: string;
  /** International-format phone without "+" (60... or 62...). Optional. */
  mobile?: string;
  /** Amount in major units (RM or Rp, no fractional manipulation). Adapter handles minor-unit conversion. */
  amount: number;
  /** Display currency. MUST match `ctx.currency`. */
  currency: "MYR" | "IDR";
  /** Server-to-server callback URL (webhook). */
  callbackUrl: string;
  /** Browser redirect after payment attempt. */
  redirectUrl: string;
  /** Free-form description shown on the gateway's payment page. */
  description: string;
  /** Internal payment_orders reference. The gateway echoes it back on webhook. */
  reference: string;
  /** Optional plan code, surfaced as a gateway reference field. */
  planCode?: string;
}

export interface PaymentBillResult {
  /** Gateway-side bill/transaction id. */
  id: string;
  /** URL the merchant redirects to for payment. */
  url: string;
  /** Echo of `reference` from the input — used by webhook logic. */
  reference: string;
}

export type NormalizedPaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "challenge";

export interface WebhookEvent {
  /** The gateway's bill id — must match a `payment_orders.gateway_bill_id` row. */
  billId: string;
  /** Internal reference echoed back. */
  reference: string;
  /** Normalized status across gateways. */
  status: NormalizedPaymentStatus;
  /** Amount paid in major units. */
  paidAmount: number;
  /** Currency code. */
  currency: "MYR" | "IDR";
  /** Gateway timestamp (ISO 8601) of the payment event, when available. */
  paidAt: string | null;
  /** Raw payload kept for forensic logging. */
  raw: unknown;
}

export interface PaymentGateway {
  name: PaymentGatewayName;

  /** Create a payment bill / transaction. */
  createBill(input: PaymentBillInput): Promise<PaymentBillResult>;

  /**
   * Verify and parse an incoming webhook request.
   * Returns null if the signature is invalid (caller should 200-OK + log,
   * to avoid retry storms) — never throw on invalid signatures.
   */
  verifyWebhook(req: Request): Promise<WebhookEvent | null>;

  /**
   * Server-side bill status lookup. Used for idempotency / retry logic in
   * webhook processing and for status-poll endpoints.
   */
  getBillStatus(billId: string): Promise<{
    status: NormalizedPaymentStatus;
    paidAmount: number;
    paidAt: string | null;
  }>;
}
