"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Clock, AlertCircle, ExternalLink } from "lucide-react";

interface OrderPayment {
  id: string;
  status: "pending" | "paid" | "failed" | "refunded" | "expired";
  provider: "billplz" | "duitnow_manual" | "cash";
  amount: number;
  payment_method: string | null;
  billplz_url: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  fee_amount: number | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
}

interface OrderPaymentsBlockProps {
  orderId: string;
}

// Map Billplz channel codes to human labels. Mirrors the success-page mapper
// so the dashboard and customer view agree on terminology.
function channelLabel(channel: string | null): string {
  if (!channel) return "Online payment";
  const map: Record<string, string> = {
    FPX: "FPX online banking",
    DUITNOWQR: "DuitNow QR",
    DUITNOW_QR: "DuitNow QR",
    BOOST: "Boost",
    GRABPAY: "GrabPay",
    SHOPEEPAY: "ShopeePay",
    TNG: "Touch ’n Go eWallet",
    CARD: "Card",
    CREDITCARD: "Card",
    DEBITCARD: "Card",
  };
  return map[channel.toUpperCase()] ?? channel;
}

function statusVisual(status: OrderPayment["status"]) {
  switch (status) {
    case "paid":
      return { Icon: ShieldCheck, label: "Paid", bg: "bg-warm-green-light/40", border: "border-warm-green/20", icon: "text-warm-green" };
    case "pending":
      return { Icon: Clock, label: "Pending", bg: "bg-warm-amber-light/40", border: "border-warm-amber/20", icon: "text-warm-amber" };
    case "expired":
      return { Icon: Clock, label: "Expired", bg: "bg-muted/40", border: "border-border", icon: "text-muted-foreground" };
    case "failed":
      return { Icon: AlertCircle, label: "Failed", bg: "bg-warm-rose-light/40", border: "border-warm-rose/20", icon: "text-warm-rose" };
    case "refunded":
      return { Icon: AlertCircle, label: "Refunded", bg: "bg-muted/40", border: "border-border", icon: "text-muted-foreground" };
  }
}

// Renders the order_payments audit block on /orders/[id]/edit. Only shows
// when there is at least one payment row; merchants who don't accept
// in-flow payments see nothing (no clutter for the default case).
export function OrderPaymentsBlock({ orderId }: OrderPaymentsBlockProps) {
  const [payments, setPayments] = useState<OrderPayment[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/payments`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPayments(data.payments ?? []);
      } catch {
        if (!cancelled) setPayments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (payments === null || payments.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border bg-card shadow-sm p-3 space-y-2">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
          Payment activity
        </p>
        <div className="space-y-2">
          {payments.map((p) => {
            const visual = statusVisual(p.status);
            const { Icon } = visual;
            return (
              <div
                key={p.id}
                className={`rounded-lg border ${visual.border} ${visual.bg} px-3 py-2.5`}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={`w-4 h-4 ${visual.icon} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">
                        {visual.label} · {channelLabel(p.payment_method)}
                      </p>
                      <p className="text-xs font-semibold text-foreground tabular-nums">
                        RM {Number(p.amount).toLocaleString("en-MY")}
                      </p>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      {p.paid_at && (
                        <p>
                          Settled{" "}
                          {new Date(p.paid_at).toLocaleString("en-MY", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                      {!p.paid_at && p.status === "pending" && (
                        <p>
                          Awaiting customer payment{" "}
                          {p.billplz_url && (
                            <a
                              href={p.billplz_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 underline hover:text-foreground"
                            >
                              <ExternalLink className="w-3 h-3" />
                              checkout link
                            </a>
                          )}
                        </p>
                      )}
                      {p.payer_name && (
                        <p className="truncate">
                          From {p.payer_name}
                          {p.payer_email ? ` · ${p.payer_email}` : ""}
                        </p>
                      )}
                      {p.fee_amount != null && Number(p.fee_amount) > 0 && (
                        <p>
                          Billplz fee: RM {Number(p.fee_amount).toLocaleString("en-MY")}{" "}
                          · You receive RM {(Number(p.amount) - Number(p.fee_amount)).toLocaleString("en-MY")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
