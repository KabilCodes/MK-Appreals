import {
  Operation,
  Worker,
  WorkerWithStats,
  ProductionEntry,
  WeeklySalary,
  RateHistory,
  AuditLog,
  DashboardMetrics,
  MonthlySalarySummary,
  AdminAccount,
  CorrectionRequest,
  AppNotification,
  CompanySettings,
  AttentionAlert,
  GlobalSearchResult,
} from "@/types";
import { INITIAL_OPERATIONS, INITIAL_WORKERS, generateSeedData } from "./mock-data";
import { getWeekBounds, formatDateISO, formatDateDisplay, getLast12Months } from "../utils/date";

class DataStore {
  private operations: Operation[] = [];
  private workers: Worker[] = [];
  private rateHistory: RateHistory[] = [];
  private productionEntries: ProductionEntry[] = [];
  private weeklySalaries: WeeklySalary[] = [];
  private auditLogs: AuditLog[] = [];
  private admins: AdminAccount[] = [];
  private correctionRequests: CorrectionRequest[] = [];
  private notifications: AppNotification[] = [];
  private settings: CompanySettings = {
    company_name: "MK APPREALS PRIVATE LIMITED",
    unit_code: "UNIT-01 (Tirupur)",
    address: "SF No. 240/1, Palladam Road, Tirupur, Tamil Nadu - 641604",
    gstin: "33AAACM1234F1Z8",
    work_week_start: "Monday",
    work_week_end: "Sunday",
    auto_week_close: true,
    require_strong_passwords: true,
    session_timeout_hours: 12,
  };
  private submissionTimestamps: Map<string, number> = new Map();
  private initialized = false;
  private storageKey = "mk_appreals_store_v1";

  constructor() {
    this.init();
  }

