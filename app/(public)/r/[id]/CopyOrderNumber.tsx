"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyOrderNumber({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-foreground hover:text-muted-foreground transition-colors"
    >
      {orderNumber}
      {copied ? (
        <Check className="w-3 h-3 text-warm-green" />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  );
}
