// LHDN MyInvois API types. Reference: https://sdk.myinvois.hasil.gov.my/
// UBL 2.1 JSON Invoice schema — v1.1 mandatory fields.

export type MyInvoisDocumentType =
  | "01" // Invoice
  | "02" // Credit note
  | "03" // Debit note
  | "04" // Refund note
  | "11" // Self-billed invoice
  | "12" // Self-billed credit note
  | "13" // Self-billed debit note
  | "14"; // Self-billed refund note

export type MyInvoisSubmissionStatus =
  | "Submitted" // Received by LHDN, awaiting validation
  | "Valid" // Accepted
  | "Invalid" // Rejected
  | "Cancelled"; // Withdrawn by supplier

export interface MyInvoisParty {
  tin: string; // LHDN Taxpayer Identification Number
  brn?: string; // Business Registration Number (Sdn Bhd) or NRIC (individual)
  sstRegistrationId?: string; // Optional — only if registered
  name: string; // Legal entity name
  email?: string;
  phone?: string; // E.164 without leading +
  address: {
    line1: string;
    line2?: string;
    line3?: string;
    city: string;
    postalZone: string;
    stateCode: string; // Malaysian state code (see MY_STATE_CODES)
    countryCode: "MYS"; // ISO 3166-1 alpha-3
  };
  industryClassification?: {
    code: string; // MSIC 2008 code
    name: string;
  };
}

export interface MyInvoisLineItem {
  id: string | number; // Line number (1-based)
  description: string;
  quantity: number;
  unitCode: string; // UN/ECE Recommendation 20, default "XUN" (each)
  unitPrice: number; // RM per unit (2 decimals)
  lineAmount: number; // quantity × unitPrice (2 decimals)
  discountAmount?: number;
  classification?: {
    code: string; // LHDN classification code (e.g. "001" for food)
  };
  tax: {
    rate: 0 | 6; // SST percent
    amount: number; // RM (2 decimals)
    category: "01" | "E"; // "01" = taxable, "E" = exempt
  };
}

export interface MyInvoisInvoice {
  invoiceNumber: string;
  issueDate: string; // yyyy-mm-dd
  issueTime: string; // HH:mm:ssZ
  documentType: MyInvoisDocumentType;
  currencyCode: "MYR" | string;
  supplier: MyInvoisParty;
  buyer: MyInvoisParty;
  lines: MyInvoisLineItem[];
  totals: {
    lineExtension: number; // Sum of line amounts (before tax)
    taxExclusive: number; // Taxable amount
    taxInclusive: number; // Taxable + tax
    taxAmount: number; // Total SST
    payable: number; // Final amount
  };
  paymentTerms?: string;
  paymentMeansCode?: string; // "01" (cash), "03" (credit transfer), "04" (credit card), etc.
  note?: string;
}

export interface MyInvoisSubmitRequest {
  documents: Array<{
    format: "JSON";
    document: string; // Base64-encoded JSON
    documentHash: string; // SHA-256 hex of the raw JSON
    codeNumber: string; // Supplier's invoice number
  }>;
}

export interface MyInvoisSubmitResponse {
  submissionUid: string;
  acceptedDocuments: Array<{
    uuid: string;
    invoiceCodeNumber: string;
  }>;
  rejectedDocuments: Array<{
    invoiceCodeNumber: string;
    error: {
      code: string;
      message: string;
      target?: string;
      details?: unknown[];
    };
  }>;
}

export interface MyInvoisDocumentStatus {
  uuid: string;
  submissionUid: string;
  longId: string; // Human-readable validation code
  internalId: string;
  typeName: string;
  typeVersionName: string;
  issuerTin: string;
  receiverTin?: string;
  dateTimeIssued: string;
  dateTimeReceived: string;
  dateTimeValidated?: string;
  totalPayableAmount: number;
  totalExcludingTax: number;
  totalDiscount: number;
  totalNetAmount: number;
  status: MyInvoisSubmissionStatus;
  cancelDateTime?: string;
  rejectRequestDateTime?: string;
  documentStatusReason?: string;
  createdByUserId: string;
  validationResults?: {
    status: string;
    validationSteps: Array<{
      name: string;
      status: string;
      error?: { code: string; message: string };
    }>;
  };
}
