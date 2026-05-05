"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface PhotoMagicProduct {
  name: string;
  price: number;
  category?: string | null;
}

interface PhotoMagicPreview {
  businessName: string;
  story: string;
  suggestedSlug: string;
  slugAvailable: boolean;
  alternativeSlugs: string[];
  products: PhotoMagicProduct[];
  confidence: "high" | "medium" | "low";
}

interface PhotoMagicEntryProps {
  onComplete: (slug: string) => void;
  onDismiss: () => void;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export function PhotoMagicEntry({ onComplete, onDismiss }: PhotoMagicEntryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "preview" | "saving">(
    "idle",
  );
  const [, setPreview] = useState<PhotoMagicPreview | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedStory, setEditedStory] = useState("");
  const [editedSlug, setEditedSlug] = useState("");
  const [editedProducts, setEditedProducts] = useState<PhotoMagicProduct[]>([]);

  function handleClickCamera() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      toast.error("Photo over 5 MB. Try a smaller image.");
      return;
    }

    setStage("uploading");

    try {
      const dataUrl = await readAsDataUrl(file);
      const res = await fetch("/api/onboarding/photo-magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Photo Magic failed. Try manual setup.");
        setStage("idle");
        return;
      }

      const data: PhotoMagicPreview = await res.json();

      // Defensive: API contract guarantees these fields, but if a
      // malformed/legacy response slips through, treat as low-confidence
      // rather than throwing on `.length` of undefined.
      if (
        !data ||
        data.confidence === "low" ||
        !Array.isArray(data.products) ||
        data.products.length === 0
      ) {
        toast.error("Foto tidak cukup jelas. Cuba foto lain atau setup manual.");
        setStage("idle");
        return;
      }

      setPreview(data);
      setEditedName(data.businessName);
      setEditedStory(data.story);
      setEditedSlug(data.suggestedSlug);
      setEditedProducts(data.products);
      setStage("preview");
    } catch (err) {
      console.error("photo-magic upload error", err);
      toast.error("Couldn't process photo. Try again.");
      setStage("idle");
    } finally {
      // Reset input so user can re-select same file if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleConfirm() {
    if (!editedName.trim()) {
      toast.error("Shop name required");
      return;
    }
    if (editedProducts.length === 0) {
      toast.error("At least 1 product required");
      return;
    }

    setStage("saving");

    try {
      const res = await fetch("/api/onboarding/photo-magic/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: editedName.trim(),
          story: editedStory.trim(),
          slug: editedSlug.trim().toLowerCase(),
          products: editedProducts.map((p) => ({
            name: p.name,
            price: p.price,
            category: p.category ?? null,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Could not save. Try manual setup.");
        setStage("preview");
        return;
      }

      const result = await res.json();
      toast.success(result.message || "Shop bootstrapped!");
      onComplete(result.slug || editedSlug);
    } catch (err) {
      console.error("photo-magic persist error", err);
      toast.error("Save failed. Try again.");
      setStage("preview");
    }
  }

  function updateProductField(
    idx: number,
    field: "name" | "price",
    value: string,
  ) {
    const updated = [...editedProducts];
    if (field === "name") {
      updated[idx] = { ...updated[idx], name: value };
    } else {
      const parsed = parseInt(value, 10);
      updated[idx] = { ...updated[idx], price: isNaN(parsed) ? 0 : parsed };
    }
    setEditedProducts(updated);
  }

  function removeProduct(idx: number) {
    setEditedProducts(editedProducts.filter((_, i) => i !== idx));
  }

  if (stage === "idle") {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#1a4d35]/30 bg-[#1a4d35]/5 p-6 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-[#1a4d35]" />
              <h3 className="font-semibold text-sm text-[#1a4d35]">
                From snap to sold
              </h3>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Take one photo of your products. We&apos;ll set up your shop in seconds — name, story, products, prices. You review and edit.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleClickCamera}
          className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a4d35] text-white font-medium text-sm hover:bg-[#1a4d35]/90 transition-colors"
        >
          <Camera className="h-4 w-4" />
          Take or upload photo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  if (stage === "uploading") {
    return (
      <div className="rounded-2xl border-2 border-[#1a4d35]/30 bg-[#1a4d35]/5 p-8 mb-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a4d35] mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Reading your photo…</p>
        <p className="text-xs text-muted-foreground mt-1">~3 seconds</p>
      </div>
    );
  }

  if (stage === "preview" || stage === "saving") {
    return (
      <div className="rounded-2xl border bg-card p-5 mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Begini sudah pas?</h3>
          <button
            onClick={() => {
              setStage("idle");
              setPreview(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Take another photo
          </button>
        </div>

        <div className="space-y-3">
          <Field
            label="Shop name"
            value={editedName}
            onChange={setEditedName}
            disabled={stage === "saving"}
          />
          <Field
            label="Story (2-3 sentences)"
            value={editedStory}
            onChange={setEditedStory}
            disabled={stage === "saving"}
            multiline
          />
          <Field
            label="Shop link (lowercase, hyphens only)"
            value={editedSlug}
            onChange={(v) => setEditedSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            disabled={stage === "saving"}
            prefix="tokoflow.com/"
          />
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Products ({editedProducts.length})
          </div>
          <div className="space-y-2">
            {editedProducts.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateProductField(i, "name", e.target.value)}
                  disabled={stage === "saving"}
                  className="flex-1 h-10 px-3 rounded-lg border bg-background text-sm"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">RM</span>
                  <input
                    type="number"
                    value={p.price}
                    onChange={(e) => updateProductField(i, "price", e.target.value)}
                    disabled={stage === "saving"}
                    className="w-20 h-10 px-2 rounded-lg border bg-background text-sm tabular-nums"
                  />
                </div>
                <button
                  onClick={() => removeProduct(i)}
                  disabled={stage === "saving"}
                  className="p-2 text-muted-foreground hover:text-red-600"
                  aria-label="Remove product"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={stage === "saving"}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a4d35] text-white font-medium text-sm hover:bg-[#1a4d35]/90 disabled:opacity-50 transition-colors"
        >
          {stage === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Begini sudah pas — go live"
          )}
        </button>
      </div>
    );
  }

  return null;
}

function Field({
  label,
  value,
  onChange,
  disabled,
  multiline,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  multiline?: boolean;
  prefix?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
        />
      ) : prefix ? (
        <div className="flex items-center rounded-lg border bg-background overflow-hidden">
          <span className="px-3 text-xs text-muted-foreground bg-muted/30 h-10 flex items-center">
            {prefix}
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="flex-1 h-10 px-3 text-sm bg-transparent outline-none"
          />
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
        />
      )}
    </div>
  );
}

/**
 * Read file as data URL with client-side resize. Max edge 1024px.
 * Reduces upload payload (~10x for typical phone photos) and AI inference
 * latency. Lossy JPEG at 0.85 quality — sufficient for product detection.
 *
 * Per P4-photo-magic-plan.md chunk 7. Photo content untouched (no
 * beautification, no enhancement) per kitchen-protection rule.
 */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const original = reader.result as string;
      // Resize via canvas
      const img = new Image();
      img.onload = () => {
        const MAX_EDGE = 1024;
        let { width, height } = img;
        if (width > MAX_EDGE || height > MAX_EDGE) {
          const ratio = Math.min(MAX_EDGE / width, MAX_EDGE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback: send original
          resolve(original);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const resized = canvas.toDataURL("image/jpeg", 0.85);
          resolve(resized);
        } catch {
          resolve(original);
        }
      };
      img.onerror = () => resolve(original);
      img.src = original;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
