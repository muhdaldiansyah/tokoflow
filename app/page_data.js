// app/page_data.js
//
// IN USE (imported and rendered):
//   - useCases       → app/page.js
//   - blogPosts      → app/page.js
//   - faqs           → app/page.js
//   - WHATSAPP_LINK  → app/page.js, LayananClient, TentangClient, InvestasiClient
//   - panduanPosts   → PanduanClient
//   - coreValues     → TentangClient
//
// DEAD EXPORTS — not imported anywhere; kept to avoid silent breakage if a
// future page is wired up to them, but DO NOT render these as-is. They contain
// pre–Early-Access marketing claims that are no longer accurate:
//   - workshops              (mentions Google Sheets / Apps Script workshop)
//   - coreOfferings          ("berbasis Google Sheets", "Coba Gratis 14 Hari")
//   - platformFeatures       ("manajemen multi-gudang" — not built)
//   - solutionsCapabilities  ("Sinkronisasi otomatis marketplace" — not built)
//   - investmentPackages     (fictional Rp 299rb/599rb tiers, "Start Free Trial",
//                             "SLA 99.9% Uptime", "Barcode Scanner App", etc.)
// If you wire any of these up, rewrite the strings to match Early Access reality
// first. See db/schema.sql + app/(private)/* for what actually exists.

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

// --- FAQ ---
// Note: app/page.js renders only the first 5 entries via .slice(0, 5).
// The first 5 here are the most impactful for first-time visitors. The rest
// are still useful for /panduan and AI search engines that fetch the full file.
export const faqs = [
  {
    question: 'Apa itu Tokoflow?',
    answer: 'Tokoflow adalah sistem manajemen inventory dan penjualan untuk UMKM dan online shop. Membantu Anda tracking stok real-time multi-warehouse, rekap penjualan multi-channel, hitung profit otomatis dengan cost breakdown lengkap (modal, packing, fee marketplace, affiliate), tracking customer dengan lifetime stats, dan kelola tim dengan role owner / staff.',
  },
  {
    question: 'Tokoflow masih dalam tahap apa? Apa saja yang sudah jalan?',
    answer: 'Tokoflow saat ini dalam program Early Access. Yang sudah jalan: inventory + multi-warehouse, profit calculation per transaksi, multi-channel sales tracking, customer attribution dengan lifetime stats, RBAC owner/staff, stock alert in-app dengan threshold per produk, PWA installable, dan barcode scanner via kamera HP. Yang masih dalam pipeline: marketplace API auto-sync (Shopee/Tokopedia/TikTok), email/WA notification delivery, dan payment Midtrans. Kami aktif develop fitur baru berdasar feedback merchant.',
  },
  {
    question: 'Apakah Tokoflow support multi-warehouse / cabang?',
    answer: 'Ya. Anda bisa setup beberapa warehouse / cabang (mis. "Cabang Jakarta", "Cabang Surabaya"). Setiap produk milik satu warehouse — untuk SKU yang sama di 2 cabang, buat 2 produk dengan SKU berbeda (misalnya ABC-JKT dan ABC-SBY). Cocok buat merchant dengan multiple stores atau gudang kecil.',
  },
  {
    question: 'Bisa pakai Tokoflow rame-rame dengan tim?',
    answer: 'Bisa. Tokoflow punya 2 role: owner (akses penuh — bisa edit cost data, marketplace fees, hapus produk/customer, manage user) dan staff (akses operasional — input penjualan, tambah customer, cek stok, kelola incoming goods). User pertama yang daftar otomatis jadi owner. Owner bisa promote staff jadi owner lewat halaman User Management.',
  },
  {
    question: 'Apakah Tokoflow bisa diakses dari HP?',
    answer: 'Bisa. Tokoflow adalah PWA (Progressive Web App) — buka di Chrome / Safari di HP, tap "Add to Home Screen", dan Tokoflow muncul sebagai app icon di home screen tanpa perlu download dari Play Store. Sudah include barcode scanner pakai kamera HP buat lookup SKU instant ke inventory.',
  },
  {
    question: 'Berapa biaya berlangganan Tokoflow?',
    answer: 'Saat ini Tokoflow dalam program Early Access — gratis selama program berjalan untuk merchant pertama. Hubungi kami via WhatsApp untuk informasi harga early adopter yang akan di-lock selamanya setelah program EA berakhir.',
  },
  {
    question: 'Bagaimana cara kerja multi-channel di Tokoflow?',
    answer: 'Anda bisa mencatat penjualan per channel (Shopee, Tokopedia, TikTok Shop, offline, dll). Tokoflow otomatis menghitung fee marketplace yang berbeda per channel, lalu menampilkan profit bersih per transaksi, per channel, per produk, dan per customer di dashboard.',
  },
  {
    question: 'Bagaimana Tokoflow alert kalau stok menipis?',
    answer: 'Anda bisa set threshold low-stock per produk (default 10). Begitu stok turun di bawah threshold, akan muncul notifikasi di bell icon di navigation bar dengan unread count. Anda bisa acknowledge satu per satu atau bulk. Alert otomatis hilang saat stok dikembalikan ke normal — tidak perlu reset manual.',
  },
  {
    question: 'Apakah Tokoflow bisa sync otomatis dengan Shopee / Tokopedia / TikTok Shop?',
    answer: 'Saat ini sync otomatis ke marketplace API masih dalam tahap scaffolding — schema, OAuth flow, dan UI sudah siap, tapi butuh credentials platform (Shopee partner account, dll) dan implementasi OAuth callback final. Untuk sekarang, penjualan dari marketplace di-input manual lewat halaman /sales atau /scanner.',
  },
  {
    question: 'Bagaimana dengan keamanan data?',
    answer: 'Data Anda tersimpan di Supabase (Postgres) dengan enkripsi at-rest, backup otomatis, dan akses terlindungi dengan Row Level Security plus role-based access control. Anda bisa export semua data kapan saja — no vendor lock-in.',
  },
  {
    question: 'Apakah perlu technical skill untuk pakai Tokoflow?',
    answer: 'Tidak perlu! Tokoflow didesain user-friendly. Interface-nya intuitif dan support langsung dari developer via WhatsApp — bukan bot atau CS scripted.',
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
