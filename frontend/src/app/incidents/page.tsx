"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { apiFetch } from "@/lib/api";
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Clock3,
  Loader2,
  Eye,
  Trash2,
  MapPin,
  UserRound,
} from "lucide-react";

type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface TicketListItem {
  id: number;
  code: string;
  title: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  assignedToName: string | null;
  createdAt: string;
}

const CATEGORIES = [
  "ALL",
  "ELECTRICAL",
  "PLUMBING",
  "IT_EQUIPMENT",
  "FURNITURE",
  "HVAC",
  "CLEANING",
  "SAFETY",
  "OTHER",
];

const PRIORITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function getPriorityClasses(priority: string) {
  switch (priority) {
    case "LOW":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "HIGH":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "CRITICAL":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "IN_PROGRESS":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "CLOSED":
      return "bg-gray-100 text-gray-700 border border-gray-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/90 backdrop-blur shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-wide text-muted mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-[12px] text-muted mt-1">{subtitle}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function IncidentsContent() {
  const { user } = useAuth();

  const canSeeAssigned =
    user?.role === "TECHNICIAN" ||
    user?.role === "MANAGER" ||
    user?.role === "ADMIN";

  const canSeeAll = user?.role === "MANAGER" || user?.role === "ADMIN";
  const canDelete = user?.role === "ADMIN" ;

  const [tab, setTab] = useState<"MY" | "ASSIGNED" | "ALL">("MY");
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [deleteTarget, setDeleteTarget] = useState<TicketListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (canSeeAll) {
      setTab("ALL");
    } else {
      setTab("MY");
    }
  }, [canSeeAll]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = "/api/tickets/my";

      if (tab === "ASSIGNED") {
        endpoint = "/api/tickets/assigned";
      } else if (tab === "ALL") {
        endpoint = "/api/tickets";
      }

      const data = await apiFetch<TicketListItem[]>(endpoint);
      setTickets(data || []);
    } catch {
      setError("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        search.trim() === "" ||
        ticket.code?.toLowerCase().includes(search.toLowerCase()) ||
        ticket.title?.toLowerCase().includes(search.toLowerCase()) ||
        ticket.location?.toLowerCase().includes(search.toLowerCase()) ||
        ticket.category?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" || ticket.category === categoryFilter;

      const matchesPriority =
        priorityFilter === "ALL" || ticket.priority === priorityFilter;

      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      return (
        matchesSearch && matchesCategory && matchesPriority && matchesStatus
      );
    });
  }, [tickets, search, categoryFilter, priorityFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: filteredTickets.length,
      open: filteredTickets.filter((t) => t.status === "OPEN").length,
      inProgress: filteredTickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: filteredTickets.filter(
        (t) => t.status === "RESOLVED" || t.status === "CLOSED"
      ).length,
      highPriority: filteredTickets.filter(
        (t) => t.priority === "HIGH" || t.priority === "CRITICAL"
      ).length,
    };
  }, [filteredTickets]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await apiFetch(`/api/tickets/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      fetchTickets();
    } catch {
      setError("Failed to delete ticket.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto">
      <PageHeader
        title="Incidents"
        subtitle="Report, track, and manage maintenance incidents in one place"
        actions={
  user?.role !== "ADMIN" ? (
    <Link
      href="/incidents/new/"
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-5 py-3 text-[13px] font-semibold text-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all"
    >
      <Plus size={16} />
      Report Incident
    </Link>
  ) : undefined
}
      />

      {/* Hero strip */}
      <div className="mb-6 rounded-3xl border border-border bg-gradient-to-r from-slate-50 via-white to-blue-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Incident Management Hub
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] text-muted leading-6">
              Quickly search tickets, monitor priorities, and keep track of
              issue resolution progress with a cleaner and more professional
              interface.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white border border-border px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] uppercase text-muted">Open</p>
              <p className="mt-1 text-lg font-bold text-sky-700">{stats.open}</p>
            </div>
            <div className="rounded-2xl bg-white border border-border px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] uppercase text-muted">In Progress</p>
              <p className="mt-1 text-lg font-bold text-violet-700">
                {stats.inProgress}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-border px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] uppercase text-muted">Resolved</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">
                {stats.resolved}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-border px-4 py-3 text-center shadow-sm">
              <p className="text-[11px] uppercase text-muted">High Priority</p>
              <p className="mt-1 text-lg font-bold text-orange-700">
                {stats.highPriority}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {user?.role !== "ADMIN" && (
  <button
    type="button"
    onClick={() => setTab("MY")}
    className={`rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all ${
      tab === "MY"
        ? "bg-primary text-white shadow-sm"
        : "bg-white border border-border text-muted hover:text-foreground"
    }`}
  >
    My Tickets
  </button>
)}

        

        {canSeeAll && (
          <button
            type="button"
            onClick={() => setTab("ALL")}
            className={`rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all ${
              tab === "ALL"
                ? "bg-primary text-white shadow-sm"
                : "bg-white border border-border text-muted hover:text-foreground"
            }`}
          >
            All Tickets
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          subtitle="Current filtered results"
          icon={<ClipboardList size={20} />}
        />
        <StatCard
          title="Open Issues"
          value={stats.open}
          subtitle="Need attention"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subtitle="Currently being handled"
          icon={<Clock3 size={20} />}
        />
        <StatCard
          title="Resolved / Closed"
          value={stats.resolved}
          subtitle="Completed tickets"
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center gap-2">
          <Filter size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Search & Filters
          </h3>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label className="mb-1.5 block text-[12px] font-medium text-muted">
                Search
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  placeholder="Search by code, title, category, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-gray-50/70 pl-10 pr-4 text-[13px] outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-[12px] font-medium text-muted">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-gray-50/70 px-3 text-[13px] outline-none focus:border-primary"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL" ? "All Categories" : item.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-[12px] font-medium text-muted">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-gray-50/70 px-3 text-[13px] outline-none focus:border-primary"
              >
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL" ? "All Priorities" : item}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-[12px] font-medium text-muted">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-gray-50/70 px-3 text-[13px] outline-none focus:border-primary"
              >
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL" ? "All Statuses" : item.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("ALL");
                  setPriorityFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[13px] font-medium text-foreground hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="rounded-3xl border border-border bg-white py-20 shadow-sm">
          <div className="flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="ml-2 text-[14px] text-muted">
              Loading tickets...
            </span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-[13px] text-red-600 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && filteredTickets.length === 0 && (
        <div className="rounded-3xl border border-border bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-muted">
            <ClipboardList size={26} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No tickets found
          </h3>
          <p className="mt-2 text-[14px] text-muted">
            Try changing the filters or create a new incident.
          </p>
          <Link
            href="/incidents/new/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} />
            Report Incident
          </Link>
        </div>
      )}

      {!loading && !error && filteredTickets.length > 0 && (
        <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                Ticket List
              </h3>
              <p className="text-[12px] text-muted mt-1">
                Showing {filteredTickets.length} incident
                {filteredTickets.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-[13px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-border">
                  <th className="px-6 py-4 text-left font-semibold text-muted">ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted">Title</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted">Category</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted">Priority</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted">Location</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted">Assigned To</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted">Created</th>
                  <th className="px-6 py-4 text-left font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-primary whitespace-nowrap">
                      {ticket.code}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {ticket.title}
                        </p>
                        <p className="mt-1 text-[12px] text-muted">
                          Incident record #{ticket.id}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-foreground whitespace-nowrap">
                      {ticket.category.replace(/_/g, " ")}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusClasses(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <MapPin size={13} className="text-muted shrink-0" />
                        <span>{ticket.location}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted">
                        <UserRound size={13} className="shrink-0" />
                        <span>{ticket.assignedToName || "Unassigned"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-foreground whitespace-nowrap">
                      {formatDate(ticket.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/incidents/${ticket.id}/`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-[12px] font-medium text-foreground hover:bg-gray-50 transition-colors"
                        >
                          <Eye size={13} />
                          View
                        </Link>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ticket)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Ticket"
        message={`Are you sure you want to delete "${
          deleteTarget?.title || "this ticket"
        }"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <MainLayout>
      <IncidentsContent />
    </MainLayout>
  );
}