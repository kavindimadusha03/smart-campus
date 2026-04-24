"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Mail, Shield, LogOut, Loader2 } from "lucide-react";

function ProfileContent() {
  const { user, logout, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My Profile" subtitle="View and manage your account" />

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-6 pb-6 border-b border-border">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold ring-4 ring-border">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {user?.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail size={14} className="text-muted" />
                <span className="text-[13px] text-muted">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Shield size={14} className="text-muted" />
                <StatusBadge status={user?.role || "USER"} />
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <h3 className="text-[15px] font-semibold text-foreground mb-4">
            Edit Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaveMsg(null);
                }}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="h-10 w-full rounded-lg border border-border bg-gray-50 px-3 text-[13px] text-muted cursor-not-allowed"
              />
              <p className="text-[11px] text-muted mt-1">
                Email is managed by Google OAuth and cannot be changed.
              </p>
            </div>
            {saveMsg && (
              <p
                className={`text-[12px] ${saveMsg.type === "success" ? "text-green-600" : "text-red-600"}`}
              >
                {saveMsg.text}
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                disabled={saving || !name.trim()}
                onClick={async () => {
                  setSaving(true);
                  setSaveMsg(null);
                  try {
                    await updateProfile(name.trim(), user?.profilePicture);
                    setSaveMsg({ type: "success", text: "Profile updated successfully." });
                  } catch (err) {
                    setSaveMsg({
                      type: "error",
                      text: err instanceof Error ? err.message : "Failed to save",
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="rounded-xl bg-card-bg border border-border shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-foreground mb-2">
            Sign Out
          </h3>
          <p className="text-[13px] text-muted mb-4">
            Sign out of your UniFlow account on this device.
          </p>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <MainLayout>
      <ProfileContent />
    </MainLayout>
  );
}
