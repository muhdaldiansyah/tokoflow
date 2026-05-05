import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { H1, Lead, P } from "@/components/ui/typography";
import { PhotoMagicHero } from "./PhotoMagicHero";
import ComingSoon from "./ComingSoon";

const isMaintenanceMode =
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

// Brand page — opt out of the layout's "%s | Tokoflow" template via
// title.absolute so the homepage shows just "Tokoflow — We handle the
// receipts. Not the recipes." rather than "Tokoflow — ... | Tokoflow".
// openGraph + twitter blocks are explicit overrides because the layout's
// defaults still reference siteConfig.description; the homepage wants
// its own punchier line in social cards.
const homepageTitle = isMaintenanceMode
  ? "Tokoflow — Coming Soon"
  : "Tokoflow — We handle the receipts. Not the recipes.";

const homepageDescription = isMaintenanceMode
  ? "Tokoflow is coming soon. The simplest way for anyone to start selling — one photo to launch your shop."
  : "Snap one photo. See your shop preview live. We handle the receipts (payment, invoices, tax) — your craft stays yours. Built for Malaysian home sellers.";

export const metadata: Metadata = {
  title: { absolute: homepageTitle },
  description: homepageDescription,
  alternates: {
    canonical: "https://tokoflow.com",
  },
  openGraph: {
    title: homepageTitle,
    description: homepageDescription,
    url: "https://tokoflow.com",
  },
  twitter: {
    title: homepageTitle,
    description: homepageDescription,
  },
};

// Ownership statements — same six positioning truths as the bible's refuse
// list, but framed as what stays YOURS. Visitor reads "your" six times instead
// of six "no, no, no" statements before they know what we do.
const ownership = [
  { lead: "Your customers, your voice", tail: "we never message on your behalf" },
  { lead: "Your prices, your judgment", tail: "we never set them for you" },
  { lead: "Your reviews to answer", tail: "we never auto-reply" },
  { lead: "Your pace", tail: "no streaks, no badges, no daily-target shaming" },
  { lead: "Your data, always", tail: "never sold, ever" },
  { lead: "Your freedom", tail: "cancel one tap, export everything" },
];

const tiers = [
  {
    name: "Free",
    price: "RM 0",
    period: "first 50 orders / month",
    blurb: "Everything you need to start. No credit card.",
    cta: "Start free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "RM 49",
    period: "/ month",
    blurb: "Unlimited orders, voice + photo parsing, peer pricing whisper, MyInvois ready.",
    cta: "Try Pro",
    href: "/register",
    highlight: true,
  },
  {
    name: "Business",
    price: "RM 99",
    period: "/ month",
    blurb: "Everything in Pro plus multi-staff and advanced compliance.",
    cta: "Talk to us",
    href: "/contact",
    highlight: false,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tokoflow",
  url: "https://tokoflow.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "MYR",
    description: "Free forever for your first 50 orders/month",
  },
  description:
    "We handle the receipts, not the recipes. Snap one photo, see your shop preview live, then sign up. Tokoflow handles payment matching, invoices, and tax silently.",
  // Honesty pass — only list what is actually shipped or one-tap available.
  // The previous list claimed an "AI customer assistant — handles chat for
  // you", which directly violates the bible's refuse list (Foreground Assist
  // *suggests* drafts; merchant always sends).
  featureList: [
    "1-photo onboarding — your shop in 60 seconds",
    "Customer payments — DuitNow QR, FPX, cards, e-wallets",
    "0% commission · funds settle direct to your bank",
    "Voice and photo order parsing",
    "Beautiful shop link with your story",
    "1-tap reorder for returning customers",
    "Customer-confirmed delivery — one tap, no chasing",
    "Vibrate-only notifications (respect your flow)",
    "Daily evening summary in your language",
    "Silent LHDN MyInvois (Pro tier)",
    "Auto SST calculation",
    "Customer auto-directory by phone",
    "Inventory tracking by stock count",
    "Auto receipt generation",
    "Works offline",
  ],
  inLanguage: "en",
  author: {
    "@type": "Organization",
    name: "Tokoflow",
    url: "https://tokoflow.com",
  },
};

