// app/tentang/page.js
// This is now a Server Component that exports metadata
import TentangClient from './TentangClient';

// SEO Metadata for Tokoflow
export const metadata = {
  title: 'Tentang Tokoflow - Platform Inventory & Sales Management UMKM Indonesia',
  description: 'Tokoflow membantu 500+ UMKM Indonesia mengelola inventory dan penjualan multi-channel. Misi kami: demokratisasi teknologi untuk semua skala bisnis.',
  keywords: 'tentang tokoflow, inventory management indonesia, platform umkm, software penjualan, multi-channel management',
  openGraph: {
    title: 'Tentang Tokoflow - Misi Kami untuk UMKM Indonesia',
    description: 'Platform inventory dan sales management yang dipercaya 500+ UMKM. Teknologi enterprise untuk semua skala bisnis.',
    type: 'website',
  },
};

export default function TentangPage() {
  return <TentangClient />;
}