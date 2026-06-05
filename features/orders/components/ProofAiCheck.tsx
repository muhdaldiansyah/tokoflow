"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AiCheckResult {
  verdict: "likely_valid" | "review" | "likely_invalid";
  checks: {
    amount: "match" | "underpaid" | "overpaid" | "unreadable";
    status: "success" | "failed" | "pending" | "unclear";
    recency: "ok" | "before_order" | "unreadable";
  };
  expectedAmount: number;
  extracted: {
    amount_paid: number | null;
    currency: string | null;
    status: string | null;
    datetime: string | null;
    recipient: string | null;
    bank_or_wallet: string | null;
    reference: string | null;
    is_payment_receipt: boolean;
  };
}

/**
 * Advisory AI receipt triage for a customer-uploaded payment proof.
 *
 * Reads the receipt with a vision model and compares amount / status / date to
 * the order (via /api/orders/[id]/verify-proof-ai). Helps the merchant decide,
 * but is NOT a fraud guarantee — a screenshot can be faked, so the merchant
 * still sets the payment status manually.
 */
export function ProofAiCheck({ orderId }: { orderId: string }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<AiCheckResult | null>(null);

  async function run() {
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-proof-ai`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "AI check failed");
      else setResult(data as AiCheckResult);
    } catch {
      toast.error("AI check failed — try again");
    }
    setChecking(false);
  }

  if (result) {
    return (
      <div className="space-y-2">
        <ProofAiVerdict result={result} />
        <button
          type="button"
          onClick={run}
          disabled={checking}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3 h-3" />
          {checking ? "Checking…" : "Run AI check again"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={checking}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
    >
      <Sparkles className="w-3.5 h-3.5 text-warm-green" />
      {checking ? "Checking receipt…" : "Check receipt with AI"}
    </button>
  );
}

function ProofAiVerdict({ result }: { result: AiCheckResult }) {
  const { verdict, checks, expectedAmount, extracted } = result;

  const tone =
    verdict === "likely_valid"
      ? { wrap: "border-warm-green/30 bg-warm-green-light/40", label: "Looks valid", labelClass: "text-warm-green" }
      : verdict === "likely_invalid"
        ? { wrap: "border-warm-rose/40 bg-warm-rose-light", label: "Looks invalid", labelClass: "text-warm-rose" }
        : { wrap: "border-border bg-muted/40", label: "Needs review", labelClass: "text-foreground" };

  const rm = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const chip = (state: "ok" | "bad" | "neutral", text: string) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
        state === "ok"
          ? "bg-warm-green/15 text-warm-green"
          : state === "bad"
            ? "bg-warm-rose/15 text-warm-rose"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {text}
    </span>
  );

  const amountChip =
    checks.amount === "match" ? chip("ok", `Amount ${rm(expectedAmount)} ✓`)
      : checks.amount === "underpaid" ? chip("bad", `Underpaid: ${rm(extracted.amount_paid ?? 0)} (need ${rm(expectedAmount)})`)
        : checks.amount === "overpaid" ? chip("neutral", `Overpaid: ${rm(extracted.amount_paid ?? 0)}`)
          : chip("neutral", "Amount unreadable");
  const statusChip =
    checks.status === "success" ? chip("ok", "Successful")
      : checks.status === "failed" ? chip("bad", "Failed")
        : checks.status === "pending" ? chip("neutral", "Pending")
          : chip("neutral", "Status unclear");
  const recencyChip =
    checks.recency === "ok" ? chip("ok", "Date OK")
      : checks.recency === "before_order" ? chip("bad", "Dated before order")
        : chip("neutral", "Date unreadable");

  const readParts = [
    extracted.bank_or_wallet,
    extracted.recipient ? `to ${extracted.recipient}` : null,
    extracted.datetime,
    extracted.reference ? `ref ${extracted.reference}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className={`rounded-lg border ${tone.wrap} p-3 space-y-2`}>
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
        <span className={`text-xs font-semibold ${tone.labelClass}`}>AI: {tone.label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {amountChip}
        {statusChip}
        {recencyChip}
      </div>
      {readParts.length > 0 && (
        <p className="text-[11px] text-muted-foreground">Read: {readParts.join(" · ")}</p>
      )}
      <p className="text-[10px] text-muted-foreground">
        AI assist — a screenshot can be faked, so double-check before marking paid.
      </p>
    </div>
  );
}
