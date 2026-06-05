import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { getCategories, buildCategoryLabels } from "@/config/categories";
import { DirectoryGrid } from "../DirectoryGrid";

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

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

async function getCityData(citySlug: string) {
  const supabase = await createServiceClient();

  // Validate the slug against the canonical MY cities table first. If the
  // slug isn't a real MY city, render the 404. If it IS a real city but
  // has zero merchants yet, fall through to the "be the first" empty state
  // so we don't 404 on a legitimate URL — that's how SEO + early-traffic
  // compounding starts on a new directory surface.
  const { data: city } = await supabase
    .from("cities")
    .select("name, slug")
    .eq("slug", citySlug)
    .maybeSingle();
  if (!city) return null;

  // Fetch merchants in this city
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, slug, business_name, business_description, business_category, city, city_slug, logo_url, business_address")
    .eq("is_listed", true)
    .eq("order_form_enabled", true)
    .eq("city_slug", citySlug)
    .not("slug", "is", null)
    .not("business_name", "is", null)
    .order("updated_at", { ascending: false });

  const cityName = city.name;

  if (!profiles || profiles.length === 0) {
    return { merchants: [], categories: [], cityName, isEmpty: true as const };
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

  const merchants: Merchant[] = profiles.map((p) => ({
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
  }));

  const categories = [...new Set(profiles.map((p) => p.business_category).filter(Boolean))] as string[];

  return { merchants, categories, cityName, isEmpty: false as const };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const data = await getCityData(citySlug);
  if (!data) return { title: "City not found", robots: { index: false } };

  const title = data.isEmpty
    ? `Sellers in ${data.cityName}`
    : `Caterers & bakeries in ${data.cityName}`;
  const description = data.isEmpty
    ? `${data.cityName} is open for sellers. Be the first to list your shop on Tokoflow and get discovered by local customers.`
    : `Find ${data.merchants.length} F&B and bakery merchants in ${data.cityName}. Order directly, no hefty commissions.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteConfig.url}/store/${citySlug}` },
    openGraph: {
      type: "website",
      url: `${siteConfig.url}/store/${citySlug}`,
      title,
      description,
      siteName: siteConfig.name,
    },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { citySlug } = await params;
  const data = await getCityData(citySlug);

  if (!data) notFound();

  const { merchants, categories, cityName } = data;
  const dbCategories = await getCategories();
  const CATEGORY_LABELS = buildCategoryLabels(dbCategories);

  // JSON-LD for city directory
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Caterers & bakeries in ${cityName}`,
    description: `Food SMBs in ${cityName} taking orders online`,
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
        address: {
          "@type": "PostalAddress",
          ...(m.business_address && { streetAddress: m.business_address }),
          addressLocality: cityName,
          addressCountry: "ID",
        },
      },
    })),
  };

  // Empty state — valid MY city, but no merchants yet. Renders the
  // "be the first" surface so SEO + early-traffic still works while
  // we wait for the first merchant in this city. The hero copy doesn't
  // pretend the directory is populated.
  if (data.isEmpty) {
    return (
      <>
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-green-600 mb-2">
              <Link href="/store" className="hover:underline">Browse stores</Link> / {cityName}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {cityName} is open for sellers
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              No shops in {cityName} on Tokoflow yet. If you bake, cook, cater, or craft from home here — you can be the first listed.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <a
                href="/register"
                className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-[#05A660] text-white text-sm font-medium hover:bg-[#05A660]/90 transition-colors"
              >
                Be the first in {cityName}
              </a>
              <Link
                href="/store"
                className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                Browse other cities
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              First 50 orders free · No credit card · No commissions
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-green-600 mb-2">
            <Link href="/store" className="hover:underline">Browse stores</Link> / {cityName}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Caterers & bakeries in {cityName}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {merchants.length} shops taking orders online in {cityName}.
            Order directly — no big platform fees.
          </p>
        </div>
      </section>

      {/* Directory Grid — filters minus city (already filtered) */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense>
            <DirectoryGrid
              merchants={merchants}
              cities={[]}
              categories={categories}
              categoryLabels={CATEGORY_LABELS}
            />
          </Suspense>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Got a food business in {cityName}?</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Sign up free — your store appears on this page. Customers can find and order directly.
          </p>
          <a
            href="/register"
            className="inline-flex items-center justify-center mt-6 h-11 px-6 rounded-lg bg-[#05A660] text-white text-sm font-medium hover:bg-[#05A660]/90 transition-colors"
          >
            Sign up free
          </a>
        </div>
      </section>
    </>
  );
}
