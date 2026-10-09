-- ==============================================================================
-- MK APPREALS — Garment Piece-Tracking & Weekly Wage System
-- Database Schema Migration 001: Initial Schema
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE (Mirrors auth.users in Supabase or standalone auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'WORKER')),
    full_name TEXT NOT NULL,
    mobile TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. OPERATIONS TABLE (Garment manufacturing production operations)
CREATE TABLE IF NOT EXISTS public.operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    current_rate NUMERIC(10, 2) NOT NULL CHECK (current_rate >= 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WORKERS TABLE (Factory floor operators)
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    worker_id TEXT NOT NULL UNIQUE CHECK (worker_id ~ '^[A-Z0-9_-]+$'),
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE RESTRICT,
    custom_rate_override NUMERIC(10, 2) CHECK (custom_rate_override IS NULL OR custom_rate_override >= 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RATE HISTORY TABLE (Preserves all historical piece-rate changes)
CREATE TABLE IF NOT EXISTS public.rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
    rate NUMERIC(10, 2) NOT NULL CHECK (rate >= 0),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCTION ENTRIES TABLE (Daily completed garment pieces with immutable snapshot rates)
CREATE TABLE IF NOT EXISTS public.production_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
    worker_name_snapshot TEXT NOT NULL,
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE RESTRICT,
    operation_name_snapshot TEXT NOT NULL,
    piece_count INTEGER NOT NULL CHECK (piece_count > 0 AND piece_count <= 25000),
    rate_snapshot NUMERIC(10, 2) NOT NULL CHECK (rate_snapshot >= 0),
    calculated_earning NUMERIC(10, 2) NOT NULL,
    production_date DATE NOT NULL,
    submission_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'VERIFIED', 'ADJUSTED')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WEEKLY SALARY TABLE (Weekly wage settlements)
CREATE TABLE IF NOT EXISTS public.weekly_salary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
    week_id TEXT NOT NULL, -- e.g. "2026-W39"
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    total_pieces INTEGER NOT NULL DEFAULT 0 CHECK (total_pieces >= 0),
    calculated_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (calculated_amount >= 0),
    final_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (final_salary >= 0),
    total_adjustments NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID')),
    payment_date TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_worker_week UNIQUE (worker_id, week_id)
);

-- 7. SALARY ADJUSTMENTS TABLE (Bonuses, deductions, incentives per weekly salary)
CREATE TABLE IF NOT EXISTS public.salary_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_salary_id UUID NOT NULL REFERENCES public.weekly_salary(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('BONUS', 'DEDUCTION', 'INCENTIVE', 'CORRECTION')),
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SALARY PAYMENTS TABLE (Audit records of disbursements)
CREATE TABLE IF NOT EXISTS public.salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_salary_id UUID NOT NULL REFERENCES public.weekly_salary(id) ON DELETE RESTRICT,
    amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE')),
    reference_no TEXT,
    paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUDIT LOGS TABLE (Tamper-evident trail for forensic administrative oversight)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES for high-speed queries on 1-year+ data
CREATE INDEX IF NOT EXISTS idx_workers_worker_id ON public.workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_workers_operation_id ON public.workers(operation_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON public.workers(status);

CREATE INDEX IF NOT EXISTS idx_production_worker_date ON public.production_entries(worker_id, production_date DESC);
CREATE INDEX IF NOT EXISTS idx_production_operation_date ON public.production_entries(operation_id, production_date DESC);
CREATE INDEX IF NOT EXISTS idx_production_date ON public.production_entries(production_date DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_salary_worker_week ON public.weekly_salary(worker_id, week_id);
CREATE INDEX IF NOT EXISTS idx_weekly_salary_week_id ON public.weekly_salary(week_id);
CREATE INDEX IF NOT EXISTS idx_weekly_salary_status ON public.weekly_salary(status);
CREATE INDEX IF NOT EXISTS idx_weekly_salary_dates ON public.weekly_salary(week_start_date, week_end_date);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