export default function HomePage() {
  if (isMaintenanceMode) {
    return <ComingSoon />;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        <div className="max-w-5xl relative mx-auto px-4 z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 pr-4 text-sm font-medium text-[#1E293B] shadow-sm cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warm-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-warm-green"></span>
                </span>
                For anyone with something to sell
              </div>

              <div className="space-y-5">
                <H1 className="tracking-tight text-[#1E293B] text-3xl lg:text-4xl lg:leading-tight">
                  We handle the{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-warm-green to-warm-green-hover">
                    receipts.
                  </span>
                  <br className="hidden md:block" />
                  Not the recipes.
                </H1>
                {/* Quiet BM echo for MY visitors who code-switch */}
                <p className="text-sm italic text-[#94A3B8]">Resi kami urus. Resep kamu.</p>
                <Lead className="text-[#475569] leading-relaxed font-normal">
                  Snap one photo. See your shop preview live — before you sign up.
                </Lead>
                <P className="text-[#475569] leading-relaxed">
                  Tokoflow handles the admin (payment matching, invoices, tax) quietly in the background. Your kitchen, your customers, your craft — all yours.
                </P>
              </div>

              <div className="pt-2">
                <PhotoMagicHero />
              </div>

              <p className="text-xs text-[#94A3B8]">
                Free for your first 50 orders / month · No credit card · Cancel anytime
              </p>
            </div>

            {/* Hero image — cinematic editorial photograph (GPT-5.4 Image 2,
                T2I leaderboard #1) replaces the previous CSS phone mockup.
                Per positioning bible v1.2: "Background Twin invisible" — the
                craft (kuih, hands, kitchen) is the protagonist; the phone is
                a quiet helper in the frame. Reference: Toast / Square / Etsy
                hero patterns where the maker leads, not the product. Square
                1:1 keeps the right column visually balanced with the left
                text column at desktop and stacks cleanly on mobile. */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative aspect-square w-full max-w-[480px] overflow-hidden rounded-3xl shadow-[0_32px_80px_-8px_rgba(0,0,0,0.18)]">
                <Image
                  src="/images/marketing/hero-craft.webp"
                  alt="A Malaysian home seller's hand holds a smartphone showing a clean shop page beside a tray of freshly baked kuih lapis on a flour-dusted counter at golden hour."
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 480px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain → Promise — left-bar accent instead of full cards. Lighter
          visual weight, same emotional arc. Copy is intentionally factual:
          Tokoflow does not auto-reply customers (Foreground Assist suggests,
          merchant sends), so we say what actually happens. */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="border-l-2 border-red-200 pl-5">
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-[0.12em] mb-2">Right now</p>
            <p className="text-[#475569] leading-relaxed">
              30 unread WhatsApp messages. Hands sticky from baking. By evening you&apos;re tired, and admin still waits.
            </p>
          </div>

          <div className="flex justify-center my-4">
            <ArrowRight className="h-4 w-4 text-warm-green/50 rotate-90" />
          </div>

          <div className="border-l-2 border-warm-green pl-5">
            <p className="text-[11px] font-semibold text-warm-green uppercase tracking-[0.12em] mb-2">With Tokoflow</p>
            <p className="text-[#475569] leading-relaxed">
              Customers order through your link, pay direct to your bank, and get a clean receipt. Invoices auto-generate. By evening, you hear: <em className="not-italic font-medium text-[#1E293B]">&ldquo;Today, you did well. 23 orders. Rest well.&rdquo;</em>
            </p>
          </div>
        </div>
      </section>

      {/* Yours. All of it. — positive ownership framing of the bible's
          refuse list. Same content, opposite valence: lead with the value
          (your customers / prices / voice / data) and let the refuse follow
          as the reason. Visitor reads "your" six times. */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Yours. All of it.
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              The kitchen, the customers, the voice — they were yours before Tokoflow, and they stay yours.
            </p>
          </div>

          <ul className="space-y-3 max-w-xl mx-auto">
            {ownership.map((item) => (
              <li key={item.lead} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-warm-green shrink-0" aria-hidden />
                <span className="text-[#475569] leading-relaxed">
                  <span className="font-semibold text-[#1E293B]">{item.lead}</span>
                  <span> — {item.tail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Real shops anchor — image lands between ownership statements and
          pricing so the visitor sees their own reality before they see what
          it costs. No copy overlay; the image carries the meaning. */}
      <section className="border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm">
            <Image
              src="/images/marketing/real-shops.webp"
              alt="A Malaysian home seller arranges freshly baked kuih lapis on a wooden tray in a sunlit kitchen, smartphone resting on the counter."
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
          <p className="mt-4 text-center text-sm text-[#475569]">
            Your shop, in your kitchen, on your terms.
          </p>
        </div>
      </section>

      {/* Pricing inline — visitors never have to leave the homepage to know
          what it costs. Self-serve B2C pattern, not enterprise-nurture. */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Simple pricing. Pay only when you grow.
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Cancel anytime. Export everything. No credit card to start.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 ${
                  tier.highlight
                    ? "border-warm-green bg-white shadow-md"
                    : "border-[#E2E8F0] bg-white"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center h-6 px-3 text-[11px] font-semibold rounded-full bg-warm-green text-white">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-semibold text-[#1E293B]">{tier.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#1E293B]">{tier.price}</span>
                  <span className="text-xs text-[#94A3B8]">{tier.period}</span>
                </div>
                <p className="mt-3 text-sm text-[#475569] leading-relaxed">{tier.blurb}</p>
                <Link
                  href={tier.href}
                  className={`mt-5 inline-flex items-center justify-center w-full h-10 rounded-xl text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-warm-green text-white hover:bg-warm-green-hover"
                      : "bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-slate-50"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-xs text-[#94A3B8]">
            <Link href="/pricing" className="underline hover:text-[#475569]">
              See full pricing details →
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
              Your shop. One photo away.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-[#475569]">
              Free forever for your first 50 orders/month. No credit card. No commission. Customers stay yours.
            </p>

            <div className="mt-8">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-warm-green text-white w-full sm:w-auto hover:bg-warm-green-hover" asChild>
                <Link href="/register">
                  Start free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
