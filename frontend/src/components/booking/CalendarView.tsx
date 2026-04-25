"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

interface CalendarBooking {
  id: number;
  resourceId?: number;
  resourceName: string;
  resourceType?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
}

interface CalendarViewProps {
  bookings: CalendarBooking[];
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  LECTURE_HALL: "bg-blue-500",
  LAB: "bg-emerald-500",
  MEETING_ROOM: "bg-violet-500",
  PROJECTOR: "bg-amber-500",
  CAMERA: "bg-rose-500",
  OTHER_EQUIPMENT: "bg-gray-500",
};

export default function CalendarView({ bookings, onSelectDate, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { days, monthLabel, yearLabel } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const daysArray: { date: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month filler
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      daysArray.push({
        date: d,
        dateStr: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      daysArray.push({
        date: d,
        dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: true,
      });
    }

    // Next month filler
    const remaining = 42 - daysArray.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      daysArray.push({
        date: d,
        dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    return {
      days: daysArray,
      monthLabel: currentMonth.toLocaleString("en-US", { month: "long" }),
      yearLabel: currentMonth.getFullYear(),
    };
  }, [currentMonth]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, CalendarBooking[]> = {};
    for (const b of bookings) {
      if (!map[b.bookingDate]) map[b.bookingDate] = [];
      map[b.bookingDate].push(b);
    }
    return map;
  }, [bookings]);

  const selectedBookings = selectedDate ? bookingsByDate[selectedDate] || [] : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-foreground">
          {monthLabel} {yearLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="rounded-lg border border-border bg-white p-1.5 text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="rounded-lg border border-border bg-white p-1.5 text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl bg-card-bg border border-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-gray-50/60">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-muted uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayBookings = bookingsByDate[day.dateStr] || [];
            const isSelected = selectedDate === day.dateStr;
            const isToday = day.dateStr === new Date().toISOString().split("T")[0];

            return (
              <button
                key={day.dateStr}
                onClick={() => onSelectDate(day.dateStr)}
                className={`min-h-[72px] px-2 py-1.5 text-left border-b border-r border-border transition-colors ${
                  day.isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50/40 text-muted"
                } ${isSelected ? "ring-1 ring-inset ring-primary bg-blue-50/50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[12px] font-medium ${
                      isToday
                        ? "h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center"
                        : day.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {day.date}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {dayBookings.slice(0, 4).map((b, i) => (
                    <span
                      key={i}
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        TYPE_COLORS[b.resourceType || "OTHER_EQUIPMENT"] || "bg-gray-400"
                      }`}
                    />
                  ))}
                  {dayBookings.length > 4 && (
                    <span className="text-[9px] text-muted leading-none">+</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Bookings */}
      {selectedDate && (
        <div className="rounded-xl bg-card-bg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-muted" />
            <h4 className="text-[14px] font-semibold text-foreground">
              {new Date(selectedDate + "T00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h4>
            <span className="text-[12px] text-muted">({selectedBookings.length} bookings)</span>
          </div>
          {selectedBookings.length === 0 ? (
            <p className="text-[13px] text-muted">No bookings on this day.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {b.resourceName}
                    </p>
                    <p className="text-[11px] text-muted">
                      {b.startTime} - {b.endTime} &bull; {b.purpose}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

