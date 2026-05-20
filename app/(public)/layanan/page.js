// app/layanan/page.js
// This is now a Server Component that exports metadata
import LayananClient from './LayananClient';

// SEO Metadata with inventory/sales focus
export const metadata = {
  title: 'Layanan Sistem Inventory, Sales Dashboard & Multi-channel Tracking - Tokoflow',
  description: 'Solusi manajemen inventory dan penjualan untuk UMKM Indonesia: real-time dashboard, multi-channel sales tracking, profit calculator otomatis. Sedang dalam program Early Access — demo gratis via WhatsApp.',
  keywords: 'sistem inventory jakarta, dashboard penjualan indonesia, manajemen stok online, multi-channel selling, profit calculator',
  openGraph: {
    title: 'Layanan Inventory & Sales Management - Tokoflow',
    description: 'Sistem inventory real-time, dashboard penjualan multi-channel, profit calculator otomatis. Sedang dalam program Early Access untuk UMKM Indonesia.',
    type: 'website',
  },
};

export default function LayananPage() {
  return <LayananClient />;
}
