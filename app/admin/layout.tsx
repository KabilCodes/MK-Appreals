"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthSession, WeekRange } from "@/types";
import { getRecentWeeks } from "@/lib/utils/date";
import { GlobalSearchModal } from "@/components/shared/GlobalSearchModal";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentWeeks, setRecentWeeks] = useState<WeekRange[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("mk_session");
    if (!raw) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed.user.role !== "ADMIN") {
        router.push("/worker");
        return;
      }
      setSession(parsed);
    } catch {
      router.push("/login");
    }

    const weeks = getRecentWeeks(8);
    setRecentWeeks(weeks);
    if (weeks.length > 0) {
      setSelectedWeek(weeks[0].week_id);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("mk_session");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#17202A] flex flex-col md:flex-row">
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Modular Desktop/Mobile Sidebar in Deep Navy */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        adminName={session?.user.name || "MK Arun"}
        onLogout={handleLogout}
      />

      {/* Main Content Area in Warm White Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          recentWeeks={recentWeeks}
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
          onOpenSearch={() => setIsSearchOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          adminName={session?.user.name || "MK Arun"}
        />

        <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto bg-[#F7F5F0]">
          {children}
        </main>
      </div>
    </div>
  );
}
