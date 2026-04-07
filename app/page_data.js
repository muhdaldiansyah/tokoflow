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

// --- Use Cases (Skenario Penggunaan) ---
export const useCases = [
  {
    name: 'Toko Elektronik',
    role: '500+ SKU, Multi-channel',
    headline: 'Track stok real-time, hitung profit per channel',
    quote:
      'Kelola ratusan produk tanpa spreadsheet. Setiap penjualan otomatis terhitung: modal, packing, fee marketplace. Dashboard menunjukkan produk mana paling untung di channel mana — keputusan restock berdasarkan data, bukan feeling.',
    initials: 'TE',
    color: 'dark',
  },
  {
    name: 'Fashion Online Shop',
    role: '3 Marketplace, Produk Bundle',
    headline: 'Fee marketplace berbeda? Otomatis terhitung semua',
    quote:
      'Shopee, Tokopedia, TikTok Shop — masing-masing fee berbeda. Tokoflow hitung otomatis per transaksi. Ditambah fitur bundle: jual paket produk, stok komponen auto-update. Tahu persis margin bersih setiap channel.',
    initials: 'FO',
    color: 'green',
  },
  {
    name: 'Distributor & Grosir',
    role: 'Cost Management, Margin Analysis',
    headline: 'Detail biaya per produk: modal, packing, affiliate',
    quote:
      'Set cost breakdown per SKU — modal, biaya packing, persentase affiliate. Setiap penjualan langsung terlihat net profit-nya. Identifikasi produk high-margin untuk di-push, dan produk rugi untuk di-review.',
    initials: 'DG',
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
    answer: 'Tokoflow adalah sistem manajemen inventory dan penjualan untuk UMKM dan online shop. Membantu Anda tracking stok real-time, rekap penjualan multi-channel, dan hitung profit otomatis dengan detail cost breakdown (modal, packing, fee marketplace, affiliate).',
  },
  {
    question: 'Berapa biaya berlangganan Tokoflow?',
    answer: 'Saat ini Tokoflow dalam program Early Access dengan harga spesial untuk merchant pertama. Hubungi kami via WhatsApp untuk informasi harga early adopter yang akan di-lock selamanya.',
  },
  {
    question: 'Bagaimana cara kerja multi-channel di Tokoflow?',
    answer: 'Anda bisa mencatat penjualan per channel (Shopee, Tokopedia, TikTok Shop, offline, dll), dan Tokoflow otomatis menghitung fee marketplace yang berbeda per channel, lalu menampilkan profit bersih per transaksi dan per channel di dashboard.',
  },
  {
    question: 'Bagaimana dengan keamanan data?',
    answer: 'Data Anda tersimpan di cloud infrastructure dengan enkripsi standar industri dan backup otomatis. Akses terlindungi dengan autentikasi per user.',
  },
  {
    question: 'Apakah perlu technical skill untuk pakai Tokoflow?',
    answer: 'Tidak perlu! Tokoflow didesain user-friendly. Interface-nya intuitif dan support langsung dari developer via WhatsApp — bukan bot atau CS scripted.',
  },
  {
    question: 'Tokoflow masih dalam tahap apa?',
    answer: 'Tokoflow saat ini dalam program Early Access. Core features (inventory tracking, profit calculation, multi-channel analytics) sudah berjalan. Kami aktif mengembangkan fitur baru berdasarkan feedback langsung dari merchant.',
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
