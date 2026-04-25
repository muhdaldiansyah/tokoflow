"use client";

import { useState, useCallback, useRef } from "react";
import { X, Plus, Trash2, RotateCcw, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { OrderItem } from "../types/order.types";

interface ProductRef {
  name: string;
  price: number;
}

interface ImageOrderSheetProps {
  open: boolean;
  onClose: () => void;
  onAddItems: (items: OrderItem[]) => void;
  products: ProductRef[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageOrderSheet({
  open,
  onClose,
  onAddItems,
  products,
}: ImageOrderSheetProps) {
  const [phase, setPhase] = useState<"upload" | "preview">("upload");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<OrderItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 10MB");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!imageDataUrl) return;

    setIsProcessing(true);
    setError(null);
    setPhase("preview");
    setPreviewItems([]);

    try {
      const res = await fetch("/api/image/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUrl,
          products: products.map((p) => ({ name: p.name, price: p.price })),
        }),
      });

      if (!res.ok) {
        setPhase("upload");
        setIsProcessing(false);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        setPreviewItems(data.items);
      }
    } catch {
      // Keep empty items on failure
    } finally {
      setIsProcessing(false);
    }
  }, [imageDataUrl, products]);

  const handleRetry = useCallback(() => {
    setPreviewItems([]);
    setImageDataUrl(null);
    setError(null);
    setPhase("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

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

  const handleClose = useCallback(() => {
    setImageDataUrl(null);
    setPreviewItems([]);
    setError(null);
    setPhase("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }, [onClose]);

  if (!open) return null;

  const validCount = previewItems.filter((i) => i.name.trim()).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-background rounded-t-2xl lg:rounded-2xl w-full max-w-lg h-[70vh] lg:h-[65vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-foreground">
            {phase === "upload" ? "Photograph the order screenshot" : "Review order"}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2.5 -mr-2.5 hover:bg-muted rounded-xl active:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-4 min-h-0">
          {phase === "upload" ? (
            <div className="h-full flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {imageDataUrl ? (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  <div className="flex-1 min-h-0 flex items-center justify-center rounded-lg border border-border bg-muted/30 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageDataUrl}
                      alt="Screenshot preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageDataUrl(null);
                      setError(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                  >
                    Ganti gambar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border hover:border-primary/30 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Pilih foto atau ambil gambar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Screenshot chat WhatsApp berisi pesanan
                    </p>
                  </div>
                </button>
              )}

              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}
            </div>
          ) : (
            /* Phase 2: Preview */
            <div className="space-y-3">
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  Mengekstrak pesanan dari gambar...
                </div>
              )}

              {!isProcessing && previewItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items detected. Try another photo.
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
                          placeholder="Nama item"
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
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-6 pt-3 border-t border-border space-y-2 shrink-0">
          {phase === "upload" ? (
            <>
              <button
                type="button"
                onClick={handleProcess}
                disabled={!imageDataUrl}
                className="w-full h-12 bg-warm-green text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
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
                disabled={validCount === 0 || isProcessing}
                className="w-full h-12 bg-warm-green text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambahkan {validCount} item
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
