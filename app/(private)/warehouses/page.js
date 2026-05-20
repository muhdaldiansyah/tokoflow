"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuthSimple";
import { formatDate } from "../../../lib/utils/format";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Warehouse,
  X,
  Star,
} from "lucide-react";

const EMPTY_FORM = { id: null, name: "", address: "", is_default: false };

export default function WarehousesPage() {
  const { session, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const isOwner = profile?.role === 'owner';

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchWarehouses = useCallback(async (isRefresh = false) => {
    if (!session) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/warehouses", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Failed (${res.status})`);
      setWarehouses(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Warehouses load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading && session) {
      if (profile && profile.role !== 'owner') {
        router.replace('/dashboard');
        return;
      }
      fetchWarehouses(false);
    }
  }, [authLoading, session, profile, router, fetchWarehouses]);

  const openCreate = () => { setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (w) => {
    setForm({
      id: w.id,
      name: w.name || "",
      address: w.address || "",
      is_default: w.is_default || false,
    });
    setModalOpen(true);
  };
  const closeModal = () => { if (!submitting) setModalOpen(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return;
    if (!form.name.trim()) {
      toast.error("Nama warehouse wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = form.id != null;
      const url = isEdit ? `/api/warehouses/${form.id}` : "/api/warehouses";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          is_default: form.is_default,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Failed (${res.status})`);
      toast.success(isEdit ? "Warehouse diperbarui" : "Warehouse ditambahkan");
      setModalOpen(false);
      await fetchWarehouses(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (w) => {
    if (!session) return;
    if (!confirm(`Hapus warehouse "${w.name}"? Produk yang ada di warehouse ini akan kehilangan referensinya.`)) return;
    setDeletingId(w.id);
    try {
      const res = await fetch(`/api/warehouses/${w.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Failed (${res.status})`);
      toast.success("Warehouse dihapus");
      await fetchWarehouses(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || (loading && warehouses.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-gray-700" />
      </div>
    );
  }

  if (!isOwner) return null; // useEffect already redirects

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-600 mt-1">Kelola lokasi stok / cabang. {warehouses.length} warehouse aktif.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchWarehouses(true)}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" /> Tambah Warehouse
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-xs text-amber-800">
        <p className="font-medium mb-1">Cara kerja multi-warehouse di Tokoflow</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Setiap produk milik <strong>satu</strong> warehouse. Untuk SKU yang sama di 2 cabang, buat 2 produk dengan SKU berbeda (mis. <code>ABC-JKT</code>, <code>ABC-SBY</code>).</li>
          <li>Sales / incoming goods / stock adjustments otomatis affect warehouse milik produk-nya.</li>
          <li>Default warehouse dipakai saat membuat produk baru tanpa memilih warehouse eksplisit.</li>
        </ul>
      </div>

      {error && warehouses.length === 0 && (
        <div className="bg-white border border-red-200 rounded-lg p-6 text-center mb-6">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {warehouses.length === 0 ? (
          <div className="p-12 text-center">
            <Warehouse className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Belum ada warehouse.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.map(w => (
                  <tr key={w.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">{w.address || <span className="text-gray-400">—</span>}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {w.is_default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(w.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(w)} className="text-gray-500 hover:text-gray-900 mr-3">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(w)}
                        disabled={deletingId === w.id || w.is_default || warehouses.length <= 1}
                        title={w.is_default ? 'Tidak bisa hapus default' : warehouses.length <= 1 ? 'Tidak bisa hapus warehouse terakhir' : ''}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {deletingId === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {form.id ? "Edit Warehouse" : "Tambah Warehouse"}
              </h2>
              <button onClick={closeModal} disabled={submitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
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
                  placeholder="Cabang Jakarta"
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Jl. Sudirman No. 123, Jakarta Pusat"
                  disabled={submitting}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="rounded border-gray-300"
                  disabled={submitting}
                />
                <span>Set sebagai default warehouse</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} disabled={submitting}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {form.id ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