  private persist(): void {
    if (typeof window === "undefined" || process.env.NODE_ENV === "test") return;
    try {
      const state = {
        operations: this.operations,
        workers: this.workers,
        rateHistory: this.rateHistory,
        productionEntries: this.productionEntries,
        weeklySalaries: this.weeklySalaries,
        auditLogs: this.auditLogs,
        admins: this.admins,
        correctionRequests: this.correctionRequests,
        notifications: this.notifications,
        settings: this.settings,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // Ignore quota errors in storage
    }
  }

  private isSeedEntry(id: string): boolean {
    return (
      id.startsWith("pe-kumar-curr-") ||
      id.includes("-curr-") ||
      id.includes("-past-") ||
      id.includes("-hist-") ||
      id.startsWith("ws-kumar-") ||
      id.startsWith("al-") ||
      id.includes("pe-prev-")
    );
  }

  private loadFromStorage(): boolean {
    if (typeof window === "undefined" || process.env.NODE_ENV === "test") return false;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.workers) && data.workers.length > 0) {
        if (Array.isArray(data.operations) && data.operations.length > 0) this.operations = data.operations;
        this.workers = data.workers;
        if (Array.isArray(data.rateHistory)) this.rateHistory = data.rateHistory;
        if (Array.isArray(data.productionEntries)) {
          this.productionEntries = data.productionEntries.filter((e: any) => !this.isSeedEntry(e.id));
        }
        if (Array.isArray(data.weeklySalaries)) {
          this.weeklySalaries = data.weeklySalaries.filter((s: any) => !this.isSeedEntry(s.id));
        }
        if (Array.isArray(data.auditLogs)) {
          this.auditLogs = data.auditLogs.filter((a: any) => !a.id.startsWith("al-"));
        }
        if (Array.isArray(data.admins) && data.admins.length > 0) this.admins = data.admins;
        if (Array.isArray(data.correctionRequests)) this.correctionRequests = data.correctionRequests;
        if (Array.isArray(data.notifications)) this.notifications = data.notifications;
        if (data.settings) this.settings = data.settings;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private init() {
    if (this.initialized) return;

    this.operations = JSON.parse(JSON.stringify(INITIAL_OPERATIONS));
    this.workers = [];

    // Initialize rate history
    this.rateHistory = this.operations.map((op) => ({
      id: `rh-${op.id}-init`,
      operation_id: op.id,
      operation_name: op.name,
      rate: op.current_rate,
      effective_from: "2026-01-01T00:00:00Z",
      effective_to: null,
      changed_by_name: "Admin",
      reason: "Initial baseline piece rate",
      created_at: "2026-01-01T00:00:00Z",
    }));

    // Seed Authorized Administrators (Section 44)
    this.admins = [
      {
        id: "adm-arun",
        full_name: "MK Arun",
        email: "mkarun@gmail.com",
        role: "ADMIN",
        status: "ACTIVE",
        password: "arun1987",
        created_at: "2026-01-01T00:00:00Z",
        last_login: new Date().toISOString(),
      },
      {
        id: "adm-01",
        full_name: "Factory Administrator",
        email: "admin@mkappreals.com",
        role: "ADMIN",
        status: "ACTIVE",
        password: "arun1987",
        created_at: "2026-01-01T00:00:00Z",
        last_login: new Date().toISOString(),
      },
      {
        id: "adm-02",
        full_name: "Production Shift Supervisor",
        email: "supervisor@mkappreals.com",
        role: "ADMIN",
        status: "ACTIVE",
        password: "arun1987",
        created_at: "2026-01-10T00:00:00Z",
        last_login: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    const loaded = this.loadFromStorage();
    if (!loaded) {
      this.workers = JSON.parse(JSON.stringify(INITIAL_WORKERS));
      this.productionEntries = [];
      this.weeklySalaries = [];
      this.auditLogs = [];
      this.correctionRequests = [];
      this.notifications = [];
      this.persist();
    }

    this.initialized = true;
  }

  /**
   * Synchronize store with live Supabase database records
   */
  public syncFromSupabase(data: {
    workers?: Worker[];
    productionEntries?: ProductionEntry[];
    weeklySalaries?: WeeklySalary[];
  }): void {
    if (data.workers && data.workers.length > 0) {
      this.workers = data.workers;
    }
    if (data.productionEntries !== undefined) {
      this.productionEntries = data.productionEntries;
    }
    if (data.weeklySalaries !== undefined) {
      this.weeklySalaries = data.weeklySalaries;
    }
    this.persist();
  }

  public syncWorkerEntries(workerId: string, remoteEntries: ProductionEntry[]): void {
    this.productionEntries = [
      ...this.productionEntries.filter((e) => e.worker_id !== workerId),
      ...remoteEntries,
    ];
    this.persist();
  }

  public syncWorkerSalaries(workerId: string, remoteSalaries: WeeklySalary[]): void {
    this.weeklySalaries = [
      ...this.weeklySalaries.filter((s) => s.worker_id !== workerId),
      ...remoteSalaries,
    ];
    this.persist();
  }

  /**
   * Seed temporary test fixtures for test suites.
   */
  public seedTestFixtures(): void {
    this.workers = JSON.parse(JSON.stringify(INITIAL_WORKERS));
    const seed = generateSeedData();
    this.productionEntries = seed.production_entries;
    this.weeklySalaries = seed.weekly_salaries;
    this.auditLogs = seed.audit_logs;
  }

  /**
   * Remove all temporary test records, restoring the database to a clean production state.
   */
  public clearTestFixtures(): void {
    this.workers = [];
    this.productionEntries = [];
    this.weeklySalaries = [];
    this.auditLogs = [];
    this.correctionRequests = [];
    this.notifications = [];
    this.submissionTimestamps.clear();
  }

  // --------------------------------------------------------------------------
  // OPERATIONS & RATE MANAGEMENT
  // --------------------------------------------------------------------------

  public getOperations(): Operation[] {
    return [...this.operations];
  }

  public getOperationById(id: string): Operation | undefined {
    return this.operations.find((op) => op.id === id);
  }

  public createOperation(data: { name: string; code: string; current_rate: number; description?: string }): Operation {
    const existing = this.operations.find((o) => o.name.toLowerCase() === data.name.toLowerCase());
    if (existing) {
      throw new Error(`Operation "${data.name}" already exists.`);
    }

    const newOp: Operation = {
      id: `op-${data.code.toLowerCase()}-${Date.now()}`,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      current_rate: Math.round(data.current_rate * 100) / 100,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    };

    this.operations.push(newOp);

    // Rate history record
    this.rateHistory.push({
      id: `rh-${newOp.id}-${Date.now()}`,
      operation_id: newOp.id,
      operation_name: newOp.name,
      rate: newOp.current_rate,
      effective_from: new Date().toISOString(),
      changed_by_name: "Admin",
      reason: "New operation created",
      created_at: new Date().toISOString(),
    });

    this.addAuditLog({
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "OPERATION_CREATED",
      target_entity: "OPERATION",
      target_id: newOp.id,
      old_values: null,
      new_values: { name: newOp.name, rate: newOp.current_rate },
    });

    return newOp;
  }

  public updateOperationRate(operation_id: string, new_rate: number, reason: string): Operation {
    const op = this.operations.find((o) => o.id === operation_id);
    if (!op) {
      throw new Error("Operation not found");
    }

    const oldRate = op.current_rate;
    const nowISO = new Date().toISOString();
    op.current_rate = Math.round(new_rate * 100) / 100;
    op.updated_at = nowISO;

    // Close the previous active rate interval (Section 49)
    const prevActive = this.rateHistory.find(
      (rh) => rh.operation_id === op.id && !rh.effective_to
    );
    if (prevActive) {
      prevActive.effective_to = nowISO;
    }

    // Preserve rate history without altering past production records!
    this.rateHistory.unshift({
      id: `rh-${op.id}-${Date.now()}`,
      operation_id: op.id,
      operation_name: op.name,
      rate: op.current_rate,
      effective_from: nowISO,
      effective_to: null,
      changed_by_name: "Admin",
      reason,
      created_at: nowISO,
    });

    this.addAuditLog({
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "RATE_UPDATED",
      target_entity: "OPERATION",
      target_id: op.name,
      old_values: { rate: oldRate },
      new_values: { rate: new_rate, reason },
    });

    return { ...op };
  }

  public getRateHistory(operation_id?: string): RateHistory[] {
    if (operation_id) {
      return this.rateHistory.filter((rh) => rh.operation_id === operation_id);
    }
    return [...this.rateHistory];
  }

  // --------------------------------------------------------------------------
  // WORKER MANAGEMENT
  // --------------------------------------------------------------------------

  public getWorkers(): Worker[] {
    return this.workers.map((w) => {
      const op = this.operations.find((o) => o.id === w.operation_id);
      return {
        ...w,
        operation_name: op?.name || "Unassigned",
      };
    });
  }

  public getWorkersWithStats(week_id?: string): WorkerWithStats[] {
    const today = new Date();
    const currentWeek = getWeekBounds(today);
    const targetWeekId = week_id || currentWeek.week_id;
    const todayISO = formatDateISO(today);

    this.ensureWeekRecordsExist(targetWeekId);

    return this.workers.map((w) => {
      const op = this.operations.find((o) => o.id === w.operation_id);
      const effectiveRate = w.custom_rate_override ?? op?.current_rate ?? 0;

      // Filter entries for this worker (matching both id and worker_id)
      const workerEntries = this.productionEntries.filter(
        (e) => e.worker_id === w.id || e.worker_id === w.worker_id
      );
      
      // Today's stats
      const todayEntries = workerEntries.filter((e) => e.production_date === todayISO);
      const todayPcs = todayEntries.reduce((acc, e) => acc + e.piece_count, 0);
      const todayEarn = todayEntries.reduce((acc, e) => acc + e.calculated_earning, 0);

      // Weekly stats
      const weeklySalary = this.weeklySalaries.find(
        (ws) => (ws.worker_id === w.id || ws.worker_id === w.worker_id) && ws.week_id === targetWeekId
      );

      // Fallback calculation directly from week entries if weeklySalary was newly instantiated
      const weekBounds = getWeekBounds(today);
      const weekEntries = workerEntries.filter(
        (e) => e.production_date >= weekBounds.start_date && e.production_date <= weekBounds.end_date
      );
      const computedWeekPcs = weekEntries.reduce((acc, e) => acc + e.piece_count, 0);
      const computedWeekEarn = weekEntries.reduce((acc, e) => acc + e.calculated_earning, 0);

      const weekPcs = weeklySalary?.total_pieces ?? computedWeekPcs;
      const weekEarn = weeklySalary?.final_salary ?? weeklySalary?.calculated_amount ?? computedWeekEarn;
      const salaryStatus = weeklySalary?.status ?? "PENDING";

      return {
        ...w,
        operation_name: op?.name || "Unassigned",
        current_rate: effectiveRate,
        today_pieces: todayPcs,
        today_earnings: Math.round(todayEarn * 100) / 100,
        this_week_pieces: weekPcs,
        this_week_earnings: Math.round(weekEarn * 100) / 100,
        salary_status: salaryStatus,
      };
    });
  }

  public getWorkerById(id: string): Worker | undefined {
    if (!id) return undefined;
    const q = id.trim().toLowerCase();
    const w = this.workers.find(
      (item) =>
        item.id === id ||
        item.worker_id.toLowerCase() === q ||
        (item.profile_id && item.profile_id === id) ||
        (item.email && item.email.toLowerCase() === q) ||
        item.mobile === id ||
        item.full_name.toLowerCase() === q
    );
    if (!w) return undefined;
    const op = this.operations.find((o) => o.id === w.operation_id);
    return {
      ...w,
      operation_name: op?.name || w.operation_name || "Unassigned",
    };
  }

  public ensureWorkerFromSession(user: {
    id: string;
    worker_db_id?: string;
    worker_id?: string;
    name?: string;
    email?: string;
    operation_id?: string;
    operation_name?: string;
    current_rate?: number;
  }): Worker {
    const existing = this.getWorkerById(user.worker_db_id || user.worker_id || user.id);
    if (existing) return existing;

    const op =
      (user.operation_id && this.getOperationById(user.operation_id)) ||
      this.operations[0];

    const newWorker: Worker = {
      id: user.worker_db_id || user.id || `w-${Date.now()}`,
      worker_id: user.worker_id || "MK001",
      full_name: user.name || "Factory Worker",
      email: user.email,
      mobile: "9876543201",
      operation_id: op?.id || "op-overlock",
      operation_name: user.operation_name || op?.name || "Overlock",
      custom_rate_override: user.current_rate ?? null,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    };
    this.workers.push(newWorker);
    this.persist();
    return newWorker;
  }

  public createWorker(data: {
    worker_id: string;
    full_name: string;
    mobile: string;
    email?: string;
    password?: string;
    operation_id: string;
    custom_rate_override?: number | null;
    status?: "ACTIVE" | "INACTIVE";
  }): Worker {
    const exists = this.workers.find(
      (w) => w.worker_id.toUpperCase() === data.worker_id.toUpperCase()
    );
    if (exists) {
      throw new Error(`Worker ID "${data.worker_id}" already exists.`);
    }

    if (data.email?.trim()) {
      const emailLower = data.email.trim().toLowerCase();
      const emailExists = this.workers.find((w) => w.email?.toLowerCase() === emailLower);
      if (emailExists) {
        throw new Error(`Worker with email "${data.email}" already exists.`);
      }
    }

    const op = this.operations.find((o) => o.id === data.operation_id);
    if (!op) {
      throw new Error("Invalid operation selected.");
    }

    const newWorker: Worker = {
      id: `w-${data.worker_id.toLowerCase()}-${Date.now()}`,
      worker_id: data.worker_id.toUpperCase(),
      full_name: data.full_name,
      mobile: data.mobile,
      email: data.email?.trim().toLowerCase() || undefined,
      password: data.password?.trim() || undefined,
      operation_id: data.operation_id,
      operation_name: op.name,
      custom_rate_override: data.custom_rate_override ?? null,
      status: data.status || "ACTIVE",
      created_at: new Date().toISOString(),
    };

    this.workers.push(newWorker);

    this.addAuditLog({
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "WORKER_CREATED",
      target_entity: "WORKER",
      target_id: newWorker.worker_id,
      old_values: null,
      new_values: {
        worker_id: newWorker.worker_id,
        name: newWorker.full_name,
        email: newWorker.email,
        has_credentials: Boolean(newWorker.password),
        operation: op.name,
      },
    });

    this.persist();
    return newWorker;
  }

  public updateWorker(
    id: string,
    updates: Partial<{
      full_name: string;
      mobile: string;
      email?: string;
      password?: string;
      operation_id: string;
      custom_rate_override: number | null;
      status: "ACTIVE" | "INACTIVE";
    }>
  ): Worker {
    const worker = this.workers.find((w) => w.id === id || w.worker_id === id);
    if (!worker) {
      throw new Error("Worker not found");
    }

    const oldValues = { ...worker };

    if (updates.full_name !== undefined) worker.full_name = updates.full_name;
    if (updates.mobile !== undefined) worker.mobile = updates.mobile;
    if (updates.email !== undefined) {
      const emailTrim = updates.email?.trim().toLowerCase();
      if (emailTrim) {
        const emailExists = this.workers.find(
          (w) => w.id !== worker.id && w.email?.toLowerCase() === emailTrim
        );
        if (emailExists) {
          throw new Error(`Worker with email "${updates.email}" already exists.`);
        }
        worker.email = emailTrim;
      } else {
        worker.email = undefined;
      }
    }
    if (updates.password !== undefined) {
      const passTrim = updates.password?.trim();
      worker.password = passTrim || undefined;
    }
    if (updates.operation_id !== undefined) {
      const op = this.operations.find((o) => o.id === updates.operation_id);
      if (op) {
        worker.operation_id = updates.operation_id;
        worker.operation_name = op.name;
      }
    }
    if (updates.custom_rate_override !== undefined) {
      worker.custom_rate_override = updates.custom_rate_override;
    }
    if (updates.status !== undefined) worker.status = updates.status;

    worker.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "WORKER_UPDATED",
      target_entity: "WORKER",
      target_id: worker.worker_id,
      old_values: oldValues,
      new_values: { ...worker, password: worker.password ? "[PROTECTED]" : undefined },
    });

    this.persist();
    return { ...worker };
  }

  // --------------------------------------------------------------------------
  // PIECE SUBMISSION & PRODUCTION RECORDS
  // --------------------------------------------------------------------------

  /**
   * Submit completed piece count
   * Automatically resolves worker, active operation, and CURRENT RATE SNAPSHOT.
   * Updates weekly aggregation.
   */
  public submitPieceEntry(data: {
    worker_id: string;
    piece_count: number;
    production_date?: string;
    notes?: string;
  }): { entry: ProductionEntry; updatedSalary: WeeklySalary } {
    if (data.piece_count <= 0) {
      throw new Error("Piece count must be greater than zero.");
    }
    if (data.piece_count > 25000) {
      throw new Error("Unrealistic piece count. Maximum 25,000 allowed per entry.");
    }

    const worker = this.getWorkerById(data.worker_id);
    if (!worker) {
      throw new Error("Worker not found");
    }
    if (worker.status !== "ACTIVE") {
      throw new Error("Inactive worker cannot submit piece entries. Contact Admin.");
    }

    const op = this.operations.find((o) => o.id === worker.operation_id);
    if (!op) {
      throw new Error("Worker assigned operation is invalid or removed.");
    }

    // Server-side duplicate submission / idempotency protection (Section 47)
    const idempotencyKey = `${worker.id}-${data.piece_count}-${data.production_date || formatDateISO(new Date())}`;
    const lastTimestamp = this.submissionTimestamps.get(idempotencyKey);
    const now = Date.now();
    if (lastTimestamp && now - lastTimestamp < 3000) {
      throw new Error("Duplicate submission prevented. Your piece count was already submitted.");
    }
    this.submissionTimestamps.set(idempotencyKey, now);

    // Determine immutable snapshot rate
    const rateSnapshot = worker.custom_rate_override ?? op.current_rate;
    const calculatedEarning = Math.round(data.piece_count * rateSnapshot * 100) / 100;
    const prodDate = data.production_date || formatDateISO(new Date());

    const newEntry: ProductionEntry = {
      id: `pe-${worker.worker_id.toLowerCase()}-${Date.now()}`,
      worker_id: worker.id,
      worker_name_snapshot: worker.full_name,
      operation_id: op.id,
      operation_name_snapshot: op.name,
      piece_count: data.piece_count,
      rate_snapshot: rateSnapshot,
      calculated_earning: calculatedEarning,
      production_date: prodDate,
      submission_timestamp: new Date().toISOString(),
      status: "SUBMITTED",
      notes: data.notes,
    };

    this.productionEntries.unshift(newEntry);

    // Update or create weekly salary record
    const weekBounds = getWeekBounds(new Date(prodDate));
    let salary = this.weeklySalaries.find(
      (ws) => ws.worker_id === worker.id && ws.week_id === weekBounds.week_id
    );

    if (!salary) {
      salary = {
        id: `ws-${worker.id}-${weekBounds.week_id}`,
        worker_id: worker.id,
        worker_id_code: worker.worker_id,
        worker_name: worker.full_name,
        operation_name: op.name,
        current_rate: rateSnapshot,
        week_id: weekBounds.week_id,
        week_start_date: weekBounds.start_date,
        week_end_date: weekBounds.end_date,
        total_pieces: data.piece_count,
        calculated_amount: calculatedEarning,
        final_salary: calculatedEarning,
        total_adjustments: 0,
        status: "PENDING",
        created_at: new Date().toISOString(),
      };
      this.weeklySalaries.unshift(salary);
    } else {
      // Re-sum all entries in this week to guarantee exactness
      const weekEntries = this.productionEntries.filter(
        (e) =>
          (e.worker_id === worker.id || e.worker_id === worker.worker_id) &&
          e.production_date >= weekBounds.start_date &&
          e.production_date <= weekBounds.end_date
      );

      const totalPcs = weekEntries.reduce((sum, e) => sum + e.piece_count, 0);
      const totalEarn = weekEntries.reduce((sum, e) => sum + e.calculated_earning, 0);

      salary.total_pieces = totalPcs;
      salary.calculated_amount = Math.round(totalEarn * 100) / 100;
      
      // If salary has not been finalized yet, update final_salary to match calculated + adjustments
      if (salary.status === "PENDING") {
        salary.final_salary = Math.round((totalEarn + salary.total_adjustments) * 100) / 100;
      }
      salary.updated_at = new Date().toISOString();
    }

    this.persist();
    return { entry: newEntry, updatedSalary: salary };
  }

  public getProductionEntries(filters?: {
    worker_id?: string;
    operation_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): ProductionEntry[] {
    let list = [...this.productionEntries];

    if (filters?.worker_id) {
      const w = this.getWorkerById(filters.worker_id);
      if (w) {
        list = list.filter((e) => e.worker_id === w.id);
      }
    }

    if (filters?.operation_id) {
      list = list.filter((e) => e.operation_id === filters.operation_id);
    }

    if (filters?.start_date) {
      list = list.filter((e) => e.production_date >= filters.start_date!);
    }

    if (filters?.end_date) {
      list = list.filter((e) => e.production_date <= filters.end_date!);
    }

    if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }

    return list;
  }

  // --------------------------------------------------------------------------
  // WEEKLY SALARY PORTAL & REVIEW
  // --------------------------------------------------------------------------

  public getWeeklySalaries(week_id?: string, worker_id?: string): WeeklySalary[] {
    const today = new Date();
    const currentWeek = getWeekBounds(today);

    if (week_id && week_id !== "ALL") {
      this.ensureWeekRecordsExist(week_id);
      let list = this.weeklySalaries.filter((ws) => ws.week_id === week_id);
      if (worker_id) {
        const w = this.getWorkerById(worker_id);
        if (w) {
          list = list.filter((ws) => ws.worker_id === w.id || ws.worker_id === w.worker_id);
        }
      }
      return list;
    }

    // week_id is not specified: ensure current week exists
    this.ensureWeekRecordsExist(currentWeek.week_id);

    if (worker_id) {
      // Worker portal or worker detail view: return full history for worker with current week at index 0
      const w = this.getWorkerById(worker_id);
      let list = this.weeklySalaries;
      if (w) {
        list = list.filter((ws) => ws.worker_id === w.id || ws.worker_id === w.worker_id);
      }
      // Sort descending by week_id so current week is first, followed by historical settlements
      return [...list].sort((a, b) => b.week_id.localeCompare(a.week_id));
    }

    // General call without week_id and without worker_id (e.g. Admin Dashboard):
    return this.weeklySalaries.filter((ws) => ws.week_id === currentWeek.week_id);
  }

  private ensureWeekRecordsExist(targetWeekId: string) {
    const today = new Date();
    // Derive week bounds
    const weeks = [getWeekBounds(today)];
    const bounds = weeks.find((w) => w.week_id === targetWeekId) || getWeekBounds(today);

    this.workers.forEach((w) => {
      const existing = this.weeklySalaries.find(
        (ws) => ws.worker_id === w.id && ws.week_id === targetWeekId
      );
      if (!existing) {
        const op = this.operations.find((o) => o.id === w.operation_id);
        const rate = w.custom_rate_override ?? op?.current_rate ?? 0;

        // Sum any entries that exist for this week
        const weekEntries = this.productionEntries.filter(
          (e) =>
            e.worker_id === w.id &&
            e.production_date >= bounds.start_date &&
            e.production_date <= bounds.end_date
        );

        const totalPcs = weekEntries.reduce((sum, e) => sum + e.piece_count, 0);
        const totalCalc = weekEntries.reduce((sum, e) => sum + e.calculated_earning, 0);

        this.weeklySalaries.push({
          id: `ws-${w.id}-${targetWeekId}`,
          worker_id: w.id,
          worker_id_code: w.worker_id,
          worker_name: w.full_name,
          operation_name: op?.name || "Unassigned",
          current_rate: rate,
          week_id: targetWeekId,
          week_start_date: bounds.start_date,
          week_end_date: bounds.end_date,
          total_pieces: totalPcs,
          calculated_amount: totalCalc,
          final_salary: totalCalc,
          total_adjustments: 0,
          status: "PENDING",
          created_at: new Date().toISOString(),
        });
      }
    });
  }

  public getWeeklySalaryById(id: string): WeeklySalary | undefined {
    return this.weeklySalaries.find((ws) => ws.id === id);
  }

  public reviewWeeklySalary(
    weekly_salary_id: string,
    data: {
      final_salary: number;
      adjustment_amount?: number;
      notes?: string;
    }
  ): WeeklySalary {
    const salary = this.weeklySalaries.find((ws) => ws.id === weekly_salary_id);
    if (!salary) {
      throw new Error("Weekly salary record not found");
    }

    if (salary.status === "PAID") {
      throw new Error("Salary has already been marked as PAID. Modifying paid records is restricted.");
    }

    const oldValues = {
      final_salary: salary.final_salary,
      adjustments: salary.total_adjustments,
      notes: salary.notes,
    };

    salary.final_salary = Math.round(data.final_salary * 100) / 100;
    salary.total_adjustments = Math.round((data.adjustment_amount || 0) * 100) / 100;
    salary.notes = data.notes || null;
    salary.reviewed_by = "Admin";
    salary.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "SALARY_REVIEWED",
      target_entity: "WEEKLY_SALARY",
      target_id: `${salary.worker_id_code}-${salary.week_id}`,
      old_values: oldValues,
      new_values: {
        final_salary: salary.final_salary,
        adjustments: salary.total_adjustments,
        notes: salary.notes,
      },
    });

