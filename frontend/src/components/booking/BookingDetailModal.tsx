"use client";

import StatusBadge from "@/components/ui/StatusBadge";
import {
  X,
  Calendar,
  Clock,
  Building2,
  User,
  Users,
  FileText,
} from "lucide-react";

interface Booking {
  id: number;
  resourceName: string;
  resourceLocation: string;
  resourceType?: string;
  userName?: string;
  userEmail?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees?: number | null;
  status: string;
  reviewerName?: string | null;
  reviewReason?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
}

interface BookingDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-border shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-[15px] font-semibold text-foreground">Booking Details</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-muted" />
              <span className="text-[14px] font-semibold text-foreground">
                {booking.resourceName}
              </span>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="flex items-center gap-2 text-muted">
              <Calendar size={14} />
              {formatDateLabel(booking.bookingDate)}
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Clock size={14} />
              {booking.startTime} - {booking.endTime}
            </div>
            {booking.resourceLocation && (
              <div className="flex items-center gap-2 text-muted col-span-2">
                <Building2 size={14} />
                {booking.resourceLocation}
              </div>
            )}
            {booking.userName && (
              <div className="flex items-center gap-2 text-muted col-span-2">
                <User size={14} />
                {booking.userName} {booking.userEmail ? `(${booking.userEmail})` : ""}
              </div>
            )}
            {booking.expectedAttendees ? (
              <div className="flex items-center gap-2 text-muted col-span-2">
                <Users size={14} />
                {booking.expectedAttendees} expected attendees
              </div>
            ) : null}
          </div>

          <div className="rounded-lg bg-gray-50 border border-border p-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-muted mb-1">
              <FileText size={14} />
              Purpose
            </div>
            <p className="text-[13px] text-foreground whitespace-pre-wrap">
              {booking.purpose}
            </p>
          </div>

          {booking.reviewReason && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3">
              <p className="text-[12px] font-medium text-red-700 mb-0.5">Review Reason</p>
              <p className="text-[13px] text-red-800">{booking.reviewReason}</p>
            </div>
          )}

          {booking.reviewerName && (
            <p className="text-[11px] text-muted">
              Reviewed by {booking.reviewerName}
              {booking.reviewedAt
                ? " on " + new Date(booking.reviewedAt).toLocaleDateString()
                : ""}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-white px-4 py-2 text-[13px] font-medium text-foreground hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

