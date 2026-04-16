"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  User,
  Loader2,
} from "lucide-react";

interface BookingDetail {
  id: number;
  resourceId: number;
  resourceName: string;
  resourceType: string;
  resourceLocation: string;
  userId: number;
  userName: string;
  userEmail: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees: number | null;
  status: string;
  reviewedBy: number | null;
  reviewerName: string | null;
  reviewReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export default function BookingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const canReview = user?.role === "MANAGER" || user?.role === "ADMIN";
  const isOwner = booking?.userId === user?.id;

  const fetchBooking = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<BookingDetail>(`/api/bookings/${id}`);
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchBooking();
  }, [id, fetchBooking]);

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (status === "REJECTED" && !reviewReason.trim()) {
      setErrorModal("Please provide a reason for rejection");
      return;
    }
    setActionLoading(true);
    try {
      await apiFetch(`/api/bookings/${id}/review`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          reviewReason: reviewReason.trim() || null,
        }),
      });
      await fetchBooking();
      setReviewReason("");
    } catch {
      setErrorModal(`Failed to ${status.toLowerCase()} booking`);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCancel = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/bookings/${id}/cancel`, { method: "PUT" });
      setShowCancelModal(false);
      await fetchBooking();
    } catch {
      setShowCancelModal(false);
      setErrorModal("Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-[14px] text-muted">
            Loading booking...
          </span>
        </div>
      </MainLayout>
    );
  }

  if (error || !booking) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <PageHeader title="Booking Not Found" backHref="/bookings/" />
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-[14px] text-red-700">
              {error || "Booking not found"}
            </p>
            <button
              type="button"
              onClick={() => router.push("/bookings/")}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={`Booking #${booking.id}`}
          backHref="/bookings/"
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.status} />
            </div>
          }
        />

        <div className="space-y-6">
          <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
            <h2 className="text-[15px] font-semibold text-foreground mb-4">
              Booking Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">
                    Resource
                  </p>
                  <p className="text-[14px] font-medium text-foreground">
                    {booking.resourceName}
                  </p>
                  <span className="mt-1 inline-block">
                    <StatusBadge status={booking.resourceType} />
                  </span>
                </div>
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">
                    Location
                  </p>
                  <p className="text-[14px] text-foreground flex items-center gap-2">
                    <MapPin size={14} className="text-muted" />
                    {booking.resourceLocation}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">
                    Date
                  </p>
                  <p className="text-[14px] text-foreground flex items-center gap-2">
                    <Calendar size={14} className="text-muted" />
                    {booking.bookingDate}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">
                    Time
                  </p>
                  <p className="text-[14px] text-foreground flex items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    {booking.startTime} - {booking.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">
                    Expected Attendees
                  </p>
                  <p className="text-[14px] text-foreground flex items-center gap-2">
                    <Users size={14} className="text-muted" />
                    {booking.expectedAttendees ?? "—"}{" "}
                    {booking.expectedAttendees ? "people" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">
                    Requested By
                  </p>
                  <p className="text-[14px] text-foreground flex items-center gap-2">
                    <User size={14} className="text-muted" />
                    {booking.userName}
                  </p>
                  <p className="text-[12px] text-muted ml-[22px]">
                    {booking.userEmail}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-[12px] text-muted uppercase tracking-wide mb-1">
                  Purpose
                </p>
                <p className="text-[14px] text-foreground flex items-start gap-2">
                  <FileText
                    size={14}
                    className="text-muted mt-0.5 shrink-0"
                  />
                  {booking.purpose}
                </p>
              </div>
            </div>
          </div>

          {booking.reviewerName && (
            <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                Review Information
              </h2>
              <div className="space-y-2 text-[14px]">
                <p>
                  <span className="text-muted">Reviewed by:</span>{" "}
                  {booking.reviewerName}
                </p>
                {booking.reviewReason && (
                  <p>
                    <span className="text-muted">Reason:</span>{" "}
                    {booking.reviewReason}
                  </p>
                )}
                {booking.reviewedAt && (
                  <p>
                    <span className="text-muted">Reviewed at:</span>{" "}
                    {new Date(booking.reviewedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {canReview && booking.status === "PENDING" && (
            <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                Review Booking
              </h2>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-foreground mb-1">
                  Reason (required for rejection)
                </label>
                <textarea
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Provide a reason..."
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReview("APPROVED")}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReview("REJECTED")}
                  className="flex items-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {isOwner &&
            (booking.status === "PENDING" ||
              booking.status === "APPROVED") && (
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowCancelModal(true)}
                  className="rounded-lg border border-red-200 px-5 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              </div>
            )}
        </div>

        <ConfirmModal
          open={showCancelModal}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking?"
          confirmLabel="Cancel Booking"
          variant="danger"
          loading={actionLoading}
          onConfirm={confirmCancel}
          onCancel={() => setShowCancelModal(false)}
        />
        <ConfirmModal
          open={errorModal !== null}
          title="Error"
          message={errorModal || ""}
          confirmLabel="OK"
          cancelLabel={null}
          variant="warning"
          onConfirm={() => setErrorModal(null)}
          onCancel={() => setErrorModal(null)}
        />
      </div>
    </MainLayout>
  );
}
