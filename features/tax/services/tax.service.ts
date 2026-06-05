import type { TaxSummary, SstMonthlySummary } from "../types/tax.types";

export async function getTaxSummary(year?: number): Promise<TaxSummary | null> {
  try {
    const params = year ? `?year=${year}` : "";
    const res = await fetch(`/api/tax/summary${params}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getSstMonthlySummary(
  year: number,
  month: number,
): Promise<SstMonthlySummary | null> {
  try {
    const res = await fetch(`/api/invoices/sst-summary?year=${year}&month=${month}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
