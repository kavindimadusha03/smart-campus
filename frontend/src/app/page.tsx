"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  CalendarDays,
  AlertTriangle,
  Bell,
  ArrowRight,
  ShieldCheck,
  Users,
  Zap,
  BookOpen,
  Clock,
  MapPin,
} from "lucide-react";
import { Github, Linkedin, Mail } from "lucide-react";

// ── Feature cards data ────────────────────────────────────────────────────

const features = [
  {
    icon: Building2,
    title: "Facilities & Assets",
    description:
      "Browse, search, and book campus rooms, labs, and equipment with real-time availability.",
    color: "bg-amber-50 text-amber-700",
    delay: "0ms",
  },
  {
    icon: CalendarDays,
    title: "Smart Bookings",
    description:
      "Manage all your reservations in one place. Approvals, reminders, and history — effortless.",
    color: "bg-stone-100 text-stone-700",
    delay: "80ms",
  },
  {
    icon: AlertTriangle,
    title: "Incident Reporting",
    description:
      "Report and track campus issues instantly. Stay informed on every status change.",
    color: "bg-amber-50 text-amber-700",
    delay: "160ms",
  },
  {
    icon: Bell,
    title: "Live Notifications",
    description:
      "Get instant alerts on bookings, approvals, and incidents — nothing slips through.",
    color: "bg-stone-100 text-stone-700",
    delay: "240ms",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Students, technicians, managers, and admins — each with the right tools for their role.",
    color: "bg-amber-50 text-amber-700",
    delay: "320ms",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description:
      "Google OAuth authentication with role-based permissions. Your data stays protected.",
    color: "bg-stone-100 text-stone-700",
    delay: "400ms",
  },
];

const steps = [
  {
    number: "01",
    icon: ShieldCheck,
    title: "Sign in securely",
    description: "Use your university Google account — no separate password needed.",
  },
  {
    number: "02",
    icon: MapPin,
    title: "Find a resource",
    description: "Browse facilities, labs, and equipment across all campus buildings.",
  },
  {
    number: "03",
    icon: Clock,
    title: "Book & track",
    description: "Reserve in seconds. Track your bookings and get notified on every update.",
  },
];

