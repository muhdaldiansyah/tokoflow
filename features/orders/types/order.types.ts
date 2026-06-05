import type { LineItem } from "@/lib/types/common";

/** @deprecated Use LineItem from @/lib/types/common — kept as alias for backward compatibility */
export type OrderItem = LineItem;

export type OrderStatus = 'new' | 'menunggu' | 'processed' | 'shipped' | 'done' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type OrderSource = 'manual' | 'whatsapp' | 'order_link';

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  delivery_fee?: number | null;
  delivery_zone?: "peninsular" | "sabah_sarawak" | null;
  unique_code?: number | null;
  transfer_amount?: number;
  paid_amount: number;
  notes?: string;
  source: OrderSource;
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_date?: string;
  is_preorder?: boolean;
  is_dine_in?: boolean;
  is_langganan?: boolean;
  is_booking?: boolean;
  booking_time?: string;
  table_number?: string;
  payment_claimed_at?: string;
  // TRUE for store-link QR orders whose payment receipt hasn't been uploaded
  // yet (migration 109). Hidden from active merchant views until upload-proof
  // flips it to false. Non-QR orders are always false.
  awaiting_payment?: boolean;
  proof_url?: string;
  image_urls?: string[];
  shipped_at?: string;
  completed_at?: string;
  assigned_staff_id?: string | null;
  assigned_at?: string | null;
  // 7-day undo window (migration 082). Set on insert; if undone_at is non-null
  // the order has been cancelled via the soft-undo path (stock restored, quota
  // freed, customer stats rolled back via trigger).
  undone_at?: string | null;
  undo_window_ends_at?: string | null;
  undo_reason?: string | null;
  // Customer delivery acknowledgement (migration 088). Token is generated
  // lazily by /api/orders/[id]/request-customer-ack and surfaced to the
  // customer via WA share. customer_ack_at is set atomically when the
  // customer taps /a/[token].
  customer_ack_token?: string | null;
  customer_ack_at?: string | null;
  // Delivery metadata (migration 098). All nullable. NULL delivery_address
  // semantically = pickup at store. courier_name is free-form; tracking_number
  // gets linked to a courier portal at render time via lib/utils/courier.ts
  // prefix matching — Tokoflow does not poll courier APIs (per migration 088
  // "destination event only" philosophy).
  delivery_address?: string | null;
  tracking_number?: string | null;
  courier_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  discount?: number;
  delivery_fee?: number;
  delivery_zone?: "peninsular" | "sabah_sarawak" | null;
  delivery_date?: string;
  delivery_address?: string;
  tracking_number?: string;
  courier_name?: string;
  is_preorder?: boolean;
  is_dine_in?: boolean;
  is_langganan?: boolean;
  is_booking?: boolean;
  booking_time?: string;
  table_number?: string;
  source?: OrderSource;
  payment_status?: PaymentStatus;
  paid_amount?: number;
  image_urls?: string[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  menunggu: 'Pending',
  processed: 'Processing',
  shipped: 'Shipped',
  done: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_FLOW: OrderStatus[] = ['new', 'processed', 'shipped', 'done'];

export const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  order_link: "Store link",
  whatsapp: "WhatsApp",
  directory: "Directory",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partial: 'Partial payment',
  unpaid: 'Unpaid',
};

export interface OrderStatusLog {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
}

export function derivePaymentStatus(paidAmount: number, total: number): PaymentStatus {
  if (total === 0) return 'paid'; // zero-total (100% discount) = fully paid
  if (paidAmount >= total) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'unpaid';
}
