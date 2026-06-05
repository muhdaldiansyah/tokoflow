"use client";

import type { OrderStatusLog } from "../types/order.types";

interface StatusTimelineProps {
  logs: OrderStatusLog[];
  createdAt?: string; // order.created_at — renders synthetic "Order placed" entry
}

// Labels for both workflow status changes and payment events stored in order_status_logs
const TIMELINE_LABELS: Record<string, string> = {
  new: "New",
  menunggu: "Pending",
  processed: "Processing",
  shipped: "Shipped",
  done: "Completed",
  cancelled: "Cancelled",
  payment_paid: "Marked as paid",
  payment_partial: "Partial payment recorded",
  payment_unpaid: "Marked as unpaid",
};

// Dot colour by entry type
function dotClass(toStatus: string): string {
  if (toStatus.startsWith("payment_")) return "bg-blue-400";
  if (toStatus === "__created") return "bg-muted-foreground/30";
  return "bg-warm-green";
}

function formatChangedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusTimeline({ logs, createdAt }: StatusTimelineProps) {
  if (logs.length === 0 && !createdAt) return null;

  // Synthetic entry for order creation — always the oldest event
  const createdEntry = createdAt
    ? { id: "__created", to_status: "__created", changed_at: createdAt, changed_by_name: null }
    : null;

  const allEntries = [
    ...logs,
    ...(createdEntry ? [createdEntry] : []),
  ];

  return (
    <div className="space-y-0 pt-1">
      {allEntries.map((entry, i) => {
        const isCreated = entry.to_status === "__created";
        const label = isCreated
          ? "Order placed"
          : (TIMELINE_LABELS[entry.to_status] ?? entry.to_status);
        const by = "changed_by_name" in entry ? entry.changed_by_name : null;

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotClass(entry.to_status)}`} />
              {i < allEntries.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>
            <div className={`min-w-0 ${i < allEntries.length - 1 ? "pb-3" : ""}`}>
              <p className={`text-xs font-medium ${isCreated ? "text-muted-foreground" : "text-foreground"}`}>
                {label}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatChangedAt(entry.changed_at)}
                {by && ` · ${by}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
