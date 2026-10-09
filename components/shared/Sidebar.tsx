"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Scissors,
  Layers,
  CreditCard,
  History,
  FileSpreadsheet,
  ShieldAlert,
  FileEdit,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./Logo";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminName?: string;
  onLogout: () => void;
  className?: string;
}

export function Sidebar({
  isOpen,
  onClose,
  adminName = "MK Arun",
  onLogout,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Workers", href: "/admin/workers", icon: Users },
    { label: "Production Feed", href: "/admin/production", icon: Scissors },
    { label: "Corrections", href: "/admin/corrections", icon: FileEdit },
    { label: "Operations & Rates", href: "/admin/operations", icon: Layers },
    { label: "Weekly Salary", href: "/admin/salary", icon: CreditCard },
    { label: "Salary History", href: "/admin/salary/history", icon: History },
    { label: "Reports & CSV", href: "/admin/reports", icon: FileSpreadsheet },
    { label: "Audit Logs", href: "/admin/audit", icon: ShieldAlert },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-navy-950 border-r border-navy-800 p-4 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      <div>
        {/* Brand Logo */}
        <div className="px-2 py-3 mb-4 border-b border-navy-800/80">
          <Logo variant="horizontal" size="sm" subtitle="Admin Console" />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-navy-800 text-gold-400 border border-gold-400/30 shadow-subtle"
                    : "text-charcoal-400 hover:bg-navy-900 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-gold-400" : "text-charcoal-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Sign Out */}
      <div className="pt-4 border-t border-navy-800/80">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">{adminName}</div>
            <div className="text-[11px] text-gold-400 font-mono">Role: ADMIN</div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-400 hover:bg-navy-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
