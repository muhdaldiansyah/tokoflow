import type {
  Staff,
  CreateStaffInput,
  UpdateStaffInput,
} from "../types/staff.types";

export async function getStaff(): Promise<Staff[]> {
  try {
    const res = await fetch("/api/staff");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function createStaff(input: CreateStaffInput): Promise<Staff | null> {
  try {
    const res = await fetch("/api/staff", {
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

export async function updateStaff(id: string, input: UpdateStaffInput): Promise<Staff | null> {
  try {
    const res = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function deleteStaff(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function assignOrder(
  orderId: string,
  staffId: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/orders/${orderId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staffId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
