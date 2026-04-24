"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingBag,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMonthlyReport,
  getMonthlyOrdersForExport,
} from "../services/report.service";
import { track } from "@/lib/analytics";
import { getProfile } from "@/features/receipts/services/receipt.service";
import { AIInsights } from "./AIInsights";
import { VisitorAnalytics } from "./VisitorAnalytics";
import type { MonthlyReport as MonthlyReportType } from "../services/report.service";
import {
  generateExcel,
  workbookToArrayBuffer,
  downloadBlob,
} from "@/lib/utils/export";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  order_link: "Store link",
};

interface MonthlyReportProps {
  month: number;
  year: number;
  exportTrigger: number;
  onExportingChange: (v: boolean) => void;
  onHasDataChange: (v: boolean) => void;
  showAI?: boolean;
  onCloseAI?: () => void;
}

export function MonthlyReport({ month, year, exportTrigger, onExportingChange, onHasDataChange, showAI, onCloseAI }: MonthlyReportProps) {
  const [report, setReport] = useState<MonthlyReportType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [businessName, setBusinessName] = useState("Toko Saya");
  const [aiDownloadFn, setAiDownloadFn] = useState<(() => void) | null>(null);
  const [showAllLate, setShowAllLate] = useState(false);
  const lastExportTrigger = useRef(exportTrigger);

  const handleAIDownloadReady = useCallback((fn: (() => void) | null) => {
    setAiDownloadFn(() => fn);
  }, []);

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  // Listen for export trigger from parent
  useEffect(() => {
    if (exportTrigger > 0 && exportTrigger !== lastExportTrigger.current) {
      lastExportTrigger.current = exportTrigger;
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger]);

  async function loadReport() {
    setIsLoading(true);
    const data = await getMonthlyReport(month, year);
    setReport(data);
    onHasDataChange(!!data && data.totalOrders > 0);
    if (data) track("report_viewed", { month, year, total_orders: data.totalOrders, revenue: data.totalRevenue });

    const profile = await getProfile();
    if (profile) {
      setBusinessName(profile.business_name || "Toko Saya");
    }

    setIsLoading(false);
  }

  async function handleExport() {
    setIsExporting(true);
    onExportingChange(true);
    try {
      const rows = await getMonthlyOrdersForExport(month, year);
      if (rows.length === 0) {
        toast.error("No data to export");
        return;
      }

      const workbook = await generateExcel(rows, "Order report", [
        { key: "tanggal", label: "Date" },
        { key: "nomor_pesanan", label: "Order no." },
        { key: "pelanggan", label: "Customer" },
        { key: "telepon", label: "Phone" },
        { key: "item", label: "Item" },
        { key: "total", label: "Total (RM)" },
        { key: "dibayar", label: "Paid (Rp)" },
        { key: "sisa", label: "Balance (Rp)" },
        { key: "pengiriman", label: "Delivery" },
        { key: "status", label: "Status" },
        { key: "pembayaran", label: "Payment" },
        { key: "sumber", label: "Source" },
      ]);

      // Add summary sheet if report data is available
      if (report) {
        const XLSX = await import("xlsx");
        const sourceLabels: Record<string, string> = {
          manual: "Manual",
          order_link: "Store link",
          whatsapp: "WhatsApp",
        };

        const summaryData: (string | number)[][] = [
          [`RINGKASAN LAPORAN — ${MONTH_NAMES[month - 1]} ${year}`],
          [],
          ["REVENUE"],
          ["Total orders", report.totalOrders],
          ["Total sales", report.totalRevenue],
          ["Collected", report.collectedRevenue],
          ["Unpaid", report.piutang],
          ["Avg. order value", report.aov],
          ["Collection rate", `${report.collectionRate}%`],
          ...(report.totalDiscount > 0 ? [["Discount given", report.totalDiscount] as (string | number)[]] : []),
          [],
          ["PAYMENTS"],
          ["Paid", `${report.paidCount} pesanan`, report.paidRevenue],
          ["DP", `${report.partialCount} pesanan`, report.partialRevenue],
          ["Unpaid", `${report.unpaidCount} pesanan`, report.unpaidRevenue],
          ...(report.cancelledCount > 0 ? [["Cancelled", `${report.cancelledCount} pesanan`, report.cancelledValue] as (string | number)[]] : []),
          [],
          ["ORDER SOURCE"],
          ...Object.entries(report.ordersBySource).map(([src, count]) => [
            sourceLabels[src] || src,
            `${count} orders`,
            report.revenueBySource[src] || 0,
          ]),
          [],
          ["CUSTOMERS"],
          ["Baru", report.newCustomerCount],
          ["Returning", report.returningCustomerCount],
          [],
          ["UNPAID AGING"],
          ...report.piutangAging.filter(b => b.count > 0).map(b => [
            b.label,
            `${b.count} pesanan`,
            b.amount,
          ]),
          ...(report.piutangAging.some(b => b.count > 0) ? [
            ["Total unpaid", "", report.piutangAging.reduce((sum, b) => sum + b.amount, 0)] as (string | number)[],
          ] : []),
          [],
          ["TOP PRODUCTS"],
          ["", "Sold", "Revenue", "Profit", "Margin"],
          ...report.topItems.slice(0, 10).map((item, i) => [
            `${i + 1}. ${item.name}`,
            `${item.qty} terjual`,
            item.revenue,
            item.profit ?? "-",
            item.margin !== undefined ? `${item.margin}%` : "-",
          ]),
          [],
          ["TOP CUSTOMERS"],
          ...report.topCustomers.slice(0, 10).map((c, i) => [
            `${i + 1}. ${c.name}`,
            `${c.orderCount} pesanan`,
            c.totalSpent,
          ]),
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        // Set column widths
        summarySheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      }

      const buffer = await workbookToArrayBuffer(workbook);
      const now = new Date();
      const downloadDate = `${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}${now.getFullYear()}`;
      const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const filename = `MonthlyReport-${MONTH_NAMES[month - 1]}-${year}-${downloadDate}-${time}.xlsx`;
      downloadBlob(buffer, filename, "xlsx");
      track("report_exported", { month, year, order_count: rows.length });
      toast.success(`Downloaded: ${filename}`);
    } catch {
      toast.error("Could not export report");
    } finally {
      setIsExporting(false);
      onExportingChange(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8">
        <div className="rounded-lg border bg-card px-4 py-4 space-y-4 shadow-sm">
          {/* Pendapatan */}
          <div className="h-3 bg-muted animate-pulse rounded w-24" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted animate-pulse rounded w-28" />
                <div className="h-4 bg-muted animate-pulse rounded w-16" />
              </div>
            ))}
          </div>
          <div className="border-t pt-4" />
          {/* Pembayaran */}
          <div className="h-3 bg-muted animate-pulse rounded w-24" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted animate-pulse rounded w-20" />
                <div className="h-4 bg-muted animate-pulse rounded w-16" />
              </div>
            ))}
          </div>
          <div className="border-t pt-4" />
          {/* Customer */}
          <div className="h-3 bg-muted animate-pulse rounded w-20" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted animate-pulse rounded w-32" />
                <div className="h-4 bg-muted animate-pulse rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Empty State */}
      {report && report.totalOrders === 0 && (
        <div className="rounded-lg border bg-card px-4 py-12 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            No orders yet di bulan {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
      )}

      {/* Cards */}
      {report && report.totalOrders > 0 && (<>
        {/* Pendapatan */}
        <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Pendapatan</p>
            <div className="divide-y">
              <div className="flex justify-between text-sm py-2">
                <span className="text-muted-foreground">Total orders</span>
                <span className="font-medium text-foreground">{report.totalOrders}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-muted-foreground">Total Penjualan</span>
                <span className="font-medium text-foreground">RM {(report.totalRevenue || 0).toLocaleString("en-MY")}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-muted-foreground">Terkumpul</span>
                <span className={`font-medium ${report.collectedRevenue > 0 ? "text-green-600" : "text-foreground"}`}>RM {(report.collectedRevenue || 0).toLocaleString("en-MY")}</span>
              </div>
              {report.piutang > 0 && (
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">Unpaid</span>
                  <span className="font-medium text-red-600">RM {report.piutang.toLocaleString("en-MY")}</span>
                </div>
              )}
              {report.totalDiscount > 0 && (
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">Diskon Diberikan</span>
                  <span className="font-medium text-muted-foreground">RM {report.totalDiscount.toLocaleString("en-MY")}</span>
                </div>
              )}
            </div>
          </div>

        {/* Monthly Insight Cards */}
        {(() => {
          const insights: { icon: string; text: string; color: string; actionLabel?: string; actionHref?: string }[] = [];

          // High piutang
          if (report.piutang > 0 && report.totalRevenue > 0) {
            const piutangPct = Math.round((report.piutang / report.totalRevenue) * 100);
            if (piutangPct > 30) {
              insights.push({
                icon: "💰",
                text: `${piutangPct}% of this month's sales aren't collected yet (RM ${report.piutang.toLocaleString("en-MY")}).`,
                color: "bg-red-50 border-red-100 text-red-800",
                actionLabel: "Send reminders",
                actionHref: "/pengingat",
              });
            }
          }

          // Late orders
          if (report.lateOrders.length > 0) {
            const totalLate = report.lateOrders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);
            insights.push({
              icon: "⏰",
              text: `${report.lateOrders.length} pesanan lewat tanggal kirim (RM ${totalLate.toLocaleString("en-MY")}).`,
              color: "bg-orange-50 border-orange-100 text-orange-800",
              actionLabel: "View order",
              actionHref: "/orders",
            });
          }

          // Top customer insight
          if (report.topCustomers && report.topCustomers.length > 0) {
            const top = report.topCustomers[0];
            const topPct = report.totalRevenue > 0 ? Math.round((top.totalSpent / report.totalRevenue) * 100) : 0;
            if (topPct > 20) {
              insights.push({
                icon: "⭐",
                text: `${top.name} menyumbang ${topPct}% pendapatan bulan ini (${top.orderCount} pesanan, RM ${top.totalSpent.toLocaleString("en-MY")}).`,
                color: "bg-blue-50 border-blue-100 text-blue-800",
              });
            }
          }

          // Collection rate
          if (report.collectionRate < 50 && report.totalOrders > 5) {
            insights.push({
              icon: "📋",
              text: `Tingkat penagihan hanya ${report.collectionRate}%. Pertimbangkan kebijakan pembayaran di muka.`,
              color: "bg-amber-50 border-amber-100 text-amber-800",
            });
          }

          // Piutang aging — very old debts
          if (report.piutangAging) {
            const oldDebt = report.piutangAging.find((b: { label: string; count: number; amount: number }) => b.label === '> 30 hari' && b.count > 0);
            if (oldDebt) {
              insights.push({
                icon: "🚨",
                text: `${oldDebt.count} pesanan belum dibayar lebih dari 30 hari (RM ${oldDebt.amount.toLocaleString("en-MY")}). Segera tindak lanjuti.`,
                color: "bg-red-50 border-red-100 text-red-800",
                actionLabel: "View details",
                actionHref: "/orders",
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
        <VisitorAnalytics period="monthly" month={month} year={year} />

        {/* Produk Terlaris — moved up */}
        {report.topItems && report.topItems.length > 0 && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Produk Terlaris</p>
              <div className="divide-y">
                {report.topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground w-5 text-right shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.qty} terjual</p>
                      </div>
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
                          Untung RM {item.profit.toLocaleString("en-MY")} ({item.margin}%)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Pembayaran */}
        {(report.paidCount > 0 || report.partialCount > 0 || report.unpaidCount > 0) && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Payment</p>
              <div className="divide-y">
                {report.paidCount > 0 && (
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-muted-foreground">Paid ({report.paidCount})</span>
                    <span className="font-medium text-green-600">RM {report.paidRevenue.toLocaleString("en-MY")}</span>
                  </div>
                )}
                {report.partialCount > 0 && (
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-muted-foreground">DP ({report.partialCount})</span>
                    <span className="font-medium text-yellow-600">RM {report.partialRevenue.toLocaleString("en-MY")}</span>
                  </div>
                )}
                {report.unpaidCount > 0 && (
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-muted-foreground">Belum Bayar ({report.unpaidCount})</span>
                    <span className="font-medium text-red-600">RM {report.unpaidRevenue.toLocaleString("en-MY")}</span>
                  </div>
                )}
                {report.cancelledCount > 0 && (
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-muted-foreground">Dibatalkan ({report.cancelledCount})</span>
                    <span className="font-medium text-muted-foreground">RM {report.cancelledValue.toLocaleString("en-MY")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Order source */}
        {Object.keys(report.ordersBySource).length > 0 && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Order source</p>
              <div className="divide-y">
                {Object.entries(report.ordersBySource).map(([source, count]) => (
                  <div key={source} className="flex justify-between text-sm py-2">
                    <span className="text-muted-foreground">{SOURCE_LABELS[source] || source}</span>
                    <div className="text-right">
                      <span className="font-medium text-foreground">{count} pesanan</span>
                      {report.revenueBySource[source] > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          · RM {report.revenueBySource[source].toLocaleString("en-MY")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Top customers */}
        {report.topCustomers.length > 0 && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Top customers</p>
              <div className="divide-y">
                {report.topCustomers.map((customer, index) => (
                  <div
                    key={customer.phone || customer.name}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground w-5 text-right shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {customer.name}
                        </p>
                        {customer.phone && (
                          <p className="text-xs text-muted-foreground">{customer.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-medium text-foreground">
                        RM {customer.totalSpent.toLocaleString("en-MY")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customer.orderCount} pesanan
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Piutang Aging */}
        {report.piutangAging.some(b => b.count > 0) && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Umur Unpaid</p>
              <div className="divide-y">
                {report.piutangAging.filter(b => b.count > 0).map((bucket) => (
                  <div key={bucket.label} className="flex justify-between text-sm py-2">
                    <span className="text-muted-foreground">{bucket.label}</span>
                    <div className="text-right">
                      <span className="font-medium text-red-600">RM {bucket.amount.toLocaleString("en-MY")}</span>
                      <span className="text-xs text-muted-foreground ml-2">· {bucket.count} pesanan</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>Total Unpaid</span>
                <span className="font-medium text-red-600">
                  RM {report.piutangAging.reduce((sum, b) => sum + b.amount, 0).toLocaleString("en-MY")}
                </span>
              </div>
            </div>
          )}

        {/* Customer */}
        {(report.newCustomerCount > 0 || report.returningCustomerCount > 0) && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Customers</p>
              <div className="divide-y">
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">New</span>
                  <span className="font-medium text-foreground">{report.newCustomerCount}</span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted-foreground">Back</span>
                  <span className="font-medium text-foreground">{report.returningCustomerCount}</span>
                </div>
              </div>
            </div>
          )}

        {/* Low stock */}
        {report.stockAlerts.length > 0 && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Low stock</p>
              <div className="divide-y">
                {report.stockAlerts.map((item) => (
                  <div key={item.name} className="flex justify-between text-sm py-2">
                    <span className="text-foreground">{item.name}</span>
                    <span className="font-medium text-yellow-600">Sisa {item.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Late orders — limited to 3 */}
        {report.lateOrders.length > 0 && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Late orders ({report.lateOrders.length})</p>
              <div className="divide-y">
                {(showAllLate ? report.lateOrders : report.lateOrders.slice(0, 3)).map((order) => (
                  <div key={order.orderNumber} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.orderNumber} · Kirim {new Date(order.deliveryDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" })}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-red-600 shrink-0 ml-3">
                      RM {order.total.toLocaleString("en-MY")}
                    </span>
                  </div>
                ))}
              </div>
              {report.lateOrders.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllLate(!showAllLate)}
                  className="w-full text-xs font-medium text-muted-foreground hover:text-foreground pt-1 transition-colors"
                >
                  {showAllLate ? "Sembunyikan" : `View all ${report.lateOrders.length} pesanan`}
                </button>
              )}
            </div>
          )}

        {/* Rincian Harian */}
        {report.dailyBreakdown.length > 0 && (
          <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">Rincian Harian</p>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-2 text-muted-foreground font-medium">
                        Date
                      </th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                        Orders
                      </th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                        Revenue
                      </th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                        Collected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.dailyBreakdown.map((day) => (
                      <tr key={day.date} className="border-b border-border/50">
                        <td className="py-2 pr-2 text-foreground">
                          {new Date(day.date + "T00:00:00").toLocaleDateString(
                            "en-MY",
                            { day: "numeric", month: "short" }
                          )}
                        </td>
                        <td className="py-2 px-2 text-right text-foreground">
                          {day.orders}
                        </td>
                        <td className="py-2 px-2 text-right text-foreground">
                          RM {day.revenue.toLocaleString("en-MY")}
                        </td>
                        <td className={`py-2 px-2 text-right ${day.collectedRevenue > 0 ? "text-green-600" : "text-foreground"}`}>
                          RM {day.collectedRevenue.toLocaleString("en-MY")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2">
                      <td className="py-2 pr-2 font-semibold text-foreground">
                        Total
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-foreground">
                        {report.dailyBreakdown.reduce(
                          (sum, d) => sum + d.orders,
                          0
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-foreground">
                        Rp
                        {report.dailyBreakdown
                          .reduce((sum, d) => sum + d.revenue, 0)
                          .toLocaleString("en-MY")}
                      </td>
                      <td className={`py-2 px-2 text-right font-semibold ${report.dailyBreakdown.reduce((sum, d) => sum + d.collectedRevenue, 0) > 0 ? "text-green-600" : "text-foreground"}`}>
                        Rp
                        {report.dailyBreakdown
                          .reduce((sum, d) => sum + d.collectedRevenue, 0)
                          .toLocaleString("en-MY")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

      </>)}

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
                type="monthly"
                periodKey={`${year}-${String(month).padStart(2, "0")}`}
                hasData={!!report && report.totalOrders > 0}
                totalOrders={report?.totalOrders || 0}
                businessName={businessName}
                onDownloadReady={handleAIDownloadReady}
                summary={report ? {
                  totalOrders: report.totalOrders,
                  totalRevenue: report.totalRevenue,
                  collectedRevenue: report.collectedRevenue,
                  piutang: report.piutang,
                  aov: report.aov,
                  collectionRate: report.collectionRate,
                  paidCount: report.paidCount,
                  partialCount: report.partialCount,
                  unpaidCount: report.unpaidCount,
                } : undefined}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
