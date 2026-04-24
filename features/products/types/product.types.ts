export interface Product {
  id: string;
  user_id: string;
  name: string;
  price: number;
  sort_order: number;
  image_url?: string | null;
  created_at: string;
  description?: string | null;
  category?: string | null;
  is_available: boolean;
  stock?: number | null;
  unit?: string | null;
  min_order_qty: number;
  cost_price?: number | null;
  deleted_at?: string | null;
}

export interface CreateProductInput {
  name: string;
  price: number;
  description?: string;
  category?: string;
  unit?: string;
  stock?: number | null;
  min_order_qty?: number;
  is_available?: boolean;
  cost_price?: number | null;
}

export type UpdateProductInput = Partial<Pick<Product, 'name' | 'price' | 'sort_order' | 'image_url' | 'description' | 'category' | 'is_available' | 'stock' | 'unit' | 'min_order_qty' | 'cost_price'>>;
