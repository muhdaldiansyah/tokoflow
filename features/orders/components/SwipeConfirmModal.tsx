"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "../services/order.service";
import { hapticSuccess } from "@/lib/utils/haptics";
import { track } from "@/lib/analytics";
import type { Order, OrderStatus } from "../types/order.types";
import { ORDER_STATUS_LABELS } from "../types/order.types";

interface SwipeConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (updated: Order) => void;
  order: Order;
  nextStatus: OrderStatus;
}

export function SwipeConfirmModal({
  open,
  onClose,
  onConfirm,
  order,
  nextStatus,
}: SwipeConfirmModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    if (isUpdating) return;
    setIsUpdating(true);
    const updated = await updateOrderStatus(order.id, nextStatus);
    setIsUpdating(false);
    if (updated) {
      hapticSuccess();
      track("order_status_changed", { order_id: order.id, from: order.status, to: nextStatus, via: "swipe" });
      toast.success(`Status diubah ke ${ORDER_STATUS_LABELS[nextStatus]}`);
      onConfirm(updated);
    } else {
      toast.error("Gagal mengubah status");
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center"
      onClick={() => !isUpdating && onClose()}
    >
      <div
        className="bg-card rounded-t-2xl lg:rounded-2xl p-6 pb-8 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-warm-green-light flex items-center justify-center mb-3">
            <ArrowRight className="w-6 h-6 text-warm-green" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">
            Ubah status ke {ORDER_STATUS_LABELS[nextStatus]}?
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {order.order_number} — {order.customer_name || "Order"} will change to &quot;{ORDER_STATUS_LABELS[nextStatus]}&quot;.
          </p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isUpdating}
              className="flex-1 h-11 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover transition-colors disabled:opacity-50"
            >
              {isUpdating ? "Processing..." : ORDER_STATUS_LABELS[nextStatus]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
