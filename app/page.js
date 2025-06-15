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
import { testimonials, blogPosts, WHATSAPP_LINK, faqs } from "./page_data";

// SEO Metadata
export const metadata = {
  title: "Sistem Inventory & Penjualan Real-time | Dashboard Analytics - Tokoflow",
  description: "Platform manajemen inventory dan penjualan untuk UMKM & online shop. Multi-channel marketplace, laporan profit otomatis, stok real-time. Free trial 14 hari!",
  keywords: "sistem inventory, manajemen stok, dashboard penjualan, multi-channel selling, laporan profit, UMKM software",
  openGraph: {
    title: "Tokoflow - Sistem Inventory & Penjualan Terintegrasi",
    description: "Kelola inventory dan penjualan multi-channel dengan mudah. Dashboard real-time, laporan profit otomatis, integrasi marketplace.",
    type: "website",
    locale: "id_ID",
    url: "https://www.tokoflow.com",
    siteName: "Tokoflow",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tokoflow - Dashboard Inventory & Sales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokoflow - Sistem Inventory & Penjualan",
    description: "Platform manajemen inventory dan penjualan untuk UMKM & online shop.",
    images: ["/og-image.jpg"],
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
    pricing: "Mulai 299rb/bln",
    description:
      "Kelola stok multi-SKU dengan tracking real-time, alert stok minimum, dan manajemen bundle/paket produk.",
    features: [
      "Real-time Stock Tracking",
      "Multi-warehouse Support",
      "Stock Alert & Notification",
      "Bundle Product Management",
      "Barcode Scanner (Mobile App)",
    ],
    highlight: "Cocok untuk: UMKM dengan 100-1000 SKU",
  },
  {
    icon: ShoppingCart,
    title: "Multi-channel Sales",
    pricing: "Mulai 599rb/bln",
    description:
      "Sinkronisasi penjualan dari Shopee, Tokopedia, TikTok Shop dalam satu dashboard. Fee otomatis terhitung.",
    features: [
      "Marketplace Integration",
      "Centralized Order Management",
      "Auto Fee Calculation",
      "Channel Performance Analytics",
      "Stock Sync Across Channels",
    ],
    highlight: "Cocok untuk: Online shop multi-channel",
  },
  {
    icon: BarChart2,
    title: "Business Intelligence",
    pricing: "Custom Pricing",
    description:
      "Analytics mendalam dengan profit calculation, sales forecast, dan business insights untuk growth optimal.",
    features: [
      "Real-time Profit Dashboard",
      "Sales Trend Analysis",
      "Product Performance Report",
      "Customer Behavior Analytics",
      "Predictive Inventory Planning",
    ],
    highlight: "Cocok untuk: Bisnis dengan omzet 50jt+/bulan",
  },
];

const whyChooseUs = [
  {
    icon: Users,
    title: "Support Lokal",
    desc: "Tim Indonesia yang paham konteks bisnis lokal, siap bantu via WhatsApp",
  },
  {
    icon: Zap,
    title: "Setup Cepat",
    desc: "Running dalam 1 hari dengan data import otomatis dan template siap pakai",
  },
  {
    icon: Shield,
    title: "Data Aman",
    desc: "Backup otomatis tiap jam di Google Cloud dengan enkripsi enterprise",
  },
  {
    icon: Award,
    title: "Proven System",
    desc: "Dipercaya 500+ UMKM dengan total GMV 10+ miliar per bulan",
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
    title: "Google Sheets Based",
    desc: "Familiar interface yang mudah dipelajari, powerful automation di belakangnya",
    icon: Code,
  },
  {
    title: "Mobile Optimized",
    desc: "Akses dari mana saja: cek stok, input penjualan, lihat report dari HP",
    icon: Zap,
  },
  {
    title: "API Integration",
    desc: "Connect dengan marketplace, payment gateway, shipping, dan tools lain",
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
                    FREE TRIAL 14 HARI
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
                        Start Free Trial
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
                      src="/images/dashboard-hero.png"
                      alt="Tokoflow - Dashboard Inventory & Sales Management"
                      width={1920}
                      height={1080}
                      priority
                      quality={85}
                      className="absolute inset-0 w-full h-full object-cover"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
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
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">UMKM Pengguna</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">10M+</div>
                  <div className="text-sm text-gray-600">Transaksi/Bulan</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime System</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Support Team</div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  IMPACT METRICS
                </Badge>
                <H2 className="text-white mb-4">
                  Hasil Nyata untuk Bisnis Anda
                </H2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">40%</div>
                  <div className="text-lg font-medium text-white/90 mb-1">Peningkatan Sales</div>
                  <p className="text-sm text-white/70">Average dalam 6 bulan pertama karena stok selalu tersedia</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">70%</div>
                  <div className="text-lg font-medium text-white/90 mb-1">Hemat Waktu Admin</div>
                  <p className="text-sm text-white/70">Automasi report dan sync data cross-channel</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">95%</div>
                  <div className="text-lg font-medium text-white/90 mb-1">Akurasi Stok</div>
                  <p className="text-sm text-white/70">Real-time update mencegah overselling</p>
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
                Success Stories dari User Tokoflow
              </H2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((t, index) => (
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
                  NO CREDIT CARD REQUIRED
                </Badge>
                <H2 className="text-white mb-4">
                  Siap Scale Up Bisnis Anda?
                </H2>
                <P className="text-white/70 max-w-xl mx-auto mb-8">
                  Join 500+ UMKM yang sudah meningkatkan efisiensi operasional dengan Tokoflow. 
                  Free trial 14 hari tanpa perlu kartu kredit. Setup cepat, training included.
                </P>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="outline" size="lg" asChild className="bg-white text-gray-900 border-white hover:bg-gray-100">
                  <Link href="/register" className="inline-flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Start Free Trial
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
