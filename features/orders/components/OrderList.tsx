"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ShoppingBag, ArrowRight, X, CircleDollarSign, ArrowRightCircle, Flame, CalendarDays, ChevronLeft, ChevronRight, Download, Loader2, Share2, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { getOrders, getOrder, getOrderCountsByMonth, getDeliveryCountsByMonth, bulkMarkPaid, bulkUpdateStatus, getTodaySummary } from "../services/order.service";
import type { TodaySummary } from "../services/order.service";
import { fetchOrdersWithCache, syncPendingOrders, pendingToDisplayOrders, startAutoSync } from "@/lib/offline/sync";
import { getPendingOrders } from "@/lib/offline/db";
import { getProfile } from "@/features/receipts/services/receipt.service";
import type { Profile } from "@/features/receipts/types/receipt.types";
import { buildOrderConfirmation, buildPreorderConfirmation } from "@/lib/utils/wa-messages";
import { openWhatsApp } from "@/lib/utils/wa-open";
import { createClient } from "@/lib/supabase/client";
import { playNotificationSound } from "@/lib/utils/notification-sound";
import { hapticAction } from "@/lib/utils/haptics";
import { track } from "@/lib/analytics";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { WAPreviewSheet } from "./WAPreviewSheet";
import { OrderCard } from "./OrderCard";
import { SwipeConfirmModal } from "./SwipeConfirmModal";
import { usePeakMode } from "../hooks/usePeakMode";
import { useFeatureUnlock } from "../hooks/useFeatureUnlock";
import { updateOrderStatus } from "../services/order.service";
import type { Order, OrderStatus } from "../types/order.types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from "../types/order.types";

const STATUS_CHIPS: { label: string; value: string; type: "status" }[] = [
  { label: "New", value: "new", type: "status" },
  { label: "Processing", value: "processed", type: "status" },
  { label: "Shipped", value: "shipped", type: "status" },
  { label: "Completed", value: "done", type: "status" },
  { label: "Cancelled", value: "cancelled", type: "status" },
];

const DATE_CHIPS: { label: string; value: string }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "7 days", value: "7days" },
  { label: "30 days", value: "30days" },
];

const PAGE_SIZE = 50;

