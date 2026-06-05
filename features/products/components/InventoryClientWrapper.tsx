"use client";

import dynamic from "next/dynamic";
import type { Product } from "../types/product.types";

// ssr:false keeps this component client-only so Turbopack SSR cache
// mismatches never surface when the inner component is edited in dev mode.
const InventoryDynamic = dynamic(
  () => import("./InventoryPageClient").then((m) => ({ default: m.InventoryPageClient })),
  { ssr: false, loading: () => null }
);

interface Props {
  initialProducts: Product[];
  initialSales: Record<string, number>;
  businessName?: string;
}

export function InventoryClientWrapper({ initialProducts, initialSales, businessName }: Props) {
  return <InventoryDynamic initialProducts={initialProducts} initialSales={initialSales} businessName={businessName} />;
}
