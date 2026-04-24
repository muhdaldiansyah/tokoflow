import { NextResponse } from "next/server";
import { isValidSlug, isReservedSlug } from "@/lib/utils/slug";
import { createServiceClient } from "@/lib/supabase/server";

// Simple in-memory rate limit: 30 req/min per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 30;
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ available: false }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.toLowerCase().trim() || "";

  if (!isValidSlug(slug) || isReservedSlug(slug)) {
    return NextResponse.json({ available: false });
  }

  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
