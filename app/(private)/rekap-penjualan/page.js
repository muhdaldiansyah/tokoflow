"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, AlertCircle, Download, Filter, Calendar, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate, formatNumber, formatDateForInput, formatPercentage } from "../../../lib/utils/format";

export default function RekapPenjualanPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    channel: "",
    sku: ""
  });
  
  const [channels, setChannels] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchTransactions();
    }
  }, [filters]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      // Fetch channels
      const feesRes = await fetch("/api/marketplace-fees", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (feesRes.ok) {
        const feesData = await feesRes.json();
        if (feesData.success && Array.isArray(feesData.data)) {
          setChannels(feesData.data.map(f => f.channel));
        } else {
          setChannels(['Shopee', 'Tokopedia', 'TikTok Shop', 'Offline']); // Default channels
        }
      } else {
        setChannels(['Shopee', 'Tokopedia', 'TikTok Shop', 'Offline']); // Default channels
      }

      // Fetch products
      const productsRes = await fetch("/api/products", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      console.log('Products response status:', productsRes.status);
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        console.log('Products data:', productsData);
        if (productsData.success) {
          setProducts(productsData.data.products || []);
        } else {
          setProducts([]);
        }
      }

      await fetchTransactions();
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");

      // Build query params
      const params = new URLSearchParams();
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.channel) params.append("channel", filters.channel);
      if (filters.sku) params.append("sku", filters.sku);
      params.append("limit", "100");

      // Fetch transactions
      const transactionsRes = await fetch(`/api/sales/transactions?${params}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");
      const transactionsData = await transactionsRes.json();

      // Fetch summary
      const summaryRes = await fetch(`/api/sales/transactions/summary?${params}&group_by=channel`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!summaryRes.ok) throw new Error("Failed to fetch summary");
      const summaryData = await summaryRes.json();

      console.log('Transactions response:', transactionsData);
      console.log('Summary response:', summaryData);
      
      if (transactionsData.success) {
        setTransactions(Array.isArray(transactionsData.data) ? transactionsData.data : []);
      } else {
        setTransactions([]);
      }
      
      if (summaryData.success) {
        setSummary(Array.isArray(summaryData.data) ? summaryData.data : []);
      } else {
        setSummary([]);
      }
      
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message);
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");

      // Build query params
      const params = new URLSearchParams();
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.channel) params.append("channel", filters.channel);
      if (filters.sku) params.append("sku", filters.sku);
      params.append("format", "csv");

      // Create download link
      const url = `/api/sales/transactions/export?${params}`;
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error("Failed to export data");

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `sales_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading sales history...</p>
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

  // Ensure arrays are always arrays
  const channelsList = Array.isArray(channels) ? channels : [];
  const productsList = Array.isArray(products) ? products : [];
  const transactionsList = Array.isArray(transactions) ? transactions : [];
  const summaryList = Array.isArray(summary) ? summary : [];
  
  // Calculate totals from summary
  const totals = summaryList.reduce((acc, item) => ({
    revenue: acc.revenue + (item.total_revenue || 0),
    profit: acc.profit + (item.total_profit || 0),
    quantity: acc.quantity + (item.total_quantity || 0),
    transactions: acc.transactions + (item.transaction_count || 0)
  }), { revenue: 0, profit: 0, quantity: 0, transactions: 0 });

  const overallMargin = totals.revenue > 0 ? (totals.profit / totals.revenue * 100).toFixed(1) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
        <p className="text-gray-600 mt-2">View and analyze your sales transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel
              </label>
              <select
                value={filters.channel}
                onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Channels</option>
                {channelsList.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={filters.sku}
                onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Products</option>
                {productsList.map((product) => (
                  <option key={product.sku} value={product.sku}>
                    {product.sku} - {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setFilters({ start_date: "", end_date: "", channel: "", sku: "" })}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
            <button
              onClick={() => fetchTransactions(true)}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`inline-block w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(totals.revenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatNumber(totals.transactions)} transactions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Profit</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(totals.profit)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {overallMargin}% margin
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Units Sold</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatNumber(totals.quantity)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            units
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Avg Transaction</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(totals.transactions > 0 ? totals.revenue / totals.transactions : 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            per transaction
          </p>
        </div>
      </div>

      {/* Channel Summary */}
      {summaryList && summaryList.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Summary by Channel</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaryList.map((item) => (
                  <tr key={item.channel}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.channel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(item.transaction_count)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(item.total_quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.total_revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(item.total_profit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.profit_margin}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions ({transactionsList.length})
            </h2>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Download className="inline-block w-4 h-4 mr-2" />
              Export CSV
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
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactionsList.length > 0 ? (
                transactionsList.map((transaction) => {
                  const totalCosts = 
                    (transaction.modal_cost || 0) * transaction.quantity +
                    (transaction.packing_cost || 0) * transaction.quantity +
                    (transaction.affiliate_cost || 0) +
                    (transaction.marketplace_fee || 0);
                  const margin = transaction.revenue > 0 
                    ? (transaction.net_profit / transaction.revenue * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.product_name}</div>
                        <div className="text-sm text-gray-500">{transaction.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.channel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(transaction.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(transaction.selling_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(totalCosts)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(transaction.net_profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          margin > 30 ? 'text-green-600' : 
                          margin > 20 ? 'text-blue-600' : 
                          margin > 10 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No transactions found
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
