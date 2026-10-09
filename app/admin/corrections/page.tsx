"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  Scissors,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { store } from "@/lib/db/store";
import { CorrectionRequest } from "@/types";
import { formatCurrency, formatRate } from "@/lib/utils/currency";
import { formatDateDisplay } from "@/lib/utils/date";

export default function AdminCorrectionsPage() {
  const { success, error } = useToast();
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Reject Modal state
  const [rejectingRequest, setRejectingRequest] = useState<CorrectionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRequests = useCallback(() => {
    const list = store.getCorrectionRequests(statusFilter);
    setRequests(list);
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = (req: CorrectionRequest) => {
    setIsProcessing(true);
    try {
      store.approveCorrection(req.id, "Admin");
      success(
        `Correction approved for ${req.worker_name}: updated to ${req.requested_piece_count} pieces.`
      );
      loadRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve correction";
      error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReject = (req: CorrectionRequest) => {
    setRejectingRequest(req);
    setRejectReason("Discrepancy with floor tally sheet");
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    try {
      store.rejectCorrection(rejectingRequest.id, "Admin", rejectReason.trim());
      success(`Correction request declined for ${rejectingRequest.worker_name}.`);
      setRejectingRequest(null);
      loadRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reject correction";
      error(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33] flex items-center gap-2">
            <FileEdit className="h-6 w-6 text-[#C89B3C]" /> Production Correction Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audited supervisor review for operator piece count adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:outline-none focus:border-[#0B1F33] font-semibold"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Declined</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Correction Requests ({requests.length})
          </span>
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Immutable Audit Trail Recorded on Approval
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Date / Requested At</th>
                <th className="py-3 px-4">Worker & Operation</th>
                <th className="py-3 px-4 text-right">Original Pieces</th>
                <th className="py-3 px-4 text-right">Requested Pieces</th>
                <th className="py-3 px-4 text-right">Rate Snapshot</th>
                <th className="py-3 px-4">Reason Given by Worker</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No piece correction requests matching filters.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{formatDateDisplay(req.production_date)}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(req.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{req.worker_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Scissors className="h-3 w-3 text-[#C89B3C]" />
                        {req.operation_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400 line-through">
                      {req.original_piece_count} pcs
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {req.requested_piece_count} pcs
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatRate(req.rate_snapshot)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs">{req.reason}</td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {req.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApprove(req)}
                            disabled={isProcessing}
                            className="bg-[#0B1F33] hover:bg-[#132d4a] text-white font-medium text-xs h-8"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReject(req)}
                            disabled={isProcessing}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-8"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1 text-rose-500" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Reviewed by {req.reviewed_by || "Admin"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT MODAL */}
      {rejectingRequest && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingRequest(null)}
          title="Decline Correction Request"
          description={`Provide a reason for declining ${rejectingRequest.worker_name}'s request (${rejectingRequest.requested_piece_count} pieces).`}
        >
          <form onSubmit={handleConfirmReject} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Decline Reason (Notified to Worker) *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why the correction cannot be approved..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingRequest(null)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                Confirm Decline
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
