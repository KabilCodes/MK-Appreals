import { store } from "@/lib/db/store";
import { AuditLog } from "@/types";

export class AuditService {
  static getLogs(limit: number = 50): AuditLog[] {
    return store.getAuditLogs(limit);
  }

  static log(
    action: string,
    target_entity: string,
    target_id: string,
    actor_name: string = "Admin",
    actor_role: string = "ADMIN",
    old_values?: Record<string, unknown> | null,
    new_values?: Record<string, unknown> | null
  ) {
    store.addAuditLog({
      actor_name,
      actor_role,
      action,
      target_entity,
      target_id,
      old_values,
      new_values,
    });
  }
}
