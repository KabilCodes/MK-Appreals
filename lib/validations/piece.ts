import { z } from "zod";

export const PieceSubmissionSchema = z.object({
  worker_id: z.string().min(1, "Worker ID is required"),
  piece_count: z
    .number({ invalid_type_error: "Piece count must be a number" })
    .int("Piece count must be a whole number (no decimals)")
    .min(1, "Must submit at least 1 piece")
    .max(25000, "Piece count exceeds maximum realistic threshold (25,000)"),
  production_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .optional(),
  notes: z.string().max(255).optional(),
});

export type PieceSubmissionInput = z.infer<typeof PieceSubmissionSchema>;
