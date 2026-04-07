// app/tentang/TentangClient.js
"use client";

import React from "react";
import Link from "next/link";

// Import Nav and Footer components
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";

// UI Components
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, H1, H2, H3, P, Lead } from '../../components/ui';

// Icons
import { Package, TrendingUp, CheckSquare, Heart, RefreshCw, Users, Target, Award, Shield, Globe } from 'lucide-react';

// Import data
import { coreValues as importedCoreValues, WHATSAPP_LINK } from '../../page_data';

/* --------------------------------------------------------------------- */
/* 1. DATA */
/* --------------------------------------------------------------------- */

// Timeline milestones
const milestones = [
  {
    year: "2025",
    title: "Lahir dari Kebutuhan",
    description: "Tokoflow dimulai dari pengalaman nyata mengelola inventory multi-channel yang terlalu kompleks untuk spreadsheet.",
  },
  {
    year: "2026",
    title: "Early Access Launch",
    description: "Core features siap: inventory tracking, profit calculation, multi-channel analytics. Membuka akses untuk merchant pertama.",
  },
  {
    year: "Next",
    title: "Growth & Integration",
    description: "Integrasi marketplace API, mobile app, dan fitur-fitur baru berdasarkan feedback langsung dari early adopters.",
  },
];

// Team stats
const teamStats = [
  { number: "Indonesian", label: "Built & Supported" },
  { number: "Cloud", label: "Infrastructure" },
  { number: "Early Access", label: "Now Open" },
  { number: "Direct", label: "Developer Support" },
];

/* --------------------------------------------------------------------- */
/* 2. REUSABLE SECTION HEADING COMPONENT */
/* --------------------------------------------------------------------- */

const SectionHeading = ({ subtitle, title, description, center = true }) => (
  <div className={`${center ? 'text-center' : ''} mb-12`}>
    {subtitle && (
      <Badge variant="secondary" className="mb-3">
        {subtitle}
      </Badge>
    )}
    <H2 className="mb-3">
      {title}
    </H2>
    {description && (
      <P className={`${center ? 'max-w-2xl mx-auto' : ''}`}>
        {description}
      </P>
    )}
  </div>
);

/* --------------------------------------------------------------------- */
/* 3. PAGE COMPONENT */
/* --------------------------------------------------------------------- */

