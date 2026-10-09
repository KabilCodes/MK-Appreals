"use client";

import React, { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, InputProps } from "./input";

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightIcon"> {
  showToggle?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <Input
        ref={ref}
        type={isVisible ? "text" : "password"}
        rightIcon={
          showToggle ? (
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 focus:outline-none transition-colors"
              aria-label={isVisible ? "Hide password" : "Show password"}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
