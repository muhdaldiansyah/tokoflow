import type { Order, CreateOrderInput, OrderStatus, PaymentStatus, OrderItem } from "../types/order.types";
import { scheduleOrderReminders, cancelOrderReminders } from "./reminder.service";
import { createClient } from "@/lib/supabase/client";

// Keep supabase client only for uploadPaymentProof (file upload needs client-side storage)
const supabase = createClient();

// Calculate totals from items (used locally for optimistic calculations)
function calculateTotals(items: { price: number; qty: number }[], discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - discount);
  return { subtotal, total };
}

// ORDERS
export async function getOrders(options?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  customerId?: string;
  activeOnly?: boolean;
  historyOnly?: boolean;
  preorderOnly?: boolean;
  dineInOnly?: boolean;
  langgananOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  dateField?: "created_at" | "delivery_date";
  limit?: number;
  offset?: number;
}): Promise<Order[]> {
  try {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.paymentStatus) params.set("paymentStatus", options.paymentStatus);
    if (options?.search) params.set("search", options.search);
    if (options?.customerId) params.set("customerId", options.customerId);
    if (options?.activeOnly) params.set("activeOnly", "true");
    if (options?.historyOnly) params.set("historyOnly", "true");
    if (options?.preorderOnly) params.set("preorderOnly", "true");
    if (options?.dineInOnly) params.set("dineInOnly", "true");
    if (options?.langgananOnly) params.set("langgananOnly", "true");
    if (options?.dateFrom) params.set("dateFrom", options.dateFrom);
    if (options?.dateTo) params.set("dateTo", options.dateTo);
    if (options?.dateField) params.set("dateField", options.dateField);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const qs = params.toString();
    const res = await fetch(`/api/orders${qs ? `?${qs}` : ""}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getOrderCountsByMonth(year: number, month: number): Promise<Record<string, number>> {
  try {
    const res = await fetch(`/api/orders/counts?year=${year}&month=${month}`);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function getDeliveryCountsByMonth(year: number, month: number): Promise<Record<string, number>> {
  try {
    const res = await fetch(`/api/orders/delivery-counts?year=${year}&month=${month}`);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export interface ItemSuggestion {
  name: string;
  price: number;
}

let itemSuggestionsCache: ItemSuggestion[] | null = null;

export async function getItemSuggestions(search?: string): Promise<ItemSuggestion[]> {
  try {
    // Load and cache all unique items from API
    if (!itemSuggestionsCache) {
      const res = await fetch("/api/orders/suggestions");
      if (!res.ok) return [];
      itemSuggestionsCache = await res.json();
    }

    if (!search || search.length < 1) return [];

    const q = search.toLowerCase();
    return (itemSuggestionsCache || []).filter((item) => item.name.toLowerCase().includes(q)).slice(0, 5);
  } catch {
    return [];
  }
}

export function clearItemSuggestionsCache() {
  itemSuggestionsCache = null;
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createOrder(input: CreateOrderInput): Promise<Order | null> {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: input.items,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        notes: input.notes,
        discount: input.discount,
        delivery_date: input.delivery_date,
        is_preorder: input.is_preorder,
        is_dine_in: input.is_dine_in,
        is_langganan: input.is_langganan,
        is_booking: input.is_booking,
        booking_time: input.booking_time,
        table_number: input.table_number,
        source: input.source,
        payment_status: input.payment_status,
        paid_amount: input.paid_amount,
        image_urls: input.image_urls,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Schedule reminders if unpaid and has phone (side-effect, stays client-side until Phase 2)
    if (data.payment_status !== "paid" && data.customer_phone) {
      scheduleOrderReminders(data.id).catch(() => {});
    }

    return data;
  } catch {
    return null;
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Update reminders if payment changed (side-effect, stays client-side until Phase 2)
    if (updates.paid_amount !== undefined && data) {
      if (data.payment_status === "paid") {
        cancelOrderReminders(id).catch(() => {});
      } else {
        scheduleOrderReminders(id).catch(() => {});
      }
    }

    return data;
  } catch {
    return null;
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function deleteOrder(id: string): Promise<boolean> {
  try {
    // Cancel pending reminders (side-effect)
    cancelOrderReminders(id).catch(() => {});

    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface UndoOrderResult {
  success: boolean;
  alreadyUndone?: boolean;
  windowExpired?: boolean;
  windowEndedAt?: string;
  forced?: boolean;
}

/**
 * Cancel an order with the 7-day soft-undo semantic. Within the window the
 * call is plain `force=false`; if the API returns 410 the caller should ask
 * the user to confirm a hard cancel and retry with `force=true`.
 */
export async function undoOrder(
  id: string,
  opts: { force?: boolean; reason?: string } = {},
): Promise<UndoOrderResult> {
  try {
    cancelOrderReminders(id).catch(() => {});
    const res = await fetch(`/api/orders/${id}/undo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: !!opts.force, reason: opts.reason ?? null }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        alreadyUndone: !!data.alreadyUndone,
        forced: !!data.forced,
      };
    }
    if (res.status === 410) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        windowExpired: true,
        windowEndedAt: data.windowEndedAt,
      };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

