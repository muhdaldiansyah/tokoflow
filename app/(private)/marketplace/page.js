"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuthSimple";
import { formatDate } from "../../../lib/utils/format";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Plug,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Radio,
} from "lucide-react";

// Tokopedia is intentionally NOT listed: its legacy OpenAPI is being wound
// down and Tokopedia storefronts are absorbed into TikTok Shop Partner
// Center. The TikTok Shop connection covers both (the shop card surfaces
// seller_type: "Tokopedia Shop" vs "TikTok Shop" when a merchant has both).
const PROVIDER_INFO = {
  'tiktok-shop': {
    label: 'TikTok Shop',
    description: 'TikTok Shop Indonesia + toko Tokopedia. Order, produk, dan status shipping sync otomatis.',
    docsUrl: 'https://partner.tiktokshop.com/docv2',
    color: 'bg-black',
  },
  'shopee': {
    label: 'Shopee',
    description: 'Sync order Shopee dengan detail fee asli dari escrow settlement.',
    docsUrl: 'https://open.shopee.com/documents',
    color: 'bg-orange-500',
  },
};

const ERROR_MESSAGES = {
  session_expired: 'Sesi kamu habis saat proses OAuth. Login ulang lalu coba lagi.',
  state_invalid: 'Verifikasi keamanan gagal (state tidak valid). Coba connect lagi dari awal.',
  provider_unknown: 'Provider marketplace tidak dikenal.',
  no_code: 'OAuth dibatalkan atau gagal di sisi marketplace. Coba lagi.',
  no_shop_id: 'Marketplace tidak mengirim shop_id. Pastikan kamu memilih toko saat authorize.',
  no_shops_authorized: 'Tidak ada toko yang diotorisasi. Pilih minimal satu toko di halaman marketplace.',
  env_missing: 'Konfigurasi server belum lengkap. Hubungi admin Tokoflow.',
  callback_failed: 'Gagal memproses callback OAuth. Coba lagi atau hubungi admin.',
};

