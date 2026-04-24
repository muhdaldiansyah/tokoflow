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
      {
        protocol: "https",
        hostname: "eafccoajzmanyflfidlg.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"], // Serve modern formats (40% smaller)
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
