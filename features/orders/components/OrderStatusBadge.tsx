"use client";

import type { OrderStatus } from "../types/order.types";
import { ORDER_STATUS_LABELS } from "../types/order.types";

const STATUS_CHIP_STYLES: Record<OrderStatus, string> = {
  new: "bg-warm-blue-light text-warm-blue border-warm-blue/20",
  menunggu: "bg-amber-50 text-amber-600 border-amber-200",
  processed: "bg-warm-amber-light text-warm-amber border-warm-amber/20",
  shipped: "bg-warm-purple-light text-warm-purple border-warm-purple/20",
  done: "bg-warm-green-light text-warm-green border-warm-green/20",
  cancelled: "bg-warm-rose-light text-warm-rose border-warm-rose/20",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center ${STATUS_CHIP_STYLES[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
