"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Plus,
  Search,
  MapPin,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Medal,
  CalendarCheck,
  Star,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  X,
  ExternalLink,
} from "lucide-react";

const RESOURCE_TYPES = [
  "All Types",
  "LECTURE_HALL",
  "LAB",
  "MEETING_ROOM",
  "PROJECTOR",
  "CAMERAS_RECORDING_DEVICES", 
  "SPORTS_RECREATION_FACILITIES", 
  "EVENT_AUDITORIUM_SPACES", 
  "TRANSPORT_VEHICLES",
  "OTHER_EQUIPMENT",
];

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#71717a"];

interface AvailabilityWindow {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  capacity: number | null;
  location: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  availabilityWindows: AvailabilityWindow[];
  bookingCountLastMonth: number;
  popularityBadge: string | null;
  averageRating: number;
}

interface ResourceListResponse {
  resources: Resource[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

function FacilitiesContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "MANAGER" || user?.role === "ADMIN";
  const canManage = isAdmin;

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [locationFilter, setLocationFilter] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const [selectedRatingItems, setSelectedRatingItems] = useState<{
    label: string;
    items: Resource[];
  } | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "All Types") params.set("type", typeFilter);
      if (search.trim()) params.set("search", search.trim());
      if (locationFilter.trim()) params.set("location", locationFilter.trim());
      if (minCapacity) params.set("minCapacity", minCapacity);
      if (maxCapacity) params.set("maxCapacity", maxCapacity);
      params.set("page", String(page));
      params.set("size", isAdmin ? "20" : "12");

