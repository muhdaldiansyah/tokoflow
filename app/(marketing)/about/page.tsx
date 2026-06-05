import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  ArrowRight,
  Camera,
  Heart,
  Sun,
  Mic,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  Scissors,
  ChefHat,
  Shirt,
  Package,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tokoflow helps independent Malaysian businesses own their commerce channel — take orders from their own page, keep their customer data, and reduce dependence on marketplaces.",
  alternates: {
    canonical: "https://tokoflow.com/about",
  },
};

type Belief = { icon: LucideIcon; title: string; description: string };

const beliefs: Belief[] = [
  {
    icon: Camera,
    title: "Setup should disappear",
    description:
      "If your tool needs a wizard, a tutorial, or a checklist, it has already failed. One photo is all the setup we ask for.",
  },
  {
    icon: Heart,
    title: "Technology should respect you",
    description:
      "No notifications outside quiet hours. No streaks that punish a day off. No red badges that manufacture anxiety. Your time and energy matter.",
  },
  {
    icon: Mic,
    title: "Hands belong on your work",
    description:
      "When your hands are full — at the wok, at the sewing machine, at the production line — you should be able to talk to your shop. Voice replaces forms.",
  },
  {
    icon: Sun,
    title: "Every day deserves a kind ending",
    description:
      "Each evening, Tokoflow tells you the story of your day — warm on busy days, gentle on slow ones. Never judging. Always dignifying.",
  },
  {
    icon: Sparkles,
    title: "Compliance should be invisible",
    description:
      "LHDN, SST, MyInvois — all important, none of which should occupy your mind. Tokoflow handles them silently in the background.",
  },
  {
    icon: ShoppingBag,
    title: "Your customers belong to you",
    description:
      "When someone orders from your Tokoflow page, that relationship is yours — not a platform's algorithm. No commissions on your sales. No data sold. No recommendations to your competitors.",
  },
];

const targetUsers: { icon: LucideIcon; label: string }[] = [
  { icon: ChefHat, label: "F&B & home kitchens" },
  { icon: UtensilsCrossed, label: "Catering & meal-prep" },
  { icon: Package, label: "IKS & small manufacturers" },
  { icon: Sparkles, label: "Cosmetics & skincare" },
  { icon: Shirt, label: "Fashion & modest wear" },
  { icon: Scissors, label: "Crafters & tailors" },
  { icon: Heart, label: "Health & wellness" },
  { icon: ShoppingBag, label: "Independent retailers" },
];

export default function AboutPage() {
  return (
    <>
      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link
              href="/"
              className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]/40" />
            <span className="font-medium text-[#1E293B]">About</span>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">
            About Tokoflow
          </h1>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Every independent business deserves to own its commerce channel — not just rent space on someone else&apos;s platform.
          </p>
        </div>
      </div>

      {/* Hero image */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-8 lg:py-10">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm">
            <Image
              src="/images/marketing/about-hero.webp"
              alt="A Malaysian business owner's hands at work on their craft, with their Tokoflow order page visible on a nearby device."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-8 lg:p-10 shadow-sm">
            <p className="text-xs font-bold text-[#05A660] uppercase tracking-wider">
              Our mission
            </p>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold text-[#1E293B]">
              Own your commerce channel. Not just a listing on someone else&apos;s.
            </h2>
            <p className="mt-4 text-sm lg:text-base leading-relaxed text-[#475569]">
              In 1977, computers were for corporations and tech enthusiasts. Apple believed they should be for everyone — not by making them cheaper, but by making them feel different. Humane. Intuitive. Yours.
            </p>
            <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
              Today, selling online is accessible to everyone — TikTok, Shopee, Lazada. Anyone can list a product. But here&apos;s what hasn&apos;t changed: when you sell on someone else&apos;s platform, that platform owns the customer relationship. They take a cut of every order. When that customer wants to buy again, the platform decides what they see next — which might be a competitor. You did the work. You paid to get their attention. But you don&apos;t own the outcome.
            </p>
            <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
              <strong className="text-[#1E293B]">Tokoflow exists to change that.</strong> Not by replacing marketplaces — use them for discovery. But by giving every independent Malaysian business their own commerce channel: a page that is theirs, orders that go to their inbox, customer data that belongs to them, payment that settles direct to their bank. No IT company. No months of setup. Live today.
            </p>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
              What we believe
            </h2>
            <p className="mt-2 text-sm lg:text-base text-[#475569]">
              Six convictions that shape every decision we make.
            </p>
          </div>

          <div className="mt-8 lg:mt-10 grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {beliefs.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F6F0]">
                  <item.icon
                    className="h-5 w-5 text-[#05A660]"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mt-4 font-semibold text-base text-[#1E293B]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Tokoflow is for */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
            Who Tokoflow is for
          </h2>
          <p className="mt-2 text-sm lg:text-base text-[#475569]">
            Businesses that already have real products and real customers — but are ready to own their channel. From IKS manufacturers in Kedah to F&B sellers in the Klang Valley, from kosmetik makers to tailors and craft producers. If you&apos;ve already proven your product works, Tokoflow helps you own the next step.
          </p>

          <div className="mt-6 lg:mt-8 grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
            {targetUsers.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F6F0]">
                  <item.icon
                    className="h-4 w-4 text-[#05A660]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-[#1E293B]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-[#475569]">
            Use TikTok and Shopee to get discovered. Use Tokoflow to bring repeat customers to your own channel.
          </p>
        </div>
      </section>

      {/* Our promise */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-8 lg:p-10 shadow-sm">
            <p className="text-xs font-bold text-[#05A660] uppercase tracking-wider">
              Our promise
            </p>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold text-[#1E293B]">
              Humane is not optional.
            </h2>
            <p className="mt-4 text-sm lg:text-base leading-relaxed text-[#475569]">
              When designing Tokoflow, we always face the same trade-offs: faster shipping versus careful crafting, more features versus less noise, aggressive growth versus dignified pricing. We pick humane every time. Without exception.
            </p>
            <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
              That&apos;s our promise to you, and our promise to ourselves.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="mx-auto max-w-2xl text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
            Build your own order website today.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-[#475569]">
            Your first 50 orders are free. No credit card. No commission from Tokoflow. Customer data stays yours.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-[#05A660] text-white hover:bg-[#048C51]"
              asChild
            >
              <Link href="/login">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-semibold border-[#E2E8F0] text-[#1E293B] hover:bg-[#E8F6F0] hover:border-[#05A660]/30"
              asChild
            >
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
