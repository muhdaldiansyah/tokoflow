import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

// Co-locate Vercel functions with Supabase Singapore (ap-southeast-1 = sin1).
// Without this, Vercel defaults to iad1 (US East) — each Supabase call costs
// ~220ms RTT instead of ~10ms, making every dashboard navigation feel slow.
export const preferredRegion = "sin1";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { ToastProvider } from "@/providers/ToastProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Brand-level tagline. Leaks into og:title + twitter:title for any page that
// doesn't override openGraph/twitter itself, so this string is what Google +
// social cards show by default.
const defaultTitle = `${siteConfig.name} — ${siteConfig.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: defaultTitle,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteConfig.description,
    creator: "@muhdaldiansyah",
    images: [siteConfig.ogImage],
  },
  alternates: {
    canonical: siteConfig.url,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tokoflow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#166534" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </head>
      <body className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
        <SpeedInsights />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
