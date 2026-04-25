"use client";

import {
  CalendarCheck,
  Clock,
  Building2,
  AlertCircle,
  Loader2,
  ClipboardList,
  CalendarDays,
  Hourglass,
  Ban,
} from "lucide-react";

interface Stats {
  totalActive: number;
  pendingApprovals: number;
  resourcesUsed: number;
  upcomingThisWeek: number;
  totalBookings: number;
  upcomingBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
}

interface StatsCardsProps {
  stats: Stats;
  loading: boolean;
  isAdminOrManager: boolean;
}

export default function StatsCards({ stats, loading, isAdminOrManager }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-card-bg border border-border p-5 flex items-center gap-4 animate-pulse"
          >
            <div className="h-10 w-10 rounded-lg bg-background-secondary" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-background-secondary" />
              <div className="h-5 w-12 rounded bg-background-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const adminCards = [
    {
      label: "Total Active",
      value: stats.totalActive,
      icon: CalendarCheck,
      color: "text-info",
      bg: "bg-info-light",
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: AlertCircle,
      color: "text-warning",
      bg: "bg-warning-light",
    },
    {
      label: "Resources Used",
      value: stats.resourcesUsed,
      icon: Building2,
      color: "text-success",
      bg: "bg-success-light",
    },
    {
      label: "Upcoming This Week",
      value: stats.upcomingThisWeek,
      icon: Clock,
      color: "text-primary-dark",
      bg: "bg-primary-light",
    },
  ];

  const userCards = [
    {
      label: "All Bookings",
      value: stats.totalBookings,
      icon: ClipboardList,
      color: "text-info",
      bg: "bg-info-light",
    },
    {
      label: "Upcoming Bookings",
      value: stats.upcomingBookings,
      icon: CalendarDays,
      color: "text-success",
      bg: "bg-success-light",
    },
    {
      label: "Pending Bookings",
      value: stats.pendingBookings,
      icon: Hourglass,
      color: "text-warning",
      bg: "bg-warning-light",
    },
    {
      label: "Cancelled Bookings",
      value: stats.cancelledBookings,
      icon: Ban,
      color: "text-danger",
      bg: "bg-danger-light",
    },
  ];

  const cards = isAdminOrManager ? adminCards : userCards;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl bg-card-bg border border-border p-5 flex items-center gap-4"
          >
            <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
              <Icon size={20} className={card.color} />
            </div>
            <div>
              <p className="text-[12px] text-muted font-medium">{card.label}</p>
              <p className="text-xl font-bold text-foreground">{card.value ?? 0}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

