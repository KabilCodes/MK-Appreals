"use client";

import React, { useState } from "react";
import { useWorkerSession } from "@/hooks/use-worker-session";
import { WorkerLoadingScreen } from "@/components/worker/WorkerLoadingScreen";
import { WorkerErrorScreen } from "@/components/worker/WorkerErrorScreen";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatRate, calculateEarnings } from "@/lib/utils/currency";
import { formatDateDisplay, formatDateISO } from "@/lib/utils/date";
import { store } from "@/lib/db/store";
import {
  Scissors,
  TrendingUp,
  Plus,
  Calendar,
  CheckCircle2,
  Wallet,
  Clock,
  Shirt,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export default function WorkerHomePage() {
  const { success, error: toastError } = useToast();
  const {
    session,
    worker,
    operationName,
    currentRate,
    todayPieces,
    todayEarnings,
    thisWeekPieces,
    thisWeekEarnings,
    weeklySalary,
    isLoading,
    error,
    isProfileMissing,
    refresh,
    logout,
  } = useWorkerSession();

  // Add pieces modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pieceInput, setPieceInput] = useState<string>("250");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedCount, setLastSubmittedCount] = useState<number | null>(null);

  // 1. Loading State (Section 3 & 16)
  if (isLoading) {
    return <WorkerLoadingScreen message="Loading your production dashboard..." />;
  }

  // 2. Error State (Section 4 & 17)
  if (error || !worker || isProfileMissing) {
    return (
      <WorkerErrorScreen
        title={isProfileMissing ? "Worker Profile Not Found" : "Something went wrong"}
        message={
          error ||
          "Worker profile could not be found. Please check your credentials or contact your supervisor."
        }
        onRetry={refresh}
        onLogin={logout}
      />
    );
  }

  // Derived Greeting (Section 7)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const parsedPieceCount = parseInt(pieceInput, 10) || 0;
  const potentialEarning = calculateEarnings(parsedPieceCount, currentRate);

  const handleQuickAdd = (addCount: number) => {
    const current = parseInt(pieceInput, 10) || 0;
    setPieceInput(String(current + addCount));
  };

  const handleOpenConfirm = () => {
    if (parsedPieceCount <= 0) {
      toastError("Please enter a valid piece count greater than 0");
      return;
    }
    if (parsedPieceCount > 25000) {
      toastError("Unrealistic piece count. Maximum 25,000 allowed per entry.");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      store.submitPieceEntry({
        worker_id: worker.id,
        piece_count: parsedPieceCount,
        production_date: formatDateISO(new Date()),
      });

      setLastSubmittedCount(parsedPieceCount);
      success(`✓ Production submitted successfully: ${parsedPieceCount} pieces.`);
      setIsConfirmOpen(false);
      setIsAddOpen(false);
      setPieceInput("250");
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit pieces";
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* =======================================================================
          SECTION 7: WORKER WELCOME & LIVE OPERATION RATE
          ======================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-charcoal-200/90 shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-charcoal-500 block">
            {getGreeting()},
          </span>
          <h2 className="text-lg font-extrabold text-navy-900 tracking-tight leading-tight">
            {worker.full_name}
          </h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-navy-900 text-white font-mono text-[11px] font-bold">
              <Scissors className="h-3 w-3 text-gold-400" />
              {operationName.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="text-right pl-3 border-l border-charcoal-200/70">
          <span className="text-[10px] uppercase font-bold text-charcoal-400 tracking-wider block">
            Piece Rate
          </span>
          <span className="text-base font-extrabold font-mono text-gold-600 block mt-0.5">
            {formatRate(currentRate)}
          </span>
          <span className="text-[10px] text-charcoal-500 font-medium">per piece</span>
        </div>
      </div>

      {/* =======================================================================
          SECTION 8: TODAY'S PRODUCTION HERO CARD
          ======================================================================= */}
      <div className="rounded-2xl bg-textile-pattern text-white p-5 border border-navy-800 shadow-elevated relative overflow-hidden">
        {/* Subtle Decorative Aura */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-navy-800/80">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-xs font-bold text-gold-400 uppercase tracking-wider">
              TODAY&apos;S PRODUCTION
            </span>
          </div>
          <span className="text-xs font-mono text-charcoal-300">
            {formatDateDisplay(formatDateISO(new Date()))}
          </span>
        </div>

        <div className="my-4 flex items-baseline justify-between">
          <div>
            <div className="text-4xl font-extrabold font-mono text-white tracking-tight">
              {todayPieces.toLocaleString()}
            </div>
            <span className="text-xs text-charcoal-300 font-medium">
              Pieces completed today
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-charcoal-300 font-semibold block">
              Estimated Earnings
            </span>
            <span className="text-2xl font-bold font-mono text-gold-300 block">
              {formatCurrency(todayEarnings)}
            </span>
          </div>
        </div>

        {/* Section 8 Primary Action: + Add Pieces (Min 48px touch target) */}
        <Button
          onClick={() => setIsAddOpen(true)}
          variant="primary"
          className="w-full bg-gold-500 hover:bg-gold-600 active:bg-gold-700 text-navy-950 font-extrabold text-sm py-3.5 rounded-xl shadow-elevated flex items-center justify-center gap-2 transition-all min-h-[48px]"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          <span>+ Add Pieces</span>
        </Button>
      </div>

      {/* Last Submission Banner */}
      {lastSubmittedCount !== null && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs animate-fade-in shadow-subtle">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            ✓ Successfully submitted {lastSubmittedCount} pieces. Floor log updated!
          </span>
        </div>
      )}

      {/* =======================================================================
          SECTION 10: THIS WEEK SUMMARY
          ======================================================================= */}
      <div className="rounded-2xl bg-white border border-charcoal-200/90 p-4 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              THIS WEEK
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-charcoal-500">
            Current Work Week
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="p-2 rounded-xl bg-warm-100 border border-charcoal-200/60">
            <span className="text-[10px] text-charcoal-500 uppercase font-bold block">
              Total Pieces
            </span>
            <span className="text-base font-extrabold font-mono text-navy-900 block mt-0.5">
              {thisWeekPieces.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-warm-100 border border-charcoal-200/60">
            <span className="text-[10px] text-charcoal-500 uppercase font-bold block">
              Rate
            </span>
            <span className="text-base font-extrabold font-mono text-gold-700 block mt-0.5">
              {formatRate(currentRate)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-warm-100 border border-charcoal-200/60">
            <span className="text-[10px] text-charcoal-500 uppercase font-bold block">
              Estimated
            </span>
            <span className="text-base font-extrabold font-mono text-navy-900 block mt-0.5">
              {formatCurrency(thisWeekEarnings)}
            </span>
          </div>
        </div>
      </div>

      {/* =======================================================================
          SECTION 11: WEEKLY SALARY CARD
          ======================================================================= */}
      <div className="rounded-2xl bg-white border border-charcoal-200/90 p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-charcoal-100">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-navy-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              WEEKLY SALARY
            </h3>
          </div>
          <StatusBadge status={weeklySalary?.status || "PENDING"} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-charcoal-500 block">Estimated Amount</span>
            <span className="text-lg font-bold font-mono text-charcoal-800">
              {formatCurrency(weeklySalary?.calculated_amount ?? thisWeekEarnings)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-charcoal-500 block">Final Settlement</span>
            <span className="text-xl font-extrabold font-mono text-navy-900">
              {formatCurrency(
                weeklySalary?.final_salary ?? weeklySalary?.calculated_amount ?? thisWeekEarnings
              )}
            </span>
          </div>
        </div>

        {weeklySalary?.payment_date && weeklySalary.status === "PAID" && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-medium">Disbursed on</span>
            <span className="font-bold text-emerald-900 font-mono">
              {formatDateDisplay(weeklySalary.payment_date)}
            </span>
          </div>
        )}
      </div>

      {/* =======================================================================
          SECTION 9: ADD PRODUCTION MODAL
          ======================================================================= */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Production"
      >
        <div className="space-y-4">
          {/* Operation & Rate Header */}
          <div className="p-3 bg-navy-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gold-400 font-bold uppercase tracking-wider block">
                Operation
              </span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Scissors className="h-3.5 w-3.5 text-gold-400" />
                {operationName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-charcoal-300 font-bold uppercase tracking-wider block">
                Rate
              </span>
              <span className="text-sm font-mono font-extrabold text-gold-400">
                {formatRate(currentRate)} / pc
              </span>
            </div>
          </div>

          {/* Quick Add Pills */}
          <div>
            <label className="text-xs font-semibold text-charcoal-600 block mb-1.5">
              Quick Add Pills
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleQuickAdd(count)}
                  className="py-2.5 px-2 rounded-xl bg-warm-100 hover:bg-warm-200 border border-charcoal-200 text-navy-900 font-bold font-mono text-xs transition-colors active:scale-95 min-h-[44px]"
                >
                  +{count}
                </button>
              ))}
            </div>
          </div>

          {/* Large Numeric Input */}
          <div>
            <label className="text-xs font-semibold text-charcoal-600 block mb-1.5">
              Pieces Completed
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={25000}
              value={pieceInput}
              onChange={(e) => setPieceInput(e.target.value)}
              className="w-full text-center text-3xl font-extrabold font-mono text-navy-900 bg-warm-100 border border-charcoal-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900"
              placeholder="0"
            />
          </div>

          {/* Real-time Earnings Preview */}
          <div className="p-3 rounded-xl bg-gold-50 border border-gold-200/80 flex items-center justify-between text-xs">
            <span className="text-gold-900 font-semibold">Estimated Earning:</span>
            <span className="font-extrabold font-mono text-base text-gold-900">
              {formatCurrency(potentialEarning)}
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenConfirm}
              className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold min-h-[44px]"
            >
              Submit Production
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Step Dialog (Section 9) */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Piece Submission"
        description={`Submit ${parsedPieceCount} pieces for ${operationName} at ${formatRate(
          currentRate
        )} per piece? Estimated earnings: ${formatCurrency(potentialEarning)}.`}
        confirmText={isSubmitting ? "Submitting..." : "Yes, Submit"}
        variant="primary"
      />
    </div>
  );
}
