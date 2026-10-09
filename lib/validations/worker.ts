import { z } from "zod";

export const WorkerCreateSchema = z.object({
  worker_id: z
    .string()
    .min(2, "Worker ID must be at least 2 characters")
    .max(20, "Worker ID cannot exceed 20 characters")
    .regex(/^[A-Z0-9_-]+$/, "Worker ID must contain only uppercase letters, digits, dashes or underscores (e.g. MK001)"),
  full_name: z
    .string()
    .min(2, "Worker name must be at least 2 characters")
    .max(100, "Worker name is too long"),
  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number cannot exceed 15 digits")
    .regex(/^[0-9+\s-]+$/, "Invalid mobile number format"),
  operation_id: z
    .string()
    .min(1, "Please assign an operation"),
  custom_rate_override: z
    .number()
    .min(0, "Rate cannot be negative")
    .optional()
    .nullable(),
  password: z
    .string()
    .min(4, "Worker login password/PIN must be at least 4 characters")
    .max(50),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const WorkerUpdateSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().min(2).max(100).optional(),
  mobile: z.string().min(10).max(15).optional(),
  operation_id: z.string().min(1).optional(),
  custom_rate_override: z.number().min(0).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  new_password: z.string().min(4).max(50).optional(),
});

export type WorkerCreateInput = z.infer<typeof WorkerCreateSchema>;
export type WorkerUpdateInput = z.infer<typeof WorkerUpdateSchema>;
