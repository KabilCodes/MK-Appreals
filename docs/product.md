# Product Requirements Document (PRD) — MK APPREALS

**Application Name**: MK APPREALS  
**Product Category**: Textile/Garment Piece-Tracking & Weekly Salary Management System  
**Version**: 1.0.0 (Production)  
**Target Users**: Garment Manufacturing Admins & Production Floor Workers  

---

## 1. Executive Summary & Purpose
MK APPREALS is a dedicated piece-rate production tracking and weekly wage settlement platform designed specifically for garment manufacturing units. In textile manufacturing, sewing and finishing operators are compensated on a piece-rate system (piecework). 

Unlike bloated ERPs or generic HR platforms, MK APPREALS has zero clutter. It does not contain CRM, sales, procurement, or general accounting. Instead, it solves the core operational problem:
1. Enabling factory workers on the floor to log their daily completed piece counts in seconds on mobile devices.
2. Preserving immutable snapshot rates per operation for every production record.
3. Automatically aggregating weekly outputs and estimated earnings.
4. Providing plant supervisors and factory administrators with an audited weekly salary review workflow, manual adjustments/deductions, payment tracking, and 12+ months of historical auditing and CSV reporting.

---

## 2. Production Flow & Default Operations
The garment manufacturing line at MK APPREALS operates on sequential and parallel operations:
```
[ Cutting / Input ]
        │
        ▼
   [ Overlock ]
        │
        ▼
   [ Flatlock ]
        │
        ▼
    [ Singer ]
        │
        ▼
   [ Ironing ]
        │
        ▼
   [ Checking ]
        │
        ▼
   [ Finished ]
```

### Initial Default Operations & Configurable Rates:
- **Overlock**: Initial sample rate ₹2.00 / piece
- **Flatlock**: Initial sample rate ₹2.50 / piece
- **Singer**: Initial sample rate ₹3.00 / piece
- **Ironing**: Initial sample rate ₹1.50 / piece
- **Checking**: Initial sample rate ₹1.00 / piece

*Note: Operations are configurable by Admin. Admin can add, activate, deactivate operations and modify rates. Rate changes create an audit trail and rate history without altering past production records.*

---

## 3. User Personas & Roles

### 3.1. Admin Persona (Factory Owner / Production Supervisor)
- **Pain Points**: Manual paper tallying of pieces leads to wage disputes, lost chits, calculation errors, delayed weekly payouts, and inability to trace who approved rate changes.
- **Capabilities**:
  - Secure credential-based login.
  - Worker provisioning: Assign Worker ID (e.g., `MK001`), full name, mobile number, operation assignment, piece rate, and credentials.
  - Operation & Rate control with historical tracking.
  - Live production monitoring (Daily, Weekly, Monthly, Operation breakdown).
  - Weekly Salary Review & Payout: Review calculated amount = $\sum (\text{pieces} \times \text{snapshot rate})$, apply discretionary bonus/deduction adjustments with notes, approve Final Salary, and mark as Paid with timestamp.
  - 1-Year History & Analytics: Drill down into daily entries, weekly settlements, monthly payrolls, and worker profiles for 12+ months.
  - Export CSV reports for bank transfers or offline records.
  - Audit Trail inspection for compliance.

### 3.2. Worker Persona (Sewing Operator / Finisher)
- **Pain Points**: Non-tech-savvy workers need an ultra-simple, legible mobile interface that requires minimum tapping, zero typing of complex rates or dates, and instant transparency on their weekly earnings and salary payment status.
- **Capabilities**:
  - Simple, mobile-optimized login (Worker ID or Mobile + PIN / Password).
  - Clean home screen showing: Assigned Operation, Active Rate (₹/pc), Today's Pieces & Earnings, This Week's Total Pieces & Estimated Income, Latest Salary Payout Status.
  - One-tap Piece Count entry with confirmation dialog (`"Submit 250 pieces?" -> [Cancel] [Submit]`).
  - View individual daily logs, weekly piece summaries, and approved salary history.
  - Strict isolation: Workers cannot view other workers, change operations, modify rates, or edit past entries.

---

## 4. Key Business Rules & Constraints
1. **Immutable Snapshot Rates**: When a piece entry is recorded, the current rate of the operation is stamped into the record. Subsequent rate modifications never retroactively alter past production records.
2. **Weekly Pay Cycles**: Weekly calculation runs from Monday to Sunday (or Sunday to Saturday customizable). Each week aggregates pieces, snapshot earnings, adjustments, and final salary.
3. **No Worker Self-Registration**: Only Admins can register worker accounts.
4. **Validation Guardrails**:
   - Pieces must be positive integers ($> 0$). No negative values, decimals, or zero entries.
   - Max reasonable piece threshold (configurable, default 1,000 pieces/day per worker) to prevent accidental extra zeros (e.g. entering 25000 instead of 250).
   - Duplicate prevention: confirmation modal prevents double submission.
5. **Paid Salary Lockdown**: Once a weekly salary is marked as `PAID`, it cannot be casually updated. Any emergency correction requires Admin authorization and creates an audit entry.
6. **Data Retention**: Minimum 12 months of high-resolution daily production and wage history preserved without automated truncation.

---

## 5. Non-Functional Requirements
- **Performance**: Mobile worker page load time $< 800\text{ms}$; piece submission latency $< 300\text{ms}$.
- **Security**: Supabase PostgreSQL Row-Level Security (RLS) ensuring strict multi-tenant worker isolation at database layer; argon2/bcrypt credential hashing; JWT-based sessions.
- **Responsiveness**: Pixel-perfect usability across mobile viewports (360px, 390px, 414px) and desktop viewports (1024px, 1280px, 1440px+).
