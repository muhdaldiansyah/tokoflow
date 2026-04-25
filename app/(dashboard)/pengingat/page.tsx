"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Loader2, Bell, X, Send, Search, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { ReminderWithSource } from "@/features/receipts/types/receipt.types";
import {
  getPendingReminders,
  markReminderSent,
  cancelReminder,
} from "@/features/orders/services/reminder.service";
import { WAPreviewSheet } from "@/features/orders/components/WAPreviewSheet";
import { track } from "@/lib/analytics";

function getRelativeDate(scheduledAt: string): { label: string; isOverdue: boolean; isToday: boolean } {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  if (scheduled < startOfToday) {
    const diffMs = startOfToday.getTime() - scheduled.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { label: `Overdue by ${diffDays} days`, isOverdue: true, isToday: false };
  }

  if (scheduled >= startOfToday && scheduled < endOfToday) {
    return { label: "Today", isOverdue: false, isToday: true };
  }

  const diffMs = scheduled.getTime() - endOfToday.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: "Tomorrow", isOverdue: false, isToday: false };
  }

  return { label: `in ${diffDays + 1} days`, isOverdue: false, isToday: false };
}

type TimeFilter = "all" | "overdue" | "today" | "upcoming";

const TIME_CHIPS: { label: string; value: TimeFilter }[] = [
  { label: "Overdue", value: "overdue" },
  { label: "Today", value: "today" },
  { label: "Upcoming", value: "upcoming" },
];

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderWithSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const dateCalendarRef = useRef<HTMLDivElement>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [waPreview, setWaPreview] = useState<{
    open: boolean;
    name: string;
    phone: string | null;
    message: string;
    reminderId: string;
  }>({ open: false, name: "", phone: null, message: "", reminderId: "" });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Close calendar on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dateCalendarRef.current && !dateCalendarRef.current.contains(e.target as Node)) {
        setShowDateCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await getPendingReminders();
      setReminders(data);
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  function getCustomerInfo(reminder: ReminderWithSource) {
    if (reminder.order) {
      const outstanding = (reminder.order.total || 0) - (reminder.order.paid_amount || 0);
      return {
        number: reminder.order.order_number,
        name: reminder.order.customer_name || "Unnamed",
        phone: reminder.order.customer_phone || null,
        amount: outstanding,
        type: "Order" as const,
      };
    }
    if (reminder.receipt) {
      return {
        number: reminder.receipt.receipt_number,
        name: reminder.receipt.customer_name || "Unnamed",
        phone: reminder.receipt.customer_phone || null,
        amount: reminder.receipt.total,
        type: "Receipt" as const,
      };
    }
    return { number: "-", name: "Unnamed", phone: null, amount: 0, type: "Order" as const };
  }

  // Filter reminders
  const now = useMemo(() => new Date(), []);
  const startOfToday = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const endOfToday = useMemo(() => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() + 1);
    return d;
  }, [startOfToday]);

  const filtered = useMemo(() => {
    let result = reminders;

    // Time filter
    if (timeFilter === "overdue") {
      result = result.filter((r) => new Date(r.scheduled_at) < startOfToday);
    } else if (timeFilter === "today") {
      result = result.filter((r) => {
        const d = new Date(r.scheduled_at);
        return d >= startOfToday && d < endOfToday;
      });
    } else if (timeFilter === "upcoming") {
      result = result.filter((r) => new Date(r.scheduled_at) >= endOfToday);
    }

    // Date filter (single date or range:from:to)
    if (dateFilter) {
      if (dateFilter.startsWith("range:")) {
        const [, from, to] = dateFilter.split(":");
        const rangeStart = new Date(from + "T00:00:00");
        const rangeEnd = new Date(to + "T00:00:00");
        rangeEnd.setDate(rangeEnd.getDate() + 1);
        result = result.filter((r) => {
          const d = new Date(r.scheduled_at);
          return d >= rangeStart && d < rangeEnd;
        });
      } else {
        const filterDate = new Date(dateFilter + "T00:00:00");
        const filterEnd = new Date(filterDate);
        filterEnd.setDate(filterEnd.getDate() + 1);
        result = result.filter((r) => {
          const d = new Date(r.scheduled_at);
          return d >= filterDate && d < filterEnd;
        });
      }
    }

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((r) => {
        const info = getCustomerInfo(r);
        return (
          info.name.toLowerCase().includes(q) ||
          info.number.toLowerCase().includes(q) ||
          (info.phone && info.phone.includes(q))
        );
      });
    }

    return result;
  }, [reminders, timeFilter, dateFilter, debouncedSearch, startOfToday, endOfToday]);

  // Count per filter for badges
  const counts = useMemo(() => ({
    all: reminders.length,
    overdue: reminders.filter((r) => new Date(r.scheduled_at) < startOfToday).length,
    today: reminders.filter((r) => { const d = new Date(r.scheduled_at); return d >= startOfToday && d < endOfToday; }).length,
    upcoming: reminders.filter((r) => new Date(r.scheduled_at) >= endOfToday).length,
  }), [reminders, startOfToday, endOfToday]);

  // Group filtered results
  const overdueGroup = filtered.filter((r) => new Date(r.scheduled_at) < startOfToday);
  const todayGroup = filtered.filter((r) => { const d = new Date(r.scheduled_at); return d >= startOfToday && d < endOfToday; });
  const upcomingGroup = filtered.filter((r) => new Date(r.scheduled_at) >= endOfToday);

  // Total outstanding
  const totalOutstanding = useMemo(() => {
    return filtered.reduce((sum, r) => {
      const info = getCustomerInfo(r);
      return sum + info.amount;
    }, 0);
  }, [filtered]);

  function handleSendWA(reminder: ReminderWithSource) {
    const info = getCustomerInfo(reminder);
    setWaPreview({
      open: true,
      name: info.name,
      phone: info.phone,
      message: reminder.message_text || `Halo ${info.name}, ada sisa pembayaran sebesar RM ${info.amount.toLocaleString("en-MY")}.`,
      reminderId: reminder.id,
    });
  }

  async function handleWaSent() {
    if (!waPreview.reminderId) return;
    await markReminderSent(waPreview.reminderId);
    track("reminder_sent", { reminder_id: waPreview.reminderId });
    setReminders((prev) => prev.filter((r) => r.id !== waPreview.reminderId));
    toast.success("Reminder sent");
  }

  async function handleCancel(id: string) {
    if (confirmCancelId !== id) {
      setConfirmCancelId(id);
      setTimeout(() => setConfirmCancelId(null), 3000);
      return;
    }
    setConfirmCancelId(null);
    await cancelReminder(id);
    track("reminder_cancelled", { reminder_id: id });
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast.success("Reminder cancelled");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const chipBase = "inline-flex items-center h-7 px-2.5 text-[11px] font-medium rounded-full border whitespace-nowrap shrink-0 transition-colors cursor-pointer";
  const chipActive = "bg-warm-green-light border-warm-green/30 text-warm-green hover:bg-warm-green/20";
  const chipInactive = "bg-muted/50 border-border text-foreground/70 hover:bg-muted";

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between min-h-9">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Reminder</h1>
            {reminders.length > 0 && (
              <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {reminders.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Orders that are still unpaid</p>
        </div>
        {totalOutstanding > 0 && (
          <p className="text-xs font-medium text-red-600">
            Total RM {totalOutstanding.toLocaleString("en-MY")}
          </p>
        )}
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Everything&apos;s paid up!</h2>
          <p className="text-sm text-muted-foreground">
            Reminders show up automatically when orders go unpaid
          </p>
        </div>
      ) : (<>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pelanggan atau nomor pesanan..."
            className="w-full h-11 pl-10 pr-4 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-card transition-colors placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter Chips */}
        <div className="relative space-y-2">
          <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide min-w-0 flex-1">
            {/* Date chip */}
            <button
              type="button"
              onClick={() => {
                const opening = !showDateCalendar;
                setShowDateCalendar(opening);
                if (opening) {
                  setPickerMonth(new Date().getMonth());
                  setPickerYear(new Date().getFullYear());
                }
              }}
              className={`${chipBase} gap-1 ${dateFilter ? chipActive : showDateCalendar ? "bg-warm-green/10 border-warm-green/30 text-warm-green" : chipInactive}`}
            >
              <CalendarDays className="w-3 h-3" />
              {dateFilter
                ? dateFilter.startsWith("range:")
                  ? (() => { const [, from, to] = dateFilter.split(":"); return `${new Date(from + "T00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short" })} - ${new Date(to + "T00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short" })}`; })()
                  : new Date(dateFilter + "T00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short" })
                : "Date"}
            </button>

            {/* Time filter chips */}
            {TIME_CHIPS.map((chip) => {
              const isActive = timeFilter === chip.value;
              const count = counts[chip.value];
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => {
                    setTimeFilter(isActive ? "all" : chip.value);
                    if (!isActive) setDateFilter(null);
                  }}
                  className={`${chipBase} gap-1 ${isActive ? chipActive : chipInactive}`}
                >
                  {chip.label}
                  {count > 0 && (
                    <span className={`text-[10px] ${isActive ? "text-warm-green/70" : "text-muted-foreground/50"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

          </div>
            {/* Clear all filters — red X like Orders page, fixed right */}
            {(timeFilter !== "all" || dateFilter) && (
              <button
                type="button"
                onClick={() => { setTimeFilter("all"); setDateFilter(null); setShowDateCalendar(false); }}
                className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Date Calendar Picker — matches Orders page style */}
          {showDateCalendar && (
            <div ref={dateCalendarRef} className="absolute z-20 left-0 w-72 rounded-xl border bg-card shadow-lg p-4 space-y-3">
              {/* Month navigation */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); } else setPickerMonth(pickerMonth - 1); }}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-foreground">
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][pickerMonth]} {pickerYear}
                </span>
                <button
                  type="button"
                  onClick={() => { if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); } else setPickerMonth(pickerMonth + 1); }}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day headers + calendar grid */}
              <div className="grid grid-cols-7 text-center">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                  <span key={d} className="text-[11px] font-medium text-muted-foreground py-2">{d}</span>
                ))}
                {(() => {
                  const firstDay = new Date(pickerYear, pickerMonth, 1);
                  let startDay = firstDay.getDay() - 1;
                  if (startDay < 0) startDay = 6;
                  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                  const cells: (number | null)[] = [];
                  for (let i = 0; i < startDay; i++) cells.push(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                  const pad = (n: number) => String(n).padStart(2, "0");

                  // Count reminders per day for badges
                  const reminderCounts: Record<string, number> = {};
                  for (const r of reminders) {
                    const d = new Date(r.scheduled_at);
                    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                    reminderCounts[key] = (reminderCounts[key] || 0) + 1;
                  }

                  return cells.map((day, i) => {
                    if (!day) return <span key={`e-${i}`} />;
                    const dateStr = `${pickerYear}-${pad(pickerMonth + 1)}-${pad(day)}`;
                    const isSelected = dateFilter === dateStr;
                    const count = reminderCounts[dateStr] || 0;
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const isToday = dateStr === todayStr;
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          setDateFilter(isSelected ? null : dateStr);
                          setTimeFilter("all");
                          setShowDateCalendar(false);
                        }}
                        className={`relative h-10 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? "bg-warm-green text-white font-semibold"
                            : isToday
                              ? "bg-muted/80 font-semibold text-foreground"
                              : count > 0
                                ? "font-medium text-foreground hover:bg-muted"
                                : "text-muted-foreground/50 hover:bg-muted"
                        }`}
                      >
                        {day}
                        {count > 0 && !isSelected && (
                          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-warm-green text-[9px] font-bold text-white flex items-center justify-center">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => { setDateFilter(null); setShowDateCalendar(false); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
                >
                  Hapus filter tanggal
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {debouncedSearch ? "No matching reminders" : "No reminders"}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Overdue */}
            {overdueGroup.length > 0 && (timeFilter === "all" || timeFilter === "overdue") && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Overdue ({overdueGroup.length})
                </p>
                <div className="rounded-xl border bg-card shadow-sm divide-y">
                  {overdueGroup.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      getCustomerInfo={getCustomerInfo}
                      confirmCancelId={confirmCancelId}
                      onSendWA={handleSendWA}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Today */}
            {todayGroup.length > 0 && (timeFilter === "all" || timeFilter === "today") && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Hari Ini ({todayGroup.length})
                </p>
                <div className="rounded-xl border bg-card shadow-sm divide-y">
                  {todayGroup.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      getCustomerInfo={getCustomerInfo}
                      confirmCancelId={confirmCancelId}
                      onSendWA={handleSendWA}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingGroup.length > 0 && (timeFilter === "all" || timeFilter === "upcoming") && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Upcoming ({upcomingGroup.length})
                </p>
                <div className="rounded-xl border bg-card shadow-sm divide-y">
                  {upcomingGroup.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      getCustomerInfo={getCustomerInfo}
                      confirmCancelId={confirmCancelId}
                      onSendWA={handleSendWA}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </>)}

      <WAPreviewSheet
        open={waPreview.open}
        onClose={() => setWaPreview((prev) => ({ ...prev, open: false }))}
        customerName={waPreview.name}
        customerPhone={waPreview.phone}
        initialMessage={waPreview.message}
        onSent={handleWaSent}
      />
    </div>
  );
}

function ReminderCard({
  reminder,
  getCustomerInfo,
  confirmCancelId,
  onSendWA,
  onCancel,
}: {
  reminder: ReminderWithSource;
  getCustomerInfo: (r: ReminderWithSource) => { number: string; name: string; phone: string | null; amount: number; type: "Order" | "Receipt" };
  confirmCancelId: string | null;
  onSendWA: (r: ReminderWithSource) => void;
  onCancel: (id: string) => void;
}) {
  const info = getCustomerInfo(reminder);
  const { label, isOverdue, isToday } = getRelativeDate(reminder.scheduled_at);

  return (
    <button
      type="button"
      onClick={() => onSendWA(reminder)}
      className="w-full text-left px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{info.name}</p>
            <Send className="w-3 h-3 text-green-600 shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">
            {info.number} · {info.phone || "No HP"}
          </p>
        </div>
        <div className="text-right shrink-0 flex items-start gap-1.5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              RM {info.amount.toLocaleString("en-MY")}
            </p>
            <p className={`text-xs font-medium ${isOverdue ? "text-red-500" : isToday ? "text-amber-600" : "text-muted-foreground"}`}>
              {label}
            </p>
          </div>
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onCancel(reminder.id); }}
            className="mt-0.5 p-1 rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            {confirmCancelId === reminder.id ? (
              <span className="text-red-500 text-[10px] font-medium">Delete?</span>
            ) : (
              <X className="w-3 h-3" />
            )}
          </span>
        </div>
      </div>
    </button>
  );
}
