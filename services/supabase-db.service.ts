import { Worker, ProductionEntry, WeeklySalary, Operation } from "@/types";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase Database Service
 * Provides direct Supabase database operations with comprehensive error handling.
 * If Supabase is unreachable or tables have not yet been migrated in the target project,
 * calls return safe fallbacks without throwing, ensuring zero runtime interruptions.
 */
export class SupabaseDbService {
  private static getClient() {
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
   * Fetch worker by ID, worker_id code, or email from Supabase
   */
  static async getWorkerById(identifier: string): Promise<Worker | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const trimmed = identifier.trim();
      const { data, error } = await client
        .from("workers")
        .select("id, worker_id, full_name, mobile, operation_id, custom_rate_override, status, created_at, updated_at")
        .or(`id.eq.${trimmed},worker_id.ilike.${trimmed}`)
        .maybeSingle();

      if (error || !data) return null;

      // Also resolve operation name
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
   * Insert production piece entry into Supabase
   */
  static async insertProductionEntry(entry: ProductionEntry): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const { error } = await client.from("production_entries").insert({
        id: entry.id,
        worker_id: entry.worker_id,
        worker_name_snapshot: entry.worker_name_snapshot,
        operation_id: entry.operation_id,
        operation_name_snapshot: entry.operation_name_snapshot,
        piece_count: entry.piece_count,
        rate_snapshot: entry.rate_snapshot,
        calculated_earning: entry.calculated_earning,
        production_date: entry.production_date,
        submission_timestamp: entry.submission_timestamp,
        status: entry.status,
        notes: entry.notes || null,
      });

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
      let query = client.from("production_entries").select("*").order("production_date", { ascending: false });
      if (workerId) {
        query = query.eq("worker_id", workerId);
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
      const { error } = await client.from("weekly_salary").upsert(
        {
          id: salary.id,
          worker_id: salary.worker_id,
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
        },
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
      let query = client.from("weekly_salary").select("*").order("week_id", { ascending: false });
      if (workerId) query = query.eq("worker_id", workerId);
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
