import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  ClipboardList,
  Users,
  BarChart3,
  UtensilsCrossed,
  Scissors,
  ChefHat,
  ShoppingBag,
  Shirt,
  LinkIcon,
  WifiOff,
  ClipboardPaste,
  Camera,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About — Tokoflow",
  description:
    "Every order that's recorded is proof your business is real. Tokoflow helps Malaysian merchants sell on WhatsApp, get paid, and stay LHDN-compliant — no commission, your customers stay yours.",
  alternates: {
    canonical: "https://tokoflow.com/about",
  },
};

const problems = [
  {
    title: "Hard work, nothing to show for it",
    description:
      "Cooking from dawn, taking orders until midnight — but no proper records. Asked about this month's revenue, the answer is a guess.",
  },
  {
    title: "Income comes in, but things slip through",
    description:
      "Orders scattered across hundreds of WhatsApp threads. Written on paper, in your head, on notes — and one still gets missed.",
  },
  {
    title: "Don't know what's profitable",
    description:
      "You don't know which customer is your best, which product sells most, or the margin on each dish. The business runs without direction.",
  },
  {
    title: "On a platform, customers aren't yours",
    description:
      "Food delivery apps take 20-30% on every order. The platform owns the customer data — you're just a supplier.",
  },
  {
    title: "LHDN deadline looming",
    description:
      "From 1 January 2027, every merchant RM 1M–5M turnover must issue MyInvois-compliant e-Invoices. Most merchants are unprepared.",
  },
];

const targetUsers = [
  { icon: UtensilsCrossed, label: "Kopitiam & warung" },
  { icon: ChefHat, label: "Bakery & cakes" },
  { icon: Scissors, label: "Tailoring" },
  { icon: UtensilsCrossed, label: "Catering" },
  { icon: ShoppingBag, label: "TikTok Shop reseller" },
  { icon: Shirt, label: "Apparel" },
  { icon: ShoppingBag, label: "Home F&B" },
  { icon: ShoppingBag, label: "Other SMBs" },
];

const solutions = [
  {
    icon: LinkIcon,
    title: "Free store link",
    description:
      "Customers open the link, pick items themselves, order lands in your dashboard. Auto-confirmed via WhatsApp. No manual copy-paste.",
  },
  {
    icon: ClipboardPaste,
    title: "Paste a chat or photo",
    description:
      "Still getting orders by chat? Paste the WhatsApp thread or upload a screenshot — AI structures it into a clean order.",
  },
  {
    icon: FileCheck,
    title: "LHDN MyInvois — Pro",
    description:
      "One tap turns a paid order into a UBL 2.1 JSON e-Invoice submitted to MyInvois. SST calculated. >RM10K rule flagged for individual submission.",
  },
  {
    icon: ClipboardList,
    title: "Status & payment tracking",
    description:
      "New, Processing, Shipped, Completed — plus Paid, Partial, Unpaid per order. Everything visible in one place.",
  },
  {
    icon: Users,
    title: "Auto customer directory",
    description:
      "Customers saved automatically from orders. Lifetime spend and order history tracked per customer.",
  },
  {
    icon: MessageSquare,
    title: "Receipts & reminders via WhatsApp",
    description:
      "Send PDF receipts to WhatsApp. Remind unpaid customers. Your DuitNow QR appears on every receipt.",
  },
  {
    icon: BarChart3,
    title: "Recap, reports, AI insights",
    description:
      "Daily recap via WhatsApp in one tap. AI spots trends and suggests moves. Monthly report exports to Excel.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    description:
      "Lost signal at the market or in the kitchen? Keep taking orders — they sync automatically when you're back online.",
  },
  {
    icon: Camera,
    title: "Voice to order",
    description:
      "Hands busy cooking? Just speak the order — AI transcribes it into items with quantities.",
  },
];

export default function AboutPage() {
  return (
    <>
      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link href="/" className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]">
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
            From selling to a real business — every order that's recorded is proof your business is real.
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-8 shadow-sm">
              <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
                Why Tokoflow exists
              </h2>
              <p className="mt-4 text-sm lg:text-base leading-relaxed text-[#475569]">
                Millions of Malaysian SMEs form the backbone of the economy — but most still struggle to properly record their transactions. Without records, a business is invisible: to banks, to the tax authority, even to the owner.
              </p>
              <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
                Tokoflow believes: <strong className="text-[#1E293B]">every order that's recorded is proof your business is real.</strong> A link is where orders are placed and recorded. WhatsApp stays for conversation. Data is clean, customers stay yours, zero commission.
              </p>
              <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
                Not replacing how you work — just making it tidier, so your effort is visible and recorded.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
            The root problem
          </h2>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            As long as orders are captured from chats one by one, these problems keep coming back.
          </p>

          <div className="mt-6 lg:mt-8 grid gap-4 lg:gap-6 sm:grid-cols-2">
            {problems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 lg:p-6 shadow-sm"
              >
                <h3 className="font-semibold text-sm lg:text-base text-[#1E293B]">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs lg:text-sm leading-relaxed text-[#475569]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
            How Tokoflow solves it
          </h2>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Two ways to take orders — a store link for the main flow, paste-chat for everyone else.
          </p>

          <div className="mt-6 lg:mt-8 grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 lg:p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F6F0]">
                  <item.icon className="h-5 w-5 text-[#05A660]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm lg:text-base text-[#1E293B]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs lg:text-sm leading-relaxed text-[#475569]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
            Who it's for
          </h2>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Every Malaysian SMB that takes orders on WhatsApp.
          </p>

          <div className="mt-6 lg:mt-8 grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
            {targetUsers.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F6F0]">
                  <item.icon className="h-4 w-4 text-[#05A660]" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-[#1E293B]">{item.label}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-[#475569]">
            If you're still recording orders from chat threads one at a time — Tokoflow is for you.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-8 shadow-sm">
              <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
                Commitment
              </h2>
              <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
                Every person who works hard deserves for their work to be visible and recorded. Tokoflow sits on the seller's side: 0% commission, you own your customer data, pricing that fits a small business — not 20-30% of your hard work.
              </p>
              <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
                Not complicated software. Tokoflow follows the way you already work on WhatsApp, then makes the results tidier — so your effort isn't just &ldquo;sales,&rdquo; it's recorded, managed, and visible.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
              From selling to a real business
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-base text-[#475569]">
              Free 50 orders/month — forever. No commission. Customers stay yours.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-[#05A660] text-white hover:bg-[#048C51]" asChild>
                <Link href="/login">
                  Start free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold border-[#E2E8F0] text-[#1E293B] hover:bg-[#E8F6F0] hover:border-[#05A660]/30" asChild>
                <Link href="/contact">
                  Contact us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
