-- ==============================================================================
-- MK APPREALS — Garment Piece-Tracking & Weekly Wage System
-- Database Schema Migration 002: Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. Helper function to fetch current authenticated user's role from profiles
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'ANONYMOUS');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Helper function to fetch current worker ID for auth.uid()
CREATE OR REPLACE FUNCTION public.get_auth_worker_id()
RETURNS UUID AS $$
DECLARE
    w_id UUID;
BEGIN
    SELECT id INTO w_id FROM public.workers WHERE profile_id = auth.uid();
    RETURN w_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- ENABLE RLS ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_salary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

CREATE POLICY "Workers can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- OPERATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "All authenticated users can view active operations"
    ON public.operations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage operations"
    ON public.operations FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

-- ------------------------------------------------------------------------------
-- WORKERS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can manage workers"
    ON public.workers FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

CREATE POLICY "Workers can view own worker record"
    ON public.workers FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

-- ------------------------------------------------------------------------------
-- RATE HISTORY POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can manage rate history"
    ON public.rate_history FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

CREATE POLICY "Workers can view rate history"
    ON public.rate_history FOR SELECT
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- PRODUCTION ENTRIES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can manage all production entries"
    ON public.production_entries FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

CREATE POLICY "Workers can view only their own production entries"
    ON public.production_entries FOR SELECT
    TO authenticated
    USING (worker_id = public.get_auth_worker_id());

CREATE POLICY "Workers can submit pieces for themselves"
    ON public.production_entries FOR INSERT
    TO authenticated
    WITH CHECK (
        worker_id = public.get_auth_worker_id()
        AND piece_count > 0
    );

-- Workers CANNOT update or delete production entries!
-- Only Admins have full access.

-- ------------------------------------------------------------------------------
-- WEEKLY SALARY POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can manage weekly salary"
    ON public.weekly_salary FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

CREATE POLICY "Workers can view only their own weekly salary"
    ON public.weekly_salary FOR SELECT
    TO authenticated
    USING (worker_id = public.get_auth_worker_id());

-- ------------------------------------------------------------------------------
-- SALARY ADJUSTMENTS & PAYMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can manage salary adjustments"
    ON public.salary_adjustments FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

CREATE POLICY "Workers can view their own salary adjustments"
    ON public.salary_adjustments FOR SELECT
    TO authenticated
    USING (
        weekly_salary_id IN (
            SELECT id FROM public.weekly_salary WHERE worker_id = public.get_auth_worker_id()
        )
    );

CREATE POLICY "Admins can manage salary payments"
    ON public.salary_payments FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

CREATE POLICY "Workers can view their own salary payments"
    ON public.salary_payments FOR SELECT
    TO authenticated
    USING (
        weekly_salary_id IN (
            SELECT id FROM public.weekly_salary WHERE worker_id = public.get_auth_worker_id()
        )
    );

-- ------------------------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.get_auth_role() = 'ADMIN');

CREATE POLICY "Authenticated users can insert audit logs via server action"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
