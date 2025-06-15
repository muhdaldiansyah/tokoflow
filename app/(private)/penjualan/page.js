"use client";

import { useState } from "react";

export default function PenjualanPage() {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    sku: "",
    namaProduk: "",
    hargaJual: "",
    jumlah: "",
    channel: "",
    status: "OK"
  });

  const [penjualanList, setPenjualanList] = useState([]);

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
    setPenjualanList(prev => [...prev, { ...formData, id: Date.now() }]);
    
    // Reset form
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      sku: "",
      namaProduk: "",
      hargaJual: "",
      jumlah: "",
      channel: "",
      status: "OK"
    });
  };

  const processPenjualan = () => {
    // This will process all OK status items
    const itemsToProcess = penjualanList.filter(item => item.status === "OK");
    
    if (itemsToProcess.length === 0) {
      alert("Tidak ada penjualan dengan status OK untuk diproses");
      return;
    }

    // TODO: Implement actual processing logic
    alert(`Memproses ${itemsToProcess.length} penjualan...`);
    
    // Clear processed items
    setPenjualanList(prev => prev.filter(item => item.status !== "OK"));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Input Penjualan</h1>
      
      {/* Input Form */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Harga Jual
            </label>
            <input
              type="number"
              name="hargaJual"
              value={formData.hargaJual}
              onChange={handleChange}
              placeholder="100000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah
            </label>
            <input
              type="number"
              name="jumlah"
              value={formData.jumlah}
              onChange={handleChange}
              placeholder="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel
            </label>
            <select
              name="channel"
              value={formData.channel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Pilih Channel</option>
              <option value="Shopee">Shopee</option>
              <option value="Tiktok">Tiktok</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="Offline">Offline</option>
            </select>
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
              <option value="Dalam proses">Dalam proses</option>
              <option value="Dibatalkan">Dibatalkan</option>
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
      
      {/* List of pending sales */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold">Daftar Penjualan Pending</h2>
          <button
            onClick={processPenjualan}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Proses Penjualan
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
                    Harga Jual
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {penjualanList.map((item) => (
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
                      Rp {parseInt(item.hargaJual).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.jumlah}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.channel}
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
                {penjualanList.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-3 py-4 text-center text-sm text-gray-500">
                      Belum ada data penjualan
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
