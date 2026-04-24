"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getInvoice } from "@/features/invoices/services/invoice.service";
import { getProfile } from "@/features/receipts/services/receipt.service";
import { isBisnis } from "@/config/plans";
import { InvoiceDetail } from "@/features/invoices/components/InvoiceDetail";
import type { Invoice } from "@/features/invoices/types/invoice.types";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [bisnisActive, setBisnisActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [data, profile] = await Promise.all([getInvoice(id), getProfile()]);
      setInvoice(data);
      if (profile) setBisnisActive(isBisnis(profile));
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-7 w-32 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
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

  return <InvoiceDetail invoice={invoice} isBisnisActive={bisnisActive} />;
}
