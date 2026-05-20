"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, Plus, AlertCircle, Package, TrendingUp, TrendingDown, FileText, RefreshCw } from "lucide-react";
import { formatNumber, formatDate, formatDateForInput } from "../../../lib/utils/format";
import { toast } from "sonner";

export default function KoreksiStokPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    adjustment_date: formatDateForInput(new Date()),
    sku: "",
    product_name: "",
    current_stock: 0,
    adjustment_type: "add", // add or subtract
    adjustment_quantity: "",
    new_stock: 0,
    reason: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      // Fetch products with current stock
      const productsRes = await fetch("/api/products", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (!productsRes.ok) throw new Error("Failed to fetch products");
      const productsData = await productsRes.json();
      console.log('Products API response:', productsData);

      // Fetch recent adjustments
      const adjustmentsRes = await fetch("/api/inventory/adjustments?limit=20", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (adjustmentsRes.ok) {
        const adjustmentsData = await adjustmentsRes.json();
        if (adjustmentsData.success && Array.isArray(adjustmentsData.data)) {
          setAdjustments(adjustmentsData.data);
        } else {
          setAdjustments([]);
        }
      } else {
        setAdjustments([]);
      }

      if (productsData.success) {
        setProducts(productsData.data.products || []);
      } else {
        setProducts([]);
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Ensure arrays are always arrays
  const productsList = Array.isArray(products) ? products : [];
  const adjustmentsList = Array.isArray(adjustments) ? adjustments : [];
  
  const handleProductSelect = (sku) => {
    const product = productsList.find(p => p.sku === sku);
    if (product) {
      setFormData({
        ...formData,
        sku: product.sku,
        product_name: product.name,
        current_stock: product.stock,
        new_stock: product.stock
      });
    }
  };

  const handleQuantityChange = (value) => {
    const qty = parseInt(value) || 0;
    const currentStock = formData.current_stock;
    const newStock = formData.adjustment_type === "add" 
      ? currentStock + qty 
      : currentStock - qty;
    
    setFormData({
      ...formData,
      adjustment_quantity: value,
      new_stock: newStock
    });
  };

  const handleTypeChange = (type) => {
    const qty = parseInt(formData.adjustment_quantity) || 0;
    const currentStock = formData.current_stock;
    const newStock = type === "add" 
      ? currentStock + qty 
      : currentStock - qty;
    
    setFormData({
      ...formData,
      adjustment_type: type,
      new_stock: newStock
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.adjustment_quantity || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const adjustmentQty = parseInt(formData.adjustment_quantity) || 0;
    if (adjustmentQty <= 0) {
      toast.error("Adjustment quantity must be greater than 0");
      return;
    }

    // Confirm negative stock
    if (formData.new_stock < 0) {
      if (!confirm(`This will result in negative stock (${formData.new_stock}). Continue?`)) {
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const adjustmentValue = formData.adjustment_type === "add" 
        ? adjustmentQty 
        : -adjustmentQty;
      
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sku: formData.sku,
          adjustment: adjustmentValue,
          reason: formData.reason,
          notes: formData.notes || null,
          adjustment_date: formData.adjustment_date
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Stock adjustment completed successfully");
        
        // Reset form
        setFormData({
          adjustment_date: formatDateForInput(new Date()),
          sku: "",
          product_name: "",
          current_stock: 0,
          adjustment_type: "add",
          adjustment_quantity: "",
          new_stock: 0,
          reason: "",
          notes: ""
        });
        
        // Refresh data
        fetchData();
      } else {
        throw new Error(result.error || "Failed to adjust stock");
      }
      
    } catch (err) {
      console.error("Error adjusting stock:", err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading stock adjustment data...</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Stock Adjustment</h1>
        <p className="text-gray-600 mt-2">Manually adjust inventory levels for stock corrections</p>
      </div>

      {/* Adjustment Form */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Stock Adjustment</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Date
              </label>
              <input
                type="date"
                value={formData.adjustment_date}
                onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                required
                disabled={submitting}
              />
            </div>

            {/* Product */}
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

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("add")}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.adjustment_type === "add"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <TrendingUp className="inline-block w-4 h-4 mr-2" />
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("subtract")}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.adjustment_type === "subtract"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <TrendingDown className="inline-block w-4 h-4 mr-2" />
                  Reduce Stock
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Quantity
              </label>
              <input
                type="number"
                value={formData.adjustment_quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="10"
                min="1"
                required
                disabled={submitting}
              />
            </div>

            {/* Stock Preview */}
            {formData.sku && (
              <div className="md:col-span-2">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(formData.current_stock)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Adjustment</p>
                      <p className={`text-2xl font-bold ${
                        formData.adjustment_type === "add" ? "text-green-600" : "text-red-600"
                      }`}>
                        {formData.adjustment_type === "add" ? "+" : "-"}
                        {formatNumber(parseInt(formData.adjustment_quantity) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">New Stock</p>
                      <p className={`text-2xl font-bold ${
                        formData.new_stock < 0 ? "text-red-600" : "text-gray-900"
                      }`}>
                        {formatNumber(formData.new_stock)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                required
                disabled={submitting}
              >
                <option value="">Select Reason</option>
                <option value="Stock Opname">Stock Opname</option>
                <option value="Damaged Goods">Damaged Goods</option>
                <option value="Lost Items">Lost Items</option>
                <option value="Data Correction">Data Correction</option>
                <option value="Return from Customer">Return from Customer</option>
                <option value="Sample/Giveaway">Sample/Giveaway</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Additional notes..."
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !formData.sku || !formData.adjustment_quantity}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="inline-block w-4 h-4 mr-2" />
                  Submit Adjustment
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Adjustments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Adjustments</h2>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="px-3 py-1 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
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
                  Adjustment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adjustmentsList.length > 0 ? (
                adjustmentsList.map((adjustment) => (
                  <tr key={adjustment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(adjustment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{adjustment.product_name}</div>
                      <div className="text-sm text-gray-500">{adjustment.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        adjustment.quantity_change > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {adjustment.quantity_change > 0 ? "+" : ""}
                        {formatNumber(adjustment.quantity_change)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(adjustment.new_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {adjustment.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {adjustment.notes || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No adjustments found
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
