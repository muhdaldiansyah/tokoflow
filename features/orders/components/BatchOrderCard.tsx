"use client";

import { useState } from "react";
import { X, Check, Loader2, AlertCircle } from "lucide-react";
import type { OrderItem } from "../types/order.types";

export type BatchCardStatus = "pending" | "creating" | "success" | "failed";

interface BatchOrderCardProps {
  index: number;
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  status: BatchCardStatus;
  onRemove: () => void;
}

export function BatchOrderCard({
  index,
  items,
  customerName,
  customerPhone,
  status,
  onRemove,
}: BatchOrderCardProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const hasCustomer = !!(customerName || customerPhone);

  function handleRemove() {
    if (!confirmRemove) {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 3000);
      return;
    }
    onRemove();
  }

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition-colors ${
        status === "success"
          ? "border-green-300 bg-green-50/50"
          : status === "failed"
            ? "border-red-300 bg-red-50/50"
            : status === "creating"
              ? "border-border bg-muted/30 opacity-70"
              : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {hasCustomer
              ? `${customerName || ""}${customerName && customerPhone ? " · " : ""}${customerPhone || ""}`
              : `Order ${index + 1}`}
          </p>
          {hasCustomer && !customerName && (
            <p className="text-xs text-muted-foreground">Tanpa nama</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {status === "creating" && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {status === "success" && (
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          {status === "failed" && (
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
              <AlertCircle className="w-3 h-3 text-white" />
            </div>
          )}
          {status === "pending" && (
            <button
              type="button"
              onClick={handleRemove}
              className={`h-8 px-2 text-xs font-medium rounded-lg transition-colors ${
                confirmRemove
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {confirmRemove ? "Yakin hapus?" : <X className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-foreground truncate">
              {item.name} <span className="text-muted-foreground">x{item.qty}</span>
            </span>
            <span className="text-foreground shrink-0 ml-2">
              RM {(item.price * item.qty).toLocaleString("en-MY")}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{items.length} item</span>
        <span className="text-sm font-semibold text-foreground">
          RM {total.toLocaleString("en-MY")}
        </span>
      </div>
    </div>
  );
}
