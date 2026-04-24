"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

export default function PaymentPendingPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full bg-white rounded-xl p-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-yellow-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Waiting for payment
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Your payment is being processed. The plan will activate once payment is confirmed.
        </p>
        <Link
          href="/orders"
          className="inline-flex h-11 items-center justify-center px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-colors text-sm font-medium"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
