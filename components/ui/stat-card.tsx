import React from "react";
import { cn } from "@/lib/utils/cn";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: "default" | "brand" | "amber" | "emerald" | "slate";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const iconBgs = {
    default: "bg-slate-100 text-slate-700",
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-900 text-white",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-5 shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={cn("p-2 rounded-lg", iconBgs[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-mono">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="mt-1 flex items-center text-xs text-slate-500">
            {trend && (
              <span
                className={cn(
                  "font-medium mr-1.5",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.value}
              </span>
            )}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
