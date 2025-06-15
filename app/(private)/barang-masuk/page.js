"use client";

import { useState } from "react";

export default function BarangMasukPage() {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    sku: "",
    namaProduk: "",
    jumlahMasuk: "",
    status: "OK"
  });

  const [barangList, setBarangList] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Add to list
    setBarangList(prev => [...prev, { ...formData, id: Date.now() }]);
    
    // Reset form
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      sku: "",
      namaProduk: "",
      jumlahMasuk: "",
      status: "OK"
    });
  };

  const processBarangMasuk = () => {
    // This will process all OK status items
    const itemsToProcess = barangList.filter(item => item.status === "OK");
    
    if (itemsToProcess.length === 0) {
      alert("Tidak ada barang masuk dengan status OK untuk diproses");
      return;
    }

    // TODO: Implement actual processing logic
    alert(`Memproses ${itemsToProcess.length} barang masuk...`);
    
    // Clear processed items
    setBarangList(prev => prev.filter(item => item.status !== "OK"));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Input Barang Masuk</h1>
      
      {/* Input Form */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
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
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Produk
            </label>
            <input
              type="text"
              name="namaProduk"
              value={formData.namaProduk}
              onChange={handleChange}
              placeholder="Power Bank"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Masuk
            </label>
            <input
              type="number"
              name="jumlahMasuk"
              value={formData.jumlahMasuk}
              onChange={handleChange}
              placeholder="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="OK">OK</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tambah
            </button>
          </div>
        </form>
      </div>
      
      {/* List of pending items */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold">Daftar Barang Masuk Pending</h2>
          <button
            onClick={processBarangMasuk}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Proses Barang Masuk
          </button>
        </div>
        
        <div className="overflow-x-auto -mx-4 sm:-mx-6">
          <div className="inline-block min-w-full align-middle px-4 sm:px-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Masuk
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {barangList.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.sku}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.namaProduk}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.jumlahMasuk}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'OK' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {barangList.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-3 py-4 text-center text-sm text-gray-500">
                      Belum ada data barang masuk
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
