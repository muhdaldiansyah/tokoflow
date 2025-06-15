// app/investasi/page.js
// This is now a Server Component that exports metadata
import InvestasiClient from './InvestasiClient';

// SEO Metadata
export const metadata = {
  title: 'Harga Sistem Inventory & Dashboard Penjualan 2025 | Transparan - Tokoflow',
  description: 'Investasi sistem inventory mulai 299rb/bulan. Paket dashboard penjualan, integrasi marketplace, business analytics dengan harga transparan. Free trial 14 hari!',
  keywords: 'harga sistem inventory, biaya dashboard penjualan, investasi software UMKM, paket manajemen stok, pricing tokoflow',
  openGraph: {
    title: 'Pricing Tokoflow - Sistem Inventory & Sales | Mulai 299rb/bulan',
    description: 'Pilih paket sesuai skala bisnis. Starter, Professional, Enterprise. Free trial 14 hari tanpa kartu kredit. ROI dalam 3 bulan!',
    type: 'website',
  },
};

export default function HargaPage() {
  return <InvestasiClient />;
}
