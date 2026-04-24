export interface ProductionItem {
  name: string;
  qty: number;
  orderCount: number;
}

export interface ProductionOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; qty: number }[];
  total: number;
  paidAmount: number;
  paymentStatus: string;
}

export interface ProductionSummary {
  date: string;
  totalOrders: number;
  totalItems: number;
  items: ProductionItem[];
  orders: ProductionOrder[];
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  paidRevenue: number;
  collectedRevenue: number;
  totalRevenue: number;
}

export async function getProductionList(dateStr: string): Promise<ProductionSummary | null> {
  try {
    const res = await fetch(`/api/production?date=${dateStr}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface ProductionExportRow {
  produk: string;
  jumlah: number;
  dari_pesanan: number;
}

export interface ProductionOrderExportRow {
  no: number;
  pelanggan: string;
  telepon: string;
  item: string;
  total: number;
  dibayar: number;
  sisa: number;
  pembayaran: string;
}

export async function getProductionForExport(dateStr: string): Promise<{
  items: ProductionExportRow[];
  orders: ProductionOrderExportRow[];
} | null> {
  try {
    const res = await fetch(`/api/production/export?date=${dateStr}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
