"use client";

import { useState } from "react";

export default function HargaModalPage() {
  const [modalList, setModalList] = useState([
    {
      id: 1,
      sku: "#012025",
      modal: 50000,
      packing: 2000,
      komisiAffiliate: 10
    },
    {
      id: 2,
      sku: "#012026",
      modal: 50000,
      packing: 2500,
      komisiAffiliate: 15
    },
    {
      id: 3,
      sku: "#012027",
      modal: 55000,
      packing: 3000,
      komisiAffiliate: 15
    }
  ]);

  const [formData, setFormData] = useState({
    sku: "",
    modal: "",
    packing: "",
    komisiAffiliate: ""
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
    
    if (editMode) {
      // Update existing
      setModalList(prev => prev.map(item => 
        item.id === editId 
          ? { ...item, ...formData }
          : item
      ));
      setEditMode(false);
      setEditId(null);
    } else {
      // Add new
      setModalList(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    
    // Reset form
    setFormData({
      sku: "",
      modal: "",
      packing: "",
      komisiAffiliate: ""
    });
  };

  const handleEdit = (item) => {
    setFormData({
      sku: item.sku,
      modal: item.modal,
      packing: item.packing,
      komisiAffiliate: item.komisiAffiliate
    });
    setEditMode(true);
    setEditId(item.id);
  };

  const handleDelete = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      setModalList(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      sku: "",
      modal: "",
      packing: "",
      komisiAffiliate: ""
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Harga Modal</h1>
      
      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editMode ? "Edit Harga Modal" : "Tambah Harga Modal"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="#012025"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
              disabled={editMode}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modal (Rp)
            </label>
            <input
              type="number"
              name="modal"
              value={formData.modal}
              onChange={handleChange}
              placeholder="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Packing (Rp)
            </label>
            <input
              type="number"
              name="packing"
              value={formData.packing}
              onChange={handleChange}
              placeholder="2000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Komisi Affiliate (%)
            </label>
            <input
              type="number"
              name="komisiAffiliate"
              value={formData.komisiAffiliate}
              onChange={handleChange}
              placeholder="10"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div className="flex items-end gap-2 lg:col-span-4">
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
          <h2 className="text-lg font-semibold">Daftar Harga Modal</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Packing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total HPP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Komisi Affiliate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modalList.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {item.modal.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {item.packing.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    Rp {(item.modal + item.packing).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.komisiAffiliate}%
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
              ))}
              {modalList.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Belum ada data harga modal
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
