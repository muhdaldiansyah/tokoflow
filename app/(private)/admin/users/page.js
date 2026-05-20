"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuthSimple";
import { formatDate } from "../../../../lib/utils/format";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Shield,
  ShieldOff,
  Users as UsersIcon,
  Crown,
} from "lucide-react";

export default function AdminUsersPage() {
  const { session, profile, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isOwner = profile?.role === 'owner';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (!session) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      }
      setUsers(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Users load error:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading && session) {
      // Hard-block staff from this page entirely.
      if (profile && profile.role !== 'owner') {
        router.replace('/dashboard');
        return;
      }
      fetchUsers(false);
    }
  }, [authLoading, session, profile, router, fetchUsers]);

  const handleRoleChange = async (target, newRole) => {
    if (!session) return;
    if (target.role === newRole) return;

    const verb = newRole === 'owner' ? 'mempromote' : 'menurunkan';
    const label = `${target.full_name || target.email}`;
    if (!confirm(`Yakin ingin ${verb} ${label} menjadi ${newRole}?`)) return;

    setUpdatingId(target.id);
    try {
      const res = await fetch(`/api/users/${target.id}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      }
      toast.success(`${label} sekarang ${newRole}`);
      await fetchUsers(true);
    } catch (err) {
      console.error("Role update error:", err);
      toast.error(err.message || "Gagal mengubah role");
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || (loading && users.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600">Memuat daftar user...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-amber-200 rounded-lg p-6 text-center">
          <Shield className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="text-amber-700 font-medium mb-1">Akses dibatasi</p>
          <p className="text-sm text-gray-600">Halaman ini hanya untuk owner.</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-1">Gagal memuat user</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchUsers(false)}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const ownerCount = users.filter(u => u.role === 'owner').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Kelola role tim Anda. {ownerCount} owner · {users.length - ownerCount} staff
          </p>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
        <p className="font-medium mb-1">Catatan</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>User baru otomatis terdaftar sebagai <strong>staff</strong>.</li>
          <li>User pertama saat install otomatis jadi <strong>owner</strong>.</li>
          <li>Owner tidak bisa di-demote kalau hanya tinggal 1 owner di sistem.</li>
          <li>Belum ada fitur invite via email — user harus daftar sendiri di /register dulu, lalu Anda promote di sini.</li>
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Belum ada user terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bergabung</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => {
                  const isSelf = u.id === user?.id;
                  const isLastOwner = u.role === 'owner' && ownerCount <= 1;
                  return (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {u.full_name || <span className="text-gray-400">(tanpa nama)</span>}
                          {isSelf && <span className="ml-2 text-xs text-gray-500">(Anda)</span>}
                        </div>
                        {u.business_name && <div className="text-xs text-gray-500">{u.business_name}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {u.email || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'owner'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.created_at ? formatDate(u.created_at) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {u.role === 'staff' ? (
                          <button
                            onClick={() => handleRoleChange(u, 'owner')}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center text-xs text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-1.5 rounded-md disabled:opacity-50"
                          >
                            {updatingId === u.id
                              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              : <Crown className="h-3 w-3 mr-1" />}
                            Promote ke owner
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(u, 'staff')}
                            disabled={updatingId === u.id || isLastOwner}
                            title={isLastOwner ? 'Tidak bisa menurunkan owner terakhir' : ''}
                            className="inline-flex items-center text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {updatingId === u.id
                              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              : <ShieldOff className="h-3 w-3 mr-1" />}
                            Demote ke staff
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
