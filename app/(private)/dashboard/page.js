"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Package, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";
import { formatCurrency, formatNumber } from "../../../lib/utils/format";
import Link from "next/link";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [pendingSales, setPendingSales] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingSales();
  }, []);

  const fetchPendingSales = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch("/api/sales/input?status=ok", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPendingSales(result.data.filter(s => s.quantity !== null));
        }
      }
    } catch (err) {
      console.error("Error fetching pending sales:", err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      // Get current month date range for more relevant data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await fetch(`/api/dashboard?start_date=${startOfMonth}&end_date=${endOfMonth}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const result = await response.json();
      console.log('Dashboard API response:', result);
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to load data");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const salesSummary = data?.salesSummary || {};
  const recentSales = Array.isArray(data?.todaySales) ? data.todaySales : [];
  const inventoryAlerts = Array.isArray(data?.inventoryAlerts) ? data.inventoryAlerts : [];
  const topProducts = Array.isArray(data?.topProducts) ? data.topProducts : [];
  const lowStockProducts = Array.isArray(data?.lowStockProducts) ? data.lowStockProducts : [];

  // Combine pending and recent sales for display
  const todaySales = [...pendingSales, ...recentSales];
  const pendingSalesCount = pendingSales.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your sales and inventory</p>
      </div>

      {/* Quick Actions */}
      {pendingSalesCount > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                You have <span className="font-semibold">{pendingSalesCount}</span> pending sales to process
              </p>
            </div>
            <Link
              href="/penjualan"
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Process Now →
            </Link>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(salesSummary.today_revenue || 0)}
              </p>
              {salesSummary.today_transactions > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {salesSummary.today_transactions} transactions
                </p>
              )}
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(salesSummary.month_revenue || 0)}
              </p>
              {salesSummary.month_transactions > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {salesSummary.month_transactions} transactions
                </p>
              )}
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Monthly Profit */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Profit</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(salesSummary.month_profit || 0)}
              </p>
              {salesSummary.month_revenue > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {((salesSummary.month_profit / salesSummary.month_revenue) * 100).toFixed(1)}% margin
                </p>
              )}
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {lowStockProducts.length}
              </p>
              {inventoryAlerts.filter(a => a.alert_type === 'negative_stock').length > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {inventoryAlerts.filter(a => a.alert_type === 'negative_stock').length} negative stock!
                </p>
              )}
            </div>
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Sales */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's Sales</h2>
              <Link
                href="/penjualan"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {todaySales.length > 0 ? (
              <div className="space-y-3">
                {todaySales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{sale.product_name}</p>
                      <p className="text-sm text-gray-500">
                        {sale.quantity || 1} × {formatCurrency(sale.selling_price || sale.revenue || 0)} • {sale.channel || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(sale.revenue || (sale.selling_price || 0) * (sale.quantity || 1))}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sale.status === 'ok' && sale.quantity
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {sale.status === 'ok' && sale.quantity ? 'Pending' : 'Processed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sales today</p>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
              <Link
                href="/inventori"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Inventory →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {inventoryAlerts.length > 0 ? (
              <div className="space-y-3">
                {inventoryAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.sku} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{alert.product_name}</p>
                      <p className="text-sm text-gray-500">SKU: {alert.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        alert.stock < 0 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        Stock: {alert.stock}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        alert.alert_type === 'negative_stock' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {alert.alert_type === 'negative_stock' ? 'Negative' : 'Low Stock'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No inventory alerts</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Products (Last 30 Days)</h2>
          </div>
          <div className="p-6">
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-3">Product</th>
                      <th className="pb-3 text-right">Quantity Sold</th>
                      <th className="pb-3 text-right">Revenue</th>
                      <th className="pb-3 text-right">Profit</th>
                      <th className="pb-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topProducts.map((product) => (
                      <tr key={product.sku}>
                        <td className="py-3">
                          <p className="font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                        </td>
                        <td className="py-3 text-right">{formatNumber(product.total_quantity)}</td>
                        <td className="py-3 text-right">{formatCurrency(product.total_revenue)}</td>
                        <td className="py-3 text-right">{formatCurrency(product.total_profit)}</td>
                        <td className="py-3 text-right">
                          <span className={`font-medium ${
                            product.profit_margin > 30 ? 'text-green-600' : 
                            product.profit_margin > 20 ? 'text-blue-600' : 
                            'text-orange-600'
                          }`}>
                            {product.profit_margin}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sales data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
