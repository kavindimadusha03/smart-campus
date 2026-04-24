"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { uploadFile, getPublicUrl } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import {
  Upload,
  X,
  Loader2,
  Sparkles,
  AlertTriangle,
  MapPin,
  Mail,
  Phone,
  ClipboardList,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";

const CATEGORIES = [
  "ELECTRICAL",
  "PLUMBING",
  "IT_EQUIPMENT",
  "FURNITURE",
  "HVAC",
  "CLEANING",
  "SAFETY",
  "OTHER",
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

interface ResourceOption {
  id: number;
  name: string;
}

interface AttachmentFile {
  file: File;
  previewUrl: string;
  name: string;
}

interface FieldErrors {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface SuggestionResult {
  category: string;
  priority: string;
  reason: string;
}

function NewIncidentContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [location, setLocation] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);

  useEffect(() => {
    apiFetch<ResourceOption[]>("/api/bookings/resources")
      .then((data) =>
        setResources(data.map((r) => ({ id: r.id, name: r.name }))),
      )
      .catch(() => {});
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(?:\+94|0)\d{9}$/;

  const validateField = (name: keyof FieldErrors, value: string) => {
    const trimmed = value.trim();

    switch (name) {
      case "title":
        if (!trimmed) return "Title is required.";
        return "";

      case "description":
        if (!trimmed) return "Description is required.";
        return "";

      case "category":
        if (!trimmed) return "Category is required.";
        return "";

      case "priority":
        if (!trimmed) return "Priority is required.";
        return "";

      case "location":
        if (!trimmed) return "Location is required.";
        return "";

      case "contactEmail":
        if (!trimmed) return "";
        if (!emailRegex.test(trimmed)) {
          return "Please enter a valid email address.";
        }
        return "";

      case "contactPhone":
        if (!trimmed) return "";
        if (!phoneRegex.test(trimmed)) {
          return "Enter a valid phone number. Example: 0771234567 or +94771234567.";
        }
        return "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors: FieldErrors = {
      title: validateField("title", title),
      description: validateField("description", description),
      category: validateField("category", category),
      priority: validateField("priority", priority),
      location: validateField("location", location),
      contactEmail: validateField("contactEmail", contactEmail),
      contactPhone: validateField("contactPhone", contactPhone),
    };

    setFieldErrors(newErrors);
    return !Object.values(newErrors).some((msg) => msg);
  };

  const getSuggestionFromText = (text: string): SuggestionResult | null => {
    const value = text.toLowerCase();

    if (!value.trim()) return null;

    // IT Equipment
    if (
      value.includes("projector") ||
      value.includes("hdmi") ||
      value.includes("screen") ||
      value.includes("monitor") ||
      value.includes("computer") ||
      value.includes("keyboard") ||
      value.includes("printer") ||
      value.includes("wifi") ||
      value.includes("internet")
    ) {
      return {
        category: "IT_EQUIPMENT",
        priority:
          value.includes("not working") ||
          value.includes("broken") ||
          value.includes("flicker") ||
          value.includes("error")
            ? "HIGH"
            : "MEDIUM",
        reason: "The description looks related to equipment or technical issues.",
      };
    }

    // Electrical
    if (
      value.includes("light") ||
      value.includes("power") ||
      value.includes("electric") ||
      value.includes("socket") ||
      value.includes("switch") ||
      value.includes("fan") ||
      value.includes("short circuit")
    ) {
      return {
        category: "ELECTRICAL",
        priority:
          value.includes("spark") ||
          value.includes("burn") ||
          value.includes("danger")
            ? "CRITICAL"
            : "HIGH",
        reason: "The description suggests an electrical issue.",
      };
    }

    // Plumbing
    if (
      value.includes("water") ||
      value.includes("leak") ||
      value.includes("pipe") ||
      value.includes("tap") ||
      value.includes("toilet") ||
      value.includes("washroom") ||
      value.includes("drain")
    ) {
      return {
        category: "PLUMBING",
        priority:
          value.includes("overflow") || value.includes("flood")
            ? "HIGH"
            : "MEDIUM",
        reason: "The description suggests a plumbing-related issue.",
      };
    }

    // Furniture
    if (
      value.includes("chair") ||
      value.includes("table") ||
      value.includes("desk") ||
      value.includes("door") ||
      value.includes("cupboard") ||
      value.includes("broken seat")
    ) {
      return {
        category: "FURNITURE",
        priority: value.includes("broken") ? "MEDIUM" : "LOW",
        reason: "The description appears to be related to furniture.",
      };
    }

    // HVAC
    if (
      value.includes("ac") ||
      value.includes("air conditioner") ||
      value.includes("air-conditioning") ||
      value.includes("cooling") ||
      value.includes("ventilation")
    ) {
      return {
        category: "HVAC",
        priority: value.includes("not working") ? "HIGH" : "MEDIUM",
        reason: "The issue looks related to cooling or ventilation.",
      };
    }

    // Cleaning
    if (
      value.includes("dirty") ||
      value.includes("garbage") ||
      value.includes("waste") ||
      value.includes("clean") ||
      value.includes("smell")
    ) {
      return {
        category: "CLEANING",
        priority: "LOW",
        reason: "The description appears related to cleaning or sanitation.",
      };
    }

    // Safety
    if (
      value.includes("danger") ||
      value.includes("unsafe") ||
      value.includes("fire") ||
      value.includes("smoke") ||
      value.includes("injury") ||
      value.includes("hazard")
    ) {
      return {
        category: "SAFETY",
        priority: "CRITICAL",
        reason: "The issue sounds safety-related and may need urgent attention.",
      };
    }

    return {
      category: "OTHER",
      priority: "MEDIUM",
      reason: "A general issue was detected but not strongly matched to a specific type.",
    };
  };

  useEffect(() => {
    const combinedText = `${title} ${description}`.trim();

    if (combinedText.length < 8) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(() => {
      setSuggestion(getSuggestionFromText(combinedText));
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description]);

  const applySuggestion = () => {
    if (!suggestion) return;
    setCategory(suggestion.category);
    setPriority(suggestion.priority);
    setFieldErrors((prev) => ({
      ...prev,
      category: "",
      priority: "",
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = 3 - attachments.length;
    const selected = Array.from(files).slice(0, remaining);

    const validFiles: AttachmentFile[] = [];

    for (const file of selected) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("Only JPG and PNG images are allowed.");
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be less than 5MB.");
        continue;
      }

      validFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
      });
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    const item = attachments[index];
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");

    const isValid = validateForm();
    if (!isValid) {
      setError("Please fix the errors below.");
      return;
    }

    setSubmitting(true);

    try {
      const ticket = await apiFetch<{ id: number }>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          location: location.trim(),
          resourceId: resourceId ? Number(resourceId) : null,
          contactEmail: contactEmail.trim() || null,
          contactPhone: contactPhone.trim() || null,
        }),
      });

      for (const att of attachments) {
        try {
          const uploadedPath = await uploadFile("facility-images", att.file);
          const filePath = getPublicUrl("facility-images", uploadedPath);

          await apiFetch(`/api/tickets/${ticket.id}/attachments`, {
            method: "POST",
            body: JSON.stringify({
              fileName: att.file.name,
              filePath,
              fileType: att.file.type,
              fileSize: att.file.size,
            }),
          });
        } catch (err) {
          throw new Error(
            err instanceof Error
              ? `Attachment upload failed: ${err.message}`
              : "Attachment upload failed",
          );
        }
      }

      router.push("/incidents/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Report New Incident"
        subtitle="Submit a maintenance or safety issue quickly and clearly"
        backHref="/incidents/"
      />

      <div className="space-y-6">
        {/* Hero section */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-slate-50 via-white to-blue-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-[12px] font-medium text-blue-700">
                <Sparkles size={14} />
                Smart Incident Submission
              </div>
              <h2 className="text-[24px] font-bold text-slate-800">
                Help the team resolve issues faster
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] text-slate-600">
                Fill in the incident details, attach evidence if needed, and the
                system will help suggest the best category and priority.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm border border-slate-100">
                <p className="text-[12px] text-slate-500">Max Files</p>
                <p className="text-[18px] font-bold text-slate-800">3</p>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm border border-slate-100">
                <p className="text-[12px] text-slate-500">Formats</p>
                <p className="text-[18px] font-bold text-slate-800">JPG/PNG</p>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm border border-slate-100">
                <p className="text-[12px] text-slate-500">Priority</p>
                <p className="text-[18px] font-bold text-slate-800">Smart</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          {/* Left main column */}
          <div className="space-y-6">
            {/* Incident details */}
            <div className="rounded-2xl border border-border bg-card-bg p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">
                    Incident Details
                  </h2>
                  <p className="text-[12px] text-muted">
                    Provide a clear explanation of the issue
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-foreground">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTitle(value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        title: validateField("title", value),
                      }));
                    }}
                    placeholder="Example: Projector in Lab 02 is not displaying"
                    className={`h-11 w-full rounded-xl border bg-white px-4 text-[13px] outline-none transition-all focus:ring-2 ${
                      fieldErrors.title
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-border focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-[12px] text-red-500">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-foreground">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDescription(value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        description: validateField("description", value),
                      }));
                    }}
                    placeholder="Describe what happened, what is not working, and any visible signs of damage..."
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-[13px] outline-none resize-none transition-all focus:ring-2 ${
                      fieldErrors.description
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-border focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                  {fieldErrors.description && (
                    <p className="mt-1 text-[12px] text-red-500">
                      {fieldErrors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[13px] font-medium text-foreground">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCategory(value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          category: validateField("category", value),
                        }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-4 text-[13px] outline-none transition-all ${
                        fieldErrors.category
                          ? "border-red-400 focus:border-red-500"
                          : "border-border focus:border-blue-500"
                      }`}
                    >
                      <option value="">Select category...</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category && (
                      <p className="mt-1 text-[12px] text-red-500">
                        {fieldErrors.category}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[13px] font-medium text-foreground">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPriority(value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          priority: validateField("priority", value),
                        }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-4 text-[13px] outline-none transition-all ${
                        fieldErrors.priority
                          ? "border-red-400 focus:border-red-500"
                          : "border-border focus:border-blue-500"
                      }`}
                    >
                      <option value="">Select priority...</option>
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.priority && (
                      <p className="mt-1 text-[12px] text-red-500">
                        {fieldErrors.priority}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Contact */}
            <div className="rounded-2xl border border-border bg-card-bg p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">
                    Location & Contact
                  </h2>
                  <p className="text-[12px] text-muted">
                    Help staff identify where and how to reach you
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-foreground">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocation(value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        location: validateField("location", value),
                      }));
                    }}
                    placeholder="e.g. Study Hall 2, Floor 1"
                    className={`h-11 w-full rounded-xl border bg-white px-4 text-[13px] outline-none transition-all focus:ring-2 ${
                      fieldErrors.location
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-border focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                  {fieldErrors.location && (
                    <p className="mt-1 text-[12px] text-red-500">
                      {fieldErrors.location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-foreground">
                    Related Resource (optional)
                  </label>
                  <select
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-white px-4 text-[13px] outline-none focus:border-blue-500"
                  >
                    <option value="">None</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <Mail size={14} />
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => {
                        const value = e.target.value;
                        setContactEmail(value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          contactEmail: validateField("contactEmail", value),
                        }));
                      }}
                      placeholder="your@email.com"
                      className={`h-11 w-full rounded-xl border bg-white px-4 text-[13px] outline-none transition-all focus:ring-2 ${
                        fieldErrors.contactEmail
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-border focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    />
                    {fieldErrors.contactEmail && (
                      <p className="mt-1 text-[12px] text-red-500">
                        {fieldErrors.contactEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <Phone size={14} />
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setContactPhone(value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          contactPhone: validateField("contactPhone", value),
                        }));
                      }}
                      placeholder="0771234567 or +94771234567"
                      className={`h-11 w-full rounded-xl border bg-white px-4 text-[13px] outline-none transition-all focus:ring-2 ${
                        fieldErrors.contactPhone
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-border focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    />
                    {fieldErrors.contactPhone && (
                      <p className="mt-1 text-[12px] text-red-500">
                        {fieldErrors.contactPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="rounded-2xl border border-border bg-card-bg p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-orange-100 p-2 text-orange-700">
                  <ImagePlus size={18} />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">
                    Evidence Attachments
                  </h2>
                  <p className="text-[12px] text-muted">
                    Upload up to 3 images as evidence
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mb-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                    <Upload size={22} className="text-slate-600" />
                  </div>
                  <p className="text-[14px] font-medium text-slate-700">
                    Drag images here or upload manually
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Only JPG / PNG • Maximum 5MB each • {attachments.length}/3 selected
                  </p>
                  {attachments.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                      Choose Images
                    </button>
                  )}
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                    >
                      <div className="h-36 w-full overflow-hidden bg-slate-100">
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-[12px] font-medium text-slate-700">
                          {att.name}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {(att.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side column */}
          <div className="space-y-6">
            {/* AI Suggestion */}
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-800">
                    Smart Suggestion
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    Based on your title and description
                  </p>
                </div>
              </div>

              {suggestion ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-violet-100 bg-white p-4">
                    <p className="text-[12px] text-slate-500">Suggested Category</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {suggestion.category.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-violet-100 bg-white p-4">
                    <p className="text-[12px] text-slate-500">Suggested Priority</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {suggestion.priority}
                    </p>
                  </div>

                  <div className="rounded-xl border border-violet-100 bg-white p-4">
                    <p className="text-[12px] text-slate-500">Why?</p>
                    <p className="mt-1 text-[13px] text-slate-700">
                      {suggestion.reason}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={applySuggestion}
                    className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-violet-700 transition-colors"
                  >
                    Apply Suggestion
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-violet-200 bg-white p-4 text-center">
                  <p className="text-[13px] text-slate-600">
                    Start typing the incident title and description to get smart suggestions.
                  </p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-border bg-card-bg p-5 shadow-sm">
              <h3 className="mb-4 text-[15px] font-semibold text-foreground">
                Incident Summary
              </h3>

              <div className="space-y-3 text-[13px]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted">Title</span>
                  <span className="max-w-[180px] text-right font-medium text-foreground">
                    {title || "Not added"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted">Category</span>
                  <span className="font-medium text-foreground">
                    {category ? category.replace(/_/g, " ") : "Not selected"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted">Priority</span>
                  <span className="font-medium text-foreground">
                    {priority || "Not selected"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted">Location</span>
                  <span className="max-w-[180px] text-right font-medium text-foreground">
                    {location || "Not added"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted">Attachments</span>
                  <span className="font-medium text-foreground">
                    {attachments.length}/3
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-amber-700">
                <AlertTriangle size={16} />
                <h3 className="text-[15px] font-semibold">Helpful Tips</h3>
              </div>
              <ul className="space-y-2 text-[13px] text-amber-900/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  Write the exact location clearly.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  Mention what is broken or not functioning.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  Attach photos if there is visible damage.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  Use the smart suggestion to speed up form filling.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-4 z-10">
          <div className="rounded-2xl border border-border bg-white/90 backdrop-blur p-4 shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <a
                href="/incidents/"
                className="rounded-xl border border-border px-5 py-2.5 text-center text-[13px] font-medium text-foreground hover:bg-gray-50 transition-colors"
              >
                Cancel
              </a>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? "Submitting..." : "Submit Incident"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewIncidentPage() {
  return (
    <MainLayout>
      <NewIncidentContent />
    </MainLayout>
  );
}