import { store } from "@/lib/db/store";
import { Operation, RateHistory } from "@/types";
import { OperationCreateInput, OperationCreateSchema, RateUpdateInput, RateUpdateSchema } from "@/lib/validations/operation";

export class OperationService {
  static getOperations(): Operation[] {
    return store.getOperations();
  }

  static getOperationById(id: string): Operation | undefined {
    return store.getOperationById(id);
  }

  static createOperation(input: OperationCreateInput): Operation {
    const validated = OperationCreateSchema.parse(input);
    return store.createOperation(validated);
  }

  static updateRate(input: RateUpdateInput): Operation {
    const validated = RateUpdateSchema.parse(input);
    return store.updateOperationRate(validated.operation_id, validated.new_rate, validated.reason);
  }

  static getRateHistory(operation_id?: string): RateHistory[] {
    return store.getRateHistory(operation_id);
  }
}
