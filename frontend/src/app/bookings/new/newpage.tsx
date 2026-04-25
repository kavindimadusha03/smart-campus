"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DatePicker from "react-datepicker";

import {
  Loader2,
  Clock,
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ShieldCheck,
  Ban,
  Repeat,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

interface ResourceOption {
  id: number;
  name: string;
  type: string;
  capacity: number | null;
  location: string;
  available_from_date?: string;
  available_to_date?: string;
  available_start_time?: string;
  available_end_time?: string;
  unavailable_days?: number[];
}

interface ScheduleBooking {
  id: number;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  userName: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface AvailabilityWindow {
  id?: number;
  dayOfWeek: string;
  dayOfWeekIndex: number;
  startTime: string;
  endTime: string;
}

interface Suggestion {
  type: "time" | "resource" | "day";
  startTime?: string;
  endTime?: string;
  resourceId?: number;
  resourceName?: string;
  capacity?: number | null;
  suggestedDate?: string;
  dayName?: string;
}

const TIMELINE_START = 6;
const TIMELINE_END = 22;
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

const DAYS_OF_WEEK = [
  { index: 0, name: "Sunday", short: "Sun" },
  { index: 1, name: "Monday", short: "Mon" },
  { index: 2, name: "Tuesday", short: "Tue" },
  { index: 3, name: "Wednesday", short: "Wed" },
  { index: 4, name: "Thursday", short: "Thu" },
  { index: 5, name: "Friday", short: "Fri" },
  { index: 6, name: "Saturday", short: "Sat" },
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const startMinutesA = timeToMinutes(startA);
  const endMinutesA = timeToMinutes(endA);
  const startMinutesB = timeToMinutes(startB);
  const endMinutesB = timeToMinutes(endB);
  
  return startMinutesA < endMinutesB && endMinutesA > startMinutesB;
}

function isWithinWindows(
  start: string,
  end: string,
  windows: AvailabilityWindow[],
): boolean {
  if (windows.length === 0) return true;
  
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  
  return windows.some((w) => {
    const windowStart = timeToMinutes(w.startTime);
    const windowEnd = timeToMinutes(w.endTime);
    return startMinutes >= windowStart && endMinutes <= windowEnd;
  });
}

function isDateAvailable(date: Date, windows: AvailabilityWindow[]): boolean {
  if (windows.length === 0) return true;
  const dayOfWeek = date.getDay();
  return windows.some(w => w.dayOfWeekIndex === dayOfWeek);
}

function findNextAvailableDate(
  fromDate: Date,
  windows: AvailabilityWindow[],
  maxLookupDays: number = 30
): Date | null {
  if (windows.length === 0) return fromDate;
  
  const availableDayIndices = new Set(windows.map(w => w.dayOfWeekIndex));
  
  for (let i = 0; i < maxLookupDays; i++) {
    const checkDate = new Date(fromDate);
    checkDate.setDate(fromDate.getDate() + i);
    if (availableDayIndices.has(checkDate.getDay())) {
      return checkDate;
    }
  }
  return null;
}

function findNextAvailableDates(
  fromDate: Date,
  windows: AvailabilityWindow[],
  count: number = 3
): { date: Date; dayName: string }[] {
  if (windows.length === 0) {
    const dates = [];
    for (let i = 0; i < count; i++) {
      const date = new Date(fromDate);
      date.setDate(fromDate.getDate() + i);
      dates.push({ date, dayName: DAYS_OF_WEEK[date.getDay()].name });
    }
    return dates;
  }
  
  const availableDayIndices = new Set(windows.map(w => w.dayOfWeekIndex));
  const suggestions: { date: Date; dayName: string }[] = [];
  let currentDate = new Date(fromDate);
  let checked = 0;
  const maxCheck = 60;
  
  while (suggestions.length < count && checked < maxCheck) {
    if (availableDayIndices.has(currentDate.getDay())) {
      suggestions.push({
        date: new Date(currentDate),
        dayName: DAYS_OF_WEEK[currentDate.getDay()].name
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
    checked++;
  }
  
  return suggestions;
}

function getNextAvailableDateFromToday(windows: AvailabilityWindow[]): Date | null {
  return findNextAvailableDate(new Date(), windows, 60);
}

function findAvailableSlots(
  bookings: ScheduleBooking[],
  availability: AvailabilityWindow[],
  durationMinutes: number,
  maxSuggestions: number = 3
): TimeSlot[] {
  const dayStart = TIMELINE_START * 60;
  const dayEnd = TIMELINE_END * 60;
  
  const busySlots = bookings.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime)
  })).sort((a, b) => a.start - b.start);
  
  let availableRanges: { start: number; end: number }[] = [];
  if (availability.length > 0) {
    availableRanges = availability.map(w => ({
      start: timeToMinutes(w.startTime),
      end: timeToMinutes(w.endTime)
    }));
  } else {
    availableRanges = [{ start: dayStart, end: dayEnd }];
  }
  
  const suggestions: TimeSlot[] = [];
  
  for (const range of availableRanges) {
    let currentStart = range.start;
    
    while (currentStart + durationMinutes <= range.end && suggestions.length < maxSuggestions) {
      let hasConflict = false;
      for (const busy of busySlots) {
        if (currentStart < busy.end && currentStart + durationMinutes > busy.start) {
          currentStart = busy.end;
          hasConflict = true;
          break;
        }
      }
      
      if (!hasConflict) {
        suggestions.push({
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(currentStart + durationMinutes)
        });
        currentStart += durationMinutes;
      }
    }
  }
  
  return suggestions;
}

function TimelineBar({
  bookings,
  availability,
  userStart,
  userEnd,
}: {
  bookings: ScheduleBooking[];
  availability: AvailabilityWindow[];
  userStart: string;
  userEnd: string;
}) {
  const totalMinutes = TIMELINE_HOURS * 60;

  const getPosition = (time: string) => {
    const mins = timeToMinutes(time) - TIMELINE_START * 60;
    return Math.max(0, Math.min(100, (mins / totalMinutes) * 100));
  };

  const hours = Array.from(
    { length: TIMELINE_HOURS + 1 },
    (_, i) => TIMELINE_START + i,
  );

  const hasUser = userStart && userEnd && userEnd > userStart;
  const userConflict = hasUser && bookings.some((b) => 
    hasOverlap(userStart, userEnd, b.startTime, b.endTime)
  );
  const userOutsideWindow = hasUser && availability.length > 0 && 
    !isWithinWindows(userStart, userEnd, availability);

  return (
    <div className="mt-1">
      <div className="relative h-12 bg-gray-200/60 rounded-lg overflow-hidden border border-border">
        {availability.map((w, i) => {
          const left = getPosition(w.startTime);
          const right = getPosition(w.endTime);
          const width = Math.max(right - left, 0.5);
          return (
            <div
              key={`aw-${i}`}
              title={`Available: ${w.startTime} - ${w.endTime}`}
              className="absolute top-0 bottom-0 bg-green-100/80"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {availability.length === 0 && (
          <div className="absolute inset-0 bg-green-50/60" />
        )}

        {bookings.map((b) => {
          const left = getPosition(b.startTime);
          const right = getPosition(b.endTime);
          const width = Math.max(right - left, 0.5);
          const isApproved = b.status === "APPROVED";
          return (
            <div
              key={b.id}
              title={`${b.startTime} - ${b.endTime}: ${b.purpose} (${b.status})`}
              className={`absolute top-1 bottom-1 rounded ${isApproved ? "bg-red-500/80" : "bg-orange-400/70"} border border-white/20`}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {hasUser && (
          <div
            className={`absolute top-0.5 bottom-0.5 rounded border-2 ${
              userConflict || userOutsideWindow
                ? "border-red-600 bg-red-500/40"
                : "border-blue-600 bg-blue-500/30"
            }`}
            style={{
              left: `${getPosition(userStart)}%`,
              width: `${Math.max(getPosition(userEnd) - getPosition(userStart), 0.5)}%`,
            }}
          />
        )}
      </div>

      <div className="relative h-4 mt-1">
        {hours.map((h) => {
          const pos = ((h - TIMELINE_START) / TIMELINE_HOURS) * 100;
          return (
            <span
              key={h}
              className="absolute text-[9px] text-muted -translate-x-1/2"
              style={{ left: `${pos}%` }}
            >
              {String(h).padStart(2, "0")}:00
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2.5 rounded bg-green-100 border border-green-300" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2.5 rounded bg-red-500/80" />
          Approved
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2.5 rounded bg-orange-400/70" />
          Pending
        </span>
        {hasUser && (
          <span className="flex items-center gap-1">
            <span
              className={`inline-block w-3 h-2.5 rounded border-2 ${
                userConflict || userOutsideWindow
                  ? "border-red-600 bg-red-500/40"
                  : "border-blue-600 bg-blue-500/30"
              }`}
            />
            Your selection
          </span>
        )}
      </div>
    </div>
  );
}

type RecurrenceType = "none" | "weekly" | "monthly_date" | "monthly_weekday";

interface RecurrencePattern {
  type: RecurrenceType;
  interval: number;
  weekDays?: number[];
  endAfter?: number;
  endByDate?: string;
}

function RecurrenceSelector({ value, onChange }: { 
  value: RecurrencePattern; 
  onChange: (pattern: RecurrencePattern) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const weekDays = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
    { label: "Sun", value: 0 },
  ];

  const toggleWeekDay = (day: number) => {
    const current = value.weekDays || [];
    const updated = current.includes(day) 
      ? current.filter(d => d !== day)
      : [...current, day];
    onChange({ ...value, weekDays: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Repeat size={16} className="text-muted" />
          <span className="text-[13px] font-medium">
            {value.type === "none" && "One-time booking"}
            {value.type === "weekly" && `Weekly repeating (every ${value.interval} week${value.interval > 1 ? 's' : ''})`}
            {value.type === "monthly_date" && `Monthly repeating on same date`}
            {value.type === "monthly_weekday" && `Monthly repeating on same weekday`}
          </span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
        <div className="p-3 space-y-3 border-t border-border">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onChange({ type: "none", interval: 1 })}
              className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors ${
                value.type === "none" 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => onChange({ type: "weekly", interval: 1, weekDays: [1] })}
              className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors ${
                value.type === "weekly" 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => onChange({ type: "monthly_date", interval: 1 })}
              className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors ${
                value.type === "monthly_date" 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Monthly (same date)
            </button>
            <button
              type="button"
              onClick={() => onChange({ type: "monthly_weekday", interval: 1 })}
              className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors ${
                value.type === "monthly_weekday" 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Monthly (same weekday)
            </button>
          </div>
          
          {value.type === "weekly" && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-muted">Every</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={value.interval}
                  onChange={(e) => onChange({ ...value, interval: parseInt(e.target.value) || 1 })}
                  className="w-16 h-8 rounded border border-border px-2 text-[12px]"
                />
                <span className="text-[12px] text-muted">week(s)</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {weekDays.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekDay(day.value)}
                    className={`w-10 h-8 text-[12px] rounded transition-colors ${
                      value.weekDays?.includes(day.value)
                        ? "bg-primary text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </>
          )}
          
          {(value.type === "weekly" || value.type === "monthly_date" || value.type === "monthly_weekday") && (
            <div className="space-y-2">
              <label className="text-[12px] font-medium">End after</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-[12px]">
                  <input
                    type="radio"
                    name="endType"
                    checked={!!value.endAfter && !value.endByDate}
                    onChange={() => onChange({ ...value, endAfter: 8, endByDate: undefined })}
                  />
                  {value.endAfter || 8} occurrences
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                  <input
                    type="radio"
                    name="endType"
                    checked={!!value.endByDate}
                    onChange={() => onChange({ ...value, endAfter: undefined, endByDate: "" })}
                  />
                  End by date
                </label>
              </div>
              {value.endByDate !== undefined && (
                <input
                  type="date"
                  value={value.endByDate || ""}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => onChange({ ...value, endByDate: e.target.value, endAfter: undefined })}
                  className="h-8 w-full rounded border border-border px-2 text-[12px]"
                />
              )}
              {value.endAfter && !value.endByDate && (
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={value.endAfter}
                  onChange={(e) => onChange({ ...value, endAfter: parseInt(e.target.value) || 1 })}
                  className="h-8 w-32 rounded border border-border px-2 text-[12px]"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SmartSuggestions({ suggestions, onSelect }: { 
  suggestions: Suggestion[]; 
  onSelect: (suggestion: Suggestion) => void;
}) {
  if (suggestions.length === 0) return null;
  
  const daySuggestions = suggestions.filter(s => s.type === "day");
  const timeSuggestions = suggestions.filter(s => s.type === "time");
  const resourceSuggestions = suggestions.filter(s => s.type === "resource");
  
  if (daySuggestions.length === 0 && timeSuggestions.length === 0 && resourceSuggestions.length === 0) return null;
  
  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-3">
      <div className="flex items-center gap-2 text-blue-800 text-[12px] font-medium">
        <Info size={14} />
        <span>Smart Suggestions</span>
      </div>
      
      {daySuggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-blue-700 font-medium">📅 Available days</p>
          {daySuggestions.map((s, i) => (
            <button
              key={`day-${i}`}
              onClick={() => onSelect(s)}
              className="w-full text-left px-2 py-1.5 rounded bg-white/80 hover:bg-white text-[12px] transition-colors"
            >
              <span className="text-blue-700">
                📅 {s.dayName} ({new Date(s.suggestedDate!).toLocaleDateString()})
              </span>
            </button>
          ))}
        </div>
      )}
      
      {timeSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-blue-700 font-medium">🕐 Alternative times</p>
          {timeSuggestions.map((s, i) => (
            <button
              key={`time-${i}`}
              onClick={() => onSelect(s)}
              className="w-full text-left px-2 py-1.5 rounded bg-white/80 hover:bg-white text-[12px] transition-colors"
            >
              <span className="text-blue-700">
                🕐 {s.startTime} - {s.endTime}
              </span>
            </button>
          ))}
        </div>
      )}
      
      {resourceSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-blue-700 font-medium">🔧 Alternative resources</p>
          {resourceSuggestions.map((s, i) => (
            <button
              key={`resource-${i}`}
              onClick={() => onSelect(s)}
              className="w-full text-left px-2 py-1.5 rounded bg-white/80 hover:bg-white text-[12px] transition-colors"
            >
              <span className="text-green-700">
                🔄 {s.resourceName} (capacity: {s.capacity})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewBookingContent() {
  const router = useRouter();

  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  const [resourceId, setResourceId] = useState("");
  const [bookingDate, setBookingDate] = useState(""); 
  
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const [purpose, setPurpose] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState("");
  
  const [recurrence, setRecurrence] = useState<RecurrencePattern>({ type: "none", interval: 1 });
  const [recurrencePreview, setRecurrencePreview] = useState<Date[]>([]);
  const [showRecurrencePreview, setShowRecurrencePreview] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleBooking[]>([]);
  const [availabilityWindows, setAvailabilityWindows] = useState<AvailabilityWindow[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = String(hour).padStart(2, "0");
        const formattedMinute = String(minute).padStart(2, "0");
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  }, []);

  const availableEndTimes = useMemo(() => {
    if (!startTime) return timeOptions;
    const startIndex = timeOptions.indexOf(startTime);
    return timeOptions.slice(startIndex + 1);
  }, [startTime, timeOptions]);

  const availableDayIndices = useMemo(() => {
    if (availabilityWindows.length === 0) return null;
    return new Set(availabilityWindows.map(w => w.dayOfWeekIndex));
  }, [availabilityWindows]);

  const isSelectedDateAvailable = useMemo(() => {
    if (!bookingDate || availabilityWindows.length === 0) return true;
    const date = new Date(bookingDate);
    return availableDayIndices?.has(date.getDay()) ?? true;
  }, [bookingDate, availabilityWindows, availableDayIndices]);

  const availableDaysDisplay = useMemo(() => {
    if (availabilityWindows.length === 0) return null;
    const days = availabilityWindows
      .map(w => DAYS_OF_WEEK[w.dayOfWeekIndex]?.short ?? w.dayOfWeek?.substring(0, 3) ?? "Unknown")
      .filter((v, i, a) => a.indexOf(v) === i);
    return days.join(", ");
  }, [availabilityWindows]);

  // Load resources
  useEffect(() => {
    apiFetch<ResourceOption[]>("/api/bookings/resources")
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load resources"))
      .finally(() => setLoadingResources(false));
  }, []);

  // Auto-select next available date when resource changes
  useEffect(() => {
    if (!resourceId) return;
    
    if (availabilityWindows.length > 0 && !bookingDate) {
      const nextDate = getNextAvailableDateFromToday(availabilityWindows);
      if (nextDate) {
        setBookingDate(formatDateToYYYYMMDD(nextDate));
        setStartTime("");
        setEndTime("");
      }
    } else if (availabilityWindows.length === 0 && !bookingDate) {
      const todayFormatted = formatDateToYYYYMMDD(new Date());
      setBookingDate(todayFormatted);
    }
  }, [resourceId, availabilityWindows, bookingDate]);

  const fetchScheduleAndAvailability = useCallback(
    async (resId: string, date: string) => {
      if (!resId || !date) {
        setSchedule([]);
        setAvailabilityWindows([]);
        setAvailableSlots([]);
        return;
      }
      setLoadingSchedule(true);
      try {
        const [scheduleData, availData] = await Promise.all([
          apiFetch<ScheduleBooking[]>(
            `/api/bookings/schedule?resourceId=${resId}&date=${date}`,
          ),
          apiFetch<AvailabilityWindow[]>(
            `/api/bookings/availability?resourceId=${resId}`,
          ),
        ]);
        
        setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
        
        // Validate and normalize availability windows
        const normalizedWindows = (Array.isArray(availData) ? availData : [])
          .filter(window => window && typeof window === 'object')
          .map(window => ({
            ...window,
            dayOfWeekIndex: window.dayOfWeekIndex !== undefined && window.dayOfWeekIndex >= 0 && window.dayOfWeekIndex <= 6
              ? window.dayOfWeekIndex
              : DAYS_OF_WEEK.findIndex(day => day.name.toLowerCase() === window.dayOfWeek?.toLowerCase())
          }))
          .filter(window => window.dayOfWeekIndex !== -1); // Remove invalid windows
        
        setAvailabilityWindows(normalizedWindows);
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
        setSchedule([]);
        setAvailabilityWindows([]);
        setAvailableSlots([]);
      } finally {
        setLoadingSchedule(false);
      }
    },
    [],
  );

  // Fetch schedule when resource or date changes
  useEffect(() => {
    fetchScheduleAndAvailability(resourceId, bookingDate);
  }, [resourceId, bookingDate, fetchScheduleAndAvailability]);

  // Generate available 1-hour slots after schedule loads
  useEffect(() => {
    if (!bookingDate) return;
    
    if (availabilityWindows.length > 0 && bookingDate) {
      const dayWindows = availabilityWindows.filter(w => w.dayOfWeekIndex === new Date(bookingDate).getDay());
      const slots = findAvailableSlots(schedule, dayWindows, 60, 6);
      setAvailableSlots(slots);
    } else if (availabilityWindows.length === 0) {
      const slots = findAvailableSlots(schedule, [], 60, 6);
      setAvailableSlots(slots);
    } else {
      setAvailableSlots([]);
    }
  }, [schedule, availabilityWindows, bookingDate]);

  // Check for conflicts
  const conflict = useMemo(() => {
    if (!startTime || !endTime || endTime <= startTime || schedule.length === 0)
      return null;
    return schedule.find((b) =>
      hasOverlap(startTime, endTime, b.startTime, b.endTime),
    ) || null;
  }, [startTime, endTime, schedule]);

  // Check if outside availability window
  const outsideAvailability = useMemo(() => {
    if (!startTime || !endTime || endTime <= startTime) return false;
    if (availabilityWindows.length === 0) return false;
    const selectedDate = new Date(bookingDate);
    const dayWindows = availabilityWindows.filter(w => w.dayOfWeekIndex === selectedDate.getDay());
    if (dayWindows.length === 0) return true;
    return !isWithinWindows(startTime, endTime, dayWindows);
  }, [startTime, endTime, availabilityWindows, bookingDate]);

  const isValidTimeRange = useMemo(() => {
    if (!startTime || !endTime) return false;
    return timeToMinutes(endTime) > timeToMinutes(startTime);
  }, [startTime, endTime]);

  const durationMinutes = useMemo(() => {
    if (!startTime || !endTime || !isValidTimeRange) return null;
    return timeToMinutes(endTime) - timeToMinutes(startTime);
  }, [startTime, endTime, isValidTimeRange]);

  // Generate suggestions for unavailable dates
  useEffect(() => {
    if (resourceId && bookingDate && availabilityWindows.length > 0 && !isSelectedDateAvailable) {
      const fromDate = new Date(bookingDate);
      const nextAvailableDates = findNextAvailableDates(fromDate, availabilityWindows, 3);
      
      const daySuggestions: Suggestion[] = nextAvailableDates.map(item => ({
        type: "day",
        suggestedDate: formatDateToYYYYMMDD(item.date),
        dayName: item.dayName
      }));
      
      setSuggestions(prev => [...prev.filter(s => s.type !== "day"), ...daySuggestions]);
    } else if (suggestions.some(s => s.type === "day")) {
      setSuggestions(prev => prev.filter(s => s.type !== "day"));
    }
  }, [resourceId, bookingDate, availabilityWindows, isSelectedDateAvailable]);

  // Generate time and resource suggestions when there's a conflict
  useEffect(() => {
    if (conflict && startTime && endTime && resourceId && isSelectedDateAvailable && durationMinutes) {
      const selectedDate = new Date(bookingDate);
      const dayWindows = availabilityWindows.filter(w => w.dayOfWeekIndex === selectedDate.getDay());
      
      const timeSuggestionsSlots = findAvailableSlots(schedule, dayWindows, durationMinutes, 3);
      
      const timeSuggestionItems: Suggestion[] = timeSuggestionsSlots.map(slot => ({
        type: "time",
        startTime: slot.startTime,
        endTime: slot.endTime
      }));
      
      const currentResource = resources.find(r => r.id === Number(resourceId));
      const similarResources = resources.filter(r => 
        r.id !== Number(resourceId) && 
        (!currentResource || (r.capacity === currentResource?.capacity && r.type === currentResource?.type))
      ).slice(0, 2);
      
      const resourceSuggestionItems: Suggestion[] = similarResources.map(r => ({
        type: "resource",
        resourceId: r.id,
        resourceName: r.name,
        capacity: r.capacity
      }));
      
      setSuggestions(prev => {
        const nonDaySuggestions = prev.filter(s => s.type !== "day");
        const newSuggestions = [...timeSuggestionItems, ...resourceSuggestionItems, ...nonDaySuggestions];
        return newSuggestions.slice(0, 5);
      });
    } else if (!conflict && suggestions.some(s => s.type === "time" || s.type === "resource")) {
      setSuggestions(prev => prev.filter(s => s.type !== "time" && s.type !== "resource"));
    }
  }, [conflict, startTime, endTime, resourceId, schedule, availabilityWindows, bookingDate, isSelectedDateAvailable, durationMinutes, resources]);

  // Generate recurrence preview
  useEffect(() => {
    if (recurrence.type === "none" || !bookingDate || !startTime) {
      setRecurrencePreview([]);
      return;
    }
    
    const dates: Date[] = [];
    const startDate = new Date(bookingDate);
    const maxOccurrences = recurrence.endAfter || 12;
    const endByDate = recurrence.endByDate ? new Date(recurrence.endByDate) : null;
    
    if (recurrence.type === "weekly" && recurrence.weekDays?.length) {
      let currentDate = new Date(startDate);
      let occurrences = 0;
      let checked = 0;
      const maxCheck = 100;
      
      while (occurrences < maxOccurrences && checked < maxCheck && (!endByDate || currentDate <= endByDate)) {
        if (recurrence.weekDays.includes(currentDate.getDay())) {
          dates.push(new Date(currentDate));
          occurrences++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
        checked++;
      }
    } else if (recurrence.type === "monthly_date") {
      let currentDate = new Date(startDate);
      for (let i = 0; i < maxOccurrences && (!endByDate || currentDate <= endByDate); i++) {
        dates.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
      }
    } else if (recurrence.type === "monthly_weekday") {
      let currentDate = new Date(startDate);
      const weekOfMonth = Math.ceil(currentDate.getDate() / 7);
      const dayOfWeek = currentDate.getDay();
      for (let i = 0; i < maxOccurrences && (!endByDate || currentDate <= endByDate); i++) {
        dates.push(new Date(currentDate));
        if (i < maxOccurrences - 1) {
          currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          let targetDayOfWeek = (dayOfWeek - firstDayOfMonth.getDay() + 7) % 7;
          let targetDate = 1 + targetDayOfWeek + (weekOfMonth - 1) * 7;
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          if (targetDate > lastDayOfMonth) {
            targetDate -= 7;
          }
          currentDate.setDate(targetDate);
        }
      }
    }
    
    setRecurrencePreview(dates);
  }, [recurrence, bookingDate, startTime]);

  const hasBlocker = !!conflict || outsideAvailability || !isValidTimeRange || !isSelectedDateAvailable;

  const realTimeError = useMemo(() => {
    if (!isSelectedDateAvailable) return "This resource is not available on the selected day.";
    if (!startTime || !endTime) return "";
    if (outsideAvailability) return "Selected time is outside the resource's availability hours (green bars shown).";
    if (conflict) return `Conflicts with existing booking: ${conflict?.purpose || 'Unknown purpose'}`;
    if (!isValidTimeRange) return "End time must be after start time.";
    return "";
  }, [isSelectedDateAvailable, outsideAvailability, conflict, isValidTimeRange, startTime, endTime]);

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (suggestion.type === "time" && suggestion.startTime && suggestion.endTime) {
      setStartTime(suggestion.startTime);
      setEndTime(suggestion.endTime);
      setSuggestions(prev => prev.filter(s => s.type !== "time"));
    } else if (suggestion.type === "resource" && suggestion.resourceId) {
      setResourceId(String(suggestion.resourceId));
      setStartTime("");
      setEndTime("");
      setSuggestions(prev => prev.filter(s => s.type !== "resource"));
    } else if (suggestion.type === "day" && suggestion.suggestedDate) {
      setBookingDate(suggestion.suggestedDate);
      setStartTime("");
      setEndTime("");
      setSuggestions(prev => prev.filter(s => s.type !== "day"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resourceId || !bookingDate || !startTime || !endTime || !purpose.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isValidTimeRange) {
      setError("End time must be after start time");
      return;
    }

    if (!isSelectedDateAvailable) {
      setError("This resource is not available on the selected day. Please choose an available day.");
      return;
    }

    const selectedDate = new Date(bookingDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (selectedDate < now) {
      setError("Booking date must be today or in the future");
      return;
    }

    const selectedStartTime = new Date(bookingDate + 'T' + startTime);
    if (selectedStartTime < new Date()) {
      setError("Booking time must be in the future");
      return;
    }

    if (conflict) {
      setError("Your selected time conflicts with an existing booking.");
      return;
    }

    if (outsideAvailability) {
      setError("Your selected time is outside this resource's availability hours.");
      return;
    }

    setSubmitting(true);
    try {
      const requestBody: any = {
        resourceId: Number(resourceId),
        bookingDate,
        startTime,
        endTime,
        purpose: purpose.trim(),
        expectedAttendees: expectedAttendees ? Number(expectedAttendees) : null,
      };
      
      if (recurrence.type !== "none") {
        requestBody.recurrence = recurrence;
      }
      
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      router.push("/bookings/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const showSchedulePanel = resourceId && bookingDate;
  
  const selectedResource = resources.find(r => r.id === Number(resourceId));
  const hasDateRestrictions = selectedResource?.available_from_date || selectedResource?.available_to_date;
  const minDate = selectedResource?.available_from_date ? new Date(selectedResource.available_from_date) : new Date();
  const maxDate = selectedResource?.available_to_date ? new Date(selectedResource.available_to_date) : undefined;

  const durationDisplay = useMemo(() => {
    if (!durationMinutes) return null;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${minutes}m`;
  }, [durationMinutes]);

  return (
    <div className="max-w-3xl mx-auto">
      <style jsx global>{`
        .react-datepicker__day--available {
          background-color: #dcfce7 !important;
          color: #166534 !important;
          border-radius: 50% !important;
          font-weight: 500 !important;
        }
        .react-datepicker__day--available:hover {
          background-color: #bbf7d0 !important;
        }
        .react-datepicker__day--unavailable {
          background-color: #f3f4f6 !important;
          color: #9ca3af !important;
          cursor: not-allowed !important;
          text-decoration: line-through !important;
        }
        .react-datepicker__day--unavailable:hover {
          background-color: #e5e7eb !important;
        }
        .react-datepicker__day--selected {
          background-color: #2563eb !important;
          color: white !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }
      `}</style>

      <PageHeader
        title="New Booking Request"
        subtitle="Reserve a resource for your activity"
        backHref="/bookings/"
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-card-bg border border-border shadow-sm p-6"
      >
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3 text-[13px] text-red-700 flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Resource Selection */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1">
              Resource *
            </label>
            {loadingResources ? (
              <div className="flex items-center gap-2 text-[13px] text-muted py-2">
                <Loader2 size={14} className="animate-spin" />
                Loading resources...
              </div>
            ) : (
              <select
                value={resourceId}
                onChange={(e) => {
                  setResourceId(e.target.value);
                  setStartTime("");
                  setEndTime("");
                  setBookingDate("");
                  setSuggestions([]);
                }}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary"
              >
                <option value="">Select a resource...</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.location}
                    {r.capacity ? ` (capacity: ${r.capacity})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1">
              Date *
            </label>
            
            <DatePicker
              selected={bookingDate ? new Date(bookingDate) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  const formatted = formatDateToYYYYMMDD(date);
                  setBookingDate(formatted);
                  setStartTime("");
                  setEndTime("");
                  
                  if (suggestions.some(s => s.type === "day")) {
                    setSuggestions(prev => prev.filter(s => s.type !== "day"));
                  }
                }
              }}
              dateFormat="MMMM d, yyyy"
              minDate={minDate || new Date()}
              maxDate={maxDate}
              filterDate={(date: Date) => {
                if (hasDateRestrictions) {
                  if (minDate && date < minDate) return false;
                  if (maxDate && date > maxDate) return false;
                }
                if (availabilityWindows.length > 0) {
                  return isDateAvailable(date, availabilityWindows);
                }
                return true;
              }}
              dayClassName={(date: Date) => {
                if (availabilityWindows.length === 0) return "";
                if (isDateAvailable(date, availabilityWindows)) {
                  return "react-datepicker__day--available";
                }
                return "react-datepicker__day--unavailable";
              }}
              placeholderText="Select a date"
              className={`h-10 w-full rounded-lg border px-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 ${
                !isSelectedDateAvailable && bookingDate
                  ? "border-amber-400 bg-amber-50 focus:border-amber-500"
                  : "border-border bg-white focus:border-primary"
              }`}
              calendarClassName="shadow-lg rounded-lg border border-gray-200"
              disabled={!resourceId}
              popperPlacement="bottom-start"
            />
            
            {/* Availability Windows Display - FIXED VERSION */}
            {availabilityWindows.length > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock size={12} className="text-green-700" />
                  <span className="text-[11px] font-semibold text-green-800">Availability Windows</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availabilityWindows.map((window, idx) => {
                    // Safely get day name with fallbacks
                    let dayShort = 'Unknown';
                    if (window.dayOfWeekIndex !== undefined && DAYS_OF_WEEK[window.dayOfWeekIndex]) {
                      dayShort = DAYS_OF_WEEK[window.dayOfWeekIndex].short;
                    } else if (window.dayOfWeek) {
                      dayShort = window.dayOfWeek.substring(0, 3);
                    }
                    
                    return (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        {dayShort}: {window.startTime}-{window.endTime}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            {availableDaysDisplay && availabilityWindows.length > 0 && (
              <p className="text-[11px] text-muted mt-1">
                📅 Available on: {availableDaysDisplay}
              </p>
            )}
            
            {bookingDate && !isSelectedDateAvailable && availabilityWindows.length > 0 && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={11} />
                This resource is not available on {DAYS_OF_WEEK[new Date(bookingDate).getDay()]?.name || 'this day'}
              </p>
            )}
            
            {hasDateRestrictions && (
              <p className="text-[11px] text-muted mt-1">
                Date range: {selectedResource?.available_from_date || "start"} to {selectedResource?.available_to_date || "end"}
              </p>
            )}
          </div>

          {/* Day Suggestions */}
          {!isSelectedDateAvailable && suggestions.length > 0 && suggestions[0]?.type === "day" && (
            <SmartSuggestions suggestions={suggestions} onSelect={handleSuggestionSelect} />
          )}

          {/* Time Selection */}
          {showSchedulePanel && isSelectedDateAvailable && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">
                    From *
                  </label>
                  <select
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setEndTime("");
                      
                      if (suggestions.some(s => s.type === "time")) {
                        setSuggestions(prev => prev.filter(s => s.type !== "time"));
                      }
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary disabled:opacity-50"
                    disabled={!isSelectedDateAvailable}
                    required
                  >
                    <option value="">Select start time</option>
                    {timeOptions.map((time) => {
                      const selectedDate = new Date(bookingDate);
                      const dayWindows = availabilityWindows.filter(w => w.dayOfWeekIndex === selectedDate.getDay());
                      let isAvailable = true;
                      if (dayWindows.length > 0) {
                        const timeMinutes = timeToMinutes(time);
                        isAvailable = dayWindows.some(w => 
                          timeMinutes >= timeToMinutes(w.startTime) && 
                          timeMinutes < timeToMinutes(w.endTime)
                        );
                      }
                      return (
                        <option key={time} value={time} disabled={!isAvailable}>
                          {time} {!isAvailable && "(unavailable)"}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">
                    To *
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary disabled:opacity-50 disabled:bg-gray-100"
                    disabled={!startTime || !isSelectedDateAvailable}
                    required
                  >
                    <option value="">Select end time</option>
                    {availableEndTimes.map((time) => {
                      const selectedDate = new Date(bookingDate);
                      const dayWindows = availabilityWindows.filter(w => w.dayOfWeekIndex === selectedDate.getDay());
                      let isAvailable = true;
                      if (dayWindows.length > 0 && startTime) {
                        const endMinutes = timeToMinutes(time);
                        const startMinutes = timeToMinutes(startTime);
                        isAvailable = dayWindows.some(w => 
                          endMinutes <= timeToMinutes(w.endTime) && 
                          endMinutes > startMinutes
                        );
                      }
                      return (
                        <option key={time} value={time} disabled={!isAvailable}>
                          {time}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {durationDisplay && (
                <div className="text-[12px] text-muted -mt-2">
                  Duration: {durationDisplay}
                </div>
              )}
            </>
          )}

          {/* Recurrence */}
          {showSchedulePanel && isSelectedDateAvailable && (
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Recurrence
              </label>
              <RecurrenceSelector value={recurrence} onChange={setRecurrence} />
              
              {recurrence.type !== "none" && recurrencePreview.length > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecurrencePreview(!showRecurrencePreview)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    {showRecurrencePreview ? "Hide" : "Show"} preview ({recurrencePreview.length} occurrences)
                  </button>
                  {showRecurrencePreview && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-[11px] max-h-32 overflow-y-auto border border-border">
                      {recurrencePreview.map((date, i) => (
                        <div key={i} className="py-0.5">
                          {date.toLocaleDateString()} at {startTime || "selected time"} - {endTime || "end"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Schedule Visual */}
          {showSchedulePanel && isSelectedDateAvailable && (
            <div className="rounded-lg border border-border bg-gray-50/50 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={15} className="text-muted" />
                <h3 className="text-[13px] font-semibold text-foreground">
                  Schedule for{" "}
                  {new Date(bookingDate + "T00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                {loadingSchedule && (
                  <Loader2 size={13} className="animate-spin text-muted" />
                )}
              </div>

              {/* Quick Select Slots */}
              {!loadingSchedule && availableSlots.length > 0 && (
                <>
                  <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-[12px] border bg-emerald-50 border-emerald-200 text-emerald-800">
                    <CheckCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Available 1-hour slots: </span>
                      <span>{availableSlots.length} available</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted uppercase tracking-wide">
                      Quick select (60 min slots)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSlots.slice(0, 6).map((slot, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setStartTime(slot.startTime);
                            setEndTime(slot.endTime);
                            setSuggestions(prev => prev.filter(s => s.type !== "time"));
                          }}
                          className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                            startTime === slot.startTime && endTime === slot.endTime
                              ? "bg-primary text-white border-primary"
                              : "bg-white border-border hover:border-primary hover:bg-primary/5"
                          }`}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!loadingSchedule && availableSlots.length === 0 && availabilityWindows.length > 0 && (
                <div className="flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  <Ban size={14} />
                  No 60-minute slots available on this day
                </div>
              )}

              {/* Timeline Bar */}
              <TimelineBar
                bookings={schedule}
                availability={availabilityWindows.filter(w => w.dayOfWeekIndex === new Date(bookingDate).getDay())}
                userStart={startTime}
                userEnd={endTime}
              />

              {/* Existing Bookings List */}
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted uppercase tracking-wide">
                  Existing Bookings ({schedule.length})
                </p>
                {schedule.length === 0 ? (
                  <div className="flex items-center gap-2 text-[12px] text-muted bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <CalendarDays size={14} className="opacity-50" />
                    No bookings found
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {schedule.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 rounded-lg bg-white border border-border px-3 py-2 text-[12px]">
                        <Clock size={13} className="text-muted shrink-0" />
                        <span className="font-semibold text-foreground whitespace-nowrap">
                          {b.startTime} - {b.endTime}
                        </span>
                        <StatusBadge status={b.status} />
                        <span className="text-muted truncate flex-1">
                          {b.purpose}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {realTimeError && startTime && endTime && (
            <div className={`rounded-lg p-3 flex items-start gap-2 ${
              outsideAvailability || !isSelectedDateAvailable
                ? "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200"
            }`} >
              <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${
                outsideAvailability || !isSelectedDateAvailable ? "text-amber-600" : "text-red-600"
              }`} />
              <p className={`text-[12px] ${
                outsideAvailability || !isSelectedDateAvailable ? "text-amber-700" : "text-red-700"
              }`} >
                {realTimeError}
              </p>
            </div>
          )}

          {/* Smart Suggestions */}
          {conflict && suggestions.length > 0 && isSelectedDateAvailable && (
            <SmartSuggestions suggestions={suggestions.filter(s => s.type === "time" || s.type === "resource")} onSelect={handleSuggestionSelect} />
          )}

          {/* Purpose */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1">
              Purpose *
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe the purpose of your booking..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
              required
            />
          </div>

          {/* Expected Attendees */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1">
              Expected Attendees
            </label>
            <input
              type="number"
              min="1"
              value={expectedAttendees}
              onChange={(e) => setExpectedAttendees(e.target.value)}
              placeholder="Number of attendees"
              className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
          <button
            type="button"
            onClick={() => router.push("/bookings/")}
            className="rounded-lg border border-border px-5 py-2.5 text-[13px] font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || hasBlocker || !startTime || !endTime || !purpose.trim()}
            className="rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {recurrence.type !== "none" ? "Submit Recurring Request" : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <MainLayout>
      <NewBookingContent />
    </MainLayout>
  );
}