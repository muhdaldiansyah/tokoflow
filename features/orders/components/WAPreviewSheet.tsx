"use client";

import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { openWhatsApp } from "@/lib/utils/wa-open";

interface WAPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  customerName?: string;
  customerPhone?: string | null;
  initialMessage: string;
  onSent?: () => void;
}

function WAFormattedText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="text-[13px] leading-relaxed text-[#111b21]">
      {lines.map((line, i) => {
        // HTML-escape first
        let escaped = line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // WA formatting: *bold*, _italic_, ~strikethrough~
        escaped = escaped.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
        escaped = escaped.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "<em>$1</em>");
        escaped = escaped.replace(/~([^~]+)~/g, "<s>$1</s>");

        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: escaped }} />
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}

export function WAPreviewSheet({
  open,
  onClose,
  customerName,
  customerPhone,
  initialMessage,
  onSent,
}: WAPreviewSheetProps) {
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  if (!open) return null;

  const displayName = customerName || customerPhone || "Tanpa Nomor";
  const initials = (customerName || "?")[0].toUpperCase();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });

  function handleSend() {
    if (!message.trim()) return;
    openWhatsApp(message, customerPhone);
    onSent?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="bg-background rounded-t-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            {customerPhone && customerName && (
              <p className="text-xs text-muted-foreground">{customerPhone}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 -mr-2.5 hover:bg-muted rounded-xl active:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Chat area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        >
          {/* WA Bubble */}
          <div className="flex justify-end">
            <div
              className="relative max-w-[85%] rounded-xl rounded-tr-sm px-3 py-2 shadow-sm"
              style={{ backgroundColor: "#DCF8C6" }}
            >
              <WAFormattedText text={message} />
              <p className="text-[10px] text-[#667781] text-right mt-1">{timeStr}</p>
            </div>
          </div>
        </div>

        {/* Edit + Actions */}
        <div className="px-4 pb-6 pt-3 border-t border-border space-y-3 shrink-0">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Edit message</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-foreground focus:border-transparent focus:bg-background resize-none transition-colors font-mono text-[13px] leading-relaxed"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-full h-12 bg-warm-green text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors"
          >
            <Send className="w-4 h-4" />
            Kirim
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
