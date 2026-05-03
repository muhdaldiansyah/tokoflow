"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Download, Loader2, Sparkles, Users } from "lucide-react";
import { DailyRecap } from "@/features/recap/components/DailyRecap";
import { MonthlyReport } from "@/features/recap/components/MonthlyReport";
import { VisitorAnalytics } from "@/features/recap/components/VisitorAnalytics";
import { getOrderCountsByMonth } from "@/features/orders/services/order.service";
import { getProfile } from "@/features/receipts/services/receipt.service";

const TABS = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
] as const;

type Tab = (typeof TABS)[number]["value"];

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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

export default function RecapPage() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<Tab>("daily");

  // Daily date state
  const [selectedDate, setSelectedDate] = useState(now);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(now.getMonth());
  const [pickerYear, setPickerYear] = useState(now.getFullYear());

  // Monthly date state
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthPickerYear, setMonthPickerYear] = useState(now.getFullYear());

  // Export trigger — child components listen for this
  const [exportTrigger, setExportTrigger] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const [calendarCounts, setCalendarCounts] = useState<Record<string, number>>({});
  const [viewsToday, setViewsToday] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Fetch visitor counter
  useEffect(() => {
    getProfile().then(p => {
      if (p) {
        const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
        setViewsToday(p.views_today_date === todayStr ? (p.views_today || 0) : 0);
        setTotalViews(p.total_views || 0);
      }
    });
  }, []);

  // Fetch order counts for the visible calendar month
  useEffect(() => {
    if (showDatePicker) {
      getOrderCountsByMonth(pickerYear, pickerMonth + 1).then(setCalendarCounts);
    }
  }, [showDatePicker, pickerMonth, pickerYear]);

  // Close pickers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
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

  const monthLabel = `${MONTH_NAMES_FULL[month - 1]} ${year}`;

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header: Title + Date Picker + Download */}
      <div className="flex items-center justify-between min-h-9">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Recap</h1>
          <p className="text-xs text-muted-foreground">Sales summary and store performance</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date/Month Picker */}
          {activeTab === "daily" ? (<>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d);
              }}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => {
                  setPickerMonth(selectedDate.getMonth());
                  setPickerYear(selectedDate.getFullYear());
                  setShowDatePicker(!showDatePicker);
                  setShowMonthPicker(false);
                }}
                className="flex items-center gap-1 h-9 px-3 text-xs font-medium rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
              >
                {dateLabel}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {showDatePicker && (() => {
                const today = new Date();
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
                        disabled={pickerYear === today.getFullYear() && pickerMonth >= today.getMonth()}
                        className="p-1.5 hover:bg-muted rounded-lg disabled:opacity-30 transition-colors"
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
                        const isFuture = d > today;
                        const isSelected = d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                        const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                        const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const count = calendarCounts[dateStr] || 0;
                        return (
                          <button
                            key={day}
                            disabled={isFuture}
                            onClick={() => { setSelectedDate(new Date(pickerYear, pickerMonth, day, 12)); setShowDatePicker(false); }}
                            className={`relative h-8 text-sm rounded-lg transition-colors ${
                              isSelected ? "bg-primary text-primary-foreground" :
                              isToday ? "bg-muted font-semibold text-foreground" :
                              count > 0 ? "hover:bg-muted text-foreground" :
                              "text-muted-foreground/40"
                            } ${isFuture ? "opacity-30 cursor-not-allowed" : ""}`}
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
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                if (d <= new Date()) setSelectedDate(d);
              }}
              disabled={getDateString(selectedDate) === getDateString(new Date())}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </>) : (<>
            <button
              onClick={() => {
                if (month === 1) { setMonth(12); setYear(year - 1); }
                else setMonth(month - 1);
              }}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="relative" ref={monthPickerRef}>
              <button
                onClick={() => {
                  setMonthPickerYear(year);
                  setShowMonthPicker(!showMonthPicker);
                  setShowDatePicker(false);
                }}
                className="flex items-center gap-1 h-9 px-3 text-xs font-medium rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
              >
                {monthLabel}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {showMonthPicker && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-card border rounded-xl shadow-lg p-3 w-64">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setMonthPickerYear(monthPickerYear - 1)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <span className="font-semibold text-sm text-foreground">{monthPickerYear}</span>
                    <button
                      onClick={() => setMonthPickerYear(monthPickerYear + 1)}
                      disabled={monthPickerYear >= now.getFullYear()}
                      className="p-1.5 hover:bg-muted rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTH_NAMES_FULL.map((name, i) => {
                      const m = i + 1;
                      const isFuture = monthPickerYear > now.getFullYear() || (monthPickerYear === now.getFullYear() && m > now.getMonth() + 1);
                      const isSelected = monthPickerYear === year && m === month;
                      return (
                        <button
                          key={name}
                          disabled={isFuture}
                          onClick={() => { setMonth(m); setYear(monthPickerYear); setShowMonthPicker(false); }}
                          className={`h-9 text-sm rounded-lg transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"} ${isFuture ? "opacity-30 cursor-not-allowed" : ""}`}
                        >
                          {name.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (month === 12) { setMonth(1); setYear(year + 1); }
                else setMonth(month + 1);
              }}
              disabled={year === now.getFullYear() && month >= now.getMonth() + 1}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </>)}

          {/* AI Analysis */}
          <button
            onClick={() => setShowAI(true)}
            disabled={!hasData}
            className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-lg bg-card border border-border shadow-sm hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Analysis</span>
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

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setShowDatePicker(false);
              setShowMonthPicker(false);
            }}
            className={`flex-1 h-10 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "daily" ? (
        <DailyRecap
          dateStr={getDateString(selectedDate)}
          selectedDate={selectedDate}
          exportTrigger={exportTrigger}
          onExportingChange={setIsExporting}
          onHasDataChange={setHasData}
          showAI={showAI}
          onCloseAI={() => setShowAI(false)}
        />
      ) : (
        <MonthlyReport
          month={month}
          year={year}
          exportTrigger={exportTrigger}
          onExportingChange={setIsExporting}
          onHasDataChange={setHasData}
          showAI={showAI}
          onCloseAI={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
