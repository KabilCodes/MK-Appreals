"use client";

import React, { useState } from "react";
import { formatRate } from "@/lib/utils/currency";
import { User, Scissors, LogOut, ShieldCheck, CheckCircle2, AlertOctagon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useWorkerSession } from "@/hooks/use-worker-session";
import { WorkerLoadingScreen } from "@/components/worker/WorkerLoadingScreen";
import { WorkerErrorScreen } from "@/components/worker/WorkerErrorScreen";

export default function WorkerProfilePage() {
  const { worker, operationName, currentRate, isLoading, error, refresh, logout } =
    useWorkerSession();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  if (isLoading) {
    return <WorkerLoadingScreen message="Loading worker profile..." />;
  }

  if (error || !worker) {
    return (
      <WorkerErrorScreen
        message={error || "Could not load worker profile."}
        onRetry={refresh}
        onLogin={logout}
      />
    );
  }

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Page Title */}
      <div className="pb-2 border-b border-charcoal-200">
        <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
          Worker Profile
        </h2>
        <p className="text-xs text-charcoal-500">
          Account details and production floor operation assignment
        </p>
      </div>

      {/* Main Profile Card (Section 15) */}
      <div className="rounded-2xl bg-white border border-charcoal-200/90 p-5 shadow-card space-y-4">
        {/* Worker Identity Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-charcoal-100">
          <div className="h-14 w-14 rounded-2xl bg-navy-900 text-white flex items-center justify-center font-bold text-xl shadow-subtle shrink-0 border border-gold-500/30">
            <User className="h-7 w-7 text-gold-400" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-navy-900 tracking-tight leading-tight">
              {worker.full_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-navy-900 bg-warm-100 px-2.5 py-0.5 rounded-full border border-charcoal-200 font-bold">
                ID: {worker.worker_id}
              </span>
              {worker.email && (
                <span className="text-[11px] text-charcoal-500 truncate max-w-[150px]">
                  {worker.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Read-only Floor Details */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-charcoal-100">
            <span className="text-charcoal-500 font-medium">Assigned Operation</span>
            <span className="font-bold text-navy-900 flex items-center gap-1.5 text-sm">
              <Scissors className="h-3.5 w-3.5 text-gold-600" />
              {operationName}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-charcoal-100">
            <span className="text-charcoal-500 font-medium">Current Piece Rate</span>
            <span className="font-mono font-extrabold text-navy-900 text-sm">
              {formatRate(currentRate)} <span className="text-charcoal-500 font-normal">/ piece</span>
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-charcoal-100">
            <span className="text-charcoal-500 font-medium">Mobile Contact</span>
            <span className="font-mono font-semibold text-charcoal-800">
              {worker.mobile || "Not specified"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-charcoal-100">
            <span className="text-charcoal-500 font-medium">Account Status</span>
            <span
              className={`font-bold flex items-center gap-1 text-xs ${
                worker.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> {worker.status}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-charcoal-500 font-medium">Security Isolation</span>
            <span className="text-navy-900 font-semibold flex items-center gap-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Worker Portal Role (RLS Active)
            </span>
          </div>
        </div>

        {/* Read-Only Notice (Section 15) */}
        <div className="p-3 rounded-xl bg-warm-100 border border-charcoal-200/80 flex items-start gap-2 text-xs text-charcoal-600">
          <Lock className="h-4 w-4 text-charcoal-500 shrink-0 mt-0.5" />
          <span>
            Assigned operation, piece rates, and worker profile are strictly read-only and managed by factory administration.
          </span>
        </div>
      </div>

      {/* Sign Out CTA (Min 48px touch target) */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="w-full min-h-[48px] rounded-xl flex items-center justify-center gap-2 font-bold border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of MK APPREALS</span>
        </Button>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={logout}
        title="Sign Out"
        description="Are you sure you want to sign out of the MK APPREALS Worker Portal?"
        confirmText="Yes, Sign Out"
        variant="danger"
      />
    </div>
  );
}
