"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, TrendingDown, Minus, Clock, Globe } from "lucide-react";
import { getVisitorStats, type VisitorStats } from "../services/visitor.service";

const REFERRER_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  langsung: "Langsung",
  lainnya: "Lainnya",
};

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

interface Props {
  period?: "daily" | "monthly";
  month?: number;
  year?: number;
  dateStr?: string; // YYYY-MM-DD for daily
}

export function VisitorAnalytics({ period = "daily", month, year, dateStr }: Props) {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVisitorStats(period, month, year, dateStr).then(s => {
      setStats(s);
      setLoading(false);
    });
  }, [period, month, year, dateStr]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const diff = stats.periodCount - stats.previousPeriodCount;
  const diffText = diff > 0
    ? `↑ ${diff} lebih banyak dari ${stats.previousLabel}`
    : diff < 0
      ? `↓ ${Math.abs(diff)} lebih sedikit dari ${stats.previousLabel}`
      : `Sama seperti ${stats.previousLabel}`;

  const DiffIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-500" : "text-muted-foreground";

  return (
    <div className="space-y-3">
      {/* Main counter */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm text-center space-y-1">
        <p className="text-3xl font-bold text-foreground">{stats.periodCount}</p>
        <p className="text-sm text-muted-foreground">pengunjung {stats.periodLabel}</p>
        <div className={`flex items-center justify-center gap-1 text-xs font-medium ${diffColor}`}>
          <DiffIcon className="w-3 h-3" />
          {diffText}
        </div>
      </div>

      {/* Daily trend (only if >1 day of data) */}
      {stats.dailyTrend.length > 1 && (
        <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            {period === "daily" ? "7 Hari Terakhir" : "Per Hari"}
          </p>
          <div className="flex items-end justify-between gap-1 h-16">
            {(() => {
              if (period === "daily") {
                const days: { label: string; count: number; isToday: boolean }[] = [];
                const now = new Date();
                for (let i = 6; i >= 0; i--) {
                  const d = new Date(now);
                  d.setDate(d.getDate() - i);
                  const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
                  const dayLabel = DAY_LABELS[d.getDay()];
                  const count = stats.dailyTrend.find(t => t.date === dateStr)?.count || 0;
                  days.push({ label: dayLabel, count, isToday: i === 0 });
                }
                const max = Math.max(...days.map(d => d.count), 1);
                return days.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-md transition-all ${d.isToday ? "bg-blue-500" : "bg-blue-200"}`}
                      style={{ height: `${Math.max((d.count / max) * 48, 2)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                    {d.count > 0 && <span className="text-[10px] font-medium text-foreground">{d.count}</span>}
                  </div>
                ));
              } else {
                // Monthly: show daily bars
                const max = Math.max(...stats.dailyTrend.map(d => d.count), 1);
                const items = stats.dailyTrend.slice(-14); // last 14 days max
                return items.map((d, i) => {
                  const dayNum = d.date.split("-")[2];
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div
                        className="w-full rounded-t-md bg-blue-400 transition-all"
                        style={{ height: `${Math.max((d.count / max) * 48, 2)}px` }}
                      />
                      <span className="text-[9px] text-muted-foreground">{dayNum}</span>
                    </div>
                  );
                });
              }
            })()}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
            <span>Total: {stats.periodCount} pengunjung</span>
            <span>All-time: {stats.total.toLocaleString("en-MY")}</span>
          </div>
        </div>
      )}

      {/* Referrer breakdown */}
      {stats.byReferrer.length > 0 && (
        <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Dari Mana Pengunjung</p>
          </div>
          <div className="space-y-1.5">
            {stats.byReferrer.map(r => (
              <div key={r.referrer} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{REFERRER_LABELS[r.referrer] || r.referrer}</span>
                <span className="text-sm font-medium text-foreground">{r.count} orang</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak hour */}
      {stats.peakHour && (
        <div className="rounded-xl border bg-card px-4 py-4 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Jam Ramai</p>
          </div>
          <p className="text-sm text-foreground">
            Paling banyak jam <span className="font-semibold">{String(stats.peakHour.hour).padStart(2, "0")}:00</span> ({stats.peakHour.count} pengunjung)
          </p>
          <p className="text-xs text-muted-foreground">
            Share link toko di jam ini biar makin rame!
          </p>
        </div>
      )}

      {/* Top products viewed — hidden for now (one-page store, all products visible at once) */}

      {/* Empty state */}
      {stats.periodCount === 0 && stats.total === 0 && (
        <div className="rounded-xl border bg-card px-4 py-6 shadow-sm text-center space-y-2">
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Belum ada pengunjung</p>
          <p className="text-xs text-muted-foreground">Share link toko di WA Status atau Instagram bio biar orang mulai datang!</p>
        </div>
      )}
    </div>
  );
}
