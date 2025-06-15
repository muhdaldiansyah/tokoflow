// app/page_data.js (UPDATED FOR TOKOFLOW)

import React from 'react';
import {
  // Core Values Icons (Chosen for business/inventory values):
  TrendingUp,   // Untuk Pertumbuhan Bisnis
  Package,      // Untuk Manajemen Stok
  CheckSquare,  // Untuk Akurasi Data
  Heart,        // Untuk Support UMKM
  RefreshCw,    // Untuk Real-time Updates

  // Core Offerings Icons:
  BarChart2,    // Untuk Analytics
  ShoppingCart, // Untuk Penjualan
  
  // Platform Features Icons:
  Layers,       // Untuk Multi-channel
  Database,     // Untuk Inventory
  FileText,     // Untuk Laporan

  // Solutions Capabilities Icons:
  Globe, Smartphone, Zap,
  
  // Additional Icons:
  PenTool,
  Calculator,
  Users,
  Shield,
} from 'lucide-react';

// --- Constants ---
export const WHATSAPP_LINK = "https://wa.me/+6282311639949?text=Saya%20tertarik%20dengan%20Tokoflow%20untuk%20bisnis%20saya";

// --- Testimonials (Updated for E-commerce/Retail) ---
export const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'Pemilik Toko Elektronik Jaya Abadi',
    headline: 'Dari Catat Manual ke Dashboard Real-time!',
    quote:
      'Dulu stok berantakan, sering kehabisan barang atau malah overstock. Dengan Tokoflow, saya bisa lihat stok real-time, dapat alert kalau stok menipis, dan laporan profit otomatis. Penjualan naik 40% karena tidak pernah kehabisan stok best seller!',
    initials: 'BS',
    color: 'dark',
  },
  {
    name: 'Siti Rahayu',
    role: 'Owner Fashion Online Shop',
    headline: 'Multi-channel Jadi Mudah: Shopee, Tokped, TikTok!',
    quote:
      'Jualan di 3 marketplace bikin pusing ngatur stok. Tokoflow otomatis sync stok ke semua channel, hitung fee marketplace berbeda, dan rekap untung per channel. Yang tadinya butuh 3 admin, sekarang cukup 1 orang. Hemat biaya operasional 70%!',
    initials: 'SR',
    color: 'green',
  },
  {
    name: 'Ahmad Wijaya',
    role: 'Distributor Produk Kesehatan',
    headline: 'Profit Margin Jelas, Keputusan Bisnis Tepat!',
    quote:
      'Tokoflow hitung detail: modal, packing, fee marketplace, bahkan komisi affiliate. Saya jadi tahu produk mana yang untung besar, channel mana yang efisien. Bisa fokus push produk high-margin dan stop produk rugi. Net profit naik 60% dalam 6 bulan!',
    initials: 'AW',
    color: 'dark',
  },
];

// --- Workshops (Business/E-commerce focused training) ---
export const workshops = [
   {
    id: 1,
    icon: <Database />,
    tags: ['Inventory', 'Google Sheets', 'Automation'],
    title: 'Otomasi Inventory dengan Google Sheets & Apps Script',
    description:
      'Workshop praktis membuat sistem inventory otomatis dengan Google Sheets. Cocok untuk UMKM yang ingin digitalisasi tanpa investasi besar.',
    duration: '6 jam (1 hari)',
    upcoming: 'Setiap Sabtu',
  },
  {
    id: 2,
    icon: <BarChart2 />,
    tags: ['Analytics', 'Profit', 'Dashboard'],
    title: 'Dashboard Penjualan Real-time untuk Decision Making',
    description:
      'Bangun dashboard analytics untuk monitor penjualan, analisis profit margin, dan trend produk. Integrasikan dengan marketplace API.',
    duration: '8 jam (2 sesi)',
    upcoming: 'Jadwal Fleksibel',
  },
  {
    id: 3,
    icon: <ShoppingCart />,
    tags: ['Multi-channel', 'Integration', 'Scale'],
    title: 'Scale Up: Jual di 10+ Channel Tanpa Ribet',
    description:
      'Strategi dan tools untuk ekspansi ke multiple marketplace. Sinkronisasi stok, harga, dan order management yang efisien.',
    duration: '10 jam (2 hari)',
    upcoming: 'On Demand',
  },
];

// --- Core Offerings (UPDATED - E-commerce Focus) ---
export const coreOfferings = [
  {
    title: 'Tokoflow Starter: Inventory & Sales Management',
    desc: 'Sistem inventory dan penjualan berbasis Google Sheets dengan dashboard real-time. Perfect untuk UMKM dan online shop. Setup cepat, training included.',
    link: '/register',
    linkText: 'Coba Gratis 14 Hari',
    icon: <Package />,
    theme: 'gray',
    isExternal: false,
  },
  {
    title: 'Custom Integration & Automation',
    desc: 'Integrasi dengan marketplace API, sistem POS, atau ERP existing. Otomasi penuh dari order hingga laporan. Konsultasi gratis untuk kebutuhan spesifik.',
    link: WHATSAPP_LINK,
    linkText: 'Konsultasi via WhatsApp',
    icon: <Zap />,
    theme: 'dark',
    isExternal: true,
  },
];

