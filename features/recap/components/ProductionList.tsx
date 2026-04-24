"use client";

import { useState, useEffect, useRef } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { getProductionList, getProductionForExport } from "../services/production.service";
import { getProfile } from "@/features/receipts/services/receipt.service";
import { track } from "@/lib/analytics";
import type { ProductionSummary } from "../services/production.service";
import {
  generateExcel,
  workbookToArrayBuffer,
  downloadBlob,
} from "@/lib/utils/export";

interface ProductionListProps {
  dateStr: string;
  selectedDate: Date;
  exportTrigger: number;
  waTrigger: number;
  onExportingChange: (v: boolean) => void;
  onHasDataChange: (v: boolean) => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Paid",
  partial: "DP",
  unpaid: "Unpaid",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid: "text-green-600",
  partial: "text-yellow-600",
  unpaid: "text-red-600",
};

export function ProductionList({ dateStr, selectedDate, exportTrigger, waTrigger, onExportingChange, onHasDataChange }: ProductionListProps) {
  const [production, setProduction] = useState<ProductionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const lastExportTrigger = useRef(exportTrigger);
  const lastWaTrigger = useRef(waTrigger);

  useEffect(() => {
    loadProduction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  useEffect(() => {
    if (waTrigger > 0 && waTrigger !== lastWaTrigger.current) {
      lastWaTrigger.current = waTrigger;
      handleSendWA();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waTrigger]);

  useEffect(() => {
    if (exportTrigger > 0 && exportTrigger !== lastExportTrigger.current) {
      lastExportTrigger.current = exportTrigger;
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger]);

  async function loadProduction() {
    setIsLoading(true);
    const data = await getProductionList(dateStr);
    setProduction(data);
    onHasDataChange(!!data && data.totalOrders > 0);
    if (data) {
      track("production_viewed", { date: dateStr, total_orders: data.totalOrders, total_items: data.totalItems });
    }

    const profile = await getProfile();
    if (profile) {
      setBusinessName(profile.business_name || "Toko Saya");
    }
    setIsLoading(false);
  }

  async function handleExport() {
    onExportingChange(true);
    try {
      const data = await getProductionForExport(dateStr);
      if (!data || data.items.length === 0) {
        toast.error("No data to export");
        return;
      }

      const XLSX = await import("xlsx");

      const dateFormatted = selectedDate.toLocaleDateString("en-MY", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });

      const totalRevenue = data.orders.reduce((s, o) => s + o.total, 0);
      const totalPaid = data.orders.reduce((s, o) => s + o.dibayar, 0);
      const totalRemaining = totalRevenue - totalPaid;

      // Sheet 1: Summary with context
      const summaryData: (string | number)[][] = [
        [`PERSIAPAN — ${dateFormatted}`],
        [`${data.orders.length} pesanan · ${data.items.reduce((s, i) => s + i.jumlah, 0)} item`],
        [],
        ["YANG HARUS DISIAPKAN"],
        ["Product", "Quantity", "From orders"],
        ...data.items.map(i => [i.produk, i.jumlah, i.dari_pesanan]),
        [],
        ["DETAIL PESANAN"],
        ["No.", "Customer", "Item", "Total (RM)", "Paid (RM)", "Balance (RM)", "Status"],
        ...data.orders.map(o => [o.no, o.pelanggan, o.item, o.total, o.dibayar, o.sisa, o.pembayaran]),
        [],
        ["PAYMENTS"],
        ["Total", totalRevenue],
        ["Collected", totalPaid],
        ...(totalRemaining > 0 ? [["Unpaid", totalRemaining] as (string | number)[]] : []),
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Persiapan");

      const buffer = await workbookToArrayBuffer(workbook);
      const dayLabel = selectedDate.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }).replace(/ /g, "-");
      const filename = `Persiapan-${dayLabel}.xlsx`;
      downloadBlob(buffer, filename, "xlsx");
      track("production_exported", { date: dateStr });
      toast.success(`Downloaded: ${filename}`);
    } catch {
      toast.error("Gagal mengekspor daftar persiapan");
    } finally {
      onExportingChange(false);
    }
  }

  function handleSendWA() {
    if (!production) return;

    const dateLabel = selectedDate.toLocaleDateString("en-MY", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const itemLines = production.items
      .map((i) => `${i.name}: ${i.qty}`)
      .join("\n");

    const orderLines = production.orders
      .map((o, i) => {
        const items = o.items.map((it) => `${it.qty} ${it.name}`).join(", ");
        return `${i + 1}. ${o.customerName} (${items})`;
      })
      .join("\n");

    const piutang = production.totalRevenue - production.collectedRevenue;

    const message = `📋 *Daftar Persiapan — ${dateLabel}*
${production.totalOrders} pesanan · ${production.totalItems} item

*YANG HARUS DISIAPKAN:*
${itemLines}

*DETAIL PESANAN:*
${orderLines}
${piutang > 0 ? `\n💰 Belum dibayar: RM ${piutang.toLocaleString("en-MY")}` : ""}
_${businessName} · Tokoflow_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
    track("production_sent_wa", { date: dateStr });
  }

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8">
        <div className="rounded-lg border bg-card px-4 py-4 space-y-4 shadow-sm">
          <div className="h-3 bg-muted animate-pulse rounded w-32" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted animate-pulse rounded w-28" />
                <div className="h-4 bg-muted animate-pulse rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!production || production.totalOrders === 0) {
    return (
      <div className="space-y-4 pb-8">
        <div className="rounded-lg border bg-card px-4 py-12 text-center shadow-sm">
          <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No orders yet untuk tanggal ini
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2 max-w-xs mx-auto">
            Saat pelanggan pesan lewat store link dengan tanggal pengiriman, total yang harus disiapkan akan muncul di sini otomatis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Ringkasan Persiapan */}
      <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Yang Harus Disiapkan</p>
          <p className="text-xs text-muted-foreground">
            {production.totalOrders} pesanan · {production.totalItems} item
          </p>
        </div>
        <div className="divide-y">
          {production.items.map((item) => (
            <div key={item.name} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <p className="text-sm text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.orderCount} pesanan</p>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums shrink-0 ml-3">
                {item.qty}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Order details */}
      <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground">Order details</p>
        <div className="divide-y">
          {production.orders.map((order, index) => (
            <div key={order.orderNumber} className="py-2.5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{index + 1}.</span>
                    <p className="text-sm font-medium text-foreground truncate">{order.customerName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-7">
                    {order.items.map((it) => `${it.qty} ${it.name}`).join(", ")}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-medium text-foreground">
                    RM {order.total.toLocaleString("en-MY")}
                  </p>
                  <p className={`text-xs ${PAYMENT_COLORS[order.paymentStatus] || "text-muted-foreground"}`}>
                    {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                    {order.paymentStatus === "partial" && order.paidAmount > 0 && (
                      <> RM {order.paidAmount.toLocaleString("en-MY")}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Pembayaran */}
      {(production.paidCount > 0 || production.partialCount > 0 || production.unpaidCount > 0) && (
        <div className="rounded-xl border bg-card px-4 py-4 space-y-2 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Payment</p>
          <div className="divide-y">
            <div className="flex justify-between text-sm py-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-foreground">RM {production.totalRevenue.toLocaleString("en-MY")}</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-muted-foreground">Terkumpul</span>
              <span className={`font-medium ${production.collectedRevenue > 0 ? "text-green-600" : "text-foreground"}`}>
                RM {production.collectedRevenue.toLocaleString("en-MY")}
              </span>
            </div>
            {production.totalRevenue - production.collectedRevenue > 0 && (
              <div className="flex justify-between text-sm py-2">
                <span className="text-muted-foreground">Unpaid</span>
                <span className="font-medium text-red-600">
                  RM {(production.totalRevenue - production.collectedRevenue).toLocaleString("en-MY")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}



    </div>
  );
}
