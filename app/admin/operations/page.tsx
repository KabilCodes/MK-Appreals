"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  History,
  Scissors,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { store } from "@/lib/db/store";
import { Operation, RateHistory } from "@/types";
import { formatRate } from "@/lib/utils/currency";
import { formatDateDisplay } from "@/lib/utils/date";

export default function AdminOperationsPage() {
  const { success, error } = useToast();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([]);

  // Update Rate Modal state
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [newRateInput, setNewRateInput] = useState("");
  const [rateReasonInput, setRateReasonInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Operation Modal state
  const [isAddOpOpen, setIsAddOpOpen] = useState(false);
  const [newOpData, setNewOpData] = useState({
    name: "",
    code: "",
    current_rate: "",
    description: "",
  });

  // Selected history view
  const [historyOp, setHistoryOp] = useState<Operation | null>(null);

  const loadData = () => {
    setOperations(store.getOperations());
    setRateHistory(store.getRateHistory());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRateModal = (op: Operation) => {
    setEditingOp(op);
    setNewRateInput(String(op.current_rate));
    setRateReasonInput("");
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOp) return;

    const rateNum = parseFloat(newRateInput);
    if (isNaN(rateNum) || rateNum < 0) {
      error("Please enter a valid piece rate (>= 0)");
      return;
    }
    if (!rateReasonInput.trim()) {
      error("Please provide a reason for updating the piece rate (audited)");
      return;
    }

    setIsSubmitting(true);
    try {
      store.updateOperationRate(editingOp.id, rateNum, rateReasonInput.trim());
      success(
        `Piece rate for ${editingOp.name} updated to ${formatRate(
          rateNum
        )}. Past production entries remain unchanged.`
      );
      setEditingOp(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update rate";
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(newOpData.current_rate);
    if (isNaN(rateNum) || rateNum < 0) {
      error("Invalid initial rate");
      return;
    }

    try {
      store.createOperation({
        name: newOpData.name.trim(),
        code: newOpData.code.trim().toUpperCase(),
        current_rate: rateNum,
        description: newOpData.description.trim(),
      });

      success(`Operation "${newOpData.name}" added successfully.`);
      setIsAddOpOpen(false);
      setNewOpData({ name: "", code: "", current_rate: "", description: "" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add operation";
      error(msg);
    }
  };

  const filteredHistory = historyOp
    ? rateHistory.filter((rh) => rh.operation_id === historyOp.id)
    : rateHistory;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-charcoal-200/80">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 flex items-center gap-2">
            <Layers className="h-6 w-6 text-gold-600" /> Operations &amp; Piece Rates
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Configure production operations and maintain immutable rate revision histories.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddOpOpen(true)}
          className="bg-navy-900 hover:bg-navy-950 text-white font-bold h-11 px-4 rounded-xl shadow-subtle"
        >
          <Plus className="h-4 w-4 mr-2 text-gold-400" /> Add Operation
        </Button>
      </div>

      {/* Operations Table */}
      <div className="rounded-2xl border border-charcoal-200/80 bg-white overflow-hidden shadow-card">
        <div className="p-4 bg-warm-100/80 border-b border-charcoal-200/80 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">
            Active Garment Operations ({operations.length})
          </span>
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Snapshot Immutability Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-50 border-b border-charcoal-200 text-charcoal-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="py-3.5 px-4">Operation Name</th>
                <th scope="col" className="py-3.5 px-4">Code</th>
                <th scope="col" className="py-3.5 px-4">Description</th>
                <th scope="col" className="py-3.5 px-4 text-right">Current Rate / Piece</th>
                <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                <th scope="col" className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {operations.map((op) => (
                <tr key={op.id} className="hover:bg-warm-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-navy-900 flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-gold-600" />
                    {op.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-charcoal-700">{op.code}</td>
                  <td className="py-3.5 px-4 text-charcoal-500">{op.description || "—"}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-navy-900">
                    {formatRate(op.current_rate)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={op.status} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRateModal(op)}
                        className="text-xs bg-warm-50 text-navy-900 border-charcoal-200 hover:bg-warm-100 font-semibold"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1 text-gold-600" /> Change Rate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryOp(op)}
                        className="text-xs text-charcoal-500 hover:text-navy-900"
                      >
                        <History className="h-3.5 w-3.5 mr-1" /> History
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE RATE MODAL */}
      <Modal
        isOpen={Boolean(editingOp)}
        onClose={() => setEditingOp(null)}
        title={`Update Piece Rate — ${editingOp?.name}`}
        description="Changes will apply to future piece submissions only. Past completed piece records remain snapshot-protected."
        maxWidth="md"
      >
        <form onSubmit={handleRateSubmit} className="space-y-4 mt-2">
          <div className="rounded-xl bg-warm-100 p-3.5 border border-charcoal-200 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">Current Piece Rate:</span>
            <span className="font-mono font-bold text-navy-900 text-sm">
              {formatRate(editingOp?.current_rate || 0)} / piece
            </span>
          </div>

          <Input
            label="New Piece Rate (₹) *"
            type="number"
            step="0.05"
            min="0"
            required
            value={newRateInput}
            onChange={(e) => setNewRateInput(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Reason for Rate Adjustment (Audit Trail) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="State reason for piece rate adjustment"
              value={rateReasonInput}
              onChange={(e) => setRateReasonInput(e.target.value)}
              className="w-full rounded-xl border border-charcoal-300 bg-white p-3 text-sm text-charcoal-900 focus:outline-none focus:border-navy-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-charcoal-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingOp(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-navy-900 hover:bg-navy-950 text-white font-bold"
            >
              Update Rate
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD OPERATION MODAL */}
      <Modal
        isOpen={isAddOpOpen}
        onClose={() => setIsAddOpOpen(false)}
        title="Add New Garment Operation"
        description="Define a new sewing, cutting, or quality checking workstation operation."
        maxWidth="md"
      >
        <form onSubmit={handleAddOpSubmit} className="space-y-4 mt-2">
          <Input
            label="Operation Name *"
            required
            placeholder="Operation name"
            value={newOpData.name}
            onChange={(e) => setNewOpData({ ...newOpData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Operation Code *"
              required
              placeholder="Operation code"
              value={newOpData.code}
              onChange={(e) => setNewOpData({ ...newOpData, code: e.target.value })}
            />
            <Input
              label="Initial Piece Rate (₹) *"
              type="number"
              step="0.05"
              min="0"
              required
              placeholder="2.00"
              value={newOpData.current_rate}
              onChange={(e) => setNewOpData({ ...newOpData, current_rate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Operational description and station requirements"
              value={newOpData.description}
              onChange={(e) => setNewOpData({ ...newOpData, description: e.target.value })}
              className="w-full rounded-xl border border-charcoal-300 bg-white p-3 text-sm text-charcoal-900 focus:outline-none focus:border-navy-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-charcoal-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-navy-900 hover:bg-navy-950 text-white font-bold"
            >
              Create Operation
            </Button>
          </div>
        </form>
      </Modal>

      {/* RATE HISTORY MODAL */}
      <Modal
        isOpen={Boolean(historyOp)}
        onClose={() => setHistoryOp(null)}
        title={`Rate History — ${historyOp?.name}`}
        description="Immutable snapshot records of all past rate adjustments for this operation."
        maxWidth="lg"
      >
        <div className="space-y-3 mt-2 max-h-96 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-400">
              No previous rate adjustments logged for this operation.
            </div>
          ) : (
            <div className="divide-y divide-charcoal-100 border border-charcoal-200 rounded-xl overflow-hidden">
              {filteredHistory.map((rh) => (
                <div key={rh.id} className="p-3 text-xs flex justify-between items-center bg-white">
                  <div>
                    <span className="font-mono font-bold text-navy-900 text-sm block">
                      {formatRate(rh.rate)}
                    </span>
                    <span className="text-[11px] text-charcoal-500">
                      Reason: <span className="font-medium text-charcoal-700">{rh.reason || "Baseline initialization"}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-charcoal-400 block">
                      {formatDateDisplay(rh.effective_from)}
                    </span>
                    <span className="text-[10px] text-gold-600 font-semibold">
                      By: {rh.changed_by}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
