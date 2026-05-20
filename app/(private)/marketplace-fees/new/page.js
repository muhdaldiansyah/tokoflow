"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../lib/database/supabase/client";
import { Loader2, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function NewMarketplaceFePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    channel: "",
    fee_percentage: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.channel || formData.fee_percentage === "") {
      toast.error("Please fill in all fields");
      return;
    }

    if (parseFloat(formData.fee_percentage) < 0 || parseFloat(formData.fee_percentage) > 100) {
      toast.error("Fee percentage must be between 0 and 100");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      const response = await fetch("/api/marketplace-fees", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channel: formData.channel.trim(),
          fee_percentage: parseFloat(formData.fee_percentage) || 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('Failed to parse response JSON:', responseText);
        throw new Error('Server returned invalid JSON response');
      }

      if (result.success) {
        toast.success("Marketplace fee created successfully");
        router.push("/marketplace-fees");
      } else {
        throw new Error(result.error || "Failed to create marketplace fee");
      }

    } catch (err) {
      console.error("Error creating marketplace fee:", err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/marketplace-fees"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Marketplace Fee</h1>
        </div>
        <p className="text-gray-600">Configure fee percentage for a new sales channel</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Shopee, Tokopedia, TikTok Shop"
                required
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the exact channel name as it appears in your sales data
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Percentage (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.fee_percentage}
                onChange={(e) => setFormData({ ...formData, fee_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="10.5"
                required
                min="0"
                max="100"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the fee percentage charged by this marketplace
              </p>
            </div>
          </div>

          {/* Preview calculation */}
          {formData.fee_percentage && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Fee Calculation Preview</h4>
              <div className="text-sm text-blue-700">
                <p>For a sale of Rp 100,000:</p>
                <p>• Fee amount: Rp {((parseFloat(formData.fee_percentage) || 0) / 100 * 100000).toLocaleString('id-ID')}</p>
                <p>• Net revenue: Rp {(100000 - ((parseFloat(formData.fee_percentage) || 0) / 100 * 100000)).toLocaleString('id-ID')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/marketplace-fees"
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-200"
          >
            Cancel
          </Link>
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
                Create Marketplace Fee
              </>
            )}
          </button>
        </div>
      </form>

      {/* Information */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Important Notes</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Channel names are case-insensitive (Shopee = shopee = SHOPEE)</li>
              <li>• Each channel should have a unique fee percentage</li>
              <li>• Fees are automatically deducted when processing sales from this channel</li>
              <li>• You can modify the fee percentage later if marketplace terms change</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}