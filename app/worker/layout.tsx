"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, CreditCard, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { LogoMark } from "@/components/shared/Logo";
import { useWorkerSession } from "@/hooks/use-worker-session";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, worker, logout } = useWorkerSession();

  const navItems = [
    { label: "Home", href: "/worker", icon: Home },
    { label: "History", href: "/worker/history", icon: History },
    { label: "Salary", href: "/worker/salary", icon: CreditCard },
    { label: "Profile", href: "/worker/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#17202A] flex flex-col justify-between pb-24 md:pb-8 selection:bg-gold-500 selection:text-white">
      {/* =======================================================================
          TOP MOBILE HEADER (Section 6)
          ======================================================================= */}
      <header className="border-b border-navy-800 bg-navy-900 px-4 py-3 sticky top-0 z-40 text-white shadow-elevated">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Brand Left */}
          <Link href="/worker" className="flex items-center gap-2.5 group">
            <LogoMark size="sm" className="shadow-subtle" />
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight leading-none block group-hover:text-gold-300 transition-colors">
                MK APPREALS
              </span>
              <span className="text-[10px] text-gold-400 font-bold uppercase tracking-wider block mt-0.5">
                Production Floor
              </span>
            </div>
          </Link>

          {/* User Controls Right */}
          <div className="flex items-center gap-2">
            {session && worker && (
              <>
                <div className="text-right hidden xs:block">
                  <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                    {worker.full_name}
                  </span>
                  <span className="text-[10px] font-mono text-gold-400 font-semibold">
                    {worker.worker_id}
                  </span>
                </div>
                <NotificationDropdown
                  role="WORKER"
                  userId={worker.id}
                />
              </>
            )}

            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-xl text-charcoal-400 hover:text-white hover:bg-navy-800 active:bg-navy-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-navy-800 hover:border-navy-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =======================================================================
          MAIN CONTENT AREA (Mobile-First 440px Container)
          ======================================================================= */}
      <main className="max-w-md w-full mx-auto p-4 flex-1">
        {children}
      </main>

      {/* =======================================================================
          BOTTOM MOBILE NAVIGATION (Section 12 - 48px Minimum Touch Target)
          ======================================================================= */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-charcoal-200/90 z-50 py-1.5 px-3 shadow-elevated"
        aria-label="Mobile Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/worker"
                ? pathname === "/worker"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 min-h-[48px] select-none text-center",
                  isActive
                    ? "text-navy-900 bg-warm-100 font-extrabold border border-charcoal-200/80 shadow-subtle"
                    : "text-charcoal-500 hover:text-navy-900 active:bg-charcoal-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive ? "stroke-[2.5] text-gold-600 scale-105" : "stroke-[1.75]"
                  )}
                />
                <span className={cn("text-[11px] mt-0.5", isActive ? "font-bold text-navy-900" : "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
