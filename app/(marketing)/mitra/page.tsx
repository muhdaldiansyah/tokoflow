import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partner program — Tokoflow",
  description:
    "Help fellow Malaysian small businesses level up with Tokoflow. Earn RM 2 per friend who signs up + 30% commission on their payments for 6 months.",
};

export default function MitraPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1E293B] mb-4">
            Tokoflow partner program
          </h1>
          <p className="text-lg text-[#475569] max-w-xl mx-auto">
            Help fellow SMBs level up — from selling to a real business. Earn cash for every friend who joins.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
            <h3 className="font-semibold text-[#1E293B] mb-1">Sign up free</h3>
            <p className="text-sm text-[#475569]">Create a free account. Your referral link is ready in Settings.</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
            <h3 className="font-semibold text-[#1E293B] mb-1">Share link</h3>
            <p className="text-sm text-[#475569]">Send your link to SMB friends via WhatsApp. Help them run a cleaner business.</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
            <h3 className="font-semibold text-[#1E293B] mb-1">Get paid</h3>
            <p className="text-sm text-[#475569]">RM 2 when they place their first order + 30% commission on their payments for 6 months.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm mb-12">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-4">Incentive details</h2>
          <div className="space-y-4 text-sm text-[#475569]">
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold shrink-0 text-base">RM 2</span>
              <div>
                <p className="font-medium text-[#1E293B]">Signup bonus</p>
                <p className="text-xs text-[#64748B] mt-0.5">Credit lands in your balance when an invited friend places their first order. No payment prerequisite.</p>
              </div>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold shrink-0 text-base">30%</span>
              <div>
                <p className="font-medium text-[#1E293B]">Payment commission</p>
                <p className="text-xs text-[#64748B] mt-0.5">From every subscription or top-up your friend pays for 6 months:</p>
                <ul className="mt-1.5 space-y-0.5 text-xs text-[#64748B]">
                  <li>Top-up 50 orders RM 5 &rarr; commission RM 1.50</li>
                  <li>Top-up 100 orders RM 8 &rarr; commission RM 2.40</li>
                  <li>Unlimited RM 13/mo &rarr; commission RM 3.90</li>
                  <li>Pro RM 49/mo &rarr; commission RM 14.70</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-6 mb-12">
          <h3 className="font-semibold text-[#1E293B] mb-2">Example: invite 10 friends</h3>
          <div className="space-y-1 text-sm text-[#475569]">
            <p>10 friends sign up + place an order = <span className="font-semibold text-green-700">RM 20</span></p>
            <p>3 of them go Unlimited = <span className="font-semibold text-green-700">RM 11.70</span></p>
            <p className="pt-1 text-base font-semibold text-green-700">Total: RM 31.70/month</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/register"
            className="inline-flex h-12 px-8 items-center justify-center rounded-xl bg-green-600 text-white font-semibold text-base hover:bg-green-700 transition-colors"
          >
            Sign up free
          </Link>
          <p className="text-sm text-[#475569] mt-3">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1E293B] font-medium hover:underline">
              Sign in
            </Link>
            {" "}then open Settings to copy your referral link
          </p>
        </div>
      </div>
    </div>
  );
}
