import type { LineItem } from "@/lib/types/common";

export type InvoiceItem = LineItem;

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentTerms = 'NET7' | 'NET14' | 'NET30' | 'COD' | 'custom';

// LHDN MyInvois document status (lowercased to match the mapping in myinvois-* API routes).
export type MyInvoisStatus =
  | 'pending'
  | 'submitted'
  | 'valid'
  | 'invalid'
  | 'cancelled'
  | 'rejected';

export interface Invoice {
  id: string;
  user_id: string;
  order_id?: string | null;
  customer_id?: string | null;
  invoice_number: string;

  // Seller snapshot — MY primary (migration 078).
  seller_name?: string;
  seller_address?: string;
  seller_phone?: string;
  seller_tin?: string | null;
  seller_brn?: string | null;
  seller_sst_registration_id?: string | null;
  // Legacy ID snapshot — dropped in a later migration, still read by PDF / WA.
  seller_npwp?: string | null;
  seller_nitku?: string | null;

  // Buyer — MY primary (migration 077).
  buyer_name?: string;
  buyer_address?: string;
  buyer_phone?: string;
  buyer_tin?: string | null;
  buyer_brn?: string | null;
  buyer_sst_id?: string | null;
  // Legacy ID.
  buyer_npwp?: string | null;

  items: InvoiceItem[];
  subtotal: number;
  discount: number;

  // MY primary tax fields (migration 077).
  sst_rate: number;
  sst_amount: number;
  // Legacy ID VAT — still populated during the compat window because PDF and
  // WA builders read these columns. Dropped in a later migration.
  ppn_rate: number;
  ppn_amount: number;

  total: number;

  paid_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';

  due_date?: string | null;
  payment_terms?: PaymentTerms;
  notes?: string;

  // MyInvois submission tracking (migration 077).
  myinvois_submission_uid?: string | null;
  myinvois_uuid?: string | null;
  myinvois_long_id?: string | null;
  myinvois_status?: MyInvoisStatus | null;
  myinvois_submitted_at?: string | null;
  myinvois_validated_at?: string | null;
  myinvois_errors?: unknown;
  requires_individual_einvoice?: boolean;

  status: InvoiceStatus;
  sent_at?: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  order_id?: string;
  customer_id?: string;

  buyer_name?: string;
  buyer_address?: string;
  buyer_phone?: string;
  buyer_tin?: string;
  buyer_brn?: string;
  buyer_sst_id?: string;

  items: InvoiceItem[];
  discount?: number;
  sst_rate?: number;

  due_date?: string;
  payment_terms?: PaymentTerms;
  notes?: string;

  status?: InvoiceStatus;
}

// Malaysian Sales & Service Tax standard rate. Service tax (F&B, services) = 6%.
// Goods are typically exempt (0%). Override per-invoice.
export const SST_RATE = 6;
export const SST_RATES_ALLOWED = [0, 6] as const;
export type SstRate = (typeof SST_RATES_ALLOWED)[number];

// RM 10,000 threshold — LHDN rule (1 Jan 2026): any B2C invoice at or above
// this total must be individually submitted to MyInvois, not consolidated.
export const MYINVOIS_INDIVIDUAL_THRESHOLD_MYR = 10000;

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'text-muted-foreground bg-muted',
  sent: 'text-blue-700 bg-blue-50',
  paid: 'text-green-700 bg-green-50',
  overdue: 'text-red-700 bg-red-50',
  cancelled: 'text-gray-500 bg-gray-100',
};

export const MYINVOIS_STATUS_LABELS: Record<MyInvoisStatus, string> = {
  pending: 'Pending',
  submitted: 'Submitted to LHDN',
  valid: 'Validated',
  invalid: 'Invalid',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  NET7: 'NET 7 (7 days)',
  NET14: 'NET 14 (14 days)',
  NET30: 'NET 30 (30 days)',
  COD: 'COD (on delivery)',
  custom: 'Custom',
};

export const PAYMENT_TERMS_DAYS: Record<PaymentTerms, number | null> = {
  NET7: 7,
  NET14: 14,
  NET30: 30,
  COD: 0,
  custom: null,
};
