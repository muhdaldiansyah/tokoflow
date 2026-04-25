"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { checkAnalysisCache, generateAnalysis } from "../services/analyze.service";
import { track } from "@/lib/analytics";

export interface RecapSummary {
  totalOrders: number;
  totalRevenue: number;
  collectedRevenue: number;
  piutang: number;
  aov: number;
  collectionRate: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

interface AIInsightsProps {
  type: "daily" | "monthly";
  periodKey: string;
  hasData: boolean;
  totalOrders: number;
  businessName: string;
  summary?: RecapSummary;
  onDownloadReady?: (downloadFn: (() => void) | null) => void;
}

type State = "empty" | "loading" | "result";

function highlightRupiah(text: string) {
  const parts = text.split(/(Rp[\d.]+)/g);
  return parts.map((part, i) =>
    /^Rp[\d.]+$/.test(part) ? (
      <strong key={i} className="text-green-600">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

import { formatRupiah as fmtRp } from "@/lib/utils/format";

export function AIInsights({ type, periodKey, hasData, totalOrders, businessName, summary, onDownloadReady }: AIInsightsProps) {
  const [state, setState] = useState<State>("empty");
  const [insights, setInsights] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const loadCache = useCallback(async () => {
    if (!hasData) return;
    try {
      const result = await checkAnalysisCache(type, periodKey);
      if (result.insights) {
        setInsights(result.insights);
        setState("result");
        const stale = result.cachedTotalOrders != null && result.cachedTotalOrders !== totalOrders;
        setIsStale(stale);
      } else {
        // No cache — auto-start analysis immediately
        handleGenerate();
      }
    } catch {
      // Cache check failed — auto-start analysis
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, periodKey, hasData, totalOrders]);

  useEffect(() => {
    setInsights(null);
    setState("empty");
    setIsStale(false);
    loadCache();
  }, [loadCache]);

  useEffect(() => {
    if (onDownloadReady) {
      onDownloadReady(state === "result" && insights ? handleDownloadPDF : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, insights]);

  if (!hasData) return null;

  async function handleGenerate(force?: boolean) {
    setState("loading");
    setIsStale(false);
    const result = await generateAnalysis(type, periodKey, force);
    if (result.insights) {
      setInsights(result.insights);
      setState("result");
      track("ai_analysis_generated", { type, period: periodKey, force: !!force });
    } else {
      setState("empty");
      toast.error(result.error ?? "Failed to generate analysis");
    }
  }

  async function handleDownloadPDF() {
    if (!insights) return;

    const { jsPDF } = await import("jspdf");

    const periodLabel = type === "daily"
      ? new Date(periodKey + "T00:00:00").toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : new Date(`${periodKey}-01T00:00:00`).toLocaleDateString("en-MY", { month: "long", year: "numeric" });

    const typeLabel = type === "daily" ? "Daily" : "Monthly";
    const dateSlug = periodKey.replace(/\//g, "-");
    const now = new Date();
    const timeSlug = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const filename = `Analysis-${typeLabel}-${dateSlug}-${timeSlug}.pdf`;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // --- Header ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(businessName, margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${typeLabel} analysis — ${periodLabel}`, margin, y);
    y += 4;

    // Divider
    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Summary table ---
    if (summary) {
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const rows: [string, string][] = [
        ["Total orders", String(summary.totalOrders)],
        ["Total sales", fmtRp(summary.totalRevenue)],
        ["Collected", fmtRp(summary.collectedRevenue)],
        ["Unpaid", fmtRp(summary.piutang)],
        ["Avg. order value", fmtRp(summary.aov)],
        ["Collection rate", `${summary.collectionRate}%`],
        ["Paid", `${summary.paidCount} orders`],
        ["Partial", `${summary.partialCount} orders`],
        ["Unpaid", `${summary.unpaidCount} orders`],
      ];

      for (const [label, value] of rows) {
        doc.setTextColor(80, 80, 80);
        doc.text(label, margin, y);
        doc.setTextColor(30, 30, 30);
        doc.text(value, pageWidth - margin, y, { align: "right" });
        y += 6;
      }

      // Divider
      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    }

    // --- AI Insights ---
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("AI ANALYSIS", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(insights, contentWidth);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5.5;
    }

    // --- Footer ---
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("Generated with Tokoflow — tokoflow.com", margin, footerY);
    doc.text(
      now.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      pageWidth - margin,
      footerY,
      { align: "right" }
    );

    doc.save(filename);
    track("ai_analysis_downloaded", { type, period: periodKey });
  }

  return (
    <div className="rounded-lg border bg-card px-4 py-4 shadow-sm space-y-3">
      {(state === "empty" || state === "loading") && (
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing data...
          </div>
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
            <div className="h-3 bg-muted rounded w-4/6" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/6" />
          </div>
        </div>
      )}

      {state === "result" && insights && (
        <div className="space-y-3">
          {isStale && (
            <button
              onClick={() => handleGenerate(true)}
              className="w-full flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg py-2 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Ada new orders — perbarui analisis
            </button>
          )}
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {highlightRupiah(insights)}
          </div>
        </div>
      )}
    </div>
  );
}
