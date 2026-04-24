"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  MapPin,
  Tag,
  User,
  Clock,
  MessageSquare,
  Pencil,
  Trash2,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  UserCheck,
  ShieldCheck,
  FileText,
  Sparkles,
  ClipboardList,
  Activity,
  CheckCheck,
} from "lucide-react";

interface TicketDetail {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  resourceId: number | null;
  resourceName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdById: number;
  createdByName: string;
  createdByAvatar: string | null;
  assignedToId: number | null;
  assignedToName: string | null;
  assignedToAvatar: string | null;
  rejectionReason: string | null;
  resolutionNotes: string | null;
  firstResponseAt: string | null;
  timeToFirstResponseMinutes: number | null;
  resolvedAt: string | null;
  closedAt: string | null;
  timeToResolutionMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  attachments: {
    id: number;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }[];
}

interface TicketComment {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
}

interface TechnicianOption {
  id: number;
  name: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatMinutes(minutes: number | null) {
  if (minutes == null) return "Not available";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}

const LIFECYCLE_STEPS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function StatusTimeline({ status }: { status: string }) {
  const isRejected = status === "REJECTED";
  const steps = isRejected ? ["OPEN", "REJECTED"] : LIFECYCLE_STEPS;
  const currentIdx = steps.indexOf(status);

  return (
    <div className="flex items-center w-full">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === steps.length - 1;
        const isRejectStep = step === "REJECTED";

        let dotColor = "bg-slate-200 border-slate-300";
        let lineColor = "bg-slate-200";
        let labelColor = "text-slate-500";

        if (isCompleted) {
          dotColor = "bg-emerald-500 border-emerald-500";
          lineColor = "bg-emerald-500";
          labelColor = "text-emerald-700";
        } else if (isCurrent) {
          dotColor = isRejectStep
            ? "bg-red-500 border-red-500"
            : "bg-blue-600 border-blue-600";
          labelColor = isRejectStep
            ? "text-red-700 font-semibold"
            : "text-blue-700 font-semibold";
        }

        return (
          <div key={step} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${dotColor} transition-colors shadow-sm`}
              >
                {isCompleted ? (
                  <CheckCircle size={14} className="text-white" />
                ) : isCurrent && isRejectStep ? (
                  <XCircle size={14} className="text-white" />
                ) : isCurrent ? (
                  <div className="h-2.5 w-2.5 rounded-full bg-white" />
                ) : null}
              </div>
              <span className={`text-[10px] mt-2 whitespace-nowrap ${labelColor}`}>
                {step.replace(/_/g, " ")}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-1 mx-2 mt-[-18px] rounded-full ${
                  isCompleted ? lineColor : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function IncidentDetailClient() {
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuth();

  const canManage = user?.role === "MANAGER" || user?.role === "ADMIN";
  const canUpdateStatus =
    user?.role === "TECHNICIAN" ||
    user?.role === "MANAGER" ||
    user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("IN_PROGRESS");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<number | null>(null);

  const loadTicket = useCallback(async () => {
    try {
      const data = await apiFetch<TicketDetail>(`/api/tickets/${ticketId}`);
      setTicket(data);
      if (data.resolutionNotes) setResolutionNotes(data.resolutionNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket");
    }
  }, [ticketId]);

  const loadComments = useCallback(async () => {
    try {
      const data = await apiFetch<TicketComment[]>(`/api/tickets/${ticketId}/comments`);
      setComments(data);
    } catch {
      // non-fatal
    }
  }, [ticketId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadTicket(), loadComments()]);
      setLoading(false);
    };
    load();
  }, [loadTicket, loadComments]);

useEffect(() => {
  console.log("Current user role:", user?.role);
  console.log("canManage value:", canManage);

  if (canManage) {
    apiFetch<TechnicianOption[]>("/api/tickets/technicians")
      .then((data) => {
        console.log("Technicians API response:", data);
        setTechnicians(data.map((t) => ({ id: t.id, name: t.name })));
      })
      .catch((err) => {
        console.error("Failed to load technicians:", err);
      });
  }
}, [canManage, user?.role]);

  const handleSendComment = async () => {
    if (!comment.trim()) return;
    setSendingComment(true);
    try {
      await apiFetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: comment.trim() }),
      });
      setComment("");
      await loadComments();
    } catch {
      // ignore
    } finally {
      setSendingComment(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingContent.trim()) return;
    try {
      await apiFetch(`/api/tickets/${ticketId}/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ content: editingContent.trim() }),
      });
      setEditingCommentId(null);
      setEditingContent("");
      await loadComments();
    } catch {
      // ignore
    }
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentTarget) return;
    try {
      await apiFetch(`/api/tickets/${ticketId}/comments/${deleteCommentTarget}`, {
        method: "DELETE",
      });
      setDeleteCommentTarget(null);
      await loadComments();
    } catch {
      setDeleteCommentTarget(null);
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnician) return;
    setUpdating(true);
    setActionError("");
    try {
      await apiFetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ assignedTo: Number(selectedTechnician) }),
      });
      await loadTicket();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    setActionError("");
    try {
      await apiFetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: selectedStatus,
          resolutionNotes: resolutionNotes.trim() || null,
        }),
      });
      await loadTicket();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = async () => {
    setUpdating(true);
    setActionError("");
    try {
      await apiFetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CLOSED" }),
      });
      setShowCloseModal(false);
      await loadTicket();
    } catch (err) {
      setShowCloseModal(false);
      setActionError(err instanceof Error ? err.message : "Failed to close ticket");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async (reason?: string) => {
    if (!reason?.trim()) return;
    setUpdating(true);
    setActionError("");
    try {
      await apiFetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "REJECTED", rejectionReason: reason.trim() }),
      });
      setShowRejectModal(false);
      await loadTicket();
    } catch (err) {
      setShowRejectModal(false);
      setActionError(err instanceof Error ? err.message : "Failed to reject ticket");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm flex items-center gap-3">
            <Loader2 size={22} className="animate-spin text-blue-600" />
            <span className="text-[14px] text-slate-600">Loading ticket details...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !ticket) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center shadow-sm">
            <AlertTriangle size={34} className="mx-auto mb-3 text-red-400" />
            <p className="text-[15px] font-semibold text-red-700">{error || "Ticket not found"}</p>
            <a
              href="/incidents/"
              className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-[13px] font-medium text-blue-600 border border-red-100 hover:bg-red-50"
            >
              Back to incidents
            </a>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isClosed = ticket.status === "CLOSED" || ticket.status === "REJECTED";

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={ticket.title}
          subtitle={`Incident ID: #${ticket.code}`}
          backHref="/incidents/"
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          }
        />

        {/* Top Summary Banner */}
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-slate-50 via-white to-blue-50 p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-[12px] font-medium text-blue-700 mb-3">
                <Sparkles size={14} />
                Incident Management Panel
              </div>
              <h2 className="text-[24px] font-bold text-slate-800">
                Track, discuss, and resolve maintenance issues faster
              </h2>
              <p className="mt-2 text-[14px] text-slate-600 max-w-3xl">
                Review ticket details, assign staff, monitor response time, and update the
                issue lifecycle from open to completion.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Category</p>
                <p className="mt-1 text-[13px] font-semibold text-slate-800">
                  {ticket.category.replace(/_/g, " ")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Created</p>
                <p className="mt-1 text-[13px] font-semibold text-slate-800">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Comments</p>
                <p className="mt-1 text-[13px] font-semibold text-slate-800">{comments.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Attachments</p>
                <p className="mt-1 text-[13px] font-semibold text-slate-800">
                  {ticket.attachments.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-slate-800">Ticket Progress</h3>
              <p className="text-[12px] text-slate-500">Current workflow status and lifecycle stage</p>
            </div>
          </div>
          <StatusTimeline status={ticket.status} />
        </div>

        {ticket.status === "REJECTED" && ticket.rejectionReason && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5 shadow-sm flex items-start gap-3">
            <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-red-800">Ticket Rejected</p>
              <p className="text-[13px] text-red-700 mt-1">{ticket.rejectionReason}</p>
            </div>
          </div>
        )}

        {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && ticket.resolutionNotes && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 shadow-sm flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-emerald-800">
                {ticket.status === "CLOSED" ? "Ticket Closed" : "Ticket Resolved"}
              </p>
              <p className="text-[13px] text-emerald-700 mt-1">{ticket.resolutionNotes}</p>
              {ticket.resolvedAt && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  Resolved {timeAgo(ticket.resolvedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_0.9fr] gap-6">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Description */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-slate-800">Incident Overview</h3>
                  <p className="text-[12px] text-slate-500">
                    Main description and reporting information
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-[14px] text-slate-700 leading-7">{ticket.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <MapPin size={14} />
                    <span className="text-[11px] uppercase tracking-wide">Location</span>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-800">{ticket.location}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Tag size={14} />
                    <span className="text-[11px] uppercase tracking-wide">Category</span>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-800">
                    {ticket.category.replace(/_/g, " ")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <User size={14} />
                    <span className="text-[11px] uppercase tracking-wide">Reported By</span>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-800">{ticket.createdByName}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <CalendarDays size={14} />
                    <span className="text-[11px] uppercase tracking-wide">Created</span>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-800">
                    {new Date(ticket.createdAt).toLocaleDateString()}{" "}
                    <span className="font-normal text-slate-500">({timeAgo(ticket.createdAt)})</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {ticket.attachments.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-orange-100 p-2 text-orange-700">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-800">
                      Evidence Attachments
                    </h3>
                    <p className="text-[12px] text-slate-500">
                      Files and images uploaded with this ticket
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {ticket.attachments.map((att) => {
                    const isImage = att.fileType?.startsWith("image/");
                    return (
                      <a
                        key={att.id}
                        href={att.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        {isImage ? (
                          <div className="h-36 w-full overflow-hidden bg-slate-100">
                            <img
                              src={att.filePath}
                              alt={att.fileName}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="h-36 flex flex-col items-center justify-center bg-slate-50 px-3">
                            <FileText size={24} className="text-slate-400 mb-2" />
                            <span className="text-[11px] text-slate-500 text-center line-clamp-2">
                              {att.fileName}
                            </span>
                          </div>
                        )}

                        <div className="p-3">
                          <p className="truncate text-[12px] font-medium text-slate-700">
                            {att.fileName}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resolution Notes */}
            {canUpdateStatus && !isClosed && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Wrench size={18} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-800">Resolution Notes</h3>
                    <p className="text-[12px] text-slate-500">
                      Add technician or staff notes before updating status
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add resolution notes before updating status..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
            )}

            {/* Discussion */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-800">
                      Discussion ({comments.length})
                    </h3>
                    <p className="text-[12px] text-slate-500">
                      Collaborate with staff and track communication
                    </p>
                  </div>
                </div>
              </div>

              {comments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
                  <MessageSquare size={42} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-[15px] font-medium text-slate-600">No comments yet</p>
                  <p className="text-[12px] text-slate-500 mt-1">
                    Start the discussion by adding the first comment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => {
                    const isOwn = c.userId === user?.id;
                    return (
                      <div key={c.id} className="group flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[13px] font-semibold mt-1">
                          {c.userName?.charAt(0) || "?"}
                        </div>

                        <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-slate-800">
                              {c.userName}
                            </span>
                            <StatusBadge status={c.userRole} />
                            <span className="text-[11px] text-slate-500">
                              {timeAgo(c.createdAt)}
                            </span>
                            {c.isEdited && (
                              <span className="text-[10px] text-slate-500 italic">(edited)</span>
                            )}
                          </div>

                          {editingCommentId === c.id ? (
                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleEditComment(c.id);
                                  if (e.key === "Escape") setEditingCommentId(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleEditComment(c.id)}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] text-slate-600 hover:bg-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-[13px] text-slate-700 mt-2 leading-6">{c.content}</p>
                          )}

                          {editingCommentId !== c.id && (isOwn || isAdmin) && (
                            <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isOwn && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditingContent(c.content);
                                  }}
                                  className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <Pencil size={11} /> Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteCommentTarget(c.id)}
                                className="text-[11px] text-slate-500 hover:text-red-500 flex items-center gap-1"
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isClosed && (
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendComment();
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendComment}
                      disabled={sendingComment || !comment.trim()}
                      className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-[13px] font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {sendingComment ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Ticket Details */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-slate-800">Ticket Details</h3>
                  <p className="text-[12px] text-slate-500">Current ticket information and tracking</p>
                </div>
              </div>

              <div className="space-y-4 text-[13px]">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Priority</p>
                  <div className="mt-2">
                    <StatusBadge status={ticket.priority} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Status</p>
                  <div className="mt-2">
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <UserCheck size={15} className="text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">Assigned To</p>
                      <p className={`font-medium mt-1 ${ticket.assignedToName ? "text-slate-800" : "text-slate-500 italic"}`}>
                        {ticket.assignedToName || "Unassigned"}
                      </p>
                    </div>
                  </div>
                </div>

                {ticket.resourceName && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <Building2 size={15} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide">Resource</p>
                        <p className="text-slate-800 font-medium mt-1">{ticket.resourceName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {(ticket.contactEmail || ticket.contactPhone) && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">Contact Info</p>
                    {ticket.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-400" />
                        <span className="text-slate-700">{ticket.contactEmail}</span>
                      </div>
                    )}
                    {ticket.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400" />
                        <span className="text-slate-700">{ticket.contactPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCheck size={15} />
                    <p className="text-[12px] font-semibold uppercase tracking-wide">Service Timers</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">First Response</p>
                    <p className="text-slate-800 font-semibold mt-1">
                      {ticket.firstResponseAt
                        ? formatMinutes(ticket.timeToFirstResponseMinutes)
                        : "Pending"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">Time to Resolution</p>
                    <p className="text-slate-800 font-semibold mt-1">
                      {ticket.timeToResolutionMinutes != null
                        ? formatMinutes(ticket.timeToResolutionMinutes)
                        : "Not resolved yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <Clock size={12} />
                  <span>Updated {timeAgo(ticket.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isClosed && (canManage || canUpdateStatus) && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                    <Wrench size={18} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-800">Actions</h3>
                    <p className="text-[12px] text-slate-500">Manage assignment and workflow</p>
                  </div>
                </div>

                {actionError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-3 mb-4">
                    <p className="text-[12px] text-red-600">{actionError}</p>
                  </div>
                )}

                <div className="space-y-5">
                  {canManage && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 mb-2">
                        <UserCheck size={12} />
                        Assign Technician
                      </label>
                      <p className="text-red-500 text-sm mb-2">{technicians.length} users loaded</p>
                      <select
                        value={selectedTechnician}
                        onChange={(e) => setSelectedTechnician(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-500"
                      >
                        <option value="">Select technician...</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      {selectedTechnician && (
                        <button
                          type="button"
                          onClick={handleAssign}
                          disabled={updating}
                          className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-[12px] font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {updating ? "Assigning..." : "Assign Technician"}
                        </button>
                      )}
                    </div>
                  )}

                  {canUpdateStatus && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 mb-2">
                        <Wrench size={12} />
                        Update Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-500"
                      >
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleUpdateStatus}
                        disabled={updating}
                        className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updating ? "Updating..." : "Update Status"}
                      </button>
                    </div>
                  )}

                  {canManage && (
                    <div className="pt-1 space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowCloseModal(true)}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle size={15} />
                        Close Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle size={15} />
                        Reject Ticket
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <ConfirmModal
          open={deleteCommentTarget !== null}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmDeleteComment}
          onCancel={() => setDeleteCommentTarget(null)}
        />
        <ConfirmModal
          open={showCloseModal}
          title="Close Ticket"
          message="Are you sure you want to close this ticket? This marks the issue as fully resolved."
          confirmLabel="Close Ticket"
          variant="info"
          loading={updating}
          onConfirm={handleClose}
          onCancel={() => setShowCloseModal(false)}
        />
        <ConfirmModal
          open={showRejectModal}
          title="Reject Ticket"
          message="Please provide a reason for rejecting this ticket."
          confirmLabel="Reject"
          variant="danger"
          loading={updating}
          input={{ placeholder: "Enter rejection reason...", required: true }}
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
        />
      </div>
    </MainLayout>
  );
}