export const siteConfig = {
  name: "Tokoflow",
  // Used as the global og:description / twitter:description fallback. Pages
  // that don't override their own description fall back to this. ~155 chars
  // is the SERP truncation point — keep at or under to avoid the "..." cut.
  description:
    "Launch your WhatsApp shop with one photo. Customer payments settle direct to your bank — 0% commission. We handle the receipts; your craft stays yours.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://tokoflow.com",
  // Support contact: replace with the real Tokoflow MY WhatsApp once the
  // company line is provisioned. Used by the marketing footer + /contact page.
  supportEmail: "hello@tokoflow.com",
  supportWhatsapp: "60123456789", // placeholder MY number — update before launch
  ogImage: "/images/og.png",
  links: {
    twitter: "https://twitter.com/muhdaldiansyah",
    github: "https://github.com/muhdaldiansyah",
  },
  creator: "Muhammad Aldiansyah",
  keywords: [
    // Tier 1 — core positioning
    "online shop in one photo",
    "AI shop builder",
    "easiest way to sell online",
    "shop link from photo",
    "AI selling assistant",
    // Tier 2 — seller intent
    "online store for home business",
    "shop link in bio",
    "WhatsApp order link Malaysia",
    "online order form Malaysia",
    "DuitNow QR order payment",
    "small business selling tool",
    // Tier 3 — vertical long-tail
    "home bakery order link",
    "mompreneur online store",
    "TikTok seller order manager",
    "Instagram bio shop link",
    "modest fashion seller tool",
    "catering order tool Malaysia",
    // Tier 4 — silent superpower (compliance, not hero)
    "LHDN MyInvois auto submit",
    "SST invoice Malaysia",
    // Tier 5 — brand
    "tokoflow",
  ],
};

export type SiteConfig = typeof siteConfig;