      const data = await apiFetch<ResourceListResponse>(
        `/api/resources?${params.toString()}`
      );
      setResources(data?.resources ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      setError("Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, locationFilter, minCapacity, maxCapacity, page, isAdmin]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    setPage(0);
  }, [typeFilter, search, locationFilter, minCapacity, maxCapacity]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget);
    try {
      await apiFetch(`/api/resources/${deleteTarget}`, { method: "DELETE" });
      setOpenMenu(null);
      setDeleteTarget(null);
      fetchResources();
    } catch {
      setDeleteTarget(null);
      setErrorModal("Failed to delete resource.");
    } finally {
      setDeleting(null);
    }
  };

  const getBadgeStyles = (badge: string) => {
    switch (badge) {
      case "GOLD": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "SILVER": return "bg-orange-100 text-orange-700 border-orange-200";
      case "BRONZE": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const activeCount = resources.filter(res => res.status === "AVAILABLE" || res.status === "ACTIVE").length;
  const outOfServiceCount = resources.filter(res => res.status === "OUT_OF_SERVICE" || res.status === "MAINTENANCE").length;

  const pieChartData = useMemo(() => {
    const groups: Record<string, { name: string; value: number; totalBookings: number }> = {};
    resources.forEach(res => {
      const typeLabel = res.type.replace(/_/g, " ");
      if (!groups[typeLabel]) {
        groups[typeLabel] = { name: typeLabel, value: 0, totalBookings: 0 };
      }
      groups[typeLabel].value += 1;
      groups[typeLabel].totalBookings += (res.bookingCountLastMonth || 0);
    });
    return Object.values(groups);
  }, [resources]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-border shadow-xl rounded-lg text-[12px]">
          <p className="font-bold text-gray-900 border-b border-gray-100 pb-1 mb-1">{data.name}</p>
          <p className="flex justify-between gap-4">Resources: <span className="font-bold">{data.value}</span></p>
          <p className="flex justify-between gap-4 text-primary">Bookings: <span className="font-bold">{data.totalBookings}</span></p>
        </div>
      );
    }
    return null;
  };

  const topRated = [...resources]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 3);

  const mostUsed = [...resources]
    .sort((a, b) => (b.bookingCountLastMonth || 0) - (a.bookingCountLastMonth || 0))
    .slice(0, 3);

  const ratingStats = useMemo(() => [
    { label: "4.5 - 5.0", items: resources.filter(r => r.averageRating >= 4.5), color: "bg-green-500" },
    { label: "4.0 - 4.4", items: resources.filter(r => r.averageRating >= 4.0 && r.averageRating < 4.5), color: "bg-lime-500" },
    { label: "3.0 - 3.9", items: resources.filter(r => r.averageRating >= 3.0 && r.averageRating < 4.0), color: "bg-yellow-500" },
    { label: "Below 3.0", items: resources.filter(r => r.averageRating > 0 && r.averageRating < 3.0), color: "bg-orange-500" },
    { label: "Unrated", items: resources.filter(r => !r.averageRating || r.averageRating === 0), color: "bg-gray-300" },
  ], [resources]);

  const maxRatingCount = Math.max(...ratingStats.map(s => s.items.length), 1);

  return (
    <div className="max-w-[1200px] mx-auto">
      <PageHeader
        title="Facilities & Assets"
        subtitle="Browse and manage campus resources"
        actions={
          canManage ? (
            <Link
              href="/facilities/new/"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} />
              Add Resource
            </Link>
          ) : undefined
        }
      />

      {!loading && resources.length > 0 && (
        <div className="space-y-6 mb-8">
          
          {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Large Pie Chart (8/12 Columns) */}
              <div className="lg:col-span-8 rounded-xl bg-card-bg border border-border shadow-sm p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                    <BarChart3 size={18} className="text-primary" />
                    <h2 className="text-[13px] font-bold text-foreground uppercase tracking-tight">Resource Distribution</h2>
                </div>
                <div className="flex-1 min-h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="45%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
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
                                wrapperStyle={{ fontSize: '11px', paddingTop: '20px', lineHeight: '20px' }} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
              </div>

              {/* Right Side: Small Summary Cards Stack (4/12 Columns) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-card-bg border border-border shadow-sm flex items-center gap-4 hover:border-green-200 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Active Resources</p>
                    <p className="text-2xl font-black text-foreground">{activeCount}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card-bg border border-border shadow-sm flex items-center gap-4 hover:border-red-200 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Out of Service</p>
                    <p className="text-2xl font-black text-foreground">{outOfServiceCount}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card-bg border border-border shadow-sm flex items-center gap-4 hover:border-blue-200 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Inventory</p>
                    <p className="text-2xl font-black text-foreground">{totalElements}</p>
                  </div>
                </div>

                <div className="mt-auto p-4 rounded-xl bg-gray-50/50 border border-dashed border-border">
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Management View:</span> Real-time distribution of assets across campus facilities.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isAdmin ? (
              <div className="rounded-xl bg-card-bg border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-gray-50/50 flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary" />
                  <h2 className="text-[14px] font-bold text-foreground">User Rating Distribution</h2>
                </div>
                <div className="p-6 space-y-4">
                  {ratingStats.map((stat) => (
                    <div key={stat.label} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-muted uppercase">
                        <span>{stat.label} Stars</span>
                        <button 
                          onClick={() => stat.items.length > 0 && setSelectedRatingItems({ label: stat.label, items: stat.items })}
                          className={`hover:underline hover:text-primary transition-colors cursor-pointer ${stat.items.length === 0 ? 'opacity-50 cursor-default' : 'font-black'}`}
                        >
                          {stat.items.length} Items
                        </button>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${stat.color} transition-all duration-500`} 
                          style={{ width: `${(stat.items.length / maxRatingCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-card-bg border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                    <h2 className="text-[14px] font-bold text-foreground">Top Rated Resources</h2>
                  </div>
                  <TrendingUp size={16} className="text-muted" />
                </div>
                <div className="p-4 space-y-3">
                  {topRated.map((res, index) => (
                    <Link key={res.id} href={`/facilities/${res.id}/`} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-white hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-bold text-muted w-4">#{index + 1}</span>
                        <span className="text-[13px] font-medium text-foreground truncate max-w-[180px]">{res.name}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-[12px] font-black text-yellow-700">{(res.averageRating || 0).toFixed(1)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-card-bg border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Medal size={18} className="text-primary" />
                  <h2 className="text-[14px] font-bold text-foreground">Most Popular Resources</h2>
                </div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Last 30 Days</span>
              </div>
              <div className="p-4 space-y-3">
                {mostUsed.map((res) => {
                  const count = res.bookingCountLastMonth || 0;
                  const badge = res.popularityBadge || (count >= 10 ? "GOLD" : count >= 5 ? "SILVER" : count >= 1 ? "BRONZE" : null);
                  return (
                    <div key={res.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-white">
                      <div>
                        <p className="text-[13px] font-medium text-foreground truncate max-w-[160px]">{res.name}</p>
                        <p className="text-[11px] text-muted">{count} Bookings</p>
                      </div>
                      {badge && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${getBadgeStyles(badge)}`}>
                          <Medal size={10} className="fill-current" />
                          {badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup / Modal for Rating Distribution */}
      {selectedRatingItems && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-foreground text-[16px]">{selectedRatingItems.label} Star Resources</h3>
                <p className="text-[12px] text-muted">{selectedRatingItems.items.length} items found</p>
              </div>
              <button 
                onClick={() => setSelectedRatingItems(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-muted"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {selectedRatingItems.items.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/facilities/${item.id}/`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-white hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-foreground group-hover:text-primary">{item.name}</span>
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <MapPin size={10} /> {item.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-[12px] font-black text-yellow-700">{(item.averageRating || 0).toFixed(1)}</span>
                    </div>
                    <ExternalLink size={14} className="text-muted group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-4 bg-gray-50 border-t border-border flex justify-end">
              <button 
                onClick={() => setSelectedRatingItems(null)}
                className="px-6 py-2 rounded-lg bg-primary text-white text-[13px] font-bold hover:bg-primary-dark transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card-bg pl-9 pr-4 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card-bg px-3 text-[13px] outline-none focus:border-primary"
        >
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "All Types" ? t : t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Location..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="h-10 w-full sm:w-44 rounded-lg border border-border bg-card-bg px-3 text-[13px] outline-none focus:border-primary"
        />
        <input
          type="number"
          placeholder="Min cap"
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
          className="h-10 w-full sm:w-28 rounded-lg border border-border bg-card-bg px-3 text-[13px] outline-none focus:border-primary"
          min={0}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-[14px] text-muted">Loading resources...</span>
        </div>
      )}

      {!loading && !error && resources.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {resources.map((resource) => {
              const count = resource.bookingCountLastMonth || 0;
              const effectiveBadge = resource.popularityBadge || 
                (count >= 10 ? "GOLD" : count >= 5 ? "SILVER" : count >= 1 ? "BRONZE" : null);

              return (
                <div key={resource.id} className="group relative rounded-xl bg-card-bg border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/facilities/${resource.id}/`}>
                    <div className="relative h-40 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {resource.imageUrl ? (
                        <img src={resource.imageUrl} alt={resource.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-muted text-[12px]">{resource.type.replace(/_/g, " ")}</span>
                      )}
                      <div className="absolute top-2 right-2">
                        <StatusBadge status={resource.status} />
                      </div>
                    </div>
                  </Link>

                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <Link href={`/facilities/${resource.id}/`} className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-foreground truncate">{resource.name}</p>
                      </Link>
                      {canManage && (
                        <div className="relative ml-2">
                          <button
                            type="button"
                            onClick={() => setOpenMenu(openMenu === resource.id ? null : resource.id)}
                            className="p-1 rounded hover:bg-gray-100 text-muted"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenu === resource.id && (
                            <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-border bg-white shadow-lg py-1">
                              <Link href={`/facilities/${resource.id}/edit/`} className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-gray-50">
                                <Pencil size={14} /> Edit
                              </Link>
                              {user?.role === "ADMIN" && (
                                <button
                                  type="button"
                                  disabled={deleting === resource.id}
                                  onClick={() => setDeleteTarget(resource.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 size={14} /> {deleting === resource.id ? "Deleting..." : "Delete"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1.5">
                      <p className="flex items-center gap-1.5 text-[12px] text-muted">
                        <MapPin size={12} /> {resource.location}
                      </p>

                      {resource.capacity && (
                        <p className="flex items-center gap-1.5 text-[12px] text-muted">
                          <Users size={12} /> Capacity: {resource.capacity}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5">
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={12} 
                              fill={star <= Math.round(resource.averageRating || 0) ? "currentColor" : "none"} 
                              className={star <= Math.round(resource.averageRating || 0) ? "text-yellow-400" : "text-gray-300"}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted font-medium">
                          ({(resource.averageRating || 0).toFixed(1)})
                        </span>
                      </div>

                      <p className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
                        <CalendarCheck size={12} className="text-primary/70" /> {count} Bookings
                      </p>

                      {/* Resource Type Capsule and Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-50 text-grey-600 border border-indigo-100">
                          {resource.type.replace(/_/g, " ")}
                        </span>

                        {effectiveBadge && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getBadgeStyles(effectiveBadge)}`}>
                            <Medal size={10} className="fill-current" />
                            {effectiveBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-[13px] text-muted">
                Showing {page * 12 + 1}–{Math.min((page + 1) * 12, totalElements)} of {totalElements}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-[13px] font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-[13px] text-muted px-2">Page {page + 1} of {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-[13px] font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Resource"
        message="Are you sure? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
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

export default function FacilitiesPage() {
  return (
    <MainLayout>
      <FacilitiesContent />
    </MainLayout>
  )
}