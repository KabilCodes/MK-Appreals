"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, Scissors, CreditCard, ChevronRight } from "lucide-react";
import { store } from "@/lib/db/store";
import { GlobalSearchResult } from "@/types";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const found = store.globalSearch(query);
      setResults(found);
    } else {
      setResults([]);
    }
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const categoryIcons = {
    WORKER: <Users className="h-4 w-4 text-[#0B1F33]" />,
    OPERATION: <Scissors className="h-4 w-4 text-[#C89B3C]" />,
    SALARY: <CreditCard className="h-4 w-4 text-emerald-600" />,
    PRODUCTION: <Search className="h-4 w-4 text-slate-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl z-10 overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search workers, IDs, operations, salaries... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Type a worker name, worker ID (e.g. MK001), operation (e.g. Overlock), or week to search.
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200">
                      {categoryIcons[item.category] || <Search className="h-4 w-4 text-slate-500" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#0B1F33]">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
          <span>Global Fast Index</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
