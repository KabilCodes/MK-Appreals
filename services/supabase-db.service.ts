import { Worker, ProductionEntry, WeeklySalary, Operation } from "@/types";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase Database Service
 * Provides direct Supabase database operations with comprehensive error handling.
 * If Supabase is unreachable or tables have not yet been migrated in the target project,
 * calls return safe fallbacks without throwing, ensuring zero runtime interruptions.
 */
export class SupabaseDbService {
  static getClient() {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
        return null;
      }
      return createClient();
    } catch {
      return null;
    }
  }

  /**
   * Fetch worker for an authenticated Supabase user (profile_id = auth.uid())
   */
  static async getWorkerForAuthUser(userId: string, email?: string): Promise<Worker | null> {
    const client = this.getClient();
    if (!client || !userId) return null;

    try {
      const trimmed = userId.trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

      // 1. Verify role from profiles table
      let profileRole: string | null = null;
      let profileMobile: string | null = null;
      if (isUUID) {
        const { data: profile } = await client
          .from("profiles")
          .select("id, role, full_name, mobile")
          .eq("id", trimmed)
          .maybeSingle();

        if (profile) {
          profileRole = profile.role;
          profileMobile = profile.mobile;
        }
      }

      if (profileRole === "ADMIN") {
        return null; // Admin users are not workers
      }

      // 2. Query workers table by profile_id (primary link matching Supabase RLS USING (profile_id = auth.uid()))
      let workerRow: any = null;
      if (isUUID) {
        const { data: byProfile, error: profileErr } = await client
          .from("workers")
          .select("id, profile_id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at")
          .eq("profile_id", trimmed)
          .maybeSingle();

        if (!profileErr && byProfile) {
          workerRow = byProfile;
        }
      }

      // 3. Fallback: check by workers.id if user ID happens to match worker primary key
      if (!workerRow && isUUID) {
        const { data: byId } = await client
          .from("workers")
          .select("id, profile_id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at")
          .eq("id", trimmed)
          .maybeSingle();

        if (byId) {
          workerRow = byId;
        }
      }

      // 4. Fallback: check by profile mobile if available
      if (!workerRow && profileMobile) {
        const { data: byMobile } = await client
          .from("workers")
          .select("id, profile_id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at")
          .eq("mobile", profileMobile)
          .maybeSingle();

        if (byMobile) {
          workerRow = byMobile;
        }
      }

      if (!workerRow) return null;

      // 5. Resolve operation name and base rate
      let operationName = "Unassigned";
      let baseRate: number | null = null;
      if (workerRow.operation_id) {
        const { data: opData } = await client
          .from("operations")
          .select("name, current_rate")
          .eq("id", workerRow.operation_id)
          .maybeSingle();

        if (opData?.name) operationName = opData.name;
        if (opData?.current_rate !== undefined) baseRate = Number(opData.current_rate);
      }

      return {
        id: workerRow.id,
        profile_id: workerRow.profile_id || trimmed,
        worker_id: workerRow.worker_id,
        full_name: workerRow.full_name,
        mobile: workerRow.mobile,
        email: email,
        operation_id: workerRow.operation_id,
        operation_name: operationName,
        custom_rate_override: workerRow.custom_rate_override ? Number(workerRow.custom_rate_override) : baseRate,
        status: workerRow.status as "ACTIVE" | "INACTIVE",
        created_at: workerRow.created_at,
        updated_at: workerRow.updated_at,
      };
    } catch (err) {
      console.warn("[SupabaseDbService] getWorkerForAuthUser fallback:", (err as Error).message);
      return null;
    }
  }

  /**
   * Fetch worker by identifier: profile_id, worker table ID, worker_id code, or mobile
   */
  static async getWorkerById(identifier: string): Promise<Worker | null> {
    const client = this.getClient();
    if (!client || !identifier) return null;

    try {
      const trimmed = identifier.trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

      let data: any = null;

      if (isUUID) {
        // First check profile_id (the authenticated user id matching Supabase RLS)
        const { data: byProfile } = await client
          .from("workers")
          .select("id, profile_id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at")
          .eq("profile_id", trimmed)
          .maybeSingle();

        if (byProfile) {
          data = byProfile;
        } else {
          // Check worker primary key id
          const { data: byId } = await client
            .from("workers")
            .select("id, profile_id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at")
            .eq("id", trimmed)
            .maybeSingle();
          data = byId;
        }
      } else {
        // Non-UUID: match alphanumeric worker_id code without casting error in Postgres
        const { data: byCode } = await client
          .from("workers")
          .select("id, profile_id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at")
          .ilike("worker_id", trimmed)
          .maybeSingle();

        if (byCode) {
          data = byCode;
        } else {
          // Match mobile number
          const { data: byMobile } = await client
            .from("workers")
            .select("id, profile_id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at")
            .eq("mobile", trimmed)
            .maybeSingle();
          data = byMobile;
        }
      }

      if (!data) return null;

      // Resolve operation name
      let operationName = "Unassigned";
      if (data.operation_id) {
        const { data: opData } = await client
          .from("operations")
          .select("name")
          .eq("id", data.operation_id)
          .maybeSingle();
        if (opData?.name) operationName = opData.name;
      }

      return {
        id: data.id,
        profile_id: data.profile_id,
        worker_id: data.worker_id,
        full_name: data.full_name,
        mobile: data.mobile,
        operation_id: data.operation_id,
        operation_name: operationName,
        custom_rate_override: data.custom_rate_override ? Number(data.custom_rate_override) : null,
        status: data.status as "ACTIVE" | "INACTIVE",
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (err) {
      console.warn("[SupabaseDbService] getWorkerById fallback:", (err as Error).message);
      return null;
    }
  }

  /**
   * Fetch all workers from Supabase
   */
  static async getWorkers(): Promise<Worker[] | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from("workers")
        .select("id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at");

      if (error || !data) return null;

      return data.map((d) => ({
        id: d.id,
        worker_id: d.worker_id,
        full_name: d.full_name,
        mobile: d.mobile,
        operation_id: d.operation_id,
        custom_rate_override: d.custom_rate_override ? Number(d.custom_rate_override) : null,
        status: d.status as "ACTIVE" | "INACTIVE",
        created_at: d.created_at,
        updated_at: d.updated_at,
      }));
    } catch {
      return null;
    }
  }

  /**
   * Insert worker record into Supabase
   */
  static async insertWorker(worker: Worker): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let targetOpId = worker.operation_id;
      if (!isUUID(targetOpId)) {
        const { data: opData } = await client
          .from("operations")
          .select("id")
          .ilike("name", worker.operation_name || "Overlock")
          .maybeSingle();
        if (opData?.id && isUUID(opData.id)) {
          targetOpId = opData.id;
        }
      }

      const payload: Record<string, unknown> = {
        worker_id: worker.worker_id,
        full_name: worker.full_name,
        mobile: worker.mobile,
        operation_id: targetOpId,
        custom_rate_override: worker.custom_rate_override ?? null,
        status: worker.status,
      };

      if (isUUID(worker.id)) {
        payload.id = worker.id;
      }
      if (worker.profile_id && isUUID(worker.profile_id)) {
        payload.profile_id = worker.profile_id;
      }

      const { error } = await client.from("workers").insert(payload);
      return !error;
    } catch (err) {
      console.warn("[SupabaseDbService] insertWorker fallback:", (err as Error).message);
      return false;
    }
  }

  /**
   * Update worker record in Supabase
   */
  static async updateWorker(
    identifier: string,
    updates: Partial<{
      full_name: string;
      mobile: string;
      operation_id: string;
      custom_rate_override: number | null;
      status: "ACTIVE" | "INACTIVE";
      profile_id?: string;
    }>
  ): Promise<boolean> {
    const client = this.getClient();
    if (!client || !identifier) return false;

    try {
      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.full_name !== undefined) payload.full_name = updates.full_name;
      if (updates.mobile !== undefined) payload.mobile = updates.mobile;
      if (updates.profile_id !== undefined && isUUID(updates.profile_id)) payload.profile_id = updates.profile_id;
      if (updates.custom_rate_override !== undefined) payload.custom_rate_override = updates.custom_rate_override;
      if (updates.status !== undefined) payload.status = updates.status;

      if (updates.operation_id !== undefined) {
        let opId = updates.operation_id;
        if (!isUUID(opId)) {
          const { data: opData } = await client
            .from("operations")
            .select("id")
            .ilike("name", opId)
            .maybeSingle();
          if (opData?.id && isUUID(opData.id)) opId = opData.id;
        }
        payload.operation_id = opId;
      }

      let query = client.from("workers").update(payload);
      if (isUUID(identifier)) {
        query = query.eq("id", identifier);
      } else {
        query = query.eq("worker_id", identifier.toUpperCase());
      }

      const { error } = await query;
      return !error;
    } catch (err) {
      console.warn("[SupabaseDbService] updateWorker fallback:", (err as Error).message);
      return false;
    }
  }

  /**
   * Insert production piece entry into Supabase
   */
  static async insertProductionEntry(entry: ProductionEntry): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let targetWorkerId = entry.worker_id;
      if (!isUUID(targetWorkerId)) {
        const dbWorker = await this.getWorkerById(entry.worker_id);
        if (dbWorker && isUUID(dbWorker.id)) {
          targetWorkerId = dbWorker.id;
        } else {
          return false;
        }
      }

      let targetOpId = entry.operation_id;
      if (!isUUID(targetOpId)) {
        const { data: opData } = await client
          .from("operations")
          .select("id")
          .ilike("name", entry.operation_name_snapshot)
          .maybeSingle();
        if (opData?.id && isUUID(opData.id)) {
          targetOpId = opData.id;
        }
      }

      const payload: Record<string, unknown> = {
        worker_id: targetWorkerId,
        worker_name_snapshot: entry.worker_name_snapshot,
        operation_id: targetOpId,
        operation_name_snapshot: entry.operation_name_snapshot,
        piece_count: entry.piece_count,
        rate_snapshot: entry.rate_snapshot,
        calculated_earning: entry.calculated_earning,
        production_date: entry.production_date,
        submission_timestamp: entry.submission_timestamp,
        status: entry.status,
        notes: entry.notes || null,
      };

      if (isUUID(entry.id)) {
        payload.id = entry.id;
      }

      const { error } = await client.from("production_entries").insert(payload);
      return !error;
    } catch (err) {
      console.warn("[SupabaseDbService] insertProductionEntry fallback:", (err as Error).message);
      return false;
    }
  }

  /**
   * Fetch production entries for a worker from Supabase
   */
  static async getProductionEntries(workerId?: string): Promise<ProductionEntry[] | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let targetWorkerId = workerId;
      if (targetWorkerId && !isUUID(targetWorkerId)) {
        const dbWorker = await this.getWorkerById(targetWorkerId);
        if (dbWorker && isUUID(dbWorker.id)) {
          targetWorkerId = dbWorker.id;
        }
      }

      let query = client.from("production_entries").select("*").order("production_date", { ascending: false });
      if (targetWorkerId && isUUID(targetWorkerId)) {
        query = query.eq("worker_id", targetWorkerId);
      }
      const { data, error } = await query;
      if (error || !data) return null;

      return data.map((d) => ({
        id: d.id,
        worker_id: d.worker_id,
        worker_name_snapshot: d.worker_name_snapshot,
        operation_id: d.operation_id,
        operation_name_snapshot: d.operation_name_snapshot,
        piece_count: Number(d.piece_count),
        rate_snapshot: Number(d.rate_snapshot),
        calculated_earning: Number(d.calculated_earning),
        production_date: d.production_date,
        submission_timestamp: d.submission_timestamp,
        status: d.status,
        notes: d.notes,
      }));
    } catch {
      return null;
    }
  }

  /**
   * Upsert weekly salary record in Supabase
   */
  static async upsertWeeklySalary(salary: WeeklySalary): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let targetWorkerId = salary.worker_id;
      if (!isUUID(targetWorkerId)) {
        const dbWorker = await this.getWorkerById(salary.worker_id_code || salary.worker_id);
        if (dbWorker && isUUID(dbWorker.id)) {
          targetWorkerId = dbWorker.id;
        } else {
          return false;
        }
      }

      const payload: Record<string, unknown> = {
        worker_id: targetWorkerId,
        week_id: salary.week_id,
        week_start_date: salary.week_start_date,
        week_end_date: salary.week_end_date,
        total_pieces: salary.total_pieces,
        calculated_amount: salary.calculated_amount,
        final_salary: salary.final_salary,
        total_adjustments: salary.total_adjustments,
        status: salary.status,
        payment_date: salary.payment_date || null,
        notes: salary.notes || null,
        updated_at: new Date().toISOString(),
      };

      if (isUUID(salary.id)) {
        payload.id = salary.id;
      }

      const { error } = await client.from("weekly_salary").upsert(
        payload,
        { onConflict: "worker_id,week_id" }
      );

      return !error;
    } catch (err) {
      console.warn("[SupabaseDbService] upsertWeeklySalary fallback:", (err as Error).message);
      return false;
    }
  }

  /**
   * Fetch weekly salaries from Supabase
   */
  static async getWeeklySalaries(workerId?: string, weekId?: string): Promise<WeeklySalary[] | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let targetWorkerId = workerId;
      if (targetWorkerId && !isUUID(targetWorkerId)) {
        const dbWorker = await this.getWorkerById(targetWorkerId);
        if (dbWorker && isUUID(dbWorker.id)) {
          targetWorkerId = dbWorker.id;
        }
      }

      let query = client.from("weekly_salary").select("*").order("week_id", { ascending: false });
      if (targetWorkerId && isUUID(targetWorkerId)) query = query.eq("worker_id", targetWorkerId);
      if (weekId) query = query.eq("week_id", weekId);

      const { data, error } = await query;
      if (error || !data) return null;

      return data.map((d) => ({
        id: d.id,
        worker_id: d.worker_id,
        worker_id_code: d.worker_id,
        worker_name: d.worker_name || "Worker",
        operation_name: d.operation_name || "General",
        current_rate: Number(d.current_rate || 0),
        week_id: d.week_id,
        week_start_date: d.week_start_date,
        week_end_date: d.week_end_date,
        total_pieces: Number(d.total_pieces),
        calculated_amount: Number(d.calculated_amount),
        final_salary: Number(d.final_salary),
        total_adjustments: Number(d.total_adjustments || 0),
        status: d.status,
        payment_date: d.payment_date,
        payment_method: d.payment_method,
        reference_no: d.reference_no,
        notes: d.notes,
        created_at: d.created_at,
        updated_at: d.updated_at,
      }));
    } catch {
      return null;
    }
  }
}
