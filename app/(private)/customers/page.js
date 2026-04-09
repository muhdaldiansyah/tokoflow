"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuthSimple";
import { formatCurrency, formatNumber, formatDate } from "../../../lib/utils/format";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Phone,
  X,
} from "lucide-react";

const EMPTY_FORM = { id: null, name: "", phone: "", notes: "" };

export default function CustomersPage() {
  const { session, profile, loading: authLoading } = useAuth();
  const isOwner = profile?.role === 'owner';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCustomers = useCallback(async (isRefresh = false) => {
    if (!session) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`Failed to load customers (${res.status})`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load customers");
      setCustomers(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Customers load error:", err);
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading && session) fetchCustomers(false);
  }, [authLoading, session, fetchCustomers]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setForm({
      id: customer.id,
      name: customer.name || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setForm(EMPTY_FORM);
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
      const isEdit = form.id != null;
      const url = isEdit ? `/api/customers/${form.id}` : "/api/customers";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
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
      toast.success(isEdit ? "Customer diperbarui" : "Customer ditambahkan");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await fetchCustomers(true);
    } catch (err) {
      console.error("Customer save error:", err);
      toast.error(err.message || "Gagal menyimpan customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!session) return;
    if (!confirm(`Hapus customer "${customer.name}"? Sales history-nya tetap tersimpan tanpa attribusi.`)) {
      return;
    }
    setDeletingId(customer.id);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      }
      toast.success("Customer dihapus");
      await fetchCustomers(true);
    } catch (err) {
      console.error("Customer delete error:", err);
      toast.error(err.message || "Gagal menghapus customer");
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side filter (the API also accepts ?search but doing it client-side
  // gives instant feedback while the user types)
  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        (c.phone || "").toLowerCase().includes(term)
      )
    : customers;

  // Aggregate footer
  const totals = filtered.reduce(
    (acc, c) => ({
      orders:       acc.orders       + Number(c.orders       || 0),
      total_spent:  acc.total_spent  + Number(c.total_spent  || 0),
      total_profit: acc.total_profit + Number(c.total_profit || 0),
    }),
    { orders: 0, total_spent: 0, total_profit: 0 }
  );

  if (authLoading || (loading && customers.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600">Memuat customers...</p>
        </div>
      </div>
    );
  }

  if (error && customers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-1">Gagal memuat customers</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchCustomers(false)}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Direktori pelanggan Anda + statistik lifetime per customer.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" /> Tambah Customer
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{formatNumber(filtered.length)}</p>
            </div>
            <Users className="h-8 w-8 text-gray-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Lifetime Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(totals.total_spent)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatNumber(totals.orders)} order(s) attributed</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Lifetime Profit</p>
          <p className={`text-2xl font-semibold mt-1 ${totals.total_profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totals.total_profit)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau nomor HP..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">
              {customers.length === 0
                ? "Belum ada customer."
                : "Tidak ada customer yang cocok dengan pencarian."}
            </p>
            {customers.length === 0 && (
              <button
                onClick={openCreate}
                className="mt-3 inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah customer pertama
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HP</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.notes && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{c.notes}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {c.phone ? (
                        <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-gray-900">
                          <Phone className="h-3 w-3 mr-1" />
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatNumber(c.orders || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(c.total_spent || 0)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                      Number(c.total_profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(c.total_profit || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {c.last_order_at ? formatDate(c.last_order_at) : <span className="text-gray-400">Belum ada</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-gray-500 hover:text-gray-900 mr-3"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Hapus"
                        >
                          {deletingId === c.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {form.id ? "Edit Customer" : "Tambah Customer"}
              </h2>
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
                  placeholder="Bu Ani"
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
                  placeholder="+62 813-xxxx-xxxx"
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
                  placeholder="Reseller PIK, prefer COD, ..."
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
                  {form.id ? "Simpan Perubahan" : "Tambah Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
