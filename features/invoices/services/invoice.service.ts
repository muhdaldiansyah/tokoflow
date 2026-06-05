import type { Invoice, CreateInvoiceInput, InvoiceStatus } from "../types/invoice.types";

export async function getInvoices(options?: {
  status?: InvoiceStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<Invoice[]> {
  try {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.search) params.set("search", options.search);
    if (options?.dateFrom) params.set("dateFrom", options.dateFrom);
    if (options?.dateTo) params.set("dateTo", options.dateTo);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const qs = params.toString();
    const res = await fetch(`/api/invoices${qs ? `?${qs}` : ""}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const res = await fetch(`/api/invoices/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
  try {
    const res = await fetch(`/api/invoices/by-order/${orderId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice | null> {
  try {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createInvoiceFromOrder(orderId: string): Promise<CreateInvoiceInput | null> {
  try {
    const res = await fetch("/api/invoices/from-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  try {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice | null> {
  try {
    const res = await fetch(`/api/invoices/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function recordInvoicePayment(id: string, amount: number): Promise<Invoice | null> {
  try {
    const res = await fetch(`/api/invoices/${id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function deleteInvoice(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getSstMonthlySummary(year: number, month: number) {
  try {
    const res = await fetch(`/api/invoices/sst-summary?year=${year}&month=${month}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
