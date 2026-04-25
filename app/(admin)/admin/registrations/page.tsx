"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  UserPlus,
  UserCheck,
  Package,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";

interface Registration {
  id: string;
  name: string;
  email: string;
  provider: string;
  city: string | null;
  category: string | null;
  business_type: string | null;
  slug: string | null;
  orders_count: number;
  products_count: number;
  has_wa_sent: boolean;
  has_referral: boolean;
  has_community: boolean;
  stage: "baru_daftar" | "setup_done" | "ada_produk" | "ada_pesanan" | "aktif";
  created_at: string;
}

interface Summary {
  total: number;
  stageCounts: Record<string, number>;
  providerCounts: Record<string, number>;
}

const stageConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  baru_daftar: {
    label: "New signup",
    color: "bg-gray-100 text-gray-600",
    icon: <UserPlus className="h-3.5 w-3.5" />,
  },
  setup_done: {
    label: "Setup",
    color: "bg-blue-100 text-blue-700",
    icon: <UserCheck className="h-3.5 w-3.5" />,
  },
  ada_produk: {
    label: "Has products",
    color: "bg-purple-100 text-purple-700",
    icon: <Package className="h-3.5 w-3.5" />,
  },
  ada_pesanan: {
    label: "Has orders",
    color: "bg-amber-100 text-amber-700",
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
  },
  aktif: {
    label: "Active",
    color: "bg-green-100 text-green-700",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
};

const providerLabels: Record<string, string> = {
  email: "Email",
  google: "Google",
  github: "GitHub",
};

const dayOptions = [7, 14, 30, 60, 90];

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/registrations?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setRegistrations(d.registrations || []);
        setSummary(d.summary || null);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const filtered = useMemo(() => {
    let result = registrations;
    if (stageFilter !== "all") {
      result = result.filter((r) => r.stage === stageFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.city && r.city.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [registrations, search, stageFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Signups</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-9 px-3 text-sm bg-card border border-border rounded-lg shadow-sm"
        >
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
      </div>

      {/* Funnel cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
          <FunnelCard
            label="Total"
            count={summary.total}
            active={stageFilter === "all"}
            onClick={() => setStageFilter("all")}
            className="bg-card"
          />
          {Object.entries(stageConfig).map(([key, cfg]) => (
            <FunnelCard
              key={key}
              label={cfg.label}
              count={summary.stageCounts[key] || 0}
              active={stageFilter === key}
              onClick={() =>
                setStageFilter(stageFilter === key ? "all" : key)
              }
              className={stageFilter === key ? cfg.color : "bg-card"}
            />
          ))}
        </div>
      )}

      {/* Provider breakdown */}
      {summary && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">Signup method:</span>
          {Object.entries(summary.providerCounts).map(([provider, count]) => (
            <span key={provider}>
              {providerLabels[provider] || provider}:{" "}
              <span className="font-medium text-foreground">{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search name, email, city, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full pl-10 pr-3 bg-card border border-border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card transition-colors placeholder:text-muted-foreground"
        />
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {registrations.length} signups
      </p>

      {/* Desktop table */}
      <div className="hidden lg:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Nama
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Email
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Metode
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Kota
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Products
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Orders
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Stage
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Daftar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => {
              const cfg = stageConfig[r.stage];
              return (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${r.id}`}
                      className="text-foreground hover:text-primary hover:underline font-medium"
                    >
                      {r.name}
                    </Link>
                    <div className="flex items-center gap-1 mt-0.5">
                      {r.has_referral && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          Referral
                        </span>
                      )}
                      {r.has_community && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          Komunitas
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {providerLabels[r.provider] || r.provider}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.city || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.products_count}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.orders_count}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-full ${cfg.color}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(r.created_at)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {search || stageFilter !== "all"
                    ? "No matches"
                    : "No signups yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {filtered.map((r) => {
          const cfg = stageConfig[r.stage];
          return (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/users/${r.id}`}
                    className="text-sm font-medium text-foreground truncate hover:text-primary hover:underline block"
                  >
                    {r.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.email}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-full shrink-0 ${cfg.color}`}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span>{providerLabels[r.provider] || r.provider}</span>
                {r.city && <span>{r.city}</span>}
                <span>
                  {r.products_count} produk, {r.orders_count} pesanan
                </span>
                <span>{formatDate(r.created_at)}</span>
              </div>
              {(r.has_referral || r.has_community) && (
                <div className="flex items-center gap-1">
                  {r.has_referral && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      Referral
                    </span>
                  )}
                  {r.has_community && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      Komunitas
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground">
            {search || stageFilter !== "all"
              ? "No matches"
              : "No signups yet"}
          </p>
        )}
      </div>
    </div>
  );
}

function FunnelCard({
  label,
  count,
  active,
  onClick,
  className,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border shadow-sm p-3 text-left transition-all ${className} ${
        active
          ? "border-primary/30 ring-2 ring-primary/20"
          : "border-border hover:border-primary/20"
      }`}
    >
      <p className="text-lg font-semibold text-foreground">{count}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </button>
  );
}
