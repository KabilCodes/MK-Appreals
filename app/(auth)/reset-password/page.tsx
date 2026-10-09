"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthCard } from "@/components/ui/auth-card";
import { Logo } from "@/components/shared/Logo";
import { useToast } from "@/components/ui/toast";
import { confirmPasswordReset } from "@/lib/auth/session";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);

  // Requirements live check
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const allValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && isMatch;

  // Strength score
  const score = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-rose-500", "bg-amber-500", "bg-amber-400", "bg-emerald-500", "bg-emerald-600"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) {
      error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await confirmPasswordReset(newPassword);
      if (res.success) {
        setIsResetDone(true);
        success("Password updated successfully.");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        error(res.error || "Password does not meet security requirements.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-textile-subtle">
      <div className="mb-6">
        <Logo variant="horizontal" size="md" theme="light" subtitle="Textile Solutions For A Better Tomorrow" />
      </div>

      <AuthCard className="shadow-card border-charcoal-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-charcoal-100">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-navy-950 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
          <span className="text-[10px] font-mono text-charcoal-400 uppercase tracking-wider">
            Credential Reset
          </span>
        </div>

        <div className="text-left mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-300 text-gold-600 flex items-center justify-center font-bold text-xl mb-4 shadow-subtle">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
            Create New Password
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-charcoal-600 leading-relaxed">
            Choose a strong, compliant password for your MK APPREALS account.
          </p>
        </div>

        {isResetDone ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">Password updated successfully.</h3>
            <p className="text-xs text-emerald-700">Redirecting to login portal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5 select-none">
                New Password
              </label>
              <PasswordInput
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            {/* Password Strength Bar */}
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-charcoal-500">
                  <span>Password Strength</span>
                  <span className="font-semibold text-charcoal-700">
                    {strengthLabels[Math.max(0, score - 1)]}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-charcoal-100 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        lvl <= score ? strengthColors[score - 1] : "bg-charcoal-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5 select-none">
                Confirm Password
              </label>
              <PasswordInput
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            {/* Security Checklist */}
            <div className="p-3.5 rounded-xl bg-charcoal-50 border border-charcoal-200/80 space-y-1.5 text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block mb-1">
                Password Requirements:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  {hasMinLength ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-charcoal-400 shrink-0" />
                  )}
                  <span className={hasMinLength ? "text-charcoal-800 font-medium" : "text-charcoal-500"}>
                    8+ characters
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasUpper ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-charcoal-400 shrink-0" />
                  )}
                  <span className={hasUpper ? "text-charcoal-800 font-medium" : "text-charcoal-500"}>
                    Uppercase (A-Z)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasLower ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-charcoal-400 shrink-0" />
                  )}
                  <span className={hasLower ? "text-charcoal-800 font-medium" : "text-charcoal-500"}>
                    Lowercase (a-z)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasNumber ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-charcoal-400 shrink-0" />
                  )}
                  <span className={hasNumber ? "text-charcoal-800 font-medium" : "text-charcoal-500"}>
                    Number (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasSpecial ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-charcoal-400 shrink-0" />
                  )}
                  <span className={hasSpecial ? "text-charcoal-800 font-medium" : "text-charcoal-500"}>
                    Special character (!@#)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isMatch ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-charcoal-400 shrink-0" />
                  )}
                  <span className={isMatch ? "text-emerald-700 font-bold" : "text-charcoal-500"}>
                    Passwords match
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!allValid}
              className="w-full bg-navy-950 hover:bg-navy-900 text-white font-bold h-12 rounded-xl shadow-card"
              isLoading={isSubmitting}
            >
              Update Password <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        )}
      </AuthCard>
    </div>
  );
}