export async function recordPayment(id: string, amount: number): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Cancel reminders if fully paid (side-effect)
    if (data && data.payment_status === "paid") {
      cancelOrderReminders(id).catch(() => {});
    }

    return data;
  } catch {
    return null;
  }
}

export interface PiutangCustomer {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  total_debt: number;
  order_count: number;
}

export interface PiutangSummary {
  totalDebt: number;
  customerCount: number;
  customers: PiutangCustomer[];
}

export async function getPiutangSummary(): Promise<PiutangSummary> {
  try {
    const res = await fetch("/api/orders/piutang");
    if (!res.ok) return { totalDebt: 0, customerCount: 0, customers: [] };
    return res.json();
  } catch {
    return { totalDebt: 0, customerCount: 0, customers: [] };
  }
}

export async function uploadPaymentProof(orderId: string, file: File): Promise<string | null> {
  // Stays client-side — file upload needs browser Supabase Storage
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const path = `${user.id}/${orderId}-${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error("Error uploading payment proof:", uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("payment-proofs")
    .getPublicUrl(path);

  const proofUrl = urlData.publicUrl;

  // Update order via API
  const res = await fetch(`/api/orders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proof_url: proofUrl }),
  });

  if (!res.ok) {
    console.error("Error saving proof URL");
    return null;
  }

  return proofUrl;
}

// FREQUENT ITEMS (for quick-add chips)
export interface FrequentItem {
  name: string;
  price: number;
  count: number;
  unit?: string | null;
  stock?: number | null;
  min_order_qty?: number;
}

export async function getFrequentItems(): Promise<FrequentItem[]> {
  try {
    const res = await fetch("/api/orders/frequent-items");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// TODAY SUMMARY
export interface TodaySummary {
  pendingCount: number;
  todayRevenue: number;
  todayOrderCount: number;
  allTodayDone: boolean;
  linkOrderCount: number;
  unpaidCount: number;
}

export async function getTodaySummary(): Promise<TodaySummary> {
  try {
    const res = await fetch("/api/orders/summary");
    if (!res.ok) return { pendingCount: 0, todayRevenue: 0, todayOrderCount: 0, allTodayDone: false, linkOrderCount: 0, unpaidCount: 0 };
    return res.json();
  } catch {
    return { pendingCount: 0, todayRevenue: 0, todayOrderCount: 0, allTodayDone: false, linkOrderCount: 0, unpaidCount: 0 };
  }
}

// BULK OPERATIONS
export async function bulkMarkPaid(ids: string[]): Promise<number> {
  try {
    const res = await fetch("/api/orders/bulk/paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return 0;
    const data = await res.json();

    // Cancel reminders for all paid orders (side-effect)
    for (const id of ids) {
      cancelOrderReminders(id).catch(() => {});
    }

    return data.successCount ?? 0;
  } catch {
    return 0;
  }
}

export async function bulkUpdateStatus(ids: string[], status: OrderStatus): Promise<number> {
  try {
    const res = await fetch("/api/orders/bulk/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.successCount ?? 0;
  } catch {
    return 0;
  }
}

// RECENT ORDERS BY CUSTOMER
export async function getRecentOrdersByCustomer(customerName: string, limit = 3): Promise<{ items: OrderItem[]; total: number; created_at: string; order_number: string }[]> {
  try {
    if (!customerName) return [];
    const params = new URLSearchParams({ name: customerName, limit: String(limit) });
    const res = await fetch(`/api/orders/by-customer?${params}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
