/** Shared line item — used by orders, receipts, and invoices */
export interface LineItem {
  product_id?: string | null;
  name: string;
  price: number;
  qty: number;
}
