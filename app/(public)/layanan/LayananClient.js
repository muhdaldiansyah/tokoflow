// app/layanan/LayananClient.js
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '../components/PublicNav';
import Footer from '../components/Footer';

// UI Components
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, H1, H2, H3, P, Lead } from '../components/ui';

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
import { WHATSAPP_LINK } from '../page_data';

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
      pricing: "Mulai 299rb/bln",
      description:
        "Kelola stok multi-SKU dengan tracking real-time, alert stok minimum, dan manajemen bundle produk.",
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

  // Portfolio data for Tokoflow implementations
  const portfolioSection = {
    title: "Success Stories",
    subtitle: "Implementasi Tokoflow di Berbagai Bisnis",
    description: "Lihat bagaimana Tokoflow membantu UMKM dan online shop meningkatkan efisiensi operasional.",
    projects: [
      {
        name: "Toko Elektronik Jaya Abadi",
        type: "Retail Electronics",
        category: "Inventory + Multi-channel",
        headline: "Dari Catat Manual ke Dashboard Real-time!",
        description: "Transformasi dari pencatatan manual ke sistem inventory otomatis. Stok tersinkronisasi real-time antara toko offline dan 3 marketplace (Shopee, Tokopedia, TikTok Shop). Sales naik 40% karena tidak pernah kehabisan stok produk best seller.",
        landingImage: "/portfolio/tokoflow-electronics.png",
        systemImage: "/portfolio/tokoflow-dashboard.png",
        landingLabel: "Dashboard Overview",
        systemLabel: "Real-time Inventory",
        features: ["Multi-channel Sync", "Stock Alert", "Profit Analytics", "Barcode Scanner"],
        results: {
          salesIncrease: "40%",
          stockAccuracy: "99.5%",
          timeReduction: "70%"
        }
      },
      {
        name: "Fashion Online Shop",
        type: "Fashion E-commerce",
        category: "Sales Analytics",
        headline: "Multi-channel Jadi Mudah: Shopee, Tokped, TikTok!",
        description: "Sebelumnya butuh 3 admin untuk handle 3 marketplace. Dengan Tokoflow, cukup 1 admin karena semua order masuk ke satu sistem. Fee marketplace otomatis terhitung, profit per channel jelas. Hemat biaya operasional 70%.",
        landingImage: "/portfolio/tokoflow-fashion.png",
        systemImage: "/portfolio/tokoflow-multichannel.png",
        landingLabel: "Order Management",
        systemLabel: "Channel Analytics",
        features: ["Centralized Orders", "Auto Fee Calculation", "Channel Comparison", "Bulk Update"],
        results: {
          costReduction: "70%",
          orderProcessing: "3x faster",
          channels: "5 marketplaces"
        }
      },
      {
        name: "Distributor Produk Kesehatan",
        type: "B2B Distribution",
        category: "Business Intelligence",
        headline: "Profit Margin Jelas, Keputusan Bisnis Tepat!",
        description: "Dengan detail cost breakdown (modal, packing, fee, affiliate), owner bisa identifikasi produk high-margin dan channel paling efisien. Fokus pada produk profitable, stop produk rugi. Net profit naik 60% dalam 6 bulan.",
        landingImage: "/portfolio/tokoflow-distributor.png",
        systemImage: "/portfolio/tokoflow-analytics.png",
        landingLabel: "Profit Analysis",
        systemLabel: "Product Performance",
        features: ["Cost Breakdown", "Margin Analysis", "Sales Forecast", "Decision Support"],
        results: {
          profitIncrease: "60%",
          productOptimization: "25 SKU cut",
          dataAccuracy: "100%"
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
                Tim support lokal siap membantu implementasi.
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