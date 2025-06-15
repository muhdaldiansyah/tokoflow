"use client";

import { useState, useEffect } from "react";

export default function InventoriPage() {
  const [inventoriData, setInventoriData] = useState([
    { sku: "#012025", namaProduk: "Power Bank", stok: 50 },
    { sku: "#012026", namaProduk: "Power Bank + USB", stok: 100 },
    { sku: "#012027", namaProduk: "HP", stok: 20 },
    { sku: "#9910", namaProduk: "Kardus Small", stok: 100 },
    { sku: "#9911", namaProduk: "Kardus Big", stok: 100 },
  ]);

  const [filter, setFilter] = useState("");

  const filteredData = inventoriData.filter(item => 
    item.sku.toLowerCase().includes(filter.toLowerCase()) ||
    item.namaProduk.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Inventori</h1>
      
      {/* Search Filter */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cari Produk
          </label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cari berdasarkan SKU atau nama produk..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.sku}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.namaProduk}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-semibold ${item.stok < 0 ? 'text-red-600' : item.stok < 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {item.stok}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.stok < 0 
                        ? 'bg-red-100 text-red-800' 
                        : item.stok < 20 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.stok < 0 ? 'Stok Negatif' : item.stok < 20 ? 'Stok Rendah' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data yang cocok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Total SKU</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{inventoriData.length}</p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Stok Rendah</h3>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {inventoriData.filter(item => item.stok < 20 && item.stok >= 0).length}
          </p>
        </div>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Stok Negatif</h3>
          <p className="mt-1 text-2xl font-semibold text-red-600">
            {inventoriData.filter(item => item.stok < 0).length}
          </p>
        </div>
      </div>
    </div>
  );
}
