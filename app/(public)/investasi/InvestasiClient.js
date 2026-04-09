// app/investasi/InvestasiClient.js 
"use client";

import React from 'react';
import Link from 'next/link';
import PublicNav from '../../components/PublicNav';
import Footer from '../../components/Footer';

// UI Components
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, H1, H2, H3, P, Lead } from '../../components/ui';

import { 
  Check, 
  CreditCard,
  Phone, 
  Package,
  ShoppingCart,
  BarChart2,
  Users,
  Zap,
  Shield,
  HeadphonesIcon,
  ChevronRight,
  TrendingUp,
  Award,
  Calculator,
  MessageSquare,
  Star,
  CheckCircle,
  Database,
  Smartphone,
  RefreshCw,
  Globe,
} from 'lucide-react';

// Import WhatsApp Link
import { WHATSAPP_LINK } from '../../page_data';

// Pricing Tiers for Tokoflow
// Tokoflow is currently in Early Access — there is no public pricing yet.
// This file presents 3 angles on the same offering rather than fictional tiers.
const pricingTiers = [
  {
    name: 'Early Access',
    price: 'Gratis',
    period: 'selama program',
    description: 'Untuk merchant pertama yang membentuk Tokoflow bersama kami',
    features: [
      'Inventory + multi-warehouse tracking real-time',
      'Multi-channel sales tracking (Shopee, Tokopedia, TikTok Shop, offline)',
      'Profit calculator otomatis per transaksi (modal + packing + fee + affiliate)',
      'Marketplace fee config per channel',
      'Bundle / product composition (komponen auto-deduct)',
      'Stock adjustments dengan audit trail',
      'Stock alert in-app dengan threshold per produk',
      'Customer directory + per-customer lifetime stats',
      'Sales history dengan filter date / channel / SKU / customer',
      'CSV export sales transactions',
      'RBAC: owner + staff (multi-user dengan role)',
      'PWA installable + barcode scanner via kamera HP',
      'Direct developer support via WhatsApp'
    ],
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    buttonColor: 'bg-gray-900 hover:bg-black text-white',
    ctaText: 'Daftar Early Access',
    highlighted: true,
  },
  {
    name: 'Pasca Early Access',
    price: 'TBA',
    period: '',
    description: 'Setelah program Early Access berakhir',
    features: [
      'Pricing publik akan diumumkan setelah program EA berakhir',
      'Early adopter akan mendapat harga spesial yang di-lock selamanya',
      'Tidak ada penalty atau biaya transisi',
      'Semua fitur Early Access tetap tersedia',
      'Plus fitur baru yang sedang dikembangkan',
      'Roadmap fitur dishare ke early adopter'
    ],
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    buttonColor: 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300',
    ctaText: 'Daftar Early Access',
    highlighted: false,
  },
  {
    name: 'Custom',
    price: 'Hubungi',
    period: 'kami',
    description: 'Kebutuhan spesifik di luar fitur standard',
    features: [
      'Custom development sesuai kebutuhan',
      'Konsultasi langsung dengan developer',
      'Integrasi dengan sistem existing',
      'Migration data dari sistem lama',
      'Scope dan harga didiskusikan per project'
    ],
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    buttonColor: 'bg-gray-900 hover:bg-black text-white',
    ctaText: 'Contact Sales',
    highlighted: false,
  }
];

// Case Studies with ROI - Inventory/Sales Focus
const caseStudies = [
  {
    client: 'Skenario: Toko Retail Multi-channel',
    industry: 'Retail / E-commerce',
    headline: 'Dari spreadsheet ke dashboard profit otomatis',
    before: 'Rekap manual di Excel, fee marketplace dihitung satu per satu, tidak tahu profit sebenarnya',
    after: 'Setiap transaksi otomatis terhitung: modal + packing + fee + affiliate = net profit',
    results: [
      'Profit per produk per channel terlihat jelas',
      'Fee marketplace otomatis terhitung',
      'Stok update real-time setiap transaksi',
      'Export CSV untuk rekonsiliasi'
    ],
    investment: 'Early Access',
    roi: 'Tahu profit sebenarnya dari hari pertama'
  },
  {
    client: 'Skenario: Online Shop dengan Produk Bundle',
    industry: 'Fashion / Consumer Goods',
    headline: 'Kelola bundle & komponen tanpa ribet',
    before: 'Jual paket produk tapi stok komponen dihitung manual, sering salah',
    after: 'Bundle terjual → stok semua komponen otomatis berkurang',
    results: [
      'Product composition otomatis',
      'Stok komponen selalu akurat',
      'Cost breakdown per bundle lengkap',
      'Incoming goods tracking terpusat'
    ],
    investment: 'Early Access',
    roi: 'Eliminasi kesalahan stok manual'
  }
];

