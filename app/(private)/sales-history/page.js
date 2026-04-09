"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, AlertCircle, Download, Filter, Calendar, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate, formatNumber, formatDateForInput, formatPercentage } from "../../../lib/utils/format";

const GROUP_OPTIONS = [
  { value: "channel", label: "Per Channel",  keyHeader: "Channel" },
  { value: "product", label: "Per Produk",   keyHeader: "Produk" },
  { value: "date",    label: "Per Tanggal",  keyHeader: "Tanggal" },
];

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
    sku: "",
    customer_id: ""
  });

  // Summary grouping (channel | product | date)
  const [groupBy, setGroupBy] = useState("channel");
  // Sort key for the summary table — defaults to revenue desc
  const [sortKey, setSortKey] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");

  const [channels, setChannels] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchTransactions();
    }
  }, [filters, groupBy]);

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

      // Fetch customers (lookup only — no stats join needed for the table)
      const customersRes = await fetch("/api/customers?with_stats=0", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        if (customersData.success && Array.isArray(customersData.data)) {
          setCustomers(customersData.data);
        } else {
          setCustomers([]);
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
      if (filters.customer_id) params.append("customer_id", filters.customer_id);
      params.append("limit", "100");

      // Fetch transactions
      const transactionsRes = await fetch(`/api/sales/transactions?${params}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");
      const transactionsData = await transactionsRes.json();

      // Fetch summary using the currently selected grouping
      const summaryRes = await fetch(`/api/sales/transactions/summary?${params}&group_by=${groupBy}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!summaryRes.ok) throw new Error("Failed to fetch summary");
      const summaryData = await summaryRes.json();

      console.log('Transactions response:', transactionsData);
      console.log('Summary response:', summaryData);
      
      if (transactionsData.success) {
        const transactions = transactionsData.data?.transactions || [];
        setTransactions(Array.isArray(transactions) ? transactions : []);
      } else {
        setTransactions([]);
      }
      
      if (summaryData.success) {
        const summary = summaryData.data?.summary || [];
        setSummary(Array.isArray(summary) ? summary : []);
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
      if (filters.customer_id) params.append("customer_id", filters.customer_id);
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
  const customersList = Array.isArray(customers) ? customers : [];
  const customerById = new Map(customersList.map(c => [c.id, c]));
  const transactionsList = Array.isArray(transactions) ? transactions : [];
  const summaryList = Array.isArray(summary) ? summary : [];
  
  // Calculate totals from summary. The API returns rows shaped as
  // { key, transactions, quantity, revenue, profit, modalCost, packingCost,
  //   affiliateCost, marketplaceFee, margin }
  const totals = summaryList.reduce((acc, item) => ({
    revenue:      acc.revenue      + Number(item.revenue      || 0),
    profit:       acc.profit       + Number(item.profit       || 0),
    quantity:     acc.quantity     + Number(item.quantity     || 0),
    transactions: acc.transactions + Number(item.transactions || 0),
  }), { revenue: 0, profit: 0, quantity: 0, transactions: 0 });

  const overallMargin = totals.revenue > 0 ? (totals.profit / totals.revenue * 100).toFixed(1) : 0;

  // Sort summary client-side based on the selected column
  const sortedSummary = [...summaryList].sort((a, b) => {
    const av = sortKey === "key" ? String(a.key || "") : Number(a[sortKey] || 0);
    const bv = sortKey === "key" ? String(b.key || "") : Number(b[sortKey] || 0);
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ?  1 : -1;
    return 0;
  });

  const currentGroup = GROUP_OPTIONS.find(g => g.value === groupBy) || GROUP_OPTIONS[0];

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "key" ? "asc" : "desc");
    }
  };

  const sortIndicator = (key) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <select
                value={filters.customer_id}
                onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Customers</option>
                <option value="none">— Tanpa customer —</option>
                {customersList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setFilters({ start_date: "", end_date: "", channel: "", sku: "", customer_id: "" })}
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

      {/* Summary panel — toggle between grouping by channel / product / date */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Ringkasan {currentGroup.label}
          </h2>
          <div className="inline-flex bg-gray-100 p-1 rounded-lg" role="group">
            {GROUP_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGroupBy(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  groupBy === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {sortedSummary.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Belum ada data penjualan untuk filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("key")}
                  >
                    {currentGroup.keyHeader}{sortIndicator("key")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("transactions")}
                  >
                    Transaksi{sortIndicator("transactions")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("quantity")}
                  >
                    Qty{sortIndicator("quantity")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue{sortIndicator("revenue")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("profit")}
                  >
                    Profit{sortIndicator("profit")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("margin")}
                  >
                    Margin{sortIndicator("margin")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSummary.map((item) => {
                  const marginNum = Number(item.margin) || 0;
                  const profitNum = Number(item.profit) || 0;
                  const marginClass =
                    marginNum >= 30 ? "text-green-600" :
                    marginNum >= 20 ? "text-blue-600" :
                    marginNum >= 10 ? "text-orange-600" :
                                      "text-red-600";
                  return (
                    <tr key={item.key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {groupBy === "date" ? formatDate(item.key) : item.key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(item.transactions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${profitNum >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(item.profit)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${marginClass}`}>
                        {marginNum.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">Total</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatNumber(totals.transactions)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatNumber(totals.quantity)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(totals.revenue)}
                  </td>
                  <td className={`px-6 py-3 text-sm text-right font-semibold ${totals.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totals.profit)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                    {overallMargin}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

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
                  Customer
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
                  const cust = transaction.customer_id != null
                    ? customerById.get(transaction.customer_id)
                    : null;

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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {cust
                          ? <Link href={`/customers/${cust.id}`} className="hover:text-blue-600 hover:underline">{cust.name}</Link>
                          : <span className="text-gray-400">—</span>}
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
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
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
