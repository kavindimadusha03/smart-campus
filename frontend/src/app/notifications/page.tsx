"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import { useNotifications } from "@/context/NotificationContext";
import { apiFetch } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  UserPlus,
  MessageSquare,
  Calendar,
  AlertTriangle,
  CheckCheck,
  Loader2,
  BellOff,
  Trash2,
} from "lucide-react";

interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceType: string;
  referenceId: number;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPage {
  notifications: NotificationItem[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  unreadCount: number;
}

const NOTIFICATION_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  BOOKING_APPROVED: CheckCircle,
  BOOKING_REJECTED: XCircle,
  TICKET_STATUS_CHANGE: RefreshCw,
  TICKET_ASSIGNED: UserPlus,
  NEW_COMMENT: MessageSquare,
  NEW_BOOKING_REQUEST: Calendar,
  NEW_TICKET: AlertTriangle,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  BOOKING_APPROVED: "text-green-600 bg-green-50",
  BOOKING_REJECTED: "text-red-600 bg-red-50",
  TICKET_STATUS_CHANGE: "text-blue-600 bg-blue-50",
  TICKET_ASSIGNED: "text-purple-600 bg-purple-50",
  NEW_COMMENT: "text-indigo-600 bg-indigo-50",
  NEW_BOOKING_REQUEST: "text-yellow-600 bg-yellow-50",
  NEW_TICKET: "text-orange-600 bg-orange-50",
};

function getLink(referenceType: string, referenceId: number) {
  if (referenceType === "BOOKING") return `/bookings/${referenceId}/`;
  if (referenceType === "TICKET" || referenceType === "COMMENT")
    return `/incidents/${referenceId}/`;
  return "#";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const PAGE_SIZE = 20;

function NotificationsContent() {
  const router = useRouter();
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; event: React.MouseEvent } | null>(null);

  const fetchNotifications = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const data = await apiFetch<NotificationPage>(
          `/api/notifications?page=${pageNum}&size=${PAGE_SIZE}`,
        );
        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications,
        );
        setPage(data.currentPage);
        setTotalPages(data.totalPages);
        setUnreadCount(data.unreadCount);
      } catch {
        // error handled by apiFetch (401 redirect)
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    fetchNotifications(0).finally(() => setLoading(false));
  }, [fetchNotifications]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchNotifications(page + 1, true);
    setLoadingMore(false);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      try {
        await apiFetch(`/api/notifications/${notification.id}/read`, {
          method: "PATCH",
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        refreshUnreadCount();
      } catch {
        // proceed with navigation even if mark-read fails
      }
    }
    router.push(getLink(notification.referenceType, notification.referenceId));
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      refreshUnreadCount();
    } catch {
      // silently ignore
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const deleted = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (deleted && !deleted.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setDeleteTarget(null);
    try {
      await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch {
      // silently ignore
    }
    await fetchNotifications(0);
    refreshUnreadCount();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-gray-50 transition-colors"
            >
              <CheckCheck size={16} />
              Mark All as Read
            </button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <BellOff size={48} className="mb-4 opacity-40" />
          <p className="text-[15px] font-medium">No notifications yet</p>
          <p className="text-[13px] mt-1">
            You&apos;ll be notified about bookings, tickets, and more.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-card-bg border border-border shadow-sm overflow-hidden divide-y divide-border">
            {notifications.map((notification) => {
              const Icon =
                NOTIFICATION_ICONS[notification.type] || AlertTriangle;
              const colorClass =
                NOTIFICATION_COLORS[notification.type] ||
                "text-gray-600 bg-gray-50";

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleNotificationClick(notification)
                  }
                  role="button"
                  tabIndex={0}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[13px] font-semibold ${!notification.isRead ? "text-foreground" : "text-muted"}`}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[13px] text-muted mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted whitespace-nowrap">
                      {timeAgo(notification.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: notification.id, event: e });
                      }}
                      className="rounded-md p-1 text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {page + 1 < totalPages && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-[13px] font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <MainLayout>
      <NotificationsContent />
    </MainLayout>
  );
}
