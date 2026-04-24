"use client";

import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import type { Invoice, MyInvoisStatus } from "../types/invoice.types";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "../types/invoice.types";

interface InvoiceCardProps {
  invoice: Invoice;
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const remaining = invoice.total - (invoice.paid_amount || 0);
  const myInvoisStatus = invoice.myinvois_status as MyInvoisStatus | null | undefined;

  return (
    <Link
      href={`/invoices/${invoice.id}`}
      className="block px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">
                {invoice.invoice_number}
              </p>
              <span
                className={`inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full items-center shrink-0 ${INVOICE_STATUS_COLORS[invoice.status]}`}
              >
                {INVOICE_STATUS_LABELS[invoice.status]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {invoice.buyer_name || "Unnamed buyer"}
              {invoice.buyer_phone ? ` · ${invoice.buyer_phone}` : ""}
            </p>
            {invoice.due_date && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Due:{" "}
                {new Date(invoice.due_date).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
            {myInvoisStatus === "valid" && (
              <span className="text-[10px] text-warm-green flex items-center gap-0.5 mt-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                MyInvois validated
              </span>
            )}
            {(myInvoisStatus === "submitted" || myInvoisStatus === "pending") && (
              <span className="text-[10px] text-blue-700 flex items-center gap-0.5 mt-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                MyInvois pending
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-foreground">
            RM {invoice.total.toLocaleString("en-MY")}
          </p>
          {remaining > 0 && invoice.status !== "draft" && (
            <p className="text-[10px] text-red-600 font-medium">
              Balance RM {remaining.toLocaleString("en-MY")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
