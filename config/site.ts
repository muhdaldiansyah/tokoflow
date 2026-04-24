export const siteConfig = {
  name: "Tokoflow",
  description:
    "The LHDN-ready order platform for Malaysian SMBs selling on WhatsApp. Share one link, customers self-order, DuitNow collects, and each sale submits to MyInvois in one tap. Built for the RM 1M–5M merchant.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://tokoflow.com",
  ogImage: "/images/og.png",
  links: {
    twitter: "https://twitter.com/muhdaldiansyah",
    github: "https://github.com/muhdaldiansyah",
  },
  creator: "Muhammad Aldiansyah",
  keywords: [
    // Tier 1 — compliance wedge (panic-window 2026–2027)
    "LHDN e-Invoice Malaysia",
    "MyInvois WhatsApp storefront",
    "e-Invoice for SME Malaysia",
    "MyInvois order form",
    "LHDN compliant invoice app",
    "SST invoice Malaysia",
    // Tier 2 — WhatsApp-order intent
    "WhatsApp order form Malaysia",
    "WhatsApp storefront SME",
    "online order link Malaysia",
    "DuitNow QR order payment",
    "small business order management Malaysia",
    // Tier 3 — vertical long-tail
    "bakery order form Malaysia",
    "home F&B order tool Malaysia",
    "TikTok Shop reseller order manager",
    "pasar tani digital merchant",
    "cloud kitchen order tool Malaysia",
    "catering invoice Malaysia",
    // Tier 4 — brand
    "tokoflow",
  ],
};

export type SiteConfig = typeof siteConfig;