export default function MarketplacePage() {
  const { session, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOwner = profile?.role === 'owner';

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchConnections = useCallback(async (isRefresh = false) => {
    if (!session) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Failed (${res.status})`);
      setConnections(json.data?.connections || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  // Handle OAuth callback feedback (?connected=... / ?error=...)
  useEffect(() => {
    const connected = searchParams.get('connected');
    const errorCode = searchParams.get('error');
    const shops = searchParams.get('shops');

    if (connected) {
      const label = PROVIDER_INFO[connected]?.label || connected;
      const shopSuffix = shops && Number(shops) > 1 ? ` (${shops} toko)` : '';
      toast.success(`${label} terhubung${shopSuffix}. Sync pertama akan jalan dalam beberapa menit.`, {
        duration: 6000,
      });
      // Clean the URL
      router.replace('/marketplace', { scroll: false });
    } else if (errorCode) {
      toast.error(ERROR_MESSAGES[errorCode] || `OAuth gagal: ${errorCode}`, { duration: 8000 });
      router.replace('/marketplace', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!authLoading && session) {
      if (profile && profile.role !== 'owner') {
        router.replace('/dashboard');
        return;
      }
      fetchConnections(false);
    }
  }, [authLoading, session, profile, router, fetchConnections]);

  const handleConnect = async (provider) => {
    if (!session) return;
    setConnectingProvider(provider);
    try {
      const res = await fetch(`/api/marketplace/connect/${provider}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      }
      if (json.data?.redirect_url) {
        // Navigate the browser to the marketplace's OAuth page.
        // After approval the callback route redirects back here.
        window.location.href = json.data.redirect_url;
        return;
      }
      throw new Error('Server tidak mengembalikan redirect_url');
    } catch (err) {
      toast.error(err.message);
      setConnectingProvider(null);
    }
  };

  const handleSync = async (conn) => {
    if (!session) return;
    setSyncingId(conn.id);
    try {
      const res = await fetch(`/api/marketplace/sync/${conn.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      }
      const count = json.data?.orders_processed ?? 0;
      toast.success(
        count > 0
          ? `Sync selesai — ${count} order baru diproses.`
          : 'Sync selesai — tidak ada order baru.'
      );
      await fetchConnections(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (conn) => {
    if (!session) return;
    const label = PROVIDER_INFO[conn.channel]?.label || conn.channel;
    if (!confirm(`Disconnect ${label}${conn.shop_name ? ` (${conn.shop_name})` : ''}?\n\nOrder yang sudah masuk ke Tokoflow tetap aman. Hanya sync berhenti.`)) return;
    try {
      const res = await fetch(`/api/marketplace?id=${conn.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `Failed (${res.status})`);
      toast.success('Disconnected');
      await fetchConnections(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (authLoading || (loading && connections.length === 0 && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-gray-700" />
      </div>
    );
  }

  if (!isOwner) return null;

  // Group connections by channel. Each channel may have multiple rows (e.g.
  // a merchant with both a TikTok Shop and a migrated Tokopedia storefront
  // under the same OAuth token).
  const connByChannel = new Map();
  for (const c of connections) {
    if (!connByChannel.has(c.channel)) connByChannel.set(c.channel, []);
    connByChannel.get(c.channel).push(c);
  }

  const supportedChannels = Object.keys(PROVIDER_INFO);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Integration</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Hubungkan toko TikTok Shop (termasuk Tokopedia pasca-migrasi) dan Shopee. Order masuk otomatis,
            profit per transaksi dihitung dengan fee asli dari escrow marketplace.
          </p>
        </div>
        <button
          onClick={() => fetchConnections(true)}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="bg-white border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {supportedChannels.map((channel) => {
          const info = PROVIDER_INFO[channel];
          const rows = connByChannel.get(channel) || [];
          const isConnecting = connectingProvider === channel;

          return (
            <div key={channel} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${info.color} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold`}>
                    {info.label[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{info.label}</h3>
                    <p className="text-xs text-gray-500">{rows.length} toko terhubung</p>
                  </div>
                </div>
                <a
                  href={info.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-600"
                  title="API docs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <p className="text-xs text-gray-600 mb-4">{info.description}</p>

              {/* Per-shop cards */}
              {rows.length > 0 && (
                <div className="space-y-3 mb-4">
                  {rows.map((conn) => (
                    <ShopCard
                      key={conn.id}
                      conn={conn}
                      syncing={syncingId === conn.id}
                      onSync={() => handleSync(conn)}
                      onDisconnect={() => handleDisconnect(conn)}
                    />
                  ))}
                </div>
              )}

              {/* Connect button — always shown so merchants can add more shops */}
              <button
                onClick={() => handleConnect(channel)}
                disabled={isConnecting}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {isConnecting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menghubungkan...</>
                  : <><Plug className="h-4 w-4 mr-2" />{rows.length > 0 ? `Hubungkan toko ${info.label} lain` : `Connect ${info.label}`}</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-shop connection card
// ---------------------------------------------------------------------------

function ShopCard({ conn, syncing, onSync, onDisconnect }) {
  const statusClass =
    conn.last_sync_status === 'success' ? 'text-green-600' :
    conn.last_sync_status === 'failed'  ? 'text-red-600' :
    conn.last_sync_status === 'running' ? 'text-blue-600' : 'text-gray-500';

  return (
    <div className={`border rounded-md p-3 ${conn.is_active ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm text-gray-900 truncate">
              {conn.shop_name || `Shop ${conn.shop_id}`}
            </p>
            {conn.seller_type && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                {conn.seller_type.replace(/_/g, ' ')}
              </span>
            )}
            {conn.is_active ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-gray-500 truncate">ID: {conn.shop_id}</p>
        </div>
      </div>

      <div className="text-[11px] space-y-0.5 mb-3">
        {conn.last_sync_at && (
          <p className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            Last sync: {formatDate(conn.last_sync_at)}
          </p>
        )}
        {conn.last_webhook_at && (
          <p className="flex items-center gap-1 text-gray-500">
            <Radio className="h-3 w-3" />
            Last webhook: {formatDate(conn.last_webhook_at)}
          </p>
        )}
        {conn.last_sync_status && (
          <p className={statusClass}>Status: {conn.last_sync_status}</p>
        )}
        {conn.last_sync_error && (
          <p className="text-red-600 leading-tight" title={conn.last_sync_error}>
            {conn.last_sync_error.length > 80 ? conn.last_sync_error.slice(0, 80) + '…' : conn.last_sync_error}
          </p>
        )}
        {!conn.is_active && conn.deactivated_reason && (
          <p className="text-red-700 leading-tight">
            Dinonaktifkan: {conn.deactivated_reason.length > 80 ? conn.deactivated_reason.slice(0, 80) + '…' : conn.deactivated_reason}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {conn.is_active && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs text-white bg-gray-900 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {syncing
              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Sync…</>
              : <><RefreshCw className="h-3 w-3 mr-1" />Sync</>}
          </button>
        )}
        <button
          onClick={onDisconnect}
          className="flex-1 px-2 py-1.5 text-xs text-red-700 bg-red-50 rounded hover:bg-red-100 border border-red-200"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
