"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Plus, Camera, CircleMinus, CircleCheck, Search } from "lucide-react";
import { getProducts, getProductSales } from "../services/product.service";
import type { Product } from "../types/product.types";
import { copy } from "@/lib/copy";

type SortKey = "name" | "price" | "sold";
type SortDir = "asc" | "desc";

// Higher = bubbles to top under implicit sort. 0 = neutral.
function stockUrgency(p: Product): number {
  if (p.stock === null || p.stock === undefined) return 0;
  if (p.stock === 0) return 2;
  if (p.stock <= 3) return 1;
  return 0;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Record<string, number>>({});

  // Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function cycleSortMode(key: SortKey) {
    const defaultDir = key === "sold" ? "desc" : "asc";
    const altDir = defaultDir === "desc" ? "asc" : "desc";
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(defaultDir);
    } else if (sortDir === defaultDir) {
      setSortDir(altDir);
    } else {
      setSortKey(null);
      setSortDir("asc");
    }
  }

  useEffect(() => {
    loadProducts();
    loadSales();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadProducts() {
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  }

  async function loadSales() {
    const data = await getProductSales();
    setSales(data);
  }

  function getSold(product: Product): number {
    return sales[product.name.toLowerCase()] || 0;
  }

  // Filter + sort products. When no explicit sort is chosen, low/out-of-stock
  // products float to the top of their category — Tier-2 surfacing without
  // a separate alerts section.
  const sorted = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const filtered = q
      ? products.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q)) ||
          (p.category?.toLowerCase().includes(q))
        )
      : [...products];

    if (sortKey === "name") {
      const dir = sortDir === "asc" ? 1 : -1;
      filtered.sort((a, b) => dir * a.name.localeCompare(b.name, "id"));
    } else if (sortKey === "price") {
      filtered.sort((a, b) => sortDir === "asc" ? a.price - b.price : b.price - a.price);
    } else if (sortKey === "sold") {
      filtered.sort((a, b) => sortDir === "asc" ? getSold(a) - getSold(b) : getSold(b) - getSold(a));
    } else {
      // Implicit sort — bubble urgent stock states up.
      // Out (0) > Low (1-3) > everything else, original order preserved within tier.
      filtered.sort((a, b) => stockUrgency(b) - stockUrgency(a));
    }

    return filtered;
  }, [products, debouncedSearch, sortKey, sortDir, sales]);

  // Group by category
  const grouped = useMemo(() => {
    if (sortKey) {
      return [{ category: null, products: sorted }];
    }

    const groups: Record<string, Product[]> = {};
    const uncategorized: Product[] = [];

    for (const product of sorted) {
      if (product.category) {
        if (!groups[product.category]) groups[product.category] = [];
        groups[product.category].push(product);
      } else {
        uncategorized.push(product);
      }
    }

    const result: { category: string | null; products: Product[] }[] = [];
    const sortedCategories = Object.keys(groups).sort();
    for (const cat of sortedCategories) {
      result.push({ category: cat, products: groups[cat] });
    }
    if (uncategorized.length > 0) {
      result.push({ category: null, products: uncategorized });
    }

    return result;
  }, [sorted, sortKey]);

  const chipBase = "inline-flex items-center h-9 px-3 text-xs font-medium rounded-full border whitespace-nowrap shrink-0 transition-colors cursor-pointer";
  const chipActive = "bg-warm-green-light border-warm-green/30 text-warm-green hover:bg-warm-green/20";
  const chipInactive = "bg-muted/50 border-border text-foreground/70 hover:bg-muted";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Products</h1>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl border bg-card shadow-sm divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <div className="w-16 h-16 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-2/5" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between min-h-9">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Products</h1>
            {products.length > 0 && (
              <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {products.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Your catalog and prices</p>
        </div>
        <Link
          href="/products/new"
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-warm-green text-white hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Product
        </Link>
      </div>

      {/* Search — hide when no products */}
      {products.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-11 pl-10 pr-4 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card transition-colors placeholder:text-muted-foreground"
          />
        </div>
      )}

      {/* Sort chips */}
      {products.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button type="button" onClick={() => cycleSortMode("name")} className={`${chipBase} ${sortKey === "name" ? chipActive : chipInactive}`}>
            Name {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button type="button" onClick={() => cycleSortMode("price")} className={`${chipBase} ${sortKey === "price" ? chipActive : chipInactive}`}>
            Price {sortKey === "price" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button type="button" onClick={() => cycleSortMode("sold")} className={`${chipBase} ${sortKey === "sold" ? chipActive : chipInactive}`}>
            Best sellers {sortKey === "sold" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
        </div>
      )}

      {/* Product list */}
      {products.length === 0 ? (
        <div className="rounded-xl border bg-card shadow-sm p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">No products yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {copy.empty.products()}
          </p>
          <Link
            href="/products/new"
            className="h-9 px-4 bg-warm-green text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 hover:bg-warm-green-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first product
          </Link>
        </div>
      ) : grouped.length === 0 || (grouped.length === 1 && grouped[0].products.length === 0) ? (
        <div className="rounded-xl border bg-card shadow-sm p-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Nothing found</p>
          <p className="text-xs text-muted-foreground">
            {copy.empty.productsNoMatch(debouncedSearch)}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.category || "__uncategorized"}>
              {(grouped.length > 1 || group.category) && (
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                  {group.category || "Other"}
                </p>
              )}

              <div className="rounded-xl border bg-card shadow-sm divide-y divide-border">
                {group.products.map((product) => {
                  const sold = getSold(product);
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}/edit`}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                        !product.is_available ? "opacity-50" : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Image */}
                      <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl shrink-0 overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                        {product.image_url ? (
                          <Image src={product.image_url} alt="" fill className="object-cover" sizes="80px" />
                        ) : (
                          <Camera className="w-5 h-5 text-muted-foreground/30" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{product.description}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm font-bold text-foreground">
                            RM {product.price.toLocaleString("en-MY")}
                          </span>
                          {product.unit && (
                            <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {product.is_available ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <CircleCheck className="w-3.5 h-3.5 text-warm-green" />
                              <span className="text-warm-green font-medium">Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <CircleMinus className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground font-medium">Inactive</span>
                            </span>
                          )}
                          {product.min_order_qty > 1 && (
                            <>
                              <span className="text-muted-foreground/30">&middot;</span>
                              <span className="text-xs text-muted-foreground">Min. {product.min_order_qty}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right stats — stock state surfaces as a Tier-2 pill,
                          not just colored text. Out + Low get the merchant's eye
                          without a separate alerts section. */}
                      {(sold > 0 || (product.stock !== null && product.stock !== undefined)) && (
                        <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                          {sold > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Sold {sold}
                            </span>
                          )}
                          {product.stock !== null && product.stock !== undefined && (
                            product.stock === 0 ? (
                              <span className="inline-flex items-center h-5 px-2 text-[10px] font-semibold rounded-full bg-warm-rose-light text-warm-rose">
                                Out
                              </span>
                            ) : product.stock <= 3 ? (
                              <span className="inline-flex items-center h-5 px-2 text-[10px] font-semibold rounded-full bg-warm-amber-light text-warm-amber">
                                Low: {product.stock} left
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {product.stock} left
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
