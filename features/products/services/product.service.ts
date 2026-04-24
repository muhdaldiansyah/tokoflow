import type { Product, CreateProductInput, UpdateProductInput } from "../types/product.types";

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const res = await fetch("/api/products/categories");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getProductSales(): Promise<Record<string, number>> {
  try {
    const res = await fetch("/api/products/sales");
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product | null> {
  try {
    const res = await fetch("/api/products", {
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

export async function updateProduct(id: string, updates: UpdateProductInput): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${id}`, {
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

export async function toggleAvailability(id: string, is_available: boolean): Promise<Product | null> {
  return updateProduct(id, { is_available });
}


export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}
