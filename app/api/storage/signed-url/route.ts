import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

// POST - Generate a signed upload URL for Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bucket, filename } = body;

    if (!bucket || !filename) {
      return NextResponse.json({ error: "bucket and filename are required" }, { status: 400 });
    }

    // Bucket allowlist — prevent access to unauthorized buckets
    const ALLOWED_BUCKETS = ["product-images", "order-images", "avatars", "qris", "receipts"];
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    // File type validation — only allow images
    const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "heic"];
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    const timestamp = Date.now();
    const path = `${user.id}/${timestamp}.${ext}`;

    const serviceClient = await createServiceClient();

    const { data, error } = await serviceClient.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    const { data: urlData } = serviceClient.storage
      .from(bucket)
      .getPublicUrl(path);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      publicUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error("Signed URL API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
