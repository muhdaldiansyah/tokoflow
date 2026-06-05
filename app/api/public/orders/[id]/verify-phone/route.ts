import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils/phone";

// Rate limit: 10 attempts per hour per IP prevents brute-force guessing
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = rateLimit.get(ip);
  if (!window || now > window.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (window.count >= 10) return false;
  window.count++;
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ verified: false, error: "Too many attempts" }, { status: 429 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ verified: false }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!rawPhone) return NextResponse.json({ verified: false }, { status: 400 });

  const svc = await createServiceClient();
  const { data: order } = await svc
    .from("orders")
    .select("customer_phone")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!order?.customer_phone) {
    return NextResponse.json({ verified: false });
  }

  // Normalise both sides via the country-aware helper (ID → +62) before comparing
  const inputNorm = normalizePhone(rawPhone) ?? rawPhone.replace(/\D/g, "");
  const orderNorm = normalizePhone(order.customer_phone) ?? order.customer_phone.replace(/\D/g, "");
  const verified = inputNorm === orderNorm;

  return NextResponse.json({ verified });
}
