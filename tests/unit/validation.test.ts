import { describe, it, expect } from "vitest";
import { PieceSubmissionSchema } from "@/lib/validations/piece";
import { WorkerCreateSchema } from "@/lib/validations/worker";
import { SalaryReviewSchema } from "@/lib/validations/salary";

describe("Input Validation & Business Guardrails (Zod)", () => {
  describe("Piece Submission Validation", () => {
    it("accepts valid piece counts", () => {
      const valid = PieceSubmissionSchema.safeParse({
        worker_id: "MK001",
        piece_count: 250,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects zero pieces", () => {
      const result = PieceSubmissionSchema.safeParse({
        worker_id: "MK001",
        piece_count: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative piece counts", () => {
      const result = PieceSubmissionSchema.safeParse({
        worker_id: "MK001",
        piece_count: -10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects decimal/fractional piece counts", () => {
      const result = PieceSubmissionSchema.safeParse({
        worker_id: "MK001",
        piece_count: 25.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects unrealistic piece counts (> 25,000 threshold)", () => {
      const result = PieceSubmissionSchema.safeParse({
        worker_id: "MK001",
        piece_count: 35000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Worker Creation Validation", () => {
    it("validates uppercase alphanumeric Worker IDs", () => {
      const valid = WorkerCreateSchema.safeParse({
        worker_id: "MK006",
        full_name: "Selvam",
        mobile: "9876543206",
        operation_id: "op-overlock",
        password: "pass",
      });
      expect(valid.success).toBe(true);

      const invalidId = WorkerCreateSchema.safeParse({
        worker_id: "mk 006!",
        full_name: "Selvam",
        mobile: "9876543206",
        operation_id: "op-overlock",
        password: "pass",
      });
      expect(invalidId.success).toBe(false);
    });

    it("rejects short or invalid mobile numbers", () => {
      const invalidMobile = WorkerCreateSchema.safeParse({
        worker_id: "MK006",
        full_name: "Selvam",
        mobile: "123", // Too short
        operation_id: "op-overlock",
        password: "pass",
      });
      expect(invalidMobile.success).toBe(false);
    });
  });

  describe("Salary Review Validation", () => {
    it("rejects negative final salary", () => {
      const invalidSalary = SalaryReviewSchema.safeParse({
        weekly_salary_id: "ws-123",
        final_salary: -500,
      });
      expect(invalidSalary.success).toBe(false);
    });
  });
});
