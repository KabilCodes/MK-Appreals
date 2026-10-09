# UI & UX Design System Specification — MK APPREALS

**Application Name**: MK APPREALS  
**Brand Concept**: Premium, Industrial, Minimalist Textile Manufacturing  
**Target Viewports**: 360px (Ultra-compact Mobile) up to 1920px+ (Ultra-wide Desktop)

---

## 1. Visual Identity & Brand Concept
MK APPREALS reflects modern garment craftsmanship: robust, functional, industrial, yet elegant. It eschews generic gradient-heavy templates in favor of crisp typography, tactile cards, subtle micro-interactions, high contrast for factory floor visibility, and generous tap targets.

### 1.1. Color Palette
- **Primary / Canvas Navy**:
  - Deep Industrial Slate: `#0F172A` (Tailwind `slate-900`)
  - Charcoal Surface: `#1E293B` (Tailwind `slate-800`)
  - Subdued Borders: `#334155` (Tailwind `slate-700`)
- **Textile Neutral / Paper Background**:
  - Crisp Workstation White: `#FFFFFF`
  - Subtle Textile Off-White / Cream: `#F8FAFC` (Tailwind `slate-50`)
  - Soft Card Grey: `#F1F5F9` (Tailwind `slate-100`)
  - Subtle Border: `#E2E8F0` (Tailwind `slate-200`)
- **Accent & Status**:
  - Primary Brand Accent: Deep Teal / Emerald `#0D9488` / `#059669` (evoking fabric precision & financial growth)
  - Success Badge: `#10B981` (Paid, Active, Completed)
  - Warning Badge: `#F59E0B` (Pending Review, Inactive)
  - Danger / Alert: `#EF4444` (Exceeded Limits, Deactivated, Cancel)
  - Informational / Operation: `#3B82F6` (Operation chips, metrics)

### 1.2. Typography
- **Primary Font**: `Inter`, system UI fallback (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`).
- **Monospace Font**: `JetBrains Mono` or `ui-monospace` for Worker IDs (`MK001`), currency amounts (`₹3,500`), and numeric piece counters (`250`).
- **Hierarchy**:
  - Metric Values: 28px - 36px, `font-bold tracking-tight`
  - Section Headers: 18px - 20px, `font-semibold text-slate-900`
  - Labels & Body: 14px, `font-medium text-slate-600`
  - Footnotes & Timestamps: 12px, `font-normal text-slate-400`

---

## 2. Worker Mobile Interface (Mobile-First)

### 2.1. Key Principles
- **No Confusion**: A worker on the factory floor might have calloused or greasy hands or limited smartphone proficiency. Interface controls must be large (minimum 48px touch targets), with high contrast and explicit textual feedback.
- **Top Header**:
  - Brand Logo: "MK APPREALS" with compact badge "OPERATOR PORTAL"
  - Worker Name: e.g. "Kumar" (Worker ID: `MK001`)
  - Active Operation Tag: e.g. `[ OVERLOCK ]` with rate chip `₹2.00 / pc`
- **Main Action Card: Today's Piece Entry**:
  - Big numeric stepper or numeric keypad input (`type="number"` with `inputmode="numeric"`).
  - Clear label: **"ENTER TODAY'S COMPLETED PIECES"**.
  - Default quick-add buttons: `+50`, `+100`, `+250` for swift entry.
  - Primary button: Large full-width **"SUBMIT PIECES"** (`bg-emerald-600 active:scale-95`).
- **Confirmation Modal**:
  - "Submit 250 pieces?"
  - Subtitle: "Operation: Overlock @ ₹2.00 = ₹500 today"
  - Actions: `[Cancel]` and `[Confirm & Submit]`.
- **Summary Metrics Grid**:
  - Card 1: **Today**: Pieces + Daily Earning (e.g., `250 pcs` / `₹500.00`)
  - Card 2: **This Week**: Total Pieces + Est. Income (e.g., `1,750 pcs` / `₹3,500.00`)
  - Card 3: **Salary Status**: Badge `PAID` or `WAITING FOR ADMIN` + Date
- **Bottom Navigation Bar**:
  - `[Home]` (Quick Piece Entry & Summary)
  - `[My History]` (Daily logged pieces for this week & previous weeks)
  - `[My Salary]` (Weekly settlements, payment dates, receipts)
  - `[Profile]` (Worker ID, assigned operation, logout)

---

## 3. Admin Desktop & Tablet Interface (Desktop-First)

### 3.1. Layout Structure
- **Persistent Left Navigation (Collapsible on tablet/mobile)**:
  - Header: Logo `MK APPREALS` with textile icon
  - Menu Items:
    1. Dashboard (`/admin`)
    2. Workers Management (`/admin/workers`)
    3. Production Feed (`/admin/production`)
    4. Operations & Rates (`/admin/operations`)
    5. Weekly Salary Review (`/admin/salary`)
    6. Salary History (`/admin/salary/history`)
    7. Analytics & Reports (`/admin/reports`)
    8. Audit Logs (`/admin/audit`)
    9. Settings (`/admin/settings`)
  - Bottom: Admin user avatar, email, and Logout action.
- **Top Bar**:
  - Breadcrumbs & Current Page Title.
  - Active Pay Week Selector (e.g. `Sep 21, 2026 - Sep 27, 2026`).
  - Search trigger (`Ctrl+K` or search bar).
  - Quick Action button: `+ Add Worker` or `+ Log Entry`.

### 3.2. Admin Dashboard Layout
1. **Metric Cards (8 Cards)**:
   - Total Workers | Active Workers
   - Today's Pieces | This Week's Pieces
   - Pending Salaries | Paid Salaries
   - Weekly Payroll | Monthly Payroll
2. **Operation Breakdown Cards**:
   - For Overlock, Flatlock, Singer, Ironing, Checking:
     - Active Workers Count
     - Today's Pieces
     - Week's Cumulative Pieces
     - Piece rate currently active
3. **Weekly Trend Visualizer**:
   - Clean, lightweight SVG / CSS Bar Chart showing daily pieces Mon–Sun.
4. **Recent Production Submissions**:
   - Live stream of recent pieces submitted with timestamps, worker names, operation tags, and snapshot earnings.

---

## 4. Design System Component Library

| Component | Specification |
|---|---|
| `Button` | Variants: `default` (deep slate), `primary` (emerald-600), `outline`, `ghost`, `danger`. Includes loading spinner state and auto-disable. |
| `StatCard` | Title, large value, icon, subtext/badge with percentage or comparison. |
| `DataTable` | Striped/bordered, sortable headers, pagination, empty state, row action menu. |
| `Modal / Dialog` | Accessible modal overlay with backdrop blur, focus trapping, ESC key close. |
| `Badge` | Pill badges for `PAID` (green), `PENDING` (amber), `ACTIVE` (emerald), `INACTIVE` (slate). |
| `ConfirmDialog` | Reusable modal for destructive or financial actions (e.g., Mark as Paid). |
| `Toast` | Notifications for success, error, and rate changes using sonner or react-hot-toast. |
| `Skeleton` | Shimmer placeholder states for loading cards and table rows. |
| `EmptyState` | Helpful graphic illustration + clear contextual copy (e.g. "No pieces logged today yet"). |
