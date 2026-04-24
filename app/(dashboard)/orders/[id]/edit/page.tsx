"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getOrder } from "@/features/orders/services/order.service";
import { OrderForm } from "@/features/orders/components/OrderForm";
import { AssigneePicker } from "@/features/staff/components/AssigneePicker";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/features/orders/types/order.types";

function EditOrderSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header: name + order number */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3.5 w-52" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Action chips */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {[20, 18, 18, 16, 14, 14, 18].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      {/* Form card */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-5">
        {/* Customer section */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        {/* Items section */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <div className="space-y-0 divide-y divide-border">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3.5 w-6" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border p-2.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3 mt-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Payment status */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Order status */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Summary + button */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getOrder(params.id);
      setOrder(data);
      setIsLoading(false);
    }
    load();
  }, [params.id]);

  if (isLoading) return <EditOrderSkeleton />;

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border bg-card shadow-sm p-3 space-y-2">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
            Assigned to
          </p>
          <AssigneePicker
            orderId={order.id}
            assignedStaffId={order.assigned_staff_id}
            onChange={(staffId) =>
              setOrder((prev) =>
                prev ? { ...prev, assigned_staff_id: staffId } : prev,
              )
            }
          />
        </div>
      </div>
      <OrderForm initialOrder={order} />
    </div>
  );
}
