"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ShoppingBag, Banknote, UserCheck, Loader2, Eye, LinkIcon, QrCode, Package, DollarSign, MapPin, Tag, AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate, formatShortDate, pct } from "@/lib/utils/format";
import { SOURCE_LABELS } from "@/features/orders/types/order.types";

interface Adoption {
  storeLinkActive: number;
  qrUploaded: number;
  preorderMode: number;
  subscriptionMode: number;
  defaultMode: number;
  withViews: number;
  usersWithProducts: number;
  usersWithCostPrice: number;
  total: number;
}

interface DashboardData {
  totalUsers: number;
  totalOrders: number;
  totalOrderRevenue: number;
  totalTokoflowRevenue: number;
  totalCustomers: number;
  totalPageViews: number;
  adoption: Adoption;
  sourceBreakdown: Record<string, number>;
  dailyTrends: { date: string; orders: number; revenue: number }[];
  marketplace: {
    cityBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    profilesWithCity: number;
    profilesWithCategory: number;
    pendingCount: number;
  };
  recentSignups: { id: string; name: string; created_at: string }[];
  recentOrders: {
    id: string;
    order_number: string;
    customer: string;
    total: number;
    status: string;
    created_at: string;
  }[];
}

const statusLabels: Record<string, string> = {
  new: "Baru", menunggu: "Pending", processed: "Processing", shipped: "Shipped", done: "Completed", cancelled: "Cancelled",
};

const sourceLabels = SOURCE_LABELS;
const shortDate = formatShortDate;

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const a = data.adoption;
  const m = data.marketplace;
  const maxOrders = Math.max(...data.dailyTrends.map(t => t.orders), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total Users" value={data.totalUsers} />
        <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Total orders" value={data.totalOrders} />
        <StatCard icon={<Banknote className="h-4 w-4" />} label="Revenue User" value={formatCurrency(data.totalOrderRevenue)} />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Revenue Tokoflow" value={formatCurrency(data.totalTokoflowRevenue)} />
        <StatCard icon={<UserCheck className="h-4 w-4" />} label="Total customers" value={data.totalCustomers} />
        <StatCard icon={<Eye className="h-4 w-4" />} label="Kunjungan Toko" value={data.totalPageViews} />
      </div>

      {/* Trends Chart */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Last 14 days trend</p>
        </div>
        <div className="flex items-end gap-1 h-32">
          {data.dailyTrends.map((t) => (
            <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-muted-foreground font-medium">{t.orders || ""}</span>
              <div
                className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-all"
                style={{ height: `${Math.max(2, (t.orders / maxOrders) * 100)}%` }}
                title={`${shortDate(t.date)}: ${t.orders} pesanan, ${formatCurrency(t.revenue)}`}
              />
              <span className="text-[8px] text-muted-foreground leading-none">{shortDate(t.date).split(" ")[0]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{shortDate(data.dailyTrends[0]?.date || "")}</span>
          <span>{shortDate(data.dailyTrends[data.dailyTrends.length - 1]?.date || "")}</span>
        </div>
      </div>

      {/* Marketplace Metrics + Pending Alert */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Marketplace</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profil lengkap kota</span>
              <span className="font-medium">{m.profilesWithCity}/{a.total} ({pct(m.profilesWithCity, a.total)})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profil lengkap kategori</span>
              <span className="font-medium">{m.profilesWithCategory}/{a.total} ({pct(m.profilesWithCategory, a.total)})</span>
            </div>
            {Object.keys(m.cityBreakdown).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Per Kota</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(m.cityBreakdown).sort((a, b) => b[1] - a[1]).map(([city, count]) => (
                    <span key={city} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{city}: {count}</span>
                  ))}
                </div>
              </div>
            )}
            {Object.keys(m.categoryBreakdown).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Per Kategori</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(m.categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <span key={cat} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{cat}: {count}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending alert + Feature adoption summary */}
        <div className="space-y-4">
          {m.pendingCount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">{m.pendingCount} pending orders</p>
              </div>
              <p className="text-xs text-amber-700 mt-1">Orders via store link exceeding merchant free quota.</p>
            </div>
          )}

          <div className="rounded-xl border bg-card shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Adoption</p>
            </div>
            <div className="space-y-2">
              <AdoptionRow icon={<LinkIcon className="h-3.5 w-3.5" />} label="Store link" value={a.storeLinkActive} total={a.total} />
              <AdoptionRow icon={<Package className="h-3.5 w-3.5" />} label="Products" value={a.usersWithProducts} total={a.total} />
              <AdoptionRow icon={<QrCode className="h-3.5 w-3.5" />} label="DuitNow QR" value={a.qrUploaded} total={a.total} />
              <AdoptionRow icon={<Banknote className="h-3.5 w-3.5" />} label="Cost price" value={a.usersWithCostPrice} total={a.total} />
              <AdoptionRow icon={<Eye className="h-3.5 w-3.5" />} label="Visits" value={a.withViews} total={a.total} />
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-muted">Default: {a.defaultMode}</span>
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-amber-50 text-amber-700 border-amber-200">Pre-order: {a.preorderMode}</span>
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-blue-50 text-blue-700 border-blue-200">Subscription: {a.subscriptionMode}</span>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Order source</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.sourceBreakdown).map(([src, count]) => (
                  <span key={src} className="text-xs">{sourceLabels[src] || src}: <span className="font-medium">{count}</span></span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent signups + orders */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-4 border-b">
            <p className="text-sm font-semibold text-foreground">Latest signups</p>
          </div>
          <div className="divide-y">
            {data.recentSignups.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">None yet</p>
            ) : (
              data.recentSignups.map((u) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                  <p className="text-sm text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(u.created_at)}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-4 border-b">
            <p className="text-sm font-semibold text-foreground">Recent orders</p>
          </div>
          <div className="divide-y">
            {data.recentOrders.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">None yet</p>
            ) : (
              data.recentOrders.map((o) => (
                <div key={o.id} className="px-4 py-3 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{o.order_number}</p>
                    <span className="inline-flex h-6 px-2 text-xs font-medium rounded-full border items-center">
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{o.customer}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(o.total)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AdoptionRow({ icon, label, value, total }: { icon: React.ReactNode; label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-foreground w-20">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full">
        <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground w-16 text-right">{value}/{total}</span>
    </div>
  );
}
