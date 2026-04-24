import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  BarChart3,
  Receipt,
  MessageSquare,
  LinkIcon,
  Mic,
  ClipboardPaste,
  Camera,
  Users,
  Package,
  CalendarClock,
  FileBarChart,
  QrCode,
  Bell,
  ClipboardList,
  Gauge,
  Calculator,
  ImageIcon,
  Download,
  WifiOff,
  UtensilsCrossed,
  FileCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features — LHDN-Ready WhatsApp Storefront | Tokoflow",
  description:
    "Share a store link, take orders via WhatsApp, submit LHDN MyInvois e-Invoices in one tap — everything a Malaysian small business needs.",
  alternates: {
    canonical: "https://tokoflow.com/features",
  },
};

type Feature = { icon: LucideIcon; title: string; desc: string };

const sections: { label: string; features: Feature[] }[] = [
  {
    label: "Take orders",
    features: [
      { icon: LinkIcon, title: "Store link", desc: "Share your link, customers order themselves, everything lands in your dashboard." },
      { icon: ClipboardPaste, title: "Paste WhatsApp chat", desc: "Paste a WhatsApp thread — AI turns it into a clean order." },
      { icon: Mic, title: "Voice to order", desc: "Speak the order — AI transcribes items and quantities." },
      { icon: Camera, title: "Screenshot to order", desc: "Snap a photo of a WhatsApp chat — AI reads and structures it." },
    ],
  },
  {
    label: "Manage & fulfil",
    features: [
      { icon: Package, title: "Product list", desc: "Set up once — your products appear on the store link and order form." },
      { icon: ShoppingBag, title: "Order status", desc: "Swipe the card to advance: New → Processing → Shipped → Completed." },
      { icon: ShoppingBag, title: "Payment tracking", desc: "Mark orders Paid, Partial, or Unpaid." },
      { icon: CalendarClock, title: "Pre-order mode", desc: "Customers order ahead, ready on the chosen date. Ideal for catering, custom cakes, apparel." },
      { icon: UtensilsCrossed, title: "Subscription mode", desc: "Recurring customers who pay on account. Ideal for wholesale, supply, standing orders." },
      { icon: Gauge, title: "Daily capacity + rest mode", desc: "Cap orders per day. When full, the form auto-closes — the system keeps you from overworking." },
      { icon: CalendarClock, title: "Delivery scheduling", desc: "Set ship dates, see what needs to be prepared today." },
      { icon: ImageIcon, title: "Reference photos", desc: "Attach design or reference photos to orders. Max 3 per order." },
      { icon: QrCode, title: "DuitNow QR payment", desc: "Upload your DuitNow QR — customers pay right after ordering." },
      { icon: MessageSquare, title: "One-tap WhatsApp", desc: "Confirmation, reminders, receipts — one tap to your customer's WhatsApp." },
      { icon: Receipt, title: "Digital receipts", desc: "Generate a receipt, send to WhatsApp. No printer required." },
      { icon: Bell, title: "Payment reminders", desc: "Unpaid? Send a reminder directly via WhatsApp." },
    ],
  },
  {
    label: "Compliance & invoicing (Pro)",
    features: [
      { icon: FileCheck, title: "LHDN MyInvois submit", desc: "One-tap submit to MyInvois with UBL 2.1 JSON. Validated UUID + Long ID stored on the invoice." },
      { icon: Calculator, title: "SST calculation", desc: "0% or 6% — pick per invoice or set a merchant default. Mirrored to legacy columns during migration." },
      { icon: FileCheck, title: "> RM 10,000 flag", desc: "Invoices at or above RM 10,000 with no buyer TIN are flagged for individual submission (LHDN rule, 1 Jan 2026)." },
      { icon: Receipt, title: "Invoice PDF", desc: "Branded A4 PDF with MyInvois UUID + Long ID reference printed on the receipt." },
    ],
  },
  {
    label: "Insights & recap",
    features: [
      { icon: Users, title: "Customer directory", desc: "Auto-built from orders. See history, lifetime spend, filter unpaid." },
      { icon: ClipboardList, title: "Prep list", desc: "Daily totals by product — generated from incoming orders. Send to WhatsApp." },
      { icon: Calculator, title: "Cost & profit", desc: "Enter COGS per item, see margin and profit per product in the recap." },
      { icon: BarChart3, title: "Store visits", desc: "See how many people opened your store link, from where, and when it peaks." },
      { icon: BarChart3, title: "Daily recap", desc: "Orders, revenue, visitors, and top products for the day." },
      { icon: FileBarChart, title: "Monthly report", desc: "Revenue, top customers, best-sellers, visit patterns — export to Excel." },
      { icon: Download, title: "Excel export", desc: "Export all orders, recap, or prep lists as Excel files." },
      { icon: BarChart3, title: "AI insights", desc: "Plain-English recommendations from your order trends and store visits." },
      { icon: WifiOff, title: "Offline mode", desc: "Lost connection? Orders still get logged, sync automatically when back online." },
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
            Everything you need to run your business
          </h1>
          <p className="mt-3 text-muted-foreground lg:text-lg">
            Take orders, get paid, stay LHDN-compliant — no commission, customers stay yours.
          </p>
        </div>
      </section>

      {/* Feature Sections */}
      {sections.map((section, i) => (
        <section key={section.label} className={`py-12 lg:py-14 ${i > 0 ? "border-t" : ""}`}>
          <div className="max-w-2xl mx-auto px-4">
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-6">
              {section.label}
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
            From selling to a real business. Free to start.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            50 orders/month free — forever. No commission. Customers stay yours.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-[#05A660] text-white hover:bg-[#05A660]/90"
              asChild
            >
              <Link href="/login">
                Start now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
