"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
    xl: "h-12 w-12 border-4",
  };

  return (
    <div className="inline-flex items-center justify-center gap-2" role="status" aria-label={label}>
      <div
        className={cn(
          "rounded-full animate-spin border-charcoal-200 border-t-gold-500",
          sizeClasses[size],
          className
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
