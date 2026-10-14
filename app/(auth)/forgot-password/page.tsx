"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/ui/auth-card";
import { Logo } from "@/components/shared/Logo";
import { requestPasswordReset } from "@/lib/auth/session";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await requestPasswordReset(email);
      setSubmittedMessage(res.message);
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
            Security Recovery
          </span>
        </div>

        <div className="text-left mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-300 text-gold-600 flex items-center justify-center font-bold text-xl mb-4 shadow-subtle">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
            Reset your password
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-charcoal-600 leading-relaxed">
            Enter your registered email and we&apos;ll send you a secure reset link.
          </p>
        </div>

        {submittedMessage ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-xs sm:text-sm font-medium text-emerald-800 leading-relaxed">
              {submittedMessage}
            </p>
            <div className="pt-2">
              <Link
                href="/reset-password"
                className="inline-block text-xs font-semibold text-navy-900 hover:underline"
              >
                Proceed to Enter New Password →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email Address"
              type="email"
              required
              placeholder="Enter registered email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-navy-950 hover:bg-navy-900 text-white font-bold h-12 rounded-xl shadow-card"
              isLoading={isSubmitting}
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <span className="text-[11px] text-charcoal-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-gold-600" /> Secure Anti-enumeration Protection Enforced
              </span>
            </div>
          </form>
        )}
      </AuthCard>
    </div>
  );
}
