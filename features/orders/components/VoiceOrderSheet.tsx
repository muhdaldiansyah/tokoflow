"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mic, MicOff, RotateCcw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/lib/voice/speech-recognition";
import { parseTranscriptToItems } from "@/lib/voice/parse-transcript";
import type { OrderItem } from "../types/order.types";

interface ProductRef {
  name: string;
  price: number;
}

interface VoiceOrderSheetProps {
  open: boolean;
  onClose: () => void;
  onAddItems: (items: OrderItem[]) => void;
  products: ProductRef[];
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone blocked. Allow microphone access in browser settings.",
  "no-speech": "No speech detected. Try speaking more clearly.",
  "network": "Voice recognition needs an internet connection.",
  aborted: "Voice recognition stopped.",
};

export function VoiceOrderSheet({
  open,
  onClose,
  onAddItems,
  products,
}: VoiceOrderSheetProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  } = useSpeechRecognition({ lang: "en-MY" });

  const [phase, setPhase] = useState<"listening" | "preview">("listening");
  const [previewItems, setPreviewItems] = useState<OrderItem[]>([]);
  const [isRefining, setIsRefining] = useState(false);

  // Auto-start listening when sheet opens
  useEffect(() => {
    if (open) {
      setPhase("listening");
      setPreviewItems([]);
      setIsRefining(false);
      // Small delay to let the sheet animate in
      const timer = setTimeout(() => start(), 300);
      return () => clearTimeout(timer);
    } else {
      reset();
    }
  }, [open]);

  // Live regex preview during listening
  const fullTranscript = (transcript + " " + interimTranscript).trim();
  const livePreview = fullTranscript
    ? parseTranscriptToItems(fullTranscript, products)
    : [];

  const handleDone = useCallback(() => {
    stop();
    const finalText = (transcript + " " + interimTranscript).trim();
    if (!finalText) return;

    const regexItems = parseTranscriptToItems(finalText, products);
    setPreviewItems(regexItems);
    setPhase("preview");

    // Fire Gemini refinement in background
    setIsRefining(true);
    fetch("/api/voice/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: finalText,
        products: products.map((p) => ({ name: p.name, price: p.price })),
      }),
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setPreviewItems(data.items);
        }
      })
      .catch(() => {
        // Keep regex items on failure
      })
      .finally(() => setIsRefining(false));
  }, [transcript, interimTranscript, products, stop]);

  const handleRetry = useCallback(() => {
    reset();
    setPreviewItems([]);
    setPhase("listening");
    setTimeout(() => start(), 200);
  }, [reset, start]);

  const handleAdd = useCallback(() => {
    const validItems = previewItems.filter((item) => item.name.trim());
    if (validItems.length === 0) return;
    onAddItems(validItems);
    onClose();
  }, [previewItems, onAddItems, onClose]);

  const updatePreviewItem = useCallback(
    (index: number, field: keyof OrderItem, value: string | number) => {
      setPreviewItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const removePreviewItem = useCallback((index: number) => {
    setPreviewItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (!open) return null;

  const validCount = previewItems.filter((i) => i.name.trim()).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-foreground">
            {phase === "listening" ? "Voice order" : "Review order"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 -mr-2.5 hover:bg-muted rounded-xl active:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {phase === "listening" ? (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Mic icon */}
              <button
                type="button"
                onClick={isListening ? stop : start}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                  isListening
                    ? "bg-red-100 text-red-600 animate-pulse-mic"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isListening ? (
                  <Mic className="w-8 h-8" />
                ) : (
                  <MicOff className="w-8 h-8" />
                )}
              </button>

              <p className="text-xs text-muted-foreground">
                {isListening
                  ? 'Speak now... e.g. "Nasi Lemak 2, Teh O Ais 3"'
                  : error
                    ? ERROR_MESSAGES[error] || "An error occurred."
                    : "Tap the microphone to start"}
              </p>

              {/* Transcript display */}
              {fullTranscript && (
                <div className="w-full rounded-lg bg-muted/50 px-3 py-2.5 text-left">
                  {transcript && (
                    <span className="text-sm text-foreground">{transcript}</span>
                  )}
                  {interimTranscript && (
                    <span className="text-sm text-muted-foreground italic">
                      {transcript ? " " : ""}
                      {interimTranscript}
                    </span>
                  )}
                </div>
              )}

              {/* Live regex preview */}
              {livePreview.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {livePreview
                    .map((item) => `${item.qty}x ${item.name}`)
                    .join(", ")}
                </p>
              )}

              {/* Error retry */}
              {error && !isListening && (
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setTimeout(() => start(), 200);
                  }}
                  className="h-9 px-4 text-sm font-medium text-warm-green hover:underline"
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            /* Phase 2: Preview */
            <div className="space-y-3">
              {/* Shimmer loading */}
              {isRefining && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  Menyempurnakan dengan AI...
                </div>
              )}

              {previewItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items detected. Try again.
                </p>
              ) : (
                <div className="space-y-2">
                  {previewItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 ${
                        item.price === 0
                          ? "border-red-300 bg-red-50"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updatePreviewItem(index, "name", e.target.value)
                          }
                          className="w-full text-sm font-medium text-foreground bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                          placeholder="Name item"
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Qty:</span>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) =>
                                updatePreviewItem(
                                  index,
                                  "qty",
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              min="1"
                              className="w-12 text-xs text-foreground bg-transparent border-0 p-0 focus:outline-none focus:ring-0 text-center"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">RM</span>
                            <input
                              type="number"
                              value={item.price || ""}
                              onChange={(e) =>
                                updatePreviewItem(
                                  index,
                                  "price",
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              }
                              placeholder={item.price === 0 ? "Isi harga" : "0"}
                              className={`w-20 text-xs bg-transparent border-0 p-0 focus:outline-none focus:ring-0 ${
                                item.price === 0
                                  ? "text-red-500 placeholder:text-red-400"
                                  : "text-foreground"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePreviewItem(index)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-6 pt-3 border-t border-border space-y-2 shrink-0">
          {phase === "listening" ? (
            <>
              <button
                type="button"
                onClick={handleDone}
                disabled={!fullTranscript.trim()}
                className="w-full h-12 bg-warm-green text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors"
              >
                Selesai
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAdd}
                disabled={validCount === 0}
                className="w-full h-12 bg-warm-green text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add {validCount} item{validCount === 1 ? "" : "s"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 h-11 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
