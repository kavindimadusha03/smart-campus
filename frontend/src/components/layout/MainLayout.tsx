"use client";

import { type ReactNode } from "react";
import NavBar from "./NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Github, Linkedin, Mail, ChevronUp, Heart, ArrowRight, Calendar, Building, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function MainLayout({ children }: { children: ReactNode }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Check if we should show hero (only on home page)
  const isHomePage = typeof window !== 'undefined' && window.location.pathname === '/';

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <NavBar />
        
        {/* Hero Section */}
        {isHomePage && (
          <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-background-secondary">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Content */}
                <div className="space-y-6 md:space-y-8">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light/20 border border-primary/20 text-primary-dark text-sm font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    Smart Campus Management Platform
                  </div>

                  {/* Main Heading */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                    <span className="text-foreground">Streamline Your</span>
                    <br />
                    <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                      Campus Operations
                    </span>
                  </h1>

                  {/* Description */}
                  <p className="text-base md:text-lg text-text-secondary leading-relaxed max-w-lg">
                    OrBixa provides a centralized platform for managing facilities, 
                    handling bookings, and resolving incidents efficiently. 
                    Transform your campus management experience today.
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center md:text-left">
                      <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
                      <div className="text-xs md:text-sm text-text-muted mt-1">Active Users</div>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="text-2xl md:text-3xl font-bold text-primary">1.2k+</div>
                      <div className="text-xs md:text-sm text-text-muted mt-1">Bookings Made</div>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="text-2xl md:text-3xl font-bold text-primary">98%</div>
                      <div className="text-xs md:text-sm text-text-muted mt-1">Satisfaction</div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button className="group px-6 py-3 bg-primary hover:bg-primary-dark text-primary-fg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                      Get Started
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="px-6 py-3 border-2 border-border hover:border-primary text-text-secondary hover:text-primary font-semibold rounded-lg transition-all duration-300">
                      Learn More
                    </button>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Calendar size={16} className="text-primary" />
                      <span>Easy Bookings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Building size={16} className="text-primary" />
                      <span>Facility Management</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <AlertCircle size={16} className="text-primary" />
                      <span>Incident Tracking</span>
                    </div>
                  </div>
                </div>

                {/* Right Image */}
                <div className="relative lg:ml-8">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl transform lg:translate-y-0 hover:translate-y-[-8px] transition-all duration-500">
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none z-10" />
                    
                    {/* Image */}
                    <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square">
                      <Image
                        src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
                        alt="Modern Campus Management"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                    
                    {/* Floating Card 1 */}
                    <div className="absolute top-8 right-8 bg-card-bg/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-20 animate-bounce-slow">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                        <span className="text-sm font-medium text-foreground">System Active</span>
                      </div>
                    </div>

                    {/* Floating Card 2 */}
                    <div className="absolute bottom-8 left-8 bg-card-bg/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-20 animate-float">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary" />
                        <span className="text-sm font-medium text-foreground">12 bookings today</span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
                </div>
              </div>
            </div>

            {/* Wave Divider */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
                <path fill="var(--card-bg)" fillOpacity="1" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
              </svg>
            </div>
          </section>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        
        <footer className="border-t border-border bg-card-bg mt-auto">
          {/* Main Footer Content */}
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
              
              {/* Brand Section */}
              <div className="md:col-span-1">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  OrBixa
                </h2>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                  Smart campus management platform for handling facilities, bookings, and incidents efficiently.
                </p>
                <div className="mt-4 flex gap-3">
                  <a 
                    href="https://github.com/kavindimadusha03/smart-campus.git" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-background-secondary hover:bg-primary-light/20 transition-all duration-200 text-text-secondary hover:text-primary"
                  >
                    <Github size={18} />
                  </a>
                  <a 
                    href="#" 
                    className="p-2 rounded-lg bg-background-secondary hover:bg-primary-light/20 transition-all duration-200 text-text-secondary hover:text-primary"
                  >
                    <Linkedin size={18} />
                  </a>
                  <a 
                    href="#" 
                    className="p-2 rounded-lg bg-background-secondary hover:bg-primary-light/20 transition-all duration-200 text-text-secondary hover:text-primary"
                  >
                    <Mail size={18} />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                  Quick Links
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/dashboard" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="/bookings" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Bookings
                    </a>
                  </li>
                  <li>
                    <a href="/facilities" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Facilities
                    </a>
                  </li>
                  <li>
                    <a href="/incidents" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Incidents
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                  Support
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/help" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="/contact" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="/feedback" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Feedback
                    </a>
                  </li>
                  <li>
                    <a href="/status" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      System Status
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal & Policies */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                  Legal
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/privacy" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="/cookies" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Cookie Policy
                    </a>
                  </li>
                  <li>
                    <a href="/security" className="text-text-secondary hover:text-primary transition-colors duration-200">
                      Security
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border bg-background-secondary/50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs">
                <p className="text-text-muted">
                  © {new Date().getFullYear()} OrBixa. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    <span className="text-text-secondary">System Active</span>
                  </div>
                  <span className="text-border">•</span>
                  <span className="text-text-muted">v1.0.0</span>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1 text-text-muted">
                    <span>Made with</span>
                    <Heart size={10} className="text-danger fill-danger" />
                    <span>for campus community</span>
                  </div>
                </div>
                <button
                  onClick={scrollToTop}
                  className="flex items-center gap-1 text-text-muted hover:text-primary transition-all duration-200 group"
                >
                  <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span>Back to top</span>
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}