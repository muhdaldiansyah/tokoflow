import type { ReminderWithSource } from "@/features/receipts/types/receipt.types";

export async function scheduleOrderReminders(orderId: string): Promise<void> {
  try {
    await fetch("/api/reminders/schedule-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  } catch {
    // Fire-and-forget
  }
}

export async function cancelOrderReminders(orderId: string): Promise<void> {
  try {
    await fetch("/api/reminders/cancel-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  } catch {
    // Fire-and-forget
  }
}

export async function getPendingReminders(): Promise<ReminderWithSource[]> {
  try {
    const res = await fetch("/api/reminders/pending");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function markReminderSent(id: string): Promise<void> {
  try {
    await fetch(`/api/reminders/${id}/sent`, { method: "PATCH" });
  } catch {
    // Fire-and-forget
  }
}

export async function cancelReminder(id: string): Promise<void> {
  try {
    await fetch(`/api/reminders/${id}/cancel`, { method: "PATCH" });
  } catch {
    // Fire-and-forget
  }
}
