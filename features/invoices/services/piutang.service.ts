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

export async function getPiutangSummary(): Promise<InvoicePiutangSummary | null> {
  try {
    const res = await fetch("/api/piutang");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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

