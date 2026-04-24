"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getInvoice } from "@/features/invoices/services/invoice.service";
import { InvoiceForm } from "@/features/invoices/components/InvoiceForm";
import type { Invoice } from "@/features/invoices/types/invoice.types";

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getInvoice(id);
      setInvoice(data);
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-7 w-32 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-sm text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  return <InvoiceForm existingInvoice={invoice} />;
}
