"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Camera, ChevronDown, ChevronRight,
  Loader2, PackageOpen, History, ArrowUpRight,
  TrendingUp, TrendingDown, Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkUpdateStock, getProductMovements } from "../services/product.service";
import type { Product } from "../types/product.types";
import type { InventoryMovement } from "../services/product.service";

interface InventoryPageClientProps {
  initialProducts: Product[];
  initialSales: Record<string, number>;
  businessName?: string;
}

const LOW_STOCK_THRESHOLD = 5;

// ── helpers ────────────────────────────────────────────────────────────────

function movementLabel(m: InventoryMovement): string {
  switch (m.movement_type) {
    case "order_reserved":
    case "legacy_decrement":
      return m.orders?.order_number ? `Order ${m.orders.order_number}` : "Order";
    case "order_released":
    case "legacy_restore":
      return m.orders?.order_number ? `Cancelled ${m.orders.order_number}` : "Order released";
    case "manual_adjustment":
      return m.qty_delta > 0 ? "Restocked" : "Adjusted down";
    case "stock_tracking_enabled":
      return "Started tracking";
    default:
      return m.movement_type.replace(/_/g, " ");
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yestMidnight = new Date(todayMidnight.getTime() - 86_400_000);
  const dMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const time = date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });

  if (dMidnight.getTime() === todayMidnight.getTime()) return `Today ${time}`;
  if (dMidnight.getTime() === yestMidnight.getTime()) return `Yesterday ${time}`;
  return date.toLocaleDateString("en-MY", { day: "numeric", month: "short" }) + ` ${time}`;
}

// ── main component ─────────────────────────────────────────────────────────

