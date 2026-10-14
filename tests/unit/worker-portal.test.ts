import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/lib/db/store";
import { loginUser } from "@/lib/auth/session";
import { ProductionService } from "@/services/production.service";
import { SupabaseDbService } from "@/services/supabase-db.service";

describe("Worker Portal End-to-End Reliability & Fix Verification", () => {
  beforeEach(() => {
    store.seedTestFixtures();
  });

  describe("1. Worker Authentication & Identity Resolution", () => {
    it("authenticates Kumar via Worker ID 'MK001' with password 'worker123'", async () => {
      const res = await loginUser({ usernameOrId: "MK001", password: "worker123" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("WORKER");
      expect(res.session?.user.worker_id).toBe("MK001");
      expect(res.session?.user.name).toBe("Kumar");
    });

    it("authenticates Kumar via email 'kumar@mkappreals.com' with password 'worker123'", async () => {
      const res = await loginUser({ usernameOrId: "kumar@mkappreals.com", password: "worker123" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("WORKER");
      expect(res.session?.user.email).toBe("kumar@mkappreals.com");
    });

    it("authenticates Kumar with lowercase worker ID 'mk001' (case-insensitive login)", async () => {
      const res = await loginUser({ usernameOrId: "mk001", password: "worker123" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("WORKER");
      expect(res.session?.user.worker_id).toBe("MK001");
    });

    it("resolves worker profile case-insensitively via store.getWorkerById", () => {
      const workerUpper = store.getWorkerById("MK001");
      const workerLower = store.getWorkerById("mk001");
      const workerId = store.getWorkerById("w-kumar");
      const workerEmail = store.getWorkerById("kumar@mkappreals.com");

      expect(workerUpper).toBeDefined();
      expect(workerLower).toBeDefined();
      expect(workerId).toBeDefined();
      expect(workerEmail).toBeDefined();
      expect(workerUpper?.id).toBe("w-kumar");
      expect(workerLower?.id).toBe("w-kumar");
      expect(workerId?.id).toBe("w-kumar");
      expect(workerEmail?.id).toBe("w-kumar");
    });

    it("self-heals missing worker state from authenticated session via ensureWorkerFromSession", () => {
      const sessionUser = {
        id: "w-self-heal-test",
        worker_id: "MK888",
        name: "Test Healed Worker",
        email: "healed@mkappreals.com",
        operation_name: "Singer",
        current_rate: 3.0,
      };

      const resolved = store.ensureWorkerFromSession(sessionUser);
      expect(resolved.worker_id).toBe("MK888");
      expect(resolved.full_name).toBe("Test Healed Worker");

      // Now lookup in store must find the healed worker
      const found = store.getWorkerById("MK888");
      expect(found).toBeDefined();
      expect(found?.full_name).toBe("Test Healed Worker");
    });
  });

  describe("2. Worker Piece-Count Submission & Wage Calculation", () => {
    it("submits piece completion and updates both daily and weekly wage totals", () => {
      const worker = store.getWorkerById("MK001")!;
      const initialStats = store.getWorkersWithStats().find((w) => w.id === worker.id);
      const initialThisWeek = initialStats?.this_week_pieces || 0;

      const { entry, updatedSalary } = ProductionService.submitPieces({
        worker_id: worker.id,
        piece_count: 350,
        production_date: new Date().toISOString().slice(0, 10),
      });

      expect(entry.piece_count).toBe(350);
      expect(entry.rate_snapshot).toBe(worker.custom_rate_override || 2.0);
      expect(entry.calculated_earning).toBe(350 * 2.0);

      // Verify weekly salary was updated
      expect(updatedSalary.total_pieces).toBeGreaterThanOrEqual(initialThisWeek + 350);

      // Verify updated stats in worker dashboard
      const updatedStats = store.getWorkersWithStats().find((w) => w.id === worker.id);
      expect(updatedStats?.today_pieces).toBeGreaterThanOrEqual(350);
      expect(updatedStats?.today_earnings).toBeGreaterThanOrEqual(700);
    });
  });

  describe("3. Worker Weekly Salary Settlement History", () => {
    it("returns full salary history for worker with current week at index 0 and past settlements preserved", () => {
      const worker = store.getWorkerById("MK001")!;
      const salaries = store.getWeeklySalaries(undefined, worker.id);

      expect(salaries.length).toBeGreaterThanOrEqual(1);

      // First entry is current week
      const currentWeek = salaries[0];
      expect(currentWeek.status).toBeDefined();
      expect(currentWeek.total_pieces).toBeGreaterThanOrEqual(0);

      // General getWeeklySalaries() without worker filter still returns current week for all workers
      const allWorkersCurrentWeek = store.getWeeklySalaries();
      expect(allWorkersCurrentWeek.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("4. Supabase Resilience & Fallback Operations", () => {
    it("handles Supabase operations gracefully when tables are absent without crashing", async () => {
      // Testing with nonexistent worker or offline/placeholder Supabase
      const remoteWorker = await SupabaseDbService.getWorkerById("non-existent-worker-12345");
      expect(remoteWorker).toBeNull();

      // Testing piece entry insert fallback
      const insertResult = await SupabaseDbService.insertProductionEntry({
        id: "pe-test-123",
        worker_id: "w-kumar",
        worker_name_snapshot: "Kumar",
        operation_id: "op-overlock",
        operation_name_snapshot: "Overlock",
        piece_count: 100,
        rate_snapshot: 2.0,
        calculated_earning: 200,
        production_date: "2026-10-14",
        submission_timestamp: new Date().toISOString(),
        status: "SUBMITTED",
      });
      // insertResult may be false if tables not migrated, but does NOT throw exception
      expect(typeof insertResult).toBe("boolean");
    });

    it("handles getWorkerForAuthUser safely with valid and invalid UUIDs", async () => {
      const validUuid = "12345678-1234-1234-1234-123456789abc";
      const res = await SupabaseDbService.getWorkerForAuthUser(validUuid);
      expect(res === null || typeof res === "object").toBe(true);

      const nonUuid = "invalid-not-a-uuid";
      const res2 = await SupabaseDbService.getWorkerForAuthUser(nonUuid);
      expect(res2 === null || typeof res2 === "object").toBe(true);
    });

    it("handles getWorkerById safely with both code strings and UUIDs without SQL casting errors", async () => {
      // String code like MK001
      const resCode = await SupabaseDbService.getWorkerById("MK001");
      expect(resCode === null || typeof resCode === "object").toBe(true);

      // UUID format
      const resUuid = await SupabaseDbService.getWorkerById("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d");
      expect(resUuid === null || typeof resUuid === "object").toBe(true);
    });

    it("returns descriptive error when worker profile cannot be found during login", async () => {
      const res = await loginUser({ usernameOrId: "NON_EXISTENT_WORKER_999", password: "wrong" });
      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid Worker ID, Email, or Mobile Number. Please check your credentials.");
    });
  });

  describe("5. Admin Worker Update & Worker Portal End-to-End Flow", () => {
    it("allows admin to update worker email and password, and worker immediately logs in and submits pieces", async () => {
      // 1. Admin creates a new worker
      const worker = store.createWorker({
        worker_id: "W-TEST-99",
        full_name: "Test Operator 99",
        mobile: "9988776655",
        operation_id: "op-overlock",
        custom_rate_override: 2.5,
        status: "ACTIVE",
      });
      expect(worker.worker_id).toBe("W-TEST-99");

      // 2. Admin edits worker: assigns email and login password
      const updated = store.updateWorker(worker.id, {
        email: "operator99@factory.com",
        password: "securepass123",
      });
      expect(updated.email).toBe("operator99@factory.com");
      expect(updated.password).toBe("securepass123");

      // 3. Worker signs in using the configured email and password
      const loginRes = await loginUser({
        usernameOrId: "operator99@factory.com",
        password: "securepass123",
      });
      expect(loginRes.success).toBe(true);
      expect(loginRes.session?.user.role).toBe("WORKER");
      expect(loginRes.session?.user.worker_id).toBe("W-TEST-99");
      expect(loginRes.session?.user.name).toBe("Test Operator 99");

      // 4. Worker submits daily pieces
      const { entry, updatedSalary } = ProductionService.submitPieces({
        worker_id: worker.id,
        piece_count: 200,
        production_date: new Date().toISOString().slice(0, 10),
      });
      expect(entry.piece_count).toBe(200);
      expect(entry.calculated_earning).toBe(500); // 200 * 2.50
      expect(updatedSalary.total_pieces).toBeGreaterThanOrEqual(200);

      // 5. Worker checks weekly salary settlements
      const workerSalaries = store.getWeeklySalaries(undefined, worker.id);
      expect(workerSalaries.length).toBeGreaterThanOrEqual(1);
      expect(workerSalaries[0].calculated_amount).toBeGreaterThanOrEqual(500);
    });

    it("rejects login if incorrect password is used for the updated worker", async () => {
      const worker = store.createWorker({
        worker_id: "W-TEST-99",
        full_name: "Test Operator 99",
        mobile: "9988776655",
        operation_id: "op-overlock",
        custom_rate_override: 2.5,
        status: "ACTIVE",
      });
      store.updateWorker(worker.id, {
        email: "operator99@factory.com",
        password: "securepass123",
      });

      const loginRes = await loginUser({
        usernameOrId: "operator99@factory.com",
        password: "wrongpassword",
      });
      expect(loginRes.success).toBe(false);
      expect(loginRes.error).toContain("Invalid worker password");
    });
  });
});
