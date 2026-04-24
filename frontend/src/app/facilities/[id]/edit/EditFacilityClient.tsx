"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import RoleGuard from "@/components/RoleGuard";
import PageHeader from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/api";
import { uploadFile, deleteFile, getPublicUrl } from "@/lib/supabase";
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

interface AvailabilityWindowResponse {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface ResourceResponse {
  id: number;
  name: string;
  type: string;
  capacity: number | null;
  location: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  availabilityWindows: AvailabilityWindowResponse[];
}

interface AvailabilityRow {
  day: string;
  startTime: string;
  endTime: string;
}

export default function EditFacilityClient() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [availabilityWindows, setAvailabilityWindows] = useState<
    AvailabilityRow[]
  >([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
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
    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await apiFetch<ResourceResponse>(
          `/api/resources/${params.id}`,
        );
        setName(data.name);
        setType(data.type);
        setCapacity(data.capacity != null ? String(data.capacity) : "");
        setLocation(data.location);
        setDescription(data.description || "");
        if (data.imageUrl) {
          setExistingImageUrl(data.imageUrl);
          setImagePreview(data.imageUrl);
        }
        setAvailabilityWindows(
          data.availabilityWindows.map((w) => ({
            day: w.dayOfWeek,
            startTime: w.startTime,
            endTime: w.endTime,
          })),
        );
      } catch {
        setLoadError("Failed to load resource.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

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
      let imageUrl: string | null = existingImageUrl;

      if (imageFile) {
        setUploading(true);
        if (existingImageUrl) {
          try {
            const oldPath = existingImageUrl.split("/facility-images/").pop();
            if (oldPath) await deleteFile("facility-images", oldPath);
          } catch { /* old file cleanup is best-effort */ }
        }
        const path = await uploadFile("facility-images", imageFile);
        imageUrl = getPublicUrl("facility-images", path);
        setUploading(false);
      } else if (!imagePreview) {
        imageUrl = null;
      }

      const body = {
        name: name.trim(),
        type,
        capacity: capacity ? Number.parseInt(capacity, 10) : null,
        location: location.trim(),
        description: description.trim() || null,
        imageUrl,
        availabilityWindows: availabilityWindows.map((w) => ({
          dayOfWeek: w.day,
          startTime: w.startTime,
          endTime: w.endTime,
        })),
      };

      await apiFetch(`/api/resources/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      router.push(`/facilities/${params.id}/`);
    } catch {
      setUploading(false);
      setError("Failed to update resource. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="ml-2 text-[14px] text-muted">Loading resource...</span>
          </div>
        </RoleGuard>
      </MainLayout>
    );
  }

  if (loadError) {
    return (
      <MainLayout>
        <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
          <div className="max-w-3xl mx-auto">
            <PageHeader title="Edit Resource" backHref="/facilities/" />
            <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
              <p className="text-[14px] text-red-600">{loadError}</p>
            </div>
          </div>
        </RoleGuard>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Edit Resource"
          subtitle="Update facility or equipment details"
          backHref={`/facilities/${params.id}/`}
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
              {availabilityWindows.length === 0 && (
                <p className="text-[13px] text-muted">
                  No availability windows set. Click "Add Window" to add one.
                </p>
              )}
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
              href={`/facilities/${params.id}/`}
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
              {uploading ? "Uploading image..." : submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
      </RoleGuard>
    </MainLayout>
  );
}
