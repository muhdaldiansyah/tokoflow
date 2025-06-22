"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, Plus, Save, X, AlertCircle, Package, Layers, Edit2, Trash2, Settings } from "lucide-react";
import { formatNumber } from "../../../lib/utils/format";
import { toast } from "sonner";

export default function KomposisiProdukPage() {
  const [loading, setLoading] = useState(true);
  const [compositions, setCompositions] = useState([]);
  const [products, setProducts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    parent_sku: "",
    component_sku: "",
    quantity: "1",
    source_channel: "semua",
    status: "aktif"
  });

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
      console.log('Products API response structure:', productsData);

      // Fetch compositions
      const compositionsRes = await fetch("/api/product-compositions", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (!compositionsRes.ok) throw new Error("Failed to fetch compositions");
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
          console.log('Channels loaded:', channelsList);
        } else {
          setChannels([]);
        }
      } else {
        setChannels([]);
      }

      if (productsData.success) {
        const productsList = productsData.data.products || [];
        setProducts(productsList);
        console.log('Products loaded:', productsList.length, 'items');
      } else {
        setProducts([]);
      }
      if (compositionsData.success) {
        const compositionsList = Array.isArray(compositionsData.data) ? compositionsData.data : [];
        setCompositions(compositionsList);
        console.log('Compositions loaded:', compositionsList.length, 'items');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.parent_sku || !formData.component_sku || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.parent_sku === formData.component_sku) {
      toast.error("A product cannot be a component of itself");
      return;
    }
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `/api/product-compositions/${editingId}`
        : "/api/product-compositions";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          parent_sku: formData.parent_sku,
          component_sku: formData.component_sku,
          quantity: parseInt(formData.quantity) || 1,
          source_channel: formData.source_channel,
          status: formData.status
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(editingId ? "Composition updated successfully" : "Composition added successfully");
        
        // Reset form
        setFormData({
          parent_sku: "",
          component_sku: "",
          quantity: "1",
          source_channel: "semua",
          status: "aktif"
        });
        setEditingId(null);
        setShowAddForm(false);
        
        // Refresh list
        fetchData();
      } else {
        throw new Error(result.error || "Failed to save composition");
      }
      
    } catch (err) {
      console.error("Error saving composition:", err);
      toast.error(err.message);
    }
  };

  const handleEdit = (composition) => {
    setFormData({
      parent_sku: composition.parent_sku,
      component_sku: composition.component_sku,
      quantity: composition.quantity.toString(),
      source_channel: composition.source_channel || "semua",
      status: composition.status || "aktif"
    });
    setEditingId(composition.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this composition?")) return;
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const response = await fetch(`/api/product-compositions/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Composition deleted successfully");
        fetchData();
      } else {
        throw new Error(result.error || "Failed to delete composition");
      }
      
    } catch (err) {
      console.error("Error deleting composition:", err);
      toast.error(err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      parent_sku: "",
      component_sku: "",
      quantity: "1",
      source_channel: "semua",
      status: "aktif"
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  // Group compositions by parent SKU
  const groupedCompositions = Array.isArray(compositions) ? compositions.reduce((acc, comp) => {
    if (!acc[comp.parent_sku]) {
      acc[comp.parent_sku] = [];
    }
    acc[comp.parent_sku].push(comp);
    return acc;
  }, {}) : {};

  const getProductName = (sku) => {
    if (!Array.isArray(products)) {
      console.warn('Products is not an array:', products);
      return sku;
    }
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

      {/* Add/Edit Form */}
      {showAddForm ? (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Composition" : "Add New Composition"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Product (Bundle)
                </label>
                <select
                  value={formData.parent_sku}
                  onChange={(e) => setFormData({ ...formData, parent_sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={editingId}
                >
                  <option value="">Select Parent Product</option>
                  {Array.isArray(products) && products.map((product) => (
                    <option key={product.sku} value={product.sku}>
                      {product.sku} - {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Component Product
                </label>
                <select
                  value={formData.component_sku}
                  onChange={(e) => setFormData({ ...formData, component_sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={editingId}
                >
                  <option value="">Select Component Product</option>
                  {Array.isArray(products) && products
                    .filter(p => p.sku !== formData.parent_sku)
                    .map((product) => (
                      <option key={product.sku} value={product.sku}>
                        {product.sku} - {product.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity per Bundle
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel
                </label>
                <select
                  value={formData.source_channel}
                  onChange={(e) => setFormData({ ...formData, source_channel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="semua">All Channels</option>
                  {Array.isArray(channels) && channels.map((channel) => (
                    <option key={channel} value={channel.toLowerCase()}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="aktif">Active</option>
                  <option value="nonaktif">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Save className="inline-block w-4 h-4 mr-2" />
                {editingId ? "Update Composition" : "Add Composition"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="inline-block w-4 h-4 mr-2" />
            Add New Composition
          </button>
        </div>
      )}

      {/* Compositions List */}
      <div className="space-y-6">
        {Object.keys(groupedCompositions).length > 0 ? (
          Object.entries(groupedCompositions).map(([parentSku, components]) => {
            const parentProduct = Array.isArray(products) ? products.find(p => p.sku === parentSku) : null;
            
            return (
              <div key={parentSku} className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <Package className="w-6 h-6 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {parentProduct?.name || parentSku}
                      </h3>
                      <p className="text-sm text-gray-500">SKU: {parentSku}</p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Component
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Channel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {components.map((comp) => {
                        const componentProduct = Array.isArray(products) ? products.find(p => p.sku === comp.component_sku) : null;
                        
                        return (
                          <tr key={comp.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Layers className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {componentProduct?.name || comp.component_sku}
                                  </div>
                                  <div className="text-sm text-gray-500">{comp.component_sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNumber(comp.quantity)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {comp.source_channel === 'semua' ? 'All Channels' : comp.source_channel}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                comp.status === 'aktif' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {comp.status === 'aktif' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                componentProduct && componentProduct.stock < 0 
                                  ? 'text-red-600' 
                                  : componentProduct && componentProduct.stock <= 10 
                                    ? 'text-orange-600' 
                                    : 'text-gray-900'
                              }`}>
                                {componentProduct ? formatNumber(componentProduct.stock) : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEdit(comp)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(comp.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No product compositions configured.</p>
            <p className="text-gray-500 text-sm mt-2">Add your first bundle product composition above.</p>
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
