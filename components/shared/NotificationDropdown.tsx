"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, Clock, ExternalLink } from "lucide-react";
import { AppNotification, UserRole } from "@/types";
import { store } from "@/lib/db/store";
import { formatDateDisplay } from "@/lib/utils/date";

interface NotificationDropdownProps {
  role?: UserRole;
  userId?: string;
  variant?: "light" | "dark";
}

export function NotificationDropdown({ role = "ADMIN", userId, variant = "light" }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = useCallback(() => {
    const list = store.getNotifications(role, userId);
    setNotifications(list);
  }, [role, userId]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    store.markAllNotificationsRead(role);
    loadNotifications();
  };

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          variant === "dark"
            ? "relative p-2 rounded-xl text-charcoal-300 hover:text-white hover:bg-navy-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-navy-800 hover:border-navy-700"
            : "relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        }
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold font-mono text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E2E8F0] p-4 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#0B1F33] text-[10px] font-bold font-mono border border-slate-200">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-[#0B1F33] hover:underline font-semibold"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="mt-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-2.5 px-2 rounded-lg flex items-start justify-between gap-2 transition-colors ${
                      n.read ? "opacity-70 hover:opacity-100" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#C89B3C] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setIsOpen(false)}
                            className="text-[#0B1F33] hover:underline flex items-center gap-0.5 font-medium"
                          >
                            View details <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        title="Mark as read"
                        className="p-1 rounded text-slate-400 hover:text-slate-700"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
