"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Loader2,
  ArrowRight,
  Sparkles,
  X,
  Check,
  Pencil,
} from "lucide-react";
import { track } from "@/lib/analytics";
import type {
  PhotoMagicPreview,
  PhotoMagicProduct,
} from "@/app/api/onboarding/photo-magic/route";

const PREVIEW_STORAGE_KEY = "photo_magic_preview_v1";

type Stage = "idle" | "uploading" | "preview" | "error";

export function PhotoMagicHero() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<PhotoMagicPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStage("error");
      setErrorMsg("Please choose a photo (JPG, PNG, or HEIC).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStage("error");
      setErrorMsg("Photo is over 5 MB — try a smaller one.");
      return;
    }

    setStage("uploading");
    setErrorMsg("");

    try {
      const dataUrl = await readAsDataUrl(file);
      setPhotoDataUrl(dataUrl);

      track("photo_magic_started");

      const res = await fetch("/api/onboarding/photo-magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStage("error");
        setErrorMsg(
          data.error ?? "Couldn't read this photo. Try another?",
        );
        track("photo_magic_failed", { status: res.status });
        return;
      }

      const data = (await res.json()) as PhotoMagicPreview;
      setPreview(data);
      setStage("preview");
      track("photo_magic_parsed", {
        confidence: data.confidence,
        products: data.products.length,
      });
    } catch {
      setStage("error");
      setErrorMsg("Connection's a bit shaky. Try again?");
    }
  }, []);

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected after error
    e.target.value = "";
  }

  function handleEditPreview(updates: Partial<PhotoMagicPreview>) {
    setPreview((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  function handleEditProduct(idx: number, updates: Partial<PhotoMagicProduct>) {
    setPreview((prev) => {
      if (!prev) return prev;
      const products = prev.products.map((p, i) =>
        i === idx ? { ...p, ...updates } : p,
      );
      return { ...prev, products };
    });
  }

  function handleRemoveProduct(idx: number) {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.filter((_, i) => i !== idx),
      };
    });
  }

  function handleAddProduct() {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: [...prev.products, { name: "", price: 0, category: null }],
      };
    });
  }

  function handleTryAnother() {
    setStage("idle");
    setPreview(null);
    setPhotoDataUrl("");
    setErrorMsg("");
  }

  function handleActivate() {
    if (!preview) return;

    // Validate inline edits before persisting
    const cleanProducts = preview.products
      .map((p) => ({
        name: p.name.trim(),
        price: Math.max(0, Math.round(p.price)),
        category: p.category ?? null,
      }))
      .filter((p) => p.name.length > 0);

    if (cleanProducts.length === 0) {
      setErrorMsg("Add at least one product to continue.");
      return;
    }
    if (preview.businessName.trim().length < 2) {
      setErrorMsg("Shop name needs at least 2 characters.");
      return;
    }

    const final: PhotoMagicPreview = {
      ...preview,
      businessName: preview.businessName.trim().slice(0, 60),
      story: preview.story.trim().slice(0, 200),
      products: cleanProducts,
    };

    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(final));
    } catch {
      // localStorage may be unavailable in private mode — fall back to cookie
    }

    // Cookie fallback (10 min) so server-side register flow can pick it up
    const cookieValue = encodeURIComponent(JSON.stringify(final));
    if (cookieValue.length < 3500) {
      document.cookie = `photo_magic_preview=${cookieValue}; max-age=600; path=/; SameSite=Lax`;
    }

    track("photo_magic_confirmed", {
      products: final.products.length,
      slug: final.suggestedSlug,
    });

    router.push(`/register?slug=${encodeURIComponent(final.suggestedSlug)}`);
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (stage === "preview" && preview) {
    return (
      <PreviewCard
        preview={preview}
        photoDataUrl={photoDataUrl}
        onEditField={handleEditPreview}
        onEditProduct={handleEditProduct}
        onRemoveProduct={handleRemoveProduct}
        onAddProduct={handleAddProduct}
        onTryAnother={handleTryAnother}
        onActivate={handleActivate}
        errorMsg={errorMsg}
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <label
        htmlFor="photo-magic-file"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          stage === "uploading"
            ? "border-[#05A660] bg-[#E8F6F0] cursor-wait"
            : stage === "error"
              ? "border-red-300 bg-red-50/50 hover:border-red-400"
              : "border-[#05A660]/40 bg-[#E8F6F0]/40 hover:bg-[#E8F6F0] hover:border-[#05A660]"
        }`}
      >
        <input
          ref={fileInputRef}
          id="photo-magic-file"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          disabled={stage === "uploading"}
          className="hidden"
        />

        {stage === "uploading" ? (
          <>
            <Loader2 className="h-10 w-10 text-[#05A660] animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1E293B]">
                Reading your photo…
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                ~3 seconds. AI sets your shop up.
              </p>
            </div>
          </>
        ) : stage === "error" ? (
          <>
            <X className="h-10 w-10 text-red-500" />
            <div className="text-center">
              <p className="text-sm font-semibold text-red-600">
                {errorMsg || "Couldn't read this photo."}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Tap to try again
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-full bg-[#05A660] text-white flex items-center justify-center shadow-lg shadow-[#05A660]/30">
              <Camera className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1E293B]">
                Snap a photo to start
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Tap or drop a photo here
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] pt-1">
              <Sparkles className="h-3 w-3" />
              <span>60 seconds · See preview first, sign up after</span>
            </div>
          </>
        )}
      </label>

      <p className="text-[11px] text-[#94A3B8] text-center mt-3 px-2">
        Your photo isn't saved — only processed for this preview.
      </p>
    </div>
  );
}

function PreviewCard({
  preview,
  photoDataUrl,
  onEditField,
  onEditProduct,
  onRemoveProduct,
  onAddProduct,
  onTryAnother,
  onActivate,
  errorMsg,
}: {
  preview: PhotoMagicPreview;
  photoDataUrl: string;
  onEditField: (updates: Partial<PhotoMagicPreview>) => void;
  onEditProduct: (idx: number, updates: Partial<PhotoMagicProduct>) => void;
  onRemoveProduct: (idx: number) => void;
  onAddProduct: () => void;
  onTryAnother: () => void;
  onActivate: () => void;
  errorMsg: string;
}) {
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <div className="rounded-2xl border border-[#05A660]/30 bg-white shadow-lg shadow-[#05A660]/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#E8F6F0] to-white p-5 border-b border-[#E8F6F0]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[#05A660]" />
            <span className="text-xs font-semibold text-[#05A660] uppercase tracking-wide">
              Your shop preview
            </span>
          </div>

          {/* Photo thumbnail + business name */}
          <div className="flex items-start gap-3">
            {photoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoDataUrl}
                alt="Your product"
                className="h-16 w-16 rounded-xl object-cover shrink-0 border border-[#E2E8F0]"
              />
            )}
            <div className="flex-1 min-w-0">
              <EditableField
                value={preview.businessName}
                onChange={(v) => onEditField({ businessName: v })}
                placeholder="Shop name"
                className="text-base font-bold text-[#1E293B]"
                maxLength={60}
              />
              <EditableField
                value={preview.story}
                onChange={(v) => onEditField({ story: v })}
                placeholder="Short story (optional)"
                className="text-xs text-[#64748B] mt-0.5 italic"
                maxLength={200}
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">
                tokoflow.com/{preview.suggestedSlug}
              </p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-[#1E293B]/50 uppercase tracking-wider">
              Products I can see
            </span>
            <span className="text-[10px] text-[#94A3B8]">
              {preview.confidence === "high"
                ? "✓ clear"
                : preview.confidence === "medium"
                  ? "fairly clear"
                  : "a bit unclear"}
            </span>
          </div>

          {preview.products.map((product, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#E2E8F0] bg-white p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <EditableField
                  value={product.name}
                  onChange={(v) => onEditProduct(idx, { name: v })}
                  placeholder="Product name"
                  className="text-sm font-semibold text-[#1E293B]"
                  maxLength={80}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">RM</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={product.price || ""}
                  onChange={(e) =>
                    onEditProduct(idx, {
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-16 text-right text-sm font-semibold text-[#1E293B] bg-transparent outline-none focus:bg-[#E8F6F0] rounded px-1.5 py-0.5"
                />
                <button
                  type="button"
                  onClick={() => onRemoveProduct(idx)}
                  className="h-6 w-6 rounded-full text-[#94A3B8] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                  aria-label="Remove product"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {preview.products.length < 5 && (
            <button
              type="button"
              onClick={onAddProduct}
              className="w-full rounded-xl border border-dashed border-[#E2E8F0] py-2.5 text-xs text-[#64748B] hover:border-[#05A660] hover:text-[#05A660] hover:bg-[#E8F6F0]/30 transition-colors"
            >
              + Add product
            </button>
          )}
        </div>

        {/* CTA */}
        <div className="bg-slate-50 p-4 border-t border-[#E2E8F0] space-y-2">
          {errorMsg && (
            <p className="text-xs text-red-600 text-center">{errorMsg}</p>
          )}
          <button
            type="button"
            onClick={onActivate}
            className="w-full bg-[#05A660] text-white rounded-xl py-3 text-sm font-semibold shadow-lg shadow-[#05A660]/20 hover:bg-[#048C51] transition-colors flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Looks good — sign up to activate
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onTryAnother}
            className="w-full text-xs text-[#64748B] hover:text-[#1E293B] py-2 transition-colors"
          >
            Try another photo
          </button>
        </div>
      </div>

      <p className="text-[11px] text-[#94A3B8] text-center mt-3 px-2">
        Not signed up yet. Your photo isn't saved.
      </p>
    </div>
  );
}

function EditableField({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className: string;
  maxLength: number;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`${className} bg-[#E8F6F0] outline-none rounded px-1 -mx-1 w-full`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`${className} text-left w-full hover:bg-slate-50 rounded px-1 -mx-1 py-0.5 truncate flex items-center gap-1.5 group`}
    >
      <span className="truncate">
        {value || (
          <span className="text-[#CBD5E1]">{placeholder}</span>
        )}
      </span>
      <Pencil className="h-3 w-3 text-[#CBD5E1] group-hover:text-[#94A3B8] shrink-0" />
    </button>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
