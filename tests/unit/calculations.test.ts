import { describe, it, expect, beforeEach } from "vitest";
import { calculateEarnings } from "@/lib/utils/currency";
import { store } from "@/lib/db/store";

describe("Garment Piece Rate & Earnings Calculation", () => {
  it("accurately calculates piece earnings with precise 2-decimal rounding", () => {
    // 250 pieces @ ₹2.00 = ₹500.00
    expect(calculateEarnings(250, 2.0)).toBe(500.0);

    // 1750 pieces @ ₹2.00 = ₹3500.00
    expect(calculateEarnings(1750, 2.0)).toBe(3500.0);

    // 185 pieces @ ₹2.50 = ₹462.50
    expect(calculateEarnings(185, 2.5)).toBe(462.5);

    // 333 pieces @ ₹1.33 = ₹442.89
    expect(calculateEarnings(333, 1.33)).toBe(442.89);

    // Zero or negative pieces returns 0
    expect(calculateEarnings(0, 2.0)).toBe(0);
    expect(calculateEarnings(-50, 2.0)).toBe(0);
    expect(calculateEarnings(100, -2.0)).toBe(0);
  });

  it("RULE 7: Preserves rate snapshot on production entries when operation rate changes", () => {
    // 1. Submit piece entry for Kumar @ current Overlock rate (₹2.00)
    const { entry: entry1 } = store.submitPieceEntry({
      worker_id: "MK001",
      piece_count: 250,
      production_date: "2026-09-01",
    });

    expect(entry1.rate_snapshot).toBe(2.0);
    expect(entry1.calculated_earning).toBe(500.0);

    // 2. Admin updates Overlock piece rate from ₹2.00 to ₹2.75
    store.updateOperationRate("op-overlock", 2.75, "Cost of living increase");

    // 3. Verify the previous entry still has snapshot rate = 2.00 and earning = 500.00!
    const savedEntry = store.getProductionEntries().find((e) => e.id === entry1.id);
    expect(savedEntry).toBeDefined();
    expect(savedEntry?.rate_snapshot).toBe(2.0);
    expect(savedEntry?.calculated_earning).toBe(500.0);

    // 4. Verify a new submission takes the NEW rate (₹2.75)
    const { entry: entry2 } = store.submitPieceEntry({
      worker_id: "MK001",
      piece_count: 100,
      production_date: "2026-09-02",
    });

    expect(entry2.rate_snapshot).toBe(2.75);
    expect(entry2.calculated_earning).toBe(275.0);

    // Restore rate for clean state
    store.updateOperationRate("op-overlock", 2.0, "Reset baseline test");
  });

  it("aggregates 6-day production entries into exact weekly totals (prompt scenario)", () => {
    // Mon: 250, Tue: 300, Wed: 280, Thu: 320, Fri: 290, Sat: 310 -> Total 1750 pcs @ ₹2.00 = ₹3,500
    const sequence = [250, 300, 280, 320, 290, 310];
    const totalPcs = sequence.reduce((a, b) => a + b, 0);
    expect(totalPcs).toBe(1750);

    const earning = calculateEarnings(totalPcs, 2.0);
    expect(earning).toBe(3500.0);
  });

  it("RULE 8: Paid salary records prevent regular modifications", () => {
    // Find or create a salary record
    const salaries = store.getWeeklySalaries();
    const target = salaries[0];

    // Mark as paid
    store.markSalaryPaid(target.id, { payment_method: "CASH" });

    // Attempting to review/modify a paid salary throws error
    expect(() => {
      store.reviewWeeklySalary(target.id, { final_salary: 4000 });
    }).toThrow(/already been marked as PAID/);
  });
});
