"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthSession, Worker, WeeklySalary } from "@/types";
import { store } from "@/lib/db/store";
import { createClient } from "@/lib/supabase/client";
import { SupabaseDbService } from "@/services/supabase-db.service";

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

  const loadData = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      setIsLoading(true);
      setError(null);
      setIsProfileMissing(false);

      // 1. Check for active Supabase Auth user
      const supabase = createClient();
      let supabaseUser: { id: string; email?: string } | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          supabaseUser = authData.user;
        }
      } catch {
        // Supabase client offline or unauthenticated
      }

      // 2. Check local session storage (mk_session)
      const raw = localStorage.getItem("mk_session");
      let parsed: AuthSession | null = null;
      if (raw) {
        try {
          parsed = JSON.parse(raw) as AuthSession;
        } catch {
          localStorage.removeItem("mk_session");
        }
      }

      // 3. Stale session reconciliation
      // If a local worker session exists, but the browser has a leftover Supabase Auth user for a different email,
      // invalidate the stale Supabase user so it does not conflict with the current worker.
      if (
        supabaseUser &&
        parsed?.user?.role === "WORKER" &&
        parsed.user.email &&
        supabaseUser.email &&
        supabaseUser.email.toLowerCase() !== parsed.user.email.toLowerCase()
      ) {
        supabaseUser = null;
      }

      // If user is completely unauthenticated (neither Supabase user nor local session):
      if (!supabaseUser && (!parsed || !parsed.user)) {
        router.replace("/login");
        // Keep isLoading true to prevent flashing error screen before navigation
        return;
      }

      // 4. Role Authorization Check
      let role: "ADMIN" | "WORKER" | null = parsed?.user?.role || null;
      if (supabaseUser) {
        // Direct admin check against registered administrator whitelist
        if (supabaseUser.email) {
          const admins = store.getAdmins();
          if (admins.some((a) => a.email.toLowerCase() === supabaseUser!.email!.toLowerCase())) {
            role = "ADMIN";
          }
        }

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, role")
            .eq("id", supabaseUser.id)
            .maybeSingle();

          if (profile?.role) {
            role = profile.role as "ADMIN" | "WORKER";
          }
        } catch {
          // Ignore profile check errors
        }
      }

      if (role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      if (role && role !== "WORKER") {
        router.replace("/login");
        return;
      }

      // 5. Resolve Worker Identity
      let matchedWorker: Worker | null = null;

      // 5a. If Supabase user exists, query by user.id (which maps to workers.profile_id)
      if (supabaseUser) {
        matchedWorker = await SupabaseDbService.getWorkerForAuthUser(
          supabaseUser.id,
          supabaseUser.email
        );
      }

      // 5b. If not found via Supabase auth, look up by session identifiers
      if (!matchedWorker && parsed?.user) {
        const lookupId = parsed.user.worker_db_id || parsed.user.id || parsed.user.worker_id;
        if (lookupId) {
          matchedWorker = await SupabaseDbService.getWorkerById(lookupId);
        }
      }

      // 5c. Fallback to local store
      if (!matchedWorker) {
        const lookupKey =
          parsed?.user?.worker_db_id ||
          parsed?.user?.worker_id ||
          parsed?.user?.id ||
          supabaseUser?.id;

        if (lookupKey) {
          matchedWorker = store.getWorkerById(lookupKey) || null;
        }

        // Match by email or Supabase user ID if still not found
        const targetEmail = parsed?.user?.email || supabaseUser?.email;
        if (!matchedWorker && targetEmail) {
          const workers = store.getWorkers();
          matchedWorker =
            workers.find(
              (w) =>
                (w.email && w.email.toLowerCase() === targetEmail.toLowerCase()) ||
                (w.profile_id && (w.profile_id === supabaseUser?.id || w.profile_id === parsed?.user?.id))
            ) || null;
        }

        // Self-healing from authenticated session
        if (!matchedWorker && parsed?.user && parsed.user.role === "WORKER") {
          matchedWorker = store.ensureWorkerFromSession(parsed.user);
        }
      }

      // 6. Handle missing profile gracefully
      if (!matchedWorker) {
        if (isMountedRef.current) {
          setIsProfileMissing(true);
          const detailMessage = supabaseUser?.email
            ? `No garment worker profile is linked to "${supabaseUser.email}". Please contact your plant supervisor to enroll your account or sign in with your Worker ID.`
            : "Worker profile could not be found. Please check your credentials or contact your floor supervisor.";
          setError(detailMessage);
          setIsLoading(false);
        }
        return;
      }

      // 7. Check Active Status
      if (matchedWorker.status !== "ACTIVE") {
        if (isMountedRef.current) {
          setError("Worker account is currently INACTIVE. Please contact floor supervisor.");
          setIsLoading(false);
        }
        return;
      }

      // 8. Resolve Operation & Effective Rate
      const op = store.getOperationById(matchedWorker.operation_id);
      let opName = matchedWorker.operation_name || op?.name || "General Operation";
      let opRate = op?.current_rate ?? 0;

      if (!op && matchedWorker.operation_id) {
        try {
          const { data: opData } = await supabase
            .from("operations")
            .select("id, name, current_rate")
            .eq("id", matchedWorker.operation_id)
            .maybeSingle();

          if (opData) {
            opName = opData.name;
            opRate = Number(opData.current_rate);
          }
        } catch {
          // fallback
        }
      }

      const effectiveRate =
        matchedWorker.custom_rate_override ??
        opRate ??
        parsed?.user?.current_rate ??
        0;

      // Hydrate into store so synchronous services can access the worker
      store.ensureWorkerFromSession({
        id: matchedWorker.id,
        worker_id: matchedWorker.worker_id,
        name: matchedWorker.full_name,
        email: matchedWorker.email || supabaseUser?.email,
        operation_id: matchedWorker.operation_id,
        operation_name: opName,
        current_rate: effectiveRate,
      });

      // Synchronize mk_session in localStorage for consistent cross-component state
      const activeSession: AuthSession = {
        user: {
          id: matchedWorker.profile_id || matchedWorker.id,
          worker_db_id: matchedWorker.id,
          role: "WORKER",
          name: matchedWorker.full_name,
          email: matchedWorker.email || supabaseUser?.email,
          worker_id: matchedWorker.worker_id,
          operation_id: matchedWorker.operation_id,
          operation_name: opName,
          current_rate: effectiveRate,
        },
        token: parsed?.token || `worker-token-${matchedWorker.worker_id}-${Date.now()}`,
        rememberMe: parsed?.rememberMe ?? true,
      };
      localStorage.setItem("mk_session", JSON.stringify(activeSession));

      // 9. Fetch actual production entries and salaries from Supabase
      try {
        const [remoteEntries, remoteSalaries] = await Promise.all([
          SupabaseDbService.getProductionEntries(matchedWorker.id),
          SupabaseDbService.getWeeklySalaries(matchedWorker.id),
        ]);
        if (remoteEntries) {
          store.syncWorkerEntries(matchedWorker.id, remoteEntries);
        }
        if (remoteSalaries) {
          store.syncWorkerSalaries(matchedWorker.id, remoteSalaries);
        }
      } catch {
        // Fallback to local store
      }

      // 10. Resolve Stats & Weekly Salary from actual entries
      const statsList = store.getWorkersWithStats();
      const workerStats = statsList.find(
        (w) => w.id === matchedWorker!.id || w.worker_id === matchedWorker!.worker_id
      );

      const salaries = store.getWeeklySalaries(undefined, matchedWorker.id);
      const activeSalary = salaries.length > 0 ? salaries[0] : null;

      if (isMountedRef.current) {
        setSession(activeSession);
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

    // Safety timeout: prevent infinite loader if network stalls
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
    }, 8000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [loadData]);

  const logout = useCallback(async () => {
    if (typeof window !== "undefined") {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
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
