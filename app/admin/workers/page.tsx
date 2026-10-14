"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Edit2,
  Power,
  Scissors,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { store } from "@/lib/db/store";
import { WorkerWithStats, Operation } from "@/types";
import { SupabaseDbService } from "@/services/supabase-db.service";
import { formatCurrency, formatRate } from "@/lib/utils/currency";

export default function AdminWorkersPage() {
  const { success, error } = useToast();
  const [workers, setWorkers] = useState<WorkerWithStats[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [operationFilter, setOperationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Worker Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    worker_id: "",
    full_name: "",
    mobile: "",
    email: "",
    password: "",
    operation_id: "",
    custom_rate_override: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Edit Worker Modal state
  const [editingWorker, setEditingWorker] = useState<WorkerWithStats | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    password: "",
    operation_id: "",
    custom_rate_override: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Status toggle confirmation
  const [toggleConfirmWorker, setToggleConfirmWorker] = useState<WorkerWithStats | null>(null);

  const loadData = () => {
    setWorkers(store.getWorkersWithStats());
    setOperations(store.getOperations());
  };

  useEffect(() => {
    loadData();

    SupabaseDbService.getWorkers()
      .then((remote) => {
        if (remote && remote.length > 0) {
          store.syncFromSupabase({ workers: remote });
          loadData();
        }
      })
      .catch((err) => console.warn("[AdminWorkers] Supabase sync fallback:", err));
  }, []);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesSearch =
        w.worker_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.email && w.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        w.mobile.includes(searchQuery);

      const matchesOp =
        operationFilter === "ALL" || w.operation_id === operationFilter;

      const matchesStatus =
        statusFilter === "ALL" || w.status === statusFilter;

      return matchesSearch && matchesOp && matchesStatus;
    });
  }, [workers, searchQuery, operationFilter, statusFilter]);

  const handleOpenCreate = () => {
    setFormData({
      worker_id: "",
      full_name: "",
      mobile: "",
      email: "",
      password: "",
      operation_id: operations[0]?.id || "",
      custom_rate_override: "",
      status: "ACTIVE",
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const customRate = formData.custom_rate_override.trim()
        ? parseFloat(formData.custom_rate_override)
        : null;

      let authUserId: string | undefined = undefined;

      // Provision Supabase Auth account and remote database records via server API
      try {
        const res = await fetch("/api/admin/workers/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worker_id: formData.worker_id.trim().toUpperCase(),
            full_name: formData.full_name.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email.trim() || undefined,
            password: formData.password.trim() || undefined,
            operation_id: formData.operation_id,
            custom_rate_override: customRate,
            status: formData.status,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.auth_user_id) {
            authUserId = data.auth_user_id;
          }
        }
      } catch (provErr) {
        console.warn("[AdminWorkers] Auth provision fallback:", provErr);
      }

      const createdWorker = store.createWorker({
        worker_id: formData.worker_id.trim().toUpperCase(),
        full_name: formData.full_name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || undefined,
        password: formData.password.trim() || undefined,
        operation_id: formData.operation_id,
        custom_rate_override: customRate,
        status: formData.status,
        profile_id: authUserId,
      });

      // Synchronize with remote Supabase database if reachable
      SupabaseDbService.insertWorker(createdWorker).catch((err) =>
        console.warn("[AdminWorkers] Supabase worker insert fallback:", err)
      );

      success(`Worker ${formData.full_name} (${formData.worker_id}) created with portal access.`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create worker";
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (worker: WorkerWithStats) => {
    setEditingWorker(worker);
    setEditFormData({
      full_name: worker.full_name,
      mobile: worker.mobile,
      email: worker.email || "",
      password: worker.password || "",
      operation_id: worker.operation_id,
      custom_rate_override: worker.custom_rate_override !== null && worker.custom_rate_override !== undefined ? String(worker.custom_rate_override) : "",
      status: worker.status,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    setIsSubmitting(true);

    try {
      const customRate = editFormData.custom_rate_override.trim()
        ? parseFloat(editFormData.custom_rate_override)
        : null;

      let authUserId = editingWorker.profile_id;

      // Provision or update Supabase Auth account and remote database records via server API
      try {
        const res = await fetch("/api/admin/workers/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            existingWorkerId: editingWorker.id,
            worker_id: editingWorker.worker_id,
            full_name: editFormData.full_name.trim(),
            mobile: editFormData.mobile.trim(),
            email: editFormData.email.trim() || undefined,
            password: editFormData.password.trim() || undefined,
            operation_id: editFormData.operation_id,
            custom_rate_override: customRate,
            status: editFormData.status,
            profile_id: editingWorker.profile_id,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.auth_user_id) {
            authUserId = data.auth_user_id;
          }
        }
      } catch (provErr) {
        console.warn("[AdminWorkers] Auth provision fallback:", provErr);
      }

      store.updateWorker(editingWorker.id, {
        full_name: editFormData.full_name.trim(),
        mobile: editFormData.mobile.trim(),
        email: editFormData.email.trim() || undefined,
        password: editFormData.password.trim() || undefined,
        operation_id: editFormData.operation_id,
        custom_rate_override: customRate,
        status: editFormData.status,
        profile_id: authUserId,
      });

      // Synchronize with remote Supabase database if reachable
      SupabaseDbService.updateWorker(editingWorker.id, {
        full_name: editFormData.full_name.trim(),
        mobile: editFormData.mobile.trim(),
        operation_id: editFormData.operation_id,
        custom_rate_override: customRate,
        status: editFormData.status,
        profile_id: authUserId,
      }).catch((err) =>
        console.warn("[AdminWorkers] Supabase worker update fallback:", err)
      );

      success(`Worker ${editingWorker.worker_id} updated with portal access.`);
      setEditingWorker(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update worker";
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (worker: WorkerWithStats) => {
    const nextStatus = worker.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    store.updateWorker(worker.id, { status: nextStatus });
    success(`${worker.full_name} is now ${nextStatus}`);
    setToggleConfirmWorker(null);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-charcoal-200/80">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-gold-600" /> Worker Management
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Enrolled garment floor operators, operation assignments, and individual rates.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          className="bg-navy-900 hover:bg-navy-950 text-white font-bold h-11 px-4 rounded-xl shadow-subtle"
        >
          <UserPlus className="h-4 w-4 mr-2 text-gold-400" /> Add Worker
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-white border border-charcoal-200/80 p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-card">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search workers by ID, name, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-charcoal-200 bg-warm-50 pl-10 pr-3.5 py-2.5 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-navy-900 transition-colors shadow-subtle"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Operation Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-charcoal-500">Operation:</span>
            <select
              value={operationFilter}
              onChange={(e) => setOperationFilter(e.target.value)}
              className="rounded-xl border border-charcoal-200 bg-warm-50 px-3 py-2 text-xs font-medium text-charcoal-800 focus:outline-none focus:border-navy-900 shadow-subtle"
            >
              <option value="ALL">All Operations</option>
              {operations.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-charcoal-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-charcoal-200 bg-warm-50 px-3 py-2 text-xs font-medium text-charcoal-800 focus:outline-none focus:border-navy-900 shadow-subtle"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workers Data Table */}
      <div className="rounded-2xl border border-charcoal-200/80 bg-white overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-100/80 border-b border-charcoal-200/80 text-charcoal-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3.5 px-4">Worker ID</th>
                <th scope="col" className="py-3.5 px-4">Name &amp; Mobile</th>
                <th scope="col" className="py-3.5 px-4">Operation</th>
                <th scope="col" className="py-3.5 px-4 text-right">Piece Rate</th>
                <th scope="col" className="py-3.5 px-4 text-center">Account Status</th>
                <th scope="col" className="py-3.5 px-4 text-right">This Week</th>
                <th scope="col" className="py-3.5 px-4 text-right">Estimated Earnings</th>
                <th scope="col" className="py-3.5 px-4 text-center">Salary Status</th>
                <th scope="col" className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-charcoal-400">
                    No workers match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    className="hover:bg-warm-50/60 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                      {worker.worker_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900">{worker.full_name}</div>
                      <div className="text-[11px] text-charcoal-500 font-mono">
                        {worker.mobile}
                        {worker.email ? ` • ${worker.email}` : ""}
                      </div>
                      {worker.password ? (
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          ✓ Portal Access Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          PIN / Floor Only
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-charcoal-700 font-medium">
                        <Scissors className="h-3.5 w-3.5 text-gold-600" />
                        {worker.operation_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-navy-900">
                      {formatRate(worker.current_rate)}
                      {worker.custom_rate_override !== null && worker.custom_rate_override !== undefined && (
                        <span className="text-[10px] text-gold-600 block font-sans font-medium">Custom</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={worker.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal-800">
                      {worker.this_week_pieces.toLocaleString()} pcs
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(worker.this_week_earnings)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={worker.salary_status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/workers/${worker.id}`}
                          title="View Profile"
                          aria-label="View worker profile"
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-navy-900 hover:bg-warm-100 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(worker)}
                          title="Edit Worker"
                          aria-label="Edit worker"
                          className="p-1.5 rounded-lg text-charcoal-500 hover:text-gold-600 hover:bg-warm-100 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setToggleConfirmWorker(worker)}
                          title={worker.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          aria-label={worker.status === "ACTIVE" ? "Deactivate worker" : "Activate worker"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            worker.status === "ACTIVE"
                              ? "text-charcoal-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE WORKER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Factory Worker"
        description="Enroll a new floor operator and configure their assigned operation rate."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Worker ID *"
              required
              placeholder="Worker ID"
              value={formData.worker_id}
              onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
            />
            <Input
              label="Full Name *"
              required
              placeholder="Operator name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mobile Number *"
              type="tel"
              required
              placeholder="10-digit mobile"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Operation *
              </label>
              <select
                value={formData.operation_id}
                onChange={(e) => setFormData({ ...formData, operation_id: e.target.value })}
                className="w-full h-11 sm:h-12 rounded-xl border border-charcoal-300 bg-white px-3.5 text-sm text-charcoal-900 focus:outline-none focus:border-navy-900 font-medium"
              >
                {operations.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name} ({formatRate(op.current_rate)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Worker Email (For Portal & Google Login)"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Login Password (Give Portal Access)"
              type="text"
              placeholder="Create login password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="Custom Rate Override (Optional)"
              type="number"
              step="0.05"
              placeholder="Leave empty to use standard rate"
              value={formData.custom_rate_override}
              onChange={(e) => setFormData({ ...formData, custom_rate_override: e.target.value })}
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-charcoal-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-navy-900 hover:bg-navy-950 text-white font-bold"
            >
              Save Worker
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT WORKER MODAL */}
      <Modal
        isOpen={Boolean(editingWorker)}
        onClose={() => setEditingWorker(null)}
        title={`Edit Worker — ${editingWorker?.worker_id}`}
        description="Update contact information and assigned operation rate."
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
          <Input
            label="Full Name *"
            required
            value={editFormData.full_name}
            onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mobile Number *"
              type="tel"
              required
              value={editFormData.mobile}
              onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Operation *
              </label>
              <select
                value={editFormData.operation_id}
                onChange={(e) => setEditFormData({ ...editFormData, operation_id: e.target.value })}
                className="w-full h-11 sm:h-12 rounded-xl border border-charcoal-300 bg-white px-3.5 text-sm text-charcoal-900 focus:outline-none focus:border-navy-900 font-medium"
              >
                {operations.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name} ({formatRate(op.current_rate)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Worker Email (For Portal & Google Login)"
              type="email"
              placeholder="name@company.com"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
            <Input
              label="Login Password (Give / Update Access)"
              type="text"
              placeholder="Enter new password or leave blank"
              value={editFormData.password}
              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
            />
          </div>

          <Input
            label="Custom Rate Override"
            type="number"
            step="0.05"
            placeholder="Leave empty for standard operation rate"
            value={editFormData.custom_rate_override}
            onChange={(e) => setEditFormData({ ...editFormData, custom_rate_override: e.target.value })}
          />

          <div className="pt-3 flex justify-end gap-3 border-t border-charcoal-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingWorker(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-navy-900 hover:bg-navy-950 text-white font-bold"
            >
              Update Worker
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DEACTIVATE/ACTIVATE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(toggleConfirmWorker)}
        title={toggleConfirmWorker?.status === "ACTIVE" ? "Deactivate Worker?" : "Activate Worker?"}
        description={
          toggleConfirmWorker?.status === "ACTIVE"
            ? `Are you sure you want to deactivate ${toggleConfirmWorker?.full_name}? They will be unable to log in to submit production pieces.`
            : `Are you sure you want to activate ${toggleConfirmWorker?.full_name}?`
        }
        confirmText={toggleConfirmWorker?.status === "ACTIVE" ? "Confirm Deactivation" : "Confirm Activation"}
        variant={toggleConfirmWorker?.status === "ACTIVE" ? "danger" : "primary"}
        onConfirm={() => toggleConfirmWorker && handleToggleStatus(toggleConfirmWorker)}
        onClose={() => setToggleConfirmWorker(null)}
      />
    </div>
  );
}
