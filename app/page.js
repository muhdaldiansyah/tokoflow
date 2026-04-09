// app/page.js
import React from "react";
import Link from "next/link";
import Image from "next/image";

// Components
import PublicNav from "./components/PublicNav";
import Footer from "./components/Footer";

// UI Components
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, H1, H2, H3, P, Lead } from "./components/ui";

// Icons - Import only what's needed
import {
  MessageCircle,
  ChevronRight,
  Phone,
  CheckCircle,
  Shield,
  Users,
  Zap,
  Database,
  Layers,
  Target,
  Award,
  Code,
  BarChart2,
  Globe,
  Package,
  ShoppingCart,
  TrendingUp,
  Calculator,
  RefreshCw,
} from "lucide-react";

// Data
import { useCases, blogPosts, WHATSAPP_LINK, faqs } from "./page_data";

// SEO Metadata
export const metadata = {
  title: "Sistem Inventory & Penjualan Real-time | Dashboard Analytics - Tokoflow",
  description: "Platform manajemen inventory dan penjualan untuk UMKM & online shop. Catat penjualan multi-channel, hitung profit otomatis per transaksi, pantau stok real-time. Sedang dalam program Early Access.",
  keywords: "sistem inventory, manajemen stok, dashboard penjualan, multi-channel selling, laporan profit, UMKM software",
  openGraph: {
    title: "Tokoflow - Sistem Inventory & Penjualan Terintegrasi",
    description: "Kelola inventory dan catat penjualan multi-channel dalam satu dashboard. Profit calculator otomatis. Sedang dalam program Early Access.",
    type: "website",
    locale: "id_ID",
    url: "https://www.tokoflow.com",
    siteName: "Tokoflow",
    images: [
      {
        url: "/images/hero.PNG",
        width: 1200,
        height: 630,
        alt: "Tokoflow - Dashboard Inventory & Sales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokoflow - Sistem Inventory & Penjualan",
    description: "Platform manajemen inventory dan penjualan untuk UMKM & online shop. Sedang dalam program Early Access.",
    images: ["/images/hero.PNG"],
  },
  alternates: {
    canonical: "https://www.tokoflow.com",
  },
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
};

// Section Heading Component using UI Typography
function SectionHeading({ pill, title, description }) {
  return (
    <div className="text-center mb-10">
      {pill && (
        <Badge variant="secondary" className="mb-3">
          {pill}
        </Badge>
      )}
      <H2 className="mb-3">{title}</H2>
      {description && (
        <P className="max-w-2xl mx-auto">
          {description}
        </P>
      )}
    </div>
  );
}

// Static data
const mainServices = [
  {
    icon: Package,
    title: "Inventory Management",
    pricing: "Early Access",
    description:
      "Kelola stok multi-SKU + multi-warehouse dengan tracking real-time, alert otomatis stok menipis, dan bundle produk.",
    features: [
      "Real-time stock tracking",
      "Multi-warehouse / cabang",
      "Stock alert otomatis dengan threshold per produk",
      "Incoming goods + stock adjustment audit trail",
      "Bundle product (komponen auto-deduct)",
      "Barcode scanner via kamera HP",
    ],
    highlight: "Cocok untuk: UMKM dengan 100-1000+ SKU",
  },
  {
    icon: ShoppingCart,
    title: "Multi-channel Sales",
    pricing: "Early Access",
    description:
      "Catat penjualan dari Shopee, Tokopedia, TikTok Shop dalam satu dashboard. Fee per channel otomatis terhitung.",
    features: [
      "Auto fee calculation per channel",
      "Channel performance analytics",
      "Per-transaction profit tracking",
      "Sales history dengan filter date / channel / SKU / customer",
      "CSV export untuk rekonsiliasi",
      "Marketplace API sync (scaffolding siap, tinggal plug credentials)",
    ],
    highlight: "Cocok untuk: Online shop multi-channel",
  },
  {
    icon: BarChart2,
    title: "Profit Analytics",
    pricing: "Early Access",
    description:
      "Hitung profit bersih otomatis dengan detail: modal, packing, fee marketplace, dan affiliate per transaksi.",
    features: [
      "Real-time profit dashboard",
      "Cost breakdown per SKU",
      "Channel margin comparison",
      "Top produk + top customers ranking",
      "Group sales by channel / produk / tanggal",
      "Per-customer lifetime value tracking",
    ],
    highlight: "Cocok untuk: Bisnis yang mau tahu profit sebenarnya",
  },
  {
    icon: Users,
    title: "Customer & Team",
    pricing: "Early Access",
    description:
      "Direktori customer dengan lifetime stats. Multi-user dengan role owner / staff yang gating data sensitif.",
    features: [
      "Customer directory dengan total orders + total spent",
      "Per-customer sales history drill-down",
      "Top customers card di dashboard",
      "RBAC: owner (full access) vs staff (operasional)",
      "Cost data + delete actions terbatas owner",
      "User management page untuk promote / demote",
    ],
    highlight: "Cocok untuk: Toko dengan 2+ orang tim",
  },
];

const whyChooseUs = [
  {
    icon: Users,
    title: "Direct Developer Support",
    desc: "Komunikasi langsung dengan developer via WhatsApp — bukan bot, bukan CS scripted",
  },
  {
    icon: Zap,
    title: "Setup Cepat",
    desc: "Running dalam 1 hari. Import data produk, konfigurasi biaya, langsung pakai",
  },
  {
    icon: Shield,
    title: "Data Aman",
    desc: "Cloud infrastructure dengan enkripsi standar industri dan backup otomatis",
  },
  {
    icon: Award,
    title: "Early Access Program",
    desc: "Bergabung dengan merchant pertama yang membentuk Tokoflow. Harga spesial selamanya",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Free Consultation",
    description: "Analisis flow bisnis Anda dan demo sistem sesuai kebutuhan",
  },
  {
    number: "02",
    title: "Data Migration",
    description: "Import data SKU, stok awal, dan setup integrasi marketplace",
  },
  {
    number: "03",
    title: "Training & Setup",
    description: "Training online untuk tim dan konfigurasi workflow bisnis",
  },
  {
    number: "04",
    title: "Go Live Support",
    description: "Pendampingan 30 hari pertama untuk ensure smooth operation",
  },
];

const platformFeatures = [
  {
    title: "Installable PWA",
    desc: "Buka di browser HP, tap 'Add to Home Screen' — Tokoflow jadi app icon di home screen tanpa perlu install dari Play Store. Service worker bikin halaman cached load instan walau koneksi lemot.",
    icon: Zap,
  },
  {
    title: "Barcode Scanner Built-in",
    desc: "Scan barcode produk pakai kamera HP langsung dari halaman /scanner. Auto-lookup SKU di inventory, lalu langsung ke form input penjualan atau edit produk.",
    icon: Code,
  },
  {
    title: "Stock Alert Real-time",
    desc: "Bell icon di nav langsung kasih tau begitu ada produk yang stok-nya turun di bawah threshold per produk. Auto-resolve saat stok kembali normal — tanpa cron, tanpa email setup.",
    icon: Globe,
  },
];

export default function LandingPage() {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-white text-gray-700">
        <PublicNav />
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative pt-28 md:pt-32 pb-16 md:pb-20 overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 lg:gap-x-16 gap-y-12 items-center">
                <div>
                  <Badge variant="secondary" className="mb-4">
                    EARLY ACCESS PROGRAM
                  </Badge>
                  <H1 className="mb-6">
                    Kelola Inventory & Penjualan dengan Mudah
                  </H1>
                  <Lead className="mb-8">
                    Platform all-in-one untuk UMKM dan online shop. Real-time inventory tracking, 
                    multi-channel sales dashboard, dan profit analytics. Dari 10 SKU hingga 10,000 SKU, 
                    scale dengan percaya diri.
                  </Lead>
                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <Button asChild>
                      <Link
                        href="/register"
                        className="inline-flex items-center"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Daftar Early Access
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Demo via WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-lg image-container">
                    <Image
                      src="/images/hero.PNG"
                      alt="Tokoflow - Dashboard Inventory & Sales Management"
                      width={1920}
                      height={1080}
                      priority
                      quality={85}
                      className="absolute inset-0 w-full h-full object-cover"
                      
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Dashboard real-time untuk monitoring inventory dan penjualan multi-channel
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Trust Bar Section */}
          <section className="bg-gray-50 py-8 border-y border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">Early Access</div>
                  <div className="text-sm text-gray-600">Program Aktif</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">Real-time</div>
                  <div className="text-sm text-gray-600">Profit Tracking</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">Multi-channel</div>
                  <div className="text-sm text-gray-600">Fee Otomatis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">Direct</div>
                  <div className="text-sm text-gray-600">Developer Support</div>
                </div>
              </div>
            </div>
          </section>

          {/* Main Services Section */}
          <section className="bg-white py-16 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHeading
                pill="SOLUSI LENGKAP"
                title="All-in-One Platform untuk Bisnis Anda"
                description="Dari inventory management hingga business intelligence, semua fitur yang Anda butuhkan untuk grow your business ada dalam satu platform"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mainServices.map((service, index) => {
                  const Icon = service.icon;
                  return (
                    <Card key={service.title} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {service.pricing && (
                          <Badge variant="outline" className="text-gray-900 border-gray-900">
                            {service.pricing}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mb-3">
                        {service.title}
                      </CardTitle>
                      <CardDescription className="mb-4">{service.description}</CardDescription>

                      <div className="space-y-2 mb-4">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 italic">{service.highlight}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Key Metrics Section */}
          <section className="bg-gray-900 text-white py-16 md:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-10">
                <Badge variant="secondary" className="mb-3 bg-white/10 text-white border-0">
                  KENAPA TOKOFLOW
                </Badge>
                <H2 className="text-white mb-4">
                  Dirancang untuk Menyelesaikan Masalah Nyata
                </H2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">Profit Jelas</div>
                  <div className="text-lg font-medium text-white/90 mb-1">Cost Breakdown Otomatis</div>
                  <p className="text-sm text-white/70">Modal, packing, fee marketplace, affiliate — semua terhitung per transaksi</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">Hemat Waktu</div>
                  <div className="text-lg font-medium text-white/90 mb-1">Tidak Perlu Rekap Manual</div>
                  <p className="text-sm text-white/70">Setiap penjualan otomatis tercatat lengkap dengan profit bersih</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">Stok Akurat</div>
                  <div className="text-lg font-medium text-white/90 mb-1">Real-time Inventory Update</div>
                  <p className="text-sm text-white/70">Setiap transaksi dan barang masuk langsung update stok otomatis</p>
                </div>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section className="bg-white py-16 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHeading
                pill="GETTING STARTED"
                title="Running dalam 24 Jam"
                description="Proses setup yang simple dan cepat, dengan full support dari tim kami"
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {processSteps.map((step, index) => (
                  <div
                    key={step.number}
                    className="text-center"
                  >
                    <div className="text-4xl font-light text-gray-300 mb-3">
                      {step.number}
                    </div>
                    <H3 className="mb-2">{step.title}</H3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="bg-white py-16 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHeading
                pill="KENAPA TOKOFLOW"
                title="Platform Terpercaya untuk UMKM Indonesia"
                description="Dibangun khusus untuk kebutuhan bisnis lokal dengan teknologi global"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {whyChooseUs.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-gray-700" />
                      </div>
                      <h3 className="font-medium text-black mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="bg-white py-16 md:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <H2 className="text-center mb-10">
                Bagaimana Tokoflow Membantu Bisnis Anda
              </H2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {useCases.map((t, index) => (
                  <Card key={t.initials} className="p-6 flex flex-col h-full">
                    <MessageCircle className="w-5 h-5 text-gray-300 mb-4 opacity-70" />
                    {/* Result-focused headline */}
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 leading-tight">
                      "{t.headline}"
                    </h4>
                    <blockquote className="text-sm text-gray-600 flex-grow leading-relaxed mb-4">
                      "{t.quote}"
                    </blockquote>
                    <figcaption className="pt-4 flex items-center border-t border-gray-200 mt-auto">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center mr-3 text-xs font-medium bg-gray-900 text-white">
                        {t.initials}
                      </span>
                      <div>
                        <p className="font-medium text-black text-sm">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.role}</p>
                      </div>
                    </figcaption>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Platform Features */}
          <section className="bg-white py-16 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <SectionHeading
                pill="TECHNOLOGY"
                title="Built for Performance & Reliability"
                description="Teknologi terkini untuk memastikan bisnis Anda berjalan lancar 24/7"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {platformFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="text-center"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <h3 className="font-medium text-black mb-1 text-sm">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-600">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-8">
                <Button variant="link" asChild className="text-sm">
                  <Link href="/panduan">
                    Lihat dokumentasi lengkap
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-white py-16 md:py-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-10">
                <Badge variant="secondary" className="mb-3">
                  FAQ
                </Badge>
                <H2 className="mb-3">
                  Pertanyaan Seputar Tokoflow
                </H2>
              </div>
              <div className="space-y-6">
                {faqs.slice(0, 5).map((faq, index) => (
                  <Card key={index} className="overflow-hidden">
                    <details className="group">
                      <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                        <h3 className="text-base font-medium text-black pr-4">{faq.question}</h3>
                        <div className="text-gray-400 group-open:rotate-180 flex-shrink-0 transition-transform">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </summary>
                      <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    </details>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="bg-gray-900 text-white py-16 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
              <div>
                <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-0">
                  GRATIS SELAMA EARLY ACCESS
                </Badge>
                <H2 className="text-white mb-4">
                  Siap Scale Up Bisnis Anda?
                </H2>
                <P className="text-white/70 max-w-xl mx-auto mb-8">
                  Bergabung dengan program Early Access Tokoflow. Gratis selama program berjalan,
                  tanpa kartu kredit. Setup cepat, direct developer support via WhatsApp.
                </P>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="outline" size="lg" asChild className="bg-white text-gray-900 border-white hover:bg-gray-100">
                  <Link href="/register" className="inline-flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Daftar Early Access
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" asChild className="bg-white/10 text-white hover:bg-white/20">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat Sales Team
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
