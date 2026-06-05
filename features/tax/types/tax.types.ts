// Malaysia-localised tax types. Replaces the Indonesian PPh / Coretax model.

export interface MonthlyTaxRow {
  month: number;
  revenue: number;
  invoice_count: number;
  sst_collected: number;
}

export interface MyInvoisYearStats {
  total: number;
  submitted: number;
  validated: number;
  pending: number;
  rejected: number;
  not_submitted: number;
}

export interface TaxSummary {
  year: number;
  revenue_ytd: number;
  sst_collected_ytd: number;
  sst_registration_threshold_myr: number;
  sst_threshold_reached: boolean;
  sst_registration_required: boolean;
  months: MonthlyTaxRow[];
  myinvois: MyInvoisYearStats;
  merchant: {
    tin: string | null;
    brn: string | null;
    sst_registration_id: string | null;
    pro_active: boolean;
  };
}

export interface SstMonthlySummary {
  year: number;
  month: number;
  invoice_count: number;
  subtotal_total: number;
  discount_total: number;
  taxable_total: number;
  sst_total: number;
  gross_total: number;
  paid_total: number;
  outstanding_total: number;
  myinvois_submitted_count: number;
  myinvois_validated_count: number;
}
