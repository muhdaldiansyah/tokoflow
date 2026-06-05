export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;

  // MY tax identity (migration 077).
  tin?: string | null;
  brn?: string | null;
  sst_registration_id?: string | null;

  // Legacy ID — readable for rows written before migration 077.
  npwp?: string | null;

  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  tin?: string;
  brn?: string;
  sst_registration_id?: string;
}
