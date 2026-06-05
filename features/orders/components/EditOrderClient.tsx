"use client";

import { useState } from "react";
import { OrderForm } from "./OrderForm";
import { OrderPaymentsBlock } from "@/features/billing/components/OrderPaymentsBlock";
import type { Order, OrderStatusLog } from "@/features/orders/types/order.types";

interface EditOrderClientProps {
  order: Order;
  statusLogs?: OrderStatusLog[];
}

export function EditOrderClient({ order: initialOrder, statusLogs }: EditOrderClientProps) {
  const [order, setOrder] = useState(initialOrder);

  return (
    <div className="space-y-4">
      <OrderPaymentsBlock orderId={order.id} />
      <OrderForm
        initialOrder={order}
        statusLogs={statusLogs}
        assignedStaffId={order.assigned_staff_id}
        onAssignedStaffChange={(staffId) =>
          setOrder((prev) => ({ ...prev, assigned_staff_id: staffId }))
        }
      />
    </div>
  );
}
