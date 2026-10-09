"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while processing your request. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8 text-center max-w-md mx-auto my-6",
        className
      )}
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-charcoal-900">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-charcoal-600 leading-relaxed">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-rose-300 text-rose-700 hover:bg-rose-100/60"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
