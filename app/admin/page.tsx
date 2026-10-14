"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Scissors,
  Layers,
  CreditCard,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { store } from "@/lib/db/store";
import { DashboardMetrics, WeeklySalary, AttentionAlert, Worker, ProductionEntry } from "@/types";
import { SupabaseDbService } from "@/services/supabase-db.service";
import { formatCurrency, formatRate } from "@/lib/utils/currency";
import { StatusBadge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [weeklySalaries, setWeeklySalaries] = useState<WeeklySalary[]>([]);
  const [alerts, setAlerts] = useState<AttentionAlert[]>([]);

  useEffect(() => {
    // 1. Initial store state
    setMetrics(store.getDashboardMetrics());
    setWeeklySalaries(store.getWeeklySalaries().slice(0, 8));
    setAlerts(store.getAttentionAlerts());

    // 2. Sync with live Supabase database
    let isMounted = true;
    Promise.all([
      SupabaseDbService.getWorkers(),
      SupabaseDbService.getProductionEntries(),
      SupabaseDbService.getWeeklySalaries(),
    ])
      .then(([remoteWorkers, remoteEntries, remoteSalaries]) => {
        if (!isMounted) return;
        const syncPayload: {
          workers?: Worker[];
          productionEntries?: ProductionEntry[];
          weeklySalaries?: WeeklySalary[];
        } = {};

        if (remoteWorkers && remoteWorkers.length > 0) syncPayload.workers = remoteWorkers;
        if (remoteEntries !== null) syncPayload.productionEntries = remoteEntries;
        if (remoteSalaries !== null) syncPayload.weeklySalaries = remoteSalaries;

        if (Object.keys(syncPayload).length > 0) {
          store.syncFromSupabase(syncPayload);
          setMetrics(store.getDashboardMetrics());
          setWeeklySalaries(store.getWeeklySalaries().slice(0, 8));
          setAlerts(store.getAttentionAlerts());
        }
      })
      .catch((err) => {
        console.warn("[AdminDashboard] Supabase sync fallback:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!metrics) {
    return (
      <div className="py-20 text-center text-charcoal-400 font-medium">
        Loading dashboard overview...
      </div>
    );
  }

  // Pre-configured operations list (Section 9)
  const factoryOps = [
    { name: "Overlock", code: "OVL", defaultRate: 2.0 },
    { name: "Flatlock", code: "FLT", defaultRate: 2.5 },
    { name: "Singer", code: "SNG", defaultRate: 3.0 },
    { name: "Ironing", code: "IRN", defaultRate: 1.5 },
    { name: "Checking", code: "CHK", defaultRate: 1.0 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* =======================================================================
          Header & Welcome Banner (Section 8)
          ======================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-charcoal-200/80">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
            Good morning, Admin
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Production and wage overview • MK APPREALS Industrial Console
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/salary"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-950 text-white text-xs font-semibold shadow-subtle transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5 text-gold-400" />
            Review Weekly Salary
          </Link>
          <Link
            href="/admin/workers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-warm-100 text-charcoal-700 text-xs font-semibold border border-charcoal-200 shadow-subtle transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Manage Workers
          </Link>
        </div>
      </div>

      {/* =======================================================================
          Dashboard Attention System (Alerts)
          ======================================================================= */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-charcoal-600">
            <AlertCircle className="h-3.5 w-3.5 text-gold-600" />
            <span>Items Requiring Floor Attention ({alerts.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className="rounded-xl border border-charcoal-200 bg-white p-3.5 shadow-subtle hover:shadow-card hover:border-navy-900/30 transition-all flex items-start justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gold-50 text-gold-700 border border-gold-200">
                      {alert.type}
                    </span>
                    <span className="text-xs font-bold text-navy-900 group-hover:text-gold-600 transition-colors">
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-500 leading-snug">
                    {alert.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-charcoal-400 group-hover:text-navy-900 transition-colors shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================================
          4 Core Stat Cards (Section 8)
          ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Workers"
          value={metrics.active_workers}
          subtitle={`of ${metrics.total_workers} registered operators`}
          icon={UserCheck}
          variant="brand"
        />

        <StatCard
          title="Today's Pieces"
          value={metrics.today_pieces.toLocaleString()}
          subtitle="Floor completions today"
          icon={Scissors}
          variant="default"
        />

        <StatCard
          title="This Week's Pieces"
          value={metrics.this_week_pieces.toLocaleString()}
          subtitle="Current settlement week"
          icon={Layers}
          variant="amber"
        />

        <StatCard
          title="Pending Salaries"
          value={metrics.pending_salaries_count}
          subtitle={`${formatCurrency(metrics.weekly_payroll_amount)} payroll volume`}
          icon={CreditCard}
          variant="slate"
        />
      </div>

      {/* =======================================================================
          Production Overview Section (Section 9)
          ======================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900 tracking-tight">
              Production Overview by Operation
            </h2>
            <p className="text-xs text-charcoal-500">
              Floor throughput tracking across 5 standard garment assembly operations
            </p>
          </div>
          <Link
            href="/admin/production"
            className="text-xs font-semibold text-navy-900 hover:text-gold-600 transition-colors inline-flex items-center gap-1"
          >
            <span>View Live Feed</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {factoryOps.map((op) => {
            const opData = metrics.operation_breakdown?.find(
              (o) => o.operation_name.toLowerCase() === op.name.toLowerCase()
            );
            const pieces = opData?.today_pieces ?? 0;
            const workers = opData?.worker_count ?? 0;
            const target = 1000;
            const progressPct = Math.min(100, Math.round((pieces / target) * 100));

            return (
              <div
                key={op.code}
                className="rounded-2xl border border-charcoal-200/80 bg-white p-4 shadow-subtle hover:shadow-card transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-navy-900 tracking-tight">
                    {op.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-charcoal-500 px-1.5 py-0.5 rounded bg-warm-100 border border-charcoal-200">
                    {op.code}
                  </span>
                </div>

                <div className="text-2xl font-extrabold font-mono text-navy-900 mt-2">
                  {pieces.toLocaleString()}
                  <span className="text-[11px] font-sans font-medium text-charcoal-400 ml-1">
                    pcs
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-charcoal-500">
                  <span>{workers} active workers</span>
                  <span className="font-mono font-semibold text-gold-600">
                    {formatRate(op.defaultRate)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-charcoal-400 font-medium mb-1">
                    <span>Progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-warm-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-navy-900 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          Weekly Salary Section (Section 10)
          ======================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900 tracking-tight">
              Weekly Salary Review
            </h2>
            <p className="text-xs text-charcoal-500">
              Calculated worker earnings requiring administrative approval and payment disbursement
            </p>
          </div>

          <Link
            href="/admin/salary"
            className="text-xs font-semibold text-navy-900 hover:text-gold-600 transition-colors inline-flex items-center gap-1"
          >
            <span>Full Salary Ledger</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-charcoal-200/80 bg-white shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-warm-100/80 border-b border-charcoal-200/80 text-charcoal-600 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Worker</th>
                  <th scope="col" className="px-4 py-3.5">Operation</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Pieces</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Rate</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Calculated</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Final Salary</th>
                  <th scope="col" className="px-4 py-3.5 text-center">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100 text-charcoal-800">
                {weeklySalaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-xs text-charcoal-400">
                      No weekly salary records found for the current week.
                    </td>
                  </tr>
                ) : (
                  weeklySalaries.map((sal) => (
                    <tr
                      key={sal.id}
                      className="hover:bg-warm-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-navy-900">
                        <div>{sal.worker_name}</div>
                        <div className="font-mono text-[10px] text-charcoal-400">
                          {sal.worker_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-charcoal-600">
                        {sal.operation_name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-navy-900">
                        {sal.total_pieces.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-charcoal-500">
                        {formatRate(sal.current_rate || 2.0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-charcoal-600">
                        {formatCurrency(sal.calculated_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-navy-900">
                        {formatCurrency(sal.final_salary)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={sal.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/admin/salary?review=${sal.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warm-100 hover:bg-warm-200 border border-charcoal-200 text-navy-900 text-xs font-semibold transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Review</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
