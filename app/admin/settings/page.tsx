"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Calendar,
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  Power,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { store } from "@/lib/db/store";
import { AdminAccount, CompanySettings } from "@/types";
import { formatDateDisplay } from "@/lib/utils/date";

export default function AdminSettingsPage() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<
    "COMPANY" | "WORK_WEEK" | "ADMIN_MANAGEMENT" | "SECURITY"
  >("ADMIN_MANAGEMENT");

  const [settings, setSettings] = useState<CompanySettings>(store.getSettings());
  const [admins, setAdmins] = useState<AdminAccount[]>([]);

  // Add Admin Modal
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove Admin Modal
  const [adminToRemove, setAdminToRemove] = useState<AdminAccount | null>(null);
  const [removeReason, setRemoveReason] = useState("");

  const loadAdmins = () => {
    setAdmins(store.getAdmins());
    setSettings(store.getSettings());
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      store.addAdmin({
        full_name: newAdminName.trim(),
        email: newAdminEmail.trim(),
      });
      success(`Admin account added for ${newAdminEmail}.`);
      setIsAddAdminOpen(false);
      setNewAdminName("");
      setNewAdminEmail("");
      loadAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add admin";
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAdminStatus = (admin: AdminAccount) => {
    try {
      store.deactivateAdmin(admin.id, "Admin", "Admin status updated via settings");
      success(`Administrator ${admin.full_name} status updated.`);
      loadAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update admin status";
      error(msg);
    }
  };

  const handleConfirmRemove = () => {
    if (!adminToRemove) return;
    try {
      store.removeAdmin(adminToRemove.id, "Admin", removeReason);
      success(`Administrator access removed for ${adminToRemove.full_name}.`);
      setAdminToRemove(null);
      setRemoveReason("");
      loadAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove admin";
      error(msg);
    }
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings(settings, "Admin");
    success("Company profile settings saved successfully.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33] flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#C89B3C]" /> Factory System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure plant parameters, manage authorized administrators, and audit security policies.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {[
          { id: "ADMIN_MANAGEMENT", label: "Admin Management", icon: Shield },
          { id: "COMPANY", label: "Company Information", icon: Building },
          { id: "WORK_WEEK", label: "Working Week & Cycles", icon: Calendar },
          { id: "SECURITY", label: "Security & RLS", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                isSelected
                  ? "border-[#0B1F33] text-[#0B1F33] bg-white rounded-t-lg shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ADMIN MANAGEMENT (Section 44) */}
      {activeTab === "ADMIN_MANAGEMENT" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0B1F33] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#C89B3C]" /> Authorized Administrator Accounts
              </h2>
              <p className="text-xs text-slate-500">
                Grant or revoke supervisor privileges. Google sign-in checks this authorized whitelist.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsAddAdminOpen(true)}
              className="bg-[#0B1F33] hover:bg-[#132d4a] text-white font-medium"
            >
              <UserPlus className="h-4 w-4 mr-1.5" /> + Add Authorized Admin
            </Button>
          </div>

          {/* Security Banner: Last Admin Guard */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
            <ShieldCheck className="h-5 w-5 text-[#0B1F33] shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-semibold">
                Critical Security Rule Enforced:
              </strong>
              The system strictly forbids deactivating or removing the last remaining active Administrator. At least one administrator account must permanently exist to prevent accidental lockout.
            </div>
          </div>

          {/* Admin Accounts Table */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Enrolled Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{adm.full_name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{adm.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                          {adm.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={adm.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {formatDateDisplay(adm.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleAdminStatus(adm)}
                            title={adm.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              adm.status === "ACTIVE"
                                ? "text-slate-500 border-slate-200 hover:text-amber-600 hover:bg-slate-50"
                                : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setAdminToRemove(adm)}
                            title="Remove Admin Access"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY INFORMATION */}
      {activeTab === "COMPANY" && (
        <form onSubmit={handleSaveCompanySettings} className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-[#0B1F33] flex items-center gap-2">
            <Building className="h-4 w-4 text-[#C89B3C]" /> Garment Manufacturing Unit Profile
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Company Name
            </label>
            <input
              type="text"
              required
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1F33]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Unit / Floor Code
              </label>
              <input
                type="text"
                required
                value={settings.unit_code}
                onChange={(e) => setSettings({ ...settings, unit_code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1F33]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                required
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0B1F33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Factory Unit Address
            </label>
            <textarea
              rows={2}
              required
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1F33]"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" className="bg-[#0B1F33] hover:bg-[#132d4a] text-white font-medium">
              Save Company Settings
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: WORK WEEK & CYCLES */}
      {activeTab === "WORK_WEEK" && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-[#0B1F33] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#C89B3C]" /> Wage Settlement Week Configuration
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Work Week Start Day
              </label>
              <input
                type="text"
                disabled
                value={settings.work_week_start}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 font-medium"
              />
              <span className="text-[10px] text-slate-500">Tirupur manufacturing standard</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Work Week End Day
              </label>
              <input
                type="text"
                disabled
                value={settings.work_week_end}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 font-medium"
              />
              <span className="text-[10px] text-slate-500">Sunday 23:59 weekly cutoff</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_week_close}
                onChange={(e) => setSettings({ ...settings, auto_week_close: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-[#0B1F33] focus:ring-[#0B1F33]"
              />
              <span className="text-xs text-slate-700">
                Automatically aggregate weekly piece totals into Pending Salary reviews on Sunday night
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & RLS */}
      {activeTab === "SECURITY" && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-[#0B1F33] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#C89B3C]" /> Security & Access Controls
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">PostgreSQL Row Level Security (RLS)</span>
                <span className="text-slate-500">Strict database-layer isolation active on all tables</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-mono text-[10px]">
                ENFORCED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Rate Snapshot Immutability</span>
                <span className="text-slate-500">Past production entries permanently retain entry-time rates</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-mono text-[10px]">
                IMMUTABLE
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Disbursed Salary Lock</span>
                <span className="text-slate-500">Paid records protected against casual modification</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-mono text-[10px]">
                LOCKED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADMIN MODAL */}
      <Modal
        isOpen={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        title="Add Authorized Administrator"
        description="Grant admin management access to a factory supervisor or plant partner."
      >
        <form onSubmit={handleAddAdmin} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1F33]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email Address (Google Login & Access) *
            </label>
            <input
              type="email"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1F33]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddAdminOpen(false)}
              className="text-slate-600 border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-[#0B1F33] hover:bg-[#132d4a] text-white font-medium"
            >
              GRANT ADMIN ACCESS
            </Button>
          </div>
        </form>
      </Modal>

      {/* REMOVE ADMIN CONFIRMATION MODAL (Section 44) */}
      {adminToRemove && (
        <Modal
          isOpen={true}
          onClose={() => setAdminToRemove(null)}
          title="Remove Admin Access"
          description={`Remove administrative permissions from ${adminToRemove.full_name} (${adminToRemove.email})?`}
          maxWidth="sm"
        >
          <div className="py-2 space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>
                This user will immediately lose access to the factory management dashboard, piece rate configuration, and wage review.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Reason for Removal (Audited)
              </label>
              <input
                type="text"
                placeholder="Reason for administrative removal"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B1F33]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdminToRemove(null)}
                className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmRemove}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                Remove Access
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
