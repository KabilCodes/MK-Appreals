"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export { Logo } from "./Logo";

interface AppLogoProps {
  variant?: "icon" | "horizontal" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  subtitle?: string;
  href?: string;
  className?: string;
  showTagline?: boolean;
}

export function AppLogo({
  variant = "horizontal",
  size = "md",
  subtitle,
  href,
  className,
  showTagline = false,
}: AppLogoProps) {
  // Dimensions mapping
  const sizeMap = {
    sm: {
      box: "h-8 w-8 rounded-lg",
      width: 32,
      height: 32,
      title: "text-sm",
      sub: "text-[9px]",
    },
    md: {
      box: "h-10 w-10 rounded-xl",
      width: 40,
      height: 40,
      title: "text-base",
      sub: "text-[10px]",
    },
    lg: {
      box: "h-14 w-14 rounded-2xl",
      width: 56,
      height: 56,
      title: "text-xl",
      sub: "text-xs",
    },
    xl: {
      box: "h-24 w-24 rounded-3xl",
      width: 96,
      height: 96,
      title: "text-2xl",
      sub: "text-xs",
    },
  };

  const current = sizeMap[size];

  // Visual Icon element with subtle glowing gold-teal border
  const iconElement = (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-950 border border-amber-500/30 shadow-subtle flex items-center justify-center shrink-0 p-0.5 group-hover:border-amber-400/60 transition-all duration-200",
        current.box
      )}
    >
      <Image
        src="/logo.png"
        alt="MK APPREALS Logo"
        width={current.width}
        height={current.height}
        className="h-full w-full object-contain rounded-md"
        priority
      />
    </div>
  );

  let content: React.ReactNode;

  if (variant === "icon") {
    content = iconElement;
  } else if (variant === "full") {
    content = (
      <div className={cn("flex flex-col items-center text-center", className)}>
        <div className="relative mb-3.5 p-1 rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 shadow-elevated">
          <Image
            src="/logo.png"
            alt="MK APPREALS Brand Logo"
            width={100}
            height={100}
            className="h-24 w-24 object-contain rounded-xl"
            priority
          />
        </div>
        <h1 className={cn("font-extrabold tracking-tight text-white", current.title)}>
          MK APPREALS
        </h1>
        {subtitle ? (
          <span className={cn("font-medium text-amber-400 tracking-wide uppercase mt-0.5", current.sub)}>
            {subtitle}
          </span>
        ) : (
          <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold mt-0.5">
            Textile Solutions For A Better Tomorrow
          </span>
        )}
      </div>
    );
  } else {
    // horizontal
    content = (
      <div className={cn("flex items-center gap-3", className)}>
        {iconElement}
        <div className="flex flex-col">
          <div className={cn("font-bold text-white tracking-tight leading-tight", current.title)}>
            MK APPREALS
          </div>
          {subtitle && (
            <div className={cn("font-semibold uppercase tracking-wider text-teal-400 leading-tight", current.sub)}>
              {subtitle}
            </div>
          )}
          {showTagline && !subtitle && (
            <div className="text-[9px] text-slate-400 tracking-wide">
              Textile Solutions For A Better Tomorrow
            </div>
          )}
        </div>
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return <>{content}</>;
}
