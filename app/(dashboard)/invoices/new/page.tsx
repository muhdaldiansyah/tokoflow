"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceForm } from "@/features/invoices/components/InvoiceForm";
import { createInvoiceFromOrder } from "@/features/invoices/services/invoice.service";
import type { CreateInvoiceInput } from "@/features/invoices/types/invoice.types";

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [prefill, setPrefill] = useState<CreateInvoiceInput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;
    async function loadPrefill() {
      const data = await createInvoiceFromOrder(orderId!);
      if (data) setPrefill(data);
      setIsLoading(false);
    }
    loadPrefill();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-7 w-32 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return <InvoiceForm prefill={prefill} />;
}
