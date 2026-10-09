import { AuthSession, UserRole } from "@/types";
import { store } from "@/lib/db/store";

const passwordResetTokens = new Map<string, { email: string; expires: number }>();

export async function loginUser(credentials: {
  usernameOrId: string;
  password?: string;
  rememberMe?: boolean;
}): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const query = credentials.usernameOrId.trim();

  // 1. Check for Admin Login (by username or email in database)
  const admins = store.getAdmins();
  const matchedAdmin = admins.find(
    (a) =>
      a.email.toLowerCase() === query.toLowerCase() ||
      (query.toLowerCase() === "admin" && a.status === "ACTIVE")
  );

  if (matchedAdmin) {
    if (matchedAdmin.status !== "ACTIVE") {
      return {
        success: false,
        error: "This administrator account has been deactivated. Contact the primary administrator.",
      };
    }

    if (matchedAdmin.password && credentials.password?.trim() !== matchedAdmin.password) {
      return {
        success: false,
        error: "Invalid administrator password. Please check your credentials.",
      };
    }

    matchedAdmin.last_login = new Date().toISOString();

    const adminSession: AuthSession = {
      user: {
        id: matchedAdmin.id,
        role: "ADMIN",
        name: matchedAdmin.full_name,
        email: matchedAdmin.email,
      },
      token: `admin-token-${matchedAdmin.id}-${Date.now()}`,
      rememberMe: credentials.rememberMe ?? false,
    };
    return { success: true, session: adminSession };
  }

  // 2. Check for Worker Login (by Worker Email, Worker ID e.g. MK001, or mobile number)
  const workers = store.getWorkers();
  const worker = workers.find(
    (w) =>
      (w.email && w.email.toLowerCase() === query.toLowerCase()) ||
      w.worker_id.toUpperCase() === query.toUpperCase() ||
      w.mobile === query ||
      w.full_name.toLowerCase() === query.toLowerCase()
  );

  if (!worker) {
    return {
      success: false,
      error: "Invalid Worker ID, Email, or Mobile Number. Please check your credentials.",
    };
  }

  if (worker.status !== "ACTIVE") {
    return {
      success: false,
      error: "Worker account is currently INACTIVE. Please contact Admin.",
    };
  }

  if (worker.password && credentials.password?.trim() !== worker.password) {
    return {
      success: false,
      error: "Invalid worker password. Please check your credentials.",
    };
  }

  const op = store.getOperationById(worker.operation_id);
  const effectiveRate = worker.custom_rate_override ?? op?.current_rate ?? 0;

  const workerSession: AuthSession = {
    user: {
      id: worker.profile_id || worker.id,
      worker_db_id: worker.id,
      role: "WORKER",
      name: worker.full_name,
      email: worker.email,
      worker_id: worker.worker_id,
      operation_id: worker.operation_id,
      operation_name: worker.operation_name || op?.name || "Unassigned",
      current_rate: effectiveRate,
    },
    token: `worker-token-${worker.worker_id}-${Date.now()}`,
    rememberMe: credentials.rememberMe ?? false,
  };

  return { success: true, session: workerSession };
}

/**
 * Section 44: Secure Google Sign-In with Database Role Resolution
 * IMPORTANT: Google authentication must NOT automatically make someone an Admin.
 * Role is strictly derived from pre-authorized database profiles.
 * Unauthorized accounts are strictly denied.
 */
export async function loginWithGoogle(googleProfile: {
  email: string;
  name: string;
}): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const email = googleProfile.email.trim().toLowerCase();

  // 1. Check if email belongs to an authorized Admin
  const admins = store.getAdmins();
  const matchedAdmin = admins.find((a) => a.email.toLowerCase() === email);
  if (matchedAdmin) {
    if (matchedAdmin.status !== "ACTIVE") {
      return {
        success: false,
        error: "Your administrator account has been deactivated.",
      };
    }
    return {
      success: true,
      session: {
        user: {
          id: matchedAdmin.id,
          role: "ADMIN",
          name: matchedAdmin.full_name,
          email: matchedAdmin.email,
        },
        token: `google-admin-token-${Date.now()}`,
      },
    };
  }

  // 2. Check if email/identity matches a pre-authorized Worker
  const workers = store.getWorkers();
  const matchedWorker = workers.find(
    (w) =>
      (w.email && w.email.toLowerCase() === email) ||
      w.full_name.toLowerCase() === googleProfile.name.toLowerCase()
  );
  if (matchedWorker) {
    if (matchedWorker.status !== "ACTIVE") {
      return {
        success: false,
        error: "Worker account is currently INACTIVE. Contact Admin.",
      };
    }
    const op = store.getOperationById(matchedWorker.operation_id);
    return {
      success: true,
      session: {
        user: {
          id: matchedWorker.id,
          worker_db_id: matchedWorker.id,
          role: "WORKER",
          name: matchedWorker.full_name,
          email: matchedWorker.email || email,
          worker_id: matchedWorker.worker_id,
          operation_id: matchedWorker.operation_id,
          operation_name: matchedWorker.operation_name || op?.name || "Unassigned",
          current_rate: matchedWorker.custom_rate_override ?? op?.current_rate ?? 0,
        },
        token: `google-worker-token-${Date.now()}`,
      },
    };
  }

  // 3. Unauthorized Google Account: STRICTLY DENIED (Section 44)
  return {
    success: false,
    error: "Your account does not have access to MK APPREALS. Only pre-authorized company accounts are granted access.",
  };
}

/**
 * Section 44: Forgot Password Request
 * Returns generic response to prevent email enumeration.
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const token = `reset-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  // Store token for 1 hour
  passwordResetTokens.set(token, {
    email: email.trim().toLowerCase(),
    expires: Date.now() + 3600000,
  });

  return {
    success: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };
}

/**
 * Section 44: Password Reset Confirmation
 * Validates password complexity: at least 8 chars, uppercase, lowercase, number, special char.
 */
export async function confirmPasswordReset(
  tokenOrPassword: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  const password = newPassword !== undefined ? newPassword : tokenOrPassword;

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { success: false, error: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { success: false, error: "Password must contain at least one lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { success: false, error: "Password must contain at least one number." };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { success: false, error: "Password must contain at least one special character." };
  }

  return { success: true };
}
