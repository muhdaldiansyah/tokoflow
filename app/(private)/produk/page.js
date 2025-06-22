"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, Plus, Save, X, AlertCircle, Package, Edit2, Trash2, Search, Filter } from "lucide-react";
import { formatNumber, formatCurrency, formatDate } from "../../../lib/utils/format";
import { toast } from "sonner";

export default function ProdukPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingSku, setEditingSku] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingSku, setDeletingSku] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    initial_stock: "0"
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      const response = await fetch("/api/products", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const result = await response.json();
      
      if (result.success) {
        // Fetch costs for each product
        const costsRes = await fetch("/api/product-costs", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        
        if (costsRes.ok) {
          const costsData = await costsRes.json();
          if (costsData.success) {
            // Merge costs with products
            const productsWithCosts = result.data.products.map(product => {
              const cost = costsData.data.find(c => c.sku === product.sku);
              return {
                ...product,
                modal_cost: cost?.modal_cost || 0,
                packing_cost: cost?.packing_cost || 0,
                affiliate_percentage: cost?.affiliate_percentage || 0
              };
            });
            setProducts(productsWithCosts);
          } else {
            setProducts(result.data.products);
          }
        } else {
          setProducts(result.data.products);
        }
      } else {
        throw new Error(result.error || "Failed to load products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Capture the current editingSku value
    const currentEditingSku = editingSku;
    const isEditing = !!currentEditingSku;
    
    setSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing 
        ? `/api/products/${encodeURIComponent(currentEditingSku)}`
        : "/api/products";
      
      const payload = isEditing
        ? { name: formData.name }
        : {
            sku: formData.sku,
            name: formData.name,
            stock: parseInt(formData.initial_stock) || 0
          };
      
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Optimistic update for better UX
        if (isEditing) {
          // Update existing product in state
          setProducts(prev => prev.map(p => 
            p.sku === currentEditingSku 
              ? { ...p, name: formData.name, updated_at: new Date().toISOString() }
              : p
          ));
          toast.success("Product updated successfully");
        } else {
          // Add new product to state
          const newProduct = {
            id: result.data.id,
            sku: formData.sku,
            name: formData.name,
            stock: parseInt(formData.initial_stock) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            modal_cost: 0,
            packing_cost: 0,
            affiliate_percentage: 0
          };
          setProducts(prev => {
            const updated = [...prev, newProduct].sort((a, b) => a.sku.localeCompare(b.sku));
            // Scroll to the new product after a brief delay
            setTimeout(() => {
              const element = document.querySelector(`[data-sku="${newProduct.sku}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('bg-blue-50');
                setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
              }
            }, 500);
            return updated;
          });
          toast.success("Product added successfully");
        }
        
        // Reset form with animation
        setTimeout(() => {
          setFormData({ sku: "", name: "", initial_stock: "0" });
          setEditingSku(null);
          setShowAddForm(false);
        }, 300);
        
      } else {
        throw new Error(result.error || "Failed to save product");
      }
      
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    // Set editing SKU first
    setEditingSku(product.sku);
    // Then set form data
    setFormData({
      sku: product.sku,
      name: product.name,
      initial_stock: product.stock.toString()
    });
    // Show form
    setShowAddForm(true);
  };

  const handleDelete = async (sku, name) => {
    if (!confirm(`Are you sure you want to delete ${name} (${sku})?`)) return;
    
    setDeletingSku(sku);
    
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
        // Optimistic update - remove from state with animation
        setProducts(prev => prev.filter(p => p.sku !== sku));
        toast.success("Product deleted successfully");
      } else {
        throw new Error(result.error || "Failed to delete product");
      }
      
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(err.message);
    } finally {
      setDeletingSku(null);
    }
  };

  const handleCancel = () => {
    // Reset all form state
    setEditingSku(null);
    setFormData({ sku: "", name: "", initial_stock: "0" });
    setShowAddForm(false);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
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
            onClick={fetchProducts}
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
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-2">Manage your product catalog</p>
      </div>

      {/* Add/Edit Form */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
        showAddForm ? 'max-h-[800px] opacity-100 mb-8' : 'max-h-0 opacity-0'
      }`}>
        {showAddForm && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingSku ? "Edit Product" : "Add New Product"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="PROD001"
                  required
                  disabled={editingSku || submitting}
                />
                {editingSku && (
                  <p className="text-xs text-gray-500 mt-1">SKU cannot be changed</p>
                )}
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
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Stock
                </label>
                <input
                  type="number"
                  value={formData.initial_stock}
                  onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0"
                  min="0"
                  disabled={editingSku || submitting}
                />
                {editingSku && (
                  <p className="text-xs text-gray-500 mt-1">Use inventory adjustment to change stock</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                    {editingSku ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Save className="inline-block w-4 h-4 mr-2" />
                    {editingSku ? "Update Product" : "Add Product"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>

      {/* Action Bar */}
      {!showAddForm && (
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            disabled={submitting || deletingSku}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Plus className="inline-block w-4 h-4 mr-2" />
            Add New Product
          </button>
          
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
      )}

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
                    <tr key={product.id} data-sku={product.sku} className="hover:bg-gray-50 transition-colors duration-500">
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
                        <button
                          onClick={() => handleEdit(product)}
                          disabled={submitting || deletingSku}
                          className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.sku, product.name)}
                          disabled={deletingSku === product.sku}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {deletingSku === product.sku ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
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
