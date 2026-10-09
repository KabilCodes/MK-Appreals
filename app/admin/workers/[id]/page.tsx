"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Scissors,
  Calendar,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { store } from "@/lib/db/store";
import { WorkerWithStats, WeeklySalary, ProductionEntry } from "@/types";
import { formatCurrency, formatRate } from "@/lib/utils/currency";
import { formatDateDisplay } from "@/lib/utils/date";

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params?.id as string;

  const [worker, setWorker] = useState<WorkerWithStats | null>(null);
  const [salaries, setSalaries] = useState<WeeklySalary[]>([]);
  const [entries, setEntries] = useState<ProductionEntry[]>([]);

  useEffect(() => {
    if (!workerId) return;

    const allWorkersWithStats = store.getWorkersWithStats();
    const found = allWorkersWithStats.find(
      (w) => w.id === workerId || w.worker_id === workerId
    );
    if (!found) {
      router.push("/admin/workers");
      return;
    }
    setWorker(found);

    const workerSalaries = store.getWeeklySalaries(undefined, found.id);
    setSalaries(workerSalaries);

    const workerEntries = store.getProductionEntries({
      worker_id: found.id,
      limit: 20,
    });
    setEntries(workerEntries);
  }, [workerId, router]);

  if (!worker) {
    return <div className="py-12 text-center text-slate-400">Loading worker profile...</div>;
  }

  const currentWeekSalary = salaries.length > 0 ? salaries[0] : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Title */}
      <div>
        <Link
          href="/admin/workers"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2 font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Workers List
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 text-[#0B1F33] flex items-center justify-center font-bold text-lg shadow-sm">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33] flex items-center gap-2">
                {worker.full_name}
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  {worker.worker_id}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {worker.operation_name} Operator • Mobile: {worker.mobile}
              </p>
            </div>
          </div>

          <StatusBadge status={worker.status} />
        </div>
      </div>

      {/* Profile & Current Week Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Profile Details */}
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Scissors className="h-4 w-4 text-[#C89B3C]" /> Operational Assignment
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Assigned Operation:</span>
              <span className="font-semibold text-slate-900">{worker.operation_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Current Piece Rate:</span>
              <span className="font-mono font-bold text-[#0B1F33]">
                {formatRate(worker.current_rate)} / pc
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Today&apos;s Pieces:</span>
              <span className="font-mono font-semibold text-slate-900">
                {worker.today_pieces.toLocaleString()} pcs
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Today&apos;s Earnings:</span>
              <span className="font-mono font-bold text-emerald-600">
                {formatCurrency(worker.today_earnings)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Week Performance */}
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[#C89B3C]" /> Current Week Settlement
            </h3>
            {currentWeekSalary && <StatusBadge status={currentWeekSalary.status} />}
          </div>

          {currentWeekSalary ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Week Pieces:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currentWeekSalary.total_pieces.toLocaleString()} pcs
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Calculated Earnings:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {formatCurrency(currentWeekSalary.calculated_amount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Final Salary:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(currentWeekSalary.final_salary)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-mono text-slate-600">
                  {currentWeekSalary.payment_date
                    ? formatDateDisplay(currentWeekSalary.payment_date)
                    : "Pending Payout"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No submissions logged for current week.</p>
          )}
        </div>
      </div>

      {/* Historical Weekly Settlements */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#C89B3C]" /> Historical Weekly Settlements
          </h3>
          <span className="text-xs text-slate-500 font-mono">{salaries.length} weeks recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Week</th>
                <th className="py-3 px-4 text-right">Pieces</th>
                <th className="py-3 px-4 text-right">Rate</th>
                <th className="py-3 px-4 text-right">Calculated</th>
                <th className="py-3 px-4 text-right">Final Salary</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No historical settlements for this worker.
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{s.week_id}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{s.total_pieces.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRate(s.current_rate || 2.0)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(s.calculated_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(s.final_salary)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {s.payment_date ? formatDateDisplay(s.payment_date) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
