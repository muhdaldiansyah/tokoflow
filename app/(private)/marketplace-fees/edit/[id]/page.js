"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../../../lib/database/supabase/client";
import { Loader2, Save, ArrowLeft, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function EditMarketplaceFePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    channel: "",
    fee_percentage: ""
  });

  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchMarketplaceFee();
    }
  }, [params.id]);

  const fetchMarketplaceFee = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No session found");
      }

      const response = await fetch(`/api/marketplace-fees/${params.id}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Marketplace fee not found");
        }
        throw new Error("Failed to fetch marketplace fee");
      }

      const result = await response.json();

      if (result.success && result.data) {
        const fee = result.data;
        setOriginalData(fee);
        setFormData({
          channel: fee.channel,
          fee_percentage: fee.fee_percentage.toString()
        });
      } else {
        throw new Error(result.error || "Failed to load marketplace fee");
      }

    } catch (err) {
      console.error("Error fetching marketplace fee:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      const response = await fetch(`/api/marketplace-fees/${params.id}`, {
        method: "PUT",
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
        toast.success("Marketplace fee updated successfully");
        router.push("/marketplace-fees");
      } else {
        throw new Error(result.error || "Failed to update marketplace fee");
      }

    } catch (err) {
      console.error("Error updating marketplace fee:", err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the marketplace fee for ${originalData?.channel}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("No session found");

      const response = await fetch(`/api/marketplace-fees/${params.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete API Error Response:', errorText);
        throw new Error(`Delete request failed: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('Failed to parse delete response JSON:', responseText);
        throw new Error('Server returned invalid JSON response');
      }

      if (result.success) {
        toast.success("Marketplace fee deleted successfully");
        router.push("/marketplace-fees");
      } else {
        throw new Error(result.error || "Failed to delete marketplace fee");
      }

    } catch (err) {
      console.error("Error deleting marketplace fee:", err);
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading marketplace fee...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={fetchMarketplaceFee}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              href="/marketplace-fees"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Marketplace Fee</h1>
        </div>
        <p className="text-gray-600">Update fee percentage for {originalData?.channel}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                placeholder="e.g., Shopee, Tokopedia, TikTok Shop"
                required
                disabled={true}
              />
              <p className="text-xs text-gray-500 mt-1">
                Channel name cannot be changed after creation
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
                disabled={submitting || deleting}
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

          {/* Fee History */}
          {originalData && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Fee Information</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• Created: {originalData.created_at ? new Date(originalData.created_at).toLocaleString('id-ID') : '-'}</p>
                <p>• Last Updated: {originalData.updated_at ? new Date(originalData.updated_at).toLocaleString('id-ID') : '-'}</p>
                {originalData.fee_percentage !== parseFloat(formData.fee_percentage) && (
                  <p>• Previous Fee: {originalData.fee_percentage}%</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || submitting}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {deleting ? (
              <>
                <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="inline-block w-4 h-4 mr-2" />
                Delete Fee
              </>
            )}
          </button>

          <div className="flex gap-4">
            <Link
              href="/marketplace-fees"
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || deleting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Update Marketplace Fee
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Information */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Important Notes</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Changing the fee percentage will affect future sales calculations</li>
              <li>• Previous sales data will not be recalculated automatically</li>
              <li>• Deleting this fee will prevent automatic fee calculations for this channel</li>
              <li>• Make sure the fee percentage matches your current marketplace agreement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}