// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import GoogleAnalytics from "./components/analytics/GoogleAnalytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Optimize font loading
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

// Updated Metadata object
export const metadata = {
  title: "Tokoflow - Sistem Inventory & Penjualan Terintegrasi | Dashboard Real-time",
  description: "Platform manajemen inventory dan penjualan untuk UMKM & online shop. Multi-channel marketplace, perhitungan profit otomatis, tracking stok real-time. Mulai gratis!",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tokoflow.com'),
  keywords: "tokoflow, inventory management, sistem penjualan, dashboard penjualan, manajemen stok, UMKM, online shop, marketplace integration, laporan penjualan, multi channel, shopee, tokopedia, tiktok shop",
  openGraph: {
    title: "Tokoflow - Sistem Inventory & Penjualan Terintegrasi",
    description: "Kelola inventory dan penjualan multi-channel dengan mudah. Dashboard real-time, laporan profit otomatis, dan integrasi marketplace.",
    type: "website",
    locale: "id_ID",
    siteName: "Tokoflow",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokoflow - Sistem Inventory & Penjualan",
    description: "Platform manajemen inventory dan penjualan untuk UMKM & online shop.",
  },
};

// Viewport configuration for better mobile experience
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1a56db',
};

// RootLayout component
export default function RootLayout({ children }) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/images/tokoflow-dashboard.png" as="image" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        {/* Critical inline styles to prevent layout shift */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; padding: 0; }
            .animate-fade-in, .animate-fade-in-up { opacity: 1 !important; }
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after { animation-duration: 0.01ms !important; }
            }
            /* Webkit specific properties */
            @supports (-webkit-appearance: none) {
              * { -webkit-text-size-adjust: 100%; }
            }
          `
        }} />
        <ClientLayout>
          {children}
        </ClientLayout>
        
        {/* Google Analytics */}
        <GoogleAnalytics />
      </body>
    </html>
  );
}