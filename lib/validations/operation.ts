import { z } from "zod";

export const OperationCreateSchema = z.object({
  name: z.string().min(2, "Operation name must be at least 2 characters").max(50),
  code: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric (e.g. OVL)"),
  description: z.string().max(255).optional(),
  current_rate: z.number().min(0, "Piece rate cannot be negative"),
});

export const RateUpdateSchema = z.object({
  operation_id: z.string().min(1, "Operation ID is required"),
  new_rate: z.number().min(0, "New piece rate cannot be negative"),
  reason: z.string().min(3, "Reason for rate update is required for audit trail").max(255),
});

export type OperationCreateInput = z.infer<typeof OperationCreateSchema>;
export type RateUpdateInput = z.infer<typeof RateUpdateSchema>;
