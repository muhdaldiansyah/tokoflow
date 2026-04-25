import type {
  MyInvoisDocumentStatus,
  MyInvoisSubmitRequest,
  MyInvoisSubmitResponse,
} from "./types";
import type { GeneratedInvoice } from "./generate-json";

const DEFAULT_PREPROD = "https://preprod-api.myinvois.hasil.gov.my";
const DEFAULT_PROD = "https://api.myinvois.hasil.gov.my";

function getApiBase(): string {
  if (process.env.MYINVOIS_BASE_URL) return process.env.MYINVOIS_BASE_URL;
  return process.env.NODE_ENV === "production" ? DEFAULT_PROD : DEFAULT_PREPROD;
}

function getIdentityBase(): string {
  if (process.env.MYINVOIS_IDENTITY_BASE) return process.env.MYINVOIS_IDENTITY_BASE;
  return process.env.NODE_ENV === "production" ? DEFAULT_PROD : DEFAULT_PREPROD;
}

// In-memory token cache. Tokens last ~1h; refresh on demand. The pending
// promise is shared so concurrent callers during a refresh wait on the same
// fetch — without it, two parallel submissions during expiry would each fire
// their own OAuth call and race to overwrite cachedToken.
type CachedToken = { token: string; expiresAt: number };
let cachedToken: CachedToken | null = null;
let pendingRefresh: Promise<string> | null = null;

async function fetchNewToken(): Promise<string> {
  const clientId = process.env.MYINVOIS_CLIENT_ID;
  const clientSecret = process.env.MYINVOIS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "MYINVOIS_CLIENT_ID / MYINVOIS_CLIENT_SECRET not set. Register an ERP system in the MyInvois portal.",
    );
  }

  const res = await fetch(`${getIdentityBase()}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "InvoicingAPI",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MyInvois OAuth ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  if (!json.access_token) {
    throw new Error("MyInvois OAuth: no access_token returned");
  }

  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = fetchNewToken().finally(() => {
    pendingRefresh = null;
  });
  return pendingRefresh;
}

async function myInvoisFetch<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`MyInvois ${init.method ?? "GET"} ${path} ${res.status}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/**
 * Submit one or more invoices. LHDN processes asynchronously — the response gives
 * accepted UUIDs + rejected-document errors. Poll status for final validation.
 */
export async function submitDocuments(
  generated: GeneratedInvoice[],
): Promise<MyInvoisSubmitResponse> {
  const body: MyInvoisSubmitRequest = {
    documents: generated.map((g) => ({
      format: "JSON",
      document: g.base64,
      documentHash: g.hash,
      codeNumber: g.codeNumber,
    })),
  };

  return myInvoisFetch<MyInvoisSubmitResponse>(
    "/api/v1.0/documentsubmissions",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/**
 * Fetch a single document's validation status. Use this to poll after submission.
 */
export async function getDocumentStatus(uuid: string): Promise<MyInvoisDocumentStatus> {
  return myInvoisFetch<MyInvoisDocumentStatus>(
    `/api/v1.0/documents/${encodeURIComponent(uuid)}/details`,
    { method: "GET" },
  );
}

/**
 * Cancel a previously-submitted document within the 72-hour cancellation window.
 */
export async function cancelDocument(
  uuid: string,
  reason: string,
): Promise<void> {
  await myInvoisFetch<void>(
    `/api/v1.0/documents/state/${encodeURIComponent(uuid)}/state`,
    {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled", reason }),
    },
  );
}

/**
 * Request rejection of a received document (buyer action). 72-hour window.
 */
export async function rejectDocument(
  uuid: string,
  reason: string,
): Promise<void> {
  await myInvoisFetch<void>(
    `/api/v1.0/documents/state/${encodeURIComponent(uuid)}/state`,
    {
      method: "PUT",
      body: JSON.stringify({ status: "rejected", reason }),
    },
  );
}

/**
 * Fetch an existing submission's summary by its submissionUid.
 */
export async function getSubmission(submissionUid: string): Promise<{
  submissionUid: string;
  documentCount: number;
  dateTimeReceived: string;
  overallStatus: string;
  documentSummary: Array<{
    uuid: string;
    status: MyInvoisDocumentStatus["status"];
    internalId: string;
    totalPayableAmount: number;
  }>;
}> {
  return myInvoisFetch(
    `/api/v1.0/documentsubmissions/${encodeURIComponent(submissionUid)}`,
    { method: "GET" },
  );
}
