import type { Metadata } from "next";
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
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About — Tokoflow",
  description:
    "Tokoflow exists to democratize selling for individuals — the way Apple democratized computing. Built for anyone with something to sell.",
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
    title: "Hands belong on your craft",
    description:
      "When your hands are sticky from baking or busy at the wok, you should be able to talk to your shop. Voice replaces forms.",
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
    title: "Customers belong to sellers",
    description:
      "We don't take commissions. We don't own your data. You build the relationship, you keep the relationship. We just make it easier to do.",
  },
];

const targetUsers = [
  { icon: ChefHat, label: "Home bakers" },
  { icon: UtensilsCrossed, label: "Catering & meal-prep" },
  { icon: Shirt, label: "Online fashion sellers" },
  { icon: ShoppingBag, label: "Modest fashion" },
  { icon: ShoppingBag, label: "Cosmetics & skincare" },
  { icon: Scissors, label: "Tailors & crafters" },
  { icon: ShoppingBag, label: "Hobby sellers" },
  { icon: ShoppingBag, label: "Anyone, really" },
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
            We&apos;re here to make selling as simple, dignified, and humane as the work itself deserves.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-8 lg:p-10 shadow-sm">
            <p className="text-xs font-bold text-[#05A660] uppercase tracking-wider">
              Our mission
            </p>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold text-[#1E293B]">
              To democratize selling — the way Apple democratized computing.
            </h2>
            <p className="mt-4 text-sm lg:text-base leading-relaxed text-[#475569]">
              In 1977, computers were for corporations and tech enthusiasts. Steve Jobs and Steve Wozniak believed they should be for everyone — not by making them cheaper, but by making them <em>feel different</em>. Humane. Beautiful. Intuitive.
            </p>
            <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
              Today, online selling is still only for those who&apos;ve learned five platforms, hired a team, or have a marketing budget. Most sellers — home bakers, mompreneurs, students, retirees with crafts, anyone with something to sell — are locked out. Not because they have nothing to offer, but because the infrastructure of modern commerce was built for corporations made smaller, not for individuals made bigger.
            </p>
            <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
              <strong className="text-[#1E293B]">Tokoflow exists to dismantle that.</strong>
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
            Anyone with something to sell. We start with home bakers and mompreneurs in the Klang Valley — but the principles travel everywhere.
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
            If you make something — anything — and people want to buy it, Tokoflow is for you.
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
            Your shop. One photo away.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-[#475569]">
            Free forever for your first 50 orders/month. No commission. Customers stay yours.
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