const stats = [
  { value: "50+", label: "Campus Facilities" },
  { value: "24/7", label: "System Uptime" },
  { value: "4", label: "User Roles" },
  { value: "Real-time", label: "Notifications" },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, isLoading, } = useAuth();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard/");
    }
  }, [user, isLoading, router]);

  // Trigger entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (isLoading || user) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)" }}
    >
      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex h-14 items-center justify-between px-6 md:px-10 border-b"
        style={{
          background: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Orbixa" className="h-7 w-7 rounded-md object-contain" />
          <span
            className="font-semibold text-[15px]"
            style={{ color: "var(--foreground)" }}
          >
            Orbixa
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login/"
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors hover:opacity-80"
            style={{
              background: "var(--primary)",
              color: "var(--primary-fg)",
            }}
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 overflow-hidden"
      >
        {/* Background texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, rgba(201,168,76,0.10) 0%, transparent 55%),
                              radial-gradient(circle at 75% 70%, rgba(201,168,76,0.07) 0%, transparent 50%)`,
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px),
                              linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        <div
          className="relative z-10 max-w-3xl mx-auto"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* Headline */}
          <h1
            className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6"
            style={{ color: "var(--foreground)" }}
          >
            Your campus,{" "}
            <span style={{ color: "var(--primary)" }}>effortlessly</span>{" "}
            managed.
          </h1>

          {/* Subtext */}
          <p
            className="text-[16px] md:text-[18px] leading-relaxed max-w-xl mx-auto mb-10"
            style={{ color: "var(--text-secondary)" }}
          >
            Book facilities, report incidents, and stay notified — all from one
            place. Built for students, staff, and administrators.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login/"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{
                background: "var(--primary)",
                color: "var(--primary-fg)",
                boxShadow: "0 4px 16px rgba(201,168,76,0.30)",
              }}
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-medium border transition-colors hover:opacity-80"
              style={{
                borderColor: "var(--border-strong)",
                color: "var(--text-secondary)",
                background: "var(--card-bg)",
              }}
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section
        className="border-y px-6 py-8"
        style={{
          borderColor: "var(--border)",
          background: "var(--background-secondary)",
        }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p
                className="text-2xl md:text-3xl font-bold"
                style={{ color: "var(--primary)" }}
              >
                {s.value}
              </p>
              <p
                className="text-[12px] mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium mb-4 border"
              style={{
                background: "var(--primary-light)",
                color: "var(--primary-dark)",
                borderColor: "rgba(201,168,76,0.25)",
              }}
            >
              <Zap size={11} />
              Everything you need
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Built for campus life
            </h2>
            <p
              className="mt-3 text-[15px] max-w-md mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              From booking a lab to reporting a broken projector — Orbixa
              handles it all in one streamlined platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl p-6 border transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    background: "var(--card-bg)",
                    borderColor: "var(--card-border)",
                    boxShadow: "var(--card-shadow)",
                    transitionDelay: f.delay,
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  }}
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${f.color}`}
                  >
                    <Icon size={20} />
                  </div>
                  <h3
                    className="text-[14px] font-semibold mb-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section
        className="px-6 py-20 border-t"
        style={{
          borderColor: "var(--border)",
          background: "var(--background-secondary)",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              How it works
            </h2>
            <p
              className="mt-3 text-[15px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Up and running in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.number} className="relative flex flex-col items-center text-center">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div
                      className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px"
                      style={{ background: "var(--border-strong)" }}
                    />
                  )}
                  <div
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl mb-5 border"
                    style={{
                      background: "var(--card-bg)",
                      borderColor: "var(--card-border)",
                      boxShadow: "var(--card-shadow)",
                    }}
                  >
                    <Icon size={24} style={{ color: "var(--primary)" }} />
                    <span
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-fg)",
                      }}
                    >
                      {s.number.slice(1)}
                    </span>
                  </div>
                  <h3
                    className="text-[14px] font-semibold mb-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div
          className="max-w-3xl mx-auto rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
          style={{
            background: "var(--foreground)",
          }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 0%, rgba(201,168,76,0.18) 0%, transparent 60%)`,
            }}
          />
          <div className="relative z-10">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "#f7f5f0" }}
            >
              Ready to take control?
            </h2>
            <p className="text-[15px] mb-8" style={{ color: "#9e9688" }}>
              Sign in with your university Google account and access everything
              Orbixa has to offer.
            </p>
            <Link
              href="/login/"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-[14px] font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: "var(--primary)",
                color: "var(--primary-fg)",
                boxShadow: "0 4px 20px rgba(201,168,76,0.35)",
              }}
            >
              Sign In with Google
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card-bg px-6 py-8 text-sm text-muted">
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

    {/* Branding */}
    <div>
      <h2 className="text-lg font-semibold text-foreground">OrBixa</h2>
      <p className="mt-2">
        Smart campus management platform for handling facilities, bookings, and incidents efficiently.
      </p>
    </div>

    {/* Policies (Short & Real) */}
    <div>
      <h3 className="font-semibold text-foreground mb-2">Policies</h3>
      <p className="text-xs leading-relaxed">
        We respect your privacy. Your data is securely stored and used only for system functionality.
        By using this platform, you agree to basic usage terms including responsible access and data handling.
      </p>
    </div>

    {/* Social / Contact */}
    <div>
      <h3 className="font-semibold text-foreground mb-2">Connect</h3>
      <div className="flex gap-4 mt-2">
        <a href="https://github.com/kavindimadusha03/smart-campus.git" className="flex items-center gap-1 hover:text-primary">
          <Github size={16} />
          GitHub
        </a>
        <a href="#" className="flex items-center gap-1 hover:text-primary">
          <Linkedin size={16} />
          LinkedIn
        </a>
        <a href="#" className="flex items-center gap-1 hover:text-primary">
          <Mail size={16} />
          Email
        </a>
      </div>
    </div>

  </div>

  {/* Bottom Bar */}
  <div className="mt-6 pt-4 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs">
    <p>
      © {new Date().getFullYear()} Orbixa. All rights reserved.
    </p>

    <div className="flex gap-4 mt-2 md:mt-0">
      <span className="text-green-600">● System Active</span>
      <span>v1.0.0</span>
    </div>
  </div>
</footer>
    </div>
  );
}