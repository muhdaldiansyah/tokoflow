"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/database/supabase/client";
import { Loader2, Save, AlertCircle, Package, DollarSign, Percent, Box } from "lucide-react";
import { formatCurrency, formatNumber } from "../../../lib/utils/format";
import { toast } from "sonner";

export default function HargaModalPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [costs, setCosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [modifiedRows, setModifiedRows] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      // Fetch products
      const productsRes = await fetch("/api/products", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (!productsRes.ok) throw new Error("Failed to fetch products");
      const productsData = await productsRes.json();

      // Fetch product costs
      const costsRes = await fetch("/api/product-costs", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (!costsRes.ok) throw new Error("Failed to fetch product costs");
      const costsData = await costsRes.json();

      console.log('Products data structure:', productsData);
      console.log('Costs data structure:', costsData);

      if (productsData.success) {
        setProducts(productsData.data.products || []);
        
        // Merge products with costs
        const mergedData = (productsData.data.products || []).map(product => {
          const cost = (costsData.success && Array.isArray(costsData.data)) 
            ? costsData.data.find(c => c.sku === product.sku)
            : null;
            
          return {
            ...product,
            cost_id: cost?.id || null,
            modal_cost: cost?.modal_cost || 0,
            packing_cost: cost?.packing_cost || 0,
            affiliate_percentage: cost?.affiliate_percentage || 0
          };
        });
        
        setCosts(mergedData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (sku, field, value) => {
    setCosts(costs.map(cost => {
      if (cost.sku === sku) {
        setModifiedRows(new Set([...modifiedRows, sku]));
        return {
          ...cost,
          [field]: value
        };
      }
      return cost;
    }));
  };

  const handleSave = async () => {
    if (modifiedRows.size === 0) {
      toast.info("No changes to save");
      return;
    }
    
    setSaving(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No session found");
      
      const modifiedCosts = costs.filter(cost => modifiedRows.has(cost.sku));
      let successCount = 0;
      let errorCount = 0;
      
      for (const cost of modifiedCosts) {
        try {
          const method = "POST";
          const url = "/api/product-costs";
          
          const response = await fetch(url, {
            method,
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              sku: cost.sku,
              modal_cost: parseFloat(cost.modal_cost) || 0,
              packing_cost: parseFloat(cost.packing_cost) || 0,
              affiliate_percentage: parseFloat(cost.affiliate_percentage) || 0
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            successCount++;
            
            // Update cost_id if it was a new entry
            if (!cost.cost_id && result.data?.id) {
              setCosts(costs.map(c => 
                c.sku === cost.sku ? { ...c, cost_id: result.data.id } : c
              ));
            }
          } else {
            errorCount++;
            console.error(`Failed to save ${cost.sku}:`, result.error);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error saving ${cost.sku}:`, err);
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully saved ${successCount} product costs`);
        setModifiedRows(new Set());
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to save ${errorCount} product costs`);
      }
      
    } catch (err) {
      console.error("Error saving costs:", err);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading product costs...</p>
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
            onClick={fetchData}
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
        <h1 className="text-3xl font-bold text-gray-900">Product Costs</h1>
        <p className="text-gray-600 mt-2">Manage modal cost, packing cost, and affiliate percentage for each product</p>
      </div>

      {/* Save Button */}
      {modifiedRows.size > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-yellow-800">
              You have unsaved changes for {modifiedRows.size} product(s)
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="inline-block w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Costs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Product Cost Configuration</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Modal Cost
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Box className="w-4 h-4 mr-1" />
                    Packing Cost
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Percent className="w-4 h-4 mr-1" />
                    Affiliate %
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costs.length > 0 ? (
                costs.map((cost) => {
                  const totalCostPerUnit = 
                    (parseFloat(cost.modal_cost) || 0) + 
                    (parseFloat(cost.packing_cost) || 0);
                  const isModified = modifiedRows.has(cost.sku);
                  
                  return (
                    <tr key={cost.sku} className={isModified ? "bg-yellow-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cost.name}</div>
                            <div className="text-sm text-gray-500">{cost.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={cost.modal_cost}
                          onChange={(e) => handleCostChange(cost.sku, 'modal_cost', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={cost.packing_cost}
                          onChange={(e) => handleCostChange(cost.sku, 'packing_cost', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={cost.affiliate_percentage}
                          onChange={(e) => handleCostChange(cost.sku, 'affiliate_percentage', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(totalCostPerUnit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          cost.stock < 0 ? 'text-red-600' :
                          cost.stock <= 10 ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {formatNumber(cost.stock)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No products found. Add products first before configuring costs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Product Costs</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Modal Cost:</strong> The base cost of the product (purchase price)</li>
          <li>• <strong>Packing Cost:</strong> Additional cost for packaging materials per unit</li>
          <li>• <strong>Affiliate Percentage:</strong> Commission percentage paid to affiliates (calculated on revenue)</li>
          <li>• Changes are highlighted in yellow until saved</li>
          <li>• These costs are used to calculate profit margins when processing sales</li>
        </ul>
      </div>
    </div>
  );
}
