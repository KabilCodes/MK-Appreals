"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Scissors,
  Search,
  Filter,
  Calendar,
  Layers,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/db/store";
import { ProductionEntry, Operation, Worker } from "@/types";
import { formatCurrency, formatRate } from "@/lib/utils/currency";
import { formatDateDisplay } from "@/lib/utils/date";
import { convertToCSV, downloadCSV } from "@/lib/utils/export";
import { useToast } from "@/components/ui/toast";

export default function AdminProductionPage() {
  const { success } = useToast();
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOp, setSelectedOp] = useState("ALL");
  const [selectedWorker, setSelectedWorker] = useState("ALL");

  useEffect(() => {
    setEntries(store.getProductionEntries());
    setOperations(store.getOperations());
    setWorkers(store.getWorkers());
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        e.worker_name_snapshot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.operation_name_snapshot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.production_date.includes(searchQuery);

      const matchesOp = selectedOp === "ALL" || e.operation_id === selectedOp;
      const matchesWorker = selectedWorker === "ALL" || e.worker_id === selectedWorker;

      return matchesSearch && matchesOp && matchesWorker;
    });
  }, [entries, searchQuery, selectedOp, selectedWorker]);

  const totalPieces = filteredEntries.reduce((sum, e) => sum + e.piece_count, 0);
  const totalEarnings = filteredEntries.reduce((sum, e) => sum + e.calculated_earning, 0);

  const handleExportCSV = () => {
    const csvData = filteredEntries.map((e) => ({
      Entry_ID: e.id,
      Date: e.production_date,
      Worker: e.worker_name_snapshot,
      Operation: e.operation_name_snapshot,
      Pieces: e.piece_count,
      Rate_Snapshot: e.rate_snapshot,
      Calculated_Earning: e.calculated_earning,
      Status: e.status,
    }));

    const csv = convertToCSV(csvData);
    downloadCSV(`MK_Appreals_Production_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    success("Production records exported to CSV.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33] flex items-center gap-2">
            <Scissors className="h-6 w-6 text-[#C89B3C]" /> Daily Production Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of floor submissions with immutable piece-rate snapshots.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <Download className="h-3.5 w-3.5 mr-1.5 text-[#C89B3C]" /> Export CSV
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
            Filtered Submissions
          </span>
          <div className="text-2xl font-bold font-mono text-[#0B1F33] mt-1">
            {filteredEntries.length}
          </div>
        </div>
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
            Total Pieces
          </span>
          <div className="text-2xl font-bold font-mono text-[#0B1F33] mt-1">
            {totalPieces.toLocaleString()} pcs
          </div>
        </div>
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
            Calculated Earnings
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(totalEarnings)}
          </div>
        </div>
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
            Average Pieces / Entry
          </span>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
            {filteredEntries.length > 0
              ? Math.round(totalPieces / filteredEntries.length)
              : 0} pcs
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl bg-white border border-[#E2E8F0] p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search worker or operation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B1F33]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Worker Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Worker:</span>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-[#0B1F33]"
            >
              <option value="ALL">All Workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name} ({w.worker_id})
                </option>
              ))}
            </select>
          </div>

          {/* Operation Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Operation:</span>
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
      </div>

      {/* Entries Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4 text-right">Completed Pieces</th>
                <th className="py-3 px-4 text-right">Rate Snapshot</th>
                <th className="py-3 px-4 text-right">Calculated Earning</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No production entries found matching filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatDateDisplay(e.production_date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {e.worker_name_snapshot}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Scissors className="h-3 w-3 text-[#C89B3C]" />
                        {e.operation_name_snapshot}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {e.piece_count.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 font-medium">
                      {formatRate(e.rate_snapshot)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(e.calculated_earning)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                        {e.status}
                      </span>
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
