# System Architecture Specification — MK APPREALS

**Application Name**: MK APPREALS  
**Architecture Pattern**: Clean Layered Next.js App Router (Full-Stack TypeScript)  
**Database**: PostgreSQL via Supabase with Row Level Security (RLS)  

---

## 1. High-Level Architecture Overview

MK APPREALS follows a strict separation of concerns, decoupling UI presentation from business logic, database queries, and role-based authorization.

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT VIEW LAYER                    │
│   Worker Mobile Portal    │    Admin Desktop Console   │
│   (Touch-friendly UI)     │    (DataTables, Analytics) │
└───────────────────────────┬────────────────────────────┘
                            │ Server Actions / API Routes
                            ▼
┌────────────────────────────────────────────────────────┐
│                  SERVICE & DOMAIN LAYER                │
│  - WorkerService (piece validation & submission)       │
│  - SalaryService (weekly aggregation & review)         │
│  - OperationService (rate history & operations)        │
│  - AuditService (audit log event emitter)              │
│  - AuthService (session & role enforcement)            │
└───────────────────────────┬────────────────────────────┘
                            │ Zod Schema Validation & Queries
                            ▼
┌────────────────────────────────────────────────────────┐
│                 DATA ACCESS & RLS LAYER                │
│  - Supabase Server Client (Authenticated via JWT)      │
│  - PostgreSQL Row Level Security (RLS) Policies        │
│  - Immutable Snapshot Stamping (Rate & Names)          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
c:/Users/Kabil/OneDrive/Desktop/APPREALS/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           # Unified clean login (Admin & Worker)
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── layout.tsx             # Protected Admin Shell (Sidebar, TopBar)
│   │   ├── page.tsx               # Admin Analytics Dashboard
│   │   ├── workers/               # Worker CRUD & Detail view
│   │   ├── production/            # Live Production Feed & Filter
│   │   ├── operations/            # Operations & Rate Configuration
│   │   ├── salary/                # Weekly Salary Review & Payout
│   │   ├── salary/history/        # 1-Year Historical Salary & Monthly rollup
│   │   ├── reports/               # Production/Salary Reports & CSV export
│   │   └── audit/                 # System Audit Logs
│   ├── worker/
│   │   ├── layout.tsx             # Worker Mobile Shell (Header, Bottom Nav)
│   │   ├── page.tsx               # Worker Piece Entry & Live Today/Week Card
│   │   ├── history/               # Worker Personal Production History
│   │   ├── salary/                # Worker Weekly Salary Breakdown & Status
│   │   └── profile/               # Worker Profile Details & Logout
│   ├── api/                       # API handlers (e.g., CSV export, webhooks)
│   └── globals.css
├── components/
│   ├── ui/                        # Reusable atomic UI (button, card, dialog, table...)
│   ├── admin/                     # Admin-specific modules (SalaryModal, WorkerForm...)
│   ├── worker/                    # Worker-specific modules (PieceEntryForm, QuickPills...)
│   └── shared/                    # Brand header, Navbars, ConfirmDialog, EmptyState
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase SSR client
│   │   ├── admin.ts               # Privileged Server client for worker provisioning
│   │   └── mock-db.ts             # Seamless fallback engine for zero-config testing
│   ├── validations/
│   │   ├── worker.ts              # Zod schemas for worker creation & update
│   │   ├── piece.ts               # Zod schemas for piece submission
│   │   ├── salary.ts              # Zod schemas for salary review & adjustments
│   │   └── operation.ts           # Zod schemas for operation & rate changes
│   ├── utils/
│   │   ├── date.ts                # Weekly cycle calculation (Monday-Sunday boundaries)
│   │   ├── currency.ts            # Indian Rupee (INR ₹) formatting
│   │   └── export.ts              # CSV generator & download streaming
│   └── constants.ts               # Brand info, default limits, status enums
├── services/
│   ├── worker.service.ts
│   ├── production.service.ts
│   ├── salary.service.ts
│   ├── operation.service.ts
│   └── audit.service.ts
├── supabase/
│   ├── migrations/                # Pure SQL migrations for Supabase
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_seed_data.sql
├── types/
│   ├── database.types.ts          # Typed PostgreSQL tables & views
│   └── index.ts
└── docs/
```

---

## 3. Weekly Cycle & Date Math

Garment production wages in Tirupur/Surat/export hubs traditionally operate on a Monday through Sunday weekly cutoff:
1. `week_start`: Monday `00:00:00`
2. `week_end`: Sunday `23:59:59`
3. Each production record has a `production_date` (e.g. `2026-09-25`).
4. Weekly salary aggregation groups records matching:
   $$\text{production\_date} \ge \text{week\_start} \quad \text{AND} \quad \text{production\_date} \le \text{week\_end}$$
5. The week identifier is standardized as `YYYY-Www` (e.g. `2026-W39`) and human-readable `Sep 21, 2026 - Sep 27, 2026`.

---

## 4. Rate Snapshot Pattern

To satisfy **RULE 7** (*"Historical production must preserve the rate used at the time"*):
- Every `production_entries` record stores:
  - `piece_count`: INT
  - `rate_snapshot`: NUMERIC(10,2) — the active rate of that operation when submitted
  - `calculated_earning`: NUMERIC(10,2) = `piece_count * rate_snapshot`
  - `operation_id`: UUID/TEXT
  - `operation_name_snapshot`: TEXT — preserving the operation label even if renamed later.
- Whenever an Admin updates an operation rate:
  - A new row is inserted into `rate_history` with `effective_from = NOW()`.
  - The `operations.current_rate` is updated.
  - Previous `production_entries` are completely untouched.

---

## 5. Dual-Execution Resilience: Supabase + Zero-Config Mock/Local Storage

To ensure the application runs flawlessly both when connected to a live Supabase project and in automated test / offline evaluation environments:
- The data service layer queries Supabase when valid environment credentials (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are present.
- If credentials are dummy/placeholder or offline, the unified database service layer seamlessly falls back to an in-memory/persisted local storage mock database pre-seeded with sample workers (`MK001 Kumar`, `MK002 Ravi`, `MK003 Mani`, `MK004 Suresh`, `MK005 Arun`), active operations, and 6+ months of historical entries!
- This ensures 100% testability, instant build, and deterministic CI/CD while preserving strict Supabase SQL schemas and RLS files.
