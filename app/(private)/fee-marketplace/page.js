"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, Plus, Save, X, AlertCircle, ShoppingBag, Edit2, Trash2 } from "lucide-react";
import { formatPercentage } from "../../../lib/utils/format";
import { toast } from "sonner";

export default function FeeMarketplacePage() {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    channel: "",
    fee_percentage: ""
  });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      console.log('Fetching marketplace fees with session:', !!session);
      
      const response = await fetch("/api/marketplace-fees", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch marketplace fees: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('Failed to parse JSON response:', responseText);
        throw new Error('Server returned invalid JSON response');
      }
      
      if (result.success) {
        setFees(result.data);
      } else {
        throw new Error(result.error || "Failed to load fees");
      }
    } catch (err) {
      console.error("Error fetching fees:", err);
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
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `/api/marketplace-fees/${editingId}`
        : "/api/marketplace-fees";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channel: formData.channel,
          fee_percentage: parseFloat(formData.fee_percentage) || 0
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('Failed to parse save response JSON:', responseText);
        throw new Error('Server returned invalid JSON response');
      }
      
      if (result.success) {
        toast.success(editingId ? "Fee updated successfully" : "Fee added successfully");
        
        // Reset form
        setFormData({ channel: "", fee_percentage: "" });
        setEditingId(null);
        setShowAddForm(false);
        
        // Refresh list
        fetchFees();
      } else {
        throw new Error(result.error || "Failed to save fee");
      }
      
    } catch (err) {
      console.error("Error saving fee:", err);
      toast.error(err.message);
    }
  };

  const handleEdit = (fee) => {
    setFormData({
      channel: fee.channel,
      fee_percentage: fee.fee_percentage.toString()
    });
    setEditingId(fee.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id, channel) => {
    if (!confirm(`Are you sure you want to delete the fee for ${channel}?`)) return;
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const response = await fetch(`/api/marketplace-fees/${id}`, {
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
        toast.success("Fee deleted successfully");
        fetchFees();
      } else {
        throw new Error(result.error || "Failed to delete fee");
      }
      
    } catch (err) {
      console.error("Error deleting fee:", err);
      toast.error(err.message);
    }
  };

  const handleCancel = () => {
    setFormData({ channel: "", fee_percentage: "" });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading marketplace fees...</p>
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
          <button
            onClick={fetchFees}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketplace Fees</h1>
        <p className="text-gray-600 mt-2">Manage fee percentages for each sales channel</p>
      </div>

      {/* Add/Edit Form */}
      {showAddForm ? (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Marketplace Fee" : "Add New Marketplace Fee"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Shopee, Tokopedia"
                  required
                  disabled={editingId}
                />
                {editingId && (
                  <p className="text-xs text-gray-500 mt-1">Channel name cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.fee_percentage}
                  onChange={(e) => setFormData({ ...formData, fee_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10"
                  required
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Save className="inline-block w-4 h-4 mr-2" />
                {editingId ? "Update Fee" : "Add Fee"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="inline-block w-4 h-4 mr-2" />
            Add New Fee
          </button>
        </div>
      )}

      {/* Fees List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Current Marketplace Fees</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Example Calculation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fees.length > 0 ? (
                fees.map((fee) => {
                  const exampleRevenue = 100000;
                  const feeAmount = (fee.fee_percentage / 100) * exampleRevenue;
                  
                  return (
                    <tr key={fee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ShoppingBag className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">
                            {fee.channel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {fee.fee_percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rp 100,000 → Fee: Rp {feeAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fee.updated_at ? new Date(fee.updated_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(fee)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id, fee.channel)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No marketplace fees configured. Add your first fee above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Marketplace Fees</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Marketplace fees are automatically deducted from revenue when processing sales</li>
          <li>• Each channel should have a unique fee percentage</li>
          <li>• Channel names are case-insensitive (Shopee = shopee = SHOPEE)</li>
          <li>• Fee percentages are applied to the total revenue (selling price × quantity)</li>
        </ul>
      </div>
    </div>
  );
}
