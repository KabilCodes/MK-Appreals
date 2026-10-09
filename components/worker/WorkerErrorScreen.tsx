"use client";

import React from "react";
import { AlertCircle, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WorkerErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onLogin?: () => void;
}

export function WorkerErrorScreen({
  title = "Something went wrong",
  message = "We couldn't load your production data. Please try again.",
  onRetry,
  onLogin,
}: WorkerErrorScreenProps) {
  const handleLoginClick = () => {
    if (onLogin) {
      onLogin();
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("mk_session");
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="h-16 w-16 rounded-2xl bg-app-danger/10 border border-app-danger/20 text-app-danger flex items-center justify-center mb-4 shadow-subtle">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h3 className="text-lg font-bold text-navy-900 tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-charcoal-600 max-w-xs mb-6 leading-relaxed">{message}</p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="primary"
            className="w-full flex items-center justify-center gap-2 min-h-[44px]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        )}

        <Button
          onClick={handleLoginClick}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2 min-h-[44px]"
        >
          <LogIn className="h-4 w-4" />
          <span>Back to Login</span>
        </Button>
      </div>
    </div>
  );
}
