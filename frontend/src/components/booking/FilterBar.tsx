"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

export interface FilterState {
  search: string;
  status: string;
  resourceId: string;
  dateFrom: string;
  dateTo: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resources: { id: number; name: string }[];
  showStatusFilter?: boolean;
}

export default function FilterBar({
  filters,
  onChange,
  resources,
  showStatusFilter = true,
}: FilterBarProps) {
  const [local, setLocal] = useState<FilterState>(filters);

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(t);
  }, [local]);

  const hasFilters =
    local.search || local.status || local.resourceId || local.dateFrom || local.dateTo;

  const clearAll = () => {
    setLocal({ search: "", status: "", resourceId: "", dateFrom: "", dateTo: "" });
  };

  return (
    <div className="rounded-xl bg-card-bg border border-border p-4 space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by purpose, resource, or requester..."
            value={local.search}
            onChange={(e) => setLocal({ ...local, search: e.target.value })}
            className="h-10 w-full rounded-lg border border-input-border bg-input-bg pl-9 pr-3 text-[13px] text-foreground placeholder:text-placeholder outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Status */}
        {showStatusFilter && (
          <select
            value={local.status}
            onChange={(e) => setLocal({ ...local, status: e.target.value })}
            className="h-10 rounded-lg border border-input-border bg-input-bg px-3 text-[13px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 md:w-40"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}

        {/* Resource */}
        <select
          value={local.resourceId}
          onChange={(e) => setLocal({ ...local, resourceId: e.target.value })}
          className="h-10 rounded-lg border border-input-border bg-input-bg px-3 text-[13px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 md:w-48"
        >
          <option value="">All Resources</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted">From</span>
            <input
              type="date"
              value={local.dateFrom}
              onChange={(e) => setLocal({ ...local, dateFrom: e.target.value })}
              className="h-9 rounded-lg border border-input-border bg-input-bg px-2 text-[13px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted">To</span>
            <input
              type="date"
              value={local.dateTo}
              onChange={(e) => setLocal({ ...local, dateTo: e.target.value })}
              className="h-9 rounded-lg border border-input-border bg-input-bg px-2 text-[13px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-[12px] text-muted hover:text-foreground transition-colors"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

