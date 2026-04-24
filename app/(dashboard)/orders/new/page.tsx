import { Suspense } from "react";
import { OrderForm } from "@/features/orders/components/OrderForm";

export default function PesananBaruPage() {
  return (
    <Suspense>
      <OrderForm />
    </Suspense>
  );
}
