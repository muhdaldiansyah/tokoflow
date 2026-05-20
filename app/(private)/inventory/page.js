"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuthSimple";
import { Loader2, AlertCircle, Package, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, History, X, MinusCircle } from "lucide-react";
import { formatNumber, formatDate } from "../../../lib/utils/format";
import Link from "next/link";

const VALID_FILTERS = new Set(["all", "alert", "negative", "zero", "low", "normal"]);

export default function InventoriPage() {
  const { session, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialFilter = (() => {
    const fromUrl = searchParams.get("filter");
    return VALID_FILTERS.has(fromUrl) ? fromUrl : "all";
  })();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [filter, setFilter] = useState(initialFilter); // all | alert | negative | zero | low | normal
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      fetchInventory();
    } else if (!authLoading && !session) {
      setError("Authentication required");
      setLoading(false);
    }
  }, [authLoading, session]);

  const fetchInventory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (!session) {
        throw new Error("No session found");
      }

      const response = await fetch("/api/inventory", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const result = await response.json();
      
      console.log('Inventory API response:', result);
      
      if (result.success) {
        setInventory(result.data.inventory || []);
      } else {
        throw new Error(result.error || "Failed to load inventory");
      }
    } catch (err) {
      console.error("Inventory error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMovements = async (sku) => {
    setLoadingMovements(true);

    try {
      if (!session) throw new Error("No session found");

      const response = await fetch(`/api/inventory/movements?sku=${sku}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch movements");

      const result = await response.json();
      
      if (result.success) {
        setMovements(result.data || []);
        setSelectedSku(sku);
      } else {
        throw new Error(result.error || "Failed to load movements");
      }
    } catch (err) {
      console.error("Movement error:", err);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Ensure inventory is always an array
  const inventoryList = Array.isArray(inventory) ? inventory : [];

  // Helper to read the canonical status — falls back if API hasn't been
  // refreshed yet to include the generated column.
  const statusOf = (item) =>
    item.stock_status
    ?? (item.stock < 0
          ? "negative"
          : item.stock === 0
            ? "zero"
            : item.stock <= (item.low_stock_threshold ?? 10)
              ? "low"
              : "normal");

  // Filter inventory based on selected filter and search term
  const filteredInventory = inventoryList.filter(item => {
    const status = statusOf(item);
    let matchesFilter = true;
    if (filter === "negative") matchesFilter = status === "negative";
    else if (filter === "zero") matchesFilter = status === "zero";
    else if (filter === "low") matchesFilter = status === "low";
    else if (filter === "normal") matchesFilter = status === "normal";
    else if (filter === "alert") matchesFilter = status === "negative" || status === "zero" || status === "low";

    // Apply search filter
    const matchesSearch =
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate summary stats from stock_status
  const stats = inventoryList.reduce(
    (acc, i) => {
      const s = statusOf(i);
      acc.total += 1;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { total: 0, negative: 0, zero: 0, low: 0, normal: 0 }
  );
  stats.alert = stats.negative + stats.zero + stats.low;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
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
            onClick={fetchInventory}
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
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600 mt-2">Monitor and manage your stock levels</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`text-left bg-white rounded-lg shadow p-6 transition-all ${
            filter === 'all' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Produk</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('negative')}
          className={`text-left bg-white rounded-lg shadow p-6 transition-all ${
            filter === 'negative' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stok Negatif</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.negative}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('zero')}
          className={`text-left bg-white rounded-lg shadow p-6 transition-all ${
            filter === 'zero' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stok Kosong</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.zero}</p>
            </div>
            <MinusCircle className="h-8 w-8 text-red-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('low')}
          className={`text-left bg-white rounded-lg shadow p-6 transition-all ${
            filter === 'low' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stok Low</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.low}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('normal')}
          className={`text-left bg-white rounded-lg shadow p-6 transition-all ${
            filter === 'normal' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stok Normal</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.normal}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </button>
      </div>

      {filter === 'alert' && (
        <div className="-mt-4 mb-6 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between gap-3">
          <p className="text-sm text-orange-800">
            <span className="font-medium">Menampilkan semua stok perlu perhatian</span>
            {' '}({stats.alert} produk: {stats.negative} negatif, {stats.zero} kosong, {stats.low} low)
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!session) return;
                try {
                  const res = await fetch('/api/alerts/ack', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${session.access_token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ acknowledge_all: true }),
                  });
                  if (res.ok) {
                    // Bell will refresh on its 60s tick; nothing else to update
                  }
                } catch {
                  // ignore
                }
              }}
              className="text-sm text-orange-700 hover:text-orange-900 underline"
            >
              Tandai sudah dilihat
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="text-sm text-orange-700 hover:text-orange-900 underline"
            >
              Reset filter
            </button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Inventory</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by SKU or name..."
                className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => fetchInventory(true)}
                disabled={refreshing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Movement</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const status = statusOf(item);
                  const statusLabel = {
                    negative: 'Negatif',
                    zero:     'Kosong',
                    low:      'Low',
                    normal:   'Normal',
                  }[status];
                  const statusBadgeClass = {
                    negative: 'bg-red-100 text-red-800',
                    zero:     'bg-red-100 text-red-800',
                    low:      'bg-orange-100 text-orange-800',
                    normal:   'bg-green-100 text-green-800',
                  }[status];
                  const stockTextClass = {
                    negative: 'text-red-600',
                    zero:     'text-red-600',
                    low:      'text-orange-600',
                    normal:   'text-gray-900',
                  }[status];

                  return (
                    <tr key={item.sku}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${stockTextClass}`}>{formatNumber(item.stock)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ≤ {formatNumber(item.low_stock_threshold ?? 10)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.last_movement ? formatDate(item.last_movement) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => fetchMovements(item.sku)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement Modal */}
      {selectedSku && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Stock Movements - {selectedSku}
                </h3>
                <button
                  onClick={() => {
                    setSelectedSku(null);
                    setMovements([]);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingMovements ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin h-8 w-8 text-gray-400 mx-auto" />
                </div>
              ) : movements.length > 0 ? (
                <div className="space-y-4">
                  {movements.map((movement, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {movement.type === 'sale' ? 'Sale' : 
                           movement.type === 'incoming' ? 'Incoming Goods' :
                           movement.type === 'adjustment' ? 'Adjustment' : 
                           movement.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(movement.date, true)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.quantity > 0 ? '+' : ''}{formatNumber(movement.quantity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Balance: {formatNumber(movement.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No movements found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
