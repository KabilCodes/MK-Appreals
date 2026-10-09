# MK APPREALS — Development & Architecture Standards

## 1. Project Overview & Architecture
**MK APPREALS** is a specialized textile & garment production piece-tracking and weekly wage settlement platform.
- **Tech Stack**: Next.js 14/15 (App Router), TypeScript (Strict), Tailwind CSS, Lucide React, PostgreSQL (Supabase schema with Row Level Security).
- **Core Purpose**: Record daily garment piece completions across operations (Overlock, Flatlock, Singer, Ironing, Checking), preserve immutable rate snapshots, compute weekly earnings, provide an audited Admin wage review/payment workflow, and deliver high-performance 1-year historical reporting.

---

## 2. Directory Structure & Architecture
- `app/`: Next.js App Router routes segregated cleanly:
  - `app/admin/`: Admin desktop-first dashboard, workers, operations, production, weekly salary, reports, audit logs.
  - `app/worker/`: Worker mobile-first touch dashboard, piece submission, personal production logs, personal salary receipts.
  - `app/(auth)/`: Secure authentication portal.
- `components/`: UI components categorized into `ui/` (primitives), `admin/`, `worker/`, and `shared/`.
- `lib/`: Utilities, date mathematics, currency formatting, CSV generator, and Supabase client bindings.
- `services/`: Encapsulated domain logic (WorkerService, ProductionService, SalaryService, OperationService, AuditService).
- `types/`: Strict TypeScript interfaces and database schemas.
- `supabase/migrations/`: Pure PostgreSQL migrations (tables, constraints, triggers, RLS policies).

---

## 3. Coding & TypeScript Standards
- Strict TypeScript: No `any` type escapes. Use strict null checks and typed returns.
- Pure Functions for Calculations: Piece totals, currency rates, date intervals must be deterministic, pure, and tested.
- Error Handling: Use typed Result patterns or descriptive errors. Never crash or swallow errors silently.
- Do Not Overwrite / Break Existing Functionality: Always test and preserve working features.
- Never Put Hard-coded Secrets in Code: All keys belong in environment variables (`.env.local`). Never expose service-role keys.

---

## 4. UI / UX Standards
- **Palette**: Deep Industrial Slate (`#0F172A`), Crisp Textile White / Off-White (`#F8FAFC`), Professional Emerald / Teal Accent (`#0D9488` / `#059669`).
- **Worker Experience**: Mobile-first, minimum 48px touch targets, quick-add pills (`+50`, `+100`, `+250`), submission confirmation modal (`"Submit 250 pieces?"`), instant card updates.
- **Admin Experience**: Desktop-first, data-dense, 8 key metric stat cards, tabular breakdowns with search/filtering/pagination, confirmation dialogs for financial payouts, CSV export.
- **Micro-states**: Every button must show a loading spinner when processing. Every empty state must have descriptive human-readable text.

---

## 5. Security & Authorization Rules
- **Dual-Layer Authorization**: Enforced both in Next.js Server Actions / API routes and PostgreSQL Row Level Security (RLS).
- **Worker Data Isolation**: A worker can SELECT only their own profile, production entries, and salary records. Workers have zero access to admin dashboards, other workers' records, operation rate edits, or audit logs.
- **Admin Authorization**: Only authenticated users with `role = 'ADMIN'` can manage workers, edit rates, review/modify weekly salary, and mark payouts.
- **Zero Plaintext Passwords**: Password hashing via standard secure crypt/bcrypt.
- **Snapshot Immutability**: Production entries must store `rate_snapshot` and `calculated_earning`. Changing rates later must NEVER mutate past production records.
- **Paid Salary Protection**: Paid salaries cannot be modified without explicit administrative audit-logged action.

---

## 6. Database Rules
- Use PostgreSQL via Supabase.
- Table names: `profiles`, `workers`, `operations`, `rate_history`, `production_entries`, `weekly_salary`, `salary_adjustments`, `salary_payments`, `audit_logs`.
- Primary keys: UUIDs (`gen_random_uuid()`).
- Foreign keys with appropriate delete constraints (`ON DELETE CASCADE` or `ON DELETE RESTRICT`).
- Numeric precision: Always use `NUMERIC(10, 2)` for rates and currency.
- Strict Constraints: `CHECK (piece_count > 0)`, `CHECK (current_rate >= 0)`, `CHECK (status IN ('ACTIVE', 'INACTIVE'))`.
- Audit Everything: Worker creation, rate updates, salary approvals, and payouts must be recorded in `audit_logs`.

---

## 7. Testing & Verification Commands
- `npm run test` : Run unit and integration tests.
- `npm run typecheck` : Verify TypeScript types with `tsc --noEmit`.
- `npm run lint` : Lint codebase with Next.js ESLint.
- `npm run build` : Run Next.js production build verification.
