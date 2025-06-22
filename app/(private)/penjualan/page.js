"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, Plus, X, Check, AlertCircle, ShoppingCart, Package, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate, formatNumber, formatDateForInput } from "../../../lib/utils/format";
import { toast } from "sonner";

export default function PenjualanPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [salesInput, setSalesInput] = useState([]);
  const [products, setProducts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    transaction_date: formatDateForInput(new Date()),
    sku: "",
    product_name: "",
    selling_price: "",
    quantity: "",
    channel: "",
    status: "ok"
  });
  
  // Ensure arrays are always arrays
  const productsList = Array.isArray(products) ? products : [];
  const channelsList = Array.isArray(channels) ? channels : ['Shopee', 'Tokopedia', 'TikTok Shop', 'Offline'];

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
      
      // Fetch marketplace fees to get channels
      const feesRes = await fetch("/api/marketplace-fees", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (!feesRes.ok) throw new Error("Failed to fetch marketplace fees");
      const feesData = await feesRes.json();
      
      // Fetch pending sales input
      const salesRes = await fetch("/api/sales/input?status=ok", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (!salesRes.ok) throw new Error("Failed to fetch sales input");
      const salesData = await salesRes.json();
      
      // Debug logs
      console.log('Products response:', productsData);
      console.log('Fees response:', feesData);
      console.log('Sales response:', salesData);
      
      if (productsData.success) {
        setProducts(productsData.data.products || []);
      } else {
        setProducts([]);
      }
      
      if (feesData.success && Array.isArray(feesData.data)) {
        setChannels(feesData.data.map(f => f.channel));
      } else {
        setChannels([]);
      }
      
      if (salesData.success && Array.isArray(salesData.data)) {
        setSalesInput(salesData.data.filter(s => s.quantity !== null));
      } else {
        setSalesInput([]);
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    if (!formData.sku || !formData.quantity || !formData.channel) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const response = await fetch("/api/sales/input", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          selling_price: parseFloat(formData.selling_price) || 0,
          quantity: parseInt(formData.quantity) || 0,
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Sales input added successfully");
        
        // Optimistic update - add to list immediately
        if (result.data) {
          setSalesInput(prev => [result.data, ...prev]);
        }
        
        // Reset form
        setFormData({
          transaction_date: formatDateForInput(new Date()),
          sku: "",
          product_name: "",
          selling_price: "",
          quantity: "",
          channel: "",
          status: "ok"
        });
        
      } else {
        throw new Error(result.error || "Failed to add sales input");
      }
      
    } catch (err) {
      console.error("Error adding sales:", err);
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
      
      const response = await fetch(`/api/sales/input/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Optimistic update - remove from list immediately
        setSalesInput(prev => prev.filter(s => s.id !== id));
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
    if (salesInput.length === 0) {
      toast.error("No sales to process");
      return;
    }
    
    if (!confirm(`Process ${salesInput.length} sales transactions?`)) return;
    
    setProcessing(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const response = await fetch("/api/process/sales", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})  // Empty body for batch processing
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully processed ${result.data.processed} sales`);
        
        if (result.data.errors && result.data.errors.length > 0) {
          result.data.errors.forEach(err => {
            toast.warning(err);
          });
        }
        
        // Refresh data
        fetchInitialData();
      } else {
        throw new Error(result.error || "Failed to process sales");
      }
      
    } catch (err) {
      console.error("Error processing sales:", err);
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
          <p className="text-gray-600">Loading sales data...</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Sales Input</h1>
        <p className="text-gray-600 mt-2">Add and process sales transactions</p>
      </div>

      {/* Add Sales Form */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Sale</h2>
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
                    {product.sku} - {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price
              </label>
              <input
                type="number"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="100000"
                required
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
                required
              />
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Channel</option>
                {channelsList.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  Add Sales
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Pending Sales List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Sales</h2>
              <p className="text-sm text-gray-600 mt-1">
                {salesInput.length} transactions ready to process
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
                disabled={processing || salesInput.length === 0}
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
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
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
              {salesInput.length > 0 ? (
                salesInput.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(sale.transaction_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.product_name}</div>
                      <div className="text-sm text-gray-500">{sale.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sale.selling_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.selling_price * sale.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.channel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(sale.id)}
                        disabled={deletingId === sale.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === sale.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No pending sales to process
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
