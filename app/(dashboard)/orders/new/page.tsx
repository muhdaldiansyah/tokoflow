import { Suspense } from "react";
import { OrderForm } from "@/features/orders/components/OrderForm";

export default function NewOrderPage() {
  return (
    <Suspense>
      <OrderForm />
    </Suspense>
  );
}
