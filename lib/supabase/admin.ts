import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClientInstance: SupabaseClient | null = null;

/**
 * Returns a privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Strictly used in server environments (API routes, server actions).
 * Never expose this client or its key to frontend code or client bundles.
 */
export function getAdminClient(): SupabaseClient | null {
  if (adminClientInstance) return adminClientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  // Publishable/anon keys (e.g. sb_publ...) cannot execute auth.admin operations
  if (serviceRoleKey.startsWith("sb_publ")) {
    console.warn(
      "[SupabaseAdmin] SUPABASE_SERVICE_ROLE_KEY appears to be a publishable key rather than a secret service_role key. auth.admin operations will be skipped."
    );
    return null;
  }

  try {
    adminClientInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return adminClientInstance;
  } catch (err) {
    console.warn("[SupabaseAdmin] Failed to initialize admin client:", err);
    return null;
  }
}

export interface ProvisionWorkerParams {
  worker_id: string;
  full_name: string;
  mobile: string;
  email?: string;
  password?: string;
  operation_id: string;
  custom_rate_override?: number | null;
  status: "ACTIVE" | "INACTIVE";
  existingWorkerId?: string;
  profile_id?: string;
}

export interface ProvisionWorkerResult {
  success: boolean;
  auth_user_id?: string;
  warning?: string;
  error?: string;
  fallbackLocally?: boolean;
}

/**
 * Creates or updates a worker's Supabase Auth account and links it to profiles & workers tables.
 */
export async function provisionWorkerAuth(
  params: ProvisionWorkerParams
): Promise<ProvisionWorkerResult> {
  const admin = getAdminClient();

  if (!admin) {
    return {
      success: false,
      fallbackLocally: true,
      warning:
        "Supabase service-role key is not configured or invalid. The worker will be saved in the local database.",
    };
  }

  try {
    let authUserId = params.profile_id;
    const emailTrim = params.email?.trim().toLowerCase();

    // 1. Manage Supabase Auth user if an email is provided
    if (emailTrim) {
      // Check if user already exists in auth.users
      const { data: usersData, error: listErr } = await admin.auth.admin.listUsers();
      if (listErr) {
        console.warn("[SupabaseAdmin] listUsers warning:", listErr.message);
      }

      const existingUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === emailTrim
      );

      if (existingUser) {
        authUserId = existingUser.id;

        // If a password was entered by the administrator, update it
        if (params.password && params.password.trim().length > 0) {
          const { error: updateErr } = await admin.auth.admin.updateUserById(
            existingUser.id,
            {
              password: params.password.trim(),
              email_confirm: true,
              user_metadata: {
                role: "WORKER",
                full_name: params.full_name.trim(),
                mobile: params.mobile.trim(),
                worker_id: params.worker_id.trim().toUpperCase(),
              },
            }
          );
          if (updateErr) {
            console.warn("[SupabaseAdmin] updateUserById error:", updateErr.message);
          }
        } else {
          // Password unchanged: update metadata only
          await admin.auth.admin.updateUserById(existingUser.id, {
            user_metadata: {
              role: "WORKER",
              full_name: params.full_name.trim(),
              mobile: params.mobile.trim(),
              worker_id: params.worker_id.trim().toUpperCase(),
            },
          });
        }
      } else {
        // Create new Supabase Auth user
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email: emailTrim,
          password: params.password?.trim() || "Worker@123",
          email_confirm: true,
          user_metadata: {
            role: "WORKER",
            full_name: params.full_name.trim(),
            mobile: params.mobile.trim(),
            worker_id: params.worker_id.trim().toUpperCase(),
          },
        });

        if (createErr) {
          console.warn("[SupabaseAdmin] createUser error:", createErr.message);
        } else if (newUser?.user) {
          authUserId = newUser.user.id;
        }
      }
    }

    // 2. Upsert into public.profiles if auth user exists
    if (authUserId) {
      try {
        await admin.from("profiles").upsert({
          id: authUserId,
          role: "WORKER",
          full_name: params.full_name.trim(),
          mobile: params.mobile.trim(),
          updated_at: new Date().toISOString(),
        });
      } catch (profErr) {
        console.warn("[SupabaseAdmin] profiles upsert warning:", profErr);
      }
    }

    // 3. Upsert into public.workers to establish profile_id foreign link
    try {
      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let targetOpId = params.operation_id;
      if (!isUUID(targetOpId)) {
        const { data: opData } = await admin
          .from("operations")
          .select("id")
          .ilike("name", params.operation_id)
          .maybeSingle();
        if (opData?.id && isUUID(opData.id)) {
          targetOpId = opData.id;
        }
      }

      const workerPayload: Record<string, unknown> = {
        worker_id: params.worker_id.trim().toUpperCase(),
        full_name: params.full_name.trim(),
        mobile: params.mobile.trim(),
        operation_id: targetOpId,
        custom_rate_override: params.custom_rate_override ?? null,
        status: params.status,
        updated_at: new Date().toISOString(),
      };

      if (authUserId && isUUID(authUserId)) {
        workerPayload.profile_id = authUserId;
      }

      // Check if worker already exists by id or worker_id
      const query = admin.from("workers").select("id");
      if (params.existingWorkerId && isUUID(params.existingWorkerId)) {
        query.eq("id", params.existingWorkerId);
      } else {
        query.eq("worker_id", params.worker_id.trim().toUpperCase());
      }

      const { data: existingRow } = await query.maybeSingle();

      if (existingRow?.id) {
        await admin.from("workers").update(workerPayload).eq("id", existingRow.id);
      } else {
        if (params.existingWorkerId && isUUID(params.existingWorkerId)) {
          workerPayload.id = params.existingWorkerId;
        }
        await admin.from("workers").insert(workerPayload);
      }
    } catch (dbErr) {
      console.warn("[SupabaseAdmin] workers db sync warning:", dbErr);
    }

    return {
      success: true,
      auth_user_id: authUserId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error in provisionWorkerAuth";
    console.warn("[SupabaseAdmin] provisionWorkerAuth fallback:", message);
    return {
      success: false,
      fallbackLocally: true,
      error: message,
    };
  }
}
