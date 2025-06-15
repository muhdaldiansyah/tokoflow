"use client";

import { useState } from "react";

export default function RekapPenjualanPage() {
  const [rekapData] = useState([
    {
      id: 1,
      tanggal: "2025-05-19",
      sku: "#012025",
      namaProduk: "Power Bank",
      hargaJual: 100000,
      qty: 9,
      channel: "Shopee",
      modal: 50000,
      packing: 2000,
      biayaAffiliate: 90000,
      biayaFee: 90000,
      omzet: 900000,
      profit: 252000
    },
    {
      id: 2,
      tanggal: "2025-05-18",
      sku: "#012025",
      namaProduk: "Power Bank",
      hargaJual: 100000,
      qty: 10,
      channel: "Shopee",
      modal: 50000,
      packing: 2000,
      biayaAffiliate: 100000,
      biayaFee: 100000,
      omzet: 1000000,
      profit: 280000
    }
  ]);

  const [filter, setFilter] = useState({
    startDate: "",
    endDate: "",
    channel: "",
    sku: ""
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate totals
  const totals = rekapData.reduce((acc, item) => {
    acc.qty += item.qty;
    acc.omzet += item.omzet;
    acc.profit += item.profit;
    return acc;
  }, { qty: 0, omzet: 0, profit: 0 });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Rekap Penjualan</h1>
      
      {/* Filters */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel
            </label>
            <select
              name="channel"
              value={filter.channel}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Channel</option>
              <option value="Shopee">Shopee</option>
              <option value="Tiktok">Tiktok</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={filter.sku}
              onChange={handleFilterChange}
              placeholder="Filter SKU..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Transaksi</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{rekapData.length}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Quantity</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totals.qty}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Omzet</h3>
          <p className="mt-1 text-lg sm:text-xl font-semibold text-gray-900">
            Rp {totals.omzet.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
          <p className="mt-1 text-lg sm:text-xl font-semibold text-green-600">
            Rp {totals.profit.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Produk
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Jual
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Omzet
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rekapData.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.tanggal).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.namaProduk}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {item.hargaJual.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.qty}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.channel}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {item.omzet.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    Rp {item.profit.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
