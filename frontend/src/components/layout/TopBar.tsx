"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { apiFetch } from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Bell,
  LogOut,
  User,
  Menu,
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
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  USER: "User",
  TECHNICIAN: "Technician",
  MANAGER: "Manager",
  ADMIN: "Administrator",
};

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

function getLink(referenceType: string, referenceId: number) {
  if (referenceType === "BOOKING") return `/bookings/${referenceId}/`;
  if (referenceType === "TICKET" || referenceType === "COMMENT")
    return `/incidents/${referenceId}/`;
  return "#";
}

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellLoading, setBellLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDropdownNotifications = useCallback(async () => {
    setBellLoading(true);
    try {
      const data = await apiFetch<NotificationPage>(
        "/api/notifications?page=0&size=5",
      );
      setNotifications(data.notifications);
    } catch {
      // silently ignore
    } finally {
      setBellLoading(false);
    }
  }, []);

  const handleBellClick = () => {
    const opening = !bellOpen;
    setBellOpen(opening);
    if (opening) {
      fetchDropdownNotifications();
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      try {
        await apiFetch(`/api/notifications/${notification.id}/read`, {
          method: "PATCH",
        });
        refreshUnreadCount();
      } catch {
        // proceed with navigation
      }
    }
    setBellOpen(false);
    router.push(getLink(notification.referenceType, notification.referenceId));
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshUnreadCount();
    } catch {
      // silently ignore
    }
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/login/");
  };

  const roleLabel = ROLE_LABELS[user?.role || ""] || user?.role || "Member";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-topbar-bg px-4 md:px-6">
      <div className="flex items-center gap-3 md:gap-4">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden rounded-lg p-2 text-muted hover:bg-gray-100 transition-colors"
          >
            <Menu size={22} />
          </button>
        )}
        <h1 className="text-xl font-bold text-foreground">Orbixa</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Bell + Notification Dropdown */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={handleBellClick}
            className="relative rounded-lg p-2 text-muted hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-12 z-50 w-96 rounded-xl border border-border bg-white shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-[14px] font-semibold text-foreground">
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {bellLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={22} className="animate-spin text-muted" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted">
                    <BellOff size={32} className="mb-2 opacity-40" />
                    <p className="text-[13px]">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => {
                      const Icon =
                        NOTIFICATION_ICONS[notification.type] || AlertTriangle;
                      const colorClass =
                        NOTIFICATION_COLORS[notification.type] ||
                        "text-gray-600 bg-gray-50";

                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            !notification.isRead ? "bg-blue-50/40" : ""
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                className={`text-[12px] leading-tight ${!notification.isRead ? "font-semibold text-foreground" : "font-medium text-muted"}`}
                              >
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-[11.5px] text-muted mt-0.5 line-clamp-1">
                              {notification.message}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted whitespace-nowrap shrink-0 pt-0.5">
                            {timeAgo(notification.createdAt)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border px-4 py-2.5">
                <Link
                  href="/notifications/"
                  onClick={() => setBellOpen(false)}
                  className="block w-full text-center text-[12.5px] font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar + Dropdown */}
        <div className="relative ml-1 md:ml-2" ref={dropdownRef}>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[13.5px] font-semibold text-foreground leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[11px] text-muted">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold ring-2 ring-border">
                  {user?.name?.charAt(0) || "U"}
                </div>
              )}
            </button>
          </div>

          {open && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-white shadow-lg">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {user?.name}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <StatusBadge status={user?.role || "USER"} />
                </div>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/profile/");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground hover:bg-gray-50 transition-colors"
                >
                  <User size={15} className="text-muted" />
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
