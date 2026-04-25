export interface AnalysisResult {
  insights: string | null;
  cached: boolean;
  cachedTotalOrders?: number | null;
  error?: string;
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
    let error = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) error = String(body.error);
    } catch {
      // body wasn't JSON — keep the HTTP fallback
    }
    return { insights: null, cached: false, error };
  }

  return res.json();
}
