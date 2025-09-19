"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, Plus, X, Check, AlertCircle, Package, RefreshCw } from "lucide-react";
import { formatDate, formatNumber, formatDateForInput } from "../../../lib/utils/format";
import { toast } from "sonner";

export default function BarangMasukPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [incomingGoods, setIncomingGoods] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    transaction_date: formatDateForInput(new Date()),
    sku: "",
    product_name: "",
    quantity: "",
    status: "ok"
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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
      
      // Fetch pending incoming goods
      const incomingRes = await fetch("/api/incoming-goods/input?status=ok", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (!incomingRes.ok) throw new Error("Failed to fetch incoming goods");
      const incomingData = await incomingRes.json();
      
      if (productsData.success) setProducts(productsData.data.products || []);
      if (incomingData.success && Array.isArray(incomingData.data)) {
        setIncomingGoods(incomingData.data.filter(g => g.quantity !== null));
      } else {
        setIncomingGoods([]);
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ensure products is always an array
  const productsList = Array.isArray(products) ? products : [];
  
  const handleProductSelect = (sku) => {
    const product = productsList.find(p => p.sku === sku);
    if (product) {
      setFormData({
        ...formData,
        sku: product.sku,
        product_name: product.name,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.sku || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const response = await fetch("/api/incoming-goods/input", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity) || 0,
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Incoming goods added successfully");
        
        // Optimistic update - add to list immediately
        if (result.data) {
          setIncomingGoods(prev => [result.data, ...prev]);
        }
        
        // Reset form
        setFormData({
          transaction_date: formatDateForInput(new Date()),
          sku: "",
          product_name: "",
          quantity: "",
          status: "ok"
        });
        
      } else {
        throw new Error(result.error || "Failed to add incoming goods");
      }
      
    } catch (err) {
      console.error("Error adding incoming goods:", err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    
    setDeletingId(id);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const response = await fetch(`/api/incoming-goods/input/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Optimistic update - remove from list immediately
        setIncomingGoods(prev => prev.filter(item => item.id !== id));
        toast.success("Entry deleted successfully");
      } else {
        throw new Error(result.error || "Failed to delete entry");
      }
      
    } catch (err) {
      console.error("Error deleting entry:", err);
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleProcess = async () => {
    if (incomingGoods.length === 0) {
      toast.error("No incoming goods to process");
      return;
    }
    
    if (!confirm(`Process ${incomingGoods.length} incoming goods entries?`)) return;
    
    setProcessing(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const response = await fetch("/api/process/incoming-goods", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})  // Empty body for batch processing
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully processed ${result.data.processed} entries`);
        
        if (result.data.errors && result.data.errors.length > 0) {
          result.data.errors.forEach(err => {
            toast.warning(err);
          });
        }
        
        // Refresh data
        fetchInitialData();
      } else {
        throw new Error(result.error || "Failed to process incoming goods");
      }
      
    } catch (err) {
      console.error("Error processing incoming goods:", err);
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading incoming goods data...</p>
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
            onClick={fetchInitialData}
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
        <h1 className="text-3xl font-bold text-gray-900">Incoming Goods</h1>
        <p className="text-gray-600 mt-2">Add and process incoming stock</p>
      </div>

      {/* Add Incoming Goods Form */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Incoming Goods</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Transaction Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Date
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                required
                disabled={submitting}
              />
            </div>

            {/* Product SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={formData.sku}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                required
                disabled={submitting}
              >
                <option value="">Select Product</option>
                {productsList.map((product) => (
                  <option key={product.sku} value={product.sku}>
                    {product.sku} - {product.name} (Stock: {product.stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="100"
                min="1"
                required
                disabled={submitting}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                disabled={submitting}
              >
                <option value="ok">OK (Ready to Process)</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="inline-block w-4 h-4 mr-2" />
                  Add Incoming Goods
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Pending Incoming Goods List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Incoming Goods</h2>
              <p className="text-sm text-gray-600 mt-1">
                {incomingGoods.length} entries ready to process
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchInitialData}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleProcess}
                disabled={processing || incomingGoods.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="inline-block w-4 h-4 mr-2" />
                    Process All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incoming Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Stock
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
              {incomingGoods.length > 0 ? (
                incomingGoods.map((item) => {
                  const product = productsList.find(p => p.sku === item.sku);
                  const currentStock = product?.stock || 0;
                  const newStock = currentStock + item.quantity;
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.transaction_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={currentStock < 0 ? "text-red-600 font-medium" : ""}>
                          {formatNumber(currentStock)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        +{formatNumber(item.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={newStock < 0 ? "text-red-600" : "text-green-600"}>
                          {formatNumber(newStock)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No pending incoming goods to process
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
