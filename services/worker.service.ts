import { store } from "@/lib/db/store";
import { Worker, WorkerWithStats } from "@/types";
import { WorkerCreateInput, WorkerCreateSchema, WorkerUpdateInput, WorkerUpdateSchema } from "@/lib/validations/worker";

export class WorkerService {
  static getWorkers(): Worker[] {
    return store.getWorkers();
  }

  static getWorkersWithStats(week_id?: string): WorkerWithStats[] {
    return store.getWorkersWithStats(week_id);
  }

  static getWorkerById(id: string): Worker | undefined {
    return store.getWorkerById(id);
  }

  static createWorker(input: WorkerCreateInput): Worker {
    const validated = WorkerCreateSchema.parse(input);
    return store.createWorker({
      worker_id: validated.worker_id,
      full_name: validated.full_name,
      mobile: validated.mobile,
      operation_id: validated.operation_id,
      custom_rate_override: validated.custom_rate_override,
      status: validated.status,
    });
  }

  static updateWorker(input: WorkerUpdateInput): Worker {
    const validated = WorkerUpdateSchema.parse(input);
    return store.updateWorker(validated.id, {
      full_name: validated.full_name,
      mobile: validated.mobile,
      operation_id: validated.operation_id,
      custom_rate_override: validated.custom_rate_override,
      status: validated.status,
    });
  }

  static toggleStatus(id: string): Worker {
    const worker = store.getWorkerById(id);
    if (!worker) throw new Error("Worker not found");
    const nextStatus = worker.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    return store.updateWorker(worker.id, { status: nextStatus });
  }
}
