"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../../lib/database/supabase/client";
import { Loader2, Save, ArrowLeft, AlertCircle, Trash2, Package } from "lucide-react";
import { formatDate, formatNumber, formatCurrency } from "../../../../../lib/utils/format";
import { toast } from "sonner";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const sku = decodeURIComponent(params.sku);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: ""
  });

  // Cost form state
  const [costData, setCostData] = useState({
    modal_cost: 0,
    packing_cost: 0,
    affiliate_percentage: 0
  });

  const [savingCosts, setSavingCosts] = useState(false);

  useEffect(() => {
    if (sku) {
      fetchProduct();
    }
  }, [sku]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No session found");
      }

      // Fetch product details
      const response = await fetch(`/api/products/${encodeURIComponent(sku)}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Product not found");
        }
        throw new Error("Failed to fetch product");
      }

      const result = await response.json();

      if (result.success) {
        const productData = result.data;

        // Fetch product costs
        const costsRes = await fetch("/api/product-costs", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (costsRes.ok) {
          const costsData = await costsRes.json();
          if (costsData.success) {
            const cost = costsData.data.find(c => c.sku === productData.sku);
            productData.modal_cost = cost?.modal_cost || 0;
            productData.packing_cost = cost?.packing_cost || 0;
            productData.affiliate_percentage = cost?.affiliate_percentage || 0;
          }
        }

        // Fetch bundle information (where this product is a parent or component)
        const bundlesRes = await fetch("/api/product-compositions", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (bundlesRes.ok) {
          const bundlesData = await bundlesRes.json();
          if (bundlesData.success) {
            const allCompositions = Array.isArray(bundlesData.data) ? bundlesData.data : [];
            productData.asParent = allCompositions.filter(c => c.parent_sku === productData.sku);
            productData.asComponent = allCompositions.filter(c => c.component_sku === productData.sku);
          } else {
            productData.asParent = [];
            productData.asComponent = [];
          }
        } else {
          productData.asParent = [];
          productData.asComponent = [];
        }

        setProduct(productData);
        setFormData({
          sku: productData.sku,
          name: productData.name
        });
        setCostData({
          modal_cost: productData.modal_cost || 0,
          packing_cost: productData.packing_cost || 0,
          affiliate_percentage: productData.affiliate_percentage || 0
        });
      } else {
        throw new Error(result.error || "Failed to load product");
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Product name is required");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      const payload = { name: formData.name };

      const response = await fetch(`/api/products/${encodeURIComponent(sku)}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Product updated successfully");
        // Update local state
        setProduct(prev => ({ ...prev, name: formData.name, updated_at: new Date().toISOString() }));
      } else {
        throw new Error(result.error || "Failed to update product");
      }

    } catch (err) {
      console.error("Error updating product:", err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${product.name} (${product.sku})? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      const response = await fetch(`/api/products/${encodeURIComponent(sku)}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Product deleted successfully");
        router.push("/products");
      } else {
        throw new Error(result.error || "Failed to delete product");
      }

    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveCosts = async () => {
    setSavingCosts(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      const payload = {
        sku: sku,
        modal_cost: parseFloat(costData.modal_cost) || 0,
        packing_cost: parseFloat(costData.packing_cost) || 0,
        affiliate_percentage: parseFloat(costData.affiliate_percentage) || 0
      };

      const response = await fetch("/api/product-costs", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Product costs updated successfully");
        // Update local state
        setProduct(prev => ({
          ...prev,
          modal_cost: payload.modal_cost,
          packing_cost: payload.packing_cost,
          affiliate_percentage: payload.affiliate_percentage
        }));
      } else {
        throw new Error(result.error || "Failed to update product costs");
      }

    } catch (err) {
      console.error("Error updating product costs:", err);
      toast.error(err.message);
    } finally {
      setSavingCosts(false);
    }
  };

  const handleCancel = () => {
    router.push("/products");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
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
          <div className="mt-4 space-x-4">
            <button
              onClick={fetchProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              href="/products"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Product not found</p>
          <Link
            href="/products"
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const stockStatus = product.stock < 0 ? 'negative' :
                    product.stock <= 10 ? 'low' : 'normal';

  // Real-time calculations based on current form data
  const currentModalCost = parseFloat(costData.modal_cost) || 0;
  const currentPackingCost = parseFloat(costData.packing_cost) || 0;
  const currentAffiliatePercentage = parseFloat(costData.affiliate_percentage) || 0;
  const totalCost = currentModalCost + currentPackingCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/products"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        </div>
        <p className="text-gray-600">Modify product information and settings</p>
      </div>

      {/* Product Overview */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">SKU</label>
              <div className="flex items-center">
                <Package className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-900">{product.sku}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Current Stock</label>
              <span className={`text-sm font-medium ${
                stockStatus === 'negative' ? 'text-red-600' :
                stockStatus === 'low' ? 'text-orange-600' :
                'text-gray-900'
              }`}>
                {formatNumber(product.stock)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Modal Cost</label>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(currentModalCost)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Total Cost</label>
              <span className="text-sm font-medium text-blue-600">{formatCurrency(totalCost)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
              <span className="text-sm text-gray-500">{formatDate(product.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information Form */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">SKU cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Product Name"
                required
                disabled={submitting || deleting}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting || deleting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Update Basic Info
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Product Costs Form */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product Costs</h2>
          <p className="text-sm text-gray-600 mt-1">Configure cost structure for accurate profit calculation</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modal Cost (COGS)
              </label>
              <input
                type="number"
                value={costData.modal_cost}
                onChange={(e) => setCostData({ ...costData, modal_cost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0"
                min="0"
                step="0.01"
                disabled={savingCosts || deleting}
              />
              <p className="text-xs text-gray-500 mt-1">Base cost of goods sold</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Packing Cost
              </label>
              <input
                type="number"
                value={costData.packing_cost}
                onChange={(e) => setCostData({ ...costData, packing_cost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0"
                min="0"
                step="0.01"
                disabled={savingCosts || deleting}
              />
              <p className="text-xs text-gray-500 mt-1">Packaging and handling cost</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate Percentage (%)
              </label>
              <input
                type="number"
                value={costData.affiliate_percentage}
                onChange={(e) => setCostData({ ...costData, affiliate_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                disabled={savingCosts || deleting}
              />
              <p className="text-xs text-gray-500 mt-1">Affiliate commission percentage</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Cost Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Modal Cost:</span>
                <span className="font-medium text-gray-900 ml-2">{formatCurrency(currentModalCost)}</span>
              </div>
              <div>
                <span className="text-gray-600">Packing Cost:</span>
                <span className="font-medium text-gray-900 ml-2">{formatCurrency(currentPackingCost)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-medium text-blue-600 ml-2">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSaveCosts}
              disabled={savingCosts || deleting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {savingCosts ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Save Costs
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bundle Information */}
      {(product.asParent?.length > 0 || product.asComponent?.length > 0) && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bundle Information</h2>
            <p className="text-sm text-gray-600 mt-1">This product's involvement in bundle compositions</p>
          </div>
          <div className="p-6 space-y-6">
            {/* As Bundle Product */}
            {product.asParent?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">This Product is a Bundle</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-2">
                    This product is configured as a bundle with {product.asParent.length} component{product.asParent.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.asParent.map(comp => (
                      <div key={comp.id} className="bg-white border border-blue-200 rounded px-2 py-1 text-xs">
                        {comp.quantity}× {comp.component_sku}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/product-compositions/edit/${encodeURIComponent(product.sku)}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Edit Bundle Configuration →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* As Component */}
            {product.asComponent?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Used as Component in Bundles</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-700 mb-2">
                    This product is used as a component in {product.asComponent.length} bundle{product.asComponent.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="space-y-1">
                    {product.asComponent.map(comp => (
                      <div key={comp.id} className="text-xs text-amber-600">
                        • {comp.quantity}× in "{comp.parent_sku}" bundle
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/product-compositions"
                      className="text-sm text-amber-600 hover:text-amber-700"
                    >
                      View All Bundles →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
        </div>
        <div className="p-6">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting || savingCosts}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {deleting ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="inline-block w-4 h-4 mr-2" />
                  Delete Product
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting || deleting || savingCosts}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Product Management Guidelines</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• SKU cannot be modified after product creation</li>
          <li>• Basic information and costs can be updated separately</li>
          <li>• Cost changes are immediately reflected in the overview section</li>
          <li>• Use "Stock Adjustments" menu to modify inventory levels</li>
          <li>• Total cost includes modal cost + packing cost (affiliate % is for reporting)</li>
          <li>• Deleting a product will remove all associated data permanently</li>
        </ul>
      </div>
    </div>
  );
}