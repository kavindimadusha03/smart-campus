"use client";

import StatusBadge from "@/components/ui/StatusBadge";
import {
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

export interface BookingTableItem {
  id: number;
  resourceId?: number;
  resourceName: string;
  resourceLocation: string;
  userName?: string;
  userEmail?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
}

interface BookingTableProps {
  bookings: BookingTableItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (booking: BookingTableItem) => void;
  onCancel: (booking: BookingTableItem) => void;
  onApprove?: (booking: BookingTableItem) => void;
  onReject?: (booking: BookingTableItem) => void;
  showUser?: boolean;
  showActions?: boolean;
}

export default function BookingTable({
  bookings,
  loading,
  page,
  totalPages,
  onPageChange,
  onView,
  onCancel,
  onApprove,
  onReject,
  showUser = false,
  showActions = true,
}: BookingTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-card-bg border border-border p-10 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-primary" />
        <span className="ml-2 text-[13px] text-muted">Loading bookings...</span>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl bg-card-bg border border-border p-10 text-center text-[13px] text-muted">
        No bookings found.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card-bg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-gray-50/60">
              <th className="px-4 py-3 font-semibold text-muted">Resource</th>
              {showUser && <th className="px-4 py-3 font-semibold text-muted">Requester</th>}
              <th className="px-4 py-3 font-semibold text-muted">Date</th>
              <th className="px-4 py-3 font-semibold text-muted">Time</th>
              <th className="px-4 py-3 font-semibold text-muted">Purpose</th>
              <th className="px-4 py-3 font-semibold text-muted">Status</th>
              {showActions && <th className="px-4 py-3 font-semibold text-muted text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50/40 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{b.resourceName}</p>
                  <p className="text-[11px] text-muted">{b.resourceLocation}</p>
                </td>
                {showUser && (
                  <td className="px-4 py-3">
                    <p className="text-foreground">{b.userName || "—"}</p>
                    <p className="text-[11px] text-muted">{b.userEmail || ""}</p>
                  </td>
                )}
                <td className="px-4 py-3 text-muted whitespace-nowrap">
                  {new Date(b.bookingDate + "T00:00").toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-muted whitespace-nowrap">
                  {b.startTime} - {b.endTime}
                </td>
                <td className="px-4 py-3">
                  <p className="text-foreground truncate max-w-[200px]">{b.purpose}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onView(b)}
                        className="rounded p-1.5 text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      {(b.status === "PENDING" || b.status === "APPROVED") && (
                        <button
                          onClick={() => onCancel(b)}
                          className="rounded p-1.5 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Cancel"
                        >
                          <Ban size={15} />
                        </button>
                      )}
                      {b.status === "PENDING" && onApprove && (
                        <button
                          onClick={() => onApprove(b)}
                          className="rounded p-1.5 text-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {b.status === "PENDING" && onReject && (
                        <button
                          onClick={() => onReject(b)}
                          className="rounded p-1.5 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Reject"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gray-50/60">
          <p className="text-[12px] text-muted">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="rounded-lg border border-border bg-white p-1.5 text-muted hover:text-foreground hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-border bg-white p-1.5 text-muted hover:text-foreground hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

