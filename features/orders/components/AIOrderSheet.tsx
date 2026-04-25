"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Plus, Trash2, RotateCcw, ClipboardPaste, Camera, Mic, MicOff } from "lucide-react";
import { parseTranscriptToItems } from "@/lib/voice/parse-transcript";
import { useSpeechRecognition } from "@/lib/voice/speech-recognition";
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

interface AIOrderSheetProps {
  open: boolean;
  onClose: () => void;
  onParsed: (data: ParsedOrderData) => void;
  products: ProductRef[];
  voiceSupported?: boolean;
}

type InputMode = "paste" | "image" | "voice";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone blocked. Allow access in browser settings.",
  "no-speech": "No speech detected. Try speaking more clearly.",
  "network": "Voice recognition needs an internet connection.",
  aborted: "Voice recognition stopped.",
};

export function AIOrderSheet({
  open,
  onClose,
  onParsed,
  products,
  voiceSupported,
}: AIOrderSheetProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [phase, setPhase] = useState<"input" | "preview">("input");

  // Paste state
  const [text, setText] = useState("");

  // Image state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice state
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    start: startVoice,
    stop: stopVoice,
    reset: resetVoice,
  } = useSpeechRecognition({ lang: "en-MY" });

  // Shared state
  const [previewItems, setPreviewItems] = useState<OrderItem[]>([]);
  const [extraData, setExtraData] = useState<Omit<ParsedOrderData, "items">>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Stop voice when switching away from voice mode
  const handleModeSwitch = useCallback((newMode: InputMode) => {
    if (mode === "voice" && isListening) {
      stopVoice();
    }
    setMode(newMode);
  }, [mode, isListening, stopVoice]);

  // Auto-start voice when switching to voice mode
  useEffect(() => {
    if (open && mode === "voice" && phase === "input") {
      const timer = setTimeout(() => startVoice(), 300);
      return () => clearTimeout(timer);
    }
  }, [mode, open, phase]);

  // Reset everything when closed
  useEffect(() => {
    if (!open) {
      setText("");
      setImageDataUrl(null);
      setImageError(null);
      setPreviewItems([]);
      setExtraData({});
      setIsProcessing(false);
      setPhase("input");
      setMode("paste");
      resetVoice();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  // Live regex preview for paste/voice
  const pastePreview = mode === "paste" && text.trim()
    ? parseTranscriptToItems(text.trim(), products)
    : [];
  const fullTranscript = (transcript + " " + interimTranscript).trim();
  const voicePreview = mode === "voice" && fullTranscript
    ? parseTranscriptToItems(fullTranscript, products)
    : [];

  // --- Process handlers ---

  const processWithAI = useCallback((inputText: string) => {
    setIsProcessing(true);
    const regexItems = parseTranscriptToItems(inputText, products);
    setPreviewItems(regexItems);
    setPhase("preview");

    fetch("/api/voice/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: inputText,
        products: products.map((p) => ({ name: p.name, price: p.price })),
      }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.items?.length > 0) setPreviewItems(data.items);
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
      .catch(() => {})
      .finally(() => setIsProcessing(false));
  }, [products]);

  const handlePasteProcess = useCallback(() => {
    const finalText = text.trim();
    if (!finalText) return;
    processWithAI(finalText);
  }, [text, processWithAI]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setImageError("Ukuran file maksimal 10MB");
      return;
    }
    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleImageProcess = useCallback(async () => {
    if (!imageDataUrl) return;
    setIsProcessing(true);
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
      if (res.ok) {
        const data = await res.json();
        if (data?.items?.length > 0) setPreviewItems(data.items);
      }
    } catch {}
    setIsProcessing(false);
  }, [imageDataUrl, products]);

  const handleVoiceDone = useCallback(() => {
    stopVoice();
    const finalText = (transcript + " " + interimTranscript).trim();
    if (!finalText) return;
    processWithAI(finalText);
  }, [transcript, interimTranscript, stopVoice, processWithAI]);

  // --- Shared handlers ---

  const handleRetry = useCallback(() => {
    setPreviewItems([]);
    setExtraData({});
    setIsProcessing(false);
    setPhase("input");
    if (mode === "image") {
      setImageDataUrl(null);
      setImageError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (mode === "voice") {
      resetVoice();
      setTimeout(() => startVoice(), 200);
    }
  }, [mode, resetVoice, startVoice]);

  const handleAdd = useCallback(() => {
    const validItems = previewItems.filter((item) => item.name.trim());
    if (validItems.length === 0) return;
    onParsed({ items: validItems, ...extraData });
    onClose();
  }, [previewItems, extraData, onParsed, onClose]);

  const updatePreviewItem = useCallback(
    (index: number, field: keyof OrderItem, value: string | number) => {
      setPreviewItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  const removePreviewItem = useCallback((index: number) => {
    setPreviewItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (!open) return null;

  const validCount = previewItems.filter((i) => i.name.trim()).length;
  const hasExtra = Object.keys(extraData).length > 0;

  // Process button state per mode
  const canProcess =
    mode === "paste" ? !!text.trim() :
    mode === "image" ? !!imageDataUrl :
    mode === "voice" ? !!fullTranscript.trim() : false;

  const handleProcess =
    mode === "paste" ? handlePasteProcess :
    mode === "image" ? handleImageProcess :
    handleVoiceDone;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-stretch lg:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background w-full lg:rounded-2xl lg:max-w-lg lg:max-h-[65vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tabs */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              {phase === "preview" ? "Review order" : "Isi Otomatis"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 -mr-2.5 hover:bg-muted rounded-xl active:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {phase === "input" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleModeSwitch("paste")}
                className={`h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                  mode === "paste" ? "bg-warm-green text-white" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <ClipboardPaste className="w-3 h-3" />
                Teks
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("image")}
                className={`h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                  mode === "image" ? "bg-warm-green text-white" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Camera className="w-3 h-3" />
                Foto
              </button>
              {voiceSupported && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch("voice")}
                  className={`h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                    mode === "voice" ? "bg-warm-green text-white" : "text-muted-foreground hover:bg-muted"
                  }`}
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
            <>
              {/* Paste mode */}
              {mode === "paste" && (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={"Paste a WhatsApp chat...\n\nExample:\nAisyah\n0123456789\nchocolate 3, kuih 1\ntomorrow morning, not too sweet"}
                    className="w-full min-h-[140px] px-3 py-2.5 bg-card border border-border rounded-lg shadow-sm text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card transition-colors placeholder:text-muted-foreground resize-none"
                    autoFocus
                  />
                  {!text.trim() && (
                    <p className="text-xs text-muted-foreground">
                      AI akan mengisi item, pelanggan, tanggal, catatan, dan pembayaran otomatis
                    </p>
                  )}
                  {pastePreview.length > 0 && (
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <p className="text-xs text-foreground">
                        {pastePreview.map((item) => `${item.qty}x ${item.name}`).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Image mode */}
              {mode === "image" && (
                <div className="flex flex-col gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {imageDataUrl ? (
                    <div className="flex-1 flex flex-col gap-3 min-h-0">
                      <div className="flex-1 min-h-0 flex items-center justify-center rounded-lg border border-border bg-muted/30 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageDataUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImageDataUrl(null);
                          setImageError(null);
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
                      className="min-h-[180px] flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border hover:border-primary/30 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Pick a photo or take one</p>
                        <p className="text-xs text-muted-foreground mt-1">A WhatsApp screenshot containing the order</p>
                      </div>
                    </button>
                  )}
                  {imageError && <p className="text-xs text-red-500 text-center">{imageError}</p>}
                </div>
              )}

              {/* Voice mode */}
              {mode === "voice" && (
                <div className="flex flex-col items-center text-center space-y-4">
                  <button
                    type="button"
                    onClick={isListening ? stopVoice : startVoice}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                      isListening ? "bg-red-100 text-red-600 animate-pulse-mic" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {isListening
                      ? 'Speak now... e.g. "Nasi Lemak 2, Teh O Ais 3"'
                      : voiceError
                        ? ERROR_MESSAGES[voiceError] || "An error occurred."
                        : "Tap the microphone to start"}
                  </p>
                  {fullTranscript && (
                    <div className="w-full rounded-lg bg-muted/50 px-3 py-2.5 text-left">
                      {transcript && <span className="text-sm text-foreground">{transcript}</span>}
                      {interimTranscript && (
                        <span className="text-sm text-muted-foreground italic">
                          {transcript ? " " : ""}{interimTranscript}
                        </span>
                      )}
                    </div>
                  )}
                  {voicePreview.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {voicePreview.map((item) => `${item.qty}x ${item.name}`).join(", ")}
                    </p>
                  )}
                  {voiceError && !isListening && (
                    <button
                      type="button"
                      onClick={() => { resetVoice(); setTimeout(() => startVoice(), 200); }}
                      className="h-9 px-4 text-sm font-medium text-warm-green hover:underline"
                    >
                      Coba lagi
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Preview phase — shared across all modes */
            <div className="space-y-3">
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  {mode === "image" ? "Extracting order from image..." : "Refining with AI..."}
                </div>
              )}

              {!isProcessing && previewItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items detected. Try again.
                </p>
              ) : (
                <div className="space-y-2">
                  {previewItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 ${
                        item.price === 0 ? "border-red-300 bg-red-50" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updatePreviewItem(index, "name", e.target.value)}
                          className="w-full text-sm font-medium text-foreground bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                          placeholder="Name item"
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Qty:</span>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updatePreviewItem(index, "qty", Math.max(1, parseInt(e.target.value) || 1))}
                              min="1"
                              className="w-12 text-xs text-foreground bg-transparent border-0 p-0 focus:outline-none focus:ring-0 text-center"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Rp</span>
                            <input
                              type="number"
                              value={item.price || ""}
                              onChange={(e) => updatePreviewItem(index, "price", Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder={item.price === 0 ? "Isi harga" : "0"}
                              className={`w-20 text-xs bg-transparent border-0 p-0 focus:outline-none focus:ring-0 ${
                                item.price === 0 ? "text-red-500 placeholder:text-red-400" : "text-foreground"
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

              {hasExtra && !isProcessing && (
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Terdeteksi juga:</p>
                  {extraData.customer_name && <p className="text-xs text-foreground">Customer: {extraData.customer_name}</p>}
                  {extraData.customer_phone && <p className="text-xs text-foreground">HP: {extraData.customer_phone}</p>}
                  {extraData.delivery_date && <p className="text-xs text-foreground">Date: {extraData.delivery_date}</p>}
                  {extraData.notes && <p className="text-xs text-foreground">Note: {extraData.notes}</p>}
                  {extraData.discount && <p className="text-xs text-foreground">Diskon: RM {extraData.discount.toLocaleString("en-MY")}</p>}
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

        {/* Footer */}
        <div className="px-4 pb-8 pt-3 border-t border-border space-y-2 shrink-0">
          {phase === "input" ? (
            <>
              <button
                type="button"
                onClick={handleProcess}
                disabled={!canProcess}
                className="w-full h-12 bg-warm-green text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed squish-press transition-colors"
              >
                {mode === "voice" ? "Completed" : "Proses"}
              </button>
              <button
                type="button"
                onClick={onClose}
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
                  onClick={onClose}
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
