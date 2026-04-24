"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  plan: string;
  plan_expiry: string | null;
  orders_used: number;
  orders_limit: number;
  ai_credits_used: number;
  ai_credits_limit: number;
  created_at: string;
}

const planLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  trial: "Free", // legacy
  warung: "Plus", // legacy
  toko: "Pro", // legacy
};

function formatPlanLabel(plan: string, planExpiry: string | null): string {
  const label = planLabels[plan] || plan;
  if (planExpiry && new Date(planExpiry) < new Date()) {
    return `${label} (Berakhir)`;
  }
  return label;
}

const roleLabels: Record<string, string> = {
  user: "User",
  admin: "Admin",
  moderator: "Moderator",
};

const roleBadgeClasses: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800",
  moderator:
    "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
  user: "bg-muted text-muted-foreground border-border",
};

import { formatDate } from "@/lib/utils/format";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState("user");

  const canChangeRoles = currentUserRole === "admin";

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setCurrentUserRole(d.currentUserRole || "user");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function changeRole(userId: string, newRole: string) {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Role diubah ke ${roleLabels[newRole]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah role");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Users</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full pl-10 pr-3 bg-card border border-border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card transition-colors placeholder:text-muted-foreground"
        />
      </div>

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
                Role
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Plan
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Orders
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Kredit AI
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3"><Link href={`/admin/users/${u.id}`} className="text-foreground hover:text-primary hover:underline font-medium">{u.full_name}</Link></td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  {canChangeRoles ? (
                    <RoleDropdown
                      user={u}
                      updating={updatingId === u.id}
                      onChangeRole={changeRole}
                    />
                  ) : (
                    <RoleBadge role={u.role} />
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatPlanLabel(u.plan, u.plan_expiry)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.orders_used}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.ai_credits_used}/{u.ai_credits_limit === -1 ? "∞" : u.ai_credits_limit}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(u.created_at)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {search ? "Tidak ditemukan" : "Belum ada user"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/users/${u.id}`} className="text-sm font-medium text-foreground truncate hover:text-primary hover:underline block">
                  {u.full_name}
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                  {u.email}
                </p>
              </div>
              {canChangeRoles ? (
                <RoleDropdown
                  user={u}
                  updating={updatingId === u.id}
                  onChangeRole={changeRole}
                />
              ) : (
                <RoleBadge role={u.role} />
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatPlanLabel(u.plan, u.plan_expiry)}</span>
              <span>AI: {u.ai_credits_used}/{u.ai_credits_limit === -1 ? "∞" : u.ai_credits_limit}</span>
              <span>{formatDate(u.created_at)}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground">
            {search ? "Tidak ditemukan" : "Belum ada user"}
          </p>
        )}
      </div>
    </div>
  );
}

function RoleDropdown({
  user,
  updating,
  onChangeRole,
}: {
  user: UserRow;
  updating: boolean;
  onChangeRole: (userId: string, role: string) => void;
}) {
  const roles = ["user", "admin", "moderator"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={updating}
          className={`inline-flex h-7 px-2.5 text-xs font-medium rounded-full border items-center gap-1 transition-colors ${
            roleBadgeClasses[user.role] || roleBadgeClasses.user
          }`}
        >
          {updating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              {roleLabels[user.role] || user.role}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {roles.map((r) => (
          <DropdownMenuItem
            key={r}
            disabled={r === user.role}
            onClick={() => onChangeRole(user.id, r)}
          >
            {roleLabels[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex h-7 px-2.5 text-xs font-medium rounded-full border items-center ${
        roleBadgeClasses[role] || roleBadgeClasses.user
      }`}
    >
      {roleLabels[role] || role}
    </span>
  );
}
