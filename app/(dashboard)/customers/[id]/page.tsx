"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Pencil, MessageSquare, StickyNote, Calendar, X, Plus, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCustomer, updateCustomer, deleteCustomer } from "@/features/customers/services/customer.service";
import { getOrders } from "@/features/orders/services/order.service";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { openWhatsApp } from "@/lib/utils/wa-open";
import type { Customer } from "@/features/customers/types/customer.types";
import type { Order } from "@/features/orders/types/order.types";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTin, setEditTin] = useState("");
  const [editBrn, setEditBrn] = useState("");
  const [editSstId, setEditSstId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const customerData = await getCustomer(id);
      if (cancelled) return;
      setCustomer(customerData);

      if (customerData) {
        const allOrders = await getOrders({ customerId: customerData.id });
        if (cancelled) return;
        setOrders(allOrders);
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave() {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    const updated = await updateCustomer(id, {
      name: editName.trim(),
      phone: editPhone.trim() || undefined,
      address: editAddress.trim() || undefined,
      notes: editNotes.trim() || undefined,
      tin: editTin.trim() || undefined,
      brn: editBrn.trim() || undefined,
      sst_registration_id: editSstId.trim() || undefined,
    });
    setIsSaving(false);
    if (updated) {
      setCustomer(updated);
      setIsEditing(false);
      toast.success("Customer updated");
    } else {
      toast.error("Failed to update customer");
    }
  }

  function startEditing() {
    if (!customer) return;
    setEditName(customer.name);
    setEditPhone(customer.phone || "");
    setEditAddress(customer.address || "");
    setEditNotes(customer.notes || "");
    setEditTin(customer.tin || customer.npwp || "");
    setEditBrn(customer.brn || "");
    setEditSstId(customer.sst_registration_id || "");
    setIsEditing(true);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const success = await deleteCustomer(id);
    setIsDeleting(false);
    if (success) {
      toast.success("Customer deleted");
      router.push("/customers");
    } else {
      toast.error("Failed to delete customer");
      setShowDeleteConfirm(false);
    }
  }

  async function handleRepeatOrder() {
    try {
      const res = await fetch(`/api/customers/${id}/reorder`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "No prior orders to repeat");
        return;
      }
      const data = await res.json();
      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch {
      toast.error("Couldn't load past order");
    }
  }

  const orderGroups = useMemo(() => {
    if (orders.length === 0) return [];
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

    const groupMap = new Map<string, Order[]>();
    for (const order of orders) {
      const d = new Date(order.created_at);
      const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const existing = groupMap.get(dateKey);
      if (existing) existing.push(order);
      else groupMap.set(dateKey, [order]);
    }

    return Array.from(groupMap.entries()).map(([key, groupOrders]) => {
      let label: string;
      if (key === todayStr) label = "Today";
      else if (key === yesterdayStr) label = "Yesterday";
      else {
        const d = new Date(key + "T00:00");
        label = d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
      }
      return { key, label, count: groupOrders.length, orders: groupOrders };
    });
  }, [orders]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Customer not found</p>
        <Link href="/customers" className="text-foreground underline">
          Back to customers
        </Link>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const totalSpent = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const totalUnpaid = activeOrders.reduce((sum, o) => sum + (o.total - (o.paid_amount || 0)), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between min-h-9">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{customer.name}</h1>
          {customer.phone && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {customer.phone.startsWith("60") ? "0" + customer.phone.slice(2) : customer.phone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {orders.length > 0 && (
            <button
              onClick={handleRepeatOrder}
              className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors"
              title="Same items as last order"
            >
              <Repeat className="w-3.5 h-3.5" />
              Repeat
            </button>
          )}
          <Link
            href={`/orders/new?nama=${encodeURIComponent(customer.name)}&hp=${encodeURIComponent(customer.phone || "")}`}
            className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-warm-green text-white hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New order
          </Link>
          {customer.phone && (
            <button
              onClick={() => openWhatsApp("", customer.phone)}
              className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WA
            </button>
          )}
          <Link href="/customers" className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </div>

      {/* Customer Card */}
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Summary</p>
          <button
            onClick={startEditing}
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
        <div className="divide-y">
          <div className="flex justify-between text-sm py-2">
            <span className="text-muted-foreground">Orders</span>
            <span className="font-semibold text-foreground">{orders.length}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-muted-foreground">Total spent</span>
            <span className="font-semibold text-foreground">RM {totalSpent.toLocaleString("en-MY")}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-muted-foreground">Unpaid</span>
            <span className={`font-semibold ${totalUnpaid > 0 ? "text-red-600" : "text-foreground"}`}>
              RM {totalUnpaid.toLocaleString("en-MY")}
            </span>
          </div>
        </div>
        {(customer.address || customer.notes) && (
          <div className="border-t mt-2 pt-2 space-y-1">
            {customer.address && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                {customer.address}
              </p>
            )}
            {customer.notes && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StickyNote className="w-3 h-3 shrink-0" />
                {customer.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Order */}
      {/* Order history */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Order history</p>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No orders yet
          </p>
        ) : (
          orderGroups.map((group) => (
            <div key={group.key}>
              {/* Date header */}
              <div className="flex items-center gap-2 py-1.5">
                <span className="text-xs font-semibold text-foreground">{group.label}</span>
                <span className="text-[11px] text-muted-foreground">({group.count})</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              {/* Orders card */}
              <div className="rounded-xl border bg-card shadow-sm divide-y mb-3">
                {group.orders.map((order) => {
                  const itemsSummary = order.items
                    .map((i) => `${i.name} x${i.qty}`)
                    .join(", ");
                  const hasClaim = !!order.payment_claimed_at && order.payment_status !== "paid";
                  const paymentChip = hasClaim
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : order.payment_status === "partial"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : order.payment_status === "unpaid"
                        ? "bg-red-50 text-red-600 border-red-200"
                        : null;
                  return (
                    <Link key={order.id} href={`/orders/${order.id}/edit`} className="block p-3 active:bg-muted/50 transition-colors">
                      {/* Row 1: Order number + time */}
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {order.order_number}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                          {new Date(order.created_at).toLocaleTimeString("en-MY", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {/* Row 2: Items summary */}
                      {itemsSummary && (
                        <p className="text-xs text-muted-foreground truncate">{itemsSummary}</p>
                      )}
                      {/* Row 3: Delivery date */}
                      {order.delivery_date && (
                        <p className="flex items-center gap-1 text-xs text-warm-amber mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.delivery_date).toLocaleDateString("en-MY", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                      <div className="h-1.5" />
                      {/* Row 4: Total + badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-foreground">
                          RM {order.total.toLocaleString("en-MY")}
                        </span>
                        <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                          {order.source === "order_link" && (
                            <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-sky-50 text-sky-700 border-sky-200">
                              Store link
                            </span>
                          )}
                          {order.source === "whatsapp" && (
                            <span className="inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center bg-green-50 text-green-700 border-green-200">
                              WhatsApp
                            </span>
                          )}
                          <OrderStatusBadge status={order.status} />
                          {paymentChip && (
                            <span className={`inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center ${paymentChip}`}>
                              {hasClaim ? "Paid?" : order.payment_status === "partial" ? "Partial" : "Unpaid"}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-background rounded-t-2xl lg:rounded-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 pb-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground">Delete customer?</h2>
              <p className="text-sm text-muted-foreground">
                {orders.length > 0
                  ? `${customer.name} has ${orders.length} orders. The customer record will be deleted but their orders will remain.`
                  : `${customer.name} will be permanently deleted.`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-11 rounded-lg bg-card border border-border shadow-sm text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center" onClick={() => setIsEditing(false)}>
          <div className="bg-background rounded-t-2xl lg:rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 pb-6 space-y-4">
              {/* Modal header */}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Edit customer</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
                  <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Customer name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus placeholder="Type a name..." className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                </div>
                <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
                  <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">WhatsApp number</label>
                  <div className="flex items-center px-3 pb-2 pt-0 gap-2">
                    <span className="text-sm text-muted-foreground shrink-0 select-none">🇲🇾 +60</span>
                    <span className="w-px h-3.5 bg-border shrink-0" />
                    <input type="tel" value={(() => { const d = editPhone.replace(/\D/g, ""); return d.startsWith("60") ? d.slice(2) : d.startsWith("0") ? d.slice(1) : d; })()} onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setEditPhone(d.startsWith("0") ? d.slice(1) : d.startsWith("60") ? d.slice(2) : d); }} placeholder="12 345 6789" className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
                  <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Address (optional)</label>
                  <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Customer address" className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                </div>
                <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
                  <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Notes (optional)</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} placeholder="Notes about the customer..." className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
                    <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">TIN (optional)</label>
                    <input type="text" value={editTin} onChange={(e) => setEditTin(e.target.value)} placeholder="e.g. C25805324050" className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                  </div>
                  <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
                    <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">BRN (optional)</label>
                    <input type="text" value={editBrn} onChange={(e) => setEditBrn(e.target.value)} placeholder="e.g. 202301012345" className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
                  <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">SST registration (optional)</label>
                  <input type="text" value={editSstId} onChange={(e) => setEditSstId(e.target.value)} placeholder="Only if the customer is SST-registered" className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                </div>
              </div>

              {/* Buttons — matches new orders pattern */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 rounded-lg bg-card border border-border shadow-sm text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-11 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green-hover active:bg-warm-green-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>

              {/* Delete */}
              <button
                onClick={() => { setIsEditing(false); setShowDeleteConfirm(true); }}
                className="w-full h-10 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
