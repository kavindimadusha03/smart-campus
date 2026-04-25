"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import StatsCards from "@/components/booking/StatsCards";
import FilterBar, { FilterState } from "@/components/booking/FilterBar";
import { Plus, Check, X, Loader2, Trophy, Eye, LayoutList, CalendarDays, BarChart3 } from "lucide-react";
import CalendarView from "@/components/booking/CalendarView";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#71717a"];

interface BookingRecord {
  id: number;
  resourceId?: number;
  resourceName: string;
  resourceLocation?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  userId: number;
  userName: string;
}

interface DashboardStats {
  totalActive: number;
  pendingApprovals: number;
  resourcesUsed: number;
  upcomingThisWeek: number;
  totalBookings: number;
  upcomingBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
}

interface ResourceOption {
  id: number;
  name: string;
}

interface TopResource {
  resourceId: number;
  resourceName: string;
  resourceLocation: string;
  bookingCount: number;
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-border shadow-xl rounded-lg text-[12px]">
        <p className="font-bold text-gray-900 border-b border-gray-100 pb-1 mb-1">{data.name}</p>
        <p className="flex justify-between gap-4">Bookings: <span className="font-bold">{data.value}</span></p>
      </div>
    );
  }
  return null;
};

function BookingsContent() {
  const { user } = useAuth();
  const canViewAll = user?.role === "MANAGER" || user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");

  useEffect(() => {
    if (canViewAll) {
      setActiveTab("all");
    }
  }, [canViewAll]);

  const [myBookings, setMyBookings] = useState<BookingRecord[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [topResources, setTopResources] = useState<TopResource[]>([]);

  const topResource = topResources.length > 0 ? topResources[0] : null;

  const pieChartData = useMemo(() => {
    return topResources.map((r) => ({
      name: r.resourceName,
      value: r.bookingCount,
    }));
  }, [topResources]);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    resourceId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchMyBookings = useCallback(async () => {
    try {
      const data = await apiFetch<{ bookings: BookingRecord[] }>("/api/bookings/my");
      setMyBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (err) {
      console.error("Failed to fetch my bookings:", err);
      setMyBookings([]);
    }
  }, []);

  const fetchAllBookings = useCallback(async () => {
    if (!canViewAll) return;
    try {
      const data = await apiFetch<{ bookings: BookingRecord[] }>("/api/bookings");
      setAllBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (err) {
      console.error("Failed to fetch all bookings:", err);
      setAllBookings([]);
    }
  }, [canViewAll]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await apiFetch<DashboardStats>("/api/dashboard/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchResources = useCallback(async () => {
    try {
      const data = await apiFetch<ResourceOption[]>("/api/bookings/resources");
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setResources([]);
    }
  }, []);

  const fetchTopResources = useCallback(async () => {
    try {
      const data = await apiFetch<TopResource[]>("/api/bookings/top-resources?limit=8");
      setTopResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch top resources:", err);
      setTopResources([]);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchMyBookings(),
        fetchAllBookings(),
        fetchStats(),
        fetchResources(),
        fetchTopResources(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
      setMyBookings([]);
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  }, [fetchMyBookings, fetchAllBookings, fetchStats, fetchResources, fetchTopResources]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await apiFetch(`/api/bookings/${id}/review`, {
        method: "PUT",
        body: JSON.stringify({ status: "APPROVED", reviewReason: null }),
      });
      await fetchData();
    } catch {
      setErrorModal("Failed to approve booking");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async (reason?: string) => {
    if (!rejectTarget || !reason?.trim()) return;
    setActionLoading(rejectTarget);
    try {
      await apiFetch(`/api/bookings/${rejectTarget}/review`, {
        method: "PUT",
        body: JSON.stringify({ status: "REJECTED", reviewReason: reason.trim() }),
      });
      setRejectTarget(null);
      await fetchData();
    } catch {
      setRejectTarget(null);
      setErrorModal("Failed to reject booking");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(cancelTarget);
    try {
      await apiFetch(`/api/bookings/${cancelTarget}/cancel`, { method: "PUT" });
      setCancelTarget(null);
      await fetchData();
    } catch {
      setCancelTarget(null);
      setErrorModal("Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  const bookings = activeTab === "all" ? allBookings : myBookings;

  const filtered = Array.isArray(bookings)
    ? bookings.filter((b) => {
        const matchesStatus = !filters.status || b.status === filters.status;
        const matchesSearch =
          !filters.search ||
          b.resourceName?.toLowerCase().includes(filters.search.toLowerCase()) ||
          b.purpose?.toLowerCase().includes(filters.search.toLowerCase()) ||
          b.userName?.toLowerCase().includes(filters.search.toLowerCase());
        const matchesResource =
          !filters.resourceId || b.resourceId?.toString() === filters.resourceId;
        const matchesDateFrom =
          !filters.dateFrom || b.bookingDate >= filters.dateFrom;
        const matchesDateTo =
          !filters.dateTo || b.bookingDate <= filters.dateTo;
        return (
          matchesStatus &&
          matchesSearch &&
          matchesResource &&
          matchesDateFrom &&
          matchesDateTo
        );
      })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="ml-2 text-[14px] text-muted">Loading bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <PageHeader title="Bookings" subtitle="View and manage resource bookings" />
        <div className="rounded-xl bg-danger-light border border-danger/20 p-6 text-center">
          <p className="text-[14px] text-danger">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-fg hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-5">
      <PageHeader
        title="Bookings"
        subtitle="View and manage resource bookings"
        actions={
          !canViewAll && (
            <Link
              href="/bookings/new/"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-fg hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} />
              New Booking
            </Link>
          )
        }
      />

      {/* Stats Cards */}
      <StatsCards
        stats={{
          totalActive: stats?.totalActive ?? 0,
          pendingApprovals: stats?.pendingApprovals ?? 0,
          resourcesUsed: stats?.resourcesUsed ?? 0,
          upcomingThisWeek: stats?.upcomingThisWeek ?? 0,
          totalBookings: stats?.totalBookings ?? 0,
          upcomingBookings: stats?.upcomingBookings ?? 0,
          pendingBookings: stats?.pendingBookings ?? 0,
          cancelledBookings: stats?.cancelledBookings ?? 0,
        }}
        loading={statsLoading}
        isAdminOrManager={canViewAll}
      />

      {/* Most Booked Resource */}
      {topResource && (
        <div className="rounded-xl bg-card-bg border border-border p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center">
            <Trophy size={20} className="text-primary-dark" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] text-muted font-medium">Most Booked Resource</p>
            <p className="text-[14px] font-semibold text-foreground">
              {topResource.resourceName}
              <span className="text-muted font-normal">
                {" "}
                &bull; {topResource.resourceLocation}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-foreground">{topResource.bookingCount}</p>
            <p className="text-[12px] text-muted">bookings</p>
          </div>
        </div>
      )}

      {/* Booking Contribution Pie Chart */}
      {pieChartData.length > 0 && (
        <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <BarChart3 size={18} className="text-primary" />
            <h2 className="text-[13px] font-bold text-foreground uppercase tracking-tight">Resource Booking Contribution</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  layout="horizontal"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "16px", lineHeight: "20px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {!canViewAll && (
          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === "my"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            My Bookings
          </button>
        )}
        {canViewAll && (
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            All Bookings
          </button>
        )}
      </div>

      {/* Advanced Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        resources={resources}
        showStatusFilter={true}
      />

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              viewMode === "table"
                ? "bg-primary text-primary-fg"
                : "text-muted hover:text-foreground"
            }`}
          >
            <LayoutList size={14} />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-primary text-primary-fg"
                : "text-muted hover:text-foreground"
            }`}
          >
            <CalendarDays size={14} />
            Calendar
          </button>
        </div>
        <p className="text-[12px] text-muted">
          {filtered.length} booking{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {viewMode === "calendar" ? (
        <CalendarView
          bookings={filtered}
          onSelectDate={setSelectedDate}
          selectedDate={selectedDate}
        />
      ) : (
        <div className="rounded-xl bg-card-bg border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-[13px] min-w-[700px]">
          <thead>
            <tr className="bg-background-secondary border-b border-border">
              <th className="px-5 py-3 text-left font-medium text-muted">Resource</th>
              <th className="px-5 py-3 text-left font-medium text-muted">Date</th>
              <th className="px-5 py-3 text-left font-medium text-muted">Time</th>
              <th className="px-5 py-3 text-left font-medium text-muted">Purpose</th>
              {activeTab === "all" && (
                <th className="px-5 py-3 text-left font-medium text-muted">Requested By</th>
              )}
              <th className="px-5 py-3 text-left font-medium text-muted">Status</th>
              <th className="px-5 py-3 text-right font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={activeTab === "all" ? 7 : 6}
                  className="px-5 py-8 text-center text-muted text-[13px]"
                >
                  No bookings found.
                </td>
              </tr>
            ) : (
              filtered.map((booking) => {
                const isOwner = booking.userId === user?.id;
                const isActioning = actionLoading === booking.id;

                return (
                  <tr
                    key={booking.id}
                    className={`hover:bg-background-secondary ${isActioning ? "opacity-60" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/bookings/${booking.id}/`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {booking.resourceName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-foreground">{booking.bookingDate}</td>
                    <td className="px-5 py-3.5 text-foreground">
                      {booking.startTime} - {booking.endTime}
                    </td>
                    <td className="px-5 py-3.5 text-muted max-w-[200px] truncate">
                      {booking.purpose}
                    </td>
                    {activeTab === "all" && (
                      <td className="px-5 py-3.5 text-foreground">{booking.userName}</td>
                    )}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/bookings/${booking.id}/`}
                          className="rounded p-1.5 text-muted hover:text-primary hover:bg-primary-light"
                          title="View"
                        >
                          <Eye size={16} />
                        </Link>
                        {canViewAll && booking.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={isActioning}
                              onClick={() => handleApprove(booking.id)}
                              className="rounded p-1.5 text-success hover:bg-success-light"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={isActioning}
                              onClick={() => setRejectTarget(booking.id)}
                              className="rounded p-1.5 text-danger hover:bg-danger-light"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {isOwner &&
                          (booking.status === "PENDING" || booking.status === "APPROVED") && (
                            <button
                              type="button"
                              disabled={isActioning}
                              onClick={() => setCancelTarget(booking.id)}
                              className="rounded px-2 py-1 text-[12px] text-danger hover:bg-danger-light"
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      <ConfirmModal
        open={cancelTarget !== null}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        confirmLabel="Cancel Booking"
        variant="danger"
        loading={actionLoading !== null}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
      <ConfirmModal
        open={rejectTarget !== null}
        title="Reject Booking"
        message="Please provide a reason for rejecting this booking."
        confirmLabel="Reject"
        variant="danger"
        loading={actionLoading !== null}
        input={{ placeholder: "Rejection reason (required)", required: true }}
        onConfirm={confirmReject}
        onCancel={() => setRejectTarget(null)}
      />
      <ConfirmModal
        open={errorModal !== null}
        title="Error"
        message={errorModal || ""}
        confirmLabel="OK"
        cancelLabel={null}
        variant="danger"
        onConfirm={() => setErrorModal(null)}
        onCancel={() => setErrorModal(null)}
      />
    </div>
  );
}

export default function BookingsPage() {
  return (
    <MainLayout>
      <BookingsContent />
    </MainLayout>
  );
}