// --- Platform Features (Inventory & Sales Features) ---
export const platformFeatures = [
  {
    title: 'Real-time Inventory Tracking',
    desc: 'Monitor stok real-time, alert stok minimum, tracking barang masuk/keluar, dan manajemen multi-gudang dalam satu dashboard.',
    area: 'Inventory Management',
    icon: <Database />,
    imageUrl: "/inventory-dashboard.png", 
  },
  {
    title: 'Multi-channel Sales Dashboard',
    desc: 'Rekap penjualan dari Shopee, Tokopedia, TikTok Shop, dan channel lain. Hitung fee otomatis, analisis profit per channel.',
    area: 'Sales Analytics',
    icon: <BarChart2 />,
    imageUrl: "/sales-analytics.png",
  },
  {
    title: 'Automated Profit Calculation',
    desc: 'Kalkulasi otomatis modal, biaya packing, fee marketplace, komisi affiliate. Lihat net profit real-time per produk dan channel.',
    area: 'Financial Intelligence',
    icon: <Calculator />,
    imageUrl: "/profit-calculator.png",
  },
];

// --- Solutions Capabilities (Business Solutions) ---
export const solutionsCapabilities = [
  {
    title: 'Sistem Inventory Pintar',
    description: 'Kelola stok multi-SKU dengan fitur bundle/paket, tracking komponen, stock opname digital, dan forecasting kebutuhan stok berdasarkan trend penjualan.',
    status: 'Fondasi Bisnis Solid',
    icon: <Package className="w-6 h-6" />,
    imageUrl: "/smart-inventory.png",
  },
  {
    title: 'Integrasi Marketplace Seamless',
    description: 'Sinkronisasi otomatis dengan Shopee, Tokopedia, TikTok Shop, dan marketplace lain. Update stok real-time, centralized order management, dan rekonsiliasi otomatis.',
    status: 'Scale Tanpa Batas',
    icon: <Globe className="w-6 h-6" />,
    imageUrl: "/marketplace-integration.png",
  },
  {
    title: 'Business Intelligence Dashboard',
    description: 'Analytics mendalam: best seller analysis, slow moving detection, profit margin per SKU, customer behavior, dan predictive sales forecast untuk planning lebih baik.',
    status: 'Data-Driven Growth',
    icon: <TrendingUp className="w-6 h-6" />,
    imageUrl: "/business-intelligence.png",
  },
];

// --- Core Values / Prinsip Kami (UPDATED - Business Focus) ---
export const coreValues = [
  {
    title: "Teknologi untuk UMKM",
    description: "Kami demokratisasi teknologi inventory management yang biasanya hanya untuk perusahaan besar, kini terjangkau untuk UMKM dengan investasi minimal.",
    icon: <Package className="w-5 h-5" />,
  },
  {
    title: "Pertumbuhan Berkelanjutan",
    description: "Sistem kami dirancang scalable, mulai dari 10 SKU hingga 10,000 SKU. Grow with confidence tanpa perlu ganti sistem.",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    title: "Akurasi Data Real-time",
    description: "Setiap transaksi tercatat instant, stok update otomatis, laporan selalu akurat. No more guessing, semua berdasarkan data.",
    icon: <CheckSquare className="w-5 h-5" />,
  },
  {
    title: "Support Lokal Responsif",
    description: "Tim support Indonesia yang paham konteks bisnis lokal. Training, troubleshooting, dan konsultasi dalam bahasa Indonesia.",
    icon: <Heart className="w-5 h-5" />,
  },
  {
    title: "Update & Inovasi Rutin",
    description: "Fitur baru setiap bulan berdasarkan feedback user. Integrasi marketplace terbaru, laporan yang diminta user, semua kami develop.",
    icon: <RefreshCw className="w-5 h-5" />,
  },
];

