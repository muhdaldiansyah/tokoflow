"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full bg-white rounded-xl p-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Pembayaran Berhasil!
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Paket langgananmu sudah aktif. Terima kasih telah upgrade!
        </p>
        <Link
          href="/orders"
          className="inline-flex h-11 items-center justify-center px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-colors text-sm font-medium"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
