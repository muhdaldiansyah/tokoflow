/**
 * Midtrans adapter — Indonesia.
 *
 * Implements the Snap API directly (no `midtrans-client` SDK) to mirror the
 * zero-dependency pattern of `lib/billplz/`. Snap returns a `redirect_url`
 * which the merchant browser opens — gateway-hosted payment page that handles
 * BCA / Mandiri / BRI / BNI VA, GoPay, OVO, DANA, ShopeePay, QRIS, credit
 * card. Webhook signature is SHA-512 of `orderId + statusCode + grossAmount + serverKey`.
 *
 * Docs: https://docs.midtrans.com/reference/getting-started-snap-api
 */

import crypto from "node:crypto";
import { toMinorUnits } from "@/lib/currency/format";
import type {
  PaymentGateway,
  PaymentBillInput,
  PaymentBillResult,
  WebhookEvent,
  NormalizedPaymentStatus,
} from "./gateway";

const DEFAULT_SANDBOX = "https://app.sandbox.midtrans.com/snap/v1";
const DEFAULT_PROD = "https://app.midtrans.com/snap/v1";
const DEFAULT_SANDBOX_API = "https://api.sandbox.midtrans.com/v2";
const DEFAULT_PROD_API = "https://api.midtrans.com/v2";

function isProduction(): boolean {
  return (process.env.MIDTRANS_SERVER_KEY ?? "").startsWith("Mid-server-");
}

function getSnapBase(): string {
  if (process.env.MIDTRANS_SNAP_URL) return process.env.MIDTRANS_SNAP_URL;
  return isProduction() ? DEFAULT_PROD : DEFAULT_SANDBOX;
}

function getApiBase(): string {
  if (process.env.MIDTRANS_API_URL) return process.env.MIDTRANS_API_URL;
  return isProduction() ? DEFAULT_PROD_API : DEFAULT_SANDBOX_API;
}

function requireServerKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY is not configured");
  return key;
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${requireServerKey()}:`).toString("base64");
}

interface SnapTransactionResponse {
  token: string;
  redirect_url: string;
}

interface MidtransNotificationPayload {
  transaction_time?: string;
  transaction_status?: string;
  transaction_id?: string;
  status_message?: string;
  status_code?: string;
  signature_key?: string;
  payment_type?: string;
  order_id: string;
  merchant_id?: string;
  gross_amount: string;
  fraud_status?: string;
  currency?: string;
  settlement_time?: string;
  [key: string]: string | undefined;
}

function mapMidtransStatus(
  transactionStatus: string | undefined,
  fraudStatus: string | undefined,
): NormalizedPaymentStatus {
  if (!transactionStatus) return "pending";
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "challenge" ? "challenge" : "completed";
    case "settlement":
      return "completed";
    case "pending":
      return "pending";
    case "deny":
    case "expire":
      return "failed";
    case "cancel":
    case "refund":
    case "partial_refund":
      return "cancelled";
    default:
      return "pending";
  }
}

/**
 * Verify Midtrans webhook signature.
 * signature = SHA-512(orderId + statusCode + grossAmount + serverKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string | undefined,
  grossAmount: string,
  signatureKey: string | undefined,
): boolean {
  if (!statusCode || !signatureKey) return false;
  const input = orderId + statusCode + grossAmount + requireServerKey();
  const hash = crypto.createHash("sha512").update(input).digest("hex");

  // Timing-safe comparison
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(signatureKey, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const midtransAdapter: PaymentGateway = {
  name: "midtrans",

  async createBill(input: PaymentBillInput): Promise<PaymentBillResult> {
    if (input.currency !== "IDR") {
      throw new Error(`Midtrans only supports IDR; got ${input.currency}`);
    }

    const grossAmount = toMinorUnits(input.amount, "ID"); // IDR has no minor unit; this is Math.round(amount)
    const orderId = input.reference; // Use our internal reference as Midtrans order_id

    const body = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: input.name,
        email: input.email,
        ...(input.mobile ? { phone: input.mobile } : {}),
      },
      item_details: [
        {
          id: input.planCode ?? "tokoflow",
          name: input.description.slice(0, 50), // Midtrans caps name at 50 chars
          quantity: 1,
          price: grossAmount,
        },
      ],
      callbacks: {
        finish: input.redirectUrl,
      },
      // Note: Midtrans webhook is configured at the merchant dashboard level,
      // not per-transaction. `input.callbackUrl` is informational only here —
      // the route file expects callbacks to land at /api/billing/midtrans-webhook.
    };

    const res = await fetch(`${getSnapBase()}/transactions`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Midtrans Snap ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = JSON.parse(text) as SnapTransactionResponse;
    return { id: orderId, url: json.redirect_url, reference: orderId };
  },

  async verifyWebhook(req: Request): Promise<WebhookEvent | null> {
    let payload: MidtransNotificationPayload;
    try {
      payload = (await req.json()) as MidtransNotificationPayload;
    } catch {
      return null;
    }

    const valid = verifyMidtransSignature(
      payload.order_id,
      payload.status_code,
      payload.gross_amount,
      payload.signature_key,
    );
    if (!valid) return null;

    const status = mapMidtransStatus(payload.transaction_status, payload.fraud_status);
    const grossAmount = Number(payload.gross_amount);
    const paidAmount = Number.isFinite(grossAmount) ? grossAmount : 0;

    return {
      billId: payload.order_id,
      reference: payload.order_id,
      status,
      paidAmount, // IDR major-unit (Midtrans returns "99000.00" for Rp 99,000)
      currency: "IDR",
      paidAt: payload.settlement_time ?? payload.transaction_time ?? null,
      raw: payload,
    };
  },

  async getBillStatus(billId: string) {
    const res = await fetch(`${getApiBase()}/${encodeURIComponent(billId)}/status`, {
      method: "GET",
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
      },
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Midtrans status ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = JSON.parse(text) as MidtransNotificationPayload;
    return {
      status: mapMidtransStatus(json.transaction_status, json.fraud_status),
      paidAmount: Number(json.gross_amount) || 0,
      paidAt: json.settlement_time ?? json.transaction_time ?? null,
    };
  },
};
