"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Package, Search, X, Banknote, ChevronDown } from "lucide-react";

interface Merchant {
  slug: string;
  business_name: string;
  business_description: string | null;
  business_category: string | null;
  city: string | null;
  city_slug: string | null;
  logo_url: string | null;
  business_address: string | null;
  productCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  productImages: string[];
}

interface DirectoryGridProps {
  merchants: Merchant[];
  cities: { city: string; city_slug: string }[];
  categories: string[];
  categoryLabels: Record<string, string>;
}

const PRICE_RANGES = [
  { label: "< Rp50rb", max: 50000 },
  { label: "Rp50rb — Rp200rb", min: 50000, max: 200000 },
  { label: "Rp200rb — Rp500rb", min: 200000, max: 500000 },
  { label: "> Rp500rb", min: 500000 },
];

function formatPrice(n: number) {
  if (n >= 1000) return `RM ${(n / 1000).toFixed(1)}K`;
  return `RM ${n.toLocaleString("en-MY")}`;
}

export function DirectoryGrid({ merchants, cities, categories, categoryLabels }: DirectoryGridProps) {
  const searchParams = useSearchParams();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") || "");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = merchants;
    if (selectedCity) {
      result = result.filter((m) => m.city_slug === selectedCity);
    }
    if (selectedCategory) {
      result = result.filter((m) => m.business_category === selectedCategory);
    }
    if (selectedPriceRange) {
      const range = PRICE_RANGES[Number(selectedPriceRange)];
      if (range) {
        result = result.filter((m) => {
          if (m.minPrice === null) return false;
          if (range.min !== undefined && m.maxPrice !== null && m.maxPrice < range.min) return false;
          if (range.max !== undefined && m.minPrice > range.max) return false;
          return true;
        });
      }
    }
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.business_name.toLowerCase().includes(q) ||
          m.business_description?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [merchants, selectedCity, selectedCategory, selectedPriceRange, searchQuery]);

  const hasFilters = selectedCity || selectedCategory || selectedPriceRange || searchQuery;

  return (
    <div>
      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory("")}
            className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${!selectedCategory ? "bg-[#05A660] text-white" : "bg-white border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(selectedCategory === c ? "" : c)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${selectedCategory === c ? "bg-[#05A660] text-white" : "bg-white border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}
            >
              {categoryLabels[c] || c}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari toko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-white text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500/30 transition-colors placeholder:text-muted-foreground"
          />
        </div>

        {/* City filter */}
        {cities.length > 0 && (
          <FilterSelect
            placeholder="All cities"
            options={cities.map((c) => ({ id: c.city_slug, label: c.city }))}
            value={selectedCity}
            onChange={setSelectedCity}
          />
        )}

        {/* Price range filter */}
        <FilterSelect
          placeholder="Semua Harga"
          options={PRICE_RANGES.map((r, i) => ({ id: String(i), label: r.label }))}
          value={selectedPriceRange}
          onChange={setSelectedPriceRange}
        />

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => {
              setSelectedCity("");
              setSelectedCategory("");
              setSelectedPriceRange("");
              setSearchQuery("");
            }}
            className="h-10 px-3 rounded-lg border border-border bg-white text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Results count */}
      {hasFilters && (
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} toko ditemukan
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((merchant) => (
            <MerchantCard
              key={merchant.slug}
              merchant={merchant}
              categoryLabels={categoryLabels}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-foreground">No stores yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasFilters
              ? "Coba ubah filter atau kata kunci pencarian."
              : "Toko akan muncul di sini setelah UMKM mendaftar dan melengkapi profil."}
          </p>
        </div>
      )}
    </div>
  );
}

function MerchantCard({
  merchant,
  categoryLabels,
}: {
  merchant: Merchant;
  categoryLabels: Record<string, string>;
}) {
  const initials = merchant.business_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      href={`/${merchant.slug}?from=directory`}
      className="group rounded-xl border border-border bg-white shadow-sm hover:shadow-md hover:border-green-200 transition-all overflow-hidden"
    >
      {/* Product image thumbnails */}
      {merchant.productImages.length > 0 && (
        <div className="flex h-28 overflow-hidden">
          {merchant.productImages.slice(0, 3).map((url, i) => (
            <div key={i} className="relative flex-1 min-w-0">
              <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 768px) 33vw, 150px" />
            </div>
          ))}
        </div>
      )}

      <div className="p-5">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="relative w-14 h-14 rounded-full bg-green-50 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-border">
          {merchant.logo_url ? (
            <Image
              src={merchant.logo_url}
              alt={merchant.business_name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <span className="text-sm font-bold text-green-700">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-green-700 transition-colors truncate">
            {merchant.business_name}
          </h3>

          {/* Category badge */}
          {merchant.business_category && (
            <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {categoryLabels[merchant.business_category] || merchant.business_category}
            </span>
          )}

          {/* Description */}
          {merchant.business_description && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
              {merchant.business_description}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
            {merchant.city && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {merchant.city}
              </span>
            )}
            {merchant.productCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Package className="w-3 h-3" />
                {merchant.productCount} produk
              </span>
            )}
            {merchant.minPrice !== null && (
              <span className="inline-flex items-center gap-0.5">
                <Banknote className="w-3 h-3" />
                {merchant.minPrice === merchant.maxPrice
                  ? formatPrice(merchant.minPrice)
                  : `${formatPrice(merchant.minPrice)} — ${formatPrice(merchant.maxPrice!)}`
                }
              </span>
            )}
          </div>
        </div>
      </div>
      </div>
    </Link>
  );
}

function FilterSelect({ placeholder, options, value, onChange }: {
  placeholder: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(""); }}
        className="h-10 px-3 rounded-lg border border-border bg-white text-sm flex items-center gap-1.5 hover:bg-muted/30 transition-colors"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 min-w-[180px] bg-white border rounded-lg shadow-lg overflow-hidden">
          {options.length > 5 && (
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Cari..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${!value ? "bg-muted/30 font-medium" : "text-muted-foreground"}`}
            >
              {placeholder}
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${opt.id === value ? "bg-muted/30 font-medium text-foreground" : "text-foreground"}`}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">Tidak ditemukan</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
