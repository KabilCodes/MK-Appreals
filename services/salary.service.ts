import { store } from "@/lib/db/store";
import { WeeklySalary, MonthlySalarySummary } from "@/types";
import { SalaryReviewInput, SalaryReviewSchema, SalaryPaymentInput, SalaryPaymentSchema } from "@/lib/validations/salary";

export class SalaryService {
  static getWeeklySalaries(week_id?: string, worker_id?: string): WeeklySalary[] {
    return store.getWeeklySalaries(week_id, worker_id);
  }

  static getWeeklySalaryById(id: string): WeeklySalary | undefined {
    return store.getWeeklySalaryById(id);
  }

  static reviewSalary(input: SalaryReviewInput): WeeklySalary {
    const validated = SalaryReviewSchema.parse(input);
    return store.reviewWeeklySalary(validated.weekly_salary_id, {
      final_salary: validated.final_salary,
      adjustment_amount: validated.adjustment_amount,
      notes: validated.notes,
    });
  }

  static markAsPaid(input: SalaryPaymentInput): WeeklySalary {
    const validated = SalaryPaymentSchema.parse(input);
    return store.markSalaryPaid(validated.weekly_salary_id, {
      payment_method: validated.payment_method,
      reference_no: validated.reference_no,
      notes: validated.notes,
    });
  }

  static get1YearHistory(worker_id?: string): MonthlySalarySummary[] {
    return store.get1YearSalaryHistory(worker_id);
  }
}
