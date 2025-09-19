"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/database/supabase/client";
import { Loader2, Save, ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function NewBundlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [channels, setChannels] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    parent_sku: "",
    components: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

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
      } else {
        setProducts([]);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error(err.message);
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

    if (!formData.parent_sku) {
      toast.error("Please select a bundle product");
      return;
    }

    if (formData.components.length === 0) {
      toast.error("Please add at least one component");
      return;
    }

    // Validate each component
    for (let i = 0; i < formData.components.length; i++) {
      const comp = formData.components[i];
      if (!comp.component_sku || !comp.quantity) {
        toast.error(`Component ${i + 1} is incomplete`);
        return;
      }
      if (comp.component_sku === formData.parent_sku) {
        toast.error(`Component ${i + 1} cannot be the same as the bundle product`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      // Create all compositions
      const promises = formData.components.map(comp =>
        fetch("/api/product-compositions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            parent_sku: formData.parent_sku,
            component_sku: comp.component_sku,
            quantity: parseInt(comp.quantity) || 1,
            source_channel: comp.source_channel,
            status: comp.status
          })
        })
      );

      const results = await Promise.all(promises);
      const responses = await Promise.all(results.map(r => r.json()));

      // Check if all succeeded
      const failed = responses.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`Failed to create ${failed.length} composition(s)`);
      }

      toast.success("Bundle created successfully");
      router.push("/product-compositions");

    } catch (err) {
      console.error("Error creating bundle:", err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
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
      p.sku !== formData.parent_sku &&
      !usedSkus.includes(p.sku)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Bundle</h1>
        </div>
        <p className="text-gray-600">Define a bundle product and its components</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bundle Product Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bundle Product</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bundle Product <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.parent_sku}
              onChange={(e) => setFormData({ ...formData, parent_sku: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitting}
            >
              <option value="">Choose the product that will be the bundle</option>
              {products.map((product) => (
                <option key={product.sku} value={product.sku}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This is the product customers will purchase. Its components will be automatically deducted from inventory.
            </p>
          </div>
        </div>

        {/* Components */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Bundle Components</h2>
            <button
              type="button"
              onClick={addComponent}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Plus className="inline-block w-4 h-4 mr-2" />
              Add Component
            </button>
          </div>

          {formData.components.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No components added yet.</p>
              <p className="text-sm">Click "Add Component" to start building your bundle.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.components.map((component, index) => (
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
                        disabled={submitting}
                      >
                        <option value="">Select Component</option>
                        {getAvailableComponents(index).map((product) => (
                          <option key={product.sku} value={product.sku}>
                            {product.sku} - {product.name}
                          </option>
                        ))}
                      </select>
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
                        disabled={submitting}
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
                        disabled={submitting}
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
                        disabled={submitting}
                        className="w-full px-3 py-2 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Trash2 className="inline-block w-4 h-4 mr-2" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/product-compositions"
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || formData.components.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                Creating Bundle...
              </>
            ) : (
              <>
                <Save className="inline-block w-4 h-4 mr-2" />
                Create Bundle
              </>
            )}
          </button>
        </div>
      </form>

      {/* Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Bundle Creation Guidelines</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• A bundle product cannot be a component of itself</li>
          <li>• Each component can only be added once per bundle</li>
          <li>• When the bundle is sold, component quantities will be automatically deducted</li>
          <li>• Channel-specific compositions allow different bundle configurations per marketplace</li>
          <li>• All components start as "Active" - you can change this later if needed</li>
        </ul>
      </div>
    </div>
  );
}