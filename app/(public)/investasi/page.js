// app/investasi/page.js
// This is now a Server Component that exports metadata
import InvestasiClient from './InvestasiClient';

// SEO Metadata
export const metadata = {
  title: 'Harga Sistem Inventory & Dashboard Penjualan | Early Access - Tokoflow',
  description: 'Tokoflow sedang dalam program Early Access — gratis selama program berjalan untuk merchant pertama. Pricing publik akan diumumkan setelah program berakhir.',
  keywords: 'harga sistem inventory, biaya dashboard penjualan, investasi software UMKM, paket manajemen stok, pricing tokoflow',
  openGraph: {
    title: 'Pricing Tokoflow - Early Access Program',
    description: 'Gratis selama program Early Access. Bergabung dengan merchant pertama yang membentuk Tokoflow. Tanpa kartu kredit, direct developer support.',
    type: 'website',
  },
};

export default function HargaPage() {
  return <InvestasiClient />;
}
