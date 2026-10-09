"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, User, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { Logo, LogoMark } from "@/components/shared/Logo";
import { AuthCard } from "@/components/ui/auth-card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { GoogleButton } from "@/components/ui/google-button";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { loginUser, loginWithGoogle } from "@/lib/auth/session";

export default function LoginPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google OAuth Modal
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("mkarun@gmail.com");
  const [googleNameInput, setGoogleNameInput] = useState("MK Arun");
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage("Please enter your User ID or Email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser({
        usernameOrId: identifier.trim(),
        password: password.trim(),
        rememberMe,
      });

      if (res.success && res.session) {
        localStorage.setItem("mk_session", JSON.stringify(res.session));
        success(`Welcome back, ${res.session.user.name}`);
        if (res.session.user.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/worker");
        }
      } else {
        setErrorMessage(res.error || "Invalid login credentials. Please check your details.");
      }
    } catch {
      setErrorMessage("Unable to connect to authentication service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError(null);
    setIsGoogleLoading(true);

    try {
      const res = await loginWithGoogle({
        email: googleEmailInput.trim(),
        name: googleNameInput.trim(),
      });

      if (res.success && res.session) {
        localStorage.setItem("mk_session", JSON.stringify(res.session));
        success(`Google authenticated. Role: ${res.session.user.role}`);
        setIsGoogleModalOpen(false);
        if (res.session.user.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/worker");
        }
      } else {
        setGoogleError(res.error || "Your account does not have access to MK APPREALS.");
      }
    } catch {
      setGoogleError("Google authentication failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F5F0]">
      {/* =========================================================================
          LEFT SIDE: Dark Navy Brand Panel (Desktop)
          ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-textile-pattern flex-col justify-between p-12 relative overflow-hidden text-white border-r border-[#143454]">
        {/* Subtle Warm Gold Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Wordmark */}
        <div className="relative z-10">
          <Logo variant="horizontal" size="sm" subtitle="Textile Solutions" className="text-white" />
        </div>

        {/* Center Heritage Display */}
        <div className="relative z-10 max-w-sm mx-auto text-center my-auto py-8">
          <div className="inline-block relative mb-6">
            <div className="p-3 rounded-2xl bg-navy-850 border border-gold-500/30 shadow-card">
              <LogoMark size="xl" priority />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            MK APPREALS
          </h2>

          <p className="mt-2 text-xs font-bold text-gold-400 tracking-widest uppercase">
            TEXTILE SOLUTIONS FOR A BETTER TOMORROW
          </p>

          <p className="mt-2 text-xs text-charcoal-400 font-medium">
            Production &amp; Wage Settlement
          </p>

          <div className="mt-8 pt-6 border-t border-navy-800/80 text-[11px] text-charcoal-400 space-y-1">
            <p>Garment Piece-Tracking • Immutable Piece Rates</p>
            <p>Audited Weekly Wage Settlement • Dual-Layer RLS</p>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="relative z-10 text-[11px] text-charcoal-500 flex items-center justify-between">
          <span>© 2026 MK APPREALS</span>
          <span className="font-mono">Production Edition</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: Clean Authentication Card on Warm Off-White
          ========================================================================= */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">
        <AuthCard className="shadow-card border-charcoal-200/80 bg-white max-w-[400px]">
          {/* Card Header with LogoMark */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <LogoMark size="md" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-1 text-xs text-charcoal-500">
              Sign in to continue to MK APPREALS
            </p>
          </div>

          {/* Inline Error Notice */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="User ID / Email"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. mkarun@gmail.com or Worker ID"
              leftIcon={<User className="h-4 w-4" />}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider select-none"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-gold-600 hover:text-gold-700 font-semibold transition-colors focus:outline-none"
                >
                  Forgot Password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-charcoal-300 text-navy-900 focus:ring-navy-900 focus:ring-offset-0"
                />
                <span className="text-xs text-charcoal-600 font-medium">Remember Me</span>
              </label>
            </div>

            {/* Primary Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-navy-900 hover:bg-navy-950 text-white font-bold h-11 sm:h-12 rounded-xl shadow-subtle transition-all"
            >
              Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-charcoal-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-charcoal-400 font-semibold tracking-wider">
                OR
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <GoogleButton
            onClick={() => {
              setGoogleError(null);
              setIsGoogleModalOpen(true);
            }}
          >
            Continue with Google
          </GoogleButton>

          {/* Small Footer */}
          <div className="mt-5 text-center">
            <span className="text-[11px] text-charcoal-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-gold-600" />
              Secure company access
            </span>
          </div>
        </AuthCard>
      </div>

      {/* Google Sign-in Verification Modal */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Sign in with Google"
      >
        <form onSubmit={handleGoogleSubmit} className="space-y-4">
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Enter your Google account email. Role authorization is derived securely from factory records.
          </p>

          {googleError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{googleError}</span>
            </div>
          )}

          <Input
            label="Google Account Email"
            type="email"
            required
            value={googleEmailInput}
            onChange={(e) => setGoogleEmailInput(e.target.value)}
            placeholder="mkarun@gmail.com"
          />

          <Input
            label="Display Name"
            type="text"
            required
            value={googleNameInput}
            onChange={(e) => setGoogleNameInput(e.target.value)}
            placeholder="MK Arun"
          />

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGoogleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isGoogleLoading}
              className="bg-navy-900 hover:bg-navy-950 text-white font-semibold"
            >
              Verify &amp; Sign In
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
