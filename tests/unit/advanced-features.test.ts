import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/lib/db/store";
import { loginUser, loginWithGoogle, requestPasswordReset, confirmPasswordReset } from "@/lib/auth/session";

describe("Advanced Authentication, Admin Management & Core Workflows", () => {
  beforeEach(() => {
    store.seedTestFixtures();
  });
  // 1. Admin Credentials & Google OAuth Role Whitelisting
  describe("Admin Authentication & Role Authorization (Section 44-45)", () => {
    it("authenticates primary admin mkarun@gmail.com with correct password arun1987", async () => {
      const res = await loginUser({ usernameOrId: "mkarun@gmail.com", password: "arun1987" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("ADMIN");
      expect(res.session?.user.email).toBe("mkarun@gmail.com");
      expect(res.session?.user.name).toBe("MK Arun");
    });

    it("rejects primary admin mkarun@gmail.com when an incorrect password is provided", async () => {
      const res = await loginUser({ usernameOrId: "mkarun@gmail.com", password: "wrong_password" });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid administrator password");
    });

    it("authenticates mkarun@gmail.com via Google OAuth with ADMIN role", async () => {
      const res = await loginWithGoogle({ email: "mkarun@gmail.com", name: "MK Arun" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("ADMIN");
      expect(res.session?.user.email).toBe("mkarun@gmail.com");
    });

    it("authenticates secondary admin admin@mkappreals.com with ADMIN role", async () => {
      const res = await loginWithGoogle({ email: "admin@mkappreals.com", name: "System Admin" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("ADMIN");
      expect(res.session?.user.email).toBe("admin@mkappreals.com");
    });

    it("strictly blocks unauthorized Google accounts from gaining access", async () => {
      const res = await loginWithGoogle({ email: "random_stranger@gmail.com", name: "Stranger" });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Your account does not have access to MK APPREALS");
      expect(res.session).toBeUndefined();
    });
  });

  // 1b. Worker Email & Password Access Management
  describe("Worker Credentials & Portal Access (Admin Assigned)", () => {
    it("allows admin to create a worker with email and password", () => {
      const ops = store.getOperations();
      const testEmail = `worker_test_${Date.now()}@mkappreals.com`;
      const worker = store.createWorker({
        worker_id: `MK${Math.floor(100 + Math.random() * 899)}`,
        full_name: "Ramesh Test",
        mobile: "9944001122",
        operation_id: ops[0].id,
        email: testEmail,
        password: "WorkerSecure2026!",
        status: "ACTIVE",
      });

      expect(worker.id).toBeDefined();
      expect(worker.email).toBe(testEmail.toLowerCase());
      expect(worker.password).toBe("WorkerSecure2026!");
    });

    it("authenticates worker with email and correct password", async () => {
      const ops = store.getOperations();
      const testEmail = `sewer_${Date.now()}@mkappreals.com`;
      const worker = store.createWorker({
        worker_id: `MK${Math.floor(100 + Math.random() * 899)}`,
        full_name: "Shanthi Sewing",
        mobile: "9944001133",
        operation_id: ops[0].id,
        email: testEmail,
        password: "PassSewing123!",
        status: "ACTIVE",
      });

      const res = await loginUser({ usernameOrId: testEmail, password: "PassSewing123!" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("WORKER");
      expect(res.session?.user.email).toBe(testEmail.toLowerCase());
      expect(res.session?.user.worker_db_id).toBe(worker.id);
    });

    it("authenticates worker with Worker ID and password", async () => {
      const ops = store.getOperations();
      const workerId = `MK${Math.floor(100 + Math.random() * 899)}`;
      const worker = store.createWorker({
        worker_id: workerId,
        full_name: "Gopal Flatlock",
        mobile: "9944001144",
        operation_id: ops[1].id,
        email: `gopal_${Date.now()}@mkappreals.com`,
        password: "GopalSecretPassword!",
        status: "ACTIVE",
      });

      const res = await loginUser({ usernameOrId: workerId, password: "GopalSecretPassword!" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("WORKER");
      expect(res.session?.user.worker_db_id).toBe(worker.id);
    });

    it("rejects worker login when incorrect password is provided", async () => {
      const ops = store.getOperations();
      const testEmail = `ironer_${Date.now()}@mkappreals.com`;
      store.createWorker({
        worker_id: `MK${Math.floor(100 + Math.random() * 899)}`,
        full_name: "Muthu Ironing",
        mobile: "9944001155",
        operation_id: ops[3].id,
        email: testEmail,
        password: "MuthuPassword2026",
        status: "ACTIVE",
      });

      const res = await loginUser({ usernameOrId: testEmail, password: "WrongPassword" });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid worker password");
    });

    it("authenticates worker via Google OAuth matching worker email with WORKER role", async () => {
      const ops = store.getOperations();
      const googleWorkerEmail = `google_worker_${Date.now()}@gmail.com`;
      const worker = store.createWorker({
        worker_id: `MK${Math.floor(100 + Math.random() * 899)}`,
        full_name: "Anand Singer",
        mobile: "9944001166",
        operation_id: ops[2].id,
        email: googleWorkerEmail,
        password: "AnyPassword123!",
        status: "ACTIVE",
      });

      const res = await loginWithGoogle({ email: googleWorkerEmail, name: "Anand Singer" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("WORKER");
      expect(res.session?.user.email).toBe(googleWorkerEmail);
      expect(res.session?.user.worker_db_id).toBe(worker.id);
    });

    it("allows admin to update worker email and password", async () => {
      const ops = store.getOperations();
      const worker = store.createWorker({
        worker_id: `MK${Math.floor(100 + Math.random() * 899)}`,
        full_name: "Initial Name",
        mobile: "9944001177",
        operation_id: ops[0].id,
        status: "ACTIVE",
      });

      const newEmail = `updated_${Date.now()}@mkappreals.com`;
      const updated = store.updateWorker(worker.id, {
        email: newEmail,
        password: "NewPassword2026!",
      });

      expect(updated.email).toBe(newEmail);
      expect(updated.password).toBe("NewPassword2026!");

      // Worker can now login with updated credentials
      const res = await loginUser({ usernameOrId: newEmail, password: "NewPassword2026!" });
      expect(res.success).toBe(true);
      expect(res.session?.user.role).toBe("WORKER");
    });

    it("prevents duplicate email assignment across workers", () => {
      const ops = store.getOperations();
      const sharedEmail = `shared_${Date.now()}@mkappreals.com`;
      store.createWorker({
        worker_id: `MK${Math.floor(100 + Math.random() * 899)}`,
        full_name: "Worker One",
        mobile: "9944001188",
        operation_id: ops[0].id,
        email: sharedEmail,
        status: "ACTIVE",
      });

      expect(() => {
        store.createWorker({
          worker_id: `MK${Math.floor(100 + Math.random() * 899)}`,
          full_name: "Worker Two",
          mobile: "9944001199",
          operation_id: ops[0].id,
          email: sharedEmail,
          status: "ACTIVE",
        });
      }).toThrow(/already exists/);
    });
  });


  // 2. Admin Account Management & Last Active Admin Protection
  describe("Admin Account Management & Last Admin Guard (Section 58)", () => {
    it("allows adding a new admin account", () => {
      const email = `supervisor_${Date.now()}@mkappreals.com`;
      const newAdmin = store.addAdmin({
        full_name: "Operations Supervisor",
        email,
      });
      expect(newAdmin.id).toBeDefined();
      expect(newAdmin.role).toBe("ADMIN");
      expect(newAdmin.status).toBe("ACTIVE");

      const admins = store.getAdmins();
      expect(admins.some((a) => a.email === email)).toBe(true);
    });

    it("prevents deactivating or removing the last active admin", () => {
      const activeAdmins = store.getAdmins().filter((a) => a.status === "ACTIVE");
      
      // Deactivate all except the last one
      for (let i = 1; i < activeAdmins.length; i++) {
        store.deactivateAdmin(activeAdmins[i].id);
      }

      const remainingActive = store.getAdmins().filter((a) => a.status === "ACTIVE");
      expect(remainingActive.length).toBe(1);

      // Attempting to deactivate or remove the last remaining active admin MUST throw
      expect(() => {
        store.deactivateAdmin(remainingActive[0].id);
      }).toThrow(/Cannot deactivate the last active Administrator account/);

      expect(() => {
        store.removeAdmin(remainingActive[0].id);
      }).toThrow(/Cannot remove the last active Administrator account/);
    });
  });

  // 3. Password Reset Security & Live Validation
  describe("Password Reset & Security Checklist (Section 44)", () => {
    it("returns generic anti-enumeration response for any email", async () => {
      const res1 = await requestPasswordReset("admin@mkappreals.com");
      expect(res1.success).toBe(true);
      expect(res1.message).toContain("If an account exists");

      const res2 = await requestPasswordReset("nonexistent@domain.com");
      expect(res2.success).toBe(true);
      expect(res2.message).toContain("If an account exists");
    });

    it("validates strong password criteria on reset", async () => {
      // Missing uppercase, special char, length
      const weak1 = await confirmPasswordReset("token-123", "short");
      expect(weak1.success).toBe(false);

      // Missing special character
      const weak2 = await confirmPasswordReset("token-123", "Password123");
      expect(weak2.success).toBe(false);

      // Valid strong password (8+ chars, upper, lower, number, special)
      const strong = await confirmPasswordReset("token-123", "StrongPass@2026!");
      expect(strong.success).toBe(true);
    });
  });

  // 4. Production Entry Corrections Lifecycle
  describe("Production Entry Correction Workflow (Section 46)", () => {
    it("handles full lifecycle: request -> approve -> recalculate wage -> audit log -> notify", () => {
      // 1. Submit an initial entry
      const { entry } = store.submitPieceEntry({
        worker_id: "MK001",
        piece_count: 200,
        production_date: "2026-09-10",
      });
      expect(entry.piece_count).toBe(200);

      // 2. Worker requests correction to 260 pieces
      const req = store.requestCorrection({
        production_entry_id: entry.id,
        requested_piece_count: 260,
        reason: "Bundle count adjustment after supervisor verification",
      });
      expect(req.status).toBe("PENDING");
      expect(req.requested_piece_count).toBe(260);

      // Verify admin notification generated
      const adminNotifs = store.getNotifications("ADMIN");
      expect(adminNotifs.some((n) => n.type === "CORRECTION_REQUESTED")).toBe(true);

      // 3. Admin approves correction
      const { request: approvedReq, updatedEntry } = store.approveCorrection(req.id, "Admin");
      expect(approvedReq.status).toBe("APPROVED");
      expect(updatedEntry.piece_count).toBe(260);
      expect(updatedEntry.status).toBe("ADJUSTED");

      // Verify worker notification generated
      const workerNotifs = store.getNotifications("WORKER", entry.worker_id);
      expect(workerNotifs.some((n) => n.type === "CORRECTION_APPROVED")).toBe(true);

      // 4. Verify audit log created
      const auditLogs = store.getAuditLogs();
      const correctionLog = auditLogs.find(
        (log) => log.action === "PRODUCTION_CORRECTED" && log.target_id === entry.id
      );
      expect(correctionLog).toBeDefined();
    });

    it("handles rejection of correction request with descriptive reason", () => {
      const { entry } = store.submitPieceEntry({
        worker_id: "MK002",
        piece_count: 150,
        production_date: "2026-09-11",
      });

      const req = store.requestCorrection({
        production_entry_id: entry.id,
        requested_piece_count: 500,
        reason: "Claimed extra pieces",
      });

      const rejected = store.rejectCorrection(req.id, "Admin", "Floor log does not confirm 500 pcs");
      expect(rejected.status).toBe("REJECTED");

      // Entry should remain unchanged at 150 pieces
      const currentEntry = store.getProductionEntries().find((e) => e.id === entry.id);
      expect(currentEntry?.piece_count).toBe(150);

      // Worker notified of decline
      const workerNotifs = store.getNotifications("WORKER", entry.worker_id);
      expect(workerNotifs.some((n) => n.type === "CORRECTION_REJECTED")).toBe(true);
    });
  });

  // 5. Duplicate Submission / Idempotency Guard
  describe("Submission Idempotency Guard (Section 47)", () => {
    it("blocks immediate duplicate submission within 3 seconds", () => {
      const submission = {
        worker_id: "MK003",
        piece_count: 120,
        production_date: "2026-09-12",
      };

      // First submit succeeds
      const { entry: first } = store.submitPieceEntry(submission);
      expect(first).toBeDefined();

      // Immediate second submit with same worker, piece count, and date is rejected as duplicate
      expect(() => {
        store.submitPieceEntry(submission);
      }).toThrow(/Duplicate submission prevented/);
    });
  });

  // 6. Global Search & Attention System
  describe("Global Search & Attention System (Section 55-56)", () => {
    it("finds workers, operations, and salaries across indices", () => {
      const workerResults = store.globalSearch("Kumar");
      expect(workerResults.length).toBeGreaterThan(0);
      expect(workerResults[0].category).toBe("WORKER");

      const opResults = store.globalSearch("Overlock");
      expect(opResults.length).toBeGreaterThan(0);
      expect(opResults[0].category).toBe("OPERATION");
    });

    it("generates structured attention alerts for active factory items", () => {
      const alerts = store.getAttentionAlerts();
      expect(Array.isArray(alerts)).toBe(true);
      // Alerts have required fields
      alerts.forEach((alert) => {
        expect(alert.id).toBeDefined();
        expect(alert.title).toBeDefined();
        expect(alert.count).toBeGreaterThanOrEqual(0);
        expect(["alert", "warning", "info"]).toContain(alert.severity);
      });
    });
  });

  // 7. Company Settings Management
  describe("Company Settings Management (Section 57)", () => {
    it("retrieves and updates global company profile and work week", () => {
      const current = store.getSettings();
      expect(current.company_name).toBe("MK APPREALS PRIVATE LIMITED");

      store.updateSettings(
        {
          company_name: "MK APPREALS TEXTILES LTD",
          gstin: "33AABCM1234F1Z9",
        },
        "Admin"
      );

      const updated = store.getSettings();
      expect(updated.company_name).toBe("MK APPREALS TEXTILES LTD");
      expect(updated.gstin).toBe("33AABCM1234F1Z9");

      // Verify audit log recorded
      const logs = store.getAuditLogs();
      const settingsLog = logs.find((l) => l.action === "SETTINGS_UPDATED");
      expect(settingsLog).toBeDefined();
    });
  });
});
