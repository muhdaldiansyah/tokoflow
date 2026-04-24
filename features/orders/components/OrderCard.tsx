"use client";

import { memo } from "react";
import { Check, MessageSquare, ShoppingBag, ArrowRight, Calendar, UtensilsCrossed } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import type { Order, OrderStatus } from "../types/order.types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from "../types/order.types";

interface OrderCardProps {
  order: Order;
  selectMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onPointerDown: (id: string) => void;
  cancelLongPress: () => void;
  onClick: (id: string) => void;
  formatTime: (dateStr: string) => string;
  formatDeliveryDate: (dateStr: string) => string;
  onSwipeAdvance?: (order: Order) => void;
  onSwipeWA?: (order: Order) => void;
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(status);
  if (idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1) {
    return ORDER_STATUS_FLOW[idx + 1];
  }
  return null;
}

function getSwipeRightLabel(status: OrderStatus): string {
  const next = getNextStatus(status);
  return next ? ORDER_STATUS_LABELS[next] : "";
}

export const OrderCard = memo(function OrderCard({
  order,
  selectMode,
  isSelected,
  onSelect,
  onLongPress,
  onPointerDown,
  cancelLongPress,
  onClick,
  formatTime,
  formatDeliveryDate,
  onSwipeAdvance,
  onSwipeWA,
}: OrderCardProps) {

  const hasCustomer = !!(order.customer_name || order.customer_phone);
  const displayName = order.customer_name || order.customer_phone || "Order";
  const initial = displayName.charAt(0).toUpperCase();
  const itemsSummary = order.items?.length > 0
    ? order.items.map((i) => `${i.name} x${i.qty}`).join(", ")
    : "";

  const isDoneOrCancelled = order.status === "done" || order.status === "cancelled";

  const { containerRef, handlers: swipeHandlers, isSwiping } = useSwipeGesture({
    onSwipeRight: () => onSwipeAdvance?.(order),
    onSwipeLeft: () => onSwipeWA?.(order),
    disabled: selectMode,
    disableRight: isDoneOrCancelled,
  });

  const leftAccent = "";

  // Payment claimed by customer but not yet confirmed by seller
  const hasClaim = !!order.payment_claimed_at && order.payment_status !== "paid";

  const paymentChip = hasClaim
    ? "bg-warm-blue-light text-warm-blue border-warm-blue/20"
    : order.payment_status === "partial"
      ? "bg-warm-amber-light text-warm-amber border-warm-amber/20"
      : order.payment_status === "unpaid"
        ? "bg-warm-rose-light text-warm-rose border-warm-rose/20"
        : null;

  const cardContent = (
    <div className="flex gap-3">
      {/* Checkbox (select mode only) */}
      {selectMode && (
        <div className="shrink-0 pt-0.5">
          <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? "bg-primary border-primary" : "border-border"
          }`}>
            {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Name + time */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground truncate min-w-0">
            {displayName}
          </p>
          <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
            {formatTime(order.created_at)}
          </span>
        </div>

        {/* Row 2: Items summary */}
        {itemsSummary && (
          <p className="text-xs text-muted-foreground truncate">
            {itemsSummary}
          </p>
        )}



        {/* Row 2b: Table number (dine-in) or Delivery date */}
        {order.is_dine_in && order.table_number && (
          <p className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
            <UtensilsCrossed className="w-3 h-3" />
            Meja {order.table_number}
          </p>
        )}
        {order.delivery_date && (
          <p className="flex items-center gap-1 text-xs text-warm-amber mt-0.5">
            <Calendar className="w-3 h-3" />
            {formatDeliveryDate(order.delivery_date)}
          </p>
        )}

        <div className="h-1.5" />

        {/* Row 3: Total + grouped badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-foreground">
            {order.unique_code && order.payment_status !== "paid" ? (
              <>
                <span className="text-xs font-normal text-muted-foreground line-through mr-1">RM {order.total.toLocaleString("en-MY")}</span>
                RM {(order.transfer_amount ?? order.total).toLocaleString("en-MY")}
              </>
            ) : (
              `RM ${order.total.toLocaleString("en-MY")}`
            )}
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {order.source === "order_link" && (
              <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-sky-50 text-sky-700 border-sky-200">
                Link Toko
              </span>
            )}
            {order.source === "whatsapp" && (
              <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-green-50 text-green-700 border-green-200">
                WhatsApp
              </span>
            )}
            {order.is_dine_in && (
              <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-amber-50 text-amber-700 border-amber-200">
                Langsung
              </span>
            )}
            {order.is_langganan && (
              <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-blue-50 text-blue-700 border-blue-200">
                Langganan
              </span>
            )}
            <OrderStatusBadge status={order.status} />
            {paymentChip && (
              <span className={`inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center ${paymentChip}`}>
                {hasClaim
                  ? "Sudah Bayar?"
                  : order.payment_status === "partial"
                    ? `DP RM ${(order.paid_amount || 0).toLocaleString("en-MY")}`
                    : "Unpaid"}
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );

  if (selectMode) {
    return (
      <button
        type="button"
        onClick={() => onSelect(order.id)}
        className={`w-full text-left p-3 transition-colors ${leftAccent} ${
          isSelected ? "bg-primary/5" : "hover:bg-muted/50"
        }`}
      >
        {cardContent}
      </button>
    );
  }

  const swipeRightLabel = getSwipeRightLabel(order.status);

  return (
    <div className="relative overflow-hidden">
      {/* Left action bg — visible on right swipe (advance status) */}
      {!isDoneOrCancelled && (
        <div className="absolute inset-y-0 left-0 w-full flex items-center pl-5 bg-warm-green">
          <ArrowRight className="w-5 h-5 text-white mr-1.5" />
          <span className="text-sm font-medium text-white">{swipeRightLabel}</span>
        </div>
      )}

      {/* Right action bg — visible on left swipe (WA) */}
      <div className="absolute inset-y-0 right-0 w-full flex items-center justify-end pr-5 bg-warm-green">
        <span className="text-sm font-medium text-white mr-1.5">WA</span>
        <MessageSquare className="w-5 h-5 text-white" />
      </div>

      {/* Sliding card */}
      <div
        ref={containerRef}
        className={`relative bg-card p-3 hover:bg-gray-50 transition-colors touch-pan-y ${leftAccent}`}
        style={{ willChange: "transform" }}
        {...swipeHandlers}
      >
        <div
          className="cursor-pointer"
          onPointerDown={(e) => {
            onPointerDown(order.id);
            // Don't duplicate swipe handler — swipe is on parent
          }}
          onPointerUp={() => {
            cancelLongPress();
          }}
          onPointerMove={() => {
            // Cancel long-press if swiping
            if (isSwiping.current) cancelLongPress();
          }}
          onPointerLeave={cancelLongPress}
          onContextMenu={(e) => { e.preventDefault(); onLongPress(order.id); }}
          onClick={() => {
            if (!isSwiping.current) onClick(order.id);
          }}
        >
          {cardContent}
        </div>
      </div>
    </div>
  );
});
