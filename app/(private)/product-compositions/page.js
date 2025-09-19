"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, Plus, AlertCircle, Package, Layers, Edit2, Search } from "lucide-react";
import { formatNumber } from "../../../lib/utils/format";

export default function ProductCompositionsPage() {
  const [loading, setLoading] = useState(true);
  const [compositions, setCompositions] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No session found");
      }

      // Fetch products
      const productsRes = await fetch("/api/products", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!productsRes.ok) throw new Error("Failed to fetch products");
      const productsData = await productsRes.json();

      // Fetch compositions
      const compositionsRes = await fetch("/api/product-compositions", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!compositionsRes.ok) throw new Error("Failed to fetch compositions");
      const compositionsData = await compositionsRes.json();

      if (productsData.success) {
        const productsList = productsData.data.products || [];
        setProducts(productsList);
      } else {
        setProducts([]);
      }

      if (compositionsData.success) {
        const compositionsList = Array.isArray(compositionsData.data) ? compositionsData.data : [];
        setCompositions(compositionsList);
      } else {
        setCompositions([]);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group compositions by parent SKU
  const groupedCompositions = Array.isArray(compositions) ? compositions.reduce((acc, comp) => {
    if (!acc[comp.parent_sku]) {
      acc[comp.parent_sku] = [];
    }
    acc[comp.parent_sku].push(comp);
    return acc;
  }, {}) : {};

  // Filter bundles based on search term
  const filteredBundles = Object.entries(groupedCompositions).filter(([parentSku, components]) => {
    const parentProduct = products.find(p => p.sku === parentSku);
    const parentName = parentProduct?.name || parentSku;
    return parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           parentSku.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getProductName = (sku) => {
    const product = products.find(p => p.sku === sku);
    return product?.name || sku;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading product compositions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Compositions</h1>
        <p className="text-gray-600 mt-2">Manage bundle products and their components</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/product-compositions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        >
          <Plus className="inline-block w-4 h-4 mr-2" />
          Create New Bundle
        </Link>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bundles..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Bundles List */}
      <div className="space-y-6">
        {filteredBundles.length > 0 ? (
          filteredBundles.map(([parentSku, components]) => {
            const parentProduct = products.find(p => p.sku === parentSku);
            const activeComponents = components.filter(c => c.status === 'aktif');
            const totalComponents = components.length;

            return (
              <div key={parentSku} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <Package className="w-6 h-6 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {parentProduct?.name || parentSku}
                        </h3>
                        <p className="text-sm text-gray-500">SKU: {parentSku}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            {totalComponents} component{totalComponents !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm text-gray-600">
                            {activeComponents.length} active
                          </span>
                          {parentProduct && (
                            <span className={`text-sm font-medium ${
                              parentProduct.stock < 0 ? 'text-red-600' :
                              parentProduct.stock <= 10 ? 'text-orange-600' :
                              'text-gray-900'
                            }`}>
                              Stock: {formatNumber(parentProduct.stock)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Components</div>
                        <div className="flex -space-x-1 mt-1">
                          {components.slice(0, 3).map((comp, index) => (
                            <div
                              key={comp.id}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-white"
                              title={getProductName(comp.component_sku)}
                            >
                              {comp.quantity}×
                            </div>
                          ))}
                          {components.length > 3 && (
                            <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-white">
                              +{components.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/product-compositions/edit/${encodeURIComponent(parentSku)}`}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-all duration-200"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Component Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {components.slice(0, 5).map((comp) => {
                        const componentProduct = products.find(p => p.sku === comp.component_sku);
                        return (
                          <div
                            key={comp.id}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                              comp.status === 'aktif'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-50 text-gray-500 border border-gray-200'
                            }`}
                          >
                            <Layers className="w-3 h-3" />
                            <span>{formatNumber(comp.quantity)}× {componentProduct?.name || comp.component_sku}</span>
                          </div>
                        );
                      })}
                      {components.length > 5 && (
                        <div className="px-3 py-1 rounded-full text-xs bg-gray-50 text-gray-500 border border-gray-200">
                          +{components.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : searchTerm ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bundles found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No product compositions configured.</p>
            <p className="text-gray-500 text-sm mt-2">Create your first bundle product above.</p>
          </div>
        )}
      </div>

      {/* Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Product Compositions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Compositions define which components are automatically deducted when a bundle product is sold</li>
          <li>• You can set channel-specific compositions or use "All Channels" for universal bundles</li>
          <li>• Only active compositions will be processed during sales</li>
          <li>• Component stock is automatically reduced based on the quantity specified</li>
          <li>• Example: If "Power Bank Bundle" contains 1× Power Bank + 1× USB Cable, selling 5 bundles will deduct 5 of each component</li>
        </ul>
      </div>
    </div>
  );
}