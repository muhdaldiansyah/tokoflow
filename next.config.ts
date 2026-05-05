import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-separator",
    ],
  },
  images: {
    remotePatterns: [
      // Tokoflow's Supabase project. The previous hostname
      // (eafccoajzmanyflfidlg) was the CatatOrder project ref carried over
      // from the fork and silently broke product image rendering — next/image
      // returns 400 for hosts not on this list.
      {
        protocol: "https",
        hostname: "yhwjvdwmwboasehznlfv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Wildcard fallback so a future project-ref change (e.g. Singapore
      // region migration) doesn't silently break images again.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: "/(.*\\.(?:js|css|woff2|png|jpg|svg|ico))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache marketing pages at CDN (ISR-like behavior)
        source: "/(features|about|contact|privacy|terms|blog|blog/:path*)",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        // Cache /toko directory at CDN
        source: "/toko/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/toko",
        destination: "/",
        permanent: false,
      },
      {
        source: "/toko/:path*",
        destination: "/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/:slug", destination: "/order/:slug" },
        { source: "/:slug/sukses", destination: "/order/:slug/sukses" },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
