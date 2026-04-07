// app/layanan/LayananClient.js
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '../../components/PublicNav';
import Footer from '../../components/Footer';

// UI Components
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, H1, H2, H3, P, Lead } from '../../components/ui';

import {
  // Service Icons
  Package, // Inventory
  ShoppingCart, // Multi-channel Sales
  BarChart2, // Analytics
  Database, // Data Management
  Settings, // System Integration
  Smartphone, // Mobile Access
  
  // Feature Icons
  CheckCircle,
  ChevronRight,
  Phone,
  
  // Supporting Icons
  Zap,
  Shield,
  Award,
  Globe,
  TrendingUp,
  Calculator,
  Users,
  RefreshCw,
} from 'lucide-react';

// Import data
import { WHATSAPP_LINK } from '../../page_data';

// Helper component for section heading using UI components
const SectionHeading = ({ subtitle, title, description, center = true, dark = false }) => (
  <div className={`${center ? 'text-center' : ''} mb-12`}>
    {subtitle && (
      <Badge variant={dark ? "default" : "secondary"} className="mb-3">
        {subtitle}
      </Badge>
    )}
    <H2 className={`mb-3 ${dark ? 'text-white' : ''}`}>
      {title}
    </H2>
    {description && (
      <P className={`${center ? 'max-w-2xl mx-auto' : ''} ${dark ? 'text-white/70' : ''}`}>
        {description}
      </P>
    )}
  </div>
);

