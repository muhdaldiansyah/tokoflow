// Billplz API types. Reference: https://www.billplz.com/api

export type BillplzBillState = "due" | "paid" | "deleted";

export interface BillplzCreateBillInput {
  collectionId: string;
  email: string;
  // E.164 without leading +, e.g. "60123456789". Optional but useful for receipts.
  mobile?: string;
  name: string;
  // Amount in cents. RM 1.00 = 100.
  amountCents: number;
  callbackUrl: string;
  // Browser redirect after payment attempt.
  redirectUrl?: string;
  description: string;
  // Arbitrary merchant references, surfaced back on callback.
  reference1Label?: string;
  reference1?: string;
  reference2Label?: string;
  reference2?: string;
  // Optional due date (ISO yyyy-mm-dd). Bill expires midnight of this day.
  dueAt?: string;
  // "true" to auto-delete unpaid bill when due_at passes.
  deliver?: boolean;
}

export interface BillplzBill {
  id: string;
  collection_id: string;
  paid: boolean;
  state: BillplzBillState;
  amount: number; // cents
  paid_amount: number; // cents
  due_at: string | null;
  email: string;
  mobile: string;
  name: string;
  url: string;
  reference_1_label: string | null;
  reference_1: string | null;
  reference_2_label: string | null;
  reference_2: string | null;
  redirect_url: string | null;
  callback_url: string;
  description: string;
  paid_at: string | null;
}

// Payload received on the `callback_url` POST when payment state changes.
// Spec: all fields arrive as strings (form-urlencoded). Includes `x_signature`.
export interface BillplzCallbackPayload {
  id: string;
  collection_id: string;
  paid: "true" | "false";
  state: BillplzBillState;
  amount: string;
  paid_amount: string;
  due_at: string;
  email: string;
  mobile: string;
  name: string;
  url: string;
  paid_at: string;
  transaction_id?: string;
  transaction_status?: string;
  x_signature: string;
  [key: string]: string | undefined;
}

// Unified payment order status — shared with existing Midtrans webhook downstream.
// Kept identical to lib/midtrans/types.ts::PaymentOrderStatus for swap-compatibility.
export type PaymentOrderStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "challenge";

export function mapBillplzStateToOrderStatus(
  state: BillplzBillState,
  paid: boolean,
): PaymentOrderStatus {
  if (state === "paid" || paid) return "completed";
  if (state === "deleted") return "cancelled";
  return "pending";
}
