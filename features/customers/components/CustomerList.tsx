"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { getCustomers } from "../services/customer.service";
import { getPiutangSummary } from "@/features/orders/services/order.service";
import type { Customer } from "../types/customer.types";
import type { PiutangSummary } from "@/features/orders/services/order.service";
import { copy } from "@/lib/copy";

type Tab = "semua" | "belum_lunas";

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [piutang, setPiutang] = useState<PiutangSummary | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("semua");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, [debouncedSearch]);

  useEffect(() => {
    loadPiutang();
  }, []);

  async function loadCustomers() {
    setIsLoading(true);
    const data = await getCustomers(debouncedSearch || undefined);
    setCustomers(data);
    setIsLoading(false);
  }

  async function loadPiutang() {
    const data = await getPiutangSummary();
    setPiutang(data);
  }

  // Filter piutang list by search
  const filteredPiutang = useMemo(() => piutang?.customers.filter((c) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      c.customer_name.toLowerCase().includes(q) ||
      c.customer_phone.toLowerCase().includes(q)
    );
  }) || [], [piutang, debouncedSearch]);

  const TABS: { label: string; value: Tab }[] = [
    { label: "All", value: "semua" },
    ...(piutang && piutang.totalDebt > 0
      ? [{ label: `Unpaid (${piutang.customerCount})`, value: "belum_lunas" as Tab }]
      : []),
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between min-h-9">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Customers</h1>
            {customers.length > 0 && (
              <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {customers.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Customer history and lifetime spend</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or phone..."
          className="w-full h-11 pl-10 pr-4 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card transition-colors placeholder:text-muted-foreground"
        />
      </div>

      {/* Tabs — underline style matching Orders */}
      {TABS.length > 1 && (
        <div className="flex gap-0 border-b">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 h-10 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Piutang View */}
      {activeTab === "belum_lunas" && (
        <>
          {filteredPiutang.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                {debouncedSearch ? "No matches" : "No outstanding balances"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card divide-y shadow-sm">
              {filteredPiutang.map((customer) => (
                <div
                  key={customer.customer_phone || customer.customer_name}
                  className="px-4 py-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <Link
                        href={customer.customer_id ? `/customers/${customer.customer_id}` : "#"}
                        className="text-sm text-foreground truncate block hover:underline"
                      >
                        {customer.customer_name}
                      </Link>
                      {customer.customer_phone && (
                        <p className="text-xs text-muted-foreground">{customer.customer_phone.startsWith("60") ? "0" + customer.customer_phone.slice(2) : customer.customer_phone}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-red-600">
                        RM {customer.total_debt.toLocaleString("en-MY")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customer.order_count} orders
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Normal Customer List */}
      {activeTab === "semua" && (
        <>
          {isLoading ? (
            <div className="rounded-xl border bg-card divide-y shadow-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="h-4 bg-muted animate-pulse rounded w-24" />
                    <div className="h-3 bg-muted animate-pulse rounded w-20" />
                  </div>
                  <div className="text-right space-y-1.5">
                    <div className="h-4 bg-muted animate-pulse rounded w-20 ml-auto" />
                    <div className="h-3 bg-muted animate-pulse rounded w-16 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? copy.empty.customersNoMatch() : copy.empty.customers()}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card divide-y shadow-sm">
              {customers.map((customer) => {
                // Find piutang for this customer
                const debt = piutang?.customers.find(
                  (p) => p.customer_id === customer.id
                );

                return (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="block px-4 py-3 active:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm text-foreground truncate">
                          {customer.name}
                        </h3>
                        {customer.phone && (
                          <p className="text-sm text-muted-foreground">{customer.phone.startsWith("60") ? "0" + customer.phone.slice(2) : customer.phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${debt && debt.total_debt > 0 ? "text-red-600" : "text-foreground"}`}>
                          RM {(debt && debt.total_debt > 0 ? debt.total_debt : customer.total_spent).toLocaleString("en-MY")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.total_orders} orders
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
