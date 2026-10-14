import { store } from "@/lib/db/store";
import { ProductionEntry, WeeklySalary } from "@/types";
import { PieceSubmissionInput, PieceSubmissionSchema } from "@/lib/validations/piece";
import { SupabaseDbService } from "./supabase-db.service";

export class ProductionService {
  static submitPieces(input: PieceSubmissionInput): {
    entry: ProductionEntry;
    updatedSalary: WeeklySalary;
  } {
    const validated = PieceSubmissionSchema.parse(input);
    const result = store.submitPieceEntry({
      worker_id: validated.worker_id,
      piece_count: validated.piece_count,
      production_date: validated.production_date,
      notes: validated.notes,
    });

    // Asynchronously synchronize with Supabase if configured
    if (typeof window !== "undefined") {
      SupabaseDbService.insertProductionEntry(result.entry).catch(() => {});
      SupabaseDbService.upsertWeeklySalary(result.updatedSalary).catch(() => {});
    }

    return result;
  }

  static getEntries(filters?: {
    worker_id?: string;
    operation_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): ProductionEntry[] {
    return store.getProductionEntries(filters);
  }
}