    this.persist();
    return { ...salary };
  }

  public markSalaryPaid(
    weekly_salary_id: string,
    data?: {
      payment_method?: string;
      reference_no?: string;
      notes?: string;
    }
  ): WeeklySalary {
    const salary = this.weeklySalaries.find((ws) => ws.id === weekly_salary_id);
    if (!salary) {
      throw new Error("Weekly salary record not found");
    }

    const oldStatus = salary.status;
    salary.status = "PAID";
    salary.payment_date = new Date().toISOString();
    salary.reviewed_by = "Admin";
    if (data?.notes) {
      salary.notes = salary.notes ? `${salary.notes} | ${data.notes}` : data.notes;
    }
    salary.updated_at = new Date().toISOString();

    this.addAuditLog({
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "SALARY_PAID",
      target_entity: "WEEKLY_SALARY",
      target_id: `${salary.worker_id_code}-${salary.week_id}`,
      old_values: { status: oldStatus },
      new_values: {
        status: "PAID",
        amount_paid: salary.final_salary,
        payment_date: salary.payment_date,
        method: data?.payment_method || "CASH",
        ref: data?.reference_no || null,
      },
    });

    this.persist();
    return { ...salary };
  }

  // --------------------------------------------------------------------------
  // 1-YEAR HISTORICAL AUDITING & REPORTS
  // --------------------------------------------------------------------------

  public get1YearSalaryHistory(worker_id?: string): MonthlySalarySummary[] {
    const months = getLast12Months();
    const result: MonthlySalarySummary[] = [];

    months.forEach((m) => {
      // Find all salaries whose week_start_date begins with YYYY-MM
      let matchingSalaries = this.weeklySalaries.filter((ws) =>
        ws.week_start_date.startsWith(m.month_id)
      );

      if (worker_id) {
        const w = this.getWorkerById(worker_id);
        if (w) {
          matchingSalaries = matchingSalaries.filter((ws) => ws.worker_id === w.id);
        }
      }

      const totalPcs = matchingSalaries.reduce((sum, s) => sum + s.total_pieces, 0);
      const totalCalc = matchingSalaries.reduce((sum, s) => sum + s.calculated_amount, 0);
      const totalFinal = matchingSalaries.reduce((sum, s) => sum + s.final_salary, 0);
      const totalPaid = matchingSalaries
        .filter((s) => s.status === "PAID")
        .reduce((sum, s) => sum + s.final_salary, 0);
      const totalPending = totalFinal - totalPaid;

      // Unique workers participating in this month
      const uniqueWorkers = new Set(matchingSalaries.map((s) => s.worker_id)).size;

      result.push({
        month: m.month_id,
        month_name: m.month_name,
        total_pieces: totalPcs,
        total_calculated: Math.round(totalCalc * 100) / 100,
        total_final_salary: Math.round(totalFinal * 100) / 100,
        total_paid: Math.round(totalPaid * 100) / 100,
        total_pending: Math.max(0, Math.round(totalPending * 100) / 100),
        worker_count: uniqueWorkers,
      });
    });

    return result;
  }

  // --------------------------------------------------------------------------
  // DASHBOARD METRICS
  // --------------------------------------------------------------------------

  public getDashboardMetrics(week_id?: string): DashboardMetrics {
    const today = new Date();
    const todayISO = formatDateISO(today);
    const currentWeek = getWeekBounds(today);
    const targetWeekId = week_id || currentWeek.week_id;

    const totalWorkers = this.workers.length;
    const activeWorkers = this.workers.filter((w) => w.status === "ACTIVE").length;

    // Today's pieces
    const todayEntries = this.productionEntries.filter((e) => e.production_date === todayISO);
    const todayPieces = todayEntries.reduce((sum, e) => sum + e.piece_count, 0);

    // This week's pieces & salaries
    const thisWeekSalaries = this.getWeeklySalaries(targetWeekId);
    const thisWeekPieces = thisWeekSalaries.reduce((sum, s) => sum + s.total_pieces, 0);
    const pendingSalariesCount = thisWeekSalaries.filter((s) => s.status === "PENDING").length;
    const paidSalariesCount = thisWeekSalaries.filter((s) => s.status === "PAID").length;
    const weeklyPayrollAmount = thisWeekSalaries.reduce((sum, s) => sum + s.final_salary, 0);

    // Monthly payroll calculation
    const currentMonthPrefix = todayISO.substring(0, 7); // e.g. "2026-09"
    const monthSalaries = this.weeklySalaries.filter((s) =>
      s.week_start_date.startsWith(currentMonthPrefix)
    );
    const monthlyPayrollAmount = monthSalaries.reduce((sum, s) => sum + s.final_salary, 0);

    // Operation breakdown
    const opBreakdown = this.operations.map((op) => {
      const opWorkers = this.workers.filter((w) => w.operation_id === op.id);
      const opTodayEntries = todayEntries.filter((e) => e.operation_id === op.id);
      const opTodayPcs = opTodayEntries.reduce((sum, e) => sum + e.piece_count, 0);

      // Week pieces for this operation
      const opWeekEntries = this.productionEntries.filter(
        (e) =>
          e.operation_id === op.id &&
          e.production_date >= currentWeek.start_date &&
          e.production_date <= currentWeek.end_date
      );
      const opWeekPcs = opWeekEntries.reduce((sum, e) => sum + e.piece_count, 0);

      return {
        operation_id: op.id,
        operation_name: op.name,
        today_pieces: opTodayPcs,
        week_pieces: opWeekPcs,
        worker_count: opWorkers.length,
        current_rate: op.current_rate,
      };
    });

    // 7-day weekly trend
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyTrend = dayNames.map((dayName, idx) => {
      const d = new Date(currentWeek.start_date);
      d.setDate(d.getDate() + idx);
      const dISO = formatDateISO(d);
      const dayPieces = this.productionEntries
        .filter((e) => e.production_date === dISO)
        .reduce((sum, e) => sum + e.piece_count, 0);

      return {
        day_name: dayName,
        date: dISO,
        pieces: dayPieces,
      };
    });

    return {
      total_workers: totalWorkers,
      active_workers: activeWorkers,
      today_pieces: todayPieces,
      this_week_pieces: thisWeekPieces,
      pending_salaries_count: pendingSalariesCount,
      paid_salaries_count: paidSalariesCount,
      weekly_payroll_amount: Math.round(weeklyPayrollAmount * 100) / 100,
      monthly_payroll_amount: Math.round(monthlyPayrollAmount * 100) / 100,
      operation_breakdown: opBreakdown,
      weekly_trend: weeklyTrend,
    };
  }

  // --------------------------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------------------------

  public getAuditLogs(limit: number = 50): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  public addAuditLog(data: Omit<AuditLog, "id" | "timestamp">) {
    const log: AuditLog = {
      id: `al-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actor_name: data.actor_name,
      actor_role: data.actor_role,
      action: data.action,
      target_entity: data.target_entity,
      target_id: data.target_id,
      old_values: data.old_values,
      new_values: data.new_values,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  // --------------------------------------------------------------------------
  // ADMIN MANAGEMENT & LAST-ADMIN SECURITY (Section 44)
  // --------------------------------------------------------------------------

  public getAdmins(): AdminAccount[] {
    return [...this.admins];
  }

  public addAdmin(data: { full_name: string; email: string }, actor_name: string = "Admin"): AdminAccount {
    const emailLower = data.email.trim().toLowerCase();
    if (this.admins.some((a) => a.email.toLowerCase() === emailLower)) {
      throw new Error(`Admin with email "${data.email}" already exists.`);
    }
    const newAdmin: AdminAccount = {
      id: `adm-${Date.now()}`,
      full_name: data.full_name.trim(),
      email: emailLower,
      role: "ADMIN",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    };
    this.admins.push(newAdmin);
    this.addAuditLog({
      actor_name,
      actor_role: "ADMIN",
      action: "ADMIN_CREATED",
      target_entity: "ADMIN_ACCOUNT",
      target_id: newAdmin.email,
      old_values: null,
      new_values: { full_name: newAdmin.full_name, email: newAdmin.email },
    });
    return newAdmin;
  }

  public deactivateAdmin(id: string, actor_name: string = "Admin", reason?: string): AdminAccount {
    const admin = this.admins.find((a) => a.id === id);
    if (!admin) throw new Error("Admin account not found");

    // CRITICAL SECURITY RULE: NEVER ALLOW LAST ACTIVE ADMIN TO BE DEACTIVATED
    const activeCount = this.admins.filter((a) => a.status === "ACTIVE").length;
    if (admin.status === "ACTIVE" && activeCount <= 1) {
      throw new Error("SECURITY VIOLATION: Cannot deactivate the last active Administrator account.");
    }

    const oldStatus = admin.status;
    admin.status = admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    this.addAuditLog({
      actor_name,
      actor_role: "ADMIN",
      action: "ADMIN_STATUS_CHANGED",
      target_entity: "ADMIN_ACCOUNT",
      target_id: admin.email,
      old_values: { status: oldStatus },
      new_values: { status: admin.status, reason },
    });
    return admin;
  }

  public removeAdmin(id: string, actor_name: string = "Admin", reason?: string): void {
    const index = this.admins.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Admin account not found");

    // CRITICAL SECURITY RULE: NEVER ALLOW LAST ACTIVE ADMIN TO BE REMOVED
    const activeCount = this.admins.filter((a) => a.status === "ACTIVE").length;
    if (this.admins[index].status === "ACTIVE" && activeCount <= 1) {
      throw new Error("SECURITY VIOLATION: Cannot remove the last active Administrator account.");
    }

    const removed = this.admins.splice(index, 1)[0];
    this.addAuditLog({
      actor_name,
      actor_role: "ADMIN",
      action: "ADMIN_REMOVED",
      target_entity: "ADMIN_ACCOUNT",
      target_id: removed.email,
      old_values: { email: removed.email, name: removed.full_name },
      new_values: { reason },
    });
  }

  // --------------------------------------------------------------------------
  // PRODUCTION ENTRY CORRECTIONS (Section 46)
  // --------------------------------------------------------------------------

  public requestCorrection(data: {
    production_entry_id: string;
    requested_piece_count: number;
    reason: string;
  }): CorrectionRequest {
    const entry = this.productionEntries.find((e) => e.id === data.production_entry_id);
    if (!entry) throw new Error("Production entry not found");
    if (data.requested_piece_count <= 0) throw new Error("Requested piece count must be greater than zero");
    if (data.requested_piece_count === entry.piece_count) {
      throw new Error("Requested piece count is identical to existing piece count");
    }
    if (!data.reason.trim()) throw new Error("Reason is required for piece correction request");

    const request: CorrectionRequest = {
      id: `cr-${Date.now()}`,
      production_entry_id: entry.id,
      worker_id: entry.worker_id,
      worker_name: entry.worker_name_snapshot,
      operation_name: entry.operation_name_snapshot,
      production_date: entry.production_date,
      original_piece_count: entry.piece_count,
      requested_piece_count: data.requested_piece_count,
      rate_snapshot: entry.rate_snapshot,
      reason: data.reason.trim(),
      status: "PENDING",
      created_at: new Date().toISOString(),
    };
    this.correctionRequests.unshift(request);

    // Notify admin
    this.addNotification({
      recipient_role: "ADMIN",
      type: "CORRECTION_REQUESTED",
      title: "Piece Correction Request",
      message: `${entry.worker_name_snapshot} requested correction from ${entry.piece_count} to ${data.requested_piece_count} pieces.`,
      link: "/admin/corrections",
    });

    return request;
  }

  public getCorrectionRequests(status?: string): CorrectionRequest[] {
    if (status && status !== "ALL") {
      return this.correctionRequests.filter((cr) => cr.status === status);
    }
    return [...this.correctionRequests];
  }

  public approveCorrection(
    request_id: string,
    actor_name: string = "Admin"
  ): { request: CorrectionRequest; updatedEntry: ProductionEntry } {
    const req = this.correctionRequests.find((cr) => cr.id === request_id);
    if (!req) throw new Error("Correction request not found");
    if (req.status !== "PENDING") throw new Error(`Correction request is already ${req.status}`);

    const entry = this.productionEntries.find((e) => e.id === req.production_entry_id);
    if (!entry) throw new Error("Linked production entry not found");

    const oldPieces = entry.piece_count;
    const oldEarnings = entry.calculated_earning;

    // Update entry
    entry.piece_count = req.requested_piece_count;
    entry.calculated_earning = Math.round(req.requested_piece_count * entry.rate_snapshot * 100) / 100;
    entry.status = "ADJUSTED";

    req.status = "APPROVED";
    req.reviewed_by = actor_name;
    req.reviewed_at = new Date().toISOString();

    // Recalculate weekly salary for this worker
    const weekBounds = getWeekBounds(new Date(entry.production_date));
    const salary = this.weeklySalaries.find(
      (ws) => ws.worker_id === entry.worker_id && ws.week_id === weekBounds.week_id
    );
    if (salary && salary.status === "PENDING") {
      const weekEntries = this.productionEntries.filter(
        (e) =>
          e.worker_id === entry.worker_id &&
          e.production_date >= weekBounds.start_date &&
          e.production_date <= weekBounds.end_date
      );
      const totalPcs = weekEntries.reduce((sum, e) => sum + e.piece_count, 0);
      const totalEarn = weekEntries.reduce((sum, e) => sum + e.calculated_earning, 0);
      salary.total_pieces = totalPcs;
      salary.calculated_amount = Math.round(totalEarn * 100) / 100;
      salary.final_salary = Math.round((totalEarn + salary.total_adjustments) * 100) / 100;
    }

    // Audit Log
    this.addAuditLog({
      actor_name,
      actor_role: "ADMIN",
      action: "PRODUCTION_CORRECTED",
      target_entity: "PRODUCTION_ENTRY",
      target_id: entry.id,
      old_values: { piece_count: oldPieces, earnings: oldEarnings },
      new_values: {
        piece_count: entry.piece_count,
        earnings: entry.calculated_earning,
        worker: entry.worker_name_snapshot,
        reason: req.reason,
      },
    });

    // Notify worker
    this.addNotification({
      recipient_role: "WORKER",
      recipient_id: entry.worker_id,
      type: "CORRECTION_APPROVED",
      title: "Piece Count Correction Approved",
      message: `Your correction for ${entry.production_date} (${req.requested_piece_count} pcs) was approved by ${actor_name}.`,
      link: "/worker/history",
    });

    return { request: req, updatedEntry: entry };
  }

  public rejectCorrection(
    request_id: string,
    actor_name: string = "Admin",
    rejection_reason?: string
  ): CorrectionRequest {
    const req = this.correctionRequests.find((cr) => cr.id === request_id);
    if (!req) throw new Error("Correction request not found");
    if (req.status !== "PENDING") throw new Error(`Correction request is already ${req.status}`);

    req.status = "REJECTED";
    req.reviewed_by = actor_name;
    req.reviewed_at = new Date().toISOString();

    this.addAuditLog({
      actor_name,
      actor_role: "ADMIN",
      action: "CORRECTION_REJECTED",
      target_entity: "CORRECTION_REQUEST",
      target_id: req.id,
      old_values: { requested_count: req.requested_piece_count },
      new_values: { reason: rejection_reason || "Declined by supervisor" },
    });

    this.addNotification({
      recipient_role: "WORKER",
      recipient_id: req.worker_id,
      type: "CORRECTION_REJECTED",
      title: "Piece Count Correction Declined",
      message: `Your correction request was declined: ${rejection_reason || "Reason not accepted"}.`,
      link: "/worker/history",
    });

    return req;
  }

  // --------------------------------------------------------------------------
  // NOTIFICATION CENTER (Section 50)
  // --------------------------------------------------------------------------

  public getNotifications(recipient_role?: "ADMIN" | "WORKER", recipient_id?: string): AppNotification[] {
    return this.notifications.filter((n) => {
      if (recipient_role && n.recipient_role && n.recipient_role !== recipient_role) return false;
      if (recipient_id && n.recipient_id && n.recipient_id !== recipient_id) return false;
      return true;
    });
  }

  public addNotification(data: Omit<AppNotification, "id" | "created_at" | "read">): AppNotification {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    return notif;
  }

  public markNotificationRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  }

  public markAllNotificationsRead(recipient_role?: "ADMIN" | "WORKER"): void {
    this.notifications.forEach((n) => {
      if (!recipient_role || n.recipient_role === recipient_role) {
        n.read = true;
      }
    });
  }

  // --------------------------------------------------------------------------
  // DASHBOARD ATTENTION SYSTEM (Section 56)
  // --------------------------------------------------------------------------

  public getAttentionAlerts(): AttentionAlert[] {
    const today = new Date();
    const todayISO = formatDateISO(today);
    const currentWeek = getWeekBounds(today);
    const alerts: AttentionAlert[] = [];

    // 1. Unsubmitted workers today
    const todayEntries = this.productionEntries.filter((e) => e.production_date === todayISO);
    const submittedWorkerIds = new Set(todayEntries.map((e) => e.worker_id));
    const unsubmittedWorkers = this.workers.filter(
      (w) => w.status === "ACTIVE" && !submittedWorkerIds.has(w.id)
    );
    if (unsubmittedWorkers.length > 0) {
      alerts.push({
        id: "alert-unsubmitted",
        type: "UNSUBMITTED_WORKERS",
        count: unsubmittedWorkers.length,
        title: `${unsubmittedWorkers.length} workers haven't logged pieces today`,
        description: `Active floor operators with 0 piece completions recorded for ${formatDateDisplay(todayISO)}.`,
        href: "/admin/workers",
        severity: "warning",
      });
    }

    // 2. Pending salaries
    const pendingSalaries = this.weeklySalaries.filter(
      (ws) => ws.week_id === currentWeek.week_id && ws.status === "PENDING"
    );
    if (pendingSalaries.length > 0) {
      alerts.push({
        id: "alert-pending-salary",
        type: "PENDING_SALARY",
        count: pendingSalaries.length,
        title: `${pendingSalaries.length} weekly salaries awaiting review`,
        description: "Calculated wages for current week requiring admin review & disbursement.",
        href: "/admin/salary",
        severity: "alert",
      });
    }

    // 3. Pending correction requests
    const pendingCorrections = this.correctionRequests.filter((cr) => cr.status === "PENDING");
    if (pendingCorrections.length > 0) {
      alerts.push({
        id: "alert-corrections",
        type: "PENDING_CORRECTIONS",
        count: pendingCorrections.length,
        title: `${pendingCorrections.length} correction requests pending`,
        description: "Worker piece adjustment requests awaiting supervisor verification.",
        href: "/admin/corrections",
        severity: "warning",
      });
    }

    // 4. Inactive workers
    const inactiveWorkers = this.workers.filter((w) => w.status === "INACTIVE");
    if (inactiveWorkers.length > 0) {
      alerts.push({
        id: "alert-inactive",
        type: "INACTIVE_WORKERS",
        count: inactiveWorkers.length,
        title: `${inactiveWorkers.length} workers currently inactive`,
        description: "Accounts deactivated from factory floor access.",
        href: "/admin/workers",
        severity: "info",
      });
    }

    return alerts;
  }

  // --------------------------------------------------------------------------
  // COMPANY SETTINGS (Section 57)
  // --------------------------------------------------------------------------

  public getSettings(): CompanySettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<CompanySettings>, actor_name: string = "Admin"): CompanySettings {
    const old = { ...this.settings };
    this.settings = { ...this.settings, ...updates };
    this.addAuditLog({
      actor_name,
      actor_role: "ADMIN",
      action: "SETTINGS_UPDATED",
      target_entity: "COMPANY_SETTINGS",
      target_id: "GLOBAL",
      old_values: old,
      new_values: { ...this.settings },
    });
    return { ...this.settings };
  }

  // --------------------------------------------------------------------------
  // GLOBAL ADMIN SEARCH (Section 55)
  // --------------------------------------------------------------------------

  public globalSearch(query: string): GlobalSearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: GlobalSearchResult[] = [];

    // Search workers
    this.workers.forEach((w) => {
      if (
        w.full_name.toLowerCase().includes(q) ||
        w.worker_id.toLowerCase().includes(q) ||
        w.mobile.includes(q)
      ) {
        results.push({
          id: w.id,
          title: `${w.full_name} (${w.worker_id})`,
          subtitle: `Operator • ${w.operation_name || "General"} • Mobile: ${w.mobile}`,
          category: "WORKER",
          href: `/admin/workers/${w.id}`,
        });
      }
    });

    // Search operations
    this.operations.forEach((op) => {
      if (op.name.toLowerCase().includes(q) || op.code.toLowerCase().includes(q)) {
        results.push({
          id: op.id,
          title: `${op.name} (${op.code})`,
          subtitle: `Operation • Base Rate: ₹${op.current_rate.toFixed(2)} / pc`,
          category: "OPERATION",
          href: `/admin/operations`,
        });
      }
    });

    // Search weekly salaries
    this.weeklySalaries.slice(0, 100).forEach((ws) => {
      if (
        ws.week_id.toLowerCase().includes(q) ||
        (ws.worker_name && ws.worker_name.toLowerCase().includes(q))
      ) {
        results.push({
          id: ws.id,
          title: `${ws.worker_name} — Week ${ws.week_id}`,
          subtitle: `${ws.total_pieces} pcs • ₹${ws.final_salary} • Status: ${ws.status}`,
          category: "SALARY",
          href: `/admin/salary`,
        });
      }
    });

    return results.slice(0, 15);
  }
}

// Global singleton instance
const globalForStore = globalThis as unknown as { appStore: DataStore };
export const store = globalForStore.appStore || new DataStore();
if (process.env.NODE_ENV !== "production") globalForStore.appStore = store;
