import type { Customer, CreateCustomerInput } from "../types/customer.types";

export async function getCustomers(search?: string): Promise<Customer[]> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/customers${params}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  try {
    const res = await fetch(`/api/customers/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  try {
    const res = await fetch(`/api/customers/${id}`, {
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

export async function deleteCustomer(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

