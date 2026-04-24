import type { OrderStatus } from "@/features/orders/types/order.types";

export interface TopItem {
  name: string;
  qty: number;
  revenue: number;
  cost?: number;
  profit?: number;
  margin?: number;
}

export interface StockAlert {
  name: string;
  stock: number;
}

export interface LateOrder {
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  total: number;
}

export interface DailyRecap {
  date: string;
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalRevenue: number;
  paidRevenue: number;
  partialRevenue: number;
  unpaidRevenue: number;
  collectedRevenue: number;
  piutang: number;
  aov: number;
  collectionRate: number;
  ordersBySource: Record<string, number>;
  revenueBySource: Record<string, number>;
  totalDiscount: number;
  cancelledCount: number;
  cancelledValue: number;
  fulfillmentRate: number;
  cancellationRate: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  growthRevenue: number | null;
  growthOrders: number | null;
  newCustomers: number;
  newCustomerNames: string[];
  topItems: TopItem[];
  returningCustomers: number;
  stockAlerts: StockAlert[];
  lateOrders: LateOrder[];
}

export interface DailyExportRow {
  nomor_pesanan: string;
  pelanggan: string;
  telepon: string;
  item: string;
  total: number;
  dibayar: number;
  sisa: number;
  pengiriman: string;
  status: string;
  pembayaran: string;
  sumber: string;
}

export async function getRecapData(date?: string): Promise<{
  today: DailyRecap | null;
  ordersUsed: number;
  ordersLimit: number;
}> {
  try {
    const now = new Date();
    const targetDate = date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const res = await fetch(`/api/recap?date=${targetDate}`);
    if (!res.ok) return { today: null, ordersUsed: 0, ordersLimit: 150 };
    return res.json();
  } catch {
    return { today: null, ordersUsed: 0, ordersLimit: 150 };
  }
}

export async function getDailyOrdersForExport(date: string): Promise<DailyExportRow[]> {
  try {
    const res = await fetch(`/api/recap/export?date=${date}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
