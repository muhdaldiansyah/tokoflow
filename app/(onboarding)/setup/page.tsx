"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCategoryDefaults, getProfileUpdatesFromCategory } from "@/config/category-defaults";
import { ChevronRight, Copy, Share2, Check, Loader2, X, Plus } from "lucide-react";

interface ProductInput {
  name: string;
  price: string;
}

interface CategoryOption {
  id: string;
  label: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductInput[]>([
    { name: "", price: "" },
    { name: "", price: "" },
    { name: "", price: "" },
  ]);
  const [slug, setSlug] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live preview of the slug the server will derive — keeps in sync with lib/utils/slug.ts
  const slugPreview = businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const selectedDefaults = selectedCategory ? getCategoryDefaults(selectedCategory) : null;

  useEffect(() => {
    fetch("/api/lookup?type=categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  async function handleCategorySelect(categoryId: string) {
    setSelectedCategory(categoryId);
    setIsLoading(true);

    try {
      const defaults = getProfileUpdatesFromCategory(categoryId);
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults),
      });

      if (!res.ok) throw new Error("Save failed");

      const config = getCategoryDefaults(categoryId);
      if (config.sampleProducts.length > 0) {
        setProducts(
          config.sampleProducts.map((p) => ({
            name: p.name,
            price: p.price.toString(),
          })),
        );
      }

      setStep(2);
    } catch {
      toast.error("Could not save business category");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveProducts() {
    const validProducts = products.filter((p) => p.name.trim() && p.price.trim());
    if (validProducts.length === 0) {
      toast.error("Add at least 1 product");
      return;
    }

    setIsLoading(true);
    try {
      for (const product of validProducts) {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name.trim(),
            price: parseInt(product.price) || 0,
            is_available: true,
            category: selectedDefaults?.suggestedCategories[0] || undefined,
          }),
        });
      }

      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setSlug(profile.slug || "");
      }

      setStep(3);
    } catch {
      toast.error("Could not save products");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSkipProducts() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const p = await res.json();
        setSlug(p.slug || "");
      }
    } catch {
      // best-effort
    }
    setStep(3);
  }

  async function handleSaveBusinessName() {
    const name = businessName.trim();
    if (!name) {
      toast.error("Enter your business name");
      return;
    }
    if (slugPreview.length < 3) {
      toast.error("Use at least 3 letters or numbers");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name: name }),
      });
      if (!res.ok) throw new Error("Save failed");

      // Server picks the actual slug (handles uniqueness); refetch to get it.
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setSlug(profile.slug || "");
        if (!profile.slug) {
          toast.error("Couldn't generate a unique link — try a different name");
          return;
        }
      }
    } catch {
      toast.error("Could not save business name");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyLink() {
    const link = `https://tokoflow.com/${slug}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareWA() {
    const link = `https://tokoflow.com/${slug}`;
    const text = `Order directly via my store link:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleDone() {
    router.push("/today");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step
                  ? "w-10 bg-[#1a4d35]"
                  : s < step
                    ? "w-6 bg-[#1a4d35]/40"
                    : "w-6 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Your business category</h1>
              <p className="text-muted-foreground mt-1">
                Pick one — we'll set up the right defaults for you
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const defaults = getCategoryDefaults(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    disabled={isLoading}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      selectedCategory === cat.id
                        ? "border-[#1a4d35] bg-[#1a4d35]/5 ring-2 ring-[#1a4d35]/20"
                        : "border-border bg-card hover:border-[#1a4d35]/30 hover:bg-card/80"
                    } ${isLoading ? "opacity-50" : ""}`}
                  >
                    <span className="text-xl shrink-0">{defaults.icon}</span>
                    <span className="font-medium text-xs text-foreground leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Products */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Add your main products</h1>
              <p className="text-muted-foreground mt-1">
                At least 1 — you can add more later
              </p>
            </div>

            <div className="space-y-3">
              {products.map((product, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={product.name}
                    onChange={(e) => {
                      const updated = [...products];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setProducts(updated);
                    }}
                    className="flex-1 h-12 px-4 bg-card border border-border rounded-xl shadow-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1a4d35]/20 focus:border-[#1a4d35]"
                  />
                  <div className="relative w-32">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">RM</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="25"
                      value={product.price ? parseInt(product.price).toLocaleString("en-MY") : ""}
                      onChange={(e) => {
                        const updated = [...products];
                        updated[i] = { ...updated[i], price: e.target.value.replace(/\D/g, "") };
                        setProducts(updated);
                      }}
                      className="w-full h-12 pl-10 pr-3 bg-card border border-border rounded-xl shadow-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1a4d35]/20 focus:border-[#1a4d35]"
                    />
                  </div>
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setProducts(products.filter((_, j) => j !== i))}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Remove product"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {products.length < 10 && (
                <button
                  type="button"
                  onClick={() => setProducts([...products, { name: "", price: "" }])}
                  className="w-full h-10 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add product
                </button>
              )}
            </div>

            {selectedDefaults && selectedDefaults.suggestedCategories.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                We'll group your products under: {selectedDefaults.suggestedCategories.join(", ")}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSkipProducts}
                className="flex-1 h-12 rounded-xl border border-border bg-card text-muted-foreground font-medium hover:bg-accent transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handleSaveProducts}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl bg-[#1a4d35] text-white font-medium hover:bg-[#1a4d35]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3a: Pick your store link (when slug not yet set) */}
        {step === 3 && !slug && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Pick your store link</h1>
              <p className="text-muted-foreground mt-1">
                Customers visit this link to order from you
              </p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Business name</label>
              <input
                type="text"
                placeholder="e.g. Aisyah Catering"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full h-12 px-4 bg-card border border-border rounded-xl shadow-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1a4d35]/20 focus:border-[#1a4d35]"
                maxLength={60}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your store link will be{" "}
                <span className="font-medium text-foreground">
                  tokoflow.com/{slugPreview || "your-business"}
                </span>
              </p>
            </div>

            <button
              onClick={handleSaveBusinessName}
              disabled={isLoading || slugPreview.length < 3}
              className="w-full h-12 rounded-xl bg-[#1a4d35] text-white font-medium hover:bg-[#1a4d35]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create my store link
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3b: Link Ready */}
        {step === 3 && slug && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h1 className="text-2xl font-bold text-foreground">Your store link is ready!</h1>
              <p className="text-muted-foreground mt-1">
                Share it with customers — orders land in your dashboard
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Store link</p>
              <p className="text-lg font-semibold text-foreground">
                tokoflow.com/{slug}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 h-12 rounded-xl border border-border bg-card font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                onClick={handleShareWA}
                className="flex-1 h-12 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#25D366]/90 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share on WhatsApp
              </button>
            </div>

            <button
              onClick={handleDone}
              className="w-full h-12 rounded-xl bg-[#1a4d35] text-white font-medium hover:bg-[#1a4d35]/90 transition-colors"
            >
              Go to dashboard
            </button>

            <p className="text-xs text-center text-muted-foreground">
              From selling to running a business
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
