"use client";

import { useState, useEffect } from "react";
import { getTodaySummary } from "../services/order.service";
import type { TodaySummary } from "../services/order.service";

interface HeroSummaryCellProps {
  refreshKey?: number;
  onAllDone?: (allDone: boolean) => void;
}

export function HeroSummaryCell({ refreshKey, onAllDone }: HeroSummaryCellProps) {
  const [summary, setSummary] = useState<TodaySummary | null>(null);

  useEffect(() => {
    getTodaySummary().then((data) => {
      setSummary(data);
      onAllDone?.(data.allTodayDone);
    });
  }, [refreshKey]);

  if (!summary) return null;

  const parts: string[] = [];
  if (summary.pendingCount > 0) {
    parts.push(`${summary.pendingCount} to process`);
  }
  if (summary.unpaidCount > 0) {
    parts.push(`${summary.unpaidCount} unpaid`);
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-xs text-muted-foreground px-1">
      {summary.pendingCount > 0 && (
        <span className="font-medium text-foreground">{summary.pendingCount} to process</span>
      )}
      {summary.pendingCount > 0 && summary.unpaidCount > 0 && (
        <span className="text-muted-foreground/50"> · </span>
      )}
      {summary.unpaidCount > 0 && (
        <span className="font-medium text-amber-600">{summary.unpaidCount} unpaid</span>
      )}
    </p>
  );
}
