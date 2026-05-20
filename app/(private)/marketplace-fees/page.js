"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuthSimple";
import { Loader2, Plus, AlertCircle, ShoppingBag, Edit2, Search } from "lucide-react";
import { formatPercentage } from "../../../lib/utils/format";

export default function MarketplaceFeesPage() {
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && session) {
      fetchFees();
    } else if (!authLoading && !session) {
      setError("Authentication required");
      setLoading(false);
    }
  }, [authLoading, session]);

  const fetchFees = async () => {
    setLoading(true);
    setError(null);

    try {
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

  // Filter fees based on search term
  const filteredFees = fees.filter(fee =>
    fee.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketplace Fees</h1>
        <p className="text-gray-600 mt-2">Manage fee percentages for each sales channel</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/marketplace-fees/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        >
          <Plus className="inline-block w-4 h-4 mr-2" />
          Add New Fee
        </Link>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

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
              {filteredFees.length > 0 ? (
                filteredFees.map((fee) => {
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
                        <Link
                          href={`/marketplace-fees/edit/${fee.id}`}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-all duration-200"
                        >
                          <Edit2 className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : searchTerm ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p>No marketplace fees found matching "{searchTerm}"</p>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p>No marketplace fees configured.</p>
                    <p className="text-sm mt-2">Create your first marketplace fee above.</p>
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
