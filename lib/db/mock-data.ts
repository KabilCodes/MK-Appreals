import { Operation, Worker, ProductionEntry, WeeklySalary, AuditLog } from "@/types";
import { getWeekBounds, formatDateISO } from "../utils/date";

export const INITIAL_OPERATIONS: Operation[] = [
  {
    id: "op-overlock",
    name: "Overlock",
    code: "OVL",
    description: "Seam joining & edge overlock stitch",
    current_rate: 2.00,
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "op-flatlock",
    name: "Flatlock",
    code: "FLT",
    description: "Flat decorative seam & hem finishing",
    current_rate: 2.50,
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "op-singer",
    name: "Singer",
    code: "SNG",
    description: "Precision single needle lockstitch",
    current_rate: 3.00,
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "op-ironing",
    name: "Ironing",
    code: "IRN",
    description: "Steam pressing, shaping & creasing",
    current_rate: 1.50,
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "op-checking",
    name: "Checking",
    code: "CHK",
    description: "Final quality check & trimming",
    current_rate: 1.00,
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
  },
];

export const INITIAL_WORKERS: Worker[] = [
  {
    id: "w-kumar",
    worker_id: "MK001",
    full_name: "Kumar",
    mobile: "9876543201",
    email: "kumar@mkappreals.com",
    password: "worker123",
    operation_id: "op-overlock",
    operation_name: "Overlock",
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "w-ravi",
    worker_id: "MK002",
    full_name: "Ravi",
    mobile: "9876543202",
    email: "ravi@mkappreals.com",
    password: "worker123",
    operation_id: "op-flatlock",
    operation_name: "Flatlock",
    status: "ACTIVE",
    created_at: "2026-01-05T00:00:00Z",
  },
  {
    id: "w-mani",
    worker_id: "MK003",
    full_name: "Mani",
    mobile: "9876543203",
    email: "mani@mkappreals.com",
    password: "worker123",
    operation_id: "op-singer",
    operation_name: "Singer",
    status: "ACTIVE",
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "w-suresh",
    worker_id: "MK004",
    full_name: "Suresh",
    mobile: "9876543204",
    email: "suresh@mkappreals.com",
    password: "worker123",
    operation_id: "op-ironing",
    operation_name: "Ironing",
    status: "ACTIVE",
    created_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "w-arun",
    worker_id: "MK005",
    full_name: "Arun",
    mobile: "9876543205",
    email: "arun@mkappreals.com",
    password: "worker123",
    operation_id: "op-checking",
    operation_name: "Checking",
    status: "ACTIVE",
    created_at: "2026-01-20T00:00:00Z",
  },
];

/**
 * Generate historical seed data:
 * - 6 days of production entries for the current week (matching the user's prompt example: Kumar with 250, 300, 280, 320, 290, 310 = 1750 pieces)
 * - Past weeks settled and marked as PAID
 */
