"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleDollarSign, MessageCircle, Plus, Sparkles, X } from "lucide-react";
import type { Order } from "../types/order.types";
import { derivePaymentStatus } from "../types/order.types";
import { useDashboardRealtime } from "@/components/DashboardRealtimeProvider";

const NEW_SINCE_GAP_MS = 10 * 60 * 1000; // banner only after a 10-min absence

interface TodayViewProps {
  activeOrders: Order[];
  doneToday: Pick<Order, "id" | "customer_name" | "customer_phone" | "items" | "total" | "completed_at">[];
  todayStr: string;
  tomorrowStr: string;
  dailyCapacity?: number | null;
  todayOrderCount?: number;
  outOfStockInPlay?: string[];
  firstName?: string;
  invoicesToday?: number;
  newCustomersToday?: number;
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

// Time-aware salutation. Asia/Kuala_Lumpur is the merchant context; we use
// local-machine hour which on a deployed PWA matches the merchant's clock.
function dayPhase(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "Late night";
  if (h < 11) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

// One-line prose summary. Intentionally avoids feel-good lacquer ("doing
// great", "running smoothly") per bible — calm acknowledgment, not praise.
// Anti-anxiety: never mentions limits, never compares to past days here.
function summaryLine({
  empty,
  capacityFull,
  nowCount,
  activeCount,
  doneCount,
}: {
  empty: boolean;
  capacityFull: boolean;
  nowCount: number;
  activeCount: number;
  doneCount: number;
}): string {
  if (empty) return "Nothing on your plate yet.";
  if (capacityFull) return "Today is full. You can pause your link if you need a break.";
  if (nowCount === 1) return "One order asking for your attention.";
  if (nowCount > 1) return `${nowCount} orders asking for your attention.`;
  if (activeCount === 1 && doneCount === 0) return "One order in motion.";
  if (activeCount > 1 && doneCount === 0) return `${activeCount} orders in motion.`;
  if (activeCount === 0 && doneCount > 0) return `${doneCount} done so far. Quiet from here.`;
  return `${activeCount} in motion · ${doneCount} done so far.`;
}

export function TodayView({
  activeOrders,
  doneToday,
  todayStr,
  dailyCapacity,
  todayOrderCount = 0,
  outOfStockInPlay = [],
  firstName = "",
  invoicesToday = 0,
  newCustomersToday = 0,
}: TodayViewProps) {
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

  const nowDate = new Date();
  const dateLabel = nowDate.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" });

  // Capacity meter — only when merchant set a daily cap. 80%+ = warm-amber,
  // 100% = full strip below the header.
  const hasCapacity = typeof dailyCapacity === "number" && dailyCapacity > 0;
  const capacityPct = hasCapacity ? Math.round((todayOrderCount / dailyCapacity!) * 100) : 0;
  const capacityWarn = hasCapacity && capacityPct >= 80 && capacityPct < 100;
  const capacityFull = hasCapacity && capacityPct >= 100;

  const greeting = `${dayPhase(nowDate)}${firstName ? `, ${firstName}` : ""}.`;
  const summary = summaryLine({
    empty,
    capacityFull,
    nowCount: now.length,
    activeCount: activeOrders.length,
    doneCount: doneToday.length,
  });

  // "Tokoflow handled today" — surfaces the auto-handled work. Renders
  // ONLY when there's something genuine to show, so the empty case stays
  // empty (no zero-counts as decoration).
  const handledFragments: string[] = [];
  if (invoicesToday > 0) handledFragments.push(`${invoicesToday} invoice${invoicesToday === 1 ? "" : "s"} drafted`);
  if (newCustomersToday > 0) handledFragments.push(`${newCustomersToday} new customer${newCustomersToday === 1 ? "" : "s"} saved`);
  if (doneToday.length > 0 && totalToday > 0) handledFragments.push(`${formatMYR(totalToday)} settled`);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero header — date small label up top, big greeting H1, prose summary
          below. Bible: the homepage must dignify the merchant before listing
          their tasks. Numbers come THROUGH PROSE (summary line), not chips. */}
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
            {dateLabel}
          </p>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            {summary}
            {hasCapacity && (capacityWarn || capacityFull) && (
              <>
                {" "}
                <span className="text-warm-amber font-medium">
                  ({todayOrderCount}/{dailyCapacity} today)
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/orders/new"
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium bg-warm-green text-white hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Log order
        </Link>
      </header>

      {/* Capacity-full strip — soft tone, not red. Pause guidance is advisory,
          not enforced; the merchant decides. */}
      {capacityFull && (
        <div className="rounded-xl border border-warm-amber/30 bg-warm-amber-light/60 px-4 py-3 text-sm text-foreground">
          <span className="font-medium">Today is full.</span>{" "}
          <span className="text-muted-foreground">Pause your link if you need a break — find it in </span>
          <Link href="/settings" className="underline text-warm-amber hover:text-warm-amber/80">Settings</Link>
          <span className="text-muted-foreground">.</span>
        </div>
      )}

      {/* Out-of-stock strip — only products that are actually in active orders.
          Surfaces the conflict in context, no separate alerts inbox needed. */}
      {outOfStockInPlay.length > 0 && (
        <div className="rounded-xl border border-warm-rose/30 bg-warm-rose-light/40 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            {outOfStockInPlay.length === 1 ? "Out of stock:" : `Out of stock (${outOfStockInPlay.length}):`}
            <span className="font-normal text-muted-foreground"> {outOfStockInPlay.slice(0, 3).join(", ")}{outOfStockInPlay.length > 3 ? ` +${outOfStockInPlay.length - 3} more` : ""}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Restock or disable in{" "}
            <Link href="/products" className="underline hover:text-foreground">Products</Link>{" "}
            so customers don&rsquo;t order what you can&rsquo;t fulfil.
          </p>
        </div>
      )}

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
            className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Empty state — conversational, not declarative. The hero summary
          already tells the merchant the day is empty; this card offers the
          two natural next moves without urgency. */}
      {empty && (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center space-y-4">
          <Sparkles className="h-7 w-7 mx-auto text-warm-green/40" />
          <div className="space-y-1">
            <p className="text-foreground font-medium">A clean slate.</p>
            <p className="text-sm text-muted-foreground">
              Share your shop link with someone today, or log an order you took elsewhere.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Link
              href="/orders/new"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              Log order
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Copy shop link
            </Link>
          </div>
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

      {/* "While you were away" footer — surfaces the auto-handled work as
          a quiet kindness. Renders only when there's something real to show
          (no zero-count decoration). Past-tense phrasing underscores that
          the work happened on its own. */}
      {handledFragments.length > 0 && (
        <div className="pt-4">
          <p className="text-[11px] text-muted-foreground/80 italic text-center leading-relaxed">
            While you were away — {handledFragments.join(" · ")}.
          </p>
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
      ? "border-warm-amber/40 bg-warm-amber-light/30 hover:bg-warm-amber-light/50"
      : "border-border bg-card hover:bg-muted/30";

  // Reason chip: warm-amber for "now" cards (urgent), muted for others.
  // Promotes the signal from grey inline text to a small visible badge so
  // "Past delivery date" etc. is immediately legible.
  const reasonChipClass =
    kind === "now"
      ? "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-warm-amber/15 text-warm-amber"
      : "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground";

  return (
    <Link
      href={`/orders/${order.id}/edit`}
      className={`group block rounded-xl border ${accent} px-4 py-3.5 transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">{name}</p>
            <span className={reasonChipClass}>{order.reason}</span>
          </div>
          {items && <p className="text-sm text-muted-foreground truncate mt-1">{items}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold tabular-nums text-foreground">{formatMYR(order.total ?? 0)}</p>
          {hasUnverifiedClaim && order.paid_amount > 0 && (
            <p className="text-[11px] text-warm-blue mt-0.5">claims {formatMYR(order.paid_amount)}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs font-medium text-warm-green group-hover:gap-2 transition-all">
        <ActionIcon className="h-3.5 w-3.5" />
        <span>{actionLabel}</span>
        <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
      </div>
    </Link>
  );
}
