"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  MapPin,
  Users,
  Clock,
  Pencil,
  Trash2,
  Power,
  Loader2,
  Star,
  CalendarCheck,
  Check,
  X,
  CalendarDays
} from "lucide-react";
import RatingStars from "@/components/ui/RatingStars";

interface AvailabilityWindow {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  capacity: number | null;
  location: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  availabilityWindows: AvailabilityWindow[];
  averageRating: number;
  bookingCountLastMonth: number;
}

export default function FacilityDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const canEdit = user?.role === "MANAGER" || user?.role === "ADMIN";
  const canDelete = user?.role === "ADMIN";
  const canChangeStatus =
    user?.role === "TECHNICIAN" ||
    user?.role === "MANAGER" ||
    user?.role === "ADMIN";
  
  const canRate = user?.role === "USER";

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Rating States
  const [showRateModal, setShowRateModal] = useState(false);
  const [pendingRating, setPendingRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Resource>(`/api/resources/${params.id}`);
        setResource(data);
      } catch {
        setError("Failed to load resource.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  const handleRateSubmit = async () => {
    if (!resource || pendingRating === 0) return;
    setSubmittingRating(true);
    try {
      await apiFetch(`/api/resources/${resource.id}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating: pendingRating }),
      });
      
      const updated = await apiFetch<Resource>(`/api/resources/${resource.id}`);
      setResource(updated);
      setShowRateModal(false);
      setPendingRating(0);
    } catch (err) {
      setErrorModal("Failed to submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!resource) return;
    const newStatus = resource.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
    setStatusLoading(true);
    try {
      const updated = await apiFetch<Resource>(
        `/api/resources/${resource.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        },
      );
      setResource(updated);
    } catch {
      setErrorModal("Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!resource) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/api/resources/${resource.id}`, { method: "DELETE" });
      router.push("/facilities/");
    } catch {
      setShowDeleteModal(false);
      setErrorModal("Failed to delete resource.");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-[14px] text-muted">Loading resource...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !resource) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <PageHeader title="Resource Not Found" backHref="/facilities/" />
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-[14px] text-red-600">{error || "Resource not found."}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={resource.name}
          backHref="/facilities/"
          actions={
            <div className="flex items-center gap-2">
              {canChangeStatus && (
                <button
                  type="button"
                  disabled={statusLoading}
                  onClick={handleStatusToggle}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Power size={14} />
                  {statusLoading ? "Updating..." : resource.status === "ACTIVE" ? "Mark Out of Service" : "Mark Active"}
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => router.push(`/facilities/${resource.id}/edit/`)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}
            </div>
          }
        />

        <div className="space-y-6">
          {resource.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-border shadow-sm">
              <img src={resource.imageUrl} alt={resource.name} className="w-full h-64 object-cover" />
            </div>
          )}

          {/* Details Card */}
          <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={resource.status} />
              <StatusBadge status={resource.type} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">Location</p>
                  <p className="text-[14px] text-foreground flex items-center gap-2">
                    <MapPin size={14} className="text-muted" />
                    {resource.location}
                  </p>
                </div>
                {resource.capacity && (
                  <div>
                    <p className="text-[12px] text-muted uppercase tracking-wide mb-1">Capacity</p>
                    <p className="text-[14px] text-foreground flex items-center gap-2">
                      <Users size={14} className="text-muted" />
                      {resource.capacity} people
                    </p>
                  </div>
                )}
                <div>
                   <p className="text-[12px] text-muted uppercase tracking-wide mb-1">Popularity</p>
                   <p className="text-[14px] text-foreground flex items-center gap-2 font-medium">
                     <CalendarCheck size={14} className="text-primary" />
                     {resource.bookingCountLastMonth || 0} bookings (last 30 days)
                   </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">Created By</p>
                  <p className="text-[14px] text-foreground">{resource.createdByName}</p>
                </div>
                <div>
                  <p className="text-[12px] text-muted uppercase tracking-wide mb-1">Added On</p>
                  <p className="text-[14px] text-foreground">{new Date(resource.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Display Section */}
          <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground mb-1">Ratings & Reviews</h2>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={18} 
                        fill={star <= Math.round(resource.averageRating || 0) ? "currentColor" : "none"} 
                        className={star <= Math.round(resource.averageRating || 0) ? "text-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {(resource.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-[13px] text-muted">out of 5</span>
                </div>
              </div>

              {canRate && (
                <button
                  onClick={() => setShowRateModal(true)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary text-primary px-5 py-2.5 text-[14px] font-semibold hover:bg-primary/5 transition-all shadow-sm active:scale-95"
                >
                  <Star size={16} />
                  Rate this Facility
                </button>
              )}
            </div>
          </div>

          {/* Availability Windows Card */}
          <div className="rounded-xl bg-card-bg border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-gray-50/50">
              <Clock size={18} className="text-primary" />
              <h2 className="text-[15px] font-bold text-foreground">Availability Windows</h2>
            </div>
            <div className="p-6">
              {resource.availabilityWindows && resource.availabilityWindows.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resource.availabilityWindows.map((win) => (
                    <div key={win.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-white shadow-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-muted" />
                        <span className="text-[13px] font-semibold text-foreground capitalize">
                          {win.dayOfWeek.toLowerCase()}
                        </span>
                      </div>
                      <div className="text-[13px] font-medium text-primary bg-primary/5 px-2.5 py-1 rounded-md">
                        {win.startTime} – {win.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Clock size={32} className="text-gray-300 mb-2" />
                  <p className="text-[13px] text-muted italic">No availability windows have been set for this facility.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RATING MODAL POPUP --- */}
        {showRateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Submit Your Rating</h3>
                <button 
                  onClick={() => { setShowRateModal(false); setPendingRating(0); }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Star size={32} className="text-primary fill-primary/20" />
                </div>
                <h4 className="text-[16px] font-semibold text-gray-800 mb-2">How was your experience?</h4>
                <p className="text-[14px] text-gray-500 mb-6">Select the number of stars that best describes this facility.</p>
                
                <div className="mb-4">
                  <RatingStars 
                    max={5} 
                    onRate={(val) => setPendingRating(val)} 
                    disabled={submittingRating} 
                  />
                </div>

                {/* Counter Visibility */}
                <div className="h-6">
                  {pendingRating > 0 && (
                    <span className="text-[14px] font-bold text-primary animate-bounce inline-block">
                       Selected: {pendingRating} / 5 Stars
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3">
                <button
                  onClick={() => { setShowRateModal(false); setPendingRating(0); }}
                  disabled={submittingRating}
                  className="flex-1 px-4 py-2.5 text-[14px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRateSubmit}
                  disabled={submittingRating || pendingRating === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      Submit Rating
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={showDeleteModal}
          title="Delete Resource"
          message="Are you sure you want to delete this resource? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
        
        <ConfirmModal
          open={errorModal !== null}
          title="Error"
          message={errorModal || ""}
          confirmLabel="OK"
          cancelLabel={null}
          variant="danger"
          onConfirm={() => setErrorModal(null)}
          onCancel={() => setErrorModal(null)}
        />
      </div>
    </MainLayout>
  );
}