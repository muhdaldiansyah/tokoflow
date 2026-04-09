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
  Plug,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

const PROVIDER_INFO = {
  'shopee': {
    label: 'Shopee',
    description: 'Sync orders + stock dari Shopee Open API',
    docsUrl: 'https://open.shopee.com/documents',
    color: 'bg-orange-500',
  },
  'tokopedia': {
    label: 'Tokopedia',
    description: 'Sync orders + stock dari Tokopedia Mitra API',
    docsUrl: 'https://developer.tokopedia.com/openapi',
    color: 'bg-green-500',
  },
  'tiktok-shop': {
    label: 'TikTok Shop',
    description: 'Sync orders + stock dari TikTok Shop Partner Center',
    docsUrl: 'https://partner.tiktokshop.com/docv2/page/authorization',
    color: 'bg-black',
  },
};

export default function MarketplacePage() {
  const { session, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const isOwner = profile?.role === 'owner';

  const [connections, setConnections] = useState([]);
  const [supportedChannels, setSupportedChannels] = useState([]);
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
      setSupportedChannels(json.data?.supported_channels || []);
    } catch (err) {
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
      if (res.status === 501) {
        // Expected scaffolding response
        toast.info(json.error || 'Konfigurasi credentials di .env dulu', { duration: 8000 });
      } else if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      } else if (json.data?.redirect_url) {
        // Real OAuth flow once it's wired up
        window.location.href = json.data.redirect_url;
        return;
      }
      await fetchConnections(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
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
      if (res.status === 501) {
        toast.info(json.error || 'Sync belum diimplementasi', { duration: 8000 });
      } else if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed (${res.status})`);
      } else {
        toast.success('Sync berhasil');
      }
      await fetchConnections(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (conn) => {
    if (!session) return;
    if (!confirm(`Disconnect ${PROVIDER_INFO[conn.channel]?.label || conn.channel}?`)) return;
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

  // Index existing connections by channel for the connect cards
  const connByChannel = new Map(connections.map(c => [c.channel, c]));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Integration</h1>
          <p className="text-gray-600 mt-1">
            Connect Tokoflow ke Shopee, Tokopedia, dan TikTok Shop untuk sync orders + stock otomatis.
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-900">
        <p className="font-medium mb-2">⚠️ Status: Scaffolding</p>
        <p className="text-xs leading-relaxed">
          Halaman ini sudah siap secara struktur (database table, API endpoints, OAuth flow stubs)
          tapi <strong>belum melakukan sync nyata</strong> ke marketplace. Untuk mengaktifkan, tambahkan
          credentials platform di env vars (lihat <code>.env.example</code>) lalu implementasi OAuth
          callback di <code>/api/marketplace/connect/[provider]/route.js</code>. Specs lengkap ada
          di komentar TODO masing-masing endpoint.
        </p>
      </div>

      {error && (
        <div className="bg-white border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportedChannels.map(channel => {
          const info = PROVIDER_INFO[channel] || { label: channel, description: '', color: 'bg-gray-500' };
          const conn = connByChannel.get(channel);
          const isConnecting = connectingProvider === channel;
          const isSyncing = conn && syncingId === conn.id;

          return (
            <div key={channel} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className={`${info.color} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold`}>
                  {info.label[0]}
                </div>
                {conn && (
                  conn.is_active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" title="Connected" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" title="Pending setup" />
                  )
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{info.label}</h3>
              <p className="text-xs text-gray-600 mb-4 flex-grow">{info.description}</p>

              {conn && (
                <div className="text-xs text-gray-500 mb-4 space-y-1 border-t border-gray-100 pt-3">
                  {conn.shop_name && <p>Shop: <span className="text-gray-700">{conn.shop_name}</span></p>}
                  {conn.last_sync_at && (
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last sync: {formatDate(conn.last_sync_at)}
                    </p>
                  )}
                  {conn.last_sync_status && (
                    <p className={
                      conn.last_sync_status === 'success' ? 'text-green-600' :
                      conn.last_sync_status === 'failed'  ? 'text-red-600' :
                      conn.last_sync_status === 'running' ? 'text-blue-600' : ''
                    }>
                      Status: {conn.last_sync_status}
                    </p>
                  )}
                  {conn.last_sync_error && (
                    <p className="text-red-600 text-[10px] leading-tight" title={conn.last_sync_error}>
                      {conn.last_sync_error.length > 60 ? conn.last_sync_error.slice(0, 60) + '...' : conn.last_sync_error}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {conn && conn.is_active ? (
                  <>
                    <button
                      onClick={() => handleSync(conn)}
                      disabled={isSyncing}
                      className="w-full inline-flex items-center justify-center px-3 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                      {isSyncing
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing...</>
                        : <><RefreshCw className="h-4 w-4 mr-2" />Sync sekarang</>}
                    </button>
                    <button
                      onClick={() => handleDisconnect(conn)}
                      className="w-full px-3 py-2 text-sm text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(channel)}
                    disabled={isConnecting}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isConnecting
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                      : <><Plug className="h-4 w-4 mr-2" />{conn ? 'Retry connect' : 'Connect'}</>}
                  </button>
                )}
                <a
                  href={info.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-xs text-gray-600 hover:text-gray-900"
                >
                  API docs <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