export default function LayananClient() {
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    imageSrc: '',
    imageAlt: ''
  });

  const openLightbox = (imageSrc, imageAlt) => {
    setLightbox({
      isOpen: true,
      imageSrc,
      imageAlt
    });
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightbox({
      ...lightbox,
      isOpen: false
    });
    document.body.style.overflow = 'auto';
  };

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && lightbox.isOpen) {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [lightbox.isOpen]);

  // Main services data for Tokoflow
  const mainServices = [
    {
      icon: Package,
      title: "Inventory Management",
      pricing: "Early Access",
      description:
        "Kelola stok multi-SKU dengan tracking real-time, catat barang masuk, dan manajemen bundle produk.",
      features: [
        "Real-time Stock Tracking",
        "Incoming Goods Management",
        "Stock Adjustment & Audit Trail",
        "Bundle Product Management",
        "SKU-based Product Catalog",
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
        "Auto Fee Calculation per Channel",
        "Channel Performance Analytics",
        "Per-transaction Profit Tracking",
        "Sales History & CSV Export",
        "Marketplace API Sync (Segera Hadir)",
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
        "Real-time Profit Dashboard",
        "Cost Breakdown per SKU",
        "Channel Margin Comparison",
        "Product Performance Ranking",
        "Sales Trend Analysis",
      ],
      highlight: "Cocok untuk: Bisnis yang mau tahu profit sebenarnya",
    },
  ];

  // Portfolio data for Tokoflow implementations
  const portfolioSection = {
    title: "Skenario Penggunaan",
    subtitle: "Bagaimana Tokoflow Membantu Berbagai Bisnis",
    description: "Lihat bagaimana fitur Tokoflow bisa menyelesaikan masalah inventory dan profit tracking di berbagai jenis bisnis.",
    projects: [
      {
        name: "Toko Retail Multi-channel",
        type: "Retail / E-commerce",
        category: "Inventory + Profit Tracking",
        headline: "Dari spreadsheet ke dashboard profit otomatis",
        description: "UMKM dengan ratusan SKU yang jualan di beberapa marketplace bisa track stok real-time dan hitung profit bersih per transaksi otomatis. Fee marketplace berbeda per channel? Tokoflow hitung semua — modal, packing, fee, affiliate — jadi profit sebenarnya selalu terlihat.",
        landingImage: "/images/hero.PNG",
        systemImage: "/images/hero.PNG",
        landingLabel: "Dashboard Overview",
        systemLabel: "Profit Analytics",
        features: ["Auto Fee Calculation", "Real-time Stock", "Profit per Channel", "CSV Export"],
        results: {
          keuntungan: "Profit terlihat jelas",
          stok: "Real-time update",
          waktu: "Rekap otomatis"
        }
      },
      {
        name: "Online Shop dengan Produk Bundle",
        type: "Fashion / Consumer Goods",
        category: "Product Compositions",
        headline: "Kelola bundle & komponen tanpa ribet",
        description: "Bisnis yang jual produk bundle/paket bisa setup komposisi produk — saat bundle terjual, stok semua komponen otomatis berkurang. Tidak perlu lagi hitung manual stok komponen satu per satu.",
        landingImage: "/images/hero.PNG",
        systemImage: "/images/hero.PNG",
        landingLabel: "Bundle Setup",
        systemLabel: "Component Tracking",
        features: ["Product Compositions", "Auto Stock Deduction", "Cost per Bundle", "Incoming Goods"],
        results: {
          keuntungan: "Zero kesalahan stok",
          stok: "Auto-update komponen",
          waktu: "Setup sekali, jalan terus"
        }
      },
      {
        name: "Distributor & Grosir",
        type: "B2B / Distribution",
        category: "Cost Management",
        headline: "Detail biaya per SKU, margin per channel",
        description: "Set cost breakdown lengkap per produk — modal, biaya packing, persentase affiliate. Setiap penjualan langsung terlihat margin bersihnya. Identifikasi produk high-margin untuk di-push dan produk yang perlu di-review pricing-nya.",
        landingImage: "/images/hero.PNG",
        systemImage: "/images/hero.PNG",
        landingLabel: "Cost Configuration",
        systemLabel: "Margin Analysis",
        features: ["Cost Breakdown per SKU", "Margin Analysis", "Channel Comparison", "Stock Adjustments"],
        results: {
          keuntungan: "Margin per SKU jelas",
          stok: "Adjustment audit trail",
          waktu: "Data-driven decisions"
        }
      }
    ]
  };

  // Additional services/features
  const additionalFeatures = [
    {
      icon: Database,
      title: "Data Migration & Setup",
      description: "Import data dari Excel/CSV, setup awal SKU, konfigurasi marketplace, dan training tim.",
    },
    {
      icon: Settings,
      title: "Custom Integration",
      description: "Integrasi dengan sistem POS, ERP, atau aplikasi custom sesuai kebutuhan bisnis.",
    },
    {
      icon: Smartphone,
      title: "Mobile App Access",
      description: "Akses dari mana saja dengan mobile app untuk cek stok, input transaksi, dan monitoring.",
    },
    {
      icon: Users,
      title: "Multi-user Management",
      description: "Role-based access control untuk owner, admin, warehouse, dan sales team.",
    },
    {
      icon: Shield,
      title: "Data Security & Backup",
      description: "Backup otomatis setiap jam, enkripsi data, dan audit trail lengkap.",
    },
    {
      icon: RefreshCw,
      title: "Continuous Updates",
      description: "Update fitur reguler berdasarkan feedback user dan integrasi marketplace terbaru.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-700 overflow-x-hidden">
      <PublicNav />

      <main className="flex-grow pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="success" className="mb-3">
                SOLUSI TERINTEGRASI
              </Badge>
              <H1 className="mb-4">
                Layanan Sistem Inventory & Penjualan Lengkap
              </H1>
              <Lead className="max-w-3xl mx-auto">
                Tiga pilar layanan utama Tokoflow: Inventory Management yang akurat, 
                Multi-channel Sales yang efisien, dan Business Intelligence untuk keputusan data-driven.
              </Lead>
            </div>
          </div>
        </section>

        {/* Main Services Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
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

        {/* Additional Features Grid */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              subtitle="FITUR LENGKAP"
              title="Semua yang Anda Butuhkan dalam Satu Platform"
              description="Tokoflow dilengkapi dengan berbagai fitur pendukung untuk memastikan operasional bisnis berjalan lancar"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {additionalFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                    <Icon className="w-8 h-8 text-gray-700 mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="portfolio" className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              subtitle="SUCCESS STORIES"
              title={portfolioSection.title}
              description={portfolioSection.description}
            />

            <div className="space-y-12 mt-12">
              {portfolioSection.projects.map((project, index) => (
                <Card key={index} className="p-6">
                  {/* Project Header */}
                  <div className="mb-6">
                    <H3 className="mb-1">{project.name}</H3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-500">{project.type}</span>
                      <span className="text-gray-300">•</span>
                      <Badge variant="secondary">
                        {project.category}
                      </Badge>
                    </div>
                    {/* Result-focused headline */}
                    <div className="inline-flex items-center px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                      <svg className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-green-800">
                        {project.headline}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Project Description */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                      <P className="mb-6">{project.description}</P>
                      
                      {/* Results metrics */}
                      {project.results && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Key Results:</h4>
                          <div className="space-y-2">
                            {Object.entries(project.results).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-medium text-gray-900">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {project.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline" size="default">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Project Images */}
                    <div className="lg:col-span-2 order-1 lg:order-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="rounded-lg overflow-hidden border border-gray-200 h-full">
                          <div
                            onClick={() => openLightbox(project.landingImage, `${project.name} - ${project.landingLabel}`)}
                            className="relative aspect-video w-full cursor-pointer">
                            <Image
                              src={project.landingImage}
                              alt={`${project.name} - ${project.landingLabel}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 flex items-center justify-center">
                              <div className="p-2 bg-white bg-opacity-0 hover:bg-opacity-70 rounded-full transform scale-90 hover:scale-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white hover:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white py-2 px-3 text-xs text-gray-500 border-t border-gray-100">{project.landingLabel}</div>
                        </div>
                      </div>

                      <div>
                        <div className="rounded-lg overflow-hidden border border-gray-200 h-full">
                          <div
                            onClick={() => openLightbox(project.systemImage, `${project.name} - ${project.systemLabel}`)}
                            className="relative aspect-video w-full cursor-pointer">
                            <Image
                              src={project.systemImage}
                              alt={`${project.name} - ${project.systemLabel}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 flex items-center justify-center">
                              <div className="p-2 bg-white bg-opacity-0 hover:bg-opacity-70 rounded-full transform scale-90 hover:scale-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white hover:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white py-2 px-3 text-xs text-gray-500 border-t border-gray-100">
                            {project.systemLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div>
              <Badge className="mb-4 bg-white/10 text-white border-0">
                MULAI TRANSFORMASI DIGITAL
              </Badge>
              <H2 className="text-white mb-4">
                Siap Tingkatkan Efisiensi Operasional Bisnis Anda?
              </H2>
              <P className="text-white/70 max-w-2xl mx-auto mb-8">
                Free trial 14 hari untuk semua fitur. Konsultasi gratis untuk analisis kebutuhan bisnis Anda.
                Direct support dari developer.
              </P>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" asChild className="bg-white text-gray-900 border-white hover:bg-gray-100">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Konsultasi via WhatsApp
                </a>
              </Button>
              <Button size="lg" variant="ghost" asChild className="bg-white/10 text-white hover:bg-white/20">
                <Link href="/investasi">
                  Lihat Pricing
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Image Lightbox/Modal */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="relative max-w-7xl w-full max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full text-white hover:scale-105"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative w-full h-[75vh] flex items-center justify-center bg-white">
              <Image
                src={lightbox.imageSrc}
                alt={lightbox.imageAlt}
                fill
                sizes="100vw"
                style={{ objectFit: 'contain' }}
                className="object-contain p-4"
                loading="eager"
                priority
              />

              <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 py-3 px-4 text-sm text-gray-700 border-t border-gray-200 shadow-md">
                <p className="font-medium text-gray-900">{lightbox.imageAlt}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}