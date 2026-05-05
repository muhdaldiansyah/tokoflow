"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, Trash2, CircleMinus, CircleCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getCategories, createProduct, updateProduct, toggleAvailability, deleteProduct } from "../services/product.service";
import { clearItemSuggestionsCache } from "@/features/orders/services/order.service";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { getProfile } from "@/features/receipts/services/receipt.service";
import type { Product } from "../types/product.types";

interface ProductFormProps {
  initialProduct?: Product;
}

export function ProductForm({ initialProduct }: ProductFormProps) {
  const isEdit = !!initialProduct;
  const router = useRouter();

  // Form state
  const [name, setName] = useState(initialProduct?.name || "");
  const [price, setPrice] = useState(initialProduct?.price ? String(initialProduct.price) : "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [category, setCategory] = useState(initialProduct?.category || "");
  const [unit, setUnit] = useState(initialProduct?.unit || "");
  const [stock, setStock] = useState(
    initialProduct?.stock !== null && initialProduct?.stock !== undefined ? String(initialProduct.stock) : ""
  );
  const [minQty, setMinQty] = useState(
    initialProduct?.min_order_qty && initialProduct.min_order_qty > 1 ? String(initialProduct.min_order_qty) : ""
  );
  const [costPrice, setCostPrice] = useState(
    initialProduct?.cost_price ? String(initialProduct.cost_price) : ""
  );
  const [isAvailable, setIsAvailable] = useState(initialProduct?.is_available ?? true);
  const [imageUrl, setImageUrl] = useState(initialProduct?.image_url || null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ id: string; label: string }[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Overhead from profile (default 40%)
  const [overheadPct, setOverheadPct] = useState(40);

  // Benchmark state
  const [benchmark, setBenchmark] = useState<{
    price: { avg: number; median: number; min: number; max: number };
    usersInCluster: number;
    avgFoodCostPct: number | null;
    city: string;
  } | null>(null);

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  // No imageInputRef on purpose — the upload trigger is wired as a <label
  // htmlFor="product-photo-file"> wrapping the button content, which uses the
  // browser's native label-to-input behavior. Going through a programmatic
  // .click() can be silently no-op'd by some Chrome extensions, popup
  // blockers, and SW edge cases (we hit one in production where the picker
  // simply never opened on click).

  useEffect(() => {
    getCategories().then(setCategories);
    fetch("/api/lookup?type=units").then((r) => r.ok ? r.json() : []).then(setUnitOptions).catch(() => {});
    getProfile().then((p) => {
      if (p?.overhead_estimate_pct != null) setOverheadPct(p.overhead_estimate_pct);
    });
  }, []);

  // Fetch benchmark when category changes
  useEffect(() => {
    if (!category) { setBenchmark(null); return; }
    fetch(`/api/benchmark?category=${encodeURIComponent(category)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setBenchmark(data?.benchmark || null))
      .catch(() => setBenchmark(null));
  }, [category]);

  useEffect(() => {
    if (!isEdit) {
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [isEdit]);

  function filteredCategorySuggestions(value: string) {
    if (!value.trim()) return categories;
    return categories.filter((c) => c.toLowerCase().includes(value.toLowerCase()));
  }

  // === Image Upload ===
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Max file size is 1MB");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const productId = initialProduct?.id || "new";
      const path = `${user.id}/${productId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      const url = urlData.publicUrl;

      if (isEdit && initialProduct) {
        const updated = await updateProduct(initialProduct.id, { image_url: url });
        if (updated) {
          setImageUrl(url);
          toast.success("Product photo uploaded");
        } else {
          toast.error("Failed to save product photo");
        }
      } else {
        setImageUrl(url);
        toast.success("Photo uploaded");
      }
    } catch {
      toast.error("Failed to upload product photo");
    }
    setIsUploading(false);
    // Reset the native input so re-uploading the same file still fires onChange.
    e.target.value = "";
  }

  // === AI Image Generation ===
  // Generates a product photo from product name + description + category when
  // none exists, or improves an existing one (lighting + background only —
  // the food itself stays untouched). Zero prompt required from the merchant
  // — server-side templates handle it.
  //
  // Only available on saved products (we need the product ID for the storage
  // path and DB update). For brand-new products the button stays hidden until
  // first save.
  async function handleAiGenerate() {
    if (!isEdit || !initialProduct) return;
    if (isGeneratingAi || isUploading) return;

    const mode: "generate" | "enhance" = imageUrl ? "enhance" : "generate";
    setIsGeneratingAi(true);
    try {
      const res = await fetch(
        `/api/products/${initialProduct.id}/generate-image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Couldn't generate photo");
        return;
      }
      setImageUrl(data.imageUrl);
      track("product_image_ai_generated", {
        product_id: initialProduct.id,
        mode,
      });
      toast.success(
        mode === "enhance" ? "Photo enhanced" : "Photo generated",
      );
    } catch {
      toast.error("Network error — try again");
    } finally {
      setIsGeneratingAi(false);
    }
  }

  async function removeImage() {
    if (isEdit && initialProduct) {
      const updated = await updateProduct(initialProduct.id, { image_url: null });
      if (updated) {
        setImageUrl(null);
        toast.success("Product photo removed");
      } else {
        toast.error("Failed to remove photo");
      }
    } else {
      setImageUrl(null);
    }
  }

  // === Save ===
  async function handleSave() {
    if (!name.trim() || !price) return;
    setIsSaving(true);

    if (isEdit && initialProduct) {
      const updated = await updateProduct(initialProduct.id, {
        name: name.trim(),
        price: parseInt(price) || 0,
        description: description.trim() || null,
        category: category.trim() || null,
        unit: unit || null,
        stock: stock ? parseInt(stock) : null,
        min_order_qty: minQty ? Math.max(1, parseInt(minQty)) : 1,
        cost_price: costPrice ? parseInt(costPrice) : null,
        is_available: isAvailable,
        ...(imageUrl !== (initialProduct.image_url || null) && { image_url: imageUrl }),
      });

      if (updated) {
        clearItemSuggestionsCache();
        track("product_updated", { name: updated.name, price: updated.price });
        toast.success("Product updated");
        router.push("/products");
      } else {
        toast.error("Failed to update product");
      }
    } else {
      const product = await createProduct({
        name: name.trim(),
        price: parseInt(price) || 0,
        ...(description.trim() && { description: description.trim() }),
        ...(category.trim() && { category: category.trim() }),
        ...(unit && { unit }),
        ...(stock && { stock: parseInt(stock) }),
        ...(minQty && parseInt(minQty) > 1 && { min_order_qty: parseInt(minQty) }),
        ...(!isAvailable && { is_available: false }),
      });

      if (product) {
        // If we uploaded an image before saving, update the product with the image URL
        if (imageUrl) {
          await updateProduct(product.id, { image_url: imageUrl });
        }
        clearItemSuggestionsCache();
        track("product_added", { name: product.name, price: product.price });
        toast.success("Product added");
        router.push("/products");
      } else {
        toast.error("Failed to add product");
      }
    }

    setIsSaving(false);
  }

  // === Delete ===
  async function handleDelete() {
    if (!initialProduct) return;
    setIsDeleting(true);

    const success = await deleteProduct(initialProduct.id);
    if (success) {
      clearItemSuggestionsCache();
      track("product_deleted", { name: initialProduct.name });
      toast.success("Product deleted");
      router.push("/products");
    } else {
      toast.error("Failed to delete product");
    }
    setIsDeleting(false);
  }

  async function handleDeactivate() {
    if (!initialProduct) return;
    const updated = await toggleAvailability(initialProduct.id, false);
    if (updated) {
      clearItemSuggestionsCache();
      toast.success("Product deactivated");
      router.push("/products");
    } else {
      toast.error("Failed to deactivate product");
    }
  }

  const inputClass = "w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none";
  const wrapperClass = "rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background";
  const labelClass = "block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground";

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {isEdit ? initialProduct.name : "New Product"}
          </h1>
          {isEdit && initialProduct.category && (
            <p className="text-xs text-muted-foreground">{initialProduct.category}</p>
          )}
        </div>
        <Link
          href="/products"
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      </div>

      {/* Hidden file input. Triggered by <label htmlFor="product-photo-file">
          on both the photo preview and the Upload/Change button — native
          browser behavior, no JS .click() call required. */}
      <input
        id="product-photo-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageUpload}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Form card */}
      <div className="rounded-lg border bg-card px-4 py-4 space-y-4 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground">Product information</p>

        {/* Top row: buttons right, photo left */}
        <div className="flex items-start justify-between">
          {/* Photo preview — also a label so tapping the thumbnail opens the
              picker natively. */}
          <label
            htmlFor="product-photo-file"
            className={`relative w-20 h-20 rounded-xl shrink-0 overflow-hidden border border-border bg-muted/30 flex items-center justify-center ${
              isUploading || isGeneratingAi ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : imageUrl ? (
              <Image src={imageUrl} alt="" fill className="object-cover" sizes="80px" />
            ) : (
              <Camera className="w-5 h-5 text-muted-foreground/30" />
            )}
          </label>

          {/* Top-right buttons */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="product-photo-file"
                aria-disabled={isUploading || isGeneratingAi}
                className={`h-9 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 select-none ${
                  isUploading || isGeneratingAi ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                {imageUrl ? "Change photo" : "Upload photo"}
              </label>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border transition-colors ${
                  isAvailable
                    ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                    : "bg-muted/50 border-border text-foreground/70 hover:bg-muted"
                }`}
              >
                {isAvailable ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleMinus className="w-3.5 h-3.5" />}
                <span className="text-xs font-medium">{isAvailable ? "Active" : "Inactive"}</span>
              </button>
            </div>
            {/* AI generate / enhance — appears only on saved products. The
                button morphs based on whether a photo exists: empty →
                "Generate", existing → "Enhance". Server-side prompt builder
                pulls product name + description + category. */}
            {isEdit && initialProduct && name.trim() && (
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isGeneratingAi || isUploading}
                className="h-9 px-3 rounded-lg border border-warm-green/30 bg-warm-green-light text-warm-green text-xs font-medium hover:bg-warm-green-light/80 transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isGeneratingAi
                  ? imageUrl
                    ? "Enhancing…"
                    : "Generating…"
                  : imageUrl
                    ? "Enhance with AI"
                    : "Generate with AI"}
              </button>
            )}
            {imageUrl && (
              <button
                type="button"
                onClick={removeImage}
                disabled={isGeneratingAi}
                className="h-9 px-3 rounded-lg text-xs font-medium text-warm-rose hover:bg-warm-rose-light transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Required fields */}
        <div className="space-y-3">
            <div className={wrapperClass}>
              <label className={labelClass}>Product name <span className="text-warm-rose">*</span></label>
              <input ref={nameInputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken Rice Box" className={inputClass} />
            </div>
            <div className={wrapperClass}>
              <label className={labelClass}>Price <span className="text-warm-rose">*</span></label>
              <div className="flex items-center px-3 pb-2 pt-0 gap-1.5">
                <span className="text-sm text-muted-foreground shrink-0 select-none">RM</span>
                <input type="text" inputMode="numeric" value={price ? parseInt(price).toLocaleString("en-MY") : ""} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="25" className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
              </div>
            </div>
        </div>

        {/* Detail fields */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">More details</p>
          <div className="space-y-3">
            <div className={wrapperClass}>
              <label className={labelClass}>Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Rice + fried chicken + veggies + sambal" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <div className={wrapperClass}>
                  <label className={labelClass}>Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onFocus={() => setShowCategorySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 150)}
                    placeholder="e.g. Rice Box"
                    className={inputClass}
                  />
                </div>
                {showCategorySuggestions && filteredCategorySuggestions(category).length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-card border rounded-lg shadow-lg py-1 max-h-32 overflow-y-auto">
                    {filteredCategorySuggestions(category).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onMouseDown={() => { setCategory(cat); setShowCategorySuggestions(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={wrapperClass}>
                <label className={labelClass}>Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground focus:outline-none"
                >
                  <option value="">Select unit</option>
                  {unitOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={wrapperClass}>
                <label className={labelClass}>Stock</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Leave blank = unlimited" className={inputClass} />
              </div>
              <div className={wrapperClass}>
                <label className={labelClass}>Min. order</label>
                <input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} placeholder="1" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Cost & Profit */}
        {price && parseInt(price) > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Cost &amp; Profit</p>
            <div className="space-y-3">
              <div className={wrapperClass}>
                <label className={labelClass}>Cost per unit</label>
                <div className="flex items-center px-3 pb-2 pt-0 gap-1.5">
                  <span className="text-sm text-muted-foreground shrink-0 select-none">RM</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={costPrice ? parseInt(costPrice).toLocaleString("en-MY") : ""}
                    onChange={(e) => setCostPrice(e.target.value.replace(/\D/g, ""))}
                    placeholder="10"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                </div>
              </div>
              {costPrice && parseInt(costPrice) > 0 && (() => {
                const sell = parseInt(price) || 0;
                const cost = parseInt(costPrice) || 0;
                const profit = sell - cost;
                const foodCost = sell > 0 ? Math.round((cost / sell) * 100) : 0;
                const overheadEstimate = Math.round(sell * (overheadPct / 100));
                const netProfit = sell - cost - overheadEstimate;
                const netMargin = sell > 0 ? Math.round((netProfit / sell) * 100) : 0;

                // Traffic light based on NET margin (after overhead), not food cost
                const light = netMargin >= 15 ? "green" : netMargin >= 5 ? "yellow" : netMargin >= 0 ? "red" : "black";
                const lightEmoji = light === "green" ? "🟢" : light === "yellow" ? "🟡" : light === "red" ? "🔴" : "⚫";
                const lightLabel = light === "green" ? "Healthy margin" : light === "yellow" ? "Careful — a small cost bump could make this unprofitable" : light === "red" ? "Thin margin — barely profitable" : "You're losing money on every unit sold";
                const color = light === "green" ? "text-green-600" : light === "yellow" ? "text-yellow-600" : "text-red-600";
                const bgColor = light === "green" ? "bg-green-50" : light === "yellow" ? "bg-yellow-50" : "bg-red-50";
                const borderColor = light === "green" ? "border-green-200" : light === "yellow" ? "border-yellow-200" : "border-red-200";

                return (
                  <div className={`rounded-lg border ${borderColor} ${bgColor} px-3 py-2.5 space-y-1`}>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span>{lightEmoji}</span>
                      <span className={color}>{lightLabel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross margin</span>
                      <span className="font-semibold text-foreground">RM {profit.toLocaleString("en-MY")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Food cost</span>
                      <span className={`font-semibold ${color}`}>{foodCost}%</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-current/10">
                      <span className="text-muted-foreground">Overhead estimate ({overheadPct}%)</span>
                      <span className="text-muted-foreground">−RM {overheadEstimate.toLocaleString("en-MY")}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-foreground">Net margin</span>
                      <span className={color}>{netMargin}% (RM {netProfit.toLocaleString("en-MY")})</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 pt-0.5">
                      *Overhead = operating costs beyond raw materials (transport, rent, utilities, packaging). Edit in Settings.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Benchmark: peer comparison (Feature 4 + 8) — gated: only shows when ≥10 peers */}
        {benchmark && parseInt(price) > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 space-y-1">
            <p className="text-xs font-medium text-blue-700">
              📊 Benchmark {category || "product"} in {benchmark.city} ({benchmark.usersInCluster} businesses)
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average</span>
              <span className="font-semibold text-foreground">RM {benchmark.price.avg.toLocaleString("en-MY")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Range</span>
              <span className="text-muted-foreground">RM {benchmark.price.min.toLocaleString("en-MY")} — RM {benchmark.price.max.toLocaleString("en-MY")}</span>
            </div>
            {benchmark.avgFoodCostPct !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Food cost average</span>
                <span className="text-muted-foreground">{benchmark.avgFoodCostPct}%</span>
              </div>
            )}
            {(() => {
              const userPrice = parseInt(price);
              const diff = userPrice - benchmark.price.avg;
              if (diff < -benchmark.price.avg * 0.1) {
                return (
                  <p className="text-xs text-red-600 font-medium pt-1 border-t border-blue-200">
                    Your price RM {Math.abs(diff).toLocaleString("en-MY")} below average. You're leaving margin on the table.
                  </p>
                );
              } else if (diff > benchmark.price.avg * 0.2) {
                return (
                  <p className="text-xs text-amber-600 pt-1 border-t border-blue-200">
                    Your price is above average — make sure quality matches customer expectations.
                  </p>
                );
              }
              return (
                <p className="text-xs text-green-600 pt-1 border-t border-blue-200">
                  Your price matches the market range.
                </p>
              );
            })()}
          </div>
        )}

        {/* Feature 8: Pricing suggestion for new products — only when benchmark available and no price set */}
        {benchmark && !isEdit && !price && (
          <button
            type="button"
            onClick={() => setPrice(String(benchmark.price.median))}
            className="w-full text-left rounded-lg border border-dashed border-blue-300 bg-blue-50/50 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
          >
            💡 Suggested price based on {benchmark.usersInCluster} businesses in {benchmark.city}: <span className="font-semibold">RM {benchmark.price.median.toLocaleString("en-MY")}</span> — tap to apply
          </button>
        )}

        {/* Destructive actions (edit mode) — matching orders pattern */}
        {isEdit && (
          <div className="flex items-center justify-center gap-6 pt-4 mt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-warm-rose hover:text-warm-rose active:text-warm-rose/80 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete product
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal — bottom sheet (matching orders pattern) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center">
          <div className="bg-background rounded-t-2xl lg:rounded-2xl p-6 pb-8 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-warm-rose-light flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-warm-rose" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                Delete product?
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                &ldquo;{initialProduct!.name}&rdquo; will be removed from the list. Existing orders are unaffected.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-lg bg-warm-rose text-white text-sm font-medium hover:bg-warm-rose/90 active:bg-warm-rose/80 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 bg-white border-t border-border">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || !price || isSaving}
            className="h-10 px-5 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : isEdit ? "Save changes" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
