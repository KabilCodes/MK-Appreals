"use client";

import React from "react";
import Link from "next/link";
import { Search, ChevronDown, Menu, X, User } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { Logo } from "./Logo";
import { WeekRange } from "@/types";

export interface TopbarProps {
  recentWeeks: WeekRange[];
  selectedWeek: string;
  onSelectWeek: (weekId: string) => void;
  onOpenSearch: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  adminName?: string;
}

export function Topbar({
  recentWeeks,
  selectedWeek,
  onSelectWeek,
  onOpenSearch,
  isSidebarOpen,
  onToggleSidebar,
  adminName = "MK Arun",
}: TopbarProps) {
  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-navy-950 border-b border-navy-800 sticky top-0 z-50">
        <Logo variant="horizontal" size="sm" subtitle="Admin" />
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-lg text-charcoal-400 hover:text-white hover:bg-navy-900 transition-colors"
            title="Search"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <NotificationDropdown role="ADMIN" />
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-charcoal-400 hover:text-white hover:bg-navy-900 transition-colors"
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Top Bar (Clean White Surface with subtle border) */}
      <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white border-b border-charcoal-200/80 sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
            Work Cycle:
          </span>
          {recentWeeks.length > 0 && (
            <div className="relative">
              <select
                value={selectedWeek}
                onChange={(e) => onSelectWeek(e.target.value)}
                className="appearance-none bg-warm-100 border border-charcoal-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-mono font-semibold text-charcoal-800 focus:outline-none focus:border-navy-900 shadow-subtle"
              >
                {recentWeeks.map((w) => (
                  <option key={w.week_id} value={w.week_id}>
                    {w.week_id} ({w.label}) {w.is_current ? "• CURRENT" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-charcoal-500 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 border border-charcoal-200/80 text-charcoal-500 hover:text-charcoal-800 text-xs transition-colors shadow-subtle"
          >
            <Search className="h-3.5 w-3.5 text-charcoal-400" />
            <span>Search everything...</span>
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white border border-charcoal-200 text-[10px] font-mono text-gold-600 font-bold">
              ⌘K
            </kbd>
          </button>

          <NotificationDropdown role="ADMIN" />

          <Link
            href="/worker"
            target="_blank"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white transition-all shadow-subtle flex items-center gap-1.5"
          >
            <span>Worker Portal</span>
            <span className="text-gold-400">↗</span>
          </Link>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-charcoal-200">
            <div className="w-8 h-8 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center font-bold text-xs shadow-subtle">
              {adminName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="font-bold text-charcoal-900 block">{adminName}</span>
              <span className="text-[10px] text-charcoal-500 font-medium">Administrator</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
