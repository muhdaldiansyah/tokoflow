import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/features/orders/types/order.types";

const DB_NAME = "tokoflow-offline";
const DB_VERSION = 1;
const ORDERS_STORE = "orders";
const PENDING_STORE = "pendingOrders";

export interface PendingOrder {
  tempId: string;
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  discount?: number;
  delivery_date?: string;
  paid_amount?: number;
  source: "manual";
  createdAt: string;
  /** Display-only order number */
  orderNumber: string;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ORDERS_STORE)) {
        const store = db.createObjectStore(ORDERS_STORE, { keyPath: "id" });
        store.createIndex("created_at", "created_at", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        const store = db.createObjectStore(PENDING_STORE, { keyPath: "tempId" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

/** Full-replace cache of orders */
export async function cacheOrders(orders: Order[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(ORDERS_STORE, "readwrite");
    const store = tx.objectStore(ORDERS_STORE);
    store.clear();
    for (const order of orders) {
      store.put(order);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB unavailable (e.g., private browsing) — degrade silently
  }
}

interface CachedOrdersOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  activeOnly?: boolean;
  historyOnly?: boolean;
}

/** Read all cached orders, with JS-side filtering */
export async function getCachedOrders(options?: CachedOrdersOptions): Promise<Order[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(ORDERS_STORE, "readonly");
    const store = tx.objectStore(ORDERS_STORE);

    const orders: Order[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    let filtered = orders;

    if (options?.status) {
      filtered = filtered.filter((o) => o.status === options.status);
    }

    if (options?.paymentStatus) {
      filtered = filtered.filter((o) => o.payment_status === options.paymentStatus);
    }

    if (options?.activeOnly) {
      filtered = filtered.filter((o) => o.status !== "done" && o.status !== "cancelled");
    } else if (options?.historyOnly) {
      filtered = filtered.filter((o) => o.status === "done" || o.status === "cancelled");
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.order_number && o.order_number.toLowerCase().includes(q)) ||
          (o.customer_phone && o.customer_phone.includes(q))
      );
    }

    // Sort by created_at desc
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  } catch {
    return [];
  }
}


/** Add an order to the pending sync queue */
export async function addPendingOrder(pending: PendingOrder): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(PENDING_STORE, "readwrite");
    tx.objectStore(PENDING_STORE).put(pending);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silent
  }
}

/** Get all pending orders, sorted FIFO by createdAt */
export async function getPendingOrders(): Promise<PendingOrder[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(PENDING_STORE, "readonly");
    const store = tx.objectStore(PENDING_STORE);

    const items: PendingOrder[] = await new Promise((resolve, reject) => {
      const req = store.index("createdAt").getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return items;
  } catch {
    return [];
  }
}

/** Remove a pending order after successful sync */
export async function removePendingOrder(tempId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(PENDING_STORE, "readwrite");
    tx.objectStore(PENDING_STORE).delete(tempId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silent
  }
}

/** Count of orders waiting to sync */
export async function getPendingCount(): Promise<number> {
  try {
    const db = await openDB();
    const tx = db.transaction(PENDING_STORE, "readonly");
    const store = tx.objectStore(PENDING_STORE);

    return new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}
