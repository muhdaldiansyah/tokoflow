import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyMerchantOfNewOrder, notifyMerchantOfReuploadedProof } from "@/lib/services/order-notifications";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_PROOFS_PER_ORDER = 3;
// 10-year signed URL expiry — long enough that the merchant can always view
// proofs in their dashboard, without permanently public-accessible bank screenshots.
const SIGNED_URL_EXPIRY_SECS = 60 * 60 * 24 * 365 * 10;

// Per-IP rate limit: 5 uploads per hour prevents bulk screenshot farming
const uploadRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkUploadRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = uploadRateLimit.get(ip);
  if (!window || now > window.resetAt) {
    uploadRateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (window.count >= 5) return false;
  window.count++;
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== "string" || id.length < 10) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Rate limit by IP before doing any DB work
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    if (!checkUploadRateLimit(ip)) {
      return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const supabase = await createServiceClient();

    // Verify order exists and is not deleted/cancelled.
    // Extra columns (user_id, order_number, items, total, delivery_fee,
    // customer_name) feed the deferred merchant notification when a QR order
    // (awaiting_payment) becomes visible on first proof upload.
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, deleted_at, image_urls, awaiting_payment, user_id, order_number, items, total, delivery_fee, customer_name")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status === "cancelled") return NextResponse.json({ error: "Order cancelled" }, { status: 400 });

    // Cap proofs per order — prevents screenshot-farming or cross-order reuse.
    // Count only payment-proof URLs, not the merchant's reference photos (both
    // live in image_urls). Otherwise the merchant's photos eat the customer's
    // allowance and a reject → re-upload loop could be blocked too early.
    const existing: string[] = Array.isArray(order.image_urls) ? order.image_urls : [];
    const existingProofs = existing.filter(
      (u) => typeof u === "string" && u.includes("payment-proofs"),
    );
    if (existingProofs.length >= MAX_PROOFS_PER_ORDER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PROOFS_PER_ORDER} payment proofs per order` },
        { status: 429 }
      );
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Use a long-lived signed URL instead of a public URL. The payment-proofs
    // bucket is private; signed URLs give the holder time-limited access without
    // making every screenshot permanently enumerable.
    const { data: signedData, error: signError } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECS);

    if (signError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // First receipt on a QR order makes it real: reveal it to the merchant
    // (awaiting_payment → false) and notify. A payment proof already on the order
    // means this is a RE-upload after the merchant rejected the previous receipt —
    // the order isn't new to them, so notify differently (not "new order").
    const reveal = order.awaiting_payment === true;
    const hadProofBefore = existingProofs.length > 0;

    await supabase
      .from("orders")
      .update({
        image_urls: [...existing, signedData.signedUrl],
        ...(reveal && { awaiting_payment: false }),
      })
      .eq("id", id);

    if (reveal && !hadProofBefore) {
      const items = Array.isArray(order.items)
        ? (order.items as Array<{ name: string; qty: number; price: number }>)
        : [];
      void notifyMerchantOfNewOrder({
        businessId: order.user_id,
        orderNumber: order.order_number,
        orderId: order.id,
        total: Number(order.total) || 0,
        deliveryFee: Number(order.delivery_fee) || 0,
        customerName: order.customer_name || "A customer",
        items,
      }).catch(() => undefined);
    } else if (reveal && hadProofBefore) {
      void notifyMerchantOfReuploadedProof({
        businessId: order.user_id,
        orderNumber: order.order_number,
        orderId: order.id,
        total: Number(order.total) || 0,
        customerName: order.customer_name || "A customer",
      }).catch(() => undefined);
    }

    return NextResponse.json({ url: signedData.signedUrl });
  } catch {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
