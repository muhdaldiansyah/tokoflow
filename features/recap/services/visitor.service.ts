export interface VisitorStats {
  periodCount: number;
  previousPeriodCount: number;
  total: number;
  byReferrer: { referrer: string; count: number }[];
  peakHour: { hour: number; count: number } | null;
  topProducts: { name: string; views: number }[];
  dailyTrend: { date: string; count: number }[];
  periodLabel: string;
  previousLabel: string;
}

export async function getVisitorStats(period: "daily" | "monthly" = "daily", month?: number, year?: number, dateStr?: string): Promise<VisitorStats | null> {
  try {
    const params = new URLSearchParams({ period });
    if (month) params.set("month", String(month));
    if (year) params.set("year", String(year));
    if (dateStr) params.set("date", dateStr);

    const res = await fetch(`/api/analytics/visitors?${params}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
