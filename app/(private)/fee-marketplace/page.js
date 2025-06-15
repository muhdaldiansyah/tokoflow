"use client";

import { useState } from "react";

export default function FeeMarketplacePage() {
  const [feeList, setFeeList] = useState([
    { id: 1, channel: "Shopee", persentaseFee: 10 },
    { id: 2, channel: "Tiktok", persentaseFee: 10 },
    { id: 3, channel: "Tokopedia", persentaseFee: 8 },
    { id: 4, channel: "Offline", persentaseFee: 0 }
  ]);

  const [formData, setFormData] = useState({
    channel: "",
    persentaseFee: ""
  });

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if channel already exists (when not in edit mode)
    if (!editMode) {
      const exists = feeList.some(item => 
        item.channel.toLowerCase() === formData.channel.toLowerCase()
      );
      
      if (exists) {
        alert("Channel sudah ada dalam daftar!");
        return;
      }
    }
    
    if (editMode) {
      // Update existing
      setFeeList(prev => prev.map(item => 
        item.id === editId 
          ? { ...item, ...formData }
          : item
      ));
      setEditMode(false);
      setEditId(null);
    } else {
      // Add new
      setFeeList(prev => [...prev, { 
        ...formData, 
        id: Date.now(),
        persentaseFee: parseFloat(formData.persentaseFee)
      }]);
    }
    
    // Reset form
    setFormData({
      channel: "",
      persentaseFee: ""
    });
  };

  const handleEdit = (item) => {
    setFormData({
      channel: item.channel,
      persentaseFee: item.persentaseFee
    });
    setEditMode(true);
    setEditId(item.id);
  };

  const handleDelete = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      setFeeList(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      channel: "",
      persentaseFee: ""
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Fee Marketplace</h1>
      
      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editMode ? "Edit Fee Marketplace" : "Tambah Fee Marketplace"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel
            </label>
            <input
              type="text"
              name="channel"
              value={formData.channel}
              onChange={handleChange}
              placeholder="Nama Channel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
              disabled={editMode}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Persentase Fee (%)
            </label>
            <input
              type="number"
              name="persentaseFee"
              value={formData.persentaseFee}
              onChange={handleChange}
              placeholder="10"
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div className="flex items-end gap-2 md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editMode ? "Update" : "Tambah"}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Daftar Fee Marketplace</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persentase Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contoh Perhitungan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeList.map((item) => {
                const exampleOmzet = 1000000;
                const fee = (item.persentaseFee / 100) * exampleOmzet;
                
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.channel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.persentaseFee}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Omzet Rp 1.000.000 → Fee Rp {fee.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
              {feeList.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    Belum ada data fee marketplace
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Informasi</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Fee marketplace akan otomatis dipotong dari omzet saat menghitung profit</li>
          <li>• Pastikan nama channel sesuai dengan yang digunakan di input penjualan</li>
          <li>• Untuk penjualan offline atau tanpa fee, set persentase 0%</li>
        </ul>
      </div>
    </div>
  );
}
