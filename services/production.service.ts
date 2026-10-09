import { store } from "@/lib/db/store";
import { ProductionEntry, WeeklySalary } from "@/types";
import { PieceSubmissionInput, PieceSubmissionSchema } from "@/lib/validations/piece";

export class ProductionService {
  static submitPieces(input: PieceSubmissionInput): {
    entry: ProductionEntry;
    updatedSalary: WeeklySalary;
  } {
    const validated = PieceSubmissionSchema.parse(input);
    return store.submitPieceEntry({
      worker_id: validated.worker_id,
      piece_count: validated.piece_count,
      production_date: validated.production_date,
      notes: validated.notes,
    });
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
