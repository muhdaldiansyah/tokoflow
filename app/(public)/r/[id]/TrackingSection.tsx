"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Truck } from "lucide-react";

interface TrackingSectionProps {
  trackingNumber: string;
  courierName: string | null;
  trackUrl: string | null;
}

export function TrackingSection({ trackingNumber, courierName, trackUrl }: TrackingSectionProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="px-5 py-4 border-b bg-warm-purple-light/30">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-warm-purple/10 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-warm-purple" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">On the way</p>
            {courierName && (
              <p className="text-xs text-muted-foreground">{courierName}</p>
            )}
          </div>
        </div>

        {/* Tracking number + copy */}
        <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2.5 border border-border">
          <span className="text-sm font-mono text-foreground flex-1 min-w-0 truncate">
            {trackingNumber}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-warm-green" />
                <span className="text-warm-green">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Track button — only when we have an auto-detected URL */}
        {trackUrl && (
          <a
            href={trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-warm-purple text-white text-sm font-semibold hover:bg-warm-purple/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Track on {courierName || "courier website"}
          </a>
        )}
      </div>
    </div>
  );
}