// What's Included & Not Included
const inclusionDetails = {
  included: [
    'Setup awal & data migration dari Excel/CSV',
    'Walkthrough penggunaan via WhatsApp',
    'Inventory & sales engine lengkap',
    'Profit calculator otomatis per transaksi',
    'Multi-channel sales tracking (manual entry per channel)',
    'Update fitur reguler berdasarkan feedback',
    'Direct developer support via WhatsApp',
    'Backup otomatis (Supabase managed)'
  ],
  notIncluded: [
    'Marketplace API auto-sync (sedang dikembangkan)',
    'Mobile app native dengan barcode scanner (sedang dikembangkan)',
    'Multi-warehouse / multi-lokasi (sedang dikembangkan)',
    'Role-based access untuk multi-user (sedang dikembangkan)',
    'Custom development di luar fitur standard',
    'Integrasi ERP / sistem legacy'
  ]
};

// FAQ Data - Tokoflow Focus
const pricingFAQ = [
  {
    question: 'Berapa biaya Tokoflow saat ini?',
    answer: 'Tokoflow saat ini dalam program Early Access — gratis selama program berjalan untuk merchant pertama yang mau membentuk produk ini bersama kami. Pricing publik akan diumumkan setelah program EA berakhir, dan early adopter akan mendapat harga spesial yang di-lock selamanya.'
  },
  {
    question: 'Apakah ada biaya setup atau hidden cost?',
    answer: 'Tidak ada biaya setup atau hidden cost selama Early Access. Software, hosting, support, dan update semuanya included. Yang tidak termasuk hanya custom development di luar fitur standard dan integrasi dengan sistem legacy yang kompleks.'
  },
  {
    question: 'Bagaimana dengan data migration dari sistem lama?',
    answer: 'Migration data dari format standard (Excel, CSV) gratis. Kami bantu import data SKU dan stok awal. Untuk migration dari software khusus mungkin ada effort tambahan tergantung kompleksitas — kita diskusikan langsung via WhatsApp.'
  },
  {
    question: 'Bagaimana cara mulai pakai Tokoflow?',
    answer: 'Daftar Early Access via halaman register, lalu hubungi kami via WhatsApp untuk onboarding. Tidak perlu kartu kredit. Anda bisa mulai pakai dengan data real Anda, kami bantu setup dan training tim langsung dari developer.'
  },
  {
    question: 'Setelah Early Access selesai, gimana?',
    answer: 'Early adopter akan diberi notifikasi paling awal sebelum pricing publik diumumkan, dan akan mendapat harga spesial yang di-lock selamanya. Tidak ada penalty atau biaya transisi. Data Anda tetap aman dan tidak ada vendor lock-in.'
  },
  {
    question: 'Bagaimana jika butuh fitur yang belum ada?',
    answer: 'Kami update fitur secara reguler berdasarkan feedback user Early Access. Roadmap fitur dishare ke early adopter — Anda bisa influence apa yang dibangun duluan. Untuk kebutuhan sangat spesifik, tersedia custom development dengan scope dan harga didiskusikan per project.'
  },
  {
    question: 'Apakah data saya aman di Tokoflow?',
    answer: 'Data di-encrypt, backup otomatis (Supabase managed), dan Anda bisa export semua data kapan saja — no vendor lock-in. Akses terlindungi dengan autentikasi per user.'
  },
  {
    question: 'Support seperti apa yang didapatkan?',
    answer: 'Selama Early Access semua user mendapat direct developer support via WhatsApp — bukan bot, bukan CS scripted. Anda bisa langsung diskusi dengan orang yang membangun Tokoflow.'
  }
];

