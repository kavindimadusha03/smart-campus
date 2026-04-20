"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard/");
    }
  }, [user, isLoading, router]);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError("No credential received from Google");
      return;
    }
    setLoggingIn(true);
    setError(null);
    try {
      await login(response.credential);
      router.push("/dashboard/");
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Ambient background ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 15% 25%, rgba(201,168,76,0.09) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 75%, rgba(201,168,76,0.06) 0%, transparent 45%)
          `,
        }}
      />

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Orbixa"
            className="h-7 w-7 rounded-lg object-contain"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <span className="font-semibold text-[14px] text-foreground">Orbixa</span>
        </div>
        <span className="text-[12px] text-text-muted">Smart Campus</span>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-[380px]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          {/* ── Brand mark ── */}
          <div className="mb-10 text-center">
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-5"
              style={{
                background: "var(--foreground)",
                boxShadow: "0 0 0 1px rgba(201,168,76,0.20), 0 8px 24px rgba(28,26,23,0.15)",
              }}
            >
              <img
                src="/logo.png"
                alt="Orbixa"
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span style="color:#c9a84c;font-size:22px;font-weight:700;">O</span>`;
                  }
                }}
              />
            </div>

            <h1 className="text-[26px] font-bold text-foreground tracking-tight mb-2">
              Sign in to Orbixa
            </h1>
            <p className="text-[13.5px] text-text-secondary leading-relaxed">
              Use your university Google account to access the campus management platform.
            </p>
          </div>

          {/* ── Login box ── */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
              boxShadow: "0 2px 8px rgba(28,26,23,0.06), 0 8px 32px rgba(28,26,23,0.04)",
            }}
          >
            {loggingIn ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-[13px] text-text-secondary">Signing you in...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Label */}
                <p className="text-[11px] font-medium text-text-muted text-center tracking-widest uppercase">
                  Continue with
                </p>

                {/* Google button wrapper — styled overlay */}
                <div className="relative group">
                  {/* Custom styled button that sits behind */}
                  <div
                    
                  />
                  <div className="flex justify-center py-0.5">
                    <GoogleLogin
                      onSuccess={handleSuccess}
                      onError={() => setError("Google sign-in failed")}
                      size="large"
                      width="320"
                      text="signin_with"
                      shape="rectangular"
                      theme="outline"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-text-muted">university access only</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Access info pills */}
                <div className="grid grid-cols-2 gap-2">
                  {["Students", "Staff", "Technicians", "Admins"].map((role) => (
                    <div
                      key={role}
                      className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-medium"
                      style={{
                        background: "var(--background)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--primary)" }}
                      />
                      {role}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="mt-4 rounded-xl px-4 py-3 text-[12.5px] text-center"
                style={{
                  background: "var(--danger-light)",
                  color: "var(--danger)",
                  border: "1px solid rgba(192,57,43,0.15)",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* ── Footer note ── */}
          <p className="mt-6 text-center text-[11.5px] text-text-muted leading-relaxed">
            By signing in, you agree to the{" "}
            <span className="text-text-secondary underline underline-offset-2 cursor-pointer hover:text-primary transition-colors">
              campus usage policies
            </span>
            .
          </p>
        </div>
      </main>

      {/* ── Bottom bar ── */}
      <footer className="relative z-10 px-8 py-5 flex items-center justify-between">
        <p className="text-[11px] text-text-muted">
          © {new Date().getFullYear()} Orbixa
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "var(--success)" }}
          />
          <span className="text-[11px] text-text-muted">System Active</span>
        </div>
      </footer>
    </div>
  );
}