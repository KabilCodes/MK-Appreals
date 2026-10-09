"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthSession, Worker, WeeklySalary } from "@/types";
import { store } from "@/lib/db/store";

export interface WorkerSessionState {
  session: AuthSession | null;
  worker: Worker | null;
  operationName: string;
  currentRate: number;
  todayPieces: number;
  todayEarnings: number;
  thisWeekPieces: number;
  thisWeekEarnings: number;
  weeklySalary: WeeklySalary | null;
  isLoading: boolean;
  error: string | null;
  isProfileMissing: boolean;
  refresh: () => void;
  logout: () => void;
}

export function useWorkerSession(): WorkerSessionState {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [operationName, setOperationName] = useState<string>("Unassigned");
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [todayPieces, setTodayPieces] = useState<number>(0);
  const [todayEarnings, setTodayEarnings] = useState<number>(0);
  const [thisWeekPieces, setThisWeekPieces] = useState<number>(0);
  const [thisWeekEarnings, setThisWeekEarnings] = useState<number>(0);
  const [weeklySalary, setWeeklySalary] = useState<WeeklySalary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileMissing, setIsProfileMissing] = useState<boolean>(false);

  const isMountedRef = useRef(true);

  const loadData = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      setIsLoading(true);
      setError(null);
      setIsProfileMissing(false);

      const raw = localStorage.getItem("mk_session");
      if (!raw) {
        // Not authenticated -> redirect to login
        router.replace("/login");
        return;
      }

      let parsed: AuthSession;
      try {
        parsed = JSON.parse(raw) as AuthSession;
      } catch {
        localStorage.removeItem("mk_session");
        router.replace("/login");
        return;
      }

      if (!parsed || !parsed.user) {
        localStorage.removeItem("mk_session");
        router.replace("/login");
        return;
      }

      if (parsed.user.role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      if (parsed.user.role !== "WORKER") {
        router.replace("/login");
        return;
      }

      // 1. Resolve Worker Identity from Database
      const workerLookupId =
        parsed.user.worker_db_id || parsed.user.worker_id || parsed.user.id;
      const matchedWorker = store.getWorkerById(workerLookupId);

      if (!matchedWorker) {
        setIsProfileMissing(true);
        setError("Worker profile could not be found in factory records.");
        return;
      }

      if (matchedWorker.status !== "ACTIVE") {
        setError("Worker account is currently INACTIVE. Please contact floor supervisor.");
        return;
      }

      // 2. Resolve Operation & Effective Rate
      const op = store.getOperationById(matchedWorker.operation_id);
      const opName = matchedWorker.operation_name || op?.name || "General Operation";
      const effectiveRate =
        matchedWorker.custom_rate_override ?? op?.current_rate ?? parsed.user.current_rate ?? 0;

      // 3. Resolve Stats & Weekly Salary
      const statsList = store.getWorkersWithStats();
      const workerStats = statsList.find(
        (w) => w.id === matchedWorker.id || w.worker_id === matchedWorker.worker_id
      );

      const salaries = store.getWeeklySalaries(undefined, matchedWorker.id);
      const activeSalary = salaries.length > 0 ? salaries[0] : null;

      if (isMountedRef.current) {
        setSession(parsed);
        setWorker(matchedWorker);
        setOperationName(opName);
        setCurrentRate(effectiveRate);
        setTodayPieces(workerStats?.today_pieces ?? 0);
        setTodayEarnings(workerStats?.today_earnings ?? 0);
        setThisWeekPieces(workerStats?.this_week_pieces ?? activeSalary?.total_pieces ?? 0);
        setThisWeekEarnings(
          workerStats?.this_week_earnings ??
            activeSalary?.final_salary ??
            activeSalary?.calculated_amount ??
            0
        );
        setWeeklySalary(activeSalary);
      }
    } catch {
      if (isMountedRef.current) {
        setError("We couldn't load your production data. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    // Safety timeout: prevent infinite loader if local storage or hydration stalls
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading((current) => {
          if (current) {
            setError((prev) => prev || "Dashboard response took too long. Please refresh.");
            return false;
          }
          return current;
        });
      }
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [loadData]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mk_session");
      router.replace("/login");
    }
  }, [router]);

  return {
    session,
    worker,
    operationName,
    currentRate,
    todayPieces,
    todayEarnings,
    thisWeekPieces,
    thisWeekEarnings,
    weeklySalary,
    isLoading,
    error,
    isProfileMissing,
    refresh: loadData,
    logout,
  };
}
