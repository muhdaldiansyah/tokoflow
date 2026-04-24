import type { Receipt, CreateReceiptInput, Profile } from "../types/receipt.types";

// PROFILES
export async function getProfile(): Promise<Profile | null> {
  try {
    const res = await fetch("/api/profile");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateSlug(slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/profile/slug", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Gagal menyimpan" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menyimpan" };
  }
}

export async function updateOrderFormEnabled(enabled: boolean): Promise<boolean> {
  const result = await updateProfile({ order_form_enabled: enabled } as Partial<Profile>);
  return result !== null;
}

export async function updatePreorderEnabled(enabled: boolean): Promise<boolean> {
  const result = await updateProfile({ preorder_enabled: enabled } as Partial<Profile>);
  return result !== null;
}

export async function updateDineInEnabled(enabled: boolean): Promise<boolean> {
  const result = await updateProfile({ dine_in_enabled: enabled } as Partial<Profile>);
  return result !== null;
}

export async function updateLanggananEnabled(enabled: boolean): Promise<boolean> {
  const result = await updateProfile({ langganan_enabled: enabled } as Partial<Profile>);
  return result !== null;
}

export async function updateDailyOrderCapacity(capacity: number | null): Promise<boolean> {
  const result = await updateProfile({ daily_order_capacity: capacity } as Partial<Profile>);
  return result !== null;
}

export async function updateQuietHours(start: string, end: string): Promise<boolean> {
  const result = await updateProfile({ quiet_hours_start: start, quiet_hours_end: end } as Partial<Profile>);
  return result !== null;
}

// RECEIPTS
export async function createReceipt(input: CreateReceiptInput): Promise<Receipt | null> {
  try {
    const res = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
