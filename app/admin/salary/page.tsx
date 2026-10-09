"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Edit,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { store } from "@/lib/db/store";
import { WeeklySalary, WeekRange } from "@/types";
import { formatCurrency, formatRate } from "@/lib/utils/currency";
import { formatDateDisplay, getRecentWeeks } from "@/lib/utils/date";
import { convertToCSV, downloadCSV } from "@/lib/utils/export";

export default function AdminWeeklySalaryPage() {
  const { success, error } = useToast();
  const [weeks, setWeeks] = useState<WeekRange[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [salaries, setSalaries] = useState<WeeklySalary[]>([]);

  // Review Modal State
  const [reviewingSalary, setReviewingSalary] = useState<WeeklySalary | null>(null);
  const [finalSalaryInput, setFinalSalaryInput] = useState("");
  const [adjustmentInput, setAdjustmentInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pay Confirmation Dialog State
  const [payingSalary, setPayingSalary] = useState<WeeklySalary | null>(null);
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  const loadWeeksAndSalaries = React.useCallback(() => {
    const recent = getRecentWeeks(12);
    setWeeks(recent);
    const targetWeek = selectedWeekId || (recent[0]?.week_id ?? "");
    setSelectedWeekId(targetWeek);
    const list = store.getWeeklySalaries(targetWeek);
    setSalaries(list);
  }, [selectedWeekId]);

  useEffect(() => {
    loadWeeksAndSalaries();
  }, [loadWeeksAndSalaries]);

  const handleOpenReview = (salary: WeeklySalary) => {
    setReviewingSalary(salary);
    setFinalSalaryInput(String(salary.final_salary));
    setAdjustmentInput(String(salary.total_adjustments || 0));
    setNotesInput(salary.notes || "");
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSalary) return;

    const finalVal = parseFloat(finalSalaryInput);
    const adjVal = parseFloat(adjustmentInput) || 0;

    if (isNaN(finalVal) || finalVal < 0) {
      error("Final salary must be a positive number");
      return;
    }

    setIsSubmitting(true);
    try {
      store.reviewWeeklySalary(reviewingSalary.id, {
        final_salary: finalVal,
        adjustment_amount: adjVal,
        notes: notesInput.trim(),
      });

      success(`Salary updated for ${reviewingSalary.worker_name} (${formatCurrency(finalVal)}).`);
      setReviewingSalary(null);
      loadWeeksAndSalaries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update salary";
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPayConfirm = (salary: WeeklySalary) => {
    setPayingSalary(salary);
    setIsPayConfirmOpen(true);
  };

  const handleConfirmPayout = async () => {
    if (!payingSalary) return;
    try {
      store.markSalaryPaid(payingSalary.id, {
        payment_method: paymentMethod,
        notes: `Disbursed via ${paymentMethod}`,
      });

      success(
        `Disbursed ${formatCurrency(payingSalary.final_salary)} to ${payingSalary.worker_name}. Marked as PAID.`
      );
      setIsPayConfirmOpen(false);
      setPayingSalary(null);
      loadWeeksAndSalaries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record payout";
      error(msg);
    }
  };

  const totalPayroll = salaries.reduce((sum, s) => sum + s.final_salary, 0);
  const paidPayroll = salaries
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + s.final_salary, 0);
  const pendingPayroll = totalPayroll - paidPayroll;

  const handleExportCSV = () => {
    const csvData = salaries.map((s) => ({
      Week: s.week_id,
      Worker_ID: s.worker_id_code,
      Worker_Name: s.worker_name,
      Operation: s.operation_name,
      Total_Pieces: s.total_pieces,
      Rate: s.current_rate,
      Calculated_Amount: s.calculated_amount,
      Adjustments: s.total_adjustments,
      Final_Salary: s.final_salary,
      Status: s.status,
      Payment_Date: s.payment_date || "N/A",
    }));

    const csv = convertToCSV(csvData);
    downloadCSV(`MK_Appreals_Weekly_Salary_${selectedWeekId}.csv`, csv);
    success("Weekly salary settlement exported to CSV.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Week Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33] flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[#C89B3C]" /> Weekly Salary Review & Payout
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review worker piece tallies, verify calculated earnings, apply adjustments, and disburse wages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Week:</span>
            <select
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 shadow-sm focus:outline-none focus:border-[#0B1F33] font-semibold"
            >
              {weeks.map((w) => (
                <option key={w.week_id} value={w.week_id}>
                  {w.week_id} ({w.label}) {w.is_current ? "• CURRENT" : ""}
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
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#C89B3C]" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">
            Total Weekly Payroll
          </span>
          <div className="text-2xl font-bold font-mono text-[#0B1F33] mt-1">
            {formatCurrency(totalPayroll)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {salaries.length} operators settled
          </span>
        </div>

        <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">
            Disbursed (Paid)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(paidPayroll)}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">
            {salaries.filter((s) => s.status === "PAID").length} payouts finalized
          </span>
        </div>

        <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">
            Pending Approval
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {formatCurrency(pendingPayroll)}
          </div>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block">
            {salaries.filter((s) => s.status === "PENDING").length} awaiting review
          </span>
        </div>
      </div>

      {/* Weekly Salary Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            WEEKLY SALARY UPDATES — {selectedWeekId}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Monday–Sunday wage settlement
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Worker ID</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4 text-right">Total Pieces</th>
                <th className="py-3 px-4 text-right">Rate</th>
                <th className="py-3 px-4 text-right">Calculated</th>
                <th className="py-3 px-4 text-right">Final Salary</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Payment Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No weekly salary records found for this period.
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => (
                  <tr key={salary.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{salary.worker_name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                      {salary.worker_id_code}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{salary.operation_name}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {salary.total_pieces.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatRate(salary.current_rate || 2.0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(salary.calculated_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-slate-900">
                      {formatCurrency(salary.final_salary)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={salary.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {salary.payment_date ? formatDateDisplay(salary.payment_date) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {salary.status === "PENDING" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReview(salary)}
                              className="text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                            >
                              <Edit className="h-3 w-3 mr-1 text-[#C89B3C]" /> Review
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleOpenPayConfirm(salary)}
                              className="text-xs bg-[#0B1F33] hover:bg-[#132d4a] text-white font-medium"
                            >
                              Mark Paid
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Disbursed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WEEKLY SALARY REVIEW MODAL */}
      {reviewingSalary && (
        <Modal
          isOpen={true}
          onClose={() => setReviewingSalary(null)}
          title="WEEKLY SALARY REVIEW"
          description={`Review and settle wage payout for ${reviewingSalary.worker_name} (${reviewingSalary.worker_id_code})`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveReview} className="space-y-4 mt-2">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Worker:</span>
                <span className="font-bold text-slate-900">{reviewingSalary.worker_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Worker ID:</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {reviewingSalary.worker_id_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operation:</span>
                <span className="text-slate-800 font-medium">{reviewingSalary.operation_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pay Week:</span>
                <span className="font-mono text-slate-800">{reviewingSalary.week_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Pieces:</span>
                <span className="font-mono font-bold text-slate-900">
                  {reviewingSalary.total_pieces.toLocaleString()} pcs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Rate:</span>
                <span className="font-mono text-slate-700">
                  {formatRate(reviewingSalary.current_rate || 2.0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="text-slate-600 font-semibold">Calculated Amount:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(reviewingSalary.calculated_amount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Admin Final Salary (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={finalSalaryInput}
                onChange={(e) => setFinalSalaryInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-[#0B1F33] focus:ring-1 focus:ring-[#0B1F33]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Adjustment / Incentive / Deduction (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={adjustmentInput}
                onChange={(e) => setAdjustmentInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0B1F33]"
              />
              <span className="text-[10px] text-slate-500">
                Positive for bonus/incentive, negative for deductions.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Settlement Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Overtime bonus included / Perfect attendance"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1F33]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewingSalary(null)}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="bg-[#0B1F33] hover:bg-[#132d4a] text-white font-semibold"
              >
                SAVE SALARY
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MARK AS PAID CONFIRMATION DIALOG */}
      {payingSalary && (
        <Modal
          isOpen={isPayConfirmOpen}
          onClose={() => setIsPayConfirmOpen(false)}
          title="Disburse & Mark as Paid"
          description={`Confirm financial payout to ${payingSalary.worker_name} (${payingSalary.worker_id_code})`}
          maxWidth="sm"
        >
          <div className="py-2 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">
                Amount to Disburse
              </span>
              <div className="text-3xl font-extrabold font-mono text-[#0B1F33] mt-1">
                {formatCurrency(payingSalary.final_salary)}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Week {payingSalary.week_id} • {payingSalary.total_pieces} pieces
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1F33]"
              >
                <option value="CASH">Cash in Hand</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Note: Marking as PAID locks this settlement record and timestamps the disbursement into the audit log.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPayConfirmOpen(false)}
                className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmPayout}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Confirm Payout
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
