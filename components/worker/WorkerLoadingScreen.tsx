"use client";

import React from "react";
import { LogoMark } from "@/components/shared/Logo";
import { Loader2 } from "lucide-react";

export function WorkerLoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      {/* Brand Logo with Ambient Gold Glow */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-3xl bg-gold-500/10 blur-xl animate-pulse" />
        <LogoMark size="lg" className="relative shadow-elevated" />
      </div>

      <div className="space-y-2 max-w-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900/5 text-navy-900 text-xs font-bold uppercase tracking-wider">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-600" />
          <span>Production Floor</span>
        </div>

        <h3 className="text-base font-extrabold text-navy-900 tracking-tight">
          {message || "Loading your production dashboard..."}
        </h3>
        <p className="text-xs text-charcoal-500">
          Synchronizing piece rates and weekly wage settlements
        </p>
      </div>

      {/* Modern Skeleton Previews */}
      <div className="w-full max-w-sm mt-8 space-y-3 pointer-events-none opacity-60">
        <div className="h-28 rounded-2xl bg-charcoal-200/50 animate-pulse border border-charcoal-200" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-2xl bg-charcoal-200/40 animate-pulse border border-charcoal-200" />
          <div className="h-20 rounded-2xl bg-charcoal-200/40 animate-pulse border border-charcoal-200" />
        </div>
      </div>
    </div>
  );
}
