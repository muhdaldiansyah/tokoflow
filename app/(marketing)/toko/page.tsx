import { Suspense } from "react";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { getCategories, buildCategoryLabels } from "@/config/categories";
import { DirectoryGrid } from "./DirectoryGrid";

export const metadata: Metadata = {
  title: "Discover sellers near you | Tokoflow",
  description:
    "Real shops by real people — bakers, caterers, cooks, crafters. Order directly. No commissions, no middlemen.",
  alternates: { canonical: `${siteConfig.url}/toko` },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/toko`,
    title: "Discover sellers near you | Tokoflow",
    description:
      "Real shops by real people. Order directly, no commissions, no middlemen.",
    siteName: siteConfig.name,
  },
};

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

async function getDirectoryData() {
  const supabase = await createServiceClient();

  // Fetch listed merchants
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, slug, business_name, business_description, business_category, city, city_slug, logo_url, business_address")
    .eq("is_listed", true)
    .eq("order_form_enabled", true)
    .not("slug", "is", null)
    .not("business_name", "is", null)
    .order("updated_at", { ascending: false });

  if (!profiles || profiles.length === 0) {
    return { merchants: [], cities: [], categories: [] };
  }

  // Fetch product counts and price ranges
  const userIds = profiles.map((p) => p.id);
  const { data: products } = await supabase
    .from("products")
    .select("user_id, price, image_url")
    .in("user_id", userIds)
    .eq("is_available", true)
    .is("deleted_at", null);

  const productCounts: Record<string, number> = {};
  const priceRanges: Record<string, { min: number; max: number }> = {};
  const productImages: Record<string, string[]> = {};
  if (products) {
    const idToSlug = Object.fromEntries(profiles.map((p) => [p.id, p.slug]));
    for (const p of products) {
      const s = idToSlug[p.user_id];
      if (s) {
        productCounts[s] = (productCounts[s] || 0) + 1;
        if (!priceRanges[s]) {
          priceRanges[s] = { min: p.price, max: p.price };
        } else {
          priceRanges[s].min = Math.min(priceRanges[s].min, p.price);
          priceRanges[s].max = Math.max(priceRanges[s].max, p.price);
        }
        if (p.image_url && (!productImages[s] || productImages[s].length < 4)) {
          if (!productImages[s]) productImages[s] = [];
          productImages[s].push(p.image_url);
        }
      }
    }
  }

  const merchants: Merchant[] = profiles
    .map((p) => ({
      slug: p.slug!,
      business_name: p.business_name!,
      business_description: p.business_description,
      business_category: p.business_category,
      city: p.city,
      city_slug: p.city_slug,
      logo_url: p.logo_url,
      business_address: p.business_address,
      productCount: productCounts[p.slug!] || 0,
      minPrice: priceRanges[p.slug!]?.min ?? null,
      maxPrice: priceRanges[p.slug!]?.max ?? null,
      productImages: productImages[p.slug!] || [],
    }))
    // Quality gate: hide stores with 0 products
    .filter((m) => m.productCount > 0)
    // Sort: stores with more products + logo first
    .sort((a, b) => {
      const aScore = a.productCount + (a.logo_url ? 10 : 0) + (a.business_category ? 5 : 0) + (a.city ? 3 : 0);
      const bScore = b.productCount + (b.logo_url ? 10 : 0) + (b.business_category ? 5 : 0) + (b.city ? 3 : 0);
      return bScore - aScore;
    });

  // Extract unique cities and categories
  const cities = [...new Map(
    profiles.filter((p) => p.city && p.city_slug).map((p) => [p.city_slug, { city: p.city!, city_slug: p.city_slug! }])
  ).values()];

  const categories = [...new Set(profiles.map((p) => p.business_category).filter(Boolean))] as string[];

  return { merchants, cities, categories };
}

export default async function TokoPage() {
  const [{ merchants, cities, categories }, dbCategories] = await Promise.all([
    getDirectoryData(),
    getCategories(),
  ]);
  const CATEGORY_LABELS = buildCategoryLabels(dbCategories);

  // JSON-LD ItemList schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Sellers on Tokoflow",
    description: "Independent shops — bakers, caterers, cooks, crafters — taking orders directly via Tokoflow",
    numberOfItems: merchants.length,
    itemListElement: merchants.slice(0, 20).map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: m.business_name,
        url: `${siteConfig.url}/${m.slug}`,
        ...(m.logo_url && { image: m.logo_url }),
        ...(m.business_description && { description: m.business_description }),
        ...(m.business_address && {
          address: {
            "@type": "PostalAddress",
            streetAddress: m.business_address,
            ...(m.city && { addressLocality: m.city }),
            addressCountry: "MY",
          },
        }),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="pt-22 pb-4 bg-gradient-to-b from-emerald-50/40 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-foreground">
            Discover sellers
          </h1>
          {merchants.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {merchants.length} shops
            </span>
          )}
        </div>
      </section>

      {/* Directory Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense>
            <DirectoryGrid
              merchants={merchants}
              cities={cities}
              categories={categories}
              categoryLabels={CATEGORY_LABELS}
            />
          </Suspense>
        </div>
      </section>

      {/* CTA for merchants */}
      <section className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Sell something?</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Sign up free — one photo, your shop is live. Appears here automatically. Customers find you, order directly.
          </p>
          <a
            href="/register"
            className="inline-flex items-center justify-center mt-6 h-11 px-6 rounded-lg bg-[#05A660] text-white text-sm font-medium hover:bg-[#05A660]/90 transition-colors"
          >
            Start free
          </a>
        </div>
      </section>
    </>
  );
}
