import type { Invoice } from "../types/invoice.types";
import type {
  MyInvoisInvoice,
  MyInvoisLineItem,
  MyInvoisParty,
} from "@/lib/myinvois";
import {
  computeInvoiceTotals,
  generateMyInvoisDocument,
  MY_INVOIS_WALK_IN_BUYER,
  MY_STATE_CODES,
  type GeneratedInvoice,
} from "@/lib/myinvois";

/**
 * Adapter: map a Tokoflow DB Invoice row + merchant profile to a MyInvois UBL 2.1 document.
 * The resulting `GeneratedInvoice` is ready for `submitDocuments()` to LHDN.
 */

export interface MerchantProfileForInvoice {
  business_name: string;
  business_address?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  tin?: string | null;
  brn?: string | null;
  sst_registration_id?: string | null;
  city?: string | null;
  // Industry classification: MSIC 2008 code (e.g. "47910" for online retail)
  msic_code?: string | null;
  msic_name?: string | null;
}

function splitAddress(full?: string | null): {
  line1: string;
  line2?: string;
  line3?: string;
} {
  if (!full) return { line1: "NA" };
  const parts = full
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    line1: parts[0] ?? "NA",
    line2: parts[1],
    line3: parts[2],
  };
}

function normalisePhone(phone?: string | null): string {
  if (!phone) return "NA";
  const digits = phone.replace(/\D/g, "");
  // MY numbers: 60xxxxxxxxx (11 digits) or 01xxxxxxxx (10-11 digits)
  if (digits.startsWith("60")) return `+${digits}`;
  if (digits.startsWith("0")) return `+60${digits.slice(1)}`;
  return `+${digits}`;
}

function buildSupplierParty(
  profile: MerchantProfileForInvoice,
  stateName: string,
): MyInvoisParty {
  if (!profile.tin) {
    throw new Error("Merchant TIN is required for MyInvois submission.");
  }

  const address = splitAddress(profile.business_address);
  return {
    tin: profile.tin,
    brn: profile.brn ?? "NA",
    sstRegistrationId: profile.sst_registration_id ?? undefined,
    name: profile.business_name,
    email: profile.business_email ?? undefined,
    phone: profile.business_phone ? normalisePhone(profile.business_phone) : undefined,
    address: {
      line1: address.line1,
      line2: address.line2,
      line3: address.line3,
      city: profile.city ?? "Kuala Lumpur",
      postalZone: "00000",
      stateCode: MY_STATE_CODES[stateName] ?? MY_STATE_CODES.NA,
      countryCode: "MYS",
    },
    ...(profile.msic_code && profile.msic_name
      ? {
          industryClassification: {
            code: profile.msic_code,
            name: profile.msic_name,
          },
        }
      : {}),
  };
}

function buildBuyerParty(
  invoice: Invoice,
  buyerTin?: string | null,
  buyerBrn?: string | null,
  buyerSstId?: string | null,
): MyInvoisParty {
  // B2C walk-in when no TIN provided
  if (!buyerTin) {
    return {
      ...MY_INVOIS_WALK_IN_BUYER,
      name: invoice.buyer_name || MY_INVOIS_WALK_IN_BUYER.name,
      phone: invoice.buyer_phone ? normalisePhone(invoice.buyer_phone) : undefined,
    };
  }

  const address = splitAddress(invoice.buyer_address);
  return {
    tin: buyerTin,
    brn: buyerBrn ?? "NA",
    sstRegistrationId: buyerSstId ?? undefined,
    name: invoice.buyer_name ?? "Buyer",
    phone: invoice.buyer_phone ? normalisePhone(invoice.buyer_phone) : undefined,
    address: {
      line1: address.line1,
      line2: address.line2,
      line3: address.line3,
      city: "NA",
      postalZone: "00000",
      stateCode: MY_STATE_CODES.NA,
      countryCode: "MYS",
    },
  };
}

function buildLineItems(invoice: Invoice): MyInvoisLineItem[] {
  const subtotal = invoice.subtotal;
  // Prefer sst_rate (MY primary). Fall back to ppn_rate for rows written before
  // migration 077 landed; coerce anything outside {0,6} to 0.
  const rawRate = invoice.sst_rate ?? invoice.ppn_rate ?? 0;
  const sstRate = (rawRate === 6 ? 6 : 0) as 0 | 6;

  return invoice.items.map((item, idx) => {
    const lineAmount = item.price * item.qty;
    // Proportionally allocate invoice-level discount to each line.
    const discountShare =
      subtotal > 0 ? (lineAmount / subtotal) * invoice.discount : 0;
    const netLine = lineAmount - discountShare;
    const taxAmount = Number(((netLine * sstRate) / 100).toFixed(2));

    return {
      id: idx + 1,
      description: item.name,
      quantity: item.qty,
      unitCode: "XUN",
      unitPrice: Number(item.price.toFixed(2)),
      lineAmount: Number(lineAmount.toFixed(2)),
      discountAmount: Number(discountShare.toFixed(2)),
      classification: { code: "022" }, // generic "other" — tune per category in Phase 2.1
      tax: {
        rate: sstRate,
        amount: taxAmount,
        category: sstRate === 0 ? "E" : "01",
      },
    };
  });
}

export function invoiceToMyInvoisDocument(
  invoice: Invoice,
  supplierProfile: MerchantProfileForInvoice,
  options: {
    supplierStateName?: string;
    buyerTin?: string | null;
    buyerBrn?: string | null;
    buyerSstId?: string | null;
  } = {},
): GeneratedInvoice {
  const stateName = options.supplierStateName ?? "Kuala Lumpur";
  const supplier = buildSupplierParty(supplierProfile, stateName);
  const buyer = buildBuyerParty(
    invoice,
    options.buyerTin,
    options.buyerBrn,
    options.buyerSstId,
  );
  const lines = buildLineItems(invoice);
  const totals = computeInvoiceTotals(lines);

  const issueDate = new Date(invoice.created_at);
  const yyyy = issueDate.getUTCFullYear();
  const mm = String(issueDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(issueDate.getUTCDate()).padStart(2, "0");
  const hh = String(issueDate.getUTCHours()).padStart(2, "0");
  const mi = String(issueDate.getUTCMinutes()).padStart(2, "0");
  const ss = String(issueDate.getUTCSeconds()).padStart(2, "0");

  // >RM10,000 individual e-Invoice rule (mandatory 1 Jan 2026): always individual for high value.
  // (All Tokoflow submissions are individual-scoped; no consolidation is done today.)
  const doc: MyInvoisInvoice = {
    invoiceNumber: invoice.invoice_number,
    issueDate: `${yyyy}-${mm}-${dd}`,
    issueTime: `${hh}:${mi}:${ss}Z`,
    documentType: "01", // Invoice
    currencyCode: "MYR",
    supplier,
    buyer,
    lines,
    totals,
    paymentTerms: invoice.payment_terms ?? undefined,
    paymentMeansCode: "03", // Credit transfer (DuitNow QR / FPX)
    note: invoice.notes ?? undefined,
  };

  return generateMyInvoisDocument(doc);
}

/**
 * Check whether an invoice meets the > RM10,000 individual e-Invoice rule
 * (mandatory 1 Jan 2026 for B2C). Always true for B2B.
 */
export function requiresIndividualEInvoice(invoice: Invoice): boolean {
  return invoice.total >= 10000;
}
