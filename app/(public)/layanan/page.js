// app/layanan/page.js
// This is now a Server Component that exports metadata
import LayananClient from './LayananClient';

// SEO Metadata with inventory/sales focus
export const metadata = {
  title: 'Layanan Sistem Inventory, Sales Dashboard & Multi-channel Integration - Tokoflow',
  description: 'Solusi lengkap manajemen inventory dan penjualan: Real-time dashboard, integrasi marketplace, laporan profit otomatis. Jakarta, Surabaya, Bandung. Demo gratis!',
  keywords: 'sistem inventory jakarta, dashboard penjualan indonesia, integrasi marketplace, manajemen stok online, multi-channel selling',
  openGraph: {
    title: 'Layanan Inventory & Sales Management Lengkap - Tokoflow',
    description: 'Sistem inventory real-time, dashboard penjualan, integrasi marketplace. Partner digital UMKM Indonesia. ROI terbukti. Free trial!',
    type: 'website',
  },
};

export default function LayananPage() {
  return <LayananClient />;
}
