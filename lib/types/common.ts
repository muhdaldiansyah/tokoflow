/** Shared line item — used by orders, receipts, and invoices */
export interface LineItem {
  name: string;
  price: number;
  qty: number;
}
