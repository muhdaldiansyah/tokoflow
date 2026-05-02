"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleDollarSign, MessageCircle, Plus, Sparkles } from "lucide-react";
import type { Order } from "../types/order.types";
import { derivePaymentStatus } from "../types/order.types";
import { useDashboardRealtime } from "@/components/DashboardRealtimeProvider";

const NEW_SINCE_GAP_MS = 10 * 60 * 1000; // banner only after a 10-min absence

interface TodayViewProps {
  activeOrders: Order[];
  doneToday: Pick<Order, "id" | "customer_name" | "customer_phone" | "items" | "total" | "completed_at">[];
  todayStr: string;
  tomorrowStr: string;
}

type Bucket = "now" | "today" | "later";

interface CardOrder extends Order {
  bucket: Bucket;
  reason: string;
}

function bucketize(orders: Order[], todayStr: string): CardOrder[] {
  const now = new Date();
  return orders.map((o) => {
    const paymentStatus = derivePaymentStatus(o.paid_amount ?? 0, o.total ?? 0);
    const hasUnverifiedClaim = !!o.payment_claimed_at && paymentStatus !== "paid";
    const dueDate = o.delivery_date;
    const isOverdue = !!dueDate && dueDate < todayStr && paymentStatus !== "paid";
    const isToday = dueDate === todayStr;
    const isFuture = !!dueDate && dueDate > todayStr;

    let bucket: Bucket;
    let reason: string;

    if (hasUnverifiedClaim) {
      bucket = "now";
      reason = "Customer says they paid";
    } else if (isOverdue) {
      bucket = "now";
      reason = "Past delivery date";
    } else if (o.status === "new" && !dueDate) {
      bucket = "now";
      reason = "New order — confirm first";
    } else if (isToday) {
      bucket = "today";
      reason = o.status === "processed" ? "Being prepared" : o.status === "shipped" ? "Shipped" : "Today";
    } else if (isFuture) {
      bucket = "later";
      reason = formatRelativeDate(dueDate, now);
    } else {
      bucket = "today";
      reason = "No date yet";
    }

    return { ...o, bucket, reason };
  });
}

