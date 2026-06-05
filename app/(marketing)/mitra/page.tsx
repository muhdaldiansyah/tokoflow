import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { REFERRAL_ENABLED } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: "Program mitra",
  description:
    "Ajak temanmu ke Tokoflow. Dapat Rp 10.000 saat mereka membuat order pertama, plus komisi 30% dari pembayaran mereka selama 6 bulan. Uang tunai nyata, bukan poin.",
};

export default function MitraPage() {
  // Referral program paused — keep this page unreachable while hidden.
  if (!REFERRAL_ENABLED) redirect("/");
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1E293B] mb-4">
            Ajak temanmu sekalian.
          </h1>
          <p className="text-lg text-[#475569] max-w-xl mx-auto">
            Kenal seseorang yang butuh cara lebih tenang mengelola tokonya? Kirim link-mu. Saat mereka jualan, kamu dapat — diam-diam, adil.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
            <h3 className="font-semibold text-[#1E293B] mb-1">Daftar gratis</h3>
            <p className="text-sm text-[#475569]">Buat akun gratis. Link referral-mu siap di Pengaturan.</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
            <h3 className="font-semibold text-[#1E293B] mb-1">Bagikan link</h3>
            <p className="text-sm text-[#475569]">Kirim link-mu ke teman yang jualan di WhatsApp, IG, atau TikTok.</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
            <h3 className="font-semibold text-[#1E293B] mb-1">Dapat bayaran</h3>
            <p className="text-sm text-[#475569]">Rp 10.000 saat order pertama mereka + komisi 30% dari pembayaran mereka selama 6 bulan.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm mb-12">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-4">Detail insentif</h2>
          <div className="space-y-4 text-sm text-[#475569]">
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold shrink-0 text-base">Rp 10.000</span>
              <div>
                <p className="font-medium text-[#1E293B]">Bonus pendaftaran</p>
                <p className="text-xs text-[#64748B] mt-0.5">Kredit masuk ke saldomu saat teman yang kamu undang membuat order pertama. Tanpa syarat pembayaran.</p>
              </div>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold shrink-0 text-base">30%</span>
              <div>
                <p className="font-medium text-[#1E293B]">Komisi langganan</p>
                <p className="text-xs text-[#64748B] mt-0.5">Dari setiap langganan yang dibayar temanmu selama 6 bulan:</p>
                <ul className="mt-1.5 space-y-0.5 text-xs text-[#64748B]">
                  <li>Pro Rp 99.000/bln &rarr; komisi Rp 29.700/bln</li>
                  <li>Business Rp 199.000/bln &rarr; komisi Rp 59.700/bln</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-6 mb-12">
          <h3 className="font-semibold text-[#1E293B] mb-2">Contoh: undang 10 teman</h3>
          <div className="space-y-1 text-sm text-[#475569]">
            <p>10 teman daftar + buat order = <span className="font-semibold text-green-700">Rp 100.000</span> sekali</p>
            <p>3 jadi Pro Rp 99.000/bln = <span className="font-semibold text-green-700">Rp 89.100/bln</span> selama 6 bulan</p>
            <p className="pt-1 text-base font-semibold text-green-700">Hingga Rp 634.600 selama 6 bulan — dibayar tunai</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/register"
            className="inline-flex h-12 px-8 items-center justify-center rounded-xl bg-green-600 text-white font-semibold text-base hover:bg-green-700 transition-colors"
          >
            Daftar gratis
          </Link>
          <p className="text-sm text-[#475569] mt-3">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#1E293B] font-medium hover:underline">
              Masuk
            </Link>
            {" "}lalu buka Pengaturan untuk menyalin link referral-mu
          </p>
        </div>
      </div>
    </div>
  );
}
