import type { BillplzBill, BillplzCreateBillInput } from "./types";

const DEFAULT_SANDBOX = "https://www.billplz-sandbox.com/api/v3";
const DEFAULT_PROD = "https://www.billplz.com/api/v3";

function getBase(): string {
  if (process.env.BILLPLZ_BASE_URL) return process.env.BILLPLZ_BASE_URL;
  return process.env.NODE_ENV === "production" ? DEFAULT_PROD : DEFAULT_SANDBOX;
}

function envApiKey(): string {
  const key = process.env.BILLPLZ_API_KEY;
  if (!key) {
    throw new Error(
      "BILLPLZ_API_KEY is not set. Configure it in env before calling Billplz with the platform key.",
    );
  }
  return key;
}

// Resolve the API key. If `override` is passed, use it (per-merchant flow).
// Otherwise fall back to env (Tokoflow's own subscription billing).
function resolveApiKey(override?: string): string {
  const trimmed = override?.trim();
  if (trimmed) return trimmed;
  return envApiKey();
}

function authHeader(apiKey: string): string {
  return "Basic " + Buffer.from(`${apiKey}:`).toString("base64");
}

interface FetchOptions extends RequestInit {
  form?: Record<string, string>;
  apiKey?: string;
}

async function billplzFetch<T>(path: string, init: FetchOptions = {}): Promise<T> {
  const { form, apiKey: apiKeyOverride, ...rest } = init;
  const apiKey = resolveApiKey(apiKeyOverride);
  const headers: Record<string, string> = {
    Authorization: authHeader(apiKey),
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

// `apiKey` optional. When omitted, falls back to BILLPLZ_API_KEY env.
// When provided (per-merchant flow), bills are created on the merchant's
// own Billplz account — funds settle to their bank, not Tokoflow's.
export async function createBill(
  input: BillplzCreateBillInput,
  apiKey?: string,
): Promise<BillplzBill> {
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

  return billplzFetch<BillplzBill>("/bills", { method: "POST", form, apiKey });
}

export async function getBill(id: string, apiKey?: string): Promise<BillplzBill> {
  return billplzFetch<BillplzBill>(`/bills/${id}`, { method: "GET", apiKey });
}

// Smoke test for merchant-pasted credentials. Calls a cheap GET that requires
// a valid API key. We use /collections (lists merchant's collections) — a
// successful response means the key authenticates. Returns the parsed body
// so the caller can confirm the collection_id exists.
export async function listCollections(apiKey: string): Promise<{ collections: Array<{ id: string; title: string }> }> {
  return billplzFetch<{ collections: Array<{ id: string; title: string }> }>(
    "/collections",
    { method: "GET", apiKey },
  );
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
