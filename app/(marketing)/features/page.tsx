import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Mic,
  Heart,
  Sun,
  LinkIcon,
  ClipboardPaste,
  Sparkles,
  ShoppingBag,
  CalendarClock,
  QrCode,
  MessageSquare,
  ClipboardList,
  Calculator,
  ImageIcon,
  Bell,
  Receipt,
  BarChart3,
  Users,
  WifiOff,
  FileCheck,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features — We handle the receipts. Not the recipes.",
  description:
    "Designed around five iconic moments that make selling humane. The Photo Magic, The Voice Ask, The Vibrate, The Swipe Forward, and The Evening Embrace.",
  alternates: {
    canonical: "https://tokoflow.com/features",
  },
};

type Feature = { icon: LucideIcon; title: string; desc: string };

type Section = {
  label: string;
  intro: string;
  features: Feature[];
  // Optional anchor image — only the three "iconic moment" sections carry one
  // (Photo Magic, Storefront, Evening Embrace). Keeping the rest icon-only
  // preserves scannability and avoids visual fatigue.
  image?: { src: string; alt: string };
};

const sections: Section[] = [
  {
    label: "The Photo Magic",
    image: {
      src: "/images/marketing/feature-photo-magic.webp",
      alt: "Top-down view of a hand holding a smartphone over a flour-dusted counter, framing a tray of brown sugar kuih and karipap.",
    },
    intro: "Sixty seconds from snap to live shop. No setup wizards, no business-type dropdowns, no forms. Just the camera you already use.",
    features: [
      { icon: Camera, title: "1-photo onboarding", desc: "Point your camera at your kitchen or your bakes. AI generates your shop name, story, menu, prices, and beautiful product photos in seconds." },
      { icon: Mic, title: "Voice setup fallback", desc: "Prefer speaking? Tap mic and say what you sell. \"I sell nasi goreng RM 12, mee ayam RM 10.\" Done." },
      { icon: Sparkles, title: "Smart defaults from context", desc: "Location, time, photo — Tokoflow infers your business type, hours, currency. You never pick anything from a dropdown." },
      { icon: LinkIcon, title: "One-tap share", desc: "Once your shop is live, share to IG bio, TikTok, WhatsApp status with a single tap." },
    ],
  },
  {
    label: "The Storefront",
    image: {
      src: "/images/marketing/feature-storefront.webp",
      alt: "A customer in a kopitiam holds a smartphone showing a clean shop page with a kuih lapis profile photo and a green Add to order button.",
    },
    intro: "A link with a face — your story, your menu, your customer's path from curious to confirmed.",
    features: [
      { icon: LinkIcon, title: "Beautiful shop page", desc: "Your photo, your story, your menu. Real personality, not a template." },
      { icon: MessageSquare, title: "Conversational order flow", desc: "Visual menu by default. Customers add items, set quantities, leave notes — and your link captures the order without you typing a single message." },
      { icon: Heart, title: "Personal story block", desc: "Two or three lines about who you are. Customers feel they're buying from a person, not a faceless seller." },
      { icon: QrCode, title: "Customer payment, in flow", desc: "DuitNow QR, FPX, cards, e-wallets via Billplz. Funds settle direct to your bank — Tokoflow never touches the money. 0% commission. Optional, default off until you connect." },
      { icon: Sparkles, title: "1-tap reorder", desc: "Returning customers see \"Order the same as last week?\" — phone-based, no signup, no cookies." },
    ],
  },
  {
    label: "The Vibrate, The Swipe, The Voice",
    intro: "When work is happening, Tokoflow disappears. When you need it, one gesture is enough.",
    features: [
      { icon: Heart, title: "Vibrate-only notifications", desc: "Soft buzz when an order arrives. No jarring sound by default. Tokoflow respects the kitchen, the hands, the flow." },
      { icon: ShoppingBag, title: "Swipe forward", desc: "Swipe right to advance an order: received → cooking → ready → out → done. One gesture per step. That's it." },
      { icon: Mic, title: "The Voice Ask", desc: "Tap mic, ask anything. \"Show me Pak Andi's orders from last week.\" \"Add ayam crispy, 27 ringgit.\" \"How much chicken's left?\" — done." },
      { icon: Bell, title: "Quiet hours by default", desc: "22:00–06:00 silent automatically. Family time stays family time." },
    ],
  },
  {
    label: "The Companion",
    intro: "A presence that knows when to help, and when to stay quiet.",
    features: [
      { icon: MessageSquare, title: "Reply drafts, never autoreply", desc: "When a customer asks about hours, prices, or a custom request, Tokoflow drafts a reply ready for you to send. You always send — your voice, your judgment." },
      { icon: ClipboardList, title: "Status messages on tap", desc: "\"Your order's ready.\" \"Out for delivery.\" \"Thank you.\" One tap fills the WhatsApp draft — you press send when it feels right." },
      { icon: PackageCheck, title: "Customer-confirmed delivery", desc: "When an order goes out, send a one-tap confirmation link via WhatsApp. The customer taps when they receive — no more chasing \"is it there yet?\" Tokoflow doesn't track the courier; only the customer's confirmation matters." },
      { icon: ImageIcon, title: "Inventory by photo", desc: "Restocked? Take a photo, Tokoflow updates stock. When a key item runs low, you see a heads-up in the dashboard — supplier reach-outs stay yours." },
      { icon: BarChart3, title: "Pricing whisper", desc: "Once a week, a gentle nudge: \"Peers in Shah Alam sell kuih lapis at RM 6, you're at RM 5. You could go a bit higher.\" Optional, never pushy." },
    ],
  },
  {
    label: "The Evening Embrace",
    image: {
      src: "/images/marketing/feature-evening.webp",
      alt: "A clean wooden counter at dusk with a phone face-up showing a soft summary card glow; a hijab-wearing woman silhouetted at a dining table with teh tarik in the warm tungsten background.",
    },
    intro: "Each evening, Tokoflow has something kind to say. Not charts — stories.",
    features: [
      { icon: Sun, title: "Daily summary, told kindly", desc: "\"You did well today. 23 orders, RM 1,247. Pak Andi said your kek lapis was wonderful.\" On slow days: \"Today was quieter. That's okay. Rest up.\"" },
      { icon: Heart, title: "Weekly story", desc: "\"This week — 3 first-time customers, all loved it. Top item: kek lapis, ordered 18×.\" Numbers told as a narrative." },
      { icon: Users, title: "Customer recognition", desc: "\"Pak Andi's back! 3rd time this month. Want me to tag him 'regular'?\"" },
      { icon: CalendarClock, title: "Seasonal awareness", desc: "Two weeks before Ramadan: \"Want help prepping your takjil menu?\" Tokoflow knows the rhythm of Malaysian commerce." },
    ],
  },
  {
    label: "Silent superpower (Business)",
    intro: "Behind the scenes — invoices, SST, LHDN MyInvois — handled quietly. You'll never have to think about a tax form.",
    features: [
      { icon: FileCheck, title: "LHDN MyInvois auto-submit", desc: "Each paid invoice flows into MyInvois automatically. UUID + Long ID stored. You never log in to LHDN." },
      { icon: Calculator, title: "SST, calculated", desc: "0% or 6%, applied per invoice or as default. Tokoflow does the math, files the records." },
      { icon: Receipt, title: "Beautiful PDF receipts", desc: "Auto-generated for every order — branded, dignified, with MyInvois reference. One tap to share via WhatsApp; you choose when to send." },
      { icon: Bell, title: "Tax reminder, gentle", desc: "\"This month's tax has been filed automatically.\" Information, not a task." },
    ],
  },
  {
    label: "Reliability",
    intro: "Quiet things that just work. So you trust the tool, then forget it.",
    features: [
      { icon: WifiOff, title: "Works offline", desc: "Lost signal? Keep taking orders. Everything syncs when you're back online." },
      { icon: ShoppingBag, title: "Stock auto-decrement", desc: "When you sell out, the menu auto-disables that item. No manual updates required." },
      { icon: ClipboardList, title: "Daily prep list", desc: "Today's totals by product, in one tap. Bring to the kitchen, send to your team via WhatsApp." },
      { icon: Sparkles, title: "Auto invoice numbering", desc: "Sequential, never duplicated, ready when you need it." },
    ],
  },
];