function formatRelativeDate(dateStr: string, now: Date): string {
  const d = new Date(dateStr + "T00:00");
  const diffDays = Math.round((d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === 2) return "In 2 days";
  if (diffDays <= 7) return d.toLocaleDateString("en-MY", { weekday: "short" });
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

function itemsLine(items: Order["items"]): string {
  if (!items || items.length === 0) return "";
  const first = items[0];
  const more = items.length - 1;
  const head = `${first.name}${first.qty > 1 ? ` × ${first.qty}` : ""}`;
  return more > 0 ? `${head} +${more} more` : head;
}

function formatMYR(amount: number): string {
  return `RM ${(amount ?? 0).toFixed(0)}`;
}

export function TodayView({ activeOrders, doneToday, todayStr }: TodayViewProps) {
  const cards = useMemo(() => bucketize(activeOrders, todayStr), [activeOrders, todayStr]);
  const now = cards.filter((c) => c.bucket === "now");
  const today = cards.filter((c) => c.bucket === "today");
  const later = cards.filter((c) => c.bucket === "later");

  const totalToday = doneToday.reduce((s, o) => s + (o.total ?? 0), 0);

  const empty = activeOrders.length === 0 && doneToday.length === 0;

  // "X new since you stepped away" banner — snapshot the previous lastSeenAt at
  // mount time, then immediately reset so the next visit starts fresh.
  const { markTodaySeen } = useDashboardRealtime();
  const [snapshotSeenAt, setSnapshotSeenAt] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("tokoflow_last_seen_today");
    setSnapshotSeenAt(raw ? Number(raw) : null);
    markTodaySeen();
  }, [markTodaySeen]);

  const newSinceLastSeen = useMemo(() => {
    if (!snapshotSeenAt) return [];
    if (Date.now() - snapshotSeenAt < NEW_SINCE_GAP_MS) return [];
    return activeOrders.filter((o) => {
      if (!o.created_at) return false;
      return new Date(o.created_at).getTime() > snapshotSeenAt;
    });
  }, [snapshotSeenAt, activeOrders]);

  const showNewBanner = !bannerDismissed && newSinceLastSeen.length > 0;
  const bannerNames = useMemo(() => {
    const names = newSinceLastSeen
      .map((o) => o.customer_name?.trim() || "Walk-in")
      .slice(0, 3);
    const rest = newSinceLastSeen.length - names.length;
    return rest > 0 ? `${names.join(", ")} +${rest} more` : names.join(", ");
  }, [newSinceLastSeen]);
  const bannerSinceLabel = useMemo(() => {
    if (!snapshotSeenAt) return "";
    const d = new Date(snapshotSeenAt);
    return d.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
  }, [snapshotSeenAt]);

  const dateLabel = new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" });
  const statusLabel = empty
    ? "Quiet day so far"
    : `${activeOrders.length} order${activeOrders.length === 1 ? "" : "s"} active`;
  const doneLabel = doneToday.length > 0 ? ` · ${doneToday.length} done · ${formatMYR(totalToday)} in` : "";

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header — matches /orders + /products pattern: title left, CTA right */}
      <div className="flex items-center justify-between gap-3 min-h-9">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground">Today</h1>
          <p className="text-xs text-muted-foreground truncate">
            {dateLabel} · {statusLabel}{doneLabel}
          </p>
        </div>
        <Link
          href="/orders/new"
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium bg-warm-green text-white hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Log order
        </Link>
      </div>

      {/* Returning-merchant banner — only when last visit was >10 min ago AND
          new orders landed in the gap. Auto-cleared on tab close (snapshot
          uses the prior lastSeenAt; markTodaySeen ran on mount). */}
      {showNewBanner && (
        <div className="rounded-xl border border-warm-amber/30 bg-warm-amber-light/60 px-4 py-3 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-warm-amber mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {newSinceLastSeen.length} new since {bannerSinceLabel}
            </p>
            {bannerNames && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{bannerNames}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Empty state */}
      {empty && (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-foreground font-medium mb-1">No more orders today</p>
          <p className="text-sm text-muted-foreground mb-6">Share your store link or add an order yourself.</p>
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-warm-green text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add order
          </Link>
        </div>
      )}

      {/* NOW — needs attention */}
      {now.length > 0 && (
        <Section title="Now" subtitle="Needs you">
          {now.map((o) => (
            <ActionCard key={o.id} order={o} kind="now" />
          ))}
        </Section>
      )}

      {/* TODAY */}
      {today.length > 0 && (
        <Section title="Today" subtitle={`${today.length} order${today.length === 1 ? "" : "s"} due`}>
          {today.map((o) => (
            <ActionCard key={o.id} order={o} kind="today" />
          ))}
        </Section>
      )}

      {/* LATER */}
      {later.length > 0 && (
        <Section title="Coming up" subtitle={`${later.length} scheduled`}>
          {later.map((o) => (
            <ActionCard key={o.id} order={o} kind="later" />
          ))}
        </Section>
      )}

      {/* DONE TODAY — quiet celebration */}
      {doneToday.length > 0 && (
        <div className="mt-8 pt-6 border-t border-dashed">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Done today</p>
          <div className="space-y-1.5">
            {doneToday.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm py-1.5 px-1">
                <span className="text-muted-foreground truncate">
                  {o.customer_name || o.customer_phone || "Walk-in"} · {itemsLine(o.items)}
                </span>
                <span className="text-foreground font-medium tabular-nums shrink-0 ml-2">{formatMYR(o.total ?? 0)}</span>
              </div>
            ))}
            {doneToday.length > 5 && (
              <Link href="/orders?status=done" className="block text-xs text-muted-foreground hover:text-foreground pt-2">
                +{doneToday.length - 5} more
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ActionCard({ order, kind }: { order: CardOrder; kind: Bucket }) {
  const name = order.customer_name || order.customer_phone || "Walk-in";
  const items = itemsLine(order.items);
  const paymentStatus = derivePaymentStatus(order.paid_amount ?? 0, order.total ?? 0);
  const hasUnverifiedClaim = !!order.payment_claimed_at && paymentStatus !== "paid";

  // Pick the single "obvious next action"
  let actionLabel: string;
  let ActionIcon: React.ElementType = ArrowRight;
  if (hasUnverifiedClaim) {
    actionLabel = "Verify payment";
    ActionIcon = CircleDollarSign;
  } else if (order.status === "new") {
    actionLabel = "Confirm";
    ActionIcon = MessageCircle;
  } else if (order.status === "processed") {
    actionLabel = "Mark ready";
  } else if (order.status === "shipped") {
    actionLabel = "Mark done";
  } else {
    actionLabel = "Open";
  }

  const accent =
    kind === "now"
      ? "border-warm-amber/30 bg-warm-amber-light/40"
      : "border-border bg-card";

  return (
    <Link
      href={`/orders/${order.id}/edit`}
      className={`block rounded-xl border ${accent} px-4 py-3 hover:bg-muted/40 transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">{name}</p>
            <span className="text-xs text-muted-foreground">· {order.reason}</span>
          </div>
          {items && <p className="text-sm text-muted-foreground truncate mt-0.5">{items}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold tabular-nums text-foreground">{formatMYR(order.total ?? 0)}</p>
          {hasUnverifiedClaim && order.paid_amount > 0 && (
            <p className="text-[11px] text-warm-blue mt-0.5">claims {formatMYR(order.paid_amount)}</p>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-xs font-medium text-warm-green">
        <ActionIcon className="h-3.5 w-3.5" />
        <span>{actionLabel}</span>
      </div>
    </Link>
  );
}
