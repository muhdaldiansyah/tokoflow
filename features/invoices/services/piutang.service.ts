export interface InvoicePiutangSummary {
  totalOutstanding: number;
  overdueCount: number;
  totalInvoices: number;
}

export interface PiutangByCustomer {
  buyerName: string;
  buyerPhone: string;
  totalOutstanding: number;
  invoiceCount: number;
  aging: {
    current: number;
    week2: number;
    month: number;
    overMonth: number;
  };
}

export async function getPiutangSummary(): Promise<InvoicePiutangSummary> {
  try {
    const res = await fetch("/api/piutang");
    if (!res.ok) return { totalOutstanding: 0, overdueCount: 0, totalInvoices: 0 };
    return res.json();
  } catch {
    return { totalOutstanding: 0, overdueCount: 0, totalInvoices: 0 };
  }
}

export async function getPiutangByCustomer(): Promise<PiutangByCustomer[]> {
  try {
    const res = await fetch("/api/piutang/by-customer");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

