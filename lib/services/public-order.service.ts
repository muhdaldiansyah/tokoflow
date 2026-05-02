import { createServiceClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils/phone";
import { creditReferralSignupBonus } from "@/lib/services/referral-bonus.service";

export interface PublicFrequentItem {
  name: string;
  price: number;
  image_url?: string | null;
  description?: string | null;
  category?: string | null;
  stock?: number | null;
  unit?: string | null;
  min_order_qty: number;
}

export interface PublicBusinessInfo {
  businessId: string;
  businessName: string;
  orderFormEnabled: boolean;
  preorderEnabled: boolean;
  langgananEnabled: boolean;
  dailyOrderCapacity: number | null;
  planExpired: boolean;
  frequentItems: PublicFrequentItem[];
  qrisUrl?: string;
  logoUrl?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessDescription?: string;
  businessCategory?: string;
  city?: string;
  citySlug?: string;
  operatingHours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
  completedOrders: number;
  repeatCustomerPct: number;
  memberSince?: string;
  hasQris: boolean;
}

/**
 * Resolves slug → business info + top 8 frequent items.
 * No auth, no sensitive data. Server-side only (service role key).
 *
 * Returns null only when the slug doesn't match any profile.
 * If the profile exists but the merchant hasn't finished onboarding
 * (no business_name yet), returns a stub with `setupIncomplete: true`
 * so the page can render a "store being set up" view instead of 404.
 */
export async function getPublicBusinessInfo(slug: string): Promise<(PublicBusinessInfo & { setupIncomplete?: boolean }) | null> {
  const supabase = await createServiceClient();

  // Look up profile by slug
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, business_name, order_form_enabled, preorder_enabled, langganan_enabled, daily_order_capacity, plan_expiry, qris_url, logo_url, business_address, business_phone, business_description, business_category, city, city_slug, operating_hours, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!profile) return null;

  // Profile exists but merchant hasn't named the business — surface a stub so
  // the page can render a friendly "coming soon" view instead of a hard 404.
  if (!profile.business_name) {
    return {
      businessId: profile.id,
      businessName: "",
      orderFormEnabled: false,
      preorderEnabled: false,
      langgananEnabled: false,
      dailyOrderCapacity: null,
      planExpired: false,
      frequentItems: [],
      completedOrders: 0,
      repeatCustomerPct: 0,
      hasQris: false,
      setupIncomplete: true,
    };
  }

  const planExpired = profile.plan_expiry
    ? new Date(profile.plan_expiry) < new Date()
    : false;

  // 1. Check for products (canonical price list) — only available ones, no cap
  const { data: products } = await supabase
    .from("products")
    .select("name, price, image_url, description, category, stock, unit, min_order_qty")
    .eq("user_id", profile.id)
    .eq("is_available", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  let frequentItems: PublicFrequentItem[];

  if (products && products.length > 0) {
    frequentItems = products.map(({ name, price, image_url, description, category, stock, unit, min_order_qty }) => ({
      name, price, image_url, description, category, stock, unit, min_order_qty: min_order_qty ?? 1,
    }));
  } else {
    // Fallback: aggregate from recent orders
    const { data: orders } = await supabase
      .from("orders")
      .select("items")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const itemCounts = new Map<string, { name: string; price: number; count: number }>();

    if (orders) {
      for (const order of orders) {
        if (!Array.isArray(order.items)) continue;
        for (const item of order.items) {
          const key = (item.name as string).toLowerCase();
          const existing = itemCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            itemCounts.set(key, {
              name: item.name as string,
              price: item.price as number,
              count: 1,
            });
          }
        }
      }
    }

    frequentItems = Array.from(itemCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(({ name, price }) => ({ name, price, min_order_qty: 1 }));
  }

  // Count completed orders for social proof
  const { count: completedOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "done");

  // Repeat customer rate: customers with 2+ orders / total customers
  let repeatCustomerPct = 0;
  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id);
  if (totalCustomers && totalCustomers > 0) {
    const { count: repeatCustomers } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .gte("total_orders", 2);
    repeatCustomerPct = Math.round(((repeatCustomers ?? 0) / totalCustomers) * 100);
  }

  return {
    businessId: profile.id,
    businessName: profile.business_name,
    orderFormEnabled: profile.order_form_enabled ?? true,
    preorderEnabled: profile.preorder_enabled ?? true,
    langgananEnabled: profile.langganan_enabled ?? false,
    dailyOrderCapacity: profile.daily_order_capacity ?? null,
    planExpired,
    frequentItems,
    qrisUrl: profile.qris_url || undefined,
    logoUrl: profile.logo_url || undefined,
    businessAddress: profile.business_address || undefined,
    businessPhone: profile.business_phone || undefined,
    businessDescription: profile.business_description || undefined,
    businessCategory: profile.business_category || undefined,
    city: profile.city || undefined,
    citySlug: profile.city_slug || undefined,
    operatingHours: profile.operating_hours as Record<string, { open: string; close: string; closed?: boolean }> | null ?? null,
    completedOrders: completedOrders ?? 0,
    repeatCustomerPct,
    memberSince: profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-MY", { month: "long", year: "numeric" }) : undefined,
    hasQris: !!profile.qris_url,
  };
}

