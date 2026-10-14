// ==============================================================================
// MK APPREALS — Core TypeScript Type Definitions
// ==============================================================================

export type UserRole = 'ADMIN' | 'WORKER';

export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export type ProductionStatus = 'SUBMITTED' | 'VERIFIED' | 'ADJUSTED';

export type SalaryStatus = 'PENDING' | 'APPROVED' | 'PAID';

export type AdjustmentType = 'BONUS' | 'DEDUCTION' | 'INCENTIVE' | 'CORRECTION';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  mobile: string;
  created_at: string;
  updated_at?: string;
}

export interface Operation {
  id: string;
  name: string;
  code: string;
  description?: string;
  current_rate: number;
  status: EntityStatus;
  created_at: string;
  updated_at?: string;
}

export interface RateHistory {
  id: string;
  operation_id: string;
  operation_name?: string;
  rate: number;
  effective_from: string;
  effective_to?: string | null;
  changed_by?: string;
  changed_by_name?: string;
  reason?: string;
  created_at: string;
}

export interface Worker {
  id: string;
  profile_id?: string;
  worker_id: string; // Worker alphanumeric code
  full_name: string;
  mobile: string;
  email?: string;
  password?: string;
  operation_id: string;
  operation_name?: string;
  custom_rate_override?: number | null;
  status: EntityStatus;
  created_at: string;
  updated_at?: string;
}

export interface WorkerWithStats extends Worker {
  current_rate: number;
  this_week_pieces: number;
  this_week_earnings: number;
  today_pieces: number;
  today_earnings: number;
  salary_status: SalaryStatus;
}

export interface ProductionEntry {
  id: string;
  worker_id: string;
  worker_name_snapshot: string;
  operation_id: string;
  operation_name_snapshot: string;
  piece_count: number;
  rate_snapshot: number;
  calculated_earning: number;
  production_date: string; // YYYY-MM-DD
  submission_timestamp: string;
  status: ProductionStatus;
  created_by?: string;
  notes?: string;
}

export interface SalaryAdjustment {
  id: string;
  weekly_salary_id: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  created_by?: string;
  created_at: string;
}

export interface SalaryPayment {
  id: string;
  weekly_salary_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_no?: string;
  paid_by?: string;
  created_at: string;
}

export interface WeeklySalary {
  id: string;
  worker_id: string;
  worker_id_code?: string; // Alphanumeric code
  worker_name?: string;
  operation_name?: string;
  current_rate?: number;
  week_id: string; // e.g. "2026-W39"
  week_start_date: string; // YYYY-MM-DD
  week_end_date: string; // YYYY-MM-DD
  total_pieces: number;
  calculated_amount: number;
  final_salary: number;
  total_adjustments: number;
  status: SalaryStatus;
  payment_date?: string | null;
  reviewed_by?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  adjustments?: SalaryAdjustment[];
  payments?: SalaryPayment[];
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_entity: string;
  target_id?: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  timestamp: string;
}

export interface WeekRange {
  week_id: string; // "2026-W39"
  start_date: string; // "2026-09-21"
  end_date: string; // "2026-09-27"
  label: string; // "Sep 21, 2026 – Sep 27, 2026"
  is_current: boolean;
}

export interface MonthlySalarySummary {
  month: string; // "2026-09"
  month_name: string; // "September 2026"
  total_pieces: number;
  total_calculated: number;
  total_final_salary: number;
  total_paid: number;
  total_pending: number;
  worker_count: number;
}

export interface DashboardMetrics {
  total_workers: number;
  active_workers: number;
  today_pieces: number;
  this_week_pieces: number;
  pending_salaries_count: number;
  paid_salaries_count: number;
  weekly_payroll_amount: number;
  monthly_payroll_amount: number;
  operation_breakdown: {
    operation_id: string;
    operation_name: string;
    today_pieces: number;
    week_pieces: number;
    worker_count: number;
    current_rate: number;
  }[];
  weekly_trend: {
    day_name: string; // "Mon", "Tue", etc.
    date: string;
    pieces: number;
  }[];
}

export interface AuthSession {
  user: {
    id: string;
    role: UserRole;
    name: string;
    email?: string;
    worker_id?: string; // Alphanumeric code if WORKER
    worker_db_id?: string;
    operation_id?: string;
    operation_name?: string;
    current_rate?: number;
  };
  token: string;
  rememberMe?: boolean;
}

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CorrectionRequest {
  id: string;
  production_entry_id: string;
  worker_id: string;
  worker_name: string;
  operation_name: string;
  production_date: string;
  original_piece_count: number;
  requested_piece_count: number;
  rate_snapshot: number;
  reason: string;
  status: CorrectionStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface AdminAccount {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  last_login?: string;
  password?: string;
}

export type NotificationType =
  | 'SALARY_UPDATED'
  | 'SALARY_PAID'
  | 'CORRECTION_REQUESTED'
  | 'CORRECTION_APPROVED'
  | 'CORRECTION_REJECTED'
  | 'ATTENTION_ALERT'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  recipient_role?: UserRole;
  recipient_id?: string; // worker_id or admin email
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export interface CompanySettings {
  company_name: string;
  unit_code: string;
  address: string;
  gstin: string;
  work_week_start: string;
  work_week_end: string;
  auto_week_close: boolean;
  require_strong_passwords: boolean;
  session_timeout_hours: number;
}

export interface AttentionAlert {
  id: string;
  type: 'UNSUBMITTED_WORKERS' | 'PENDING_SALARY' | 'PENDING_CORRECTIONS' | 'INACTIVE_WORKERS';
  count: number;
  title: string;
  description: string;
  href: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'WORKER' | 'OPERATION' | 'SALARY' | 'PRODUCTION';
  href: string;
}

