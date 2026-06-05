/**
 * Country-agnostic e-Invoice provider interface.
 *
 * Two concrete implementations:
 * - MyInvois (MY) — `lib/einvoice/myinvois-adapter.ts` (UBL 2.1 JSON, async cert)
 * - e-Faktur Coretax (ID) — `lib/einvoice/efaktur-adapter.ts` (XML, sync issue)
 *
 * Routes obtain the right provider via `getEInvoiceProvider(ctx)` and call
 * this surface only — no provider-specific imports at the call site.
 */

import type { CountryContext, EInvoiceProviderName } from "@/lib/country";

export type EInvoiceLifecycleStatus =
  | "draft"
  | "pending"
  | "valid"
  | "invalid"
  | "cancelled"
  | "rejected";

export interface EInvoiceMerchantProfile {
  id: string;
  business_name: string | null;
  full_name: string | null;
  business_phone: string | null;
  email: string | null;
  business_address: string | null;
  business_state: string | null;
  postal_code: string | null;
  // MY tax IDs
  tin?: string | null;
  brn?: string | null;
  sst_registration_id?: string | null;
  myinvois_client_id?: string | null;
  myinvois_client_secret_enc?: string | null;
  // ID tax IDs (legacy columns repurposed for native ID merchants)
  npwp?: string | null;
  nitku?: string | null;
}

export interface EInvoiceCustomer {
  id: string | null;
  name: string | null;
  phone: string | null;
  email?: string | null;
  // MY
  tin?: string | null;
  brn?: string | null;
  sst_registration_id?: string | null;
  // ID
  npwp?: string | null;
}

export interface EInvoiceSubmitResult {
  ok: boolean;
  /** Provider-side submission identifier (MyInvois submissionUid; e-Faktur batchId). */
  externalId?: string;
  /** Final document UUID (MyInvois UUID; e-Faktur noFakturPajak). */
  externalUuid?: string;
  /** Validation/long-id reference for receipt PDFs and customer share. */
  longId?: string;
  /** Initial status post-submit. */
  status: EInvoiceLifecycleStatus;
  /** Provider-side errors if any. */
  errors?: Array<{ code?: string; message: string }>;
  /** Raw payload kept for forensic logging. */
  raw?: unknown;
}

export interface EInvoiceStatusResult {
  status: EInvoiceLifecycleStatus;
  externalUuid?: string;
  longId?: string;
  validatedAt?: string | null;
  errors?: Array<{ code?: string; message: string }>;
  raw?: unknown;
}

export interface EInvoiceCancelResult {
  ok: boolean;
  cancelledAt?: string | null;
  errors?: Array<{ code?: string; message: string }>;
  raw?: unknown;
}

export interface EInvoiceProvider {
  name: EInvoiceProviderName;
  format: "json" | "xml";

  /** Country this provider serves. */
  country: "MY" | "ID";

  /**
   * Pre-flight validation of the invoice payload before submission.
   * Returns user-facing error strings — empty array means OK to submit.
   */
  validateInvoiceForSubmit(invoice: unknown): { ok: boolean; errors: string[] };

  /** Submit a new e-invoice document. */
  submit(args: {
    invoice: unknown;
    merchant: EInvoiceMerchantProfile;
    customer: EInvoiceCustomer | null;
    ctx: CountryContext;
  }): Promise<EInvoiceSubmitResult>;

  /** Look up a submitted document's status. */
  getStatus(args: {
    externalId: string;
    merchant: EInvoiceMerchantProfile;
    ctx: CountryContext;
  }): Promise<EInvoiceStatusResult>;

  /** Cancel a submitted document. MyInvois has 72h window; e-Faktur uses replace flow. */
  cancel(args: {
    externalUuid: string;
    reason: string;
    merchant: EInvoiceMerchantProfile;
    ctx: CountryContext;
  }): Promise<EInvoiceCancelResult>;
}
