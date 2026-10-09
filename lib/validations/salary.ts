import { z } from "zod";

export const SalaryReviewSchema = z.object({
  weekly_salary_id: z.string().min(1, "Weekly salary ID is required"),
  final_salary: z.number().min(0, "Final salary cannot be negative"),
  adjustment_amount: z.number().default(0),
  adjustment_type: z.enum(["BONUS", "DEDUCTION", "INCENTIVE", "CORRECTION"]).default("BONUS"),
  adjustment_reason: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
});

export const SalaryPaymentSchema = z.object({
  weekly_salary_id: z.string().min(1, "Weekly salary ID is required"),
  payment_method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]).default("CASH"),
  reference_no: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type SalaryReviewInput = z.infer<typeof SalaryReviewSchema>;
export type SalaryPaymentInput = z.infer<typeof SalaryPaymentSchema>;
