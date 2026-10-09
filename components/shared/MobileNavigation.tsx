"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function MobileNavigation() {
  const pathname = usePathname();

  const tabs = [
    { label: "Home", href: "/worker", icon: Home },
    { label: "History", href: "/worker/history", icon: History },
    { label: "Salary", href: "/worker/salary", icon: CreditCard },
    { label: "Profile", href: "/worker/profile", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-navy-950/95 border-t border-navy-800 backdrop-blur-lg px-2 py-2 flex items-center justify-around md:hidden"
      aria-label="Worker Mobile Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/worker"
            ? pathname === "/worker"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 px-2 rounded-xl text-[11px] font-semibold transition-colors select-none",
              isActive
                ? "text-gold-400 bg-navy-900"
                : "text-charcoal-400 hover:text-charcoal-200"
            )}
          >
            <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-gold-400" : "text-charcoal-400")} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
