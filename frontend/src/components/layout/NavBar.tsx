"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { apiFetch } from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  AlertTriangle,
  Users,
  Bell,
  CirclePlus,
  UserCircle,
  LogOut,
  User,
  Menu,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  UserPlus,
  MessageSquare,
  Calendar,
  CheckCheck,
  Loader2,
  BellOff,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  roles?: string[];
}

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

// ── Constants ───────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/", icon: LayoutDashboard },
  { label: "Facilities", href: "/facilities/", icon: Building2 },
  { label: "Bookings", href: "/bookings/", icon: CalendarDays },
  { label: "Incidents", href: "/incidents/", icon: AlertTriangle },
  { label: "Notifications", href: "/notifications/", icon: Bell },
  {
    label: "User Management",
    href: "/user-management/",
    icon: Users,
    roles: ["ADMIN"],
  },
];

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

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getLink(referenceType: string, referenceId: number) {
  if (referenceType === "BOOKING") return `/bookings/${referenceId}/`;
  if (referenceType === "TICKET" || referenceType === "COMMENT")
    return `/incidents/${referenceId}/`;
  return "#";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotifications();

  const role = user?.role || "USER";
  const roleLabel = ROLE_LABELS[role] || role;

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  // Mobile menu
  const [mobileOpen, setMobileOpen] = useState(false);

  // Bell dropdown
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellLoading, setBellLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Fetch notifications
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
    if (opening) fetchDropdownNotifications();
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      try {
        await apiFetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
        refreshUnreadCount();
      } catch {
        // proceed anyway
      }
    }
    setBellOpen(false);
    router.push(getLink(n.referenceType, n.referenceId));
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
    setProfileOpen(false);
    setMobileOpen(false);
    logout();
    router.push("/login/");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href.replace(/\/$/, ""));

  return (
    <>
      {/* ── Main Navbar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-sidebar-bg">
        <div className="flex h-16 items-center px-4 md:px-6 gap-4">

          {/* Logo */}
          <Link href="/dashboard/" className="flex items-center gap-2.5 shrink-0">
            <img
                src="/logo.png"
                alt="Orbixa"
                className="h-8 w-8 rounded-lg object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-white font-semibold text-[14px] leading-tight">
                OrBixa
              </p>
              <p className="text-sidebar-text text-[10px] leading-tight">
                SmartCampus
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 flex-1 ml-4">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-sidebar-active-bg text-sidebar-active"
                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Report Incident — desktop */}
            <Link
              href="/incidents/new/"
              className="hidden md:flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-white hover:bg-primary-dark transition-colors"
            >
              <CirclePlus size={15} />
              <span>Report Incident</span>
            </Link>

            {/* Bell */}
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                onClick={handleBellClick}
                className="relative rounded-lg p-2 text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Bell Dropdown */}
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
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[380px] overflow-y-auto">
                    {bellLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 size={22} className="animate-spin text-muted" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted">
                        <BellOff size={30} className="mb-2 opacity-40" />
                        <p className="text-[13px]">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((n) => {
                          const Icon =
                            NOTIFICATION_ICONS[n.type] || AlertTriangle;
                          const colorClass =
                            NOTIFICATION_COLORS[n.type] ||
                            "text-gray-600 bg-gray-50";
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => handleNotificationClick(n)}
                              className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                !n.isRead ? "bg-blue-50/40" : ""
                              }`}
                            >
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                              >
                                <Icon size={13} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className={`text-[12px] leading-tight ${
                                      !n.isRead
                                        ? "font-semibold text-foreground"
                                        : "font-medium text-muted"
                                    }`}
                                  >
                                    {n.title}
                                  </p>
                                  {!n.isRead && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11.5px] text-muted mt-0.5 line-clamp-1">
                                  {n.message}
                                </p>
                              </div>
                              <span className="text-[10px] text-muted whitespace-nowrap shrink-0 pt-0.5">
                                {timeAgo(n.createdAt)}
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

            {/* Profile */}
            <div className="relative ml-1" ref={profileRef}>
              <div className="flex items-center gap-2">
                <div className="text-right hidden lg:block">
                  <p className="text-[13px] font-semibold text-white leading-tight">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[10px] text-sidebar-text">{roleLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileOpen((p) => !p)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold ring-2 ring-white/20">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </button>
              </div>

              {/* Profile Dropdown */}
              {profileOpen && (
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
                        setProfileOpen(false);
                        router.push("/profile/");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground hover:bg-gray-50 transition-colors"
                    >
                      <User size={14} className="text-muted" />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className="md:hidden ml-1 rounded-lg p-2 text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu Dropdown ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-sidebar-border bg-sidebar-bg px-3 pb-4 pt-2">
            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                      active
                        ? "bg-sidebar-active-bg text-sidebar-active"
                        : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                    }`}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 pt-3 border-t border-sidebar-border space-y-1">
              <Link
                href="/incidents/new/"
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-[13.5px] font-medium text-white hover:bg-primary-dark transition-colors"
              >
                <CirclePlus size={17} />
                Report Incident
              </Link>
              <Link
                href="/profile/"
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                  isActive("/profile/")
                    ? "bg-sidebar-active-bg text-sidebar-active"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <UserCircle size={17} />
                Profile
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}