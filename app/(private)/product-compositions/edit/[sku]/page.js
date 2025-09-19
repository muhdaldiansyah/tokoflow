"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../../lib/database/supabase/client";
import { Loader2, Save, ArrowLeft, Plus, Trash2, AlertCircle, Package } from "lucide-react";
import { formatNumber } from "../../../../../lib/utils/format";
import { toast } from "sonner";

export default function EditBundlePage() {
  const router = useRouter();
  const params = useParams();
  const parentSku = decodeURIComponent(params.sku);

  const [loading, setLoading] = useState(true);
  const [submitting, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [products, setProducts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    components: []
  });

  useEffect(() => {
    if (parentSku) {
      fetchData();
    }
  }, [parentSku]);

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

      // Fetch current bundle compositions
      const compositionsRes = await fetch(`/api/product-compositions?parent_sku=${encodeURIComponent(parentSku)}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!compositionsRes.ok) throw new Error("Failed to fetch bundle compositions");
      const compositionsData = await compositionsRes.json();

      // Fetch marketplace fees to get channels
      const feesRes = await fetch("/api/marketplace-fees", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (feesRes.ok) {
        const feesData = await feesRes.json();
        if (feesData.success && Array.isArray(feesData.data)) {
          const channelsList = feesData.data.map(f => f.channel);
          setChannels(channelsList);
        } else {
          setChannels([]);
        }
      } else {
        setChannels([]);
      }

      if (productsData.success) {
        const productsList = productsData.data.products || [];
        setProducts(productsList);

        // Find the bundle product
        const bundleProduct = productsList.find(p => p.sku === parentSku);
        if (!bundleProduct) {
          throw new Error("Bundle product not found");
        }
        setBundle(bundleProduct);
      } else {
        setProducts([]);
      }

      if (compositionsData.success) {
        const compositionsList = Array.isArray(compositionsData.data) ? compositionsData.data : [];
        setFormData({
          components: compositionsList.map(comp => ({
            id: comp.id,
            component_sku: comp.component_sku,
            quantity: comp.quantity,
            source_channel: comp.source_channel || "semua",
            status: comp.status || "aktif"
          }))
        });
      } else {
        setFormData({ components: [] });
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [
        ...prev.components,
        {
          id: null, // New component
          component_sku: "",
          quantity: 1,
          source_channel: "semua",
          status: "aktif"
        }
      ]
    }));
  };

  const updateComponent = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.map((comp, i) =>
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  const removeComponent = (index) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.components.length === 0) {
      toast.error("Bundle must have at least one component");
      return;
    }

    // Validate each component
    for (let i = 0; i < formData.components.length; i++) {
      const comp = formData.components[i];
      if (!comp.component_sku || !comp.quantity) {
        toast.error(`Component ${i + 1} is incomplete`);
        return;
      }
      if (comp.component_sku === parentSku) {
        toast.error(`Component ${i + 1} cannot be the same as the bundle product`);
        return;
      }
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      // Separate new and existing components
      const existingComponents = formData.components.filter(comp => comp.id);
      const newComponents = formData.components.filter(comp => !comp.id);

      // Update existing components
      const updatePromises = existingComponents.map(comp =>
        fetch(`/api/product-compositions/${comp.id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            parent_sku: parentSku,
            component_sku: comp.component_sku,
            quantity: parseInt(comp.quantity) || 1,
            source_channel: comp.source_channel,
            status: comp.status
          })
        })
      );

      // Create new components
      const createPromises = newComponents.map(comp =>
        fetch("/api/product-compositions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            parent_sku: parentSku,
            component_sku: comp.component_sku,
            quantity: parseInt(comp.quantity) || 1,
            source_channel: comp.source_channel,
            status: comp.status
          })
        })
      );

      // Execute all operations
      const allPromises = [...updatePromises, ...createPromises];
      const results = await Promise.all(allPromises);
      const responses = await Promise.all(results.map(r => r.json()));

      // Check if all succeeded
      const failed = responses.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`Failed to save ${failed.length} composition(s)`);
      }

      toast.success("Bundle updated successfully");
      router.push("/product-compositions");

    } catch (err) {
      console.error("Error updating bundle:", err);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBundle = async () => {
    if (!confirm(`Are you sure you want to delete the entire "${bundle?.name}" bundle? This will remove all its compositions and cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      // Delete all compositions for this bundle
      const deletePromises = formData.components
        .filter(comp => comp.id)
        .map(comp =>
          fetch(`/api/product-compositions/${comp.id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${session.access_token}`
            }
          })
        );

      const results = await Promise.all(deletePromises);
      const responses = await Promise.all(results.map(r => r.json()));

      // Check if all succeeded
      const failed = responses.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} composition(s)`);
      }

      toast.success("Bundle deleted successfully");
      router.push("/product-compositions");

    } catch (err) {
      console.error("Error deleting bundle:", err);
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getProductName = (sku) => {
    const product = products.find(p => p.sku === sku);
    return product?.name || sku;
  };

  const getAvailableComponents = (currentIndex) => {
    const usedSkus = formData.components
      .map((comp, index) => index !== currentIndex ? comp.component_sku : null)
      .filter(Boolean);
    return products.filter(p =>
      p.sku !== parentSku &&
      !usedSkus.includes(p.sku)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading bundle...</p>
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
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              href="/product-compositions"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Compositions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/product-compositions"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Bundle</h1>
        </div>
        <p className="text-gray-600">Modify bundle components and settings</p>
      </div>

      {/* Bundle Overview */}
      {bundle && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bundle Overview</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center">
              <Package className="w-6 h-6 text-gray-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{bundle.name}</h3>
                <p className="text-sm text-gray-500">SKU: {bundle.sku}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-sm font-medium ${
                    bundle.stock < 0 ? 'text-red-600' :
                    bundle.stock <= 10 ? 'text-orange-600' :
                    'text-gray-900'
                  }`}>
                    Current Stock: {formatNumber(bundle.stock)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formData.components.length} component{formData.components.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Components */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Bundle Components</h2>
            <button
              type="button"
              onClick={addComponent}
              disabled={submitting || deleting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Plus className="inline-block w-4 h-4 mr-2" />
              Add Component
            </button>
          </div>

          {formData.components.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No components configured.</p>
              <p className="text-sm">Click "Add Component" to start building your bundle.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.components.map((component, index) => {
                const componentProduct = products.find(p => p.sku === component.component_sku);
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Component Product
                        </label>
                        <select
                          value={component.component_sku}
                          onChange={(e) => updateComponent(index, 'component_sku', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          disabled={submitting || deleting}
                        >
                          <option value="">Select Component</option>
                          {getAvailableComponents(index).map((product) => (
                            <option key={product.sku} value={product.sku}>
                              {product.sku} - {product.name}
                            </option>
                          ))}
                        </select>
                        {componentProduct && (
                          <p className="text-xs text-gray-500 mt-1">
                            Stock: {formatNumber(componentProduct.stock)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={component.quantity}
                          onChange={(e) => updateComponent(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          required
                          disabled={submitting || deleting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Channel
                        </label>
                        <select
                          value={component.source_channel}
                          onChange={(e) => updateComponent(index, 'source_channel', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={submitting || deleting}
                        >
                          <option value="semua">All Channels</option>
                          {channels.map((channel) => (
                            <option key={channel} value={channel.toLowerCase()}>
                              {channel}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeComponent(index)}
                          disabled={submitting || deleting}
                          className="w-full px-3 py-2 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <Trash2 className="inline-block w-4 h-4 mr-2" />
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={component.status === "aktif"}
                          onChange={(e) => updateComponent(index, 'status', e.target.checked ? "aktif" : "nonaktif")}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={submitting || deleting}
                        />
                        <span className="ml-2 text-sm text-gray-700">Active (will be processed during sales)</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDeleteBundle}
              disabled={submitting || deleting}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {deleting ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Deleting Bundle...
                </>
              ) : (
                <>
                  <Trash2 className="inline-block w-4 h-4 mr-2" />
                  Delete Bundle
                </>
              )}
            </button>

            <div className="flex gap-4">
              <Link
                href="/product-compositions"
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || deleting || formData.components.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="inline-block w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Bundle Editing Guidelines</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Changes are saved immediately when you click "Save Changes"</li>
          <li>• Inactive components will not be processed during sales</li>
          <li>• Removing components will permanently delete those composition rules</li>
          <li>• Deleting the entire bundle removes all its compositions</li>
          <li>• Component stock levels are shown to help you monitor availability</li>
        </ul>
      </div>
    </div>
  );
}