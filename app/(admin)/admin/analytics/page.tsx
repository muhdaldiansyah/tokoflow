"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Users,
  ShoppingBag,
  Send,
  Clock,
  ArrowRight,
} from "lucide-react";

interface AnalyticsData {
  funnel: { signup: number; order_created: number; wa_sent: number };
  retention: { d1: number; d7: number; d30: number };
  time_to_first_order: {
    median_hours: number;
    average_hours: number;
    total_users: number;
  };
  utm: { source: string; users: number }[];
  daily_orders: { date: string; count: number }[];
  recent_events: {
    id: string;
    user_id: string;
    event: string;
    properties: Record<string, unknown>;
    created_at: string;
  }[];
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} menit`;
  if (hours < 24) return `${Math.round(hours * 10) / 10} jam`;
  return `${Math.round((hours / 24) * 10) / 10} hari`;
}

import { formatShortDate } from "@/lib/utils/format";

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RANGE_OPTIONS = [
  { label: "7 hari", value: 7 },
  { label: "14 hari", value: 14 },
  { label: "30 hari", value: 30 },
  { label: "90 hari", value: 90 },
];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const funnelSteps = [
    { label: "Signup", count: data.funnel.signup, icon: Users },
    {
      label: "Order Created",
      count: data.funnel.order_created,
      icon: ShoppingBag,
    },
    { label: "WA Sent", count: data.funnel.wa_sent, icon: Send },
  ];

  const retentionItems = [
    { label: "D1", value: data.retention.d1 },
    { label: "D7", value: data.retention.d7 },
    { label: "D30", value: data.retention.d30 },
  ];

  const maxDailyCount = Math.max(...data.daily_orders.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                days === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <section>
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
          Funnel
        </p>
        <div className="grid grid-cols-3 gap-3">
          {funnelSteps.map((step, i) => {
            const prev = i > 0 ? funnelSteps[i - 1].count : null;
            const pct =
              prev && prev > 0 ? Math.round((step.count / prev) * 100) : null;
            return (
              <div
                key={step.label}
                className="rounded-xl border border-border bg-card shadow-sm p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{step.label}</p>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {step.count}
                </p>
                {pct !== null && (
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{pct}%</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Retention */}
      <section>
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
          Retention
        </p>
        <div className="grid grid-cols-3 gap-3">
          {retentionItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-card shadow-sm p-4"
            >
              <p className="text-xs text-muted-foreground mb-1">
                {item.label}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {item.value}%
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Time to First Order */}
      <section>
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
          Time to First Order
        </p>
        <div className="rounded-xl border border-border bg-card shadow-sm p-4">
          {data.time_to_first_order.total_users === 0 ? (
            <p className="text-sm text-muted-foreground">None yet data</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Median</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatDuration(data.time_to_first_order.median_hours)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Rata-rata</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatDuration(data.time_to_first_order.average_hours)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Users</p>
                <p className="text-lg font-semibold text-foreground">
                  {data.time_to_first_order.total_users}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Daily Orders (14 hari) */}
      <section>
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
          Daily orders (14 days)
        </p>
        <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-2">
          {data.daily_orders.map((d) => (
            <div key={d.date} className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground w-16 shrink-0">
                {formatShortDate(d.date)}
              </p>
              <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-full transition-all"
                  style={{
                    width: `${Math.max(
                      (d.count / maxDailyCount) * 100,
                      d.count > 0 ? 4 : 0
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs font-medium text-foreground w-8 text-right">
                {d.count}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* UTM Sources */}
      <section>
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
          UTM Sources
        </p>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {data.utm.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">None yet data</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.utm.map((row) => (
                  <tr key={row.source}>
                    <td className="px-4 py-3 text-foreground">{row.source}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {row.users}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Event Log */}
      <section>
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
          Event Log (50 terbaru)
        </p>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Fixed header */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap w-[120px]">
                    Waktu
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap w-[160px]">
                    Event
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Properties
                  </th>
                </tr>
              </thead>
            </table>
          </div>
          {/* Scrollable body */}
          <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[120px]" />
                <col className="w-[160px]" />
                <col />
              </colgroup>
              <tbody className="divide-y divide-border">
                {data.recent_events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Belum ada event
                    </td>
                  </tr>
                ) : (
                  data.recent_events.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(e.created_at)}
                      </td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        <span className="inline-flex h-6 px-2 text-xs font-medium rounded-full border items-center">
                          {e.event}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground truncate">
                        {Object.keys(e.properties).length > 0
                          ? JSON.stringify(e.properties)
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
