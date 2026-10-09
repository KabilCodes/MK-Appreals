-- ==============================================================================
-- MK APPREALS — Garment Piece-Tracking & Weekly Wage System
-- Database Schema Migration 003: Default Factory Operations & Baseline Rates
-- ==============================================================================

-- 1. Insert Standard Factory Operations
INSERT INTO public.operations (id, name, code, description, current_rate, status)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Overlock', 'OVL', 'Edge stitching and seam joining operation', 2.00, 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222222', 'Flatlock', 'FLT', 'Flat decorative and durable seam operation', 2.50, 'ACTIVE'),
    ('33333333-3333-3333-3333-333333333333', 'Singer', 'SNG', 'Single needle lockstitch precision sewing', 3.00, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444444', 'Ironing', 'IRN', 'Garment steam pressing and crease shaping', 1.50, 'ACTIVE'),
    ('55555555-5555-5555-5555-555555555555', 'Checking', 'CHK', 'Final garment quality inspection and trim trimming', 1.00, 'ACTIVE')
ON CONFLICT (name) DO UPDATE SET
    current_rate = EXCLUDED.current_rate,
    description = EXCLUDED.description;

-- 2. Baseline Rate History Snapshots
INSERT INTO public.rate_history (operation_id, rate, effective_from, changed_by, reason)
VALUES
    ('11111111-1111-1111-1111-111111111111', 2.00, NOW(), 'SYSTEM', 'Factory baseline piece rate'),
    ('22222222-2222-2222-2222-222222222222', 2.50, NOW(), 'SYSTEM', 'Factory baseline piece rate'),
    ('33333333-3333-3333-3333-333333333333', 3.00, NOW(), 'SYSTEM', 'Factory baseline piece rate'),
    ('44444444-4444-4444-4444-444444444444', 1.50, NOW(), 'SYSTEM', 'Factory baseline piece rate'),
    ('55555555-5555-5555-5555-555555555555', 1.00, NOW(), 'SYSTEM', 'Factory baseline piece rate');

-- 3. Initial System Audit Record
INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action, target_entity, target_id, old_values, new_values)
VALUES
    ('SYSTEM', 'System Administrator', 'SYSTEM', 'SYSTEM_INITIALIZED', 'SYSTEM', 'ROOT', NULL, '{"operations_initialized": 5, "workers_seeded": 0}');
