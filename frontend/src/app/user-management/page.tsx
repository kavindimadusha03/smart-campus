"use client";

import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import RoleGuard from "@/components/RoleGuard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Search, Pencil, X, Check, Loader2 } from "lucide-react";

const ROLES = ["USER", "TECHNICIAN", "MANAGER", "ADMIN"];

interface UserRecord {
  id: number;
  email: string;
  name: string;
  profilePicture: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface EditState {
  name: string;
  role: string;
  active: boolean;
}

function UserManagementContent() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: "",
    role: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<UserRecord[]>("/api/admin/users");
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setEditState({ name: user.name, role: user.role, active: user.isActive });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await apiFetch<UserRecord>(
        `/api/admin/users/${editingId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: editState.name,
            role: editState.role,
            active: editState.active,
          }),
        },
      );
      setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
      setEditingId(null);
    } catch {
      setErrorModal("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && u.isActive) ||
      (activeFilter === "inactive" && !u.isActive);
    return matchesSearch && matchesRole && matchesActive;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="ml-2 text-[14px] text-muted">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <PageHeader
          title="User Management"
          subtitle="Manage user accounts and permissions"
        />
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-[14px] text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchUsers();
            }}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered user${users.length !== 1 ? "s" : ""}`}
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card-bg pl-9 pr-4 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card-bg px-3 text-[13px] outline-none focus:border-primary"
        >
          <option value="All">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-2 text-[12px] font-medium transition-colors ${
                activeFilter === f
                  ? "bg-primary text-white"
                  : "bg-card-bg text-muted hover:bg-gray-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-card-bg border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-[13px] min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="px-5 py-3 text-left font-medium text-muted">
                User
              </th>
              <th className="px-5 py-3 text-left font-medium text-muted">
                Email
              </th>
              <th className="px-5 py-3 text-left font-medium text-muted">
                Role
              </th>
              <th className="px-5 py-3 text-left font-medium text-muted">
                Status
              </th>
              <th className="px-5 py-3 text-left font-medium text-muted">
                Joined
              </th>
              <th className="px-5 py-3 text-right font-medium text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-muted text-[13px]"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isEditing = editingId === u.id;

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${isEditing ? "bg-primary/3" : "hover:bg-gray-50"} ${saving && isEditing ? "opacity-60" : ""}`}
                  >
                    {/* Name column */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.profilePicture ? (
                          <img
                            src={u.profilePicture}
                            alt={u.name}
                            className="h-8 w-8 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[12px] font-semibold">
                            {(isEditing ? editState.name : u.name).charAt(0)}
                          </div>
                        )}
                        {isEditing ? (
                          <input
                            type="text"
                            value={editState.name}
                            onChange={(e) =>
                              setEditState((s) => ({
                                ...s,
                                name: e.target.value,
                              }))
                            }
                            className="h-8 w-40 rounded border border-primary/40 bg-white px-2 text-[13px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-foreground">
                            {u.name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email column */}
                    <td className="px-5 py-3.5 text-muted">{u.email}</td>

                    {/* Role column */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <select
                          value={editState.role}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              role: e.target.value,
                            }))
                          }
                          className="h-8 rounded border border-primary/40 bg-white px-2 text-[12px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={u.role} />
                      )}
                    </td>

                    {/* Status column */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() =>
                            setEditState((s) => ({ ...s, active: !s.active }))
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium border transition-colors ${
                            editState.active
                              ? "border-green-300 bg-green-50 text-green-700"
                              : "border-red-300 bg-red-50 text-red-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${editState.active ? "bg-green-500" : "bg-red-500"}`}
                          />
                          {editState.active ? "Active" : "Inactive"}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${u.isActive ? "text-green-600" : "text-red-500"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-green-500" : "bg-red-500"}`}
                          />
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>

                    {/* Joined column */}
                    <td className="px-5 py-3.5 text-muted">{u.createdAt}</td>

                    {/* Actions column */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={
                                saving || editState.name.trim().length === 0
                              }
                              className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <Check size={14} />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            disabled={editingId !== null}
                            className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                          >
                            <Pencil size={13} />
                            Edit
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

export default function UserManagementPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <UserManagementContent />
      </RoleGuard>
    </MainLayout>
  );
}
