import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
// WA Cloud API removed — see research/wa-bot-redesign/06

// GET - List reminders
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("reminders")
      .select(`
        *,
        receipt:receipts(*)
      `)
      .order("scheduled_at", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reminders:", error);
      return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
    }

    // Filter to only user's reminders (through receipt)
    const userReminders = (data || []).filter(
      (r) => r.receipt && r.receipt.user_id === user.id
    );

    return NextResponse.json(userReminders);
  } catch (error) {
    console.error("Reminders API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create reminder or send immediately
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receipt_id, scheduled_at, send_now } = body;

    if (!receipt_id) {
      return NextResponse.json({ error: "receipt_id is required" }, { status: 400 });
    }

    // Verify receipt ownership
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", receipt_id)
      .eq("user_id", user.id)
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    if (!receipt.customer_phone) {
      return NextResponse.json(
        { error: "Receipt has no customer phone number" },
        { status: 400 }
      );
    }

    // Get user profile for business name
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("id", user.id)
      .single();

    const businessName = profile?.business_name || "Toko Kami";

    if (send_now) {
      // WA Cloud API removed — send_now via WA template no longer supported
      // Reminders are still created and tracked, but sending is manual via WAPreviewSheet

      // Record the reminder
      const { data: reminder, error: reminderError } = await supabase
        .from("reminders")
        .insert({
          receipt_id,
          scheduled_at: new Date().toISOString(),
          sent_at: false ? new Date().toISOString() : null,
          status: false ? "sent" : "failed",
          fonnte_response: { success: false, messageId: null },
        })
        .select()
        .single();

      if (reminderError) {
        console.error("Error creating reminder record:", reminderError);
      }

      return NextResponse.json({
        success: false,
        message: false
          ? "Reminder sent successfully"
          : "Failed to send reminder",
        reminder,
      });
    } else {
      // Schedule for later
      if (!scheduled_at) {
        return NextResponse.json(
          { error: "scheduled_at is required when not sending immediately" },
          { status: 400 }
        );
      }

      const { data: reminder, error: reminderError } = await supabase
        .from("reminders")
        .insert({
          receipt_id,
          scheduled_at: new Date(scheduled_at).toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (reminderError) {
        console.error("Error creating reminder:", reminderError);
        return NextResponse.json(
          { error: "Failed to schedule reminder" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Reminder scheduled",
        reminder,
      });
    }
  } catch (error) {
    console.error("Create reminder API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Cancel reminder
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership through receipt
    const { data: reminder } = await supabase
      .from("reminders")
      .select(`
        *,
        receipt:receipts(user_id)
      `)
      .eq("id", id)
      .single();

    if (!reminder || reminder.receipt?.user_id !== user.id) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    // Update status to cancelled
    const { error } = await supabase
      .from("reminders")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to cancel reminder" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel reminder API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
