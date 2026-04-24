import { createServiceClient } from "@/lib/supabase/server";

export interface BusinessCategory {
  id: string;
  label: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

// Fallback used if DB query fails (keeps app functional). Malaysian market labels.
const FALLBACK_CATEGORIES: BusinessCategory[] = [
  { id: "katering", label: "Catering & Nasi Box", icon: null, sort_order: 1, is_active: true },
  { id: "bakery", label: "Bakery & Bread", icon: null, sort_order: 2, is_active: true },
  { id: "kue-custom", label: "Custom Cake & Kuih", icon: null, sort_order: 3, is_active: true },
  { id: "warung-makan", label: "Kopitiam & Food Stall", icon: null, sort_order: 4, is_active: true },
  { id: "snack-box", label: "Snack Box & Hampers", icon: null, sort_order: 5, is_active: true },
  { id: "minuman", label: "Drinks & Coffee", icon: null, sort_order: 6, is_active: true },
  { id: "frozen-food", label: "Frozen Food", icon: null, sort_order: 7, is_active: true },
  { id: "reseller", label: "Marketplace Reseller", icon: null, sort_order: 8, is_active: true },
  { id: "lainnya", label: "Other", icon: null, sort_order: 99, is_active: true },
];

/**
 * Fetches categories from DB (server-side only).
 * Falls back to hardcoded list if DB unavailable.
 */
export async function getCategories(): Promise<BusinessCategory[]> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("business_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return data && data.length > 0 ? data : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

/**
 * Build label map from categories array.
 */
export function buildCategoryLabels(categories: BusinessCategory[]): Record<string, string> {
  return Object.fromEntries(categories.map((c) => [c.id, c.label]));
}
