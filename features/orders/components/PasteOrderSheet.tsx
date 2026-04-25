"use client";

import { useState, useCallback } from "react";
import { X, Plus, Trash2, RotateCcw, ClipboardPaste, Camera, Mic } from "lucide-react";
import { toast } from "sonner";
import { parseTranscriptToItems } from "@/lib/voice/parse-transcript";
import type { OrderItem } from "../types/order.types";

interface ProductRef {
  name: string;
  price: number;
}

export interface ParsedOrderData {
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  delivery_date?: string;
  notes?: string;
  discount?: number;
  payment_status?: "paid" | "dp" | "unpaid";
  dp_amount?: number;
}

interface PasteOrderSheetProps {
  open: boolean;
  onClose: () => void;
  onParsed: (data: ParsedOrderData) => void;
  products: ProductRef[];
  onSwitchToImage?: () => void;
  onSwitchToVoice?: () => void;
  voiceSupported?: boolean;
}

export function PasteOrderSheet({
  open,
  onClose,
  onParsed,
  products,
  onSwitchToImage,
  onSwitchToVoice,
  voiceSupported,
}: PasteOrderSheetProps) {
  const [phase, setPhase] = useState<"input" | "preview">("input");
  const [text, setText] = useState("");
  const [previewItems, setPreviewItems] = useState<OrderItem[]>([]);
  const [extraData, setExtraData] = useState<Omit<ParsedOrderData, "items">>({});
  const [isRefining, setIsRefining] = useState(false);

  // Live regex preview
  const livePreview = text.trim()
    ? parseTranscriptToItems(text.trim(), products)
    : [];

  const handleProcess = useCallback(() => {
    const finalText = text.trim();
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
        // Store extra parsed fields
        const extra: Omit<ParsedOrderData, "items"> = {};
        if (data?.customer_name) extra.customer_name = data.customer_name;
        if (data?.customer_phone) extra.customer_phone = data.customer_phone;
        if (data?.delivery_date) extra.delivery_date = data.delivery_date;
        if (data?.notes) extra.notes = data.notes;
        if (data?.discount) extra.discount = data.discount;
        if (data?.payment_status) extra.payment_status = data.payment_status;
        if (data?.dp_amount) extra.dp_amount = data.dp_amount;
        setExtraData(extra);
      })
      .catch(() => {
        // Keep regex items on failure
      })
      .finally(() => setIsRefining(false));
  }, [text, products]);

  const handleRetry = useCallback(() => {
    setPreviewItems([]);
    setExtraData({});
    setPhase("input");
  }, []);

  const handleAdd = useCallback(() => {
    const validItems = previewItems.filter((item) => item.name.trim());
    if (validItems.length === 0) return;
    onParsed({ items: validItems, ...extraData });
    onClose();
  }, [previewItems, extraData, onParsed, onClose]);

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

  const handleClose = useCallback(() => {
    setText("");
    setPreviewItems([]);
    setExtraData({});
    setPhase("input");
    onClose();
  }, [onClose]);

  if (!open) return null;

  const validCount = previewItems.filter((i) => i.name.trim()).length;
  const hasExtra = Object.keys(extraData).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-background rounded-t-2xl lg:rounded-2xl w-full max-w-lg h-[70vh] lg:h-[65vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tabs */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              {phase === "input" ? "AI Order" : "Review order"}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="p-2.5 -mr-2.5 hover:bg-muted rounded-xl active:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {phase === "input" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 bg-warm-green text-white"
              >
                <ClipboardPaste className="w-3 h-3" />
                Tempel
              </button>
              {onSwitchToImage && (
                <button
                  type="button"
                  onClick={() => { handleClose(); onSwitchToImage(); }}
                  className="h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  Foto
                </button>
              )}
              {voiceSupported && onSwitchToVoice && (
                <button
                  type="button"
                  onClick={() => { handleClose(); onSwitchToVoice(); }}
                  className="h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Mic className="w-3 h-3" />
                  Suara
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-4 min-h-0">
          {phase === "input" ? (
            <div className="h-full flex flex-col gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"Paste a WhatsApp chat...\n\nExample:\nAisyah\n0123456789\nchocolate 3, kuih 1\ntomorrow morning, not too sweet"}
                className="w-full flex-1 px-3 py-2.5 bg-card border border-border rounded-lg shadow-sm text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card transition-colors placeholder:text-muted-foreground resize-none"
                autoFocus
              />
              {!text.trim() && (
                <p className="text-xs text-muted-foreground">
                  AI akan mengisi item, pelanggan, tanggal, catatan, dan pembayaran otomatis
                </p>
              )}

              {/* Live regex preview */}
              {livePreview.length > 0 && (
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                  <p className="text-xs text-foreground">
                    {livePreview
                      .map((item) => `${item.qty}x ${item.name}`)
                      .join(", ")}
                  </p>
                </div>
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
                  No items detected. Try pasting again.
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
                            <span className="text-xs text-muted-foreground">Rp</span>
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

              {/* Extra parsed data preview */}
              {hasExtra && !isRefining && (
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Terdeteksi juga:</p>
                  {extraData.customer_name && (
                    <p className="text-xs text-foreground">Customer: {extraData.customer_name}</p>
                  )}
                  {extraData.customer_phone && (
                    <p className="text-xs text-foreground">HP: {extraData.customer_phone}</p>
                  )}
                  {extraData.delivery_date && (
                    <p className="text-xs text-foreground">Date: {extraData.delivery_date}</p>
                  )}
                  {extraData.notes && (
                    <p className="text-xs text-foreground">Note: {extraData.notes}</p>
                  )}
                  {extraData.discount && (
                    <p className="text-xs text-foreground">Diskon: RM {extraData.discount.toLocaleString("en-MY")}</p>
                  )}
                  {extraData.payment_status && (
                    <p className="text-xs text-foreground">
                      Bayar: {extraData.payment_status === "paid" ? "Paid" : extraData.payment_status === "dp" ? `DP${extraData.dp_amount ? ` RM ${extraData.dp_amount.toLocaleString("en-MY")}` : ""}` : "Unpaid"}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-6 pt-3 border-t border-border space-y-2 shrink-0">
          {phase === "input" ? (
            <>
              <button
                type="button"
                onClick={handleProcess}
                disabled={!text.trim()}
                className="w-full h-12 bg-warm-green text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors"
              >
                <ClipboardPaste className="w-4 h-4" />
                Proses
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full h-11 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Batal
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
                Order items{validCount > 0 ? ` (${validCount} item)` : ""}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 h-11 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Ulangi
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-11 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Batal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
