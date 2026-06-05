import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Panduan, playbook, dan catatan kepatuhan untuk UMKM Indonesia yang jualan lewat WhatsApp. Segera hadir.",
  alternates: {
    canonical: "https://tokoflow.co.id/blog",
  },
};

export default function BlogPage() {
  return (
    <>
      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link href="/" className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]">
              <Home className="h-3.5 w-3.5" />
              Beranda
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
            <span className="font-medium text-[#1E293B]">Blog</span>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">Blog</h1>
          <p className="mt-2 text-[#475569] lg:text-lg">
            Panduan soal e-Faktur DJP, jualan lewat WhatsApp, dan mengelola toko yang rapi di Indonesia.
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 lg:p-12 shadow-sm">
            <h2 className="text-xl font-semibold text-[#1E293B]">Segera hadir</h2>
            <p className="mt-2 text-sm lg:text-base text-[#475569]">
              Kami sedang menulis panduan praktis untuk pemilik UMKM Indonesia — e-Faktur & PPN, QRIS, dan playbook toko WhatsApp. Tulisan pertama tayang Q3 2026.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" className="h-11 px-6 bg-[#05A660] text-white hover:bg-[#05A660]/90">
                <Link href="/pricing">
                  Lihat harga
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