export function generateSeedData(): {
  production_entries: ProductionEntry[];
  weekly_salaries: WeeklySalary[];
  audit_logs: AuditLog[];
} {
  const entries: ProductionEntry[] = [];
  const weekly_salaries: WeeklySalary[] = [];
  const audit_logs: AuditLog[] = [];

  const today = new Date();
  const currentWeek = getWeekBounds(today);

  // 1. Current Week entries for Kumar (MK001) matching prompt specifications:
  // Mon: 250, Tue: 300, Wed: 280, Thu: 320, Fri: 290, Sat: 310 -> Total 1750
  const kumarMon = new Date(currentWeek.start_date);
  const piecesSequence = [250, 300, 280, 320, 290, 310];
  
  piecesSequence.forEach((pcs, idx) => {
    const entryDate = new Date(kumarMon);
    entryDate.setDate(kumarMon.getDate() + idx);
    const dateStr = formatDateISO(entryDate);

    // Only create entries up to today's date
    if (entryDate <= today) {
      entries.push({
        id: `pe-kumar-curr-${idx}`,
        worker_id: "w-kumar",
        worker_name_snapshot: "Kumar",
        operation_id: "op-overlock",
        operation_name_snapshot: "Overlock",
        piece_count: pcs,
        rate_snapshot: 2.00,
        calculated_earning: pcs * 2.00,
        production_date: dateStr,
        submission_timestamp: `${dateStr}T17:30:00Z`,
        status: "SUBMITTED",
      });
    }
  });

  // Current Week entries for other workers
  const otherWorkers = [
    { id: "w-ravi", name: "Ravi", opId: "op-flatlock", opName: "Flatlock", rate: 2.50, basePcs: 220 },
    { id: "w-mani", name: "Mani", opId: "op-singer", opName: "Singer", rate: 3.00, basePcs: 180 },
    { id: "w-suresh", name: "Suresh", opId: "op-ironing", opName: "Ironing", rate: 1.50, basePcs: 450 },
    { id: "w-arun", name: "Arun", opId: "op-checking", opName: "Checking", rate: 1.00, basePcs: 600 },
  ];

  otherWorkers.forEach((w) => {
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const entryDate = new Date(kumarMon);
      entryDate.setDate(kumarMon.getDate() + dayOffset);
      if (entryDate <= today) {
        const dateStr = formatDateISO(entryDate);
        const pcs = w.basePcs + (dayOffset * 10) - (dayOffset % 2 === 0 ? 5 : 0);
        entries.push({
          id: `pe-${w.id}-curr-${dayOffset}`,
          worker_id: w.id,
          worker_name_snapshot: w.name,
          operation_id: w.opId,
          operation_name_snapshot: w.opName,
          piece_count: pcs,
          rate_snapshot: w.rate,
          calculated_earning: Math.round(pcs * w.rate * 100) / 100,
          production_date: dateStr,
          submission_timestamp: `${dateStr}T17:45:00Z`,
          status: "SUBMITTED",
        });
      }
    }
  });

  // Current Week Salary Records (Pending Review)
  // Kumar's current week calculation
  const kumarCurrentEntries = entries.filter((e) => e.worker_id === "w-kumar");
  const kumarTotalPcs = kumarCurrentEntries.reduce((sum, e) => sum + e.piece_count, 0);
  const kumarEarning = kumarCurrentEntries.reduce((sum, e) => sum + e.calculated_earning, 0);

  weekly_salaries.push({
    id: `ws-kumar-${currentWeek.week_id}`,
    worker_id: "w-kumar",
    worker_id_code: "MK001",
    worker_name: "Kumar",
    operation_name: "Overlock",
    current_rate: 2.00,
    week_id: currentWeek.week_id,
    week_start_date: currentWeek.start_date,
    week_end_date: currentWeek.end_date,
    total_pieces: kumarTotalPcs || 1750,
    calculated_amount: kumarEarning || 3500,
    final_salary: kumarEarning || 3500,
    total_adjustments: 0,
    status: "PENDING",
    created_at: new Date().toISOString(),
  });

  otherWorkers.forEach((w) => {
    const wEntries = entries.filter((e) => e.worker_id === w.id);
    const totalPcs = wEntries.reduce((sum, e) => sum + e.piece_count, 0);
    const earning = wEntries.reduce((sum, e) => sum + e.calculated_earning, 0);

    weekly_salaries.push({
      id: `ws-${w.id}-${currentWeek.week_id}`,
      worker_id: w.id,
      worker_id_code: INITIAL_WORKERS.find((x) => x.id === w.id)?.worker_id || "MK000",
      worker_name: w.name,
      operation_name: w.opName,
      current_rate: w.rate,
      week_id: currentWeek.week_id,
      week_start_date: currentWeek.start_date,
      week_end_date: currentWeek.end_date,
      total_pieces: totalPcs,
      calculated_amount: earning,
      final_salary: earning,
      total_adjustments: 0,
      status: "PENDING",
      created_at: new Date().toISOString(),
    });
  });

  // 2. Generate 12 Past Weeks (Settled & Marked as PAID) for 1-Year History
  for (let w = 1; w <= 12; w++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - w * 7);
    const pastBounds = getWeekBounds(pastDate);

    // Kumar past weeks
    const pastPieces = 1600 + (w * 35) % 300;
    const pastCalculated = pastPieces * 2.00;
    const paymentDate = new Date(pastBounds.end_date);
    paymentDate.setHours(16, 0, 0, 0);

    weekly_salaries.push({
      id: `ws-kumar-${pastBounds.week_id}`,
      worker_id: "w-kumar",
      worker_id_code: "MK001",
      worker_name: "Kumar",
      operation_name: "Overlock",
      current_rate: 2.00,
      week_id: pastBounds.week_id,
      week_start_date: pastBounds.start_date,
      week_end_date: pastBounds.end_date,
      total_pieces: pastPieces,
      calculated_amount: pastCalculated,
      final_salary: pastCalculated,
      total_adjustments: 0,
      status: "PAID",
      payment_date: paymentDate.toISOString(),
      reviewed_by: "Admin",
      notes: "Weekly settlement disbursed",
      created_at: pastBounds.end_date,
    });

    // Seed production entries for past weeks (sample daily entries)
    for (let day = 0; day < 6; day++) {
      const d = new Date(pastBounds.start_date);
      d.setDate(d.getDate() + day);
      const dayPcs = Math.floor(pastPieces / 6);
      entries.push({
        id: `pe-kumar-past-${w}-${day}`,
        worker_id: "w-kumar",
        worker_name_snapshot: "Kumar",
        operation_id: "op-overlock",
        operation_name_snapshot: "Overlock",
        piece_count: dayPcs,
        rate_snapshot: 2.00,
        calculated_earning: dayPcs * 2.00,
        production_date: formatDateISO(d),
        submission_timestamp: `${formatDateISO(d)}T17:00:00Z`,
        status: "VERIFIED",
      });
    }

    // Past weeks for other workers
    otherWorkers.forEach((wObj, idx) => {
      const pcs = (wObj.basePcs * 5) + ((w + idx) * 20);
      const amt = Math.round(pcs * wObj.rate * 100) / 100;
      weekly_salaries.push({
        id: `ws-${wObj.id}-${pastBounds.week_id}`,
        worker_id: wObj.id,
        worker_id_code: INITIAL_WORKERS.find((x) => x.id === wObj.id)?.worker_id || "MK000",
        worker_name: wObj.name,
        operation_name: wObj.opName,
        current_rate: wObj.rate,
        week_id: pastBounds.week_id,
        week_start_date: pastBounds.start_date,
        week_end_date: pastBounds.end_date,
        total_pieces: pcs,
        calculated_amount: amt,
        final_salary: amt,
        total_adjustments: 0,
        status: "PAID",
        payment_date: paymentDate.toISOString(),
        reviewed_by: "Admin",
        created_at: pastBounds.end_date,
      });
    });
  }

  // 3. Seed Initial Audit Logs
  audit_logs.push(
    {
      id: "al-1",
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "SYSTEM_INITIALIZED",
      target_entity: "SYSTEM",
      target_id: "CONFIG",
      old_values: null,
      new_values: { operations: 5, default_workers: 5 },
      timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "al-2",
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "WORKER_CREATED",
      target_entity: "WORKER",
      target_id: "MK001",
      old_values: null,
      new_values: { worker_id: "MK001", name: "Kumar", operation: "Overlock", rate: 2.00 },
      timestamp: new Date(Date.now() - 28 * 86400000).toISOString(),
    },
    {
      id: "al-3",
      actor_name: "Admin",
      actor_role: "ADMIN",
      action: "SALARY_PAID",
      target_entity: "WEEKLY_SALARY",
      target_id: "ws-kumar-last-week",
      old_values: { status: "PENDING" },
      new_values: { status: "PAID", amount: 3500 },
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
    }
  );

  return {
    production_entries: entries,
    weekly_salaries,
    audit_logs,
  };
}
