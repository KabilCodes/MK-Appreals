"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface LogoProps {
  variant?: "logo-full" | "logo-mark" | "horizontal";
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark";
  subtitle?: string;
  tagline?: string;
  href?: string;
  className?: string;
  priority?: boolean;
}

export function LogoMark({
  size = "md",
  className,
  priority = true,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}) {
  const sizeMap = {
    sm: { box: "h-9 w-9 rounded-xl p-1", width: 36, height: 36 },
    md: { box: "h-11 w-11 rounded-xl p-1.5", width: 44, height: 44 },
    lg: { box: "h-16 w-16 rounded-2xl p-2", width: 64, height: 64 },
    xl: { box: "h-20 w-20 rounded-2xl p-2.5", width: 80, height: 80 },
  };
  const current = sizeMap[size];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-navy-900 border border-gold-500/30 shadow-subtle flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105",
        current.box,
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="MK APPREALS"
        width={current.width}
        height={current.height}
        className="h-full w-full object-contain"
        priority={priority}
      />
    </div>
  );
}

export function Logo({
  variant = "logo-full",
  size = "md",
  theme = "dark",
  subtitle,
  tagline = "TEXTILE SOLUTIONS FOR A BETTER TOMORROW",
  href,
  className,
  priority = true,
}: LogoProps) {
  const sizeMap = {
    sm: {
      title: "text-sm",
      sub: "text-[10px]",
    },
    md: {
      title: "text-base",
      sub: "text-xs",
    },
    lg: {
      title: "text-xl",
      sub: "text-xs",
    },
    xl: {
      title: "text-2xl sm:text-3xl",
      sub: "text-xs sm:text-sm",
    },
  };

  const current = sizeMap[size];

  if (variant === "logo-mark") {
    const mark = <LogoMark size={size} className={className} priority={priority} />;
    return href ? <Link href={href}>{mark}</Link> : mark;
  }

  let content: React.ReactNode;

  const isLight = theme === "light";
  const titleColor = isLight ? "text-navy-900" : "text-white";
  const subColor = isLight ? "text-gold-700" : "text-gold-400";
  const tagColor = isLight ? "text-charcoal-500" : "text-charcoal-300";

  if (variant === "horizontal") {
    content = (
      <div className={cn("inline-flex items-center gap-3", className)}>
        <LogoMark size={size} priority={priority} />
        <div className="flex flex-col text-left">
          <span className={cn("font-bold tracking-tight leading-tight", titleColor, current.title)}>
            MK APPREALS
          </span>
          {subtitle ? (
            <span className={cn("font-semibold uppercase tracking-wider leading-tight mt-0.5", subColor, current.sub)}>
              {subtitle}
            </span>
          ) : (
            <span className={cn("text-[10px] tracking-wider uppercase font-medium mt-0.5", tagColor)}>
              {tagline}
            </span>
          )}
        </div>
      </div>
    );
  } else {
    // variant === "logo-full"
    content = (
      <div className={cn("flex flex-col items-center text-center", className)}>
        <div className="relative mb-3.5 p-2 rounded-2xl bg-gradient-to-b from-navy-850 to-navy-950 border border-gold-500/30 shadow-elevated">
          <Image
            src="/logo.png"
            alt="MK APPREALS Brand Logo"
            width={88}
            height={88}
            className="h-20 w-20 sm:h-22 sm:w-22 object-contain rounded-xl"
            priority={priority}
          />
        </div>
        <h1 className={cn("font-extrabold tracking-tight", titleColor, current.title)}>
          MK APPREALS
        </h1>
        {subtitle ? (
          <span className={cn("font-semibold tracking-wider uppercase mt-1", subColor, current.sub)}>
            {subtitle}
          </span>
        ) : (
          <span className={cn("text-xs sm:text-sm tracking-wider font-semibold uppercase mt-1", subColor)}>
            {tagline}
          </span>
        )}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-95 transition-opacity focus:outline-none">
        {content}
      </Link>
    );
  }

  return <>{content}</>;
}
