// app/investasi/InvestasiClient.js 
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';

// UI Components
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, H1, H2, H3, P, Lead } from '../components/ui';

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
import { WHATSAPP_LINK } from '../page_data';

// Pricing Tiers for Tokoflow
const pricingTiers = [
  {
    name: 'Starter',
    price: 'Rp 299rb',
    period: '/bulan',
    description: 'Perfect untuk UMKM dan online shop kecil',
    features: [
      'Hingga 1,000 SKU',
      '3 User Access', 
      'Dashboard Real-time',
      'Multi-channel (3 marketplace)',
      'Laporan Profit Otomatis',
      'WhatsApp Support',
      'Training Online',
      'Backup Harian'
    ],
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    buttonColor: 'bg-gray-900 hover:bg-black text-white',
    ctaText: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: 'Rp 599rb',
    period: '/bulan',
    description: 'Untuk bisnis yang sedang growing pesat',
    features: [
      'Unlimited SKU',
      '10 User Access',
      'Advanced Analytics',
      'All Marketplace Integration',
      'API Access',
      'Priority Support',
      'Custom Reports',
      'Backup Real-time',
      'Barcode Scanner App'
    ],
    bgColor: 'bg-gray-900',
    borderColor: 'border-gray-900',
    textColor: 'text-white',
    buttonColor: 'bg-white hover:bg-gray-100 text-gray-900',
    ctaText: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'Solusi lengkap untuk perusahaan besar',
    features: [
      'Everything in Professional',
      'Unlimited Users',
      'Custom Integration',
      'Dedicated Account Manager',
      'On-premise Option',
      'SLA 99.9% Uptime',
      'Training On-site',
      'Custom Development'
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
    client: 'Toko Elektronik Jaya Abadi',
    industry: 'Retail Electronics',
    headline: 'Dari Catat Manual ke Dashboard Real-time!',
    before: 'Stok berantakan, sering kehabisan barang atau overstock',
    after: 'Stok real-time, alert otomatis, laporan profit instant',
    results: [
      'Penjualan naik 40%',
      'Zero stock-out pada best seller',
      'Akurasi stok 99.5%',
      'Hemat 10 jam/minggu admin'
    ],
    investment: 'Professional Plan',
    roi: 'ROI dalam 3 bulan'
  },
  {
    client: 'Fashion Online Shop',
    industry: 'E-commerce Fashion',
    headline: 'Multi-channel Jadi Mudah!',
    before: 'Butuh 3 admin untuk handle 3 marketplace',
    after: 'Cukup 1 admin dengan sistem terintegrasi',
    results: [
      'Hemat biaya operasional 70%',
      'Order processing 3x lebih cepat',
      'Sync 5 marketplace otomatis',
      'Zero double selling'
    ],
    investment: 'Professional Plan',
    roi: 'Hemat 2 gaji admin/bulan'
  }
];

// What's Included & Not Included
const inclusionDetails = {
  included: [
    'Setup awal & data migration',
    'Training online untuk tim',
    'Template laporan siap pakai',
    'Integrasi marketplace populer',
    'Mobile app access',
    'Update fitur reguler',
    'Support via WhatsApp',
    'Backup & security'
  ],
  notIncluded: [
    'Custom development khusus',
    'Integrasi ERP/sistem legacy',
    'Training on-site',
    'Dedicated server',
    'Custom report beyond template'
  ]
};

// FAQ Data - Tokoflow Focus
const pricingFAQ = [
  {
    question: 'Apa perbedaan utama antara setiap paket?',
    answer: 'Starter cocok untuk UMKM dengan <1000 SKU dan 1-3 marketplace. Professional untuk bisnis growing dengan unlimited SKU dan semua marketplace. Enterprise untuk perusahaan besar yang butuh custom integration dan dedicated support. Semua paket include core features seperti inventory tracking dan profit calculation.'
  },
  {
    question: 'Apakah ada biaya setup atau hidden cost?',
    answer: 'Tidak ada biaya setup atau hidden cost. Harga yang tertera adalah all-in: software, hosting, support, dan update. Yang tidak termasuk hanya custom development di luar fitur standard dan integrasi dengan sistem legacy yang kompleks.'
  },
  {
    question: 'Bagaimana dengan data migration dari sistem lama?',
    answer: 'Semua paket include data migration gratis untuk format standard (Excel, CSV). Kami bantu import data SKU, stok awal, supplier, dan customer. Untuk migration dari software khusus mungkin ada biaya tambahan tergantung kompleksitas.'
  },
  {
    question: 'Bisa trial dulu sebelum berlangganan?',
    answer: 'Ya! Free trial 14 hari untuk semua fitur tanpa perlu kartu kredit. Anda bisa test dengan data real, training tim, dan pastikan cocok dengan workflow bisnis Anda. Setelah trial, baru putuskan untuk lanjut atau tidak.'
  },
  {
    question: 'Apakah bisa upgrade/downgrade paket?',
    answer: 'Sangat fleksibel! Upgrade bisa kapan saja dan langsung aktif. Downgrade bisa di akhir periode billing. Tidak ada penalty atau biaya tambahan. Data Anda tetap aman saat pindah paket.'
  },
  {
    question: 'Bagaimana jika butuh fitur yang belum ada?',
    answer: 'Kami update fitur setiap bulan berdasarkan request user. Fitur populer biasanya masuk dalam 1-2 bulan. Untuk kebutuhan sangat spesifik, tersedia custom development dengan biaya terpisah atau pertimbangkan paket Enterprise.'
  },
  {
    question: 'Apakah data saya aman di Tokoflow?',
    answer: 'Keamanan adalah prioritas utama. Data di-encrypt, backup otomatis tiap jam, server di Google Cloud Indonesia, dan comply dengan regulasi data protection. Anda juga bisa export semua data kapan saja - no vendor lock-in.'
  },
  {
    question: 'Support seperti apa yang didapatkan?',
    answer: 'Starter: WhatsApp support office hours. Professional: Priority support dengan response <2 jam. Enterprise: Dedicated account manager + 24/7 support. Semua paket dapat video tutorial dan knowledge base lengkap.'
  }
];

// Feature comparison data
const featureComparison = [
  { feature: 'SKU Management', starter: 'Up to 1,000', professional: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'User Access', starter: '3 users', professional: '10 users', enterprise: 'Unlimited' },
  { feature: 'Marketplace Integration', starter: '3 channels', professional: 'All channels', enterprise: 'All + Custom' },
  { feature: 'Report Templates', starter: 'Basic (5)', professional: 'Advanced (20+)', enterprise: 'Custom Reports' },
  { feature: 'API Access', starter: false, professional: true, enterprise: true },
  { feature: 'Mobile App', starter: 'View only', professional: 'Full access', enterprise: 'Full + Custom' },
  { feature: 'Data Backup', starter: 'Daily', professional: 'Real-time', enterprise: 'Real-time + Archive' },
  { feature: 'Support', starter: 'Office hours', professional: 'Priority', enterprise: '24/7 Dedicated' },
];

// Main Page Component
export default function InvestasiClient() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-700 overflow-x-hidden">
      <PublicNav />

      <main className="flex-grow pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <Badge variant="success" className="mb-3">
              FREE TRIAL 14 HARI
            </Badge>
            <H1 className="mb-4">
              Pricing Transparan untuk Setiap Skala Bisnis
            </H1>
            <Lead className="max-w-3xl mx-auto">
              Mulai dari UMKM hingga enterprise, pilih paket yang sesuai dengan kebutuhan Anda. 
              Tanpa biaya setup, tanpa hidden cost. Upgrade atau downgrade kapan saja.
            </Lead>
          </div>
        </section>

        {/* Billing Toggle */}
        <section className="pb-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-center">
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === 'monthly' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === 'annual' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Tahunan
                  <Badge variant="success" className="ml-2">Hemat 20%</Badge>
                </button>
              </div>
            </div>
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
                    {billingCycle === 'annual' && tier.price !== 'Custom' && (
                      <p className="text-xs text-green-600 mt-1">
                        Save {tier.name === 'Starter' ? 'Rp 719rb' : 'Rp 1.439rb'}/tahun
                      </p>
                    )}
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
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Starter</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      Professional
                      <Badge variant="secondary" className="ml-2">Popular</Badge>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Enterprise</th>
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
              <H2 className="mb-3">ROI Terbukti dalam Hitungan Bulan</H2>
              <P>Lihat bagaimana bisnis lain meningkatkan efisiensi dengan Tokoflow</P>
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
              NO CREDIT CARD REQUIRED
            </Badge>
            <H2 className="text-white mb-4">
              Siap Tingkatkan Efisiensi Bisnis Anda?
            </H2>
                
            <P className="text-white/70 max-w-2xl mx-auto mb-8">
              Join 500+ UMKM yang sudah menghemat waktu dan meningkatkan profit dengan Tokoflow. 
              Free trial 14 hari untuk test dengan data real Anda.
            </P>
            
            <Card className="bg-white/10 border-0 p-6 max-w-md mx-auto mb-8">
              <p className="text-white mb-4">Dalam free trial, Anda dapat:</p>
              <div className="space-y-2 text-left max-w-xs mx-auto">
                <div className="flex items-center text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  Import semua data SKU & stok
                </div>
                <div className="flex items-center text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  Test integrasi marketplace
                </div>
                <div className="flex items-center text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  Training untuk seluruh tim
                </div>
                <div className="flex items-center text-sm text-white/80">
                  <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                  Akses semua fitur premium
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" asChild className="bg-white text-gray-900 border-white hover:bg-gray-100">
                <Link href="/register" className="inline-flex items-center">
                  Start Free Trial
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