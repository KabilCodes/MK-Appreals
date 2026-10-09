"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Clock, User, FileText, CheckCircle2 } from "lucide-react";
import { store } from "@/lib/db/store";
import { AuditLog } from "@/types";
import { formatDateDisplay } from "@/lib/utils/date";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setLogs(store.getAuditLogs(100));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33] flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-[#C89B3C]" /> Administrative Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Forensic immutable logs of all worker enrollments, piece-rate modifications, and wage disbursements.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recorded Audit Events ({logs.length})
          </span>
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Tamper-evident logging active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Delta / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateDisplay(log.timestamp)}{" "}
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {log.actor_name}{" "}
                      <span className="text-[10px] text-slate-500 font-mono">({log.actor_role})</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0B1F33]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{log.target_entity}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{log.target_id || "—"}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {log.new_values ? (
                        <span className="text-slate-600">
                          {JSON.stringify(log.new_values)}
                        </span>
                      ) : (
                        "—"
                      )}
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
