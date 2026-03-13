"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  AlertTriangle,
  Users,
  Bell,
  CirclePlus,
  UserCircle,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  roles?: string[];
}

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

const bottomItems: NavItem[] = [
  { label: "Profile", href: "/profile/", icon: UserCircle },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "USER";

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg">
            U
          </div>
          <div>
            <p className="text-white font-semibold text-[15px] leading-tight">
              Orbixa
            </p>
            <p className="text-sidebar-text text-[11px]">SmartCampus</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden rounded-lg p-1 text-sidebar-text hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href.replace(/\/$/, ""));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/incidents/new/"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-dark mb-4"
        >
          <CirclePlus size={18} />
          <span>Report Incident</span>
        </Link>

        <div className="space-y-1 border-t border-white/10 pt-3">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href.replace(/\/$/, ""));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-[220px] flex-col bg-sidebar-bg text-sidebar-text">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            onKeyDown={(e) => e.key === "Escape" && onClose?.()}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
          <aside className="relative z-10 flex h-full w-[260px] flex-col bg-sidebar-bg text-sidebar-text shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
