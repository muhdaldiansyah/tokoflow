"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuthSimple";
import { formatCurrency, formatNumber } from "../../../lib/utils/format";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  ShoppingCart,
  Boxes,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

const QUICK_ACTIONS = [
  { title: "Input Penjualan",   description: "Catat transaksi penjualan baru",  href: "/sales",          icon: ShoppingCart, color: "bg-blue-500"   },
  { title: "Barang Masuk",      description: "Update stok barang masuk",         href: "/incoming-goods", icon: Boxes,        color: "bg-green-500"  },
  { title: "Lihat Inventory",   description: "Cek stok dan status barang",       href: "/inventory",      icon: Package,      color: "bg-purple-500" },
  { title: "Laporan Penjualan", description: "Analisis data penjualan",          href: "/sales-history",  icon: FileText,     color: "bg-orange-500" },
];

function StatCard({ label, value, sublabel, icon: Icon, accent = "gray", href }) {
  const accentClass = {
    gray:   "text-gray-900",
    green:  "text-green-600",
    red:    "text-red-600",
    blue:   "text-blue-600",
    orange: "text-orange-600",
  }[accent];

  const body = (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-2xl font-semibold mt-1 truncate ${accentClass}`}>{value}</p>
          {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
        </div>
        {Icon && (
          <div className="ml-3 p-2 rounded-lg bg-gray-50">
            <Icon className={`h-5 w-5 ${accentClass}`} />
          </div>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href} className="block hover:shadow-md transition-shadow rounded-lg">{body}</Link> : body;
}

function ChannelBar({ channel, revenue, profit, share }) {
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-900 capitalize">{channel}</span>
        <span className="text-gray-600">{formatCurrency(revenue)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full"
          style={{ width: `${Math.max(2, Math.min(100, share))}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
        <span>Profit {formatCurrency(profit)}</span>
        <span>Margin {margin.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { session, profile, user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!session) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      // Fetch dashboard summary + customer lifetime stats in parallel.
      // The customer endpoint already does the JOIN; the dashboard endpoint
      // doesn't know about customers, so we keep concerns separated.
      const auth = { Authorization: `Bearer ${session.access_token}` };
      const [dashRes, custRes] = await Promise.all([
        fetch("/api/dashboard", { headers: auth }),
        fetch("/api/customers?with_stats=1", { headers: auth }),
      ]);

      if (!dashRes.ok) throw new Error(`Failed to load dashboard (${dashRes.status})`);
      const payload = await dashRes.json();
      setData(payload);

      if (custRes.ok) {
        const cj = await custRes.json();
        if (cj.success && Array.isArray(cj.data)) {
          setCustomers(cj.data);
        }
      }
      // A failed customers fetch shouldn't block the dashboard — leave the
      // top customers card empty in that case.
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading && session) fetchDashboard(false);
  }, [authLoading, session, fetchDashboard]);

  if (authLoading || (loading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-1">Gagal memuat dashboard</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboard(false)}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Coba lagi
          </button>
        </div>
      </div>
    );
  }

  // Defensive defaults so the page renders cleanly on an empty DB
  const sales = data?.salesSummary       ?? { totalRevenue: 0, totalProfit: 0, totalQuantity: 0, transactionCount: 0, averageMargin: 0 };
  const today = data?.todaySales         ?? { revenue: 0, profit: 0, count: 0 };
  const alerts = data?.inventoryAlerts   ?? { negativeStock: [], zeroStock: [], lowStock: [], totalAlerts: 0 };
  const pending = data?.pendingTransactions ?? { sales: 0, incoming: 0, total: 0 };
  const topProducts = data?.topProducts  ?? [];
  const channels    = data?.salesByChannel ?? [];
  const recent      = data?.recentActivities ?? { sales: [], incoming: [] };

  const totalChannelRevenue = channels.reduce((a, c) => a + Number(c.revenue || 0), 0);
  const channelsRanked = [...channels]
    .map(c => ({ ...c, share: totalChannelRevenue > 0 ? (Number(c.revenue) / totalChannelRevenue) * 100 : 0 }))
    .sort((a, b) => Number(b.revenue) - Number(a.revenue));

  // Top 5 customers by lifetime revenue. Anyone with 0 orders is filtered
  // out so we don't show empty customers above customers with actual sales.
  const topCustomers = [...customers]
    .filter(c => Number(c.total_spent || 0) > 0)
    .sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0))
    .slice(0, 5);

  const greetingName = profile?.full_name || user?.email || "User";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Halo {greetingName}, ini ringkasan bisnis Anda.</p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenue (semua waktu)"
          value={formatCurrency(sales.totalRevenue)}
          sublabel={`${formatNumber(sales.transactionCount)} transaksi`}
          icon={TrendingUp}
          accent="gray"
        />
        <StatCard
          label="Profit Bersih"
          value={formatCurrency(sales.totalProfit)}
          sublabel={`Margin ${Number(sales.averageMargin || 0).toFixed(2)}%`}
          icon={ArrowUpRight}
          accent={Number(sales.totalProfit) >= 0 ? "green" : "red"}
        />
        <StatCard
          label="Penjualan Hari Ini"
          value={formatCurrency(today.revenue)}
          sublabel={`${formatNumber(today.count)} transaksi · profit ${formatCurrency(today.profit)}`}
          icon={ShoppingCart}
          accent="blue"
        />
        <StatCard
          label="Unit Terjual"
          value={formatNumber(sales.totalQuantity)}
          sublabel="Total kuantitas"
          icon={Boxes}
          accent="gray"
        />
      </div>

      {/* Alert + pending row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Stok Perlu Perhatian"
          value={formatNumber(alerts.totalAlerts)}
          sublabel={`${alerts.negativeStock.length} negatif · ${alerts.zeroStock.length} kosong · ${alerts.lowStock.length} low`}
          icon={AlertTriangle}
          accent={
            alerts.negativeStock.length > 0 || alerts.zeroStock.length > 0
              ? "red"
              : alerts.lowStock.length > 0
                ? "orange"
                : "gray"
          }
          href="/inventory?filter=alert"
        />
        <StatCard
          label="Pending Penjualan"
          value={formatNumber(pending.sales)}
          sublabel="Status 'ok' menunggu diproses"
          icon={Clock}
          accent={pending.sales > 0 ? "orange" : "gray"}
          href="/sales"
        />
        <StatCard
          label="Pending Barang Masuk"
          value={formatNumber(pending.incoming)}
          sublabel="Status 'ok' menunggu diproses"
          icon={Clock}
          accent={pending.incoming > 0 ? "orange" : "gray"}
          href="/incoming-goods"
        />
      </div>

      {/* Channels (left) + Top Produk + Top Customers (stacked right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Penjualan per Channel</h2>
            <Link href="/sales-history" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center">
              Detail <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {channelsRanked.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              Belum ada data penjualan. Mulai dengan{" "}
              <Link href="/sales" className="text-gray-900 underline">input penjualan</Link>.
            </p>
          ) : (
            <div className="space-y-4">
              {channelsRanked.map(ch => (
                <ChannelBar
                  key={ch.channel}
                  channel={ch.channel}
                  revenue={Number(ch.revenue)}
                  profit={Number(ch.profit)}
                  share={ch.share}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Top Produk */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Produk</h2>
              <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center">
                Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">Belum ada data.</p>
            ) : (
              <ol className="space-y-3">
                {topProducts.map((p, i) => (
                  <li key={p.sku} className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-gray-400 w-5 mt-0.5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name || p.sku}</p>
                      <p className="text-xs text-gray-500">{p.sku}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatNumber(p.totalQuantity)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Top Customers */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
              <Link href="/customers" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center">
                Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                Belum ada penjualan yang ter-attribusi ke customer.{" "}
                <Link href="/customers" className="text-gray-900 underline">Tambah customer</Link>
                {" "}lalu pilih saat input penjualan.
              </p>
            ) : (
              <ol className="space-y-3">
                {topCustomers.map((c, i) => (
                  <li key={c.id} className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-gray-400 w-5 mt-0.5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline truncate block"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {formatNumber(c.orders || 0)} order{Number(c.orders || 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(c.total_spent || 0)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Penjualan Terbaru (hari ini)</h2>
            <Link href="/sales-history" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center">
              Riwayat <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {recent.sales.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Belum ada penjualan hari ini.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.sales.slice(0, 6).map(s => (
                <li key={s.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.product_name || s.sku}</p>
                    <p className="text-xs text-gray-500 capitalize">{s.channel} · {formatNumber(s.quantity)} unit</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-3">
                    {formatCurrency(Number(s.revenue ?? s.selling_price * s.quantity))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Barang Masuk Terbaru</h2>
            <Link href="/incoming-goods" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center">
              Semua <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {recent.incoming.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Belum ada barang masuk.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.incoming.slice(0, 6).map(g => (
                <li key={g.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{g.product_name || g.sku}</p>
                    <p className="text-xs text-gray-500">{g.sku}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 ml-3 inline-flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-0.5" />
                    {formatNumber(g.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions (kept from original — useful navigation) */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
