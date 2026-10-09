"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md bg-white border border-charcoal-200/80 rounded-2xl p-6 sm:p-9 shadow-card relative",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
