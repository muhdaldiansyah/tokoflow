import type { LineItem } from "@/lib/types/common";

export type ReceiptItem = LineItem;

export interface Receipt {
  id: string;
  user_id: string;
  receipt_number: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  payment_status: 'paid' | 'unpaid';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessInfo {
  business_name: string;
  business_address?: string;
  business_phone?: string;
  logo_url?: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  role: string;
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  logo_url?: string;
  receipts_used: number;
  receipts_limit: number;
  orders_used: number;
  orders_limit: number;
  ai_credits_used: number;
  ai_credits_limit: number;
  ai_credits_topup: number;
  order_credits: number;
  unlimited_until?: string | null;
  packs_bought_this_month: number;
  plan: string;
  plan_expiry?: string;
  counter_reset_at?: string;
  first_wa_sent_at?: string;
  onboarding_drip?: Record<string, string>;
  slug?: string;
  order_form_enabled?: boolean;
  preorder_enabled?: boolean;
  dine_in_enabled?: boolean;
  langganan_enabled?: boolean;
  booking_enabled?: boolean;
  business_type?: string;
  push_token?: string;
  notify_new_order_email?: boolean;
  community_id?: string | null;
  total_views?: number;
  views_today?: number;
  views_today_date?: string;
  daily_order_capacity?: number | null;
  qris_url?: string;
  referral_code?: string;
  referred_by?: string;
  referral_balance?: number;
  referral_total_earned?: number;
  referral_total_paid?: number;
  referral_expires_at?: string | null;
  referral_signup_bonus_credited?: boolean;
  // Legacy ID tax identifiers — kept nullable for rows written pre-migration 077.
  npwp?: string;
  nitku?: string;
  wp_type?: string;
  wp_registered_year?: number;
  // MY tax identity (migration 077).
  tin?: string | null;
  brn?: string | null;
  sst_registration_id?: string | null;
  default_sst_rate?: number | null;
  myinvois_client_id?: string | null;
  myinvois_client_secret_enc?: string | null;
  target_food_cost_percent?: number;
  bisnis_until?: string | null;
  // Marketplace fields
  city_id?: number | null;
  city?: string;
  city_slug?: string;
  business_category?: string;
  business_description?: string;
  is_listed?: boolean;
  operating_hours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  overhead_estimate_pct?: number;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  receipt_id: string | null;
  order_id?: string | null;
  reminder_type: 'order' | 'receipt';
  day_offset?: number | null;
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  fonnte_response?: Record<string, unknown>; // legacy column name — now stores Cloud API response
  message_text?: string;
  created_at: string;
  updated_at: string;
}

export interface ReminderWithSource extends Reminder {
  order?: {
    order_number: string;
    customer_name?: string;
    customer_phone?: string;
    total: number;
    paid_amount: number;
  };
  receipt?: {
    receipt_number: string;
    customer_name?: string;
    customer_phone?: string;
    total: number;
  };
}

export interface CreateReceiptInput {
  items: ReceiptItem[];
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  payment_status?: 'paid' | 'unpaid';
}

