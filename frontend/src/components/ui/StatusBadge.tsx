const styleMap: Record<string, string> = {
  APPROVED: "bg-success-light text-success",
  PENDING: "bg-warning-light text-warning",
  REJECTED: "bg-danger-light text-danger",
  CANCELLED: "bg-background-secondary text-muted",
  OPEN: "bg-info-light text-info",
  IN_PROGRESS: "bg-warning-light text-warning",
  "In Progress": "bg-warning-light text-warning",
  RESOLVED: "bg-success-light text-success",
  Resolved: "bg-success-light text-success",
  CLOSED: "bg-background-secondary text-muted",
  ACTIVE: "bg-success text-white",
  OUT_OF_SERVICE: "bg-danger text-white",
  "AVAILABLE NOW": "bg-success text-white",
  "IN USE": "bg-text-secondary text-white",
  MAINTENANCE: "bg-danger text-white",
  LOW: "bg-info-light text-info",
  MEDIUM: "bg-warning-light text-warning",
  HIGH: "bg-warning-light text-warning",
  CRITICAL: "bg-danger-light text-danger",
  USER: "bg-info-light text-info",
  TECHNICIAN: "bg-primary-light text-primary-dark",
  MANAGER: "bg-primary-light text-primary-dark",
  ADMIN: "bg-danger-light text-danger",
};

const dotMap: Record<string, string> = {
  APPROVED: "bg-success",
  PENDING: "bg-warning",
  REJECTED: "bg-danger",
  CANCELLED: "bg-muted",
  OPEN: "bg-info",
  IN_PROGRESS: "bg-warning",
  "In Progress": "bg-warning",
  RESOLVED: "bg-success",
  Resolved: "bg-success",
  CLOSED: "bg-muted",
  ACTIVE: "bg-white",
  OUT_OF_SERVICE: "bg-white",
  "AVAILABLE NOW": "bg-white",
  "IN USE": "bg-white",
  MAINTENANCE: "bg-white",
  LOW: "bg-info",
  MEDIUM: "bg-warning",
  HIGH: "bg-warning",
  CRITICAL: "bg-danger",
  USER: "bg-info",
  TECHNICIAN: "bg-primary",
  MANAGER: "bg-primary",
  ADMIN: "bg-danger",
};

export default function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  const dotColor = dotMap[status] || "bg-muted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${styleMap[status] || "bg-background-secondary text-muted"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}