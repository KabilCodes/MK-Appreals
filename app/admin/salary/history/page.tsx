"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Calendar,
  ChevronRight,
  Download,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/db/store";
import { MonthlySalarySummary, WeeklySalary, Worker } from "@/types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateDisplay } from "@/lib/utils/date";
import { StatusBadge } from "@/components/ui/badge";
import { convertToCSV, downloadCSV } from "@/lib/utils/export";
import { useToast } from "@/components/ui/toast";

export default function AdminSalaryHistoryPage() {
  const { success } = useToast();
  const [history, setHistory] = useState<MonthlySalarySummary[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthWeeklySalaries, setMonthWeeklySalaries] = useState<WeeklySalary[]>([]);

  const loadHistory = React.useCallback(() => {
    const workerFilter = selectedWorkerId === "ALL" ? undefined : selectedWorkerId;
    const data = store.get1YearSalaryHistory(workerFilter);
    setHistory(data);
    setWorkers(store.getWorkers());

    if (data.length > 0 && !selectedMonth) {
      setSelectedMonth(data[0].month);
    }
  }, [selectedWorkerId, selectedMonth]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (selectedMonth) {
      // Find all weekly salaries belonging to this month
      const allSalaries = store.getWeeklySalaries();
      const matching = allSalaries.filter((ws) =>
        ws.week_start_date.startsWith(selectedMonth)
      );
      setMonthWeeklySalaries(matching);
    }
  }, [selectedMonth]);

  const handleExportCSV = () => {
    const csvData = history.map((h) => ({
      Month: h.month_name,
      Total_Pieces: h.total_pieces,
      Calculated_Income: h.total_calculated,
      Final_Salary: h.total_final_salary,
      Paid_Amount: h.total_paid,
      Pending_Amount: h.total_pending,
      Active_Operators: h.worker_count,
    }));

    const csv = convertToCSV(csvData);
    downloadCSV(`MK_Appreals_1Year_Payroll_History.csv`, csv);
    success("1-Year salary summary exported to CSV.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33] flex items-center gap-2">
            <History className="h-6 w-6 text-[#C89B3C]" /> 1-Year Payroll History & Monthly Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical 12-month rollup of garment piece volumes, wage calculations, and disbursement compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Worker Filter:</span>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-[#0B1F33] font-semibold"
            >
              <option value="ALL">All Factory Operators</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name} ({w.worker_id})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#C89B3C]" /> Export Summary CSV
          </Button>
        </div>
      </div>

      {/* 12 Months Rollup Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Monthly Settlement Rollup (Last 12 Months)
          </span>
          <span className="text-xs text-[#0B1F33] font-medium">Click any month to inspect weekly records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4 text-center">Active Operators</th>
                <th className="py-3 px-4 text-right">Total Completed Pieces</th>
                <th className="py-3 px-4 text-right">Calculated Income</th>
                <th className="py-3 px-4 text-right">Total Final Salary</th>
                <th className="py-3 px-4 text-right">Disbursed (Paid)</th>
                <th className="py-3 px-4 text-right">Pending Payout</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No historical settlements recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((m) => {
                  const isSelected = selectedMonth === m.month;
                  return (
                    <tr
                      key={m.month}
                      onClick={() => setSelectedMonth(m.month)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-slate-50 border-l-4 border-l-[#0B1F33]" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#C89B3C]" />
                        {m.month_name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {m.worker_count}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {m.total_pieces.toLocaleString()} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(m.total_calculated)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-slate-900">
                        {formatCurrency(m.total_final_salary)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                        {formatCurrency(m.total_paid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-600">
                        {formatCurrency(m.total_pending)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center text-xs font-semibold text-[#0B1F33]">
                          Inspect <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Month Weekly Drill-down */}
      {selectedMonth && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-[#0B1F33] flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#C89B3C]" />
                Weekly Breakdown for {history.find((h) => h.month === selectedMonth)?.month_name}
              </h3>
              <p className="text-xs text-slate-500">
                Detailed weekly cycle disbursements and piece tallies
              </p>
            </div>
            <span className="font-mono text-xs text-[#0B1F33] font-semibold bg-slate-100 px-2.5 py-1 rounded-md">
              {monthWeeklySalaries.length} weekly settlements
            </span>
          </div>

          {monthWeeklySalaries.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No weekly settlements found for this month window.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Week</th>
                    <th className="py-2.5 px-3">Worker</th>
                    <th className="py-2.5 px-3">Operation</th>
                    <th className="py-2.5 px-3 text-right">Pieces</th>
                    <th className="py-2.5 px-3 text-right">Final Salary</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthWeeklySalaries.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold">{s.week_id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {s.worker_name} ({s.worker_id_code})
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{s.operation_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">{s.total_pieces.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(s.final_salary)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {s.payment_date ? formatDateDisplay(s.payment_date) : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
