# Testing & Verification Strategy — MK APPREALS

**Application Name**: MK APPREALS  
**Testing Frameworks**: Vitest / Jest, React Testing Library, TypeScript Type Checking  

---

## 1. Test Coverage Strategy

Testing covers both deterministic business logic units and end-to-end user workflows:

```
┌────────────────────────────────────────────────────────┐
│                   INTEGRATION TESTS                    │
│  - Weekly Salary Aggregation Flow                      │
│  - Piece Submission & Snapshot Rate Preservation       │
│  - Paid Salary Immutability Protection                 │
│  - Admin Worker Provisioning & Access                  │
└───────────────────────────┬────────────────────────────┘
                            │
┌────────────────────────────────────────────────────────┐
│                      UNIT TESTS                        │
│  - Date Range & Week Calculation (Monday-Sunday)       │
│  - Piece Validation (Zero, Negative, Decimal, Extreme) │
│  - Rate Calculation with Adjustments/Deductions        │
│  - Role Authorization Rules (Admin vs Worker)          │
│  - Audit Log Formatting                                │
└────────────────────────────────────────────────────────┘
```

---

## 2. Test Suites Specification

### 2.1. Calculation & Business Rules (`tests/unit/calculations.test.ts`)
- **T1.1**: Calculate earnings: $\text{pieces} \times \text{rate}$. Verify precise two-decimal rounding.
- **T1.2**: Rate snapshot preservation: Ensure changing current operation rate does not change computed earnings on existing historical records.
- **T1.3**: Weekly piece summation: Verify 6-day piece entries (e.g. 250, 300, 280, 320, 290, 310 = 1,750 pcs) aggregate correctly.
- **T1.4**: Salary adjustments: Final salary = calculated earning + bonus - deduction. Verify bounds.

### 2.2. Date & Weekly Window Helpers (`tests/unit/date-utils.test.ts`)
- **T2.1**: Given date `2026-09-25` (Friday), verify `getWeekBounds()` resolves:
  - `start_date`: Monday `2026-09-21`
  - `end_date`: Sunday `2026-09-27`
  - `week_id`: `2026-W39`
- **T2.2**: Cross-month weekly window spanning (e.g., Aug 31 to Sep 6) handled seamlessly.
- **T2.3**: Year-boundary ISO weeks (e.g., Dec 28 to Jan 3) resolved accurately.

### 2.3. Schema & Input Validation (`tests/unit/validation.test.ts`)
- **T3.1**: Piece count validation:
  - Positive integer `250` -> Valid.
  - Zero `0` -> Rejected.
  - Negative `-50` -> Rejected.
  - Decimal `25.5` -> Rejected.
  - Excessive `50000` -> Rejected (> 25,000 threshold).
- **T3.2**: Worker ID format: `MK001` -> Valid; `mk 001!` -> Rejected.
- **T3.3**: Rate validation: Non-negative numeric value.

### 2.4. Authorization & Security (`tests/unit/auth-security.test.ts`)
- **T4.1**: Worker cannot query other workers' records.
- **T4.2**: Worker cannot call salary review or mark paid server action.
- **T4.3**: Paid salary records reject modification requests without admin audit override.

---

## 3. Test Execution Commands

```bash
# Run unit & integration tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run TypeScript compiler check
npm run typecheck

# Run linter
npm run lint

# Run Next.js production build verification
npm run build
```