export function InventoryPageClient({ initialProducts, initialSales, businessName }: InventoryPageClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales] = useState<Record<string, number>>(initialSales);
  const [draftStock, setDraftStock] = useState<Record<string, string>>({});
  const [showUntracked, setShowUntracked] = useState(false);
  const [saving, setSaving] = useState(false);

  // History state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [movementsCache, setMovementsCache] = useState<Record<string, InventoryMovement[]>>({});
  const [historyFilter, setHistoryFilter] = useState<Record<string, "7d" | "30d" | "all">>({});

  const trackedProducts = useMemo(
    () => products.filter((p) => p.stock !== null && p.stock !== undefined),
    [products]
  );
  const untrackedProducts = useMemo(
    () => products.filter((p) => p.stock === null || p.stock === undefined),
    [products]
  );

  function getDraft(product: Product): string {
    const d = draftStock[product.id];
    if (d !== undefined) return d;
    return product.stock !== null && product.stock !== undefined ? String(product.stock) : "";
  }

  function setDraft(id: string, value: string) {
    setDraftStock((prev) => ({ ...prev, [id]: value.replace(/[^0-9]/g, "") }));
  }

  const changedUpdates = useMemo(
    () =>
      products
        .filter((p) => {
          const draft = draftStock[p.id];
          if (draft === undefined) return false;
          const parsed = parseInt(draft, 10);
          if (isNaN(parsed)) return false;
          if (p.stock === null || p.stock === undefined) return draft !== "";
          return parsed !== p.stock;
        })
        .map((p) => ({
          id: p.id,
          stock: Math.max(0, parseInt(draftStock[p.id] || "0", 10)),
        })),
    [products, draftStock]
  );

  const changeCount = changedUpdates.length;

  const handleSave = useCallback(async () => {
    if (changeCount === 0 || saving) return;
    setSaving(true);
    try {
      const { updated, errors } = await bulkUpdateStock(changedUpdates);
      if (errors.length > 0 && updated === 0) {
        toast.error("Could not save changes. Please try again.");
        return;
      }
      const updatedMap: Record<string, number> = {};
      for (const u of changedUpdates) updatedMap[u.id] = u.stock;
      setProducts((prev) =>
        prev.map((p) =>
          updatedMap[p.id] !== undefined
            ? { ...p, stock: updatedMap[p.id], is_available: updatedMap[p.id] > 0 ? true : p.is_available }
            : p
        )
      );
      // Bust history cache for updated products so next open re-fetches
      setMovementsCache((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(updatedMap)) delete next[id];
        return next;
      });
      setDraftStock({});
      errors.length > 0
        ? toast.warning(`${updated} updated, ${errors.length} failed`)
        : toast.success(updated === 1 ? "Stock updated" : `${updated} products updated`);
    } finally {
      setSaving(false);
    }
  }, [changedUpdates, changeCount, saving]);

  async function toggleHistory(productId: string) {
    if (expandedId === productId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(productId);
    if (movementsCache[productId]) return;
    setLoadingId(productId);
    const data = await getProductMovements(productId, 50);
    setMovementsCache((prev) => ({ ...prev, [productId]: data }));
    setLoadingId(null);
  }

  function getFilteredMovements(productId: string, movements: InventoryMovement[]): InventoryMovement[] {
    const filter = historyFilter[productId] ?? "all";
    if (filter === "all") return movements;
    const days = filter === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return movements.filter((m) => new Date(m.occurred_at) >= cutoff);
  }

  function handleDownload() {
    const header = ["Product", "Unit", "Current stock", "Sold (all-time)", "Status"];
    const rows = products.map((p) => {
      const sold = sales[p.name.toLowerCase()] || 0;
      const status =
        p.stock === null || p.stock === undefined ? "Untracked"
        : p.stock === 0 ? "Out of stock"
        : p.stock <= LOW_STOCK_THRESHOLD ? "Low stock"
        : p.is_available ? "Active"
        : "Inactive";
      return [
        p.name,
        p.unit ?? "",
        p.stock !== null && p.stock !== undefined ? String(p.stock) : "",
        String(sold),
        status,
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString("en-MY", { month: "short" });
    const year = now.getFullYear();
    const datePart = `${day}-${month}-${year}`;
    const namePart = businessName
      ? businessName.replace(/[^a-zA-Z0-9À-ɏ ]/g, "").trim().replace(/\s+/g, "-")
      : "Tokoflow";
    const filename = `${namePart}-Stock-${datePart}.csv`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Summary stats
  const outOfStockCount = products.filter((p) => p.stock !== null && p.stock !== undefined && p.stock === 0).length;
  const lowStockList = products.filter((p) => p.stock !== null && p.stock !== undefined && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
  const activeCount = products.filter((p) => p.is_available).length;
  const hiddenCount = products.filter((p) => !p.is_available).length;

  function stockInputClass(product: Product): string {
    const draft = draftStock[product.id];
    const effective = draft !== undefined ? parseInt(draft, 10) : (product.stock ?? null);
    const base =
      "w-24 h-10 px-3 text-right text-sm font-medium rounded-lg border bg-card shadow-sm " +
      "focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
    if (draft !== undefined) return `${base} ring-2 ring-warm-green/40 border-warm-green/30`;
    if (effective === null) return `${base} border-border`;
    if (effective === 0) return `${base} border-warm-rose/40 bg-warm-rose-light/30 text-warm-rose`;
    if (effective <= LOW_STOCK_THRESHOLD) return `${base} border-warm-amber/40 bg-warm-amber-light/30 text-warm-amber`;
    return `${base} border-border`;
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,780px)_360px] md:items-start xl:justify-center">

      {/* Left — main content */}
      <div className="min-w-0 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Products
            </Link>
            <h1 className="text-lg font-semibold text-foreground leading-tight">Inventory</h1>
            <p className="text-xs text-muted-foreground">Adjust quantities after restocking or a production run</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button
              type="button"
              onClick={handleDownload}
              className="h-9 px-3 flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="h-9 px-4 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={changeCount === 0 || saving}
              className="h-9 px-4 text-sm font-medium bg-warm-green text-white rounded-lg hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {changeCount > 0 ? `Save ${changeCount} change${changeCount > 1 ? "s" : ""}` : "Save changes"}
            </button>
          </div>
        </div>

        {/* Product list */}
        {products.length === 0 ? (
          <div className="rounded-xl border bg-card shadow-sm p-10 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <PackageOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No products yet</p>
            <p className="text-xs text-muted-foreground">Add products first to manage inventory.</p>
            <Link href="/products/new" className="text-xs text-warm-green hover:underline">Add a product</Link>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Tracked products */}
            {trackedProducts.length > 0 && (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Tracking stock · {trackedProducts.length} product{trackedProducts.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="divide-y divide-border">
                {trackedProducts.map((product) => {
                  const sold = sales[product.name.toLowerCase()] || 0;
                  const draft = draftStock[product.id];
                  const effective = draft !== undefined ? parseInt(draft, 10) : (product.stock ?? 0);
                  const isExpanded = expandedId === product.id;
                  const isLoadingThis = loadingId === product.id;
                  const movements = movementsCache[product.id] ?? [];

                  return (
                    <div key={product.id}>
                      {/* Product row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-xl shrink-0 overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                          {product.image_url ? (
                            <Image src={product.image_url} alt="" width={44} height={44} className="object-cover w-full h-full" />
                          ) : (
                            <Camera className="w-4 h-4 text-muted-foreground/30" />
                          )}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              RM {product.price.toLocaleString("en-MY")}
                              {product.unit ? ` / ${product.unit}` : ""}
                            </span>
                            {sold > 0 && (
                              <span className="text-xs text-muted-foreground">{sold} sold</span>
                            )}
                            {!isNaN(effective) && (
                              effective === 0
                                ? <span className="text-xs font-medium text-warm-rose">Out of stock</span>
                                : effective <= LOW_STOCK_THRESHOLD
                                ? <span className="text-xs font-medium text-warm-amber">Low stock</span>
                                : null
                            )}
                          </div>
                        </div>

                        {/* Stock input */}
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={getDraft(product)}
                            onChange={(e) => setDraft(product.id, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className={stockInputClass(product)}
                            aria-label={`Stock for ${product.name}`}
                            placeholder="0"
                          />
                          {product.unit && (
                            <span className="text-xs text-muted-foreground w-8">{product.unit}</span>
                          )}
                        </div>

                        {/* History toggle */}
                        <button
                          type="button"
                          onClick={() => toggleHistory(product.id)}
                          title="Stock history"
                          className={`p-2 rounded-lg transition-colors shrink-0 ${
                            isExpanded
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {isLoadingThis
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <History className="w-4 h-4" />
                          }
                        </button>
                      </div>

                      {/* History sub-rows */}
                      {isExpanded && (
                        <div className="bg-muted/20 border-t border-border/50">
                          {isLoadingThis ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Loading history…
                            </div>
                          ) : (() => {
                            const activeFilter = historyFilter[product.id] ?? "all";
                            const filtered = getFilteredMovements(product.id, movements);
                            const chipClass = (f: "7d" | "30d" | "all") =>
                              `h-6 px-2.5 text-[11px] font-medium rounded-full border transition-colors cursor-pointer ${
                                activeFilter === f
                                  ? "bg-foreground text-background border-foreground"
                                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                              }`;

                            return movements.length === 0 ? (
                              <div className="px-4 py-5 text-center">
                                <p className="text-xs text-muted-foreground">No movements recorded yet.</p>
                                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                  History is captured from this point forward.
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* Date filter chips */}
                                <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
                                  {(["7d", "30d", "all"] as const).map((f) => (
                                    <button
                                      key={f}
                                      type="button"
                                      onClick={() => setHistoryFilter((prev) => ({ ...prev, [product.id]: f }))}
                                      className={chipClass(f)}
                                    >
                                      {f === "7d" ? "7 days" : f === "30d" ? "30 days" : "All time"}
                                    </button>
                                  ))}
                                  {activeFilter !== "all" && (
                                    <span className="text-[11px] text-muted-foreground ml-1">
                                      {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>

                                <div className="divide-y divide-border/40">
                                  {filtered.length === 0 ? (
                                    <div className="px-4 py-4 text-center">
                                      <p className="text-xs text-muted-foreground">
                                        No movements in the last {activeFilter === "7d" ? "7" : "30"} days.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => setHistoryFilter((prev) => ({ ...prev, [product.id]: "all" }))}
                                        className="text-[11px] text-warm-green hover:underline mt-1"
                                      >
                                        Show all time
                                      </button>
                                    </div>
                                  ) : (
                                    filtered.map((m) => {
                                      const isPositive = m.qty_delta > 0;
                                      const orderId = m.order_id;
                                      const orderNum = m.orders?.order_number;

                                      return (
                                        <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                            isPositive ? "bg-warm-green/10" : "bg-warm-rose/10"
                                          }`}>
                                            {isPositive
                                              ? <TrendingUp className="w-3 h-3 text-warm-green" />
                                              : <TrendingDown className="w-3 h-3 text-warm-rose" />
                                            }
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-xs font-medium text-foreground">
                                                {movementLabel(m)}
                                              </span>
                                              {orderId && orderNum && (
                                                <Link
                                                  href={`/orders/${orderId}/edit`}
                                                  className="inline-flex items-center gap-0.5 text-[11px] text-warm-green hover:underline"
                                                >
                                                  <ArrowUpRight className="w-3 h-3" />
                                                </Link>
                                              )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                              {formatDate(m.occurred_at)}
                                            </p>
                                          </div>

                                          <div className="text-right shrink-0">
                                            <p className={`text-sm font-semibold tabular-nums ${
                                              isPositive ? "text-warm-green" : "text-warm-rose"
                                            }`}>
                                              {isPositive ? "+" : ""}{m.qty_delta}
                                            </p>
                                            {m.qty_before !== null && m.qty_after !== null && (
                                              <p className="text-[11px] text-muted-foreground tabular-nums">
                                                {m.qty_before} → {m.qty_after}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}

                                  {/* Load more — only when fetched max and showing all time */}
                                  {activeFilter === "all" && movements.length >= 50 && (
                                    <div className="px-4 py-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          setLoadingId(product.id);
                                          const all = await getProductMovements(product.id, 200);
                                          setMovementsCache((prev) => ({ ...prev, [product.id]: all }));
                                          setLoadingId(null);
                                        }}
                                        className="text-xs text-warm-green hover:underline"
                                      >
                                        Load more movements
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>{/* end divide-y wrapper */}
              </div>
            )}

            {/* Untracked products */}
            {untrackedProducts.length > 0 && (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowUntracked((v) => !v)}
                  className="w-full flex items-center gap-2 px-4 py-3 border-b bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {showUntracked
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Not tracking stock · {untrackedProducts.length} product{untrackedProducts.length !== 1 ? "s" : ""}
                  </p>
                  <span className="ml-auto text-[11px] text-muted-foreground font-normal normal-case tracking-normal">
                    {showUntracked ? "Hide" : "Set initial qty to start tracking"}
                  </span>
                </button>

                {showUntracked && (
                  <div className="divide-y divide-border">
                    {untrackedProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-11 h-11 rounded-xl shrink-0 overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                          {product.image_url ? (
                            <Image src={product.image_url} alt="" width={44} height={44} className="object-cover w-full h-full" />
                          ) : (
                            <Camera className="w-4 h-4 text-muted-foreground/30" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            RM {product.price.toLocaleString("en-MY")}
                            {product.unit ? ` / ${product.unit}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={draftStock[product.id] ?? ""}
                            onChange={(e) => setDraft(product.id, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="—"
                            className={
                              "w-24 h-10 px-3 text-right text-sm font-medium rounded-lg border bg-card shadow-sm " +
                              "focus:outline-none focus:ring-2 focus:border-transparent transition-colors " +
                              (draftStock[product.id]
                                ? "ring-2 ring-warm-green/40 border-warm-green/30"
                                : "border-dashed border-border/60 text-muted-foreground")
                            }
                            aria-label={`Initial stock for ${product.name}`}
                          />
                          {product.unit && (
                            <span className="text-xs text-muted-foreground w-8">{product.unit}</span>
                          )}
                        </div>

                        {/* Spacer to align with tracked rows that have history button */}
                        <div className="w-8 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel */}
      <aside className="hidden md:block">
        <div className="sticky top-4 space-y-3">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Summary</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="tabular-nums text-foreground">{activeCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tracking stock</span>
                  <span className="tabular-nums text-foreground">{trackedProducts.length}</span>
                </div>
                {outOfStockCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-rose">Out of stock</span>
                    <span className="tabular-nums text-warm-rose font-medium">{outOfStockCount}</span>
                  </div>
                )}
                {hiddenCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hidden</span>
                    <span className="tabular-nums text-foreground">{hiddenCount}</span>
                  </div>
                )}
              </div>

              {lowStockList.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-warm-amber mb-1.5">Low stock</p>
                  <div className="space-y-1">
                    {lowStockList.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate">{p.name}</span>
                        <span className="text-warm-amber shrink-0 ml-2 tabular-nums">{p.stock} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {changeCount > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-foreground mb-1.5">
                    {changeCount} pending change{changeCount > 1 ? "s" : ""}
                  </p>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-9 text-sm font-medium bg-warm-green text-white rounded-lg hover:bg-warm-green-hover transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
