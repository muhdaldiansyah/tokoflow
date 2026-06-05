import type { MetadataRoute } from "next";

// We let the marketing surfaces (`/`, `/features`, `/pricing`, `/blog`,
// `/store`, `/store/[city]`, `/[merchant-slug]`) get indexed. Anything
// authenticated, token-protected, or admin-only is kept out of the
// crawl. Receipts (`/r/`) and customer-ack pages (`/a/`) already set
// `noindex` inline in their metadata; we list them here too so well-
// behaved crawlers don't even attempt the URL.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/setup",
          "/orders/",
          "/products/",
          "/customers/",
          "/invoices/",
          "/tax",
          "/today",
          "/report",
          "/prep",
          "/settings",
          "/profil",
          "/pengingat",
          "/pembayaran",
          "/laporan",
          "/r/", // public receipts — token URLs, not for indexing
          "/a/", // customer ack — token URLs, not for indexing
          "/join/", // community invite shortlink, single-use
        ],
      },
    ],
    sitemap: "https://tokoflow.com/sitemap.xml",
  };
}