/**
 * Creates an order from the public form. No auth — uses service role key.
 * Inserts with source='order_link', status='new', payment_status derived as 'unpaid'.
 */
export async function createPublicOrder(params: {
  businessId: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; qty: number; price: number }[];
  notes: string;
  deliveryDate?: string;
  isPreorder?: boolean;
  isLangganan?: boolean;
  referralSource?: string;
}): Promise<{ orderId: string; orderNumber: string; total: number } | null> {
  const supabase = await createServiceClient();

  // Generate sequential order number (service client — no auth.uid(), RPC handles it)
  const { data: orderNumber, error: numError } = await supabase.rpc("generate_order_number", { p_user_id: params.businessId });
  if (numError || !orderNumber) {
    console.error("Error generating order number:", numError);
    return null;
  }

  const subtotal = params.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Check if UMKM has order quota remaining
  const { data: hasQuota } = await supabase.rpc("check_order_limit", { p_user_id: params.businessId });
  const orderStatus = hasQuota ? "new" : "menunggu";

  // Find or create customer FIRST (before order insert)
  let customer_id: string | undefined;
  const normalizedPhone = normalizePhone(params.customerPhone);
  const trimmedName = params.customerName?.trim();

  if (normalizedPhone) {
    // Match by phone first
    const { data: byPhone } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", params.businessId)
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (byPhone) {
      customer_id = byPhone.id;
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          user_id: params.businessId,
          name: trimmedName || normalizedPhone,
          phone: normalizedPhone,
        })
        .select("id")
        .single();
      customer_id = newCustomer?.id;
    }
  } else if (trimmedName) {
    // No phone — match by name (case-insensitive)
    const { data: byName } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", params.businessId)
      .ilike("name", trimmedName)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (byName) {
      customer_id = byName.id;
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({ user_id: params.businessId, name: trimmedName })
        .select("id")
        .single();
      customer_id = newCustomer?.id;
    }
  }

  // Tokoflow MY: unique_code mechanism (CatatOrder ID) deprecated — Billplz
  // ref + reconciliation engine handle matching. Leave column NULL.

  // Create order with customer_id already set (single insert)
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: params.businessId,
      order_number: orderNumber,
      customer_id,
      customer_name: params.customerName,
      customer_phone: normalizedPhone || params.customerPhone,
      items: params.items,
      subtotal,
      discount: 0,
      total: subtotal,
      paid_amount: 0,
      notes: params.notes || null,
      delivery_date: params.deliveryDate || null,
      is_preorder: params.isPreorder || false,
      is_langganan: params.isLangganan || false,
      source: "order_link",
      status: orderStatus,
      referral_source: params.referralSource || null,
    })
    .select("id, order_number, total")
    .single();

  if (error) {
    console.error("Error creating public order:", error);
    return null;
  }

  // Increment orders_used counter
  await supabase.rpc("increment_orders_used", { p_user_id: params.businessId });

  // Referral signup bonus — credit referrer RM 2 on first order (best-effort)
  creditReferralSignupBonus(params.businessId);

  // Decrement stock for products with tracked inventory
  const productNames = params.items.map(i => i.name);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock")
    .eq("user_id", params.businessId)
    .is("deleted_at", null)
    .in("name", productNames);

  if (products) {
    for (const item of params.items) {
      const product = products.find(p => p.name === item.name);
      if (product && product.stock !== null) {
        const newStock = Math.max(0, product.stock - item.qty);
        await supabase
          .from("products")
          .update({
            stock: newStock,
            ...(newStock === 0 && { is_available: false }),
          })
          .eq("id", product.id);
      }
    }
  }

  // Customer stats auto-updated by database trigger (053_customer_stats_trigger)

  return { orderId: data.id, orderNumber: data.order_number, total: data.total ?? subtotal };
}
