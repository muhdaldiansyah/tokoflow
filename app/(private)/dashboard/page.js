"use client";

import { useAuth } from "../../hooks/useAuthSimple";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  Boxes,
  Store,
  FileText,
  Settings,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile } = useAuth();

  const features = [
    {
      title: "Product Management",
      description: "Kelola produk dan komposisi barang dengan mudah",
      icon: Package,
      color: "blue",
      href: "/products"
    },
    {
      title: "Sales & Orders",
      description: "Input penjualan dan lihat riwayat transaksi",
      icon: ShoppingCart,
      color: "green",
      href: "/sales"
    },
    {
      title: "Inventory Management",
      description: "Pantau stok, barang masuk, dan adjustment",
      icon: Boxes,
      color: "purple",
      href: "/inventory"
    },
    {
      title: "Financial & Fees",
      description: "Kelola biaya marketplace dan laporan keuangan",
      icon: BarChart3,
      color: "orange",
      href: "/marketplace-fees"
    }
  ];

  const quickActions = [
    {
      title: "Input Penjualan",
      description: "Catat transaksi penjualan baru",
      href: "/sales",
      icon: ShoppingCart,
      color: "bg-blue-500"
    },
    {
      title: "Barang Masuk",
      description: "Update stok barang masuk",
      href: "/incoming-goods",
      icon: Boxes,
      color: "bg-green-500"
    },
    {
      title: "Lihat Inventory",
      description: "Cek stok dan status barang",
      href: "/inventory",
      icon: Package,
      color: "bg-purple-500"
    },
    {
      title: "Laporan Penjualan",
      description: "Analisis data penjualan",
      href: "/sales-history",
      icon: FileText,
      color: "bg-orange-500"
    }
  ];

  const systemBenefits = [
    "Multi-channel marketplace integration (Shopee, Tokopedia, TikTok Shop)",
    "Real-time inventory tracking",
    "Automated profit calculation",
    "Product composition management",
    "Comprehensive sales analytics",
    "Indonesian UMKM focused features"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Selamat Datang di TokoFlow
        </h1>
        <p className="text-gray-600 mt-2">
          Halo, {profile?.full_name || user?.email || 'User'}! Kelola inventory dan penjualan Anda dengan mudah.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fitur Utama TokoFlow</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colorClasses = {
              blue: "bg-blue-50 border-blue-200 text-blue-700",
              green: "bg-green-50 border-green-200 text-green-700",
              purple: "bg-purple-50 border-purple-200 text-purple-700",
              orange: "bg-orange-50 border-orange-200 text-orange-700"
            };

            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start">
                  <div className={`p-3 rounded-lg ${colorClasses[feature.color]} mr-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Benefits */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Keunggulan Sistem</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemBenefits.map((benefit, index) => (
            <div key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Mulai Gunakan TokoFlow</h2>
        <p className="text-gray-700 mb-4">
          Sistem inventory dan penjualan terintegrasi untuk UMKM Indonesia.
          Kelola multi-channel marketplace dengan mudah dan efisien.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="h-4 w-4 mr-2" />
            Kelola Produk
          </Link>
          <Link
            href="/sales"
            className="inline-flex items-center justify-center px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Input Penjualan
          </Link>
        </div>
      </div>
    </div>
  );
}