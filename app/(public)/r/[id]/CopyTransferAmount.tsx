"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyTransferAmount({ amount }: { amount: number }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(amount.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-muted-foreground transition-colors"
    >
      RM {amount.toLocaleString("en-MY")}
      {copied ? (
        <Check className="w-3.5 h-3.5 text-warm-green" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
}
