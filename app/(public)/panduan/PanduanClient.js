// app/panduan/PanduanClient.js

"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '../../components/PublicNav';
import Footer from '../../components/Footer';

// UI Components
import { Button, H1, H2, H3, P, Badge } from '../../components/ui';
import { 
  Search, 
  Calendar, 
  Clock, 
  ChevronRight,
  Filter,
  X,
  Package,
  ShoppingCart,
  BarChart2,
  TrendingUp,
} from 'lucide-react';

// Import panduan data from page_data
import { panduanPosts as importedPosts } from '../../page_data';

// Additional panduan posts specific to tokoflow
const additionalPosts = [
  {
    id: 1,
    title: "5 Kesalahan Fatal UMKM dalam Manage Inventory",
    slug: "kesalahan-fatal-umkm-inventory",
    excerpt: "Hindari kesalahan umum yang bikin bisnis rugi: dari stok mati hingga overselling. Pelajari cara manage inventory yang benar.",
    category: "inventory",
    categoryLabel: "Inventory Tips",
    date: "2025-06-20",
    readingTime: 8,
    tags: ["inventory", "stok", "umkm", "tips", "kesalahan"],
    author: "Tim Tokoflow",
    image: "/images/panduan/inventory-mistakes.png",
    icon: Package,
  },
  {
    id: 2,
    title: "Maksimalkan Profit dengan Multi-channel Selling",
    slug: "maksimalkan-profit-multichannel",
    excerpt: "Strategi jual di banyak marketplace tanpa ribet. Tips sync stok, optimasi fee, dan analisis channel performance.",
    category: "sales",
    categoryLabel: "Sales Strategy",
    date: "2025-06-15",
    readingTime: 10,
    tags: ["multi-channel", "marketplace", "profit", "strategi", "sales"],
    author: "Tim Tokoflow",
    image: "/images/panduan/multichannel-guide.png",
    icon: ShoppingCart,
  },
  {
    id: 3,
    title: "Dashboard Analytics: KPI yang Wajib Dimonitor",
    slug: "kpi-wajib-monitor-dashboard",
    excerpt: "Metric penting untuk growth: inventory turnover, profit margin, channel performance. Lengkap dengan cara baca dan action plan.",
    category: "analytics",
    categoryLabel: "Business Intelligence",
    date: "2025-06-10",
    readingTime: 12,
    tags: ["analytics", "kpi", "dashboard", "metrics", "growth"],
    author: "Tim Tokoflow",
    image: "/images/panduan/kpi-dashboard.png",
    icon: BarChart2,
  },
  {
    id: 4,
    title: "Complete Guide: Setup Tokoflow untuk Pemula",
    slug: "setup-tokoflow-pemula",
    excerpt: "Panduan lengkap step-by-step setup Tokoflow dari nol hingga running. Include video tutorial dan best practices.",
    category: "getting-started",
    categoryLabel: "Getting Started",
    date: "2025-06-25",
    readingTime: 15,
    tags: ["setup", "tutorial", "pemula", "getting started"],
    author: "Tim Tokoflow",
    image: "/images/panduan/setup-guide.png",
    icon: Package,
  },
  {
    id: 5,
    title: "Strategi Stock Opname Digital yang Efisien",
    slug: "stock-opname-digital",
    excerpt: "Cara melakukan stock opname tanpa tutup toko. Tips reconcile stok fisik vs sistem, handle selisih, dan preventive action.",
    category: "inventory",
    categoryLabel: "Inventory Management",
    date: "2025-06-18",
    readingTime: 10,
    tags: ["stock opname", "inventory", "audit", "reconciliation"],
    author: "Tim Tokoflow",
    image: "/images/panduan/stock-opname.png",
    icon: Package,
  },
  {
    id: 6,
    title: "Automasi Laporan Keuangan dengan Tokoflow",
    slug: "automasi-laporan-keuangan",
    excerpt: "Setting auto-generate laporan harian, mingguan, bulanan. Export ke Excel atau PDF otomatis untuk kebutuhan accounting.",
    category: "reporting",
    categoryLabel: "Financial Reporting",
    date: "2025-06-05",
    readingTime: 8,
    tags: ["laporan", "keuangan", "automasi", "accounting"],
    author: "Tim Tokoflow",
    image: "/images/panduan/financial-automation.png",
    icon: BarChart2,
  },
  {
    id: 7,
    title: "Optimasi Inventory Turnover: Kurangi Dead Stock",
    slug: "optimasi-inventory-turnover",
    excerpt: "Formula dan strategi meningkatkan inventory turnover. Identifikasi slow moving items dan action plan untuk liquidasi.",
    category: "inventory",
    categoryLabel: "Inventory Tips",
    date: "2025-06-12",
    readingTime: 10,
    tags: ["inventory turnover", "dead stock", "optimasi", "efficiency"],
    author: "Tim Tokoflow",
    image: "/images/panduan/inventory-turnover.png",
    icon: Package,
  },
  {
    id: 8,
    title: "Integrasi Marketplace: Shopee, Tokopedia, TikTok Shop",
    slug: "integrasi-marketplace-lengkap",
    excerpt: "Tutorial lengkap connect Tokoflow dengan marketplace populer. Sync otomatis order, stok, dan reconciliation penjualan.",
    category: "integration",
    categoryLabel: "Integration Guide",
    date: "2025-06-08",
    readingTime: 20,
    tags: ["integrasi", "marketplace", "shopee", "tokopedia", "tiktok"],
    author: "Tim Tokoflow",
    image: "/images/panduan/marketplace-integration.png",
    icon: ShoppingCart,
  },
  {
    id: 9,
    title: "Analisis Profit Margin per SKU dan Channel",
    slug: "analisis-profit-margin-detail",
    excerpt: "Deep dive cara hitung true profit margin. Include semua cost: modal, packing, fee, shipping. Strategi optimize margin.",
    category: "analytics",
    categoryLabel: "Profit Analysis",
    date: "2025-06-03",
    readingTime: 15,
    tags: ["profit margin", "analisis", "costing", "pricing strategy"],
    author: "Tim Tokoflow",
    image: "/images/panduan/profit-analysis.png",
    icon: TrendingUp,
  },
  {
    id: 10,
    title: "Bundle Product Strategy: Boost AOV & Clear Stock",
    slug: "bundle-product-strategy",
    excerpt: "Cara create bundle product yang profitable. Strategi clear slow moving dengan fast moving, pricing psychology, dan execution.",
    category: "sales",
    categoryLabel: "Sales Strategy",
    date: "2025-06-01",
    readingTime: 12,
    tags: ["bundle", "strategy", "aov", "sales"],
    author: "Tim Tokoflow",
    image: "/images/panduan/bundle-strategy.png",
    icon: ShoppingCart,
  },
];

