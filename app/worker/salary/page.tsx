"use client";

import React, { useEffect, useState, useCallback } from "react";
import { WeeklySalary } from "@/types";
import { store } from "@/lib/db/store";
import { formatCurrency, formatRate } from "@/lib/utils/currency";
import { formatDateDisplay } from "@/lib/utils/date";
import { StatusBadge } from "@/components/ui/badge";
import { Calendar, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkerSession } from "@/hooks/use-worker-session";
import { WorkerLoadingScreen } from "@/components/worker/WorkerLoadingScreen";
import { WorkerErrorScreen } from "@/components/worker/WorkerErrorScreen";

export default function WorkerSalaryPage() {
  const { worker, currentRate, isLoading, error, refresh, logout } = useWorkerSession();
  const [salaries, setSalaries] = useState<WeeklySalary[]>([]);

  const loadSalaries = useCallback(() => {
    if (!worker) return;
    const workerSalaries = store.getWeeklySalaries(undefined, worker.id);
    setSalaries(workerSalaries);
  }, [worker]);

  useEffect(() => {
    loadSalaries();
  }, [loadSalaries]);

  if (isLoading) {
    return <WorkerLoadingScreen message="Loading salary settlements..." />;
  }

  if (error || !worker) {
    return (
      <WorkerErrorScreen
        message={error || "Could not load salary records."}
        onRetry={refresh}
        onLogin={logout}
      />
    );
  }

  const currentWeekSalary = salaries.length > 0 ? salaries[0] : null;
  const pastSalaries = salaries.slice(1);

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Page Title */}
      <div className="pb-2 border-b border-charcoal-200">
        <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
          Salary &amp; Settlement
        </h2>
        <p className="text-xs text-charcoal-500">
          Weekly wage calculation and official disbursement records
        </p>
      </div>

      {/* =======================================================================
          CURRENT WEEK FINANCIAL SUMMARY (Section 14)
          ======================================================================= */}
      {currentWeekSalary ? (
        <div className="rounded-2xl bg-white border border-charcoal-200/90 p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block">
                Settlement Period
              </span>
              <span className="text-sm font-extrabold text-navy-900 flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-4 w-4 text-gold-600" />
                Current Week ({currentWeekSalary.week_id})
              </span>
            </div>
            <StatusBadge status={currentWeekSalary.status} />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-charcoal-500 font-medium">Pieces Completed:</span>
              <span className="font-mono font-bold text-navy-900 text-sm">
                {currentWeekSalary.total_pieces.toLocaleString()} pcs
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-charcoal-500 font-medium">Piece Rate:</span>
              <span className="font-mono font-bold text-gold-700 text-sm">
                {formatRate(currentRate)} / pc
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-charcoal-500 font-medium">Calculated Wage:</span>
              <span className="font-mono font-semibold text-charcoal-800 text-sm">
                {formatCurrency(currentWeekSalary.calculated_amount)}
              </span>
            </div>

            {currentWeekSalary.total_adjustments !== 0 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-charcoal-500 font-medium">Adjustments / Bonus:</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {currentWeekSalary.total_adjustments > 0 ? "+" : ""}
                  {formatCurrency(currentWeekSalary.total_adjustments)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-charcoal-100 flex justify-between items-center">
              <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Final Settlement:
              </span>
              <span className="font-mono font-extrabold text-2xl text-navy-900">
                {formatCurrency(currentWeekSalary.final_salary)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-charcoal-500 font-medium">Payment Status:</span>
              <span className="font-bold text-navy-900 font-mono uppercase">
                {currentWeekSalary.status}
              </span>
            </div>

            {currentWeekSalary.payment_date && currentWeekSalary.status === "PAID" && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">Disbursed on:</span>
                <span className="font-bold text-emerald-900 font-mono">
                  {formatDateDisplay(currentWeekSalary.payment_date)}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CreditCard}
          title="No salary record for current week"
          description="Your piece completions will generate a weekly wage settlement."
        />
      )}

      {/* =======================================================================
          HISTORICAL SETTLEMENTS (Section 14)
          ======================================================================= */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 px-1">
          Salary Settlement History
        </h3>

        {pastSalaries.length === 0 ? (
          <div className="rounded-2xl bg-white border border-charcoal-200 p-6 text-center text-xs text-charcoal-500">
            No previous settlement records on file.
          </div>
        ) : (
          <div className="space-y-2">
            {pastSalaries.map((sal) => (
              <div
                key={sal.id}
                className="rounded-2xl bg-white border border-charcoal-200/90 p-4 shadow-card flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono text-charcoal-400 font-semibold block">
                    Week {sal.week_id}
                  </span>
                  <span className="text-sm font-bold text-navy-900 block mt-0.5">
                    {sal.total_pieces.toLocaleString()} pcs
                  </span>
                  {sal.payment_date && (
                    <span className="text-[10px] text-charcoal-500 block">
                      Paid: {formatDateDisplay(sal.payment_date)}
                    </span>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <span className="text-base font-extrabold font-mono text-navy-900 block">
                    {formatCurrency(sal.final_salary)}
                  </span>
                  <StatusBadge status={sal.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
