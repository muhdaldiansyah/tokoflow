"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Download, Loader2, Send } from "lucide-react";
import { ProductionList } from "@/features/recap/components/ProductionList";
import { getDeliveryCountsByMonth } from "@/features/orders/services/order.service";

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function getDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function PrepPage() {
  const now = new Date();
  // Default to tomorrow for forward-looking prep
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(tomorrow.getMonth());
  const [pickerYear, setPickerYear] = useState(tomorrow.getFullYear());

  const [exportTrigger, setExportTrigger] = useState(0);
  const [waTrigger, setWaTrigger] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [hasData, setHasData] = useState(false);

  const [calendarCounts, setCalendarCounts] = useState<Record<string, number>>({});
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Fetch delivery counts for the visible calendar month
  useEffect(() => {
    if (showDatePicker) {
      getDeliveryCountsByMonth(pickerYear, pickerMonth + 1).then(setCalendarCounts);
    }
  }, [showDatePicker, pickerMonth, pickerYear]);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const dateLabel = selectedDate.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function goDay(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between min-h-9">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Persiapan</h1>
          <p className="text-xs text-muted-foreground">Rangkuman item yang perlu disiapkan per tanggal kirim</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Day navigation */}
          <button
            onClick={() => goDay(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Date Picker */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => {
                setPickerMonth(selectedDate.getMonth());
                setPickerYear(selectedDate.getFullYear());
                setShowDatePicker(!showDatePicker);
              }}
              className="flex items-center gap-1 h-9 px-3 text-xs font-medium rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
            >
              {dateLabel}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {showDatePicker && (() => {
              const calDays = getCalendarDays(pickerYear, pickerMonth);
              return (
                <div className="absolute right-0 top-full mt-2 z-50 bg-card border rounded-xl shadow-lg p-3 w-72">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); }
                        else setPickerMonth(pickerMonth - 1);
                      }}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <span className="font-semibold text-sm text-foreground">
                      {MONTH_NAMES_SHORT[pickerMonth]} {pickerYear}
                    </span>
                    <button
                      onClick={() => {
                        if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); }
                        else setPickerMonth(pickerMonth + 1);
                      }}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                    {DAY_LABELS.map((d) => (
                      <span key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {calDays.map((day, i) => {
                      if (day === null) return <span key={`empty-${i}`} />;
                      const d = new Date(pickerYear, pickerMonth, day);
                      const isSelected = d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                      const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const count = calendarCounts[dateStr] || 0;
                      return (
                        <button
                          key={day}
                          onClick={() => { setSelectedDate(new Date(pickerYear, pickerMonth, day, 12)); setShowDatePicker(false); }}
                          className={`relative h-8 text-sm rounded-lg transition-colors ${
                            isSelected ? "bg-primary text-primary-foreground" :
                            isToday ? "bg-muted font-semibold text-foreground" :
                            count > 0 ? "hover:bg-muted text-foreground" :
                            "text-muted-foreground/40"
                          }`}
                        >
                          {day}
                          {count > 0 && !isSelected && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[9px] font-bold rounded-full bg-warm-green text-white">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          <button
            onClick={() => goDay(1)}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Kirim ke WA */}
          <button
            onClick={() => setWaTrigger((t) => t + 1)}
            disabled={!hasData}
            className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-lg bg-card border border-border shadow-sm hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kirim WA</span>
          </button>

          {/* Download */}
          <button
            onClick={() => setExportTrigger((t) => t + 1)}
            disabled={isExporting || !hasData}
            className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-lg bg-card border border-border shadow-sm hover:bg-muted disabled:opacity-30 transition-colors"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <ProductionList
        dateStr={getDateString(selectedDate)}
        selectedDate={selectedDate}
        exportTrigger={exportTrigger}
        waTrigger={waTrigger}
        onExportingChange={setIsExporting}
        onHasDataChange={setHasData}
      />
    </div>
  );
}
