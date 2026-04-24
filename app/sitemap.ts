import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

// Legacy BI blog posts from Tokoflow — to be replaced with MY content in Phase 3 GTM
const blogPosts: Array<{ slug: string; lastModified: string }> = [];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tokoflow.com";

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.lastModified),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Dynamic: fetch all active merchant store pages
  let merchantEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createServiceClient();
    const { data: merchants } = await supabase
      .from("profiles")
      .select("slug, updated_at")
      .eq("order_form_enabled", true)
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (merchants) {
      merchantEntries = merchants.map((m) => ({
        url: `${baseUrl}/${m.slug}`,
        lastModified: new Date(m.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }

    // City pages
    const { data: cityProfiles } = await supabase
      .from("profiles")
      .select("city_slug")
      .eq("is_listed", true)
      .eq("order_form_enabled", true)
      .not("city_slug", "is", null)
      .limit(500);

    if (cityProfiles) {
      const uniqueCities = [...new Set(cityProfiles.map((p) => p.city_slug))].filter(Boolean);
      for (const citySlug of uniqueCities) {
        merchantEntries.push({
          url: `${baseUrl}/toko/${citySlug}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.85,
        });
      }
    }

    // Community pages
    const { data: communityData } = await supabase
      .from("communities")
      .select("slug, updated_at")
      .eq("is_active", true)
      .gte("member_count", 3)
      .order("member_count", { ascending: false })
      .limit(200);

    if (communityData) {
      for (const community of communityData) {
        merchantEntries.push({
          url: `${baseUrl}/community/${community.slug}`,
          lastModified: new Date(community.updated_at),
          changeFrequency: "daily" as const,
          priority: 0.85,
        });
      }
    }
  } catch {
    // Sitemap generation should not fail if DB is unavailable
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogEntries,
    ...merchantEntries,
    {
      url: `${baseUrl}/toko`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
