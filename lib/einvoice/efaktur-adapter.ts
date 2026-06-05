/**
 * e-Faktur (DJP Coretax) adapter — Indonesia.
 *
 * Operational reality (2026):
 *   - Most ID mompreneur are non-PKP (revenue < IDR 4.8B/year) and do NOT need
 *     e-Faktur. The dispatcher only routes here for merchants who have flagged
 *     PKP status or are on the Business tier.
 *   - Coretax accepts XML upload via the DJP web portal AND has API endpoints
 *     for certified gateways. API integration is gated on PT incorporation +
 *     DJP cert (~6-8 weeks) which is post-launch work.
 *
 * Current behavior:
 *   - `submit()` generates the Coretax XML locally, stores it on the invoice
 *     record (caller persists `raw.xml` and a SHA-256 hash), and marks the
 *     status as `pending` — the merchant downloads the XML and uploads
 *     manually to djponline.pajak.go.id. When ID Business tier launches with
 *     real Coretax API integration, swap this implementation for an HTTP call.
 *   - `getStatus()` returns the locally-stored status. There's no async cert
 *     poll until API integration ships.
 *   - `cancel()` records a local cancellation note. (Coretax cancellation is
 *     done via replacement XML; no API call is required for the local record.)
 *
 * This honest stub keeps the dispatcher infrastructure ready and unblocks
 * MY production while ID Business tier ships in a future phase.
 */

import { generateEfakturXml, hashXml, type EfakturInvoice } from "./efaktur/generate-xml";
import { DEFAULT_TRX_CODE, type TrxCode } from "./efaktur/types";
import type {
  EInvoiceProvider,
  EInvoiceSubmitResult,
  EInvoiceStatusResult,
  EInvoiceCancelResult,
} from "./provider";

interface InvoiceLike {
  invoice_number: string;
  created_at: string;
  total: number;
  buyer_name?: string | null;
  buyer_address?: string | null;
  // Legacy ID columns repurposed natively for ID merchants
  buyer_npwp?: string | null;
  trx_code?: TrxCode | null;
  discount?: number | null;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    unit?: string | null;
  }>;
}

function toEfakturInvoice(inv: InvoiceLike): EfakturInvoice {
  return {
    invoice_number: inv.invoice_number,
    created_at: inv.created_at,
    buyer_name: inv.buyer_name,
    buyer_address: inv.buyer_address,
    buyer_npwp: inv.buyer_npwp,
    trx_code: inv.trx_code ?? DEFAULT_TRX_CODE,
    discount: inv.discount,
    items: inv.items,
  };
}

export const efakturAdapter: EInvoiceProvider = {
  name: "efaktur",
  format: "xml",
  country: "ID",

  validateInvoiceForSubmit(invoice: unknown): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    const inv = invoice as Partial<InvoiceLike> | null;
    if (!inv) {
      errors.push("Invoice payload missing.");
      return { ok: false, errors };
    }
    if (!inv.invoice_number) errors.push("Invoice number missing.");
    if (typeof inv.total !== "number" || inv.total < 0) errors.push("Invoice total invalid.");
    if (!inv.items || !Array.isArray(inv.items) || inv.items.length === 0) {
      errors.push("Invoice has no line items.");
    }
    return { ok: errors.length === 0, errors };
  },

  async submit({ invoice, merchant }): Promise<EInvoiceSubmitResult> {
    const inv = invoice as InvoiceLike;

    if (!merchant.npwp) {
      return {
        ok: false,
        status: "invalid",
        errors: [
          {
            code: "NPWP_MISSING",
            message:
              "NPWP merchant diperlukan untuk membuat e-Faktur. Lengkapi di Settings → Pajak.",
          },
        ],
      };
    }

    let xml: string;
    try {
      xml = generateEfakturXml({
        invoices: [toEfakturInvoice(inv)],
        sellerNpwp: merchant.npwp,
        sellerNitku: merchant.nitku,
      });
    } catch (err) {
      return {
        ok: false,
        status: "invalid",
        errors: [{ message: err instanceof Error ? err.message : String(err) }],
      };
    }

    const hash = await hashXml(xml);

    // Local-only "submission" — the merchant downloads this XML and uploads
    // manually to Coretax. The status stays `pending` until the merchant
    // marks it valid in the UI (or future API integration polls Coretax).
    return {
      ok: true,
      externalId: `local:${hash.slice(0, 16)}`,
      status: "pending",
      raw: { xml, hash, format: "xml", deliveryMode: "manual_upload" },
    };
  },

  async getStatus(): Promise<EInvoiceStatusResult> {
    // Until DJP Coretax API integration ships, status is whatever we last
    // persisted locally. Return `pending` as a safe default — the route layer
    // reads the stored DB value and overlays it on this response.
    return { status: "pending" };
  },

  async cancel({ reason }): Promise<EInvoiceCancelResult> {
    // Coretax cancellation is done via replacement XML (TaxInvoiceOpt = "Replace"),
    // not an API call. For now we just record the local cancellation event.
    return {
      ok: true,
      cancelledAt: new Date().toISOString(),
      raw: { reason, deliveryMode: "manual_replacement" },
    };
  },
};
