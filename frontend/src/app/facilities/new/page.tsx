"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import RoleGuard from "@/components/RoleGuard";
import PageHeader from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/api";
import { uploadFile, getPublicUrl } from "@/lib/supabase";
import { Plus, Trash2, Loader2, Upload, X } from "lucide-react";

const RESOURCE_TYPES = [
  "LECTURE_HALL",
  "LAB",
  "MEETING_ROOM",
  "PROJECTOR",
  "CAMERAS_RECORDING_DEVICES", 
  "SPORTS_RECREATION_FACILITIES", 
  "EVENT_AUDITORIUM_SPACES", 
  "TRANSPORT_VEHICLES",
  "OTHER_EQUIPMENT",
];

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

interface AvailabilityRow {
  day: string;
  startTime: string;
  endTime: string;
}

function NewFacilityContent() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [availabilityWindows, setAvailabilityWindows] = useState<
    AvailabilityRow[]
  >([{ day: "MONDAY", startTime: "08:00", endTime: "17:00" }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


    // ✅ Check overlap (NEW)
  const isOverlappingWindow = (newWindow: AvailabilityRow, index?: number) => {
    return availabilityWindows.some((w, i) => {
      if (index !== undefined && i === index) return false;

      if (w.day !== newWindow.day) return false;

      return (
        newWindow.startTime < w.endTime &&
        w.startTime < newWindow.endTime
      );
    });
  };


  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addWindow = () => {
    setAvailabilityWindows([
      ...availabilityWindows,
      { day: "MONDAY", startTime: "08:00", endTime: "17:00" },
    ]);
  };

  const removeWindow = (index: number) => {
    setAvailabilityWindows(availabilityWindows.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!type) {
      setError("Type is required.");
      return;
    }
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }

    // ✅ Capacity validation
    if (capacity) {
      if (!/^\d+$/.test(capacity) || parseInt(capacity) <= 0) {
        return setError("Capacity must be a positive whole number.");
      }
    }

     // Availability validation
    for (let i = 0; i < availabilityWindows.length; i++) {
      const w = availabilityWindows[i];

      if (w.startTime >= w.endTime) {
        return setError("End time must be later than start time.");
      }

      if (isOverlappingWindow(w, i)) {
        return setError("Overlapping availability windows are not allowed.");
      }
    }



    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        setUploading(true);
        const path = await uploadFile("facility-images", imageFile);
        imageUrl = getPublicUrl("facility-images", path);
        setUploading(false);
      }

      const body = {
        name: name.trim(),
        type,
        capacity: capacity ? Number.parseInt(capacity, 10) : null,
        location: location.trim(),
        description: description.trim() || null,
        imageUrl,
        status,
        availabilityWindows: availabilityWindows.map((w) => ({
          dayOfWeek: w.day,
          startTime: w.startTime,
          endTime: w.endTime,
        })),
      };

      const created = await apiFetch<{ id: number }>("/api/resources", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/facilities/${created.id}/`);
    } catch {
      setUploading(false);
      setError("Failed to create resource. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add New Resource"
        subtitle="Create a new bookable facility or equipment"
        backHref="/facilities/"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
          <h2 className="text-[15px] font-semibold text-foreground mb-4">
            Resource Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Collaborative Lab Room 402"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary"
              >
                <option value="">Select type...</option>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Capacity
              </label>
              <input
                type="number"
                placeholder="Number of people"
                value={capacity}
                min="1"
                step="1"
                onChange={(e) => setCapacity(e.target.value)}  
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering Block B, Floor 4"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe the resource..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Image
              </label>
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleImageSelect(file);
                  }}
                  className="flex flex-col items-center justify-center w-full h-36 rounded-lg border-2 border-dashed border-border bg-gray-50 hover:border-primary hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Upload size={24} className="text-muted mb-2" />
                  <span className="text-[13px] text-muted">
                    Click or drag an image to upload
                  </span>
                  <span className="text-[11px] text-muted mt-1">
                    JPG, PNG, WebP up to 5MB
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    checked={status === "ACTIVE"}
                    onChange={(e) => setStatus(e.target.value)}
                    className="accent-primary"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="status"
                    value="OUT_OF_SERVICE"
                    checked={status === "OUT_OF_SERVICE"}
                    onChange={(e) => setStatus(e.target.value)}
                    className="accent-primary"
                  />
                  Out of Service
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Windows */}
        <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-foreground">
              Availability Windows
            </h2>
            <button
              type="button"
              onClick={addWindow}
              className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary-dark"
            >
              <Plus size={14} /> Add Window
            </button>
          </div>
          <div className="space-y-3">
            {availabilityWindows.map((window, index) => (
              <div key={index} className="flex items-center gap-3 flex-wrap">
                <select
                  value={window.day}
                  onChange={(e) => {
                    const updated = [...availabilityWindows];
                    const temp = { ...updated[index], day: e.target.value };
                    if (isOverlappingWindow(temp, index)) {
                    setError("Overlapping window not allowed.");
                    return;
                  }

                  updated[index].day = e.target.value;
                  setAvailabilityWindows(updated);
                  setError(null);
                  }}
                  className="h-10 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={window.startTime}
                  onChange={(e) => {
                    const updated = [...availabilityWindows];
                    updated[index].startTime = e.target.value;
                    setAvailabilityWindows(updated);
                  }}
                  className="h-10 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary"
                />
                <span className="text-muted text-[13px]">to</span>
                <input
                  type="time"
                  value={window.endTime}
                  onChange={(e) => {
                    const updated = [...availabilityWindows];
                    updated[index].endTime = e.target.value;
                    setAvailabilityWindows(updated);
                  }}
                  className="h-10 rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => removeWindow(index)}
                  className="p-2 text-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <a
            href="/facilities/"
            className="rounded-lg border border-border px-5 py-2.5 text-[13px] font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Cancel
          </a>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {uploading ? "Uploading image..." : submitting ? "Creating..." : "Create Resource"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewFacilityPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
        <NewFacilityContent />
      </RoleGuard>
    </MainLayout>
  );
}
