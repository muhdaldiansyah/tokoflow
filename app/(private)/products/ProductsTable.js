"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Package, Edit2, Plus } from "lucide-react";
import { formatNumber, formatCurrency, formatDate } from "../../../lib/utils/format";

export default function ProductsTable({ initialData = [] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => params.get('search') || "");

  // Debounce URL updates for server-side filtering
  useEffect(() => {
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      if (searchTerm) url.searchParams.set('search', searchTerm);
      else url.searchParams.delete('search');
      router.replace(`${url.pathname}?${url.searchParams.toString()}`);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, router]);

  // If server is already filtering (when ?search= present), skip client filter.
  const serverFiltering = !!params.get('search');
  const filteredProducts = useMemo(() => {
    if (serverFiltering) return initialData;
    const s = searchTerm.toLowerCase();
    if (!s) return initialData;
    return initialData.filter(p =>
      p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s)
    );
  }, [initialData, searchTerm, serverFiltering]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-2">Manage your product catalog</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        >
          <Plus className="inline-block w-4 h-4 mr-2" />
          Add New Product
        </Link>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Product List ({filteredProducts.length} products)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modal Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const stockStatus = product.stock < 0 ? 'negative' :
                                    product.stock <= 10 ? 'low' : 'normal';
                  const totalCost = (product.modal_cost || 0) + (product.packing_cost || 0);

                  return (
                    <tr key={product.id} data-sku={product.sku} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">
                            {product.sku}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          stockStatus === 'negative' ? 'text-red-600' :
                          stockStatus === 'low' ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {formatNumber(product.stock)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(product.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          stockStatus === 'negative' ? 'bg-red-100 text-red-800' :
                          stockStatus === 'low' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {stockStatus === 'negative' ? 'Negative' :
                           stockStatus === 'low' ? 'Low Stock' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/products/edit/${encodeURIComponent(product.sku)}`}
                          className="text-blue-600 hover:text-blue-900 transition-all duration-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? "No products found matching your search" : "No products found. Add your first product above."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Product Management Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• SKU (Stock Keeping Unit) must be unique for each product</li>
          <li>• Initial stock can only be set when creating a new product</li>
          <li>• Use the Stock Adjustment feature to modify stock levels after creation</li>
          <li>• Configure product costs in the "Product Costs" menu for accurate profit calculation</li>
          <li>• Products with negative stock indicate overselling - investigate immediately</li>
        </ul>
      </div>
    </div>
  );
}