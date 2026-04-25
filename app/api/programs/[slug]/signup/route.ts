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
    subject: `[Trial signup] ${participant.name} — ${participant.business_type}`,
    text: [
      `New signup for the trial program:`,
      ``,
      `Name: ${participant.name}`,
      `WhatsApp: ${participant.phone}`,
      `Email: ${participant.email}`,
      `Business: ${participant.business_type}`,
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

    // Normalize phone: remove spaces, ensure starts with 01 (Malaysian mobile).
    // Accepts +60xx, 60xx, 01xx — outputs the leading-zero form 01xxxxxxxx.
    const normalizedPhone = phone.replace(/\s+/g, "").replace(/^(\+60|60)/, "0");
    if (!/^01\d{8,9}$/.test(normalizedPhone)) {
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
        { error: "Program is closed" },
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
          { error: "Slots are full. Thanks for your interest!" },
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
        { error: "This WhatsApp number is already registered" },
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
        { error: "Signup failed. Please try again." },
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
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
