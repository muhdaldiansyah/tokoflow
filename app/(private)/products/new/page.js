"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/database/supabase/client";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    initial_stock: "0",
    low_stock_threshold: "10"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sku || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      const payload = {
        sku: formData.sku,
        name: formData.name,
        stock: parseInt(formData.initial_stock) || 0,
        low_stock_threshold: Number.isFinite(parseInt(formData.low_stock_threshold))
          ? parseInt(formData.low_stock_threshold)
          : 10,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Product added successfully");
        router.push("/products");
      } else {
        throw new Error(result.error || "Failed to save product");
      }

    } catch (err) {
      console.error("Error saving product:", err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/products");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/products"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        </div>
        <p className="text-gray-600">Create a new product in your catalog</p>
      </div>

      {/* Add Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="PROD001"
                required
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">Unique product identifier</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Product Name"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Stock
              </label>
              <input
                type="number"
                value={formData.initial_stock}
                onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0"
                min="0"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">Starting inventory quantity</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Alert Threshold
              </label>
              <input
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="10"
                min="0"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Stok di bawah angka ini akan ditandai sebagai &quot;low&quot; di dashboard. Default 10.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">New Product Guidelines</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• SKU must be unique and cannot be changed after creation</li>
          <li>• Initial stock can only be set during product creation</li>
          <li>• Use meaningful SKU patterns for easy identification (e.g., CAT-001, SHIRT-XL-BLU)</li>
          <li>• After creation, configure product costs in "Product Costs" menu</li>
          <li>• Use "Stock Adjustments" to modify inventory levels later</li>
        </ul>
      </div>
    </div>
  );
}