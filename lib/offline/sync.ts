import { getOrders, createOrder } from "@/features/orders/services/order.service";
import type { Order, OrderStatus, PaymentStatus, CreateOrderInput } from "@/features/orders/types/order.types";
import { derivePaymentStatus } from "@/features/orders/types/order.types";
import {
  cacheOrders,
  getCachedOrders,
  addPendingOrder,
  getPendingOrders,
  removePendingOrder,
  type PendingOrder,
} from "./db";

const SYNC_LOCK_KEY = "catatorder_syncing";
const SYNC_LOCK_TTL = 30_000; // 30s

interface FetchOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  activeOnly?: boolean;
  historyOnly?: boolean;
  preorderOnly?: boolean;
  dineInOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  dateField?: "created_at" | "delivery_date";
  offset?: number;
}

interface FetchResult {
  orders: Order[];
  fromCache: boolean;
}

/** Fetch orders — cache on success, serve from cache on failure */
export async function fetchOrdersWithCache(options?: FetchOptions): Promise<FetchResult> {
  if (navigator.onLine) {
    try {
      const orders = await getOrders(options);
      // Only cache the first page (offset 0 or undefined) with no filters
      if (!options?.offset && !options?.status && !options?.paymentStatus && !options?.search && !options?.activeOnly && !options?.historyOnly && !options?.preorderOnly) {
        cacheOrders(orders); // fire-and-forget
      }
      return { orders, fromCache: false };
    } catch {
      // Network call failed even though navigator.onLine — fall through to cache
    }
  }

  const cached = await getCachedOrders({
    status: options?.status,
    paymentStatus: options?.paymentStatus,
    search: options?.search,
    activeOnly: options?.activeOnly,
    historyOnly: options?.historyOnly,
  });
  return { orders: cached, fromCache: true };
}

interface OfflineCreateResult {
  pending: PendingOrder;
  isOffline: true;
}

/** Create order offline — save to IDB queue */
export async function createOrderOffline(input: CreateOrderInput): Promise<OfflineCreateResult> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  const pending: PendingOrder = {
    tempId: `pending_${Date.now()}_${rand}`,
    items: input.items,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    notes: input.notes,
    discount: input.discount,
    delivery_date: input.delivery_date,
    paid_amount: input.paid_amount,
    source: "manual",
    createdAt: now.toISOString(),
    orderNumber: `WO-${dateStr}-${rand}`,
  };

  await addPendingOrder(pending);
  return { pending, isOffline: true };
}

/** Convert pending orders to Order-shaped objects for display in the list */
export function pendingToDisplayOrders(pendings: PendingOrder[]): Order[] {
  return pendings.map((p) => {
    const subtotal = p.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = p.discount || 0;
    const total = Math.max(0, subtotal - discount);
    const paidAmount = p.paid_amount || 0;

    return {
      id: p.tempId,
      user_id: "",
      order_number: p.orderNumber,
      customer_name: p.customer_name || "",
      customer_phone: p.customer_phone || "",
      items: p.items,
      subtotal,
      discount,
      total,
      paid_amount: paidAmount,
      payment_status: derivePaymentStatus(paidAmount, total),
      status: "new" as OrderStatus,
      source: "manual" as const,
      notes: p.notes || "",
      delivery_date: p.delivery_date || null,
      created_at: p.createdAt,
      updated_at: p.createdAt,
    } as Order;
  });
}

/**
 * Process the pending queue FIFO.
 * Uses a localStorage lock to prevent duplicate sync from multiple tabs.
 */
export async function syncPendingOrders(
  onSynced?: (pending: PendingOrder, order: Order) => void,
  onFailed?: (pending: PendingOrder, error: unknown) => void
): Promise<number> {
  // Acquire lock
  const now = Date.now();
  const lockVal = localStorage.getItem(SYNC_LOCK_KEY);
  if (lockVal) {
    const lockTime = parseInt(lockVal, 10);
    if (now - lockTime < SYNC_LOCK_TTL) return 0; // Another tab is syncing
  }
  localStorage.setItem(SYNC_LOCK_KEY, String(now));

  let synced = 0;

  try {
    const pendings = await getPendingOrders();
    for (const pending of pendings) {
      try {
        const input: CreateOrderInput = {
          items: pending.items,
          customer_name: pending.customer_name,
          customer_phone: pending.customer_phone,
          notes: pending.notes,
          discount: pending.discount,
          delivery_date: pending.delivery_date,
          paid_amount: pending.paid_amount,
          source: "manual",
        };
        const order = await createOrder(input);
        if (order) {
          await removePendingOrder(pending.tempId);
          synced++;
          onSynced?.(pending, order);
        } else {
          onFailed?.(pending, new Error("createOrder returned null"));
        }
      } catch (err) {
        onFailed?.(pending, err);
        // Stop processing on first failure to preserve FIFO order
        break;
      }
    }
  } finally {
    localStorage.removeItem(SYNC_LOCK_KEY);
  }

  return synced;
}

/**
 * Listen for the browser coming back online and auto-sync.
 * Returns a cleanup function to remove the listener.
 */
export function startAutoSync(
  onComplete?: (syncedCount: number) => void
): () => void {
  const handler = async () => {
    const count = await syncPendingOrders();
    onComplete?.(count);
  };

  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
