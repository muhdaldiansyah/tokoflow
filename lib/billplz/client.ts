import type { BillplzBill, BillplzCreateBillInput } from "./types";

const DEFAULT_SANDBOX = "https://www.billplz-sandbox.com/api/v3";
const DEFAULT_PROD = "https://www.billplz.com/api/v3";

function getBase(): string {
  if (process.env.BILLPLZ_BASE_URL) return process.env.BILLPLZ_BASE_URL;
  return process.env.NODE_ENV === "production" ? DEFAULT_PROD : DEFAULT_SANDBOX;
}

function getApiKey(): string {
  const key = process.env.BILLPLZ_API_KEY;
  if (!key) {
    throw new Error(
      "BILLPLZ_API_KEY is not set. Configure it in env before calling Billplz.",
    );
  }
  return key;
}

function authHeader(): string {
  const key = getApiKey();
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

async function billplzFetch<T>(
  path: string,
  init: RequestInit & { form?: Record<string, string> } = {},
): Promise<T> {
  const { form, ...rest } = init;
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    ...(rest.headers as Record<string, string> | undefined),
  };

  let body = rest.body;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  }

  const res = await fetch(`${getBase()}${path}`, { ...rest, headers, body });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Billplz ${rest.method ?? "GET"} ${path} ${res.status}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function createBill(input: BillplzCreateBillInput): Promise<BillplzBill> {
  const form: Record<string, string> = {
    collection_id: input.collectionId,
    email: input.email,
    name: input.name,
    amount: String(input.amountCents),
    callback_url: input.callbackUrl,
    description: input.description,
  };
  if (input.mobile) form.mobile = input.mobile;
  if (input.redirectUrl) form.redirect_url = input.redirectUrl;
  if (input.reference1Label) form.reference_1_label = input.reference1Label;
  if (input.reference1) form.reference_1 = input.reference1;
  if (input.reference2Label) form.reference_2_label = input.reference2Label;
  if (input.reference2) form.reference_2 = input.reference2;
  if (input.dueAt) form.due_at = input.dueAt;
  if (input.deliver !== undefined) form.deliver = input.deliver ? "true" : "false";

  return billplzFetch<BillplzBill>("/bills", { method: "POST", form });
}

export async function getBill(id: string): Promise<BillplzBill> {
  return billplzFetch<BillplzBill>(`/bills/${id}`, { method: "GET" });
}

// Stable merchant-side reference for pairing with our payment_orders row.
// Format: PAY-<base36 time>-<random6>. Webhook/reconciliation logic uses this
// gateway-agnostic shape so a future payment-gateway swap stays mechanical.
export function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `PAY-${timestamp}-${random}`.toUpperCase();
}

// Convert whole-ringgit value (from config/plans.ts) to Billplz cents.
export function ringgitToCents(ringgit: number): number {
  return Math.round(ringgit * 100);
}
