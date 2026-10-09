# MK APPREALS — Garment Piece-Tracking & Weekly Wage System

A specialized, production-ready textile and garment production piece-tracking and weekly salary management platform built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, and PostgreSQL / Supabase with Row Level Security (RLS).

---

## 1. Product Purpose & Scope
In garment and knitwear manufacturing (such as in Tirupur, Surat, and garment export clusters), sewing and finishing operators are compensated on a piece-rate system. MK APPREALS replaces error-prone paper chits, disputed weekly piece tallies, and manual wage notebooks with a streamlined, audited digital workflow:

- **Factory Workers**: Fast, mobile-first piece submission (minimum 48px touch targets, quick-add pills `+50`, `+100`, `+250`, confirmation modal, zero rate-typing required).
- **Factory Supervisors / Admins**: Desktop-first management dashboard with 8 KPI cards, worker provisioning, operation piece-rate configuration with historical revision logs, weekly salary review with discretionary adjustments/deductions, payment timestamping, forensic audit trail, and 12-month historical reporting with CSV export.

---

## 2. Key Business Rules Enforced

1. **Snapshot Rate Immutability (RULE 7)**: Every piece submission stamps `rate_snapshot` and `calculated_earning = piece_count * rate_snapshot`. When an Admin modifies an operation rate later, past production entries are permanently preserved.
2. **Weekly Pay Cycle**: Production entries aggregate across standard Monday `00:00:00` to Sunday `23:59:59` work week boundaries.
3. **Lockdown of Paid Settlements (RULE 8)**: Once marked as `PAID`, a weekly salary record cannot be casually updated.
4. **Validation Guardrails**:
   - Zero, negative, and decimal piece submissions are strictly rejected.
   - Guard threshold (default 25,000 pieces) prevents accidental extra zeros.
5. **Worker Data Isolation (RULE 10)**: Under PostgreSQL Row Level Security (RLS), workers have access solely to their own records and cannot view other workers, admin logs, or modify rates/salaries.

---

## 3. Technology Stack

- **Framework**: Next.js 14.2 (App Router, Server Actions)
- **Language**: TypeScript (Strict mode enabled, zero `any` escapes)
- **Styling**: Tailwind CSS with industrial slate, textile white, and emerald/teal palette
- **Icons**: Lucide React
- **Validation**: Zod (Client-side & Server-side dual validation)
- **Database**: PostgreSQL / Supabase (Full SQL migrations, RLS policies, and triggers included)
- **Persistence Engine**: Dual-mode data repository (Supabase SSR client with seamless fallback to deterministic in-memory/persisted local store pre-seeded with sample workers and 6+ months of historical entries)
- **Testing**: Vitest unit & integration test suites

---

## 4. Default Production Operations

| Operation | Code | Sample Initial Rate | Description |
|---|---|---|---|
| **Overlock** | `OVL` | ₹2.00 / piece | Seam joining & edge overlock stitch |
| **Flatlock** | `FLT` | ₹2.50 / piece | Flat decorative seam & hem finishing |
| **Singer** | `SNG` | ₹3.00 / piece | Single needle precision lockstitch |
| **Ironing** | `IRN` | ₹1.50 / piece | Garment steam pressing and creasing |
| **Checking** | `CHK` | ₹1.00 / piece | Final quality inspection & thread trim |

*Note: All piece rates are configurable by Admin in the console. Operations can be added, updated, or deactivated at any time.*

---

## 5. Pre-Seeded Factory Demo Accounts

| Role | Identifier / Worker ID | Assigned Operation | Rate |
|---|---|---|---|
| **Admin** | `admin` | Factory Administrator | All Privileges |
| **Worker** | `MK001` (Kumar) | Overlock | ₹2.00 / pc |
| **Worker** | `MK002` (Ravi) | Flatlock | ₹2.50 / pc |
| **Worker** | `MK003` (Mani) | Singer | ₹3.00 / pc |
| **Worker** | `MK004` (Suresh) | Ironing | ₹1.50 / pc |
| **Worker** | `MK005` (Arun) | Checking | ₹1.00 / pc |

---

## 6. Directory Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         # Unified authentication portal
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── layout.tsx             # Responsive Admin shell with sidebar
│   │   ├── page.tsx               # 8 KPI Stat Cards & Floor Overview
│   │   ├── workers/               # Worker CRUD, Search, Filter, Add Modal
│   │   │   └── [id]/page.tsx      # Individual Worker Profile & Past Settlements
│   │   ├── production/            # Live Production Feed & Snapshot Filters
│   │   ├── operations/            # Operation & Rate Revision with Audit Reason
│   │   ├── salary/                # Weekly Salary Review, Adjustments, Payout
│   │   │   └── history/page.tsx   # 1-Year Historical Monthly Rollup & Weekly Drilldown
│   │   ├── reports/               # Production/Salary CSV Export Generator
│   │   └── audit/                 # System Forensic Audit Trail
│   ├── worker/
│   │   ├── layout.tsx             # Mobile-first Worker shell & bottom touch nav
│   │   ├── page.tsx               # Daily Piece Submission, Confirmation Modal, Summary
│   │   ├── history/               # Personal Production Logs
│   │   ├── salary/                # Weekly Wage Breakdown & Paid Receipt
│   │   └── profile/               # Worker Profile Details & Logout
│   ├── globals.css                # Industrial textile styling & touch targets
│   └── page.tsx                   # Fast role landing & quick-switcher portal
├── components/
│   └── ui/                        # Reusable primitives: Button, Card, StatCard, Badge, Modal, ConfirmDialog, Toast, EmptyState
├── lib/
│   ├── auth/session.ts            # Session management and role resolution
│   ├── db/
│   │   ├── store.ts               # Resilient in-memory data store with full CRUD
│   │   └── mock-data.ts           # Realistic 6-month seed data generator
│   ├── supabase/                  # Supabase SSR client & server bindings
│   ├── utils/                     # Date calculations (Monday-Sunday), INR currency, CSV exporter
│   └── validations/               # Zod schemas for piece, worker, salary, operations
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql # PostgreSQL schema & constraints
│       ├── 002_rls_policies.sql   # Row Level Security policies
│       └── 003_seed_data.sql      # Seed data migration script
└── tests/
    └── unit/                      # Vitest test suites (calculations, dates, validations)
```

---

## 7. Installation & Quickstart

### Prerequisites
- Node.js 18+ (tested on Node v25.9.0)
- npm 9+

### Setup Commands
```bash
# 1. Clone repository
git clone <repo-url>
cd APPREALS

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## 8. Verification & Testing Commands

```bash
# Run unit & integration test suites
npm run test

# Run TypeScript strict typecheck (tsc --noEmit)
npm run typecheck

# Run linter
npm run lint

# Run Next.js production build verification
npm run build
```

---

## 9. Supabase Database Deployment Instructions

To connect to a live Supabase PostgreSQL database:
1. Create a project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_seed_data.sql`
4. Copy your project URL and keys to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

---

## 10. License & Copyright
© 2026 MK APPREALS. All rights reserved.
