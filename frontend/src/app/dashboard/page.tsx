"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Users,
  UserCheck,
  UserX,
  Wrench,
  Building2,
  Calendar,
  Ticket,
  ArrowRight,
  Loader2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/* ── Types ── */

interface UserItem {
  id: number;
  email: string;
  name: string;
  profilePicture: string | null;
  role: string;
  isActive: boolean;
}

interface ResourceItem {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  type: string;
}

interface ResourceListResponse {
  resources: ResourceItem[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

interface BookingItem {
  id: number;
  resourceName: string;
  resourceLocation: string;
  userName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface BookingPaginatedResponse {
  bookings: BookingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TicketItem {
  id: number;
  code: string;
  title: string;
  location: string;
  status: string;
  createdAt: string;
}

interface TicketLineData {
  date: string;
  IN_PROGRESS: number;
  RESOLVED: number;
  CLOSED: number;
  REJECTED: number;
  OPEN: number;
}

/* ── Helpers ── */

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(formatDateLabel(d));
  }
  return days;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function buildTicketChartData(tickets: TicketItem[], days = 14): TicketLineData[] {
  const dayLabels = getLastNDays(days);
  const today = new Date();
  const data: TicketLineData[] = dayLabels.map((label) => ({
    date: label,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
    REJECTED: 0,
    OPEN: 0,
  }));

  for (const ticket of tickets) {
    const created = new Date(ticket.createdAt);
    const diff = Math.floor(
      (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0 || diff >= days) continue;

    const idx = dayLabels.length - 1 - diff;
    if (data[idx] && data[idx][ticket.status as keyof TicketLineData]) {
      (data[idx] as unknown as Record<string, number>)[ticket.status] += 1;
    }
  }

  return data;
}

/* ── Summary Card ── */

function SummaryCard({
  icon: Icon,
  label,
  value,
  colorClass,
  bgClass,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="rounded-xl bg-card-bg border border-border shadow-sm p-5 flex items-center gap-4 transition-shadow hover:shadow-md">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgClass}`}
      >
        <Icon size={22} className={colorClass} />
      </div>
      <div>
        <p className="text-[12px] font-medium text-muted uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ── Main Content ── */

function DashboardContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Admin";

  /* State */
  const [users, setUsers] = useState<UserItem[]>([]);
  const [resourceMeta, setResourceMeta] = useState<{ totalElements: number; activeCount: number }>({
    totalElements: 0,
    activeCount: 0,
  });
  const [bookingTotal, setBookingTotal] = useState(0);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* Derived stats */
  const activeUsers = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users]
  );
  const inactiveUsers = useMemo(
    () => users.filter((u) => !u.isActive).length,
    [users]
  );
  const technicianCount = useMemo(
    () => users.filter((u) => u.role === "TECHNICIAN").length,
    [users]
  );

  const ticketChartData = useMemo(
    () => buildTicketChartData(tickets, 14),
    [tickets]
  );

  const recentTickets = useMemo(
    () =>
      tickets
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [tickets]
  );

  /* Fetch data */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, resourcesRes, bookingsRes, ticketsRes] = await Promise.all([
          apiFetch<UserItem[]>("/api/admin/users").catch(() => []),
          apiFetch<ResourceListResponse>("/api/resources?page=0&size=1000").catch(() => ({
            resources: [],
            currentPage: 0,
            totalPages: 0,
            totalElements: 0,
          })),
          apiFetch<BookingPaginatedResponse>("/api/bookings?page=0&size=5").catch(() => ({
            bookings: [],
            total: 0,
            page: 0,
            limit: 0,
            totalPages: 0,
          })),
          apiFetch<TicketItem[]>("/api/tickets").catch(() => []),
        ]);

        setUsers(usersRes || []);
        setResourceMeta({
          totalElements: resourcesRes?.totalElements || 0,
          activeCount:
            resourcesRes?.resources?.filter((r) => r.status === "ACTIVE")
              .length || 0,
        });
        setBookingTotal(bookingsRes?.total || 0);
        setRecentBookings(bookingsRes?.bookings?.slice(0, 5) || []);
        setTickets(ticketsRes || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="ml-2 text-[14px] text-muted">
          Loading dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-[14px] text-muted mt-0.5">
            Campus overview &amp; key metrics.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/user-management/"
            className="flex items-center gap-2 rounded-lg border border-primary bg-white px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-blue-50 transition-colors"
          >
            <Users size={16} />
            Manage Users
          </Link>
          <Link
            href="/facilities/new/"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-fg hover:bg-primary-dark transition-colors"
          >
            <Building2 size={16} />
            Add Resource
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          icon={UserCheck}
          label="Active Users"
          value={activeUsers}
          colorClass="text-success"
          bgClass="bg-success-light"
        />
        <SummaryCard
          icon={UserX}
          label="Inactive Users"
          value={inactiveUsers}
          colorClass="text-danger"
          bgClass="bg-danger-light"
        />
        <SummaryCard
          icon={Wrench}
          label="Technicians"
          value={technicianCount}
          colorClass="text-warning"
          bgClass="bg-warning-light"
        />
        <SummaryCard
          icon={Building2}
          label="Active Resources"
          value={resourceMeta.activeCount}
          colorClass="text-info"
          bgClass="bg-info-light"
        />
        <SummaryCard
          icon={Calendar}
          label="Total Bookings"
          value={bookingTotal}
          colorClass="text-primary-dark"
          bgClass="bg-primary-light"
        />
      </div>

      {/* Ticket Trends Chart */}
      <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-muted" />
          <h2 className="text-[15px] font-semibold text-foreground">
            Ticket Status Trends (Last 14 Days)
          </h2>
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ticketChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0dbd0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9e9688" }}
                axisLine={{ stroke: "#e0dbd0" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#9e9688" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e0dbd0",
                  borderRadius: "10px",
                  fontSize: "12px",
                  boxShadow: "0 4px 16px rgba(28,26,23,0.08)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Line
                type="monotone"
                dataKey="IN_PROGRESS"
                name="In Progress"
                stroke="#d48c1e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="RESOLVED"
                name="Resolved"
                stroke="#2e7d52"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="CLOSED"
                name="Closed"
                stroke="#9e9688"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="REJECTED"
                name="Rejected"
                stroke="#c0392b"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="OPEN"
                name="Open"
                stroke="#4a6fa5"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Recent Bookings + Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="rounded-xl bg-card-bg border border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-muted" />
              <h2 className="text-[15px] font-semibold text-foreground">
                Recent Bookings
              </h2>
            </div>
            <Link
              href="/bookings/"
              className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
            >
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentBookings.length === 0 ? (
              <div className="px-6 py-8 text-center text-[13px] text-muted">
                No bookings found.
              </div>
            ) : (
              recentBookings.map((booking) => {
                const date = new Date(booking.bookingDate);
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}/`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-blue-50 text-primary">
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {date.toLocaleString("en-US", { month: "short" })}
                      </span>
                      <span className="text-xl font-bold leading-tight">
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">
                        {booking.resourceName}
                      </p>
                      <p className="text-[12px] text-muted mt-0.5">
                        {booking.startTime} - {booking.endTime} &bull;{" "}
                        {booking.resourceLocation}
                      </p>
                      {booking.userName && (
                        <p className="text-[11px] text-muted mt-0.5">
                          Booked by {booking.userName}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={booking.status} />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="rounded-xl bg-card-bg border border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-muted" />
              <h2 className="text-[15px] font-semibold text-foreground">
                Recent Tickets
              </h2>
            </div>
            <Link
              href="/incidents/"
              className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
            >
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentTickets.length === 0 ? (
              <div className="px-6 py-8 text-center text-[13px] text-muted">
                No recent tickets.
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/incidents/${ticket.id}/`}
                  className="block px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">
                        <span className="text-muted font-medium">
                          #{ticket.code}
                        </span>{" "}
                        {ticket.title}
                      </p>
                      <p className="text-[11.5px] text-muted mt-0.5">
                        {ticket.location}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  );
}

