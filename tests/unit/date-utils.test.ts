import { describe, it, expect } from "vitest";
import { getWeekBounds, formatDateISO, getISOWeekNumber, getLast12Months } from "@/lib/utils/date";

describe("Weekly Cycle & Date Boundary Calculations", () => {
  it("correctly identifies Monday-to-Sunday weekly boundaries for any weekday", () => {
    // 2026-09-25 is a Friday
    const friday = new Date(2026, 8, 25); // Note month is 0-indexed: 8 is September
    const bounds = getWeekBounds(friday);

    // Monday should be 2026-09-21
    expect(bounds.start_date).toBe("2026-09-21");
    // Sunday should be 2026-09-27
    expect(bounds.end_date).toBe("2026-09-27");
    expect(bounds.week_id).toMatch(/^2026-W\d{2}$/);
  });

  it("handles Sunday correctly as the last day of the work week", () => {
    // 2026-09-27 is Sunday
    const sunday = new Date(2026, 8, 27);
    const bounds = getWeekBounds(sunday);

    expect(bounds.start_date).toBe("2026-09-21");
    expect(bounds.end_date).toBe("2026-09-27");
  });

  it("handles Monday correctly as the first day of the work week", () => {
    // 2026-09-21 is Monday
    const monday = new Date(2026, 8, 21);
    const bounds = getWeekBounds(monday);

    expect(bounds.start_date).toBe("2026-09-21");
    expect(bounds.end_date).toBe("2026-09-27");
  });

  it("generates exactly 12 months for 1-year historical auditing", () => {
    const months = getLast12Months();
    expect(months.length).toBe(12);
    expect(months[0].month_id).toMatch(/^\d{4}-\d{2}$/);
  });
});
