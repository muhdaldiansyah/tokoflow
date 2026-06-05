/**
 * MyInvois adapter — Malaysia.
 *
 * Wraps the existing `lib/myinvois/` client + the `features/invoices/services/myinvois-adapter.ts`
 * document builder behind the gateway-agnostic `EInvoiceProvider` interface.
 */

import {
  submitDocuments,
  getDocumentStatus,
  cancelDocument,
} from "@/lib/myinvois";
import {
  invoiceToMyInvoisDocument,
  type MerchantProfileForInvoice,
} from "@/features/invoices/services/myinvois-adapter";
import type { Invoice } from "@/features/invoices/types/invoice.types";
import type {
  EInvoiceProvider,
  EInvoiceMerchantProfile,
  EInvoiceSubmitResult,
  EInvoiceStatusResult,
  EInvoiceCancelResult,
  EInvoiceLifecycleStatus,
} from "./provider";

function mapMyInvoisStatus(s: string | null | undefined): EInvoiceLifecycleStatus {
  switch ((s ?? "").toLowerCase()) {
    case "valid":
      return "valid";
    case "invalid":
      return "invalid";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "rejected":
      return "rejected";
    case "submitted":
    case "in_progress":
    case "processing":
      return "pending";
    default:
      return "pending";
  }
}

function toMerchantProfileForDoc(
  m: EInvoiceMerchantProfile,
): MerchantProfileForInvoice {
  return {
    business_name: m.business_name ?? m.full_name ?? "Tokoflow merchant",
    business_address: m.business_address,
    business_phone: m.business_phone,
    business_email: m.email,
    tin: m.tin,
    brn: m.brn,
    sst_registration_id: m.sst_registration_id,
    city: undefined, // populated from invoice/profile state in caller
  };
}

export const myinvoisAdapter: EInvoiceProvider = {
  name: "myinvois",
  format: "json",
  country: "MY",

  validateInvoiceForSubmit(invoice: unknown): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    const inv = invoice as Partial<Invoice> | null;
    if (!inv) {
      errors.push("Invoice payload missing.");
      return { ok: false, errors };
    }
    if (!inv.invoice_number) errors.push("Invoice number missing.");
    if (typeof inv.total !== "number" || inv.total < 0) errors.push("Invoice total invalid.");
    return { ok: errors.length === 0, errors };
  },

  async submit({ invoice, merchant }): Promise<EInvoiceSubmitResult> {
    const inv = invoice as Invoice;
    const profile = toMerchantProfileForDoc(merchant);

    if (!profile.tin) {
      return {
        ok: false,
        status: "invalid",
        errors: [{ code: "TIN_MISSING", message: "Merchant TIN required for MyInvois submission." }],
      };
    }

    const document = invoiceToMyInvoisDocument(inv, profile, {});
    const response = await submitDocuments([document]);

    const accepted = response.acceptedDocuments?.[0];
    const rejected = response.rejectedDocuments?.[0];

    if (rejected) {
      const detailErrors = (rejected.error?.details ?? [])
        .map((d) => {
          if (d && typeof d === "object") {
            const obj = d as { code?: string; message?: string };
            return { code: obj.code, message: obj.message ?? "Rejected" };
          }
          return { message: String(d) };
        });
      return {
        ok: false,
        externalId: response.submissionUid,
        status: "invalid",
        errors:
          detailErrors.length > 0
            ? detailErrors
            : [{ message: rejected.error?.message ?? "Rejected" }],
        raw: response,
      };
    }

    return {
      ok: true,
      externalId: response.submissionUid,
      externalUuid: accepted?.uuid,
      status: "pending",
      raw: response,
    };
  },

  async getStatus({ externalId }): Promise<EInvoiceStatusResult> {
    // For MyInvois, externalId is treated as the document UUID for status queries.
    // (Submission-level lookup uses getSubmission(); document lookup uses getDocumentStatus(uuid).)
    const doc = await getDocumentStatus(externalId);
    return {
      status: mapMyInvoisStatus(doc.status),
      externalUuid: doc.uuid,
      longId: doc.longId ?? undefined,
      validatedAt: doc.dateTimeValidated ?? null,
      raw: doc,
    };
  },

  async cancel({ externalUuid, reason }): Promise<EInvoiceCancelResult> {
    try {
      const res = await cancelDocument(externalUuid, reason);
      return {
        ok: true,
        cancelledAt: new Date().toISOString(),
        raw: res,
      };
    } catch (err) {
      return {
        ok: false,
        errors: [{ message: err instanceof Error ? err.message : String(err) }],
      };
    }
  },
};
