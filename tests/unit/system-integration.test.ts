import { describe, it, expect } from "vitest";
import { store } from "@/lib/db/store";

describe("MK APPREALS — End-to-End System Health Audit", () => {
  it("verifies primary admin existence and credentials", () => {
    const admins = store.getAdmins();
    expect(admins.length).toBeGreaterThanOrEqual(1);
    const primary = admins.find((a) => a.email === "mkarun@gmail.com");
    expect(primary).toBeDefined();
    expect(primary?.role).toBe("ADMIN");
    expect(primary?.status).toBe("ACTIVE");
    expect(primary?.password).toBe("arun1987");
  });

  it("verifies all 5 standard garment operations are present with valid rates", () => {
    const ops = store.getOperations();
    const expected = ["Overlock", "Flatlock", "Singer", "Ironing", "Checking"];
    for (const name of expected) {
      const found = ops.find((o) => o.name.toLowerCase() === name.toLowerCase());
      expect(found).toBeDefined();
      expect(found?.current_rate).toBeGreaterThan(0);
      expect(found?.status).toBe("ACTIVE");
    }
  });

  it("successfully enrolls a worker and formats sequential Worker ID", () => {
    const ops = store.getOperations();
    const worker = store.createWorker({
      worker_id: "MK991",
      full_name: "Kavitha R",
      mobile: "9876501234",
      operation_id: ops[0].id,
      status: "ACTIVE",
    });

    expect(worker.id).toBeDefined();
    expect(worker.worker_id).toBe("MK991");
    expect(worker.full_name).toBe("Kavitha R");
  });

  it("preserves immutable rate snapshots when operations rates update", () => {
    const ops = store.getOperations();
    const op = ops[0];
    const initialRate = op.current_rate;

    const worker = store.createWorker({
      worker_id: "MK992",
      full_name: "Selvam P",
      mobile: "9876543210",
      operation_id: op.id,
      status: "ACTIVE",
    });

    // 1. Submit production with current rate
    const { entry } = store.submitPieceEntry({
      worker_id: worker.id,
      piece_count: 500,
      production_date: new Date().toISOString().slice(0, 10),
    });

    expect(entry.rate_snapshot).toBe(initialRate);
    expect(entry.calculated_earning).toBe(500 * initialRate);

    // 2. Modify operation rate
    const updatedRate = initialRate + 1.5;
    store.updateOperationRate(op.id, updatedRate, "Factory-wide revision");

    // 3. Verify entry still retains old snapshot
    const fetched = store.getProductionEntries({ worker_id: worker.id });
    const match = fetched.find((e) => e.id === entry.id);
    expect(match?.rate_snapshot).toBe(initialRate);
    expect(match?.calculated_earning).toBe(500 * initialRate);
  });

  it("handles piece correction requests and reflects supervisor approvals", () => {
    const ops = store.getOperations();
    const worker = store.createWorker({
      worker_id: "MK993",
      full_name: "Deepa N",
      mobile: "9789012345",
      operation_id: ops[1].id,
      status: "ACTIVE",
    });

    const { entry } = store.submitPieceEntry({
      worker_id: worker.id,
      piece_count: 200,
      production_date: new Date().toISOString().slice(0, 10),
    });

    // Request correction
    const req = store.requestCorrection({
      production_entry_id: entry.id,
      requested_piece_count: 250,
      reason: "Additional bundle approved by line supervisor",
    });

    expect(req.status).toBe("PENDING");

    // Approve correction
    store.approveCorrection(req.id, "Admin");
    const updatedReq = store.getCorrectionRequests().find((r) => r.id === req.id);
    expect(updatedReq?.status).toBe("APPROVED");

    const updatedEntry = store.getProductionEntries({ worker_id: worker.id }).find((e) => e.id === entry.id);
    expect(updatedEntry?.piece_count).toBe(250);
  });

  it("reviews weekly salary and finalizes payment disbursement", () => {
    const ops = store.getOperations();
    const worker = store.createWorker({
      worker_id: "MK994",
      full_name: "Prakash T",
      mobile: "9842112233",
      operation_id: ops[2].id,
      status: "ACTIVE",
    });

    store.submitPieceEntry({
      worker_id: worker.id,
      piece_count: 600,
      production_date: new Date().toISOString().slice(0, 10),
    });

    const salaries = store.getWeeklySalaries(undefined, worker.id);
    expect(salaries.length).toBeGreaterThanOrEqual(1);
    const ws = salaries[0];

    // Admin reviews and adds bonus
    store.reviewWeeklySalary(ws.id, {
      final_salary: ws.calculated_amount + 150,
      adjustment_amount: 150,
      notes: "High speed sewing bonus",
    });

    const reviewed = store.getWeeklySalaries(undefined, worker.id)[0];
    expect(reviewed.final_salary).toBe(ws.calculated_amount + 150);

    // Disburse payout
    store.markSalaryPaid(ws.id, {
      payment_method: "UPI",
      reference_no: "UPI-TXN-12345",
      notes: "Instant settlement via factory UPI",
    });

    const paid = store.getWeeklySalaries(undefined, worker.id)[0];
    expect(paid.status).toBe("PAID");
    expect(paid.payment_date).toBeDefined();
  });

  it("strictly enforces Last-Admin protection guard against lockout", () => {
    const admins = store.getAdmins();
    const otherAdmins = admins.slice(1);
    
    // Deactivate or remove other admins to leave only 1 active admin
    for (const other of otherAdmins) {
      if (other.status === "ACTIVE") {
        store.deactivateAdmin(other.id, "Admin", "Test teardown");
      }
    }

    const remainingActive = store.getAdmins().filter((a) => a.status === "ACTIVE");
    expect(remainingActive.length).toBe(1);

    // Now attempting to deactivate or remove the last active admin must throw
    expect(() => {
      store.removeAdmin(remainingActive[0].id, "Admin", "Accidental deletion attempt");
    }).toThrow(/Cannot remove the last active Administrator account/);

    expect(() => {
      store.deactivateAdmin(remainingActive[0].id, "Admin", "Accidental deactivation attempt");
    }).toThrow(/Cannot deactivate the last active Administrator account/);
  });
});
