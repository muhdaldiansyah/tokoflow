import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

async function sendNotificationEmail(participant: {
  name: string;
  phone: string;
  email: string;
  business_type: string;
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `Tokoflow <${user}>`,
    to: "muhamadaldiansyah24@gmail.com",
    subject: `[Coba Aplikasi] ${participant.name} — ${participant.business_type}`,
    text: [
      `Pendaftar baru program Coba Aplikasi:`,
      ``,
      `Nama: ${participant.name}`,
      `WA: ${participant.phone}`,
      `Email: ${participant.email}`,
      `Usaha: ${participant.business_type}`,
      ``,
      `— Tokoflow`,
    ].join("\n"),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const { name, phone, email, business_type, city, survey } = body;

    if (!name || !phone || !email || !business_type) {
      return NextResponse.json(
        { error: "Name, WhatsApp number, email, and business type are required" },
        { status: 400 }
      );
    }

    // Normalize phone: remove spaces, ensure starts with 08 or +62
    const normalizedPhone = phone.replace(/\s+/g, "").replace(/^(\+62|62)/, "0");
    if (!/^08\d{8,13}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Invalid WhatsApp number format" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Fetch program by slug
    const { data: program, error: programError } = await supabase
      .from("programs")
      .select("id, status, max_participants")
      .eq("slug", slug)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    if (program.status !== "active") {
      return NextResponse.json(
        { error: "Program sudah ditutup" },
        { status: 410 }
      );
    }

    // Check capacity
    if (program.max_participants) {
      const { count } = await supabase
        .from("program_participants")
        .select("id", { count: "exact", head: true })
        .eq("program_id", program.id);

      if (count !== null && count >= program.max_participants) {
        return NextResponse.json(
          { error: "Kuota sudah penuh. Terima kasih atas minatmu!" },
          { status: 409 }
        );
      }
    }

    // Check duplicate phone
    const { data: existing } = await supabase
      .from("program_participants")
      .select("id")
      .eq("program_id", program.id)
      .eq("phone", normalizedPhone)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Nomor WhatsApp ini sudah terdaftar" },
        { status: 409 }
      );
    }

    // Insert participant
    const { data: participant, error: insertError } = await supabase
      .from("program_participants")
      .insert({
        program_id: program.id,
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim().toLowerCase(),
        business_type,
        city: city?.trim() || null,
        status: "registered",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Signup insert error:", insertError);
      return NextResponse.json(
        { error: "Gagal mendaftar. Coba lagi." },
        { status: 500 }
      );
    }

    // Insert signup survey response if provided
    if (survey && Object.keys(survey).length > 0) {
      await supabase.from("program_responses").insert({
        program_id: program.id,
        participant_id: participant.id,
        type: "signup_survey",
        data: survey,
      });
    }

    // Send email notification (fire-and-forget)
    sendNotificationEmail({
      name: name.trim(),
      phone: normalizedPhone,
      email: email.trim().toLowerCase(),
      business_type,
    }).catch((err) => console.error("Email notification failed:", err));

    return NextResponse.json({
      success: true,
      message: "Thanks! We will reach out on WhatsApp in 1-2 days.",
    });
  } catch (error) {
    console.error("Program signup error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
