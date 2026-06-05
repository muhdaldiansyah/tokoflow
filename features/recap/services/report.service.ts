import type { OrderStatus } from "@/features/orders/types/order.types";

export interface TopItem {
  name: string;
  qty: number;
  revenue: number;
  cost?: number;
  profit?: number;
  margin?: number;
}

export interface PiutangAgingBucket {
  label: string;
  count: number;
  amount: number;
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

export interface MonthlyReport {
  totalOrders: number;
  totalRevenue: number;
  paidRevenue: number;
  partialRevenue: number;
  unpaidRevenue: number;
  collectedRevenue: number;
  piutang: number;
  aov: number;
  collectionRate: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  cancelledCount: number;
  cancelledValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersBySource: Record<string, number>;
  revenueBySource: Record<string, number>;
  totalDiscount: number;
  fulfillmentRate: number;
  cancellationRate: number;
  topItems: TopItem[];
  topCustomers: {
    name: string;
    phone: string;
    orderCount: number;
    totalSpent: number;
  }[];
  dailyBreakdown: {
    date: string;
    orders: number;
    revenue: number;
    paidRevenue: number;
    partialRevenue: number;
    unpaidRevenue: number;
    collectedRevenue: number;
  }[];
  piutangAging: PiutangAgingBucket[];
  newCustomerCount: number;
  returningCustomerCount: number;
  stockAlerts: StockAlert[];
  lateOrders: LateOrder[];
}

export interface OrderExportRow {
  tanggal: string;
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

export async function getMonthlyReport(
  month: number,
  year: number
): Promise<MonthlyReport | null> {
  try {
    const res = await fetch(`/api/recap/monthly?month=${month}&year=${year}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getMonthlyOrdersForExport(
  month: number,
  year: number
): Promise<OrderExportRow[]> {
  try {
    const res = await fetch(`/api/recap/monthly/export?month=${month}&year=${year}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
