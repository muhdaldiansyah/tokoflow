"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { getRecapData, getDailyOrdersForExport } from "../services/recap.service";
import { getProfile } from "@/features/receipts/services/receipt.service";
import { AIInsights } from "./AIInsights";
import { VisitorAnalytics } from "./VisitorAnalytics";
import {
  generateExcel,
  workbookToArrayBuffer,
  downloadBlob,
} from "@/lib/utils/export";
import { track } from "@/lib/analytics";
import type { DailyRecap as DailyRecapType } from "../services/recap.service";

interface DailyRecapProps {
  dateStr: string;
  selectedDate: Date;
  exportTrigger: number;
  onExportingChange: (v: boolean) => void;
  onHasDataChange: (v: boolean) => void;
  showAI?: boolean;
  onCloseAI?: () => void;
}

export function DailyRecap({ dateStr, selectedDate, exportTrigger, onExportingChange, onHasDataChange, showAI, onCloseAI }: DailyRecapProps) {
  const [recap, setRecap] = useState<DailyRecapType | null>(null);
  const [ordersUsed, setOrdersUsed] = useState(0);
  const [ordersLimit, setOrdersLimit] = useState(150);
  const [isLoading, setIsLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [aiDownloadFn, setAiDownloadFn] = useState<(() => void) | null>(null);
  const [showAllLate, setShowAllLate] = useState(false);
  const [communityStats, setCommunityStats] = useState<{
    communityName: string; memberCount: number;
    today: { totalOrders: number; totalRevenue: number; activeMembersToday: number; membersAtCapacity: number };
    socialProof?: { membersRaisedPrice: number; period: string };
  } | null>(null);
  const lastExportTrigger = useRef(exportTrigger);

  const handleAIDownloadReady = useCallback((fn: (() => void) | null) => {
    setAiDownloadFn(() => fn);
  }, []);

  useEffect(() => {
    loadRecap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  // Listen for export trigger from parent
  useEffect(() => {
    if (exportTrigger > 0 && exportTrigger !== lastExportTrigger.current) {
      lastExportTrigger.current = exportTrigger;
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger]);

  async function loadRecap() {
    setIsLoading(true);
    const data = await getRecapData(dateStr);
    setRecap(data.today);
    setOrdersUsed(data.ordersUsed);
    setOrdersLimit(data.ordersLimit);
    onHasDataChange(!!data.today && data.today.totalOrders > 0);
    track("recap_viewed", { date: dateStr, total_orders: data.today?.totalOrders || 0, revenue: data.today?.totalRevenue || 0 });

    const profile = await getProfile();
    if (profile) {
      setBusinessName(profile.business_name || "My Store");
    }

    // Fetch community stats (gated by API — returns null if <3 members)
    fetch("/api/communities/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => setCommunityStats(data?.stats || null))
      .catch(() => {});

    setIsLoading(false);
  }

  async function handleExport() {
    onExportingChange(true);
    try {
      const rows = await getDailyOrdersForExport(dateStr);
      if (rows.length === 0) {
        toast.error("No data to export");
        return;
      }

      const workbook = await generateExcel(rows, "Daily Recap", [
        { key: "nomor_pesanan", label: "Order no." },
        { key: "pelanggan", label: "Customer" },
        { key: "telepon", label: "Phone" },
        { key: "item", label: "Item" },
        { key: "total", label: "Total (RM)" },
        { key: "dibayar", label: "Paid (RM)" },
        { key: "sisa", label: "Balance (RM)" },
        { key: "pengiriman", label: "Delivery" },
        { key: "status", label: "Status" },
        { key: "pembayaran", label: "Payment" },
        { key: "sumber", label: "Source" },
      ]);

      // Add summary sheet if recap data is available
      if (recap) {
        const XLSX = await import("xlsx");
        const sourceLabels: Record<string, string> = {
          manual: "Manual",
          order_link: "Store link",
          whatsapp: "WhatsApp",
        };

        const summaryData: (string | number)[][] = [
          [`RECAP SUMMARY — ${selectedDate.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`],
          [],
          ["REVENUE"],
          ["Customers served", recap.totalOrders],
          ["Revenue", recap.totalRevenue],
          ["Collected", recap.collectedRevenue],
          ["Unpaid", recap.piutang],
          ...(recap.totalDiscount > 0 ? [["Discount given", recap.totalDiscount] as (string | number)[]] : []),
          [],
          ["PAYMENTS"],
          ...(recap.paidCount > 0 ? [["Paid", `${recap.paidCount} orders`, recap.paidRevenue] as (string | number)[]] : []),
          ...(recap.partialCount > 0 ? [["Partial", `${recap.partialCount} orders`, recap.partialRevenue] as (string | number)[]] : []),
          ...(recap.unpaidCount > 0 ? [["Unpaid", `${recap.unpaidCount} orders`, recap.unpaidRevenue] as (string | number)[]] : []),
          ...(recap.cancelledCount > 0 ? [["Cancelled", `${recap.cancelledCount} orders`, recap.cancelledValue] as (string | number)[]] : []),
          [],
          ["ORDER SOURCE"],
          ...Object.entries(recap.ordersBySource).map(([src, count]) => [
            sourceLabels[src] || src,
            `${count} orders`,
            recap.revenueBySource[src] || 0,
          ]),
          [],
          ["TOP PRODUCTS"],
          ["", "Sold", "Revenue", "Profit", "Margin"],
          ...recap.topItems.slice(0, 10).map((item, i) => [
            `${i + 1}. ${item.name}`,
            `${item.qty} sold`,
            item.revenue,
            item.profit ?? "-",
            item.margin !== undefined ? `${item.margin}%` : "-",
          ]),
          ...(recap.stockAlerts.length > 0 ? [
            [] as (string | number)[],
            ["LOW STOCK"] as (string | number)[],
            ...recap.stockAlerts.map(s => [s.name, `${s.stock} left`] as (string | number)[]),
          ] : []),
          ...(recap.lateOrders.length > 0 ? [
            [] as (string | number)[],
            ["LATE ORDERS"] as (string | number)[],
            ...recap.lateOrders.map(o => [o.customerName, o.orderNumber, o.total] as (string | number)[]),
          ] : []),
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      }

      const buffer = await workbookToArrayBuffer(workbook);
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const dayLabel = selectedDate.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }).replace(/ /g, "-");
      const filename = `Daily-Recap-${dayLabel}-${time}.xlsx`;
      downloadBlob(buffer, filename, "xlsx");
      track("recap_exported", { date: dateStr, order_count: rows.length });
      toast.success(`Downloaded: ${filename}`);
    } catch {
      toast.error("Failed to export recap");
    } finally {
      onExportingChange(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8">
        <div className="rounded-lg border bg-card px-4 py-4 space-y-4 shadow-sm">
          <div className="h-3 bg-muted animate-pulse rounded w-24" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted animate-pulse rounded w-28" />
                <div className="h-4 bg-muted animate-pulse rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Pendapatan */}
      <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Pendapatan</p>
          <div className="divide-y">
            <div className="flex justify-between text-sm py-2">
              <span className="text-muted-foreground">Customers served</span>
              <span className="font-medium text-foreground">{recap?.totalOrders || 0} pesanan</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-muted-foreground">Hasil Usaha</span>
              <span className="font-medium text-foreground">RM {(recap?.totalRevenue || 0).toLocaleString("en-MY")}</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-muted-foreground">Terkumpul</span>
              <span className={`font-medium ${(recap?.collectedRevenue || 0) > 0 ? "text-green-600" : "text-foreground"}`}>RM {(recap?.collectedRevenue || 0).toLocaleString("en-MY")}</span>
            </div>
            {(recap?.piutang || 0) > 0 && (
              <div className="flex justify-between text-sm py-2">
                <span className="text-muted-foreground">Unpaid</span>
                <span className="font-medium text-red-600">RM {(recap?.piutang || 0).toLocaleString("en-MY")}</span>
              </div>
            )}
            {(recap?.totalDiscount || 0) > 0 && (
              <div className="flex justify-between text-sm py-2">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-muted-foreground">RM {(recap?.totalDiscount || 0).toLocaleString("en-MY")}</span>
              </div>
            )}
          </div>
        </div>

      {/* Insight Cards */}
      {recap && (() => {
        const insights: { icon: string; text: string; color: string; actionLabel?: string; actionHref?: string }[] = [];

        // High piutang
        if (recap.piutang > 0 && recap.totalRevenue > 0) {
          const piutangPct = Math.round((recap.piutang / recap.totalRevenue) * 100);
          if (piutangPct > 50) {
            insights.push({
              icon: "💰",
              text: `RM ${recap.piutang.toLocaleString("en-MY")} not yet collected (${piutangPct}% of today's sales). The longer you wait, the harder it gets.`,
              color: "bg-red-50 border-red-100 text-red-800",
              actionLabel: "Send reminders",
              actionHref: "/pengingat",
            });
          }
        }

        // Late orders
        if (recap.lateOrders.length > 0) {
          const totalLate = recap.lateOrders.reduce((sum, o) => sum + o.total, 0);
          insights.push({
            icon: "⏰",
            text: `${recap.lateOrders.length} pesanan lewat tanggal kirim — RM ${totalLate.toLocaleString("en-MY")} tertahan. Update status supaya tidak menumpuk.`,
            color: "bg-orange-50 border-orange-100 text-orange-800",
            actionLabel: "View order",
            actionHref: "/orders",
          });
        }

        // Revenue growth (skip absurd values from divide-by-near-zero)
        if (recap.growthRevenue !== undefined && recap.growthRevenue !== null && recap.totalOrders > 0 && Math.abs(recap.growthRevenue) <= 500) {
          if (recap.growthRevenue > 20) {
            insights.push({
              icon: "🔥",
              text: `Penjualan naik ${recap.growthRevenue}% dari kemarin! Usahamu berkembang.`,
              color: "bg-emerald-50 border-emerald-100 text-emerald-800",
            });
          } else if (recap.growthRevenue < -20) {
            insights.push({
              icon: "📉",
              text: `Sales down ${Math.abs(recap.growthRevenue)}% from yesterday. You're losing momentum — share your store link now.`,
              color: "bg-gray-50 border-gray-100 text-gray-700",
            });
          }
        }

        // Low stock warning
        if (recap.stockAlerts && recap.stockAlerts.length > 0) {
          const critical = recap.stockAlerts.filter((s: { stock: number }) => s.stock <= 3);
          if (critical.length > 0) {
            insights.push({
              icon: "📦",
              text: `${critical.map((s: { name: string; stock: number }) => `${s.name} (${s.stock} left)`).join(", ")} — restock needed.`,
              color: "bg-amber-50 border-amber-100 text-amber-800",
              actionLabel: "View products",
              actionHref: "/products",
            });
          }
        }

        // Source concentration: most orders are manual, suggest store link
        if (recap.ordersBySource && recap.totalOrders >= 3) {
          const manualCount = recap.ordersBySource["manual"] || 0;
          const manualPct = Math.round((manualCount / recap.totalOrders) * 100);
          if (manualPct >= 80) {
            insights.push({
              icon: "🔗",
              text: `${manualPct}% orders are still logged manually by you — your time is going to admin work instead of production. Share your store link so customers order themselves.`,
              color: "bg-blue-50 border-blue-100 text-blue-800",
              actionLabel: "Copy link",
              actionHref: "/settings",
            });
          }
        }

        // Collection rate insight (positive framing)
        if (recap.collectionRate !== undefined && recap.totalRevenue > 0) {
          if (recap.collectionRate >= 90) {
            insights.push({
              icon: "💚",
              text: `Tingkat pembayaran ${Math.round(recap.collectionRate)}% — pelangganmu amanah.`,
              color: "bg-emerald-50 border-emerald-100 text-emerald-800",
            });
          }
        }

        // Community shared context (Feature 6) — gated: ≥3 members
        if (communityStats) {
          const cs = communityStats.today;
          const parts: string[] = [];
          if (cs.totalOrders > 0) parts.push(`${cs.totalOrders} pesanan`);
          if (cs.activeMembersToday > 0) parts.push(`${cs.activeMembersToday} member aktif`);
          if (cs.membersAtCapacity > 0) parts.push(`${cs.membersAtCapacity} member penuh hari ini`);
          if (parts.length > 0) {
            insights.push({
              icon: "👥",
              text: `Hari ini di ${communityStats.communityName}: ${parts.join(", ")}`,
              color: "bg-violet-50 border-violet-100 text-violet-800",
            });
          }

          // Social proof (Feature 5) — "X member naikkan harga minggu ini"
          if ((communityStats.socialProof?.membersRaisedPrice ?? 0) >= 2) {
            insights.push({
              icon: "📈",
              text: `${communityStats.socialProof!.membersRaisedPrice} member di ${communityStats.communityName} sudah naikkan harga minggu ini.`,
              color: "bg-blue-50 border-blue-100 text-blue-800",
            });
          }
        }

        if (insights.length === 0) return null;

        return (
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className={`rounded-xl border px-4 py-3 shadow-sm ${insight.color}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs leading-relaxed">
                    <span className="mr-1.5">{insight.icon}</span>
                    {insight.text}
                  </p>
                  {insight.actionLabel && insight.actionHref && (
                    <a
                      href={insight.actionHref}
                      className="shrink-0 text-[11px] font-medium underline hover:no-underline whitespace-nowrap"
                    >
                      {insight.actionLabel}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Kunjungan Toko */}
      <VisitorAnalytics period="daily" dateStr={dateStr} />

      {/* Top products */}
      {recap && recap.topItems && recap.topItems.length > 0 && (
        <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Top products</p>
            <div className="divide-y">
              {recap.topItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.qty} terjual</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium text-foreground">
                      RM {item.revenue.toLocaleString("en-MY")}
                    </p>
                    {item.profit !== undefined && (
                      <p className={`text-[11px] font-medium ${
                        item.margin !== undefined && item.margin >= 50 ? "text-emerald-600" :
                        item.margin !== undefined && item.margin >= 30 ? "text-amber-600" :
                        "text-rose-500"
                      }`}>
                        +RM {item.profit.toLocaleString("en-MY")} ({item.margin}%)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Pembayaran */}
      {recap && (recap.paidCount > 0 || recap.partialCount > 0 || recap.unpaidCount > 0) && (
        <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Payment</p>
            <div className="divide-y">
              {recap.paidCount > 0 && (
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">Paid ({recap.paidCount})</span>
                  <span className="font-medium text-green-600">RM {recap.paidRevenue.toLocaleString("en-MY")}</span>
                </div>
              )}
              {recap.partialCount > 0 && (
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">DP ({recap.partialCount})</span>
                  <span className="font-medium text-yellow-600">RM {recap.partialRevenue.toLocaleString("en-MY")}</span>
                </div>
              )}
              {recap.unpaidCount > 0 && (
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">Unpaid ({recap.unpaidCount})</span>
                  <span className="font-medium text-red-600">RM {recap.unpaidRevenue.toLocaleString("en-MY")}</span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Low stock */}
      {recap && recap.stockAlerts.length > 0 && (
        <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Low stock</p>
            <div className="divide-y">
              {recap.stockAlerts.map((item) => (
                <div key={item.name} className="flex justify-between text-sm py-2">
                  <span className="text-foreground">{item.name}</span>
                  <span className="font-medium text-yellow-600">Sisa {item.stock}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Late orders — limited to 3, expandable */}
      {recap && recap.lateOrders.length > 0 && (
        <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Late orders ({recap.lateOrders.length})</p>
            </div>
            <div className="divide-y">
              {(showAllLate ? recap.lateOrders : recap.lateOrders.slice(0, 3)).map((order) => (
                <div key={order.orderNumber} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderNumber} · Kirim {new Date(order.deliveryDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" })}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-red-600 shrink-0 ml-3">
                    RM {order.total.toLocaleString("en-MY")}
                  </span>
                </div>
              ))}
            </div>
            {recap.lateOrders.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllLate(!showAllLate)}
                className="w-full text-xs font-medium text-muted-foreground hover:text-foreground pt-1 transition-colors"
              >
                {showAllLate ? "Hide" : `View all ${recap.lateOrders.length} orders`}
              </button>
            )}
          </div>
        )}

      {/* Penggunaan */}
      <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Penggunaan Bulan Ini</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Orders</span>
            <span className="font-medium text-foreground">
              {ordersUsed} / {ordersLimit === -1 ? "Tak Terbatas" : ordersLimit}
            </span>
          </div>
          {ordersLimit !== -1 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (ordersUsed / ordersLimit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>


      {/* AI Analysis Modal */}
      {showAI && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center" onClick={onCloseAI}>
          <div className="bg-background rounded-t-2xl lg:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-sm font-semibold text-foreground">Analisis Bisnis AI</h3>
              <div className="flex items-center gap-1">
                {aiDownloadFn && (
                  <button onClick={aiDownloadFn} className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                )}
                <button onClick={onCloseAI} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <span className="text-lg">✕</span>
                </button>
              </div>
            </div>
            <div className="p-4">
              <AIInsights
                type="daily"
                periodKey={dateStr}
                hasData={!!recap && recap.totalOrders > 0}
                totalOrders={recap?.totalOrders || 0}
                businessName={businessName}
                onDownloadReady={handleAIDownloadReady}
                summary={recap ? {
                  totalOrders: recap.totalOrders,
                  totalRevenue: recap.totalRevenue,
                  collectedRevenue: recap.collectedRevenue,
                  piutang: recap.piutang,
                  aov: recap.aov,
                  collectionRate: recap.collectionRate,
                  paidCount: recap.paidCount,
                  partialCount: recap.partialCount,
                  unpaidCount: recap.unpaidCount,
                } : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Recap to WA Status */}
      {recap && recap.totalOrders > 0 && (
        <div className="rounded-xl border bg-card px-4 py-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-3">Bagikan Rekap</p>
          <button
            onClick={() => {
              const date = new Date(selectedDate);
              const dateLabel = date.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" });
              const text = [
                `Rekap ${dateLabel}`,
                `${recap.totalOrders} pelanggan dilayani`,
                `RM ${recap.totalRevenue.toLocaleString("en-MY")} hasil usaha`,
                recap.collectedRevenue > 0 ? `RM ${recap.collectedRevenue.toLocaleString("en-MY")} terkumpul` : "",
                "",
                "From selling to a real business",
                "https://tokoflow.com",
              ].filter(Boolean).join("\n");
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="w-full h-10 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#25D366]/90 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Bagikan ke WA Status
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Teman UMKM yang melihat bisa tertarik mencoba
          </p>
        </div>
      )}

    </div>
  );
}
