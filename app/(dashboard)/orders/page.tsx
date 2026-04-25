import { Suspense } from "react";
import { OrderList } from "@/features/orders/components/OrderList";

export default function OrdersPage() {
  return (
    <Suspense>
      <OrderList />
    </Suspense>
  );
}
