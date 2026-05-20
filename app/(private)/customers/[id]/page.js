"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuthSimple";
import { formatCurrency, formatNumber, formatDate } from "../../../../lib/utils/format";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  RefreshCw,
  Phone,
  Calendar,
  ShoppingCart,
  TrendingUp,
  X,
  ExternalLink,
} from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session, profile, loading: authLoading } = useAuth();
  const isOwner = profile?.role === 'owner';

  const customerId = params?.id;

  const [data, setData] = useState(null);   // { customer, sales, stats }
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomer = useCallback(async (isRefresh = false) => {
    if (!session || !customerId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      }
      setData(json.data);
    } catch (err) {
      console.error("Customer detail load error:", err);
      setError(err.message || "Failed to load customer");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, customerId]);

  useEffect(() => {
    if (!authLoading && session) fetchCustomer(false);
  }, [authLoading, session, fetchCustomer]);

  const openEdit = () => {
    if (!data?.customer) return;
    setForm({
      name: data.customer.name || "",
      phone: data.customer.phone || "",
      notes: data.customer.notes || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return;
    if (!form.name.trim()) {
      toast.error("Nama customer wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      }
      toast.success("Customer diperbarui");
      setModalOpen(false);
      await fetchCustomer(true);
    } catch (err) {
      console.error("Customer update error:", err);
      toast.error(err.message || "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!data?.customer) return;
    if (!session) return;
    if (!confirm(`Hapus customer "${data.customer.name}"? Sales history-nya tetap tersimpan tanpa attribusi.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      }
      toast.success("Customer dihapus");
      router.push("/customers");
    } catch (err) {
      console.error("Customer delete error:", err);
      toast.error(err.message || "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || (loading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600">Memuat customer...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-1">Gagal memuat customer</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link
            href="/customers"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  const customer = data?.customer;
  const sales = data?.sales || [];
  const stats = data?.stats || { orders: 0, total_spent: 0, total_profit: 0, last_order_at: null };
  const avgOrderValue = stats.orders > 0 ? stats.total_spent / stats.orders : 0;
  const margin = stats.total_spent > 0 ? (stats.total_profit / stats.total_spent) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/customers"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Semua customer
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            {customer.phone && (
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <Phone className="h-4 w-4 mr-1" />
                {customer.phone}
                <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
              </a>
            )}
            {customer.notes && (
              <p className="mt-2 text-sm text-gray-600 max-w-2xl whitespace-pre-wrap">{customer.notes}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => fetchCustomer(true)}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={openEdit}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-3 py-2 text-sm text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {deleting
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <Trash2 className="h-4 w-4 mr-2" />}
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{formatNumber(stats.orders)}</p>
            </div>
            <ShoppingCart className="h-5 w-5 text-gray-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Lifetime Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1 truncate">
            {formatCurrency(stats.total_spent)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Avg {formatCurrency(avgOrderValue)} / order
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Lifetime Profit</p>
          <p className={`text-2xl font-semibold mt-1 truncate ${stats.total_profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(stats.total_profit)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Margin {margin.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-sm text-gray-600">Last Order</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1 truncate">
                {stats.last_order_at ? formatDate(stats.last_order_at) : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Customer since {formatDate(customer.created_at)}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Sales history */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Penjualan</h2>
          <p className="text-sm text-gray-600 mt-1">
            {sales.length === 0
              ? "Belum ada penjualan yang terhubung ke customer ini."
              : `${formatNumber(sales.length)} transaksi terakhir.`}
          </p>
        </div>

        {sales.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            Belum ada attribusi penjualan untuk customer ini.
            <div className="mt-3">
              <Link
                href="/sales"
                className="text-blue-600 hover:underline"
              >
                Catat penjualan baru →
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map(s => {
                  const m = s.revenue > 0 ? (s.net_profit / s.revenue) * 100 : 0;
                  const profitClass =
                    Number(s.net_profit) >= 0 ? "text-green-600" : "text-red-600";
                  return (
                    <tr key={s.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(s.transaction_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{s.product_name}</div>
                        <div className="text-xs text-gray-500">{s.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                        {s.channel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(s.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(s.selling_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(s.revenue)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${profitClass}`}>
                        {formatCurrency(s.net_profit)}
                        <div className="text-xs text-gray-500 font-normal">{m.toFixed(1)}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-gray-900">Total</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatNumber(sales.reduce((a, s) => a + Number(s.quantity || 0), 0))}
                  </td>
                  <td />
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(stats.total_spent)}
                  </td>
                  <td className={`px-6 py-3 text-sm text-right font-semibold ${stats.total_profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(stats.total_profit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit Customer</h2>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  disabled={submitting}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
