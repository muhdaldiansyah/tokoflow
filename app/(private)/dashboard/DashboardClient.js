"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  FileText, 
  Plus, 
  ArrowUp,
  ArrowDown,
  DollarSign,
  Box
} from "lucide-react";

export default function DashboardClient({ user, profile, stats }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard TokoFlow</h1>
        <p className="text-gray-600 mt-1">
          Selamat datang, {profile?.full_name || user.email}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Total Omzet */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Omzet</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalOmzet)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalProfit)}
              </p>
              <p className="text-sm text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 inline" />
                {stats.profitMargin.toFixed(1)}% margin
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {stats.totalTransaksi}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Stok Kritis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stok Kritis</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {stats.stokKritis}
              </p>
              <p className="text-sm text-red-600 mt-1">
                <ArrowDown className="h-3 w-3 inline" />
                Perlu restock
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <Box className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/sales"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-blue-50 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Input Penjualan</p>
              <p className="text-sm text-gray-600">Catat transaksi baru</p>
            </div>
          </Link>

          <Link
            href="/incoming-goods"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-green-50 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Barang Masuk</p>
              <p className="text-sm text-gray-600">Update stok barang</p>
            </div>
          </Link>

          <Link
            href="/sales-history"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-purple-50 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Lihat Laporan</p>
              <p className="text-sm text-gray-600">Analisis penjualan</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terkini</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Power Bank terjual 10 unit</p>
              <p className="text-sm text-gray-600">Channel: Shopee • 2 jam yang lalu</p>
            </div>
            <p className="font-medium text-green-600 mt-2 sm:mt-0">+{formatCurrency(1000000)}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Stok Kardus Small ditambah 100 unit</p>
              <p className="text-sm text-gray-600">Barang masuk • 5 jam yang lalu</p>
            </div>
            <p className="font-medium text-blue-600 mt-2 sm:mt-0">+100 unit</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">HP terjual 5 unit</p>
              <p className="text-sm text-gray-600">Channel: TikTok • 1 hari yang lalu</p>
            </div>
            <p className="font-medium text-green-600 mt-2 sm:mt-0">+{formatCurrency(500000)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
