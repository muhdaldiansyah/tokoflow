export interface AnalysisResult {
  insights: string | null;
  cached: boolean;
  cachedTotalOrders?: number | null;
}

export async function checkAnalysisCache(type: "daily" | "monthly", period: string): Promise<AnalysisResult> {
  const res = await fetch(`/api/recap/analyze?type=${type}&period=${encodeURIComponent(period)}`);
  if (!res.ok) return { insights: null, cached: false };
  return res.json();
}

export async function generateAnalysis(type: "daily" | "monthly", period: string, force?: boolean): Promise<AnalysisResult> {
  const res = await fetch("/api/recap/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, period, force }),
  });

  if (!res.ok) {
    throw new Error("ANALYSIS_FAILED");
  }

  return res.json();
}
