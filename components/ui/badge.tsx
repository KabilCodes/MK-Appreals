import React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60 font-semibold",
    danger: "bg-rose-50 text-rose-700 border-rose-200/60 font-semibold",
    info: "bg-teal-50 text-teal-700 border-teal-200/60 font-semibold",
    outline: "border-slate-300 text-slate-700 bg-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  if (normalized === "PAID" || normalized === "ACTIVE" || normalized === "VERIFIED") {
    return <Badge variant="success">{status}</Badge>;
  }
  if (normalized === "PENDING" || normalized === "SUBMITTED" || normalized === "WAITING FOR ADMIN") {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (normalized === "INACTIVE" || normalized === "REJECTED") {
    return <Badge variant="danger">{status}</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}
