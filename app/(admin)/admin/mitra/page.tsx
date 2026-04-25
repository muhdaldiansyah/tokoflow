"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MitraRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  referral_code: string;
  referral_balance: number;
  referral_total_earned: number;
  referral_total_paid: number;
  referred_count: number;
  created_at: string;
}

import { formatRupiah, formatDate } from "@/lib/utils/format";

export default function AdminMitraPage() {
  const [mitras, setMitras] = useState<MitraRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutId, setPayoutId] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");

  useEffect(() => {
    fetch("/api/admin/mitra")
      .then((r) => r.json())
      .then((d) => setMitras(d.mitras || []))
      .finally(() => setLoading(false));
  }, []);

  async function handlePayout(userId: string) {
    const amount = parseInt(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    try {
      const res = await fetch("/api/admin/mitra", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      // Update local state
      setMitras((prev) =>
        prev.map((m) =>
          m.id === userId
            ? {
                ...m,
                referral_balance: m.referral_balance - amount,
                referral_total_paid: m.referral_total_paid + amount,
              }
            : m
        )
      );
      toast.success(`Payout ${formatRupiah(amount)} processed`);
      setPayoutId(null);
      setPayoutAmount("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process payout");
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
      <h1 className="text-xl font-semibold text-foreground">Partners & referrals</h1>

      {mitras.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">
          No active partners or referrals yet.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Referred</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total commission</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Paid</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mitras.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.referral_code}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex h-6 px-2 text-[10px] font-medium rounded-full items-center ${
                        m.role === "mitra" ? "bg-violet-50 text-violet-700" : "bg-muted text-muted-foreground"
                      }`}>
                        {m.role === "mitra" ? "Partner" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{m.referred_count}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatRupiah(m.referral_total_earned)}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{formatRupiah(m.referral_balance)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatRupiah(m.referral_total_paid)}</td>
                    <td className="px-4 py-3 text-center">
                      {m.referral_balance > 0 && (
                        payoutId === m.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={payoutAmount}
                              onChange={(e) => setPayoutAmount(e.target.value)}
                              placeholder="Quantity"
                              className="w-24 h-7 px-2 text-xs border rounded-md"
                              max={m.referral_balance}
                            />
                            <button
                              onClick={() => handlePayout(m.id)}
                              className="h-7 px-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => { setPayoutId(null); setPayoutAmount(""); }}
                              className="h-7 px-2 text-xs font-medium rounded-md border hover:bg-muted"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setPayoutId(m.id); setPayoutAmount(String(m.referral_balance)); }}
                            className="h-7 px-3 text-xs font-medium rounded-md bg-warm-green text-white hover:bg-warm-green/90"
                          >
                            Bayar
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {mitras.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <span className={`inline-flex h-6 px-2 text-[10px] font-medium rounded-full items-center shrink-0 ${
                    m.role === "mitra" ? "bg-violet-50 text-violet-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {m.role === "mitra" ? "Partner" : "User"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="font-mono">{m.referral_code}</span>
                  <span>{m.referred_count} referred</span>
                  <span>{formatDate(m.created_at)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs font-medium text-foreground">{formatRupiah(m.referral_total_earned)}</p>
                    <p className="text-[10px] text-muted-foreground">Komisi</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs font-medium text-foreground">{formatRupiah(m.referral_balance)}</p>
                    <p className="text-[10px] text-muted-foreground">Balance</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs font-medium text-foreground">{formatRupiah(m.referral_total_paid)}</p>
                    <p className="text-[10px] text-muted-foreground">Paid</p>
                  </div>
                </div>
                {m.referral_balance > 0 && (
                  payoutId === m.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="Quantity"
                        className="flex-1 h-9 px-3 text-sm border rounded-lg"
                        max={m.referral_balance}
                      />
                      <button
                        onClick={() => handlePayout(m.id)}
                        className="h-9 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => { setPayoutId(null); setPayoutAmount(""); }}
                        className="h-9 px-3 text-xs font-medium rounded-lg border hover:bg-muted"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setPayoutId(m.id); setPayoutAmount(String(m.referral_balance)); }}
                      className="w-full h-9 text-xs font-medium rounded-lg bg-warm-green text-white hover:bg-warm-green/90"
                    >
                      Bayar Komisi
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
