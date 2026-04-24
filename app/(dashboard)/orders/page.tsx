import { Suspense } from "react";
import { OrderList } from "@/features/orders/components/OrderList";

export default function PesananPage() {
  return (
    <Suspense>
      <OrderList />
    </Suspense>
  );
}
