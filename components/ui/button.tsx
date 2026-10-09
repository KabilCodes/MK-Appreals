import React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

    const variants = {
      default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
      primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm active:bg-brand-800",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200/80",
      outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
      success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    };

    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-11 px-4 py-2 text-sm",
      lg: "h-13 px-6 py-3 text-base font-semibold",
      icon: "h-10 w-10 p-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