// --- FAQ (UPDATED - E-commerce Focus) ---
export const faqs = [
  {
    question: 'Apa itu Tokoflow?',
    answer: 'Tokoflow adalah sistem manajemen inventory dan penjualan terintegrasi untuk UMKM dan online shop. Berbasis Google Sheets dengan automasi canggih, membantu Anda tracking stok real-time, rekap penjualan multi-channel, dan hitung profit otomatis. Solusi affordable untuk bisnis yang sedang growing.',
  },
  {
    question: 'Berapa biaya berlangganan Tokoflow?',
    answer: 'Tokoflow Starter mulai dari 299rb/bulan untuk hingga 1000 SKU dan 3 user. Ada free trial 14 hari tanpa kartu kredit. Paket Professional 599rb/bulan untuk unlimited SKU dan 10 user. Enterprise custom pricing dengan integrasi API marketplace dan dedicated support.',
  },
  {
    question: 'Apakah bisa integrasi dengan marketplace?',
    answer: 'Ya! Tokoflow support integrasi dengan Shopee, Tokopedia, TikTok Shop, Bukalapak, Lazada, dan marketplace lain via API. Stok sync otomatis, order masuk langsung, fee marketplace dihitung otomatis per channel.',
  },
  {
    question: 'Bagaimana dengan keamanan data?',
    answer: 'Data Anda tersimpan di Google Cloud dengan enkripsi tingkat enterprise. Backup otomatis setiap jam, access control per user, dan audit trail lengkap. Kami juga GDPR compliant dan sudah tersertifikasi ISO 27001.',
  },
  {
    question: 'Apakah perlu technical skill untuk pakai Tokoflow?',
    answer: 'Tidak perlu! Tokoflow didesain user-friendly untuk non-technical user. Ada video tutorial step-by-step, template siap pakai, dan training online gratis. Plus, support team kami siap bantu via WhatsApp.',
  },
  {
    question: 'Bisa untuk bisnis offline juga?',
    answer: 'Tentu! Tokoflow cocok untuk toko offline, online, atau hybrid. Ada fitur POS sederhana, barcode scanning (via mobile app), dan integrasi dengan printer thermal untuk cetak nota.',
  },
];

// --- Blog Posts (Updated - E-commerce Focus) ---
export const blogPosts = [
  {
    title: '5 Kesalahan Fatal UMKM dalam Manage Inventory',
    excerpt: 'Hindari kesalahan umum yang bikin bisnis rugi: dari stok mati hingga overselling.',
    category: 'Inventory Tips',
    date: '20 Juni 2025',
    link: '/panduan/kesalahan-fatal-umkm-inventory',
    color: 'dark',
    imagePlaceholder: 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]',
    imageUrl: '/panduan/inventory-mistakes.png'
  },
  {
    title: 'Maksimalkan Profit dengan Multi-channel Selling',
    excerpt: 'Strategi jual di banyak marketplace tanpa ribet. Tips sync stok dan optimasi fee.',
    category: 'Sales Strategy',
    date: '15 Juni 2025',
    link: '/panduan/maksimalkan-profit-multichannel',
    color: 'gray',
    imagePlaceholder: 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]',
    imageUrl: '/panduan/multichannel-guide.png'
  },
  {
    title: 'Dashboard Analytics: KPI yang Wajib Dimonitor',
    excerpt: 'Metric penting untuk growth: inventory turnover, profit margin, channel performance.',
    category: 'Business Intelligence',
    date: '10 Juni 2025',
    link: '/panduan/kpi-wajib-monitor-dashboard',
    color: 'dark',
    imagePlaceholder: 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]',
    imageUrl: '/panduan/kpi-dashboard.png'
  },
];

// --- Panduan Posts (Updated - Business Focus) ---
export const panduanPosts = [
  {
    title: 'Complete Guide: Setup Tokoflow untuk Pemula',
    excerpt: 'Panduan lengkap step-by-step setup Tokoflow dari nol hingga running. Include video tutorial.',
    category: 'Getting Started',
    date: '25 Juni 2025',
    link: '/panduan/setup-tokoflow-pemula',
    color: 'dark',
    imagePlaceholder: 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]',
    imageUrl: '/panduan/setup-guide.png'
  },
  {
    title: 'Strategi Stock Opname Digital yang Efisien',
    excerpt: 'Cara melakukan stock opname tanpa tutup toko. Tips reconcile stok fisik vs sistem.',
    category: 'Inventory Management',
    date: '18 Juni 2025',
    link: '/panduan/stock-opname-digital',
    color: 'gray',
    imagePlaceholder: 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]',
    imageUrl: '/panduan/stock-opname.png'
  },
  {
    title: 'Automasi Laporan Keuangan dengan Tokoflow',
    excerpt: 'Setting auto-generate laporan harian, mingguan, bulanan. Export ke Excel atau PDF otomatis.',
    category: 'Financial Reporting',
    date: '5 Juni 2025',
    link: '/panduan/automasi-laporan-keuangan',
    color: 'dark',
    imagePlaceholder: 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]',
    imageUrl: '/panduan/financial-automation.png'
  },
];

// --- Investment Packages (Pricing) ---
export const investmentPackages = [
  {
    name: 'Starter',
    price: '299rb',
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
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '599rb',
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
    cta: 'Start Free Trial',
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
    cta: 'Contact Sales',
    highlighted: false,
  },
];
