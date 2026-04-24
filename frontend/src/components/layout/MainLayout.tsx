"use client";

import { type ReactNode } from "react";
import NavBar from "./NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Github, Linkedin, Mail, Circle } from "lucide-react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
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
    </ProtectedRoute>
  );
}