// Feature comparison data
// Tokoflow is in Early Access — there's only one offering. Each feature is
// either available now (true), planned (string), or not in scope yet (false).
// The table renderer below was originally tier-based; we render the same
// rows but the "Starter / Professional / Enterprise" columns now read as
// "Tersedia Sekarang / Sedang Dikembangkan / Belum Ada".
const featureComparison = [
  // INVENTORY
  { feature: 'Inventory tracking real-time',                  starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Multi-warehouse / cabang',                       starter: true,  professional: 'Sudah jalan (1 produk = 1 warehouse)', enterprise: '—' },
  { feature: 'Stock alert dengan threshold per produk',        starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Stock alert notification (in-app bell)',         starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Product compositions / bundle',                  starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Stock adjustments + audit trail',                starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Incoming goods tracking',                        starter: true,  professional: 'Sudah jalan', enterprise: '—' },

  // SALES & PROFIT
  { feature: 'Sales input multi-channel',                      starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Profit calculator per transaksi (full breakdown)', starter: true, professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Marketplace fee config per channel',             starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Sales history filter (date/channel/SKU/customer)', starter: true, professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Group sales by channel / produk / tanggal',      starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'CSV export sales',                                starter: true,  professional: 'Sudah jalan', enterprise: '—' },

  // CUSTOMER
  { feature: 'Customer directory + lifetime stats',            starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Per-customer sales history drill-down',          starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Top customers card di dashboard',                starter: true,  professional: 'Sudah jalan', enterprise: '—' },

  // MULTI-USER
  { feature: 'RBAC owner / staff',                              starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'User management (promote / demote)',             starter: true,  professional: 'Sudah jalan', enterprise: '—' },

  // MOBILE / PWA
  { feature: 'PWA installable (Add to Home Screen)',           starter: true,  professional: 'Sudah jalan', enterprise: '—' },
  { feature: 'Barcode scanner via kamera HP',                  starter: true,  professional: 'Sudah jalan (Chrome / Edge / Samsung Internet)', enterprise: '—' },

  // SCAFFOLDED / PIPELINE
  { feature: 'Marketplace API auto-sync (Shopee/Tokopedia/TikTok)', starter: false, professional: 'Scaffolded — butuh OAuth credentials', enterprise: '—' },
  { feature: 'Email / WhatsApp alert delivery',                starter: false, professional: 'Pipeline — butuh SMTP/WA provider', enterprise: '—' },
  { feature: 'Per-warehouse stock per produk (1 SKU, multi lokasi)', starter: false, professional: 'Pipeline (Tier 4)', enterprise: '—' },
  { feature: 'Payment / Midtrans subscription',                 starter: false, professional: 'Pipeline — feature-flagged off', enterprise: '—' },
  { feature: 'Multi-tenancy (multiple merchants per install)', starter: false, professional: 'Pipeline (Tier 4)', enterprise: '—' },
];

// Main Page Component
export default function InvestasiClient() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-700 overflow-x-hidden">
      <PublicNav />

      <main className="flex-grow pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <Badge variant="success" className="mb-3">
              EARLY ACCESS
            </Badge>
            <H1 className="mb-4">
              Harga Spesial untuk Early Adopters
            </H1>
            <Lead className="max-w-3xl mx-auto">
              Bergabung sekarang dan dapatkan harga early adopter yang di-lock selamanya.
              Tanpa biaya setup, tanpa hidden cost. Hubungi kami untuk detail.
            </Lead>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <Card 
                  key={tier.name} 
                  className={`p-6 flex flex-col ${tier.highlighted ? 'ring-2 ring-gray-900 shadow-xl' : ''} ${tier.bgColor}`}
                >
                  {tier.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white">
                      MOST POPULAR
                    </Badge>
                  )}
                  
                  <div className="text-center mb-6">
                    <H3 className={`mb-2 ${tier.textColor || ''}`}>{tier.name}</H3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-3xl font-bold ${tier.textColor || 'text-gray-900'}`}>
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className={`text-sm ${tier.textColor ? 'text-white/70' : 'text-gray-500'}`}>
                          {tier.period}
                        </span>
                      )}
                    </div>
                    {/* Annual savings hint removed — Tokoflow is in Early Access, no billing cycle yet. */}
                  </div>

                  <P className={`mb-6 text-sm text-center ${tier.textColor ? 'text-white/80' : ''}`}>
                    {tier.description}
                  </P>

                  <div className="mb-6 flex-grow">
                    <div className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start text-sm">
                          <CheckCircle className={`w-4 h-4 mr-3 flex-shrink-0 mt-0.5 ${
                            tier.textColor ? 'text-white' : 'text-green-500'
                          }`} />
                          <span className={tier.textColor ? 'text-white/90' : 'text-gray-700'}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Button 
                      asChild 
                      className={`w-full ${tier.buttonColor}`}
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      {tier.ctaText === 'Contact Sales' ? (
                        <a
                          href={WHATSAPP_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center"
                        >
                          {tier.ctaText}
                        </a>
                      ) : (
                        <Link href="/register" className="inline-flex items-center justify-center">
                          {tier.ctaText}
                        </Link>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>No Setup Fee</span>
              </div>
              <div className="flex items-center gap-2">
                <HeadphonesIcon className="w-4 h-4" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <H2 className="mb-3">Compare Plans</H2>
              <P>Lihat detail fitur setiap paket</P>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Fitur</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Tersedia Sekarang</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {featureComparison.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.feature}</td>
                      <td className="px-6 py-4 text-center">
                        {typeof item.starter === 'boolean' ? (
                          item.starter ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-600">{item.starter}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center bg-gray-50/50">
                        {typeof item.professional === 'boolean' ? (
                          item.professional ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-600">{item.professional}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof item.enterprise === 'boolean' ? (
                          item.enterprise ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-600">{item.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3">
                SUCCESS STORIES
              </Badge>
              <H2 className="mb-3">Skenario Penggunaan Tokoflow</H2>
              <P>Bagaimana Tokoflow membantu menyelesaikan masalah inventory & profit tracking</P>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {caseStudies.map((study, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <CardTitle>{study.client}</CardTitle>
                      <CardDescription>{study.industry}</CardDescription>
                    </div>
                    <Badge>
                      {study.investment}
                    </Badge>
                  </div>

                  {/* Result-focused headline */}
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-800">
                      {study.headline}
                    </p>
                  </div>

                  <div className="space-y-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sebelum:</p>
                      <P className="text-sm">{study.before}</P>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sesudah:</p>
                      <p className="text-sm text-gray-700 font-medium">{study.after}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {study.results.map((result, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-gray-700">{result}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{study.roi}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <H2 className="mb-3">Apa Saja yang Termasuk?</H2>
              <P>Transparansi penuh tentang apa yang Anda dapatkan</P>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <H3 className="mb-4 flex items-center text-base">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Termasuk dalam Semua Paket
                </H3>
                <ul className="space-y-3">
                  {inclusionDetails.included.map((item, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <H3 className="mb-4 flex items-center text-base">
                  <span className="text-gray-400 mr-2">×</span>
                  Tidak Termasuk
                </H3>
                <ul className="space-y-3">
                  {inclusionDetails.notIncluded.map((item, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Money back guarantee */}
            <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <H3 className="mb-2 text-base">14-Day Money Back Guarantee</H3>
                    <P className="text-sm">
                      Coba Tokoflow tanpa risiko. Jika dalam 14 hari pertama Anda merasa sistem tidak cocok, 
                      kami kembalikan 100% pembayaran Anda. Tanpa pertanyaan, tanpa ribet.
                    </P>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 md:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <Badge variant="secondary" className="mb-3">
                FAQ
              </Badge>
              <H2 className="mb-3">Pertanyaan Seputar Pricing</H2>
            </div>

            <div className="space-y-4">
              {pricingFAQ.map((faq, index) => (
                <Card key={index} className="overflow-hidden">
                  <details className="group">
                    <summary className="flex justify-between items-center p-6 cursor-pointer list-none hover:bg-gray-50/50 transition-colors duration-200">
                      <h3 className="text-base font-medium text-black pr-4">{faq.question}</h3>
                      <div className="text-gray-400 group-open:rotate-180 flex-shrink-0 transition-transform duration-200">
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
                      <P className="text-sm">{faq.answer}</P>
                    </div>
                  </details>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-20 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Badge className="mb-4 bg-white/10 text-white border-0">
              <MessageSquare className="w-3 h-3 mr-1" />
              GRATIS SELAMA EARLY ACCESS
            </Badge>
            <H2 className="text-white mb-4">
              Siap Tingkatkan Efisiensi Bisnis Anda?
            </H2>

            <P className="text-white/70 max-w-2xl mx-auto mb-8">
              Bergabung dengan program Early Access Tokoflow.
              Gratis selama program berjalan, tanpa kartu kredit. Harga early adopter di-lock selamanya.
            </P>

            <Card className="bg-white/10 border-0 p-6 max-w-md mx-auto mb-8">
              <p className="text-white mb-4">Dalam program Early Access, Anda dapat:</p>
              <div className="space-y-2 text-left max-w-xs mx-auto">
                <div className="flex items-center text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  Import data SKU & stok dari Excel
                </div>
                <div className="flex items-center text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  Pakai semua fitur dengan data real
                </div>
                <div className="flex items-center text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  Walkthrough langsung dari developer
                </div>
                <div className="flex items-center text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  Influence roadmap fitur berikutnya
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" asChild className="bg-white text-gray-900 border-white hover:bg-gray-100">
                <Link href="/register" className="inline-flex items-center">
                  Daftar Early Access
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="bg-white/10 text-white hover:bg-white/20">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Chat Sales Team
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}