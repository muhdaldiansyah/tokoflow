// app/panduan/page.js
// This is now a Server Component that exports metadata
import PanduanClient from './PanduanClient';

// SEO Metadata
export const metadata = {
  title: 'Panduan Inventory Management & Tips Scale Up Bisnis - Tokoflow Blog',
  description: 'Artikel dan panduan lengkap manajemen inventory, strategi multi-channel selling, optimasi profit margin, dan tips grow bisnis UMKM.',
  keywords: 'panduan inventory management, tips manajemen stok, strategi multi-channel, optimasi profit, scale up bisnis UMKM',
  openGraph: {
    title: 'Tokoflow Blog - Panduan & Tips Bisnis UMKM',
    description: 'Resource lengkap untuk UMKM: inventory management, sales analytics, marketplace integration. Update mingguan dari praktisi.',
    type: 'website',
  },
};

export default function PanduanPage() {
  return <PanduanClient />;
}
