"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scissors, ShieldCheck, UserCheck, ArrowRight, CheckCircle2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { loginUser } from "@/lib/auth/session";
import { Logo } from "@/components/shared/Logo";

export default function LandingPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [workerInput, setWorkerInput] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = workerInput.trim();
    if (!id) return;

    setIsLoggingIn(true);
    try {
      const res = await loginUser({ usernameOrId: id });
      if (res.success && res.session) {
        localStorage.setItem("mk_session", JSON.stringify(res.session));
        success(`Welcome, ${res.session.user.name}`);
        router.push("/worker");
      } else {
        error(res.error || "Worker record not found. Please contact floor supervisor.");
      }
    } catch {
      error("Authentication service error. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* Brand Navigation Bar */}
      <header className="border-b border-navy-800 bg-navy-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo variant="horizontal" size="sm" subtitle="Textile Solutions For A Better Tomorrow" />

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-xs transition-all shadow-subtle"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Portal Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Role Portals */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <Logo variant="logo-full" size="lg" />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-navy-900 border border-gold-400/30 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-subtle">
            <Activity className="h-3.5 w-3.5" />
            Active Production Operations
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Precision Garment Piece-Tracking & Audited Wage Management
          </h2>
          <p className="mt-4 text-sm sm:text-base text-charcoal-300">
            Dedicated system for textile operators and factory supervisors. Track Overlock, Flatlock, Singer, Ironing, and Checking piece completions with immutable rate snapshots.
          </p>
        </div>

        {/* Dual Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Worker Mobile-First Access Card */}
          <div className="rounded-2xl border border-navy-800 bg-navy-900/90 p-6 sm:p-8 flex flex-col justify-between shadow-elevated relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Scissors className="h-28 w-28 text-gold-400" />
            </div>

            <div>
              <div className="inline-flex p-3 rounded-xl bg-navy-950 border border-gold-400/30 text-gold-400 mb-4 shadow-subtle">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Operator / Worker Portal</h3>
              <p className="mt-2 text-xs sm:text-sm text-charcoal-300">
                Optimized for factory floor touchscreens. Submit daily piece counts in seconds, view today&apos;s earnings, and inspect weekly salary payment status.
              </p>

              {/* Operator Sign In Form */}
              <form onSubmit={handleWorkerSubmit} className="mt-6 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-300 uppercase tracking-wider mb-1.5">
                    Worker ID or Registered Mobile
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Worker ID"
                    value={workerInput}
                    onChange={(e) => setWorkerInput(e.target.value)}
                    className="w-full rounded-xl border border-navy-700 bg-navy-950 px-3.5 py-3 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-gold-400 font-medium"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoggingIn}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold h-12 rounded-xl shadow-card"
                >
                  Enter Worker Portal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-xs text-gold-400 hover:text-gold-300 font-medium transition-colors"
                  >
                    Go to Full Login Portal →
                  </Link>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-navy-800 flex items-center justify-between text-xs text-charcoal-400">
              <span className="flex items-center gap-1.5 text-gold-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Mobile-first touch UI
              </span>
              <span>48px touch targets</span>
            </div>
          </div>

          {/* Admin Management Card */}
          <div className="rounded-2xl border border-navy-800 bg-navy-900/90 p-6 sm:p-8 flex flex-col justify-between shadow-elevated relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <ShieldCheck className="h-28 w-28 text-gold-400" />
            </div>

            <div>
              <div className="inline-flex p-3 rounded-xl bg-navy-950 border border-gold-400/30 text-gold-400 mb-4 shadow-subtle">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Factory Admin Console</h3>
              <p className="mt-2 text-xs sm:text-sm text-charcoal-300">
                Manage worker records, configure operation piece rates, monitor daily floor output, review weekly wages, approve adjustments, mark payments, and export CSV reports.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-xl bg-navy-950 p-4 border border-navy-800 text-xs text-charcoal-300 space-y-2">
                  <div className="flex justify-between font-mono">
                    <span className="text-charcoal-400">Access Level:</span>
                    <span className="text-white font-semibold">Authorized Supervisors &amp; Admins</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-charcoal-400">Security:</span>
                    <span className="text-gold-400">Dual-Layer RLS Authorization</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-charcoal-400">Auditing:</span>
                    <span className="text-emerald-400">Immutable Audit Trail</span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-800 hover:bg-navy-750 text-white font-semibold text-sm transition-colors border border-navy-700 shadow-card"
                >
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-navy-800 flex items-center justify-between text-xs text-charcoal-400">
              <span className="flex items-center gap-1.5 text-gold-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Full RLS Database Isolation
              </span>
              <span>1-Year Audited History</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800 px-6 py-6 text-center text-xs text-charcoal-500">
        <p>© 2026 MK APPREALS. Specialized Textile Production & Wage Settlement System.</p>
        <p className="mt-1 text-gold-400/80">Textile Solutions For A Better Tomorrow</p>
      </footer>
    </div>
  );
}
