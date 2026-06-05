/**
 * Billplz adapter — Malaysia.
 *
 * Wraps the existing `lib/billplz/` client behind the gateway-agnostic
 * `PaymentGateway` interface.
 */

import { createBill, getBill, generateReference } from "@/lib/billplz";
import { verifyXSignature } from "@/lib/billplz/verify";
import {
  mapBillplzStateToOrderStatus,
  type BillplzCallbackPayload,
} from "@/lib/billplz/types";
import { toMinorUnits, fromMinorUnits } from "@/lib/currency/format";
import type {
  PaymentGateway,
  PaymentBillInput,
  PaymentBillResult,
  WebhookEvent,
  NormalizedPaymentStatus,
} from "./gateway";

function requireCollectionId(): string {
  const id = process.env.BILLPLZ_COLLECTION_ID;
  if (!id) throw new Error("BILLPLZ_COLLECTION_ID is not configured");
  return id;
}

export const billplzAdapter: PaymentGateway = {
  name: "billplz",

  async createBill(input: PaymentBillInput): Promise<PaymentBillResult> {
    if (input.currency !== "MYR") {
      throw new Error(`Billplz only supports MYR; got ${input.currency}`);
    }

    const bill = await createBill({
      collectionId: requireCollectionId(),
      email: input.email,
      name: input.name,
      mobile: input.mobile,
      amountCents: toMinorUnits(input.amount, "MY"),
      callbackUrl: input.callbackUrl,
      redirectUrl: input.redirectUrl,
      description: input.description,
      reference1Label: input.planCode ? "plan" : undefined,
      reference1: input.planCode,
      reference2Label: "ref",
      reference2: input.reference,
      deliver: false,
    });

    return { id: bill.id, url: bill.url, reference: input.reference };
  },

  async verifyWebhook(req: Request): Promise<WebhookEvent | null> {
    let params: Record<string, string> = {};
    try {
      const contentType = req.headers.get("content-type") ?? "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const body = await req.text();
        const search = new URLSearchParams(body);
        for (const [k, v] of search.entries()) params[k] = v;
      } else {
        params = (await req.json()) as Record<string, string>;
      }
    } catch {
      return null;
    }

    if (!verifyXSignature(params)) return null;

    const payload = params as unknown as BillplzCallbackPayload;
    const status: NormalizedPaymentStatus = mapBillplzStateToOrderStatus(
      payload.state,
      payload.paid === "true",
    );

    const paidCents = Number(payload.paid_amount);
    const paidAmount = Number.isFinite(paidCents)
      ? fromMinorUnits(paidCents, "MY")
      : 0;

    return {
      billId: payload.id,
      reference: payload.reference_2 ?? "",
      status,
      paidAmount,
      currency: "MYR",
      paidAt: payload.paid_at || null,
      raw: payload,
    };
  },

  async getBillStatus(billId: string) {
    const bill = await getBill(billId);
    return {
      status: mapBillplzStateToOrderStatus(bill.state, bill.paid),
      paidAmount: fromMinorUnits(bill.paid_amount, "MY"),
      paidAt: bill.paid_at,
    };
  },
};

export { generateReference };
