"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, Trash2, CircleMinus, CircleCheck } from "lucide-react";
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
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      toast.error("Ukuran file maksimal 1MB");
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
          toast.success("Foto produk berhasil diupload");
        } else {
          toast.error("Gagal menyimpan foto produk");
        }
      } else {
        setImageUrl(url);
        toast.success("Foto berhasil diupload");
      }
    } catch {
      toast.error("Gagal mengupload foto produk");
    }
    setIsUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function removeImage() {
    if (isEdit && initialProduct) {
      const updated = await updateProduct(initialProduct.id, { image_url: null });
      if (updated) {
        setImageUrl(null);
        toast.success("Foto produk dihapus");
      } else {
        toast.error("Gagal menghapus foto");
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
        toast.success("Produk berhasil diperbarui");
        router.push("/products");
      } else {
        toast.error("Gagal memperbarui produk");
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
        toast.success("Produk berhasil ditambahkan");
        router.push("/products");
      } else {
        toast.error("Gagal menambahkan produk");
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
      toast.success("Produk dihapus");
      router.push("/products");
    } else {
      toast.error("Gagal menghapus produk");
    }
    setIsDeleting(false);
  }

  async function handleDeactivate() {
    if (!initialProduct) return;
    const updated = await toggleAvailability(initialProduct.id, false);
    if (updated) {
      clearItemSuggestionsCache();
      toast.success("Produk dinonaktifkan");
      router.push("/products");
    } else {
      toast.error("Gagal menonaktifkan produk");
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
            {isEdit ? initialProduct.name : "Produk Baru"}
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
          Kembali
        </Link>
      </div>

      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Form card */}
      <div className="rounded-lg border bg-card px-4 py-4 space-y-4 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground">Informasi Produk</p>

        {/* Top row: buttons right, photo left */}
        <div className="flex items-start justify-between">
          {/* Photo preview */}
          <div
            className="relative w-20 h-20 rounded-xl shrink-0 overflow-hidden border border-border bg-muted/30 flex items-center justify-center cursor-pointer"
            onClick={() => imageInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : imageUrl ? (
              <Image src={imageUrl} alt="" fill className="object-cover" sizes="80px" />
            ) : (
              <Camera className="w-5 h-5 text-muted-foreground/30" />
            )}
          </div>

          {/* Top-right buttons */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
                className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                {imageUrl ? "Ganti Foto" : "Upload Foto"}
              </button>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg border transition-colors ${
                  isAvailable
                    ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                    : "bg-muted/50 border-border text-foreground/70 hover:bg-muted"
                }`}
              >
                {isAvailable ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleMinus className="w-3.5 h-3.5" />}
                <span className="text-xs font-medium">{isAvailable ? "Aktif" : "Nonaktif"}</span>
              </button>
            </div>
            {imageUrl && (
              <button
                type="button"
                onClick={removeImage}
                className="h-8 px-2.5 rounded-lg text-xs font-medium text-warm-rose hover:bg-warm-rose-light transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Foto
              </button>
            )}
          </div>
        </div>

        {/* Required fields */}
        <div className="space-y-3">
            <div className={wrapperClass}>
              <label className={labelClass}>Nama produk <span className="text-warm-rose">*</span></label>
              <input ref={nameInputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Nasi Box Ayam" className={inputClass} />
            </div>
            <div className={wrapperClass}>
              <label className={labelClass}>Harga <span className="text-warm-rose">*</span></label>
              <div className="flex items-center px-3 pb-2 pt-0 gap-1.5">
                <span className="text-sm text-muted-foreground shrink-0 select-none">Rp</span>
                <input type="text" inputMode="numeric" value={price ? parseInt(price).toLocaleString("en-MY") : ""} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="25.000" className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
              </div>
            </div>
        </div>

        {/* Detail fields */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Lainnya</p>
          <div className="space-y-3">
            <div className={wrapperClass}>
              <label className={labelClass}>Deskripsi</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="cth: Nasi + ayam geprek + lalapan + sambal" className={inputClass} />
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
                    placeholder="cth: Nasi Box"
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
                <label className={labelClass}>Satuan</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground focus:outline-none"
                >
                  <option value="">Pilih satuan</option>
                  {unitOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={wrapperClass}>
                <label className={labelClass}>Stock</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Kosongkan = unlimited" className={inputClass} />
              </div>
              <div className={wrapperClass}>
                <label className={labelClass}>Min. order</label>
                <input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} placeholder="1" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Biaya & Untung */}
        {price && parseInt(price) > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Biaya &amp; Untung</p>
            <div className="space-y-3">
              <div className={wrapperClass}>
                <label className={labelClass}>HPP per porsi</label>
                <div className="flex items-center px-3 pb-2 pt-0 gap-1.5">
                  <span className="text-sm text-muted-foreground shrink-0 select-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={costPrice ? parseInt(costPrice).toLocaleString("en-MY") : ""}
                    onChange={(e) => setCostPrice(e.target.value.replace(/\D/g, ""))}
                    placeholder="10.000"
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
                      <span className="text-muted-foreground">Untung bahan</span>
                      <span className="font-semibold text-foreground">RM {profit.toLocaleString("en-MY")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Food cost</span>
                      <span className={`font-semibold ${color}`}>{foodCost}%</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-current/10">
                      <span className="text-muted-foreground">Estimasi overhead ({overheadPct}%)</span>
                      <span className="text-muted-foreground">−RM {overheadEstimate.toLocaleString("en-MY")}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-foreground">Margin riil</span>
                      <span className={color}>{netMargin}% (RM {netProfit.toLocaleString("en-MY")})</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 pt-0.5">
                      *Overhead = biaya operasional selain bahan (transport, sewa, listrik, kemasan). Ubah di Pengaturan.
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
              📊 Benchmark {category || "produk"} di {benchmark.city} ({benchmark.usersInCluster} usaha)
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
            💡 Saran harga berdasarkan {benchmark.usersInCluster} usaha di {benchmark.city}: <span className="font-semibold">RM {benchmark.price.median.toLocaleString("en-MY")}</span> — tap untuk pakai
          </button>
        )}

        {/* Destructive actions (edit mode) — matching pesanan pattern */}
        {isEdit && (
          <div className="flex items-center justify-center gap-6 pt-4 mt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-warm-rose hover:text-warm-rose active:text-warm-rose/80 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Hapus Produk
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal — bottom sheet (matching pesanan pattern) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center">
          <div className="bg-background rounded-t-2xl lg:rounded-2xl p-6 pb-8 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-warm-rose-light flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-warm-rose" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                Hapus produk?
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
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-lg bg-warm-rose text-white text-sm font-medium hover:bg-warm-rose/90 active:bg-warm-rose/80 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
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
            {isSaving ? "Saving..." : isEdit ? "Save changes" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
