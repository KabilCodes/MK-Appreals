"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Users,
  Scissors,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/db/store";
import { ProductionEntry, WeeklySalary, Worker, Operation } from "@/types";
import { formatCurrency, formatRate } from "@/lib/utils/currency";
import { formatDateDisplay, formatDateISO, getRecentWeeks } from "@/lib/utils/date";
import { convertToCSV, downloadCSV } from "@/lib/utils/export";
import { useToast } from "@/components/ui/toast";

type ReportType =
  | "DAILY_PRODUCTION"
  | "WEEKLY_PRODUCTION"
  | "WORKER_PRODUCTION"
  | "WEEKLY_SALARY"
  | "MONTHLY_PAYROLL";

export default function AdminReportsPage() {
  const { success } = useToast();
  const [reportType, setReportType] = useState<ReportType>("DAILY_PRODUCTION");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedWorker, setSelectedWorker] = useState("ALL");
  const [selectedOp, setSelectedOp] = useState("ALL");

  useEffect(() => {
    setWorkers(store.getWorkers());
    setOperations(store.getOperations());
  }, []);

  const handleExportCurrentReport = () => {
    let csvData: Record<string, unknown>[] = [];
    let filename = `MK_Appreals_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === "DAILY_PRODUCTION" || reportType === "WEEKLY_PRODUCTION" || reportType === "WORKER_PRODUCTION") {
      const entries = store.getProductionEntries({
        worker_id: selectedWorker === "ALL" ? undefined : selectedWorker,
        operation_id: selectedOp === "ALL" ? undefined : selectedOp,
      });

      csvData = entries.map((e) => ({
        Production_Date: e.production_date,
        Worker_Name: e.worker_name_snapshot,
        Operation: e.operation_name_snapshot,
        Piece_Count: e.piece_count,
        Rate_Snapshot: e.rate_snapshot,
        Calculated_Earning: e.calculated_earning,
        Status: e.status,
      }));
    } else {
      const salaries = store.getWeeklySalaries();
      csvData = salaries.map((s) => ({
        Week_ID: s.week_id,
        Week_Start: s.week_start_date,
        Week_End: s.week_end_date,
        Worker_ID: s.worker_id_code,
        Worker_Name: s.worker_name,
        Operation: s.operation_name,
        Total_Pieces: s.total_pieces,
        Rate_Used: s.current_rate,
        Calculated_Income: s.calculated_amount,
        Final_Salary: s.final_salary,
        Payment_Status: s.status,
        Payment_Date: s.payment_date || "UNPAID",
      }));
    }

    const csv = convertToCSV(csvData);
    downloadCSV(filename, csv);
    success(`Report exported successfully (${csvData.length} records).`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33] flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-[#C89B3C]" /> Factory Analytics & CSV Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export production sheets, operator piece tallies, and weekly payroll summaries.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleExportCurrentReport}
          className="bg-[#0B1F33] hover:bg-[#132d4a] text-white font-medium"
        >
          <Download className="h-4 w-4 mr-1.5" /> Download Report (CSV)
        </Button>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: "DAILY_PRODUCTION", label: "Daily Production", icon: Scissors },
          { id: "WEEKLY_PRODUCTION", label: "Weekly Production", icon: Calendar },
          { id: "WORKER_PRODUCTION", label: "Worker Production", icon: Users },
          { id: "WEEKLY_SALARY", label: "Weekly Salary", icon: CreditCard },
          { id: "MONTHLY_PAYROLL", label: "Monthly Payroll", icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? "bg-[#0B1F33] border-[#0B1F33] text-white shadow-sm"
                  : "bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <Icon className={`h-5 w-5 mb-3 ${isSelected ? "text-[#C89B3C]" : "text-slate-400"}`} />
              <span className="text-xs font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Ribbon */}
      <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Worker Filter:</span>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-[#0B1F33]"
          >
            <option value="ALL">All Factory Operators</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} ({w.worker_id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Operation Filter:</span>
          <select
            value={selectedOp}
            onChange={(e) => setSelectedOp(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-[#0B1F33]"
          >
            <option value="ALL">All Operations</option>
            {operations.map((op) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview Card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center space-y-3 shadow-sm">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <FileSpreadsheet className="h-8 w-8 text-[#C89B3C]" />
        </div>
        <h3 className="text-base font-bold text-[#0B1F33]">
          Ready to Export: {reportType.replace(/_/g, " ")}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Generates a complete RFC 4180 compliant CSV spreadsheet ready for bank payouts, offline archival, and factory auditing.
        </p>

        <div className="pt-2">
          <Button
            variant="primary"
            onClick={handleExportCurrentReport}
            className="bg-[#0B1F33] hover:bg-[#132d4a] text-white font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" /> Download Full CSV Report
          </Button>
        </div>
      </div>
    </div>
  );
}
