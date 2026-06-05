"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Check, Package, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { bulkUpdateStatus } from "@/features/orders/services/order.service";
import type { Order } from "@/features/orders/types/order.types";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";

type PendingOrder = Pick<Order, "id" | "order_number" | "customer_name" | "items" | "total" | "status" | "notes" | "delivery_date" | "delivery_address">;

// Aggregate items across all pending orders for the packing summary
function buildItemSummary(orders: PendingOrder[]) {
  const map = new Map<string, { qty: number; orderIds: string[] }>();
  for (const order of orders) {
    if (!Array.isArray(order.items)) continue;
    for (const item of order.items as { name: string; qty: number }[]) {
      const key = item.name;
      const existing = map.get(key) ?? { qty: 0, orderIds: [] };
      existing.qty += item.qty;
      if (!existing.orderIds.includes(order.id)) existing.orderIds.push(order.id);
      map.set(key, existing);
    }
  }
  return Array.from(map.entries())
    .map(([name, { qty, orderIds }]) => ({ name, qty, orderCount: orderIds.length }))
    .sort((a, b) => b.qty - a.qty);
}

export default function PendingOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"processed" | "shipped" | "done">("processed");
  const [updating, setUpdating] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?status=new,processed&limit=200");
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch { /* network error */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPending();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPending]);

  function toggleOrder(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(prev => prev.size === orders.length ? new Set() : new Set(orders.map(o => o.id)));
  }

  async function handleBulkUpdate() {
    if (selected.size === 0) { toast.error("Select at least one order"); return; }
    setUpdating(true);
    const ids = Array.from(selected);
    const updated = await bulkUpdateStatus(ids, bulkStatus);
    setUpdating(false);
    if (updated > 0) {
      toast.success(`${updated} order${updated > 1 ? "s" : ""} marked as ${bulkStatus}`);
      setSelected(new Set());
      fetchPending();
    } else {
      toast.error("Could not update orders");
    }
  }

  const itemSummary = buildItemSummary(orders);
  const allSelected = orders.length > 0 && selected.size === orders.length;

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 min-h-9">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Packing</h1>
            {!loading && orders.length > 0 && (
              <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {orders.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">New + processing · ready to pack</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={fetchPending}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium bg-card border border-border text-foreground shadow-sm hover:bg-muted active:bg-muted disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium bg-card border border-border text-foreground shadow-sm hover:bg-muted active:bg-muted transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card shadow-sm divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3">
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border bg-card shadow-sm p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-warm-green-light flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-warm-green" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Nothing to pack</h2>
          <p className="text-sm text-muted-foreground mb-5">New and processing orders will appear here.</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to orders
          </Link>
        </div>
      ) : (
        <>
          {/* Packing summary — what to prepare total */}
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">What to prepare</p>
              <span className="text-xs text-muted-foreground">{orders.length} order{orders.length === 1 ? "" : "s"}</span>
            </div>
            <div className="divide-y divide-border/60">
              {itemSummary.map(({ name, qty, orderCount }) => (
                <div key={name} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                  <span className="min-w-0 truncate text-sm text-foreground">{name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{orderCount} order{orderCount > 1 ? "s" : ""}</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">x{qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${allSelected ? "border-warm-green bg-warm-green" : "border-border"}`}>
                {allSelected && <Check className="w-3 h-3 text-white" />}
              </span>
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <span className="hidden sm:inline text-muted-foreground/40 text-xs">|</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">{selected.size} selected</span>
            <div className="flex items-center gap-2 sm:ml-auto">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as "processed" | "shipped" | "done")}
                className="h-9 flex-1 sm:flex-none px-3 text-xs font-medium bg-card border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="processed">→ Processing</option>
                <option value="shipped">→ Shipped</option>
                <option value="done">→ Completed</option>
              </select>
              <button
                type="button"
                onClick={handleBulkUpdate}
                disabled={selected.size === 0 || updating}
                className="h-9 px-3 rounded-lg bg-warm-green text-white text-xs font-semibold disabled:opacity-40 hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors flex items-center gap-1.5"
              >
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Update
              </button>
            </div>
          </div>

          {/* Order list */}
          <div>
            <div className="sticky top-0 z-10 flex items-center gap-2 py-1.5 bg-background">
              <span className="text-xs font-semibold text-foreground">Orders to pack</span>
              <span className="text-[11px] text-muted-foreground">({orders.length})</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <div className="rounded-xl border bg-card shadow-sm divide-y divide-border overflow-hidden">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`p-3 transition-colors cursor-pointer ${selected.has(order.id) ? "bg-warm-green/5" : "hover:bg-muted/50"}`}
                onClick={() => toggleOrder(order.id)}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${selected.has(order.id) ? "border-warm-green bg-warm-green" : "border-border"}`}>
                    {selected.has(order.id) && <Check className="w-4 h-4 text-white" />}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    {order.customer_name && (
                      <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
                    )}
                    {Array.isArray(order.items) && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {(order.items as { name: string; qty: number }[]).map(i => `${i.name} x${i.qty}`).join(", ")}
                      </p>
                    )}
                    {order.delivery_date && (
                      <p className="flex items-center gap-1 text-xs text-warm-amber">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.delivery_date).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    )}
                    {order.notes && (
                      <p className="text-[10px] text-muted-foreground italic">Note: {order.notes}</p>
                    )}
                  </div>
                  <Link
                    href={`/orders/${order.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
                    aria-label={`Open order ${order.order_number}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
