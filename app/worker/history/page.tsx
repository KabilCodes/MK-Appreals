"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ProductionEntry, CorrectionRequest } from "@/types";
import { store } from "@/lib/db/store";
import { SupabaseDbService } from "@/services/supabase-db.service";
import { formatCurrency, formatRate } from "@/lib/utils/currency";
import { formatDateDisplay } from "@/lib/utils/date";
import { Scissors, FileEdit, CheckCircle2, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWorkerSession } from "@/hooks/use-worker-session";
import { WorkerLoadingScreen } from "@/components/worker/WorkerLoadingScreen";
import { WorkerErrorScreen } from "@/components/worker/WorkerErrorScreen";

export default function WorkerHistoryPage() {
  const { success, error: toastError } = useToast();
  const { worker, isLoading, error, refresh, logout } = useWorkerSession();

  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);

  // Correction Modal State
  const [selectedEntry, setSelectedEntry] = useState<ProductionEntry | null>(null);
  const [correctionCount, setCorrectionCount] = useState<string>("");
  const [correctionReason, setCorrectionReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!worker) return;
    const workerEntries = store.getProductionEntries({
      worker_id: worker.id,
    });
    setEntries(workerEntries);

    const allCorrections = store.getCorrectionRequests();
    setCorrections(allCorrections.filter((c) => c.worker_id === worker.id));

    try {
      const remoteEntries = await SupabaseDbService.getProductionEntries(worker.id);
      if (remoteEntries && remoteEntries.length > 0) {
        setEntries(remoteEntries);
      }
    } catch {
      // Fallback to store
    }
  }, [worker]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group entries by period (Section 13: Today, Yesterday, This Week, Previous Weeks)
  const groupedEntries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: {
      today: ProductionEntry[];
      yesterday: ProductionEntry[];
      thisWeek: ProductionEntry[];
      previous: ProductionEntry[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      previous: [],
    };

    entries.forEach((e) => {
      const d = new Date(e.production_date);
      d.setHours(0, 0, 0, 0);

      if (d.getTime() === today.getTime()) {
        groups.today.push(e);
      } else if (d.getTime() === yesterday.getTime()) {
        groups.yesterday.push(e);
      } else if (d > weekAgo) {
        groups.thisWeek.push(e);
      } else {
        groups.previous.push(e);
      }
    });

    return groups;
  }, [entries]);

  if (isLoading) {
    return <WorkerLoadingScreen message="Loading production history..." />;
  }

  if (error || !worker) {
    return (
      <WorkerErrorScreen
        message={error || "Could not load production history."}
        onRetry={refresh}
        onLogin={logout}
      />
    );
  }

  const totalPieces = entries.reduce((sum, e) => sum + e.piece_count, 0);
  const totalEarnings = entries.reduce((sum, e) => sum + e.calculated_earning, 0);

  const handleOpenCorrection = (entry: ProductionEntry) => {
    setSelectedEntry(entry);
    setCorrectionCount(String(entry.piece_count));
    setCorrectionReason("");
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !worker) return;

    const count = parseInt(correctionCount, 10);
    if (isNaN(count) || count <= 0) {
      toastError("Please enter a valid piece count greater than 0");
      return;
    }
    if (count === selectedEntry.piece_count) {
      toastError("Requested count must be different from current count");
      return;
    }
    if (!correctionReason.trim()) {
      toastError("Please provide a reason for the correction");
      return;
    }

    setIsSubmitting(true);
    try {
      store.requestCorrection({
        production_entry_id: selectedEntry.id,
        requested_piece_count: count,
        reason: correctionReason.trim(),
      });
      success("Correction request submitted for supervisor review.");
      setSelectedEntry(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit correction request";
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = (title: string, items: ProductionEntry[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-charcoal-500 px-1">
          <span>{title}</span>
          <span className="font-mono text-[11px] text-charcoal-400">
            {items.reduce((s, i) => s + i.piece_count, 0).toLocaleString()} pcs
          </span>
        </div>

        <div className="space-y-2">
          {items.map((entry) => {
            const pendingCorrection = corrections.find(
              (c) => c.production_entry_id === entry.id && c.status === "PENDING"
            );

            return (
              <div
                key={entry.id}
                className="rounded-2xl bg-white border border-charcoal-200/80 p-4 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-warm-100 text-navy-900 border border-charcoal-200">
                      <Scissors className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-navy-900 block">
                        {entry.operation_name_snapshot}
                      </span>
                      <span className="text-[11px] font-mono text-charcoal-500">
                        {formatDateDisplay(entry.production_date)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold font-mono text-navy-900 block">
                      {entry.piece_count.toLocaleString()}{" "}
                      <span className="text-xs font-sans text-charcoal-400 font-normal">pcs</span>
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      {formatCurrency(entry.calculated_earning)}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-charcoal-100 flex items-center justify-between text-xs text-charcoal-500">
                  <span className="font-mono">
                    Rate: <strong className="text-charcoal-800">{formatRate(entry.rate_snapshot)}</strong>/pc
                  </span>

                  {pendingCorrection ? (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Correction Pending ({pendingCorrection.requested_piece_count} pcs)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenCorrection(entry)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-900 hover:text-gold-600 transition-colors py-1 px-2 rounded-lg hover:bg-warm-100"
                    >
                      <FileEdit className="h-3 w-3" />
                      <span>Request Correction</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-charcoal-200">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
            Production History
          </h2>
          <p className="text-xs text-charcoal-500">Personal piece completion logs</p>
        </div>

        {entries.length > 0 && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-charcoal-400 tracking-wider block">
              Cumulative
            </span>
            <span className="text-xs font-bold font-mono text-navy-900">
              {totalPieces.toLocaleString()} pcs
            </span>
          </div>
        )}
      </div>

      {/* Grouped Logs or Empty State */}
      {entries.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No production records yet"
          description="Your daily submitted pieces and verified earnings will appear here."
        />
      ) : (
        <div className="space-y-5">
          {renderSection("Today", groupedEntries.today)}
          {renderSection("Yesterday", groupedEntries.yesterday)}
          {renderSection("This Week", groupedEntries.thisWeek)}
          {renderSection("Previous Weeks", groupedEntries.previous)}
        </div>
      )}

      {/* Correction Request Modal */}
      <Modal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title="Request Piece Correction"
      >
        {selectedEntry && (
          <form onSubmit={handleSubmitCorrection} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Corrections are audited by the Line Supervisor before wage calculations are updated.
              </span>
            </div>

            <div className="p-3 bg-warm-100 rounded-xl border border-charcoal-200 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-charcoal-500">Operation:</span>
                <span className="font-bold text-navy-900">
                  {selectedEntry.operation_name_snapshot}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-charcoal-500">Date:</span>
                <span className="font-mono text-navy-900">
                  {formatDateDisplay(selectedEntry.production_date)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-charcoal-500">Current Count:</span>
                <span className="font-mono font-bold text-navy-900">
                  {selectedEntry.piece_count} pcs
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                Requested Piece Count
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={25000}
                required
                value={correctionCount}
                onChange={(e) => setCorrectionCount(e.target.value)}
                className="w-full text-center text-2xl font-bold font-mono bg-white border border-charcoal-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-navy-900 min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                Reason for Correction
              </label>
              <textarea
                required
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="State reason for piece count correction..."
                className="w-full text-xs bg-white border border-charcoal-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedEntry(null)}
                className="flex-1 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold min-h-[44px]"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
