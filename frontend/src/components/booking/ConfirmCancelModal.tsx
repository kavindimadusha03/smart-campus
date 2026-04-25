"use client";

import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmCancelModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmCancelModal({
  open,
  title = "Cancel Booking",
  message = "Are you sure you want to cancel this booking? This action cannot be undone.",
  confirmLabel = "Cancel Booking",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmCancelModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white border border-border shadow-lg overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
              <p className="text-[13px] text-muted mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border bg-white px-4 py-2 text-[13px] font-medium text-foreground hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Keep
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-danger px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

