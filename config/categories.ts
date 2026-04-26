import { createServiceClient } from "@/lib/supabase/server";

export interface BusinessCategory {
  id: string;
  label: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

// Fallback used if DB query fails (keeps app functional).
// Mirrors migration 080 — kept in sync so a DB outage still renders the right picker.
const FALLBACK_CATEGORIES: BusinessCategory[] = [
  { id: "katering",    label: "Catering & Nasi Box",       icon: null, sort_order: 1,  is_active: true },
  { id: "bakery",      label: "Bakery & Bread",            icon: null, sort_order: 2,  is_active: true },
  { id: "kue-custom",  label: "Custom Cake & Kuih",        icon: null, sort_order: 3,  is_active: true },
  { id: "snack-box",   label: "Snack Box & Hampers",       icon: null, sort_order: 4,  is_active: true },
  { id: "frozen-food", label: "Frozen Food",               icon: null, sort_order: 5,  is_active: true },
  { id: "warung-makan",label: "Kopitiam & Food Stall",     icon: null, sort_order: 6,  is_active: true },
  { id: "minuman",     label: "Drinks & Coffee",           icon: null, sort_order: 7,  is_active: true },
  { id: "konveksi",    label: "Apparel & Custom Print",    icon: null, sort_order: 8,  is_active: true },
  { id: "tailor",      label: "Tailor & Alterations",      icon: null, sort_order: 9,  is_active: true },
  { id: "percetakan",  label: "Printing & Signage",        icon: null, sort_order: 10, is_active: true },
  { id: "kerajinan",   label: "Crafts & Souvenir",         icon: null, sort_order: 11, is_active: true },
  { id: "furniture",   label: "Furniture & Interior",      icon: null, sort_order: 12, is_active: true },
  { id: "kosmetik",    label: "Cosmetics & Skincare",      icon: null, sort_order: 13, is_active: true },
  { id: "fotografer",  label: "Photography & Videography", icon: null, sort_order: 14, is_active: true },
  { id: "mua",         label: "MUA & Beauty",              icon: null, sort_order: 15, is_active: true },
  { id: "wedding-eo",  label: "Wedding & Event Planner",   icon: null, sort_order: 16, is_active: true },
  { id: "laundry",     label: "Laundry & Dry Clean",       icon: null, sort_order: 17, is_active: true },
  { id: "rental",      label: "Equipment Rental",          icon: null, sort_order: 18, is_active: true },
  { id: "elektronik",  label: "Electronics Repair",        icon: null, sort_order: 19, is_active: true },
  { id: "otomotif",    label: "Automotive Service",        icon: null, sort_order: 20, is_active: true },
  { id: "pendidikan",  label: "Tuition & Education",       icon: null, sort_order: 21, is_active: true },
  { id: "desain",      label: "Design Services",           icon: null, sort_order: 22, is_active: true },
  { id: "grosir",      label: "Wholesale & Supplier",      icon: null, sort_order: 23, is_active: true },
  { id: "lainnya",     label: "Other Services & Goods",    icon: null, sort_order: 99, is_active: true },
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