// Combine imported posts with additional posts
const initialPanduanPosts = [...importedPosts, ...additionalPosts].map((post, index) => ({
  ...post,
  id: index + 1,
  author: post.author || "Tim Tokoflow",
  image: post.image || post.imageUrl || "/images/panduan/default.png",
}));

const generateCategories = (posts) => {
  const categoryCounts = posts.reduce((acc, post) => {
    acc[post.categoryLabel] = (acc[post.categoryLabel] || 0) + 1;
    return acc;
  }, {});

  return [
    { label: 'Semua', count: posts.length },
    ...Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }))
  ];
};

const formatDate = (dateString) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

export default function PanduanClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  
  const categories = useMemo(() => generateCategories(initialPanduanPosts), []);

  const filteredPosts = useMemo(() => {
    let filtered = initialPanduanPosts;

    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(post => post.categoryLabel === selectedCategory);
    }

    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(lowerSearchQuery) ||
        post.excerpt.toLowerCase().includes(lowerSearchQuery) ||
        (post.author && post.author.toLowerCase().includes(lowerSearchQuery)) ||
        post.tags.some(tag => tag.toLowerCase().includes(lowerSearchQuery))
      );
    }

    return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-700">
      <PublicNav />
      
      <main className="flex-grow pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Badge variant="success" className="mb-4">
              RESOURCE CENTER
            </Badge>
            <H1 className="mb-4">
              Panduan Inventory & Sales Management
            </H1>
            <P className="text-base sm:text-lg max-w-2xl mx-auto">
              Tutorial lengkap, best practices, dan tips praktis untuk mengelola inventory dan penjualan multi-channel. 
              Ditulis oleh praktisi untuk UMKM Indonesia.
            </P>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="pb-8 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="#inventory" className="group">
                <div className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-700 group-hover:text-gray-900" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Inventory Tips</p>
                </div>
              </Link>
              <Link href="#sales" className="group">
                <div className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-700 group-hover:text-gray-900" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Sales Strategy</p>
                </div>
              </Link>
              <Link href="#analytics" className="group">
                <div className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition">
                  <BarChart2 className="w-8 h-8 mx-auto mb-2 text-gray-700 group-hover:text-gray-900" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Analytics</p>
                </div>
              </Link>
              <Link href="#integration" className="group">
                <div className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-700 group-hover:text-gray-900" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Growth Tips</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="pb-8 md:pb-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="space-y-6">
              {/* Search Bar */}
              <div>
                <label htmlFor="search-panduan" className="sr-only">Cari panduan</label>
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="search-panduan"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari panduan..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-black focus:border-black transition"
                  />
                </div>
              </div>

              {/* Topic Filter */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-3">Filter berdasarkan topik:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.map(category => (
                    <button
                      key={category.label}
                      onClick={() => setSelectedCategory(category.label)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 ${
                        selectedCategory === category.label
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.label}
                      <span className="ml-1 text-xs opacity-70">({category.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panduan List Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="space-y-8">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, index) => {
                  const Icon = post.icon || Package;
                  return (
                    <article key={post.id} className={`py-6 ${index !== filteredPosts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                      <Link href={`/panduan/${post.slug}`} className="group block">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          {/* Icon for Mobile at top */}
                          <div className="sm:hidden w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            <Icon className="w-16 h-16 text-gray-400" />
                          </div>
                          
                          {/* Text Content */}
                          <div className="flex-1">
                            
                            {/* Panduan Title */}
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors duration-200 line-clamp-2">
                              {post.title}
                            </h2>
                            
                            {/* Panduan Excerpt */}
                            <p className="mt-2 text-sm sm:text-base text-gray-600 line-clamp-2 sm:line-clamp-3">
                              {post.excerpt}
                            </p>

                            {/* Metadata */}
                            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-x-3 text-xs text-gray-500">
                              <span>{formatDate(post.date)}</span>
                              <span className="hidden sm:inline">·</span>
                              <span>{post.readingTime} min read</span>
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                {post.categoryLabel}
                              </span>
                              {post.author && (
                                <>
                                  <span className="hidden sm:inline">·</span>
                                  <span>{post.author}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Icon for Desktop */}
                          <div className="hidden sm:flex flex-shrink-0 w-32 h-32 md:w-40 md:h-28 lg:w-48 lg:h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden items-center justify-center">
                            <Icon className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <p className="text-base sm:text-lg font-medium text-gray-900">Tidak ada panduan yang ditemukan.</p>
                  <p className="text-sm sm:text-base text-gray-500 mt-2">Coba ganti kata kunci atau filter kategori Anda.</p>
                </div>
              )}
            </div>

            {/* Load More / Pagination (if needed in future) */}
            {filteredPosts.length > 10 && (
              <div className="mt-12 text-center">
                <Button variant="outline">
                  Load More Articles
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <H2 className="mb-4">Stay Updated dengan Tips Terbaru</H2>
            <P className="mb-8 max-w-2xl mx-auto">
              Dapatkan panduan eksklusif, case study, dan tips praktis langsung ke inbox Anda. 
              Join 5,000+ UMKM yang sudah subscribe.
            </P>
            <form className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Email Anda"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                required
              />
              <Button type="submit">
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              No spam, unsubscribe kapan saja.
            </p>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}