export default function TentangClient() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-700 overflow-x-hidden">
      <PublicNav />

      <main className="flex-grow flex flex-col pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center">
              {/* Breadcrumb */}
              <Badge variant="secondary" className="mb-8">
                TENTANG TOKOFLOW
              </Badge>

              {/* Main Content */}
              <div className="space-y-4">
                <H1>Platform Inventory & Sales untuk UMKM Indonesia</H1>

                <Lead className="max-w-3xl mx-auto">
                  Tokoflow lahir dari pengalaman nyata UMKM yang kesulitan manage inventory dan penjualan multi-channel. 
                  Kami hadir untuk demokratisasi teknologi enterprise agar terjangkau untuk semua skala bisnis.
                </Lead>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {teamStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              subtitle="OUR STORY"
              title="Dari Frustrasi ke Solusi"
              description="Perjalanan kami membangun platform yang membantu ribuan UMKM Indonesia"
            />

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <P className="mb-4">
                  Mengelola inventory multi-channel dengan spreadsheet itu menyakitkan.
                  Stok tidak match, double selling di marketplace, fee berbeda-beda tiap channel.
                  Profit? Terlalu ribet untuk dihitung manual kalau harus include modal, packing, dan fee.
                </P>
                <P className="mb-4">
                  Software inventory yang ada? Terlalu mahal atau terlalu kompleks untuk UMKM.
                  Yang affordable? Fiturnya kurang lengkap, tidak support multi-channel Indonesia.
                </P>
                <P className="mb-4">
                  Dari situlah Tokoflow lahir. Dengan misi sederhana:
                  <strong> membuat teknologi inventory management yang powerful tapi tetap simple dan affordable untuk UMKM.</strong>
                </P>
                <P>
                  Saat ini Tokoflow dalam tahap Early Access — kami sedang onboarding merchant pertama
                  yang akan membentuk masa depan platform ini bersama kami.
                </P>
              </div>

              <div>
                <Card className="p-6 bg-gray-50">
                  <div className="space-y-6">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.year} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{milestone.year.slice(-2)}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Visi & Misi Section */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              subtitle="VISION & MISSION"
              title="Tujuan Kami"
            />

            <div className="grid md:grid-cols-2 gap-8">
              {/* Vision Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <H3 className="text-lg">Visi</H3>
                  </div>
                  <P>
                    Menjadi platform inventory dan sales management #1 di Indonesia yang memberdayakan UMKM 
                    untuk bersaing di era digital dengan teknologi yang accessible dan affordable.
                  </P>
                </CardContent>
              </Card>

              {/* Mission Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <H3 className="text-lg">Misi</H3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                        <span className="text-gray-700 text-xs font-medium">1</span>
                      </div>
                      <P className="text-sm">
                        <strong>Simplify complexity</strong>: Membuat inventory management yang powerful tapi tetap user-friendly untuk non-tech users.
                      </P>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                        <span className="text-gray-700 text-xs font-medium">2</span>
                      </div>
                      <P className="text-sm">
                        <strong>Affordable technology</strong>: Harga yang masuk akal untuk UMKM dengan ROI yang jelas dan terukur.
                      </P>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                        <span className="text-gray-700 text-xs font-medium">3</span>
                      </div>
                      <P className="text-sm">
                        <strong>Local first</strong>: Support marketplace lokal, bahasa Indonesia, dan understanding of local business culture.
                      </P>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              subtitle="CORE VALUES"
              title="Nilai yang Kami Pegang"
              description="Prinsip yang membimbing setiap keputusan dan inovasi kami"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {importedCoreValues.map((value, index) => (
                <Card key={value.title}>
                  <CardContent className="pt-6">
                    {/* Icon */}
                    <div className="mb-4">
                      {value.icon}
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <H3 className="text-base">{value.title}</H3>
                      <P className="text-sm">{value.description}</P>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              subtitle="OUR TEAM"
              title="Tim di Balik Tokoflow"
              description="Passionate individuals dengan satu misi: membantu UMKM Indonesia sukses"
            />

            <div className="text-center">
              <Card className="max-w-2xl mx-auto p-8">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <P className="mb-6">
                  Tokoflow dibangun oleh tim kecil yang fokus: satu masalah, satu solusi, tanpa birokrasi.
                  Setiap early adopter berkomunikasi langsung dengan orang yang membangun sistemnya —
                  bukan bot, bukan CS scripted.
                </P>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <Badge variant="outline">Engineering</Badge>
                  <Badge variant="outline">Product</Badge>
                  <Badge variant="outline">Design</Badge>
                  <Badge variant="outline">Customer Success</Badge>
                  <Badge variant="outline">Marketing</Badge>
                </div>
              </Card>

              <P className="mt-8 text-sm text-gray-500">
                Interested to join our mission? Check our{" "}
                <Link href="/careers" className="underline">
                  careers page
                </Link>
              </P>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              subtitle="TECHNOLOGY"
              title="Dibangun dengan Stack Modern"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center p-6">
                <Shield className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h4 className="font-semibold mb-1">Cloud Infrastructure</h4>
                <p className="text-sm text-gray-600">Enterprise hosting dengan enkripsi & backup otomatis</p>
              </Card>
              <Card className="text-center p-6">
                <Globe className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h4 className="font-semibold mb-1">Modern Web App</h4>
                <p className="text-sm text-gray-600">Next.js, React — akses dari browser manapun</p>
              </Card>
              <Card className="text-center p-6">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <h4 className="font-semibold mb-1">Real-time Analytics</h4>
                <p className="text-sm text-gray-600">Dashboard profit & inventory yang selalu up-to-date</p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div>
              <Badge className="mb-4 bg-white/10 text-white border-0">
                JOIN OUR JOURNEY
              </Badge>
              <H2 className="text-white mb-4">
                Mari Grow Bersama Tokoflow
              </H2>
              <P className="text-white/70 max-w-2xl mx-auto mb-8">
                Bergabung dengan program Early Access Tokoflow.
                Free trial 14 hari, no credit card required. Harga spesial untuk early adopters.
              </P>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register" className="inline-flex items-center">
                    Start Free Trial
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" asChild className="bg-white/10 hover:bg-white/20">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    Chat dengan Sales
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Global styles */}
      <style jsx global>{`
        /* Remove any default list styling */
        ul, li {
          list-style-type: none;
          margin: 0;
          padding: 0;
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}