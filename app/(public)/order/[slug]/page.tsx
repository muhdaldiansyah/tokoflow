import { notFound } from "next/navigation";
import Image from "next/image";
import { getPublicBusinessInfo } from "@/lib/services/public-order.service";
import { PublicOrderForm } from "./PublicOrderForm";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getCategories, buildCategoryLabels } from "@/config/categories";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [business, cats] = await Promise.all([getPublicBusinessInfo(slug), getCategories()]);
  if (!business) return { title: "Not found" };

  const catLabels = buildCategoryLabels(cats);
  const url = `${siteConfig.url}/${slug}`;
  const categoryLabel = business.businessCategory ? catLabels[business.businessCategory] || business.businessCategory : "";
  const locationPart = business.city ? ` in ${business.city}` : "";
  const description = business.businessDescription
    || `Order directly from ${business.businessName}${locationPart} via Tokoflow`;

  return {
    title: `${business.businessName}${categoryLabel ? ` — ${categoryLabel}` : ""} | Order online`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `Pesan di ${business.businessName}`,
      description,
      siteName: siteConfig.name,
      ...(business.logoUrl && {
        images: [{ url: business.logoUrl, width: 500, height: 500, alt: business.businessName }],
      }),
    },
    twitter: {
      card: "summary",
      title: `Pesan di ${business.businessName}`,
      description,
      ...(business.logoUrl && { images: [business.logoUrl] }),
    },
  };
}

export default async function PublicOrderPage({ params }: PageProps) {
  const { slug } = await params;
  const [business, dbCategories] = await Promise.all([
    getPublicBusinessInfo(slug),
    getCategories(),
  ]);
  const CATEGORY_LABELS = buildCategoryLabels(dbCategories);

  if (!business) notFound();

  // Build JSON-LD LocalBusiness schema
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.businessName,
    url: `${siteConfig.url}/${slug}`,
    ...(business.logoUrl && { image: business.logoUrl }),
    ...(business.businessDescription && { description: business.businessDescription }),
    ...(business.businessPhone && { telephone: business.businessPhone }),
    ...(business.businessAddress && {
      address: {
        "@type": "PostalAddress",
        streetAddress: business.businessAddress,
        ...(business.city && { addressLocality: business.city }),
        addressCountry: "ID",
      },
    }),
    ...(business.completedOrders >= 10 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: business.completedOrders,
      },
    }),
  };

  // Add product offers if available
  if (business.frequentItems.length > 0) {
    const minPrice = Math.min(...business.frequentItems.map(i => i.price));
    const maxPrice = Math.max(...business.frequentItems.map(i => i.price));
    jsonLd.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Menu",
      numberOfItems: business.frequentItems.length,
      itemListElement: business.frequentItems.slice(0, 5).map((item) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: item.name,
          ...(item.description && { description: item.description }),
          offers: {
            "@type": "Offer",
            price: item.price,
            priceCurrency: "MYR",
            availability: item.stock === 0
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          },
        },
      })),
    };
    jsonLd.priceRange = minPrice === maxPrice
      ? `RM ${minPrice.toLocaleString("en-MY")}`
      : `RM ${minPrice.toLocaleString("en-MY")} - RM ${maxPrice.toLocaleString("en-MY")}`;
  }

  if (!business.orderFormEnabled) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="relative w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 overflow-hidden">
            {business.logoUrl ? (
              <Image src={business.logoUrl} alt="" fill className="object-cover" sizes="64px" />
            ) : (
              <span className="text-2xl">🌿</span>
            )}
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Order form is currently inactive
          </h1>
          <p className="text-sm text-muted-foreground">
            Contact {business.businessName} directly to place an order.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicOrderForm
        slug={slug}
        businessName={business.businessName}
        frequentItems={business.frequentItems}
        logoUrl={business.logoUrl}
        businessAddress={business.businessAddress}
        businessPhone={business.businessPhone}
        businessDescription={business.businessDescription}
        businessCategory={business.businessCategory ? CATEGORY_LABELS[business.businessCategory] || business.businessCategory : undefined}
        businessCategoryId={business.businessCategory || undefined}
        city={business.city}
        citySlug={business.citySlug}
        operatingHours={business.operatingHours}
        completedOrders={business.completedOrders}
        repeatCustomerPct={business.repeatCustomerPct}
        memberSince={business.memberSince}
        hasQris={business.hasQris}
        qrisUrl={business.qrisUrl}
        preorderEnabled={business.preorderEnabled}
        langgananEnabled={business.langgananEnabled}
        dailyOrderCapacity={business.dailyOrderCapacity}
        businessId={business.businessId}
      />
    </>
  );
}
