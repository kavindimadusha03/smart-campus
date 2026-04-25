"use client";

import StatusBadge from "@/components/ui/StatusBadge";
import {
  Calendar,
  Clock,
  Building2,
  Eye,
  Ban,
  ChevronRight,
} from "lucide-react";

export interface BookingItem {
  id: number;
  resourceId?: number;
  resourceName: string;
  resourceLocation: string;
  resourceType?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
}

interface BookingCardProps {
  booking: BookingItem;
  onView: (booking: BookingItem) => void;
  onCancel: (booking: BookingItem) => void;
  showCancel?: boolean;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function BookingCard({
  booking,
  onView,
  onCancel,
  showCancel = true,
}: BookingCardProps) {
  const canCancel = booking.status === "PENDING" || booking.status === "APPROVED";

  return (
    <div className="rounded-xl bg-card-bg border border-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[14px] font-semibold text-foreground truncate">
              {booking.resourceName}
            </h4>
            <StatusBadge status={booking.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDateLabel(booking.bookingDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {booking.startTime} - {booking.endTime}
            </span>
            <span className="flex items-center gap-1">
              <Building2 size={12} />
              {booking.resourceLocation}
            </span>
          </div>
          <p className="mt-2 text-[13px] text-foreground line-clamp-2">{booking.purpose}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 justify-end">
        <button
          onClick={() => onView(booking)}
          className="flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-gray-50 transition-colors"
        >
          <Eye size={13} />
          View
        </button>
        {showCancel && canCancel && (
          <button
            onClick={() => onCancel(booking)}
            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            <Ban size={13} />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

