// app/tentang/page.js
// This is now a Server Component that exports metadata
import TentangClient from './TentangClient';

// SEO Metadata for Tokoflow
export const metadata = {
  title: 'Tentang Tokoflow - Platform Inventory & Sales Management UMKM Indonesia',
  description: 'Tokoflow adalah platform inventory dan penjualan untuk UMKM Indonesia, sedang dalam program Early Access. Misi kami: demokratisasi teknologi untuk semua skala bisnis.',
  keywords: 'tentang tokoflow, inventory management indonesia, platform umkm, software penjualan, multi-channel management',
  openGraph: {
    title: 'Tentang Tokoflow - Misi Kami untuk UMKM Indonesia',
    description: 'Platform inventory dan sales management untuk UMKM Indonesia. Sedang dalam program Early Access — bergabung dengan merchant pertama yang membentuk Tokoflow.',
    type: 'website',
  },
};

export default function TentangPage() {
  return <TentangClient />;
}