function groupOrdersByDate(orders: Order[]): { key: string; label: string; count: number; orders: Order[] }[] {
  if (orders.length === 0) return [];

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

  const groupMap = new Map<string, Order[]>();
  for (const order of orders) {
    const d = new Date(order.created_at);
    const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const existing = groupMap.get(dateKey);
    if (existing) existing.push(order);
    else groupMap.set(dateKey, [order]);
  }

  return Array.from(groupMap.entries()).map(([key, groupOrders]) => {
    let label: string;
    if (key === todayStr) label = "Today";
    else if (key === yesterdayStr) label = "Yesterday";
    else {
      const d = new Date(key + "T00:00");
      label = d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
    }
    return { key, label, count: groupOrders.length, orders: groupOrders };
  });
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [preorderFilter, setPreorderFilter] = useState(false);
  const [dineInFilter, setDineInFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [dateMode, setDateMode] = useState<"created" | "delivery">("created");
  const [calendarCounts, setCalendarCounts] = useState<Record<string, number>>({});
  const dateCalendarRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const [ordersUsed, setOrdersUsed] = useState(0);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const groups = useMemo(() => groupOrdersByDate(orders), [orders]);

  // Multi-select mode
  const router = useRouter();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WA preview sheet
  const [waPreview, setWaPreview] = useState<{ order: Order } | null>(null);

  // Swipe-to-action
  const [swipeConfirmOrder, setSwipeConfirmOrder] = useState<Order | null>(null);

  const [summaryKey, setSummaryKey] = useState(0);

  // Morning delivery summary
  const [deliverySummary, setDeliverySummary] = useState<{ count: number; items: { name: string; qty: number }[]; revenue: number } | null>(null);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);

  // Peak mode & progressive disclosure
  const isPeak = usePeakMode();
  const { bulkActions } = useFeatureUnlock(ordersUsed);

  // Slug claim confirmation toast
  const searchParamsHook = useSearchParams();
  useEffect(() => {
    const slugClaimed = searchParamsHook.get("slug_claimed");
    if (slugClaimed) {
      toast.success(`Link tokoflow.com/${slugClaimed} is now active!`, { duration: 5000 });
      window.history.replaceState({}, "", "/orders");
    }
  }, [searchParamsHook]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, preorderFilter, dineInFilter, dateFilter, dateMode, debouncedSearch]);

  // Load today's delivery summary for morning banner
  useEffect(() => {
    async function loadDeliverySummary() {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const todayOrders = await getOrders({
        dateField: "delivery_date",
        dateFrom: `${todayStr}T00:00:00`,
        dateTo: `${todayStr}T23:59:59`,
      });
      const active = todayOrders.filter(o => o.status !== "cancelled" && o.status !== "done");
      if (active.length === 0) { setDeliverySummary(null); return; }
      const itemMap = new Map<string, number>();
      let revenue = 0;
      for (const o of active) {
        revenue += o.total || 0;
        for (const item of o.items) {
          const key = item.name.toLowerCase();
          itemMap.set(key, (itemMap.get(key) || 0) + item.qty);
        }
      }
      const items = Array.from(itemMap.entries())
        .map(([name, qty]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), qty }))
        .sort((a, b) => b.qty - a.qty);
      setDeliverySummary({ count: active.length, items, revenue });
    }
    loadDeliverySummary();
  }, [orders]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dateCalendarRef.current && !dateCalendarRef.current.contains(e.target as Node)) {
        setShowDateCalendar(false);
      }
    }
    if (showDateCalendar) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showDateCalendar]);

  // Fetch order counts for the visible calendar month
  useEffect(() => {
    if (showDateCalendar) {
      if (dateMode === "delivery") {
        getDeliveryCountsByMonth(pickerYear, pickerMonth + 1).then(setCalendarCounts);
      } else {
        getOrderCountsByMonth(pickerYear, pickerMonth + 1).then(setCalendarCounts);
      }
    }
  }, [showDateCalendar, pickerMonth, pickerYear, dateMode]);

  function getDateRange(filter: string | null): { dateFrom?: string; dateTo?: string } {
    if (!filter) return {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (filter === "today") return { dateFrom: today.toISOString(), dateTo: tomorrow.toISOString() };
    if (filter === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { dateFrom: yesterday.toISOString(), dateTo: today.toISOString() };
    }
    if (filter === "7days") {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { dateFrom: d.toISOString() };
    }
    if (filter === "30days") {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return { dateFrom: d.toISOString() };
    }
    if (filter.startsWith("custom:")) {
      const dateStr = filter.slice(7);
      const d = new Date(dateStr + "T00:00:00");
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return { dateFrom: d.toISOString(), dateTo: next.toISOString() };
    }
    return {};
  }

  useEffect(() => {
    async function loadProfile() {
      const profile = await getProfile();
      if (profile) {
        setOrdersUsed(profile.orders_used || 0);
        setProfileData(profile);
      }
    }
    loadProfile();
  }, []);

  // Realtime: notify on new orders + payment claims
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload: { new: { id?: string; source?: string; customer_name?: string; customer_phone?: string; order_number?: string } }) => {
          if (payload.new.source === "order_link" || payload.new.source === "whatsapp") {
            const name = payload.new.customer_name || "Customer";
            const via = payload.new.source === "whatsapp" ? " via WA" : "";
            const messages = [
              `New order from ${name}${via}! 🔔`,
              `${name} just ordered${via}! ✨`,
              `Cha-ching! Order received from ${name}${via} 🎉`,
              `Sales rolling in! ${name} placed an order${via} 🔥`,
            ];
            const msg = messages[Math.floor(Math.random() * messages.length)];
            const orderId = payload.new.id;
            toast.success(msg, {
              description: payload.new.order_number,
              duration: 12000,
              action: orderId ? {
                label: "Konfirmasi WA",
                onClick: async () => {
                  const found = await getOrder(orderId);
                  if (found) {
                    const waMsg = found.is_preorder
                      ? buildPreorderConfirmation(found)
                      : buildOrderConfirmation(found);
                    openWhatsApp(waMsg, found.customer_phone);
                  }
                },
              } : undefined,
            });
            playNotificationSound();
          }
          // Refresh list for any new order
          loadOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload: { old: { payment_claimed_at?: string | null }; new: { payment_claimed_at?: string | null; customer_name?: string; order_number?: string } }) => {
          // Notify when customer claims payment (payment_claimed_at goes from null to a value)
          if (!payload.old.payment_claimed_at && payload.new.payment_claimed_at) {
            const name = payload.new.customer_name || "Customer";
            toast.info(`${name} reports payment`, {
              description: `${payload.new.order_number} — Cek pembayaran lalu tandai lunas`,
              duration: 10000,
            });
            playNotificationSound();
          }
          // Refresh list for any update
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-sync pending orders when coming back online
  useEffect(() => {
    const cleanup = startAutoSync((syncedCount) => {
      if (syncedCount > 0) {
        track("offline_orders_synced", { count: syncedCount });
        toast.success(`${syncedCount} order${syncedCount === 1 ? "" : "s"} synced`);
        loadOrders();
      }
    });
    return cleanup;
  }, []);

  async function loadOrders() {
    setIsLoading(true);

    const { dateFrom, dateTo } = getDateRange(dateFilter);
    const dateField = dateFilter && dateMode === "delivery" ? "delivery_date" as const : undefined;
    const { orders: data, fromCache: cached } = await fetchOrdersWithCache({
      status: statusFilter || undefined,
      preorderOnly: preorderFilter || undefined,
      dineInOnly: dineInFilter || undefined,
      dateFrom,
      dateTo,
      dateField,
      search: debouncedSearch || undefined,
      offset: 0,
    });
    setFromCache(cached);

    // Merge pending offline orders (prepended)
    const pendings = await getPendingOrders();
    const pendingDisplay = pendingToDisplayOrders(pendings);
    setOrders([...pendingDisplay, ...data]);

    setHasMore(!cached && data.length >= PAGE_SIZE);
    setIsLoading(false);
    setSummaryKey((k) => k + 1);
  }

  async function loadMore() {
    setIsLoadingMore(true);

    const { dateFrom, dateTo } = getDateRange(dateFilter);
    const dateField = dateFilter && dateMode === "delivery" ? "delivery_date" as const : undefined;
    const data = await getOrders({
      status: statusFilter || undefined,
      preorderOnly: preorderFilter || undefined,
      dineInOnly: dineInFilter || undefined,
      dateFrom,
      dateTo,
      dateField,
      search: debouncedSearch || undefined,
      offset: orders.length,
    });
    setOrders((prev) => [...prev, ...data]);
    setHasMore(data.length >= PAGE_SIZE);
    setIsLoadingMore(false);
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setShowStatusPicker(false);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  }

  function handleLongPress(id: string) {
    if (selectMode || !bulkActions) return;
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  }

  const handlePointerDown = useCallback((id: string) => {
    if (!bulkActions) return;
    longPressTimer.current = setTimeout(() => handleLongPress(id), 500);
  }, [selectMode, bulkActions]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  async function handleBulkMarkPaid() {
    if (selectedIds.size === 0 || isBulkUpdating) return;
    setIsBulkUpdating(true);
    const count = await bulkMarkPaid(Array.from(selectedIds));
    setIsBulkUpdating(false);
    if (count > 0) {
      hapticAction();
      toast.success(`${count} orders ditandai lunas`);
      exitSelectMode();
      loadOrders();
    } else {
      toast.error("Failed to update payment");
    }
  }

  async function handleBulkUpdateStatus(status: OrderStatus) {
    if (selectedIds.size === 0 || isBulkUpdating) return;
    setIsBulkUpdating(true);
    const count = await bulkUpdateStatus(Array.from(selectedIds), status);
    setIsBulkUpdating(false);
    setShowStatusPicker(false);
    if (count > 0) {
      hapticAction();
      toast.success(`${count} orders updated to ${ORDER_STATUS_LABELS[status]}`);
      exitSelectMode();
      loadOrders();
    } else {
      toast.error("Failed to update status");
    }
  }

  const formatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins}m lalu`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;

    return date.toLocaleTimeString("en-MY", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatDeliveryDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const deliveryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    const timeStr = hasTime ? ` ${date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}` : "";

    if (deliveryDay.getTime() === today.getTime()) return `Hari ini${timeStr}`;
    if (deliveryDay.getTime() === tomorrow.getTime()) return `Besok${timeStr}`;

    return date.toLocaleDateString("en-MY", { day: "numeric", month: "short" }) + timeStr;
  }, []);

  useEffect(() => {
    getTodaySummary().then(setTodaySummary);
  }, [summaryKey]);

  function handleSwipeAdvance(order: Order) {
    setSwipeConfirmOrder(order);
  }

  function handleSwipeWA(order: Order) {
    setWaPreview({ order });
  }

  function handleSwipeConfirm(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSwipeConfirmOrder(null);
    setSummaryKey((k) => k + 1);
  }

  async function handleExportAll() {
    setIsExporting(true);
    try {
      const allOrders = await getOrders({ limit: 10000 });
      if (!allOrders.length) { toast.info("No orders"); return; }

      const XLSX = await import("xlsx");
      const STATUS_MAP: Record<string, string> = { new: "New", menunggu: "Pending", processed: "Processing", shipped: "Shipped", done: "Completed", cancelled: "Cancelled" };
      const PAYMENT_MAP: Record<string, string> = { paid: "Paid", partial: "Partial", unpaid: "Unpaid" };
      const SOURCE_MAP: Record<string, string> = { manual: "Manual", order_link: "Store link", whatsapp: "WhatsApp" };

      const rows = allOrders.map((o) => ({
        "Order no.": o.order_number,
        "Date": new Date(o.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }),
        "Customer": o.customer_name || "-",
        "Phone": o.customer_phone || "-",
        "Item": o.items.map((it) => `${it.name} x${it.qty}`).join(", "),
        "Subtotal": o.subtotal,
        "Discount": o.discount || 0,
        "Total": o.total,
        "Paid": o.paid_amount || 0,
        "Balance": Math.max(0, o.total - (o.paid_amount || 0)),
        "Status": STATUS_MAP[o.status] || o.status,
        "Payment": PAYMENT_MAP[o.payment_status] || o.payment_status,
        "Source": SOURCE_MAP[o.source] || o.source,
        "Pre-order": o.is_preorder ? "Yes" : "-",
        "Subscription": o.is_langganan ? "Yes" : "-",
        "Walk-in": o.is_dine_in ? "Yes" : "-",
        "Table": o.table_number || "-",
        "Delivery date": o.delivery_date ? new Date(o.delivery_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "-",
        "Note": o.notes || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Order");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Orders-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Orders downloaded");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to download data");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 min-h-9">
        {selectMode ? (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={exitSelectMode}
                className="h-10 w-10 -ml-2 flex items-center justify-center hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="text-lg font-semibold text-foreground">
                {selectedIds.size} dipilih
              </h1>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">Orders</h1>
                {orders.length > 0 && (
                  <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {orders.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">All orders received from customers</p>
            </div>
            {isPeak && (
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full bg-warm-amber-light text-warm-amber border border-warm-amber/20 items-center gap-1">
                <Flame className="w-3 h-3" />
                Busy
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportAll}
                disabled={isExporting || orders.length === 0}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium bg-card border border-border text-foreground shadow-sm hover:bg-muted active:bg-muted disabled:opacity-30 transition-colors cursor-pointer"
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Download</span>
              </button>
              <Link
                href="/orders/new"
                className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium bg-warm-green text-white hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Log order
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Morning Delivery Summary */}
      {deliverySummary && (
        <div className="rounded-xl border bg-card px-4 py-3 shadow-sm space-y-2">
          <Link
            href="/prep"
            className="flex items-center justify-between hover:opacity-70 transition-opacity"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Today: {deliverySummary.count} order{deliverySummary.count === 1 ? "" : "s"} · RM {deliverySummary.revenue.toLocaleString("en-MY")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {deliverySummary.items.slice(0, 3).map(i => `${i.name} (${i.qty})`).join(", ")}
                {deliverySummary.items.length > 3 && `, +${deliverySummary.items.length - 3}`}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
          </Link>
          {todaySummary && (todaySummary.unpaidCount > 0 || todaySummary.pendingCount > 0) && (
            <div className="flex items-center gap-2 pt-1 border-t">
              {todaySummary.pendingCount > 0 && (
                <span className="text-xs font-medium text-foreground">{todaySummary.pendingCount} perlu diproses</span>
              )}
              {todaySummary.pendingCount > 0 && todaySummary.unpaidCount > 0 && (
                <span className="text-muted-foreground/40">·</span>
              )}
              {todaySummary.unpaidCount > 0 && (
                <span className="text-xs font-medium text-amber-600">{todaySummary.unpaidCount} unpaid</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Time Saved Estimate */}
      {profileData && (profileData.orders_used ?? 0) > 0 && (() => {
        // Estimate: each Link Toko order saves ~5 min vs manual WA chat
        const linkOrders = orders.filter(o => o.source === "order_link").length;
        const minutesSaved = linkOrders * 5;
        if (minutesSaved < 5) return null;
        const hours = Math.floor(minutesSaved / 60);
        const mins = minutesSaved % 60;
        const timeStr = hours > 0 ? `${hours} jam ${mins > 0 ? `${mins} menit` : ""}` : `${mins} menit`;
        return (
          <div className="rounded-xl border bg-emerald-50/50 border-emerald-100 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-800">
                <span className="font-semibold">~{timeStr} saved</span> this month from {linkOrders} order{linkOrders === 1 ? "" : "s"} via Store Link
              </p>
            </div>
          </div>
        );
      })()}

      {/* Ajak Teman UMKM (Champion Kit) */}
      {profileData && profileData.referral_code && (profileData.orders_used ?? 0) >= 3 && (
        <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate">Kenal UMKM lain yang masih catat di kertas?</p>
            </div>
            <button
              onClick={() => {
                const link = `https://tokoflow.com/register?ref=${profileData.referral_code}`;
                const text = `Hai! I'm using Tokoflow to take orders.\nCustomers order through a link, and everything lands in my dashboard.\n\nTry it free: ${link}\n\n_From selling to a real business_`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                track("champion_invite_tap");
              }}
              className="shrink-0 h-8 px-3 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:bg-[#25D366]/90 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3 h-3" />
              Ajak via WA
            </button>
          </div>
        </div>
      )}

      {/* Search — hide when no orders (empty state takes priority) */}
      {orders.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, number, or transfer amount..."
            className="w-full h-11 pl-10 pr-4 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card transition-colors placeholder:text-muted-foreground"
          />
        </div>
      )}

      {/* Filter Chips — hide when no orders */}
      {(orders.length > 0 || search || statusFilter || dateFilter) && <div>
        {(() => {
          const hasAnyFilter = !!(statusFilter || dateFilter || preorderFilter || dineInFilter);
          const chipBase = "inline-flex items-center h-7 px-2.5 text-[11px] font-medium rounded-full border whitespace-nowrap shrink-0 transition-colors cursor-pointer";
          const chipActive = "bg-warm-green-light border-warm-green/30 text-warm-green hover:bg-warm-green/20";
          const chipInactive = "bg-muted/50 border-border text-foreground/70 hover:bg-muted";
          return (
            <div className="relative space-y-2">
              <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    const opening = !showDateCalendar;
                    setShowDateCalendar(opening);
                    if (opening) {
                      if (dateFilter?.startsWith("custom:")) {
                        const d = new Date(dateFilter.slice(7) + "T00:00");
                        setPickerMonth(d.getMonth());
                        setPickerYear(d.getFullYear());
                      } else {
                        setPickerMonth(new Date().getMonth());
                        setPickerYear(new Date().getFullYear());
                      }
                    }
                  }}
                  className={`${chipBase} gap-1 ${
                    dateFilter ? chipActive : showDateCalendar ? "bg-warm-green/10 border-warm-green/30 text-warm-green" : chipInactive
                  }`}
                >
                  <CalendarDays className="w-3 h-3" />
                  {dateFilter
                    ? `${dateMode === "delivery" ? "Delivery" : "Order"}: ${DATE_CHIPS.find(c => c.value === dateFilter)?.label
                      || (dateFilter.startsWith("custom:")
                        ? new Date(dateFilter.slice(7) + "T00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short" })
                        : "")}`
                    : "Date"
                  }
                </button>

                <div className="w-px h-4 bg-border/50 shrink-0" />

                {STATUS_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === chip.value ? null : chip.value as OrderStatus)}
                    className={`${chipBase} ${statusFilter === chip.value ? chipActive : chipInactive}`}
                  >
                    {chip.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPreorderFilter(!preorderFilter)}
                  className={`${chipBase} ${preorderFilter ? "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100" : chipInactive}`}
                >
                  Pre-order
                </button>

                <button
                  type="button"
                  onClick={() => setDineInFilter(!dineInFilter)}
                  className={`${chipBase} ${dineInFilter ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" : chipInactive}`}
                >
                  Walk-in
                </button>

              </div>
                {hasAnyFilter && (
                  <button
                    type="button"
                    onClick={() => { setStatusFilter(null); setDateFilter(null); setPreorderFilter(false); setDineInFilter(false); setShowDateCalendar(false); }}
                    className={`${chipBase} border-warm-rose/30 bg-warm-rose-light text-warm-rose hover:bg-warm-rose/20 shrink-0`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Date picker popup */}
              {showDateCalendar && (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const MONTH_NAMES_CAL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const DAY_LABELS_CAL = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
                function getCalDays(y: number, m: number) {
                  const first = new Date(y, m, 1);
                  let start = first.getDay() - 1;
                  if (start < 0) start = 6;
                  const total = new Date(y, m + 1, 0).getDate();
                  const days: (number | null)[] = [];
                  for (let i = 0; i < start; i++) days.push(null);
                  for (let d = 1; d <= total; d++) days.push(d);
                  return days;
                }
                const calDays = getCalDays(pickerYear, pickerMonth);
                const selectedStr = dateFilter?.startsWith("custom:") ? dateFilter.slice(7) : null;
                const selectedObj = selectedStr ? new Date(selectedStr + "T00:00") : null;
                return (
                  <div ref={dateCalendarRef} className="absolute left-0 top-full mt-1 z-50 bg-card border rounded-xl shadow-lg p-3 w-72">
                    {/* Mode toggle: Order | Delivery */}
                    <div className="flex bg-muted rounded-lg p-0.5 mb-3">
                      <button
                        type="button"
                        onClick={() => setDateMode("created")}
                        className={`flex-1 h-7 text-[11px] font-medium rounded-md transition-colors ${dateMode === "created" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                      >
                        Order
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateMode("delivery")}
                        className={`flex-1 h-7 text-[11px] font-medium rounded-md transition-colors ${dateMode === "delivery" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                      >
                        Delivery
                      </button>
                    </div>
                    {/* Quick presets */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {DATE_CHIPS.map((chip) => (
                        <button
                          key={chip.value}
                          type="button"
                          onClick={() => { setDateFilter(dateFilter === chip.value ? null : chip.value); setShowDateCalendar(false); }}
                          className={`inline-flex items-center h-7 px-2.5 text-[11px] font-medium rounded-full border transition-colors ${
                            dateFilter === chip.value ? chipActive : chipInactive
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                    {/* Calendar */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); }
                          else setPickerMonth(pickerMonth - 1);
                        }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <span className="font-semibold text-sm text-foreground">
                        {MONTH_NAMES_CAL[pickerMonth]} {pickerYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); }
                          else setPickerMonth(pickerMonth + 1);
                        }}
                        disabled={dateMode === "created" && pickerYear === today.getFullYear() && pickerMonth >= today.getMonth()}
                        className="p-1.5 hover:bg-muted rounded-lg disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                      {DAY_LABELS_CAL.map((d) => (
                        <span key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {calDays.map((day, i) => {
                        if (day === null) return <span key={`empty-${i}`} />;
                        const d = new Date(pickerYear, pickerMonth, day);
                        d.setHours(0, 0, 0, 0);
                        const isFuture = dateMode === "created" && d > today;
                        const isSelected = selectedObj && d.getTime() === selectedObj.getTime();
                        const isToday = d.getTime() === today.getTime();
                        const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const count = calendarCounts[dateStr] || 0;
                        const noOrders = count === 0 && !isFuture;
                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isFuture || noOrders}
                            onClick={() => { setDateFilter(`custom:${dateStr}`); setShowDateCalendar(false); }}
                            className={`relative h-8 text-sm rounded-lg transition-colors ${
                              isSelected ? "bg-primary text-primary-foreground" :
                              isToday && count > 0 ? "bg-muted font-semibold text-foreground" :
                              count > 0 ? "hover:bg-muted text-foreground" :
                              "text-muted-foreground/40"
                            } ${isFuture ? "opacity-30 cursor-not-allowed" : ""}`}
                          >
                            {day}
                            {count > 0 && !isSelected && (
                              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[9px] font-bold rounded-full bg-warm-green text-white">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>}

      {/* Order List */}
      {isLoading ? (
        <div className="rounded-xl border bg-card shadow-sm divide-y divide-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-2/5" />
                  <div className="h-3 bg-muted animate-pulse rounded w-12" />
                </div>
                <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                  <div className="flex gap-1.5">
                    <div className="h-5 bg-muted animate-pulse rounded-full w-14" />
                    <div className="h-5 bg-muted animate-pulse rounded-full w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          {search || statusFilter || preorderFilter || dineInFilter || dateFilter ? (
            <p className="text-muted-foreground text-sm">
              No orders
              {preorderFilter ? " (preorder)" : ""}
              {dineInFilter ? " (direct)" : ""}
              {statusFilter ? ` · ${STATUS_CHIPS.find((c) => c.value === statusFilter)?.label.toLowerCase()}` : ""}
              {search ? " found" : ""}
            </p>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">No orders yet</h2>
              <p className="text-sm text-muted-foreground mb-6">Log your first order — takes 30 seconds</p>
              <div className="flex flex-col items-center gap-3">
                <Link
                  href="/orders/new"
                  className="h-9 px-4 bg-warm-green text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 hover:bg-warm-green-hover transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Log order
                </Link>
                <Link
                  href="/orders/new?contoh=1"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Try with a sample
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key}>
              {/* Sticky date header */}
              <div className="sticky top-0 z-10 flex items-center gap-2 py-1.5 bg-background">
                <span className="text-xs font-semibold text-foreground">{group.label}</span>
                <span className="text-[11px] text-muted-foreground">({group.count})</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              {/* Cards */}
              <div className="rounded-xl border bg-card shadow-sm divide-y divide-border overflow-hidden">
                {group.orders.map((order) => {
                  const isPending = order.id.startsWith("pending_");
                  return (
                    <div key={order.id} className="relative">
                      <OrderCard
                        order={order}
                        selectMode={isPending ? false : selectMode}
                        isSelected={selectedIds.has(order.id)}
                        onSelect={isPending ? () => {} : toggleSelect}
                        onLongPress={isPending ? () => {} : handleLongPress}
                        onPointerDown={isPending ? () => {} : handlePointerDown}
                        cancelLongPress={isPending ? () => {} : cancelLongPress}
                        onClick={isPending ? () => {} : (id) => router.push(`/orders/${id}/edit`)}
                        formatTime={formatTime}
                        formatDeliveryDate={formatDeliveryDate}
                        onSwipeAdvance={isPending ? () => {} : handleSwipeAdvance}
                        onSwipeWA={isPending ? () => {} : handleSwipeWA}
                      />
                      {isPending && (
                        <div className="absolute top-2 right-2 inline-flex items-center gap-1 h-5 px-2 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          Waiting to sync
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && !fromCache && (
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full h-11 mt-2 text-sm font-medium text-muted-foreground rounded-lg border hover:bg-muted/50 disabled:opacity-50 transition-colors"
            >
              {isLoadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}

      {/* Onboarding Checklist — below orders, hide during peak */}
      {!isPeak && <OnboardingChecklist />}

      {/* FAB — hide in select mode */}
      {!selectMode && (
        <Link
          href="/orders/new"
          className={`fixed bottom-6 right-5 ${isPeak ? "w-16 h-16" : "w-14 h-14"} bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg hover:bg-primary/90 squish-press animate-idle-pulse transition-all z-30 lg:hidden`}
        >
          <Plus className="w-6 h-6" />
        </Link>
      )}

      {/* Bulk action bar — select mode (unlocked after 10 orders) */}
      {bulkActions && selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border z-30">
          <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
            {/* Status picker */}
            {showStatusPicker && (
              <div className="flex items-center gap-2 flex-wrap">
                {ORDER_STATUS_FLOW.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleBulkUpdateStatus(status)}
                    disabled={isBulkUpdating}
                    className="h-9 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted active:bg-muted/80 disabled:opacity-50 transition-colors"
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            )}
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkMarkPaid}
                disabled={isBulkUpdating}
                className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-lg bg-warm-green-light border border-warm-green/30 text-warm-green text-sm font-medium hover:bg-warm-green-light/80 active:bg-warm-green-light/60 disabled:opacity-50 transition-colors"
              >
                <CircleDollarSign className="w-4 h-4" />
                Mark as paid ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={() => setShowStatusPicker(!showStatusPicker)}
                disabled={isBulkUpdating}
                className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted active:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                <ArrowRightCircle className="w-4 h-4" />
                Ubah Status ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swipe Confirm Modal */}
      {swipeConfirmOrder && (() => {
        const idx = ORDER_STATUS_FLOW.indexOf(swipeConfirmOrder.status);
        const nextStatus = idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1
          ? ORDER_STATUS_FLOW[idx + 1]
          : null;
        return nextStatus ? (
          <SwipeConfirmModal
            open
            onClose={() => setSwipeConfirmOrder(null)}
            onConfirm={handleSwipeConfirm}
            order={swipeConfirmOrder}
            nextStatus={nextStatus}
          />
        ) : null;
      })()}

      {/* WA Preview Sheet */}
      {waPreview && (
        <WAPreviewSheet
          open={!!waPreview}
          onClose={() => setWaPreview(null)}
          customerName={waPreview.order.customer_name}
          customerPhone={waPreview.order.customer_phone}
          initialMessage={buildOrderConfirmation(waPreview.order)}
        />
      )}
    </div>
  );
}