function FeatureCard({ icon: Icon, title, desc }: Feature) {
  return (
    <div className="flex gap-3.5 items-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#05A660]/10 text-green-600">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-24 lg:pt-28 pb-10 lg:pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Designed around five iconic moments.
          </h1>
          <p className="mt-3 text-muted-foreground lg:text-lg">
            The Photo Magic. The Vibrate. The Swipe Forward. The Voice Ask. The Evening Embrace. Everything else exists to support these — quietly.
          </p>
        </div>
      </section>

      {/* Feature Sections */}
      {sections.map((section, i) => (
        <section key={section.label} className={`py-12 lg:py-14 ${i > 0 ? "border-t" : ""}`}>
          <div className="max-w-2xl mx-auto px-4">
            {section.image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border shadow-sm mb-6">
                <Image
                  src={section.image.src}
                  alt={section.image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                />
              </div>
            )}
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
              {section.label}
            </p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {section.intro}
            </p>
            <div className="divide-y divide-border">
              {section.features.map((f) => (
                <div key={f.title} className="py-4">
                  <FeatureCard {...f} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="border-t py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">
            Your shop. One photo away.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Free forever for your first 50 orders/month. No credit card. No commission.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-[#05A660] text-white hover:bg-[#05A660]/90"
              asChild
            >
              <Link href="/login">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
