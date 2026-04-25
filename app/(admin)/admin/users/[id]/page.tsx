"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, ShoppingBag, Users, Eye, Package, FileText,
  MapPin, Tag, Check, Circle, ExternalLink,
} from "lucide-react";

interface UserDetail {
  profile: {
    id: string;
    email: string;
    full_name?: string;
    business_name?: string;
    business_address?: string;
    business_phone?: string;
    slug?: string;
    city?: string;
    business_category?: string;
    business_description?: string;
    logo_url?: string;
    role: string;
    orders_used?: number;
    order_credits?: number;
    unlimited_until?: string | null;
    bisnis_until?: string | null;
    referral_code?: string;
    referral_balance?: number;
    referral_total_earned?: number;
    first_wa_sent_at?: string;
    created_at: string;
  };
  stats: {
    totalOrders: number;
    totalRevenue: number;
    totalCollected: number;
    totalProducts: number;
    totalCustomers: number;
    totalPageViews: number;
    totalInvoices: number;
    ordersByStatus: Record<string, number>;
    ordersBySource: Record<string, number>;
  };
  onboarding: {
    hasAccount: boolean;
    hasProducts: boolean;
    hasProfile: boolean;
    hasCityCategory: boolean;
    hasOrders: boolean;
    hasWaSent: boolean;
    complete: number;
    total: number;
  };
  orders: {
    id: string;
    order_number: string;
    customer_name?: string;
    total: number;
    paid_amount: number;
    status: string;
    source: string;
    created_at: string;
  }[];
  products: {
    id: string;
    name: string;
    price: number;
    category?: string;
    is_available: boolean;
    stock?: number | null;
    image_url?: string | null;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  menunggu: "bg-red-100 text-red-700",
  processed: "bg-yellow-100 text-yellow-700",
  shipped: "bg-orange-100 text-orange-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

import { formatRupiah } from "@/lib/utils/format";
const fmt = formatRupiah;

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="text-center py-20 text-muted-foreground">User tidak ditemukan</div>;

  const { profile: p, stats: s, onboarding: ob, orders, products } = data;
  const isUnlimited = p.unlimited_until && new Date(p.unlimited_until) > new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="h-9 w-9 flex items-center justify-center rounded-lg border bg-card hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">{p.business_name || p.full_name || "User"}</h1>
          <p className="text-xs text-muted-foreground">{p.email} · Joined {new Date(p.created_at).toLocaleDateString("en-MY")}</p>
        </div>
        {p.slug && (
          <a href={`https://tokoflow.com/${p.slug}`} target="_blank" rel="noopener" className="ml-auto h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border hover:bg-muted">
            <ExternalLink className="w-3 h-3" /> View store
          </a>
        )}
      </div>

      {/* Profile info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard label="Kota" value={p.city || "—"} icon={<MapPin className="w-4 h-4" />} />
        <InfoCard label="Kategori" value={p.business_category || "—"} icon={<Tag className="w-4 h-4" />} />
        <InfoCard label="Role" value={p.role} />
        <InfoCard label="Quota" value={isUnlimited ? "Unlimited" : `${p.orders_used || 0}/50 + ${p.order_credits || 0} credits`} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Orders" value={s.totalOrders} icon={<ShoppingBag className="w-4 h-4 text-blue-500" />} />
        <StatCard label="Revenue" value={fmt(s.totalRevenue)} icon={<ShoppingBag className="w-4 h-4 text-green-500" />} />
        <StatCard label="Produk" value={s.totalProducts} icon={<Package className="w-4 h-4 text-purple-500" />} />
        <StatCard label="Customers" value={s.totalCustomers} icon={<Users className="w-4 h-4 text-orange-500" />} />
        <StatCard label="Kunjungan" value={s.totalPageViews} icon={<Eye className="w-4 h-4 text-cyan-500" />} />
        <StatCard label="Invoices" value={s.totalInvoices} icon={<FileText className="w-4 h-4 text-amber-500" />} />
        <StatCard label="Terkumpul" value={fmt(s.totalCollected)} />
        <StatCard label="Piutang" value={fmt(s.totalRevenue - s.totalCollected)} />
      </div>

      {/* Onboarding + Source breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Onboarding */}
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-3">Onboarding ({ob.complete}/{ob.total})</h3>
          <div className="h-1.5 bg-muted rounded-full mb-3">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(ob.complete / ob.total) * 100}%` }} />
          </div>
          <div className="space-y-2">
            {[
              { label: "Daftar akun", done: ob.hasAccount },
              { label: "Add product", done: ob.hasProducts },
              { label: "Lengkapi profil", done: ob.hasProfile },
              { label: "Isi kota & kategori", done: ob.hasCityCategory },
              { label: "Create order", done: ob.hasOrders },
              { label: "Send WA", done: ob.hasWaSent },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-2">
                {step.done ? (
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-green-600" /></div>
                ) : (
                  <Circle className="w-4 h-4 text-gray-300" />
                )}
                <span className={`text-xs ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-3">Breakdown</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(s.ordersByStatus).map(([status, count]) => (
                  <span key={status} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || "bg-gray-100"}`}>
                    {status}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">Sumber</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(s.ordersBySource).map(([source, count]) => (
                  <span key={source} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                    {source === "order_link" ? "Store link" : source === "whatsapp" ? "WhatsApp" : "Manual"}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold">Recent orders ({orders.length})</h3>
        </div>
        {orders.length > 0 ? (
          <div className="divide-y">
            {orders.map((o) => (
              <div key={o.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-muted-foreground">{o.order_number}</span>
                  <span className="text-xs text-foreground ml-2">{o.customer_name || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{fmt(o.total)}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[o.status] || "bg-gray-100"}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">None yet pesanan</div>
        )}
      </div>

      {/* Products */}
      {products.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Produk ({products.length})</h3>
          </div>
          <div className="divide-y">
            {products.map((pr) => (
              <div key={pr.id} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground">{pr.name}</span>
                  {pr.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{pr.category}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{fmt(pr.price)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pr.is_available ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {pr.is_available ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-3 flex items-center gap-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <div>
        <span className="text-[11px] text-muted-foreground block">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}
