# Security & Row Level Security (RLS) Specification — MK APPREALS

**Application Name**: MK APPREALS  
**Security Model**: Defense-in-depth (DB Row Level Security + Server Actions Guard + Input Validation)  

---

## 1. Security Architecture Principles

1. **Dual-Layer Authorization**:
   - **Layer 1 (Database Engine)**: PostgreSQL Row Level Security (RLS) active on all tables. Even if an API endpoint were misconfigured, the database denies unauthorized reads/writes based on the authenticated session's `auth.uid()`.
   - **Layer 2 (Application / Server Actions)**: Next.js middleware and server-side function guards verify user roles (`ADMIN` vs `WORKER`) before querying data or executing state changes.
2. **Zero Client Trust**:
   - Workers cannot specify piece rates, operation IDs, or dates. The server resolves the worker identity from the authenticated session, looks up their assigned operation and currently active rate, and stamps immutable values.
3. **Immutability of Paid Settlements**:
   - Once a weekly salary record reaches `PAID` status, regular update queries are blocked. Only an authorized administrator via an explicit audit-logged correction action can adjust it.
4. **Secret Isolation**:
   - `SUPABASE_SERVICE_ROLE_KEY` and DB credentials are never present in client bundles or public environment variables. Client bundles only receive `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 2. PostgreSQL Row Level Security (RLS) Policies

### 2.1. Helper Function: `get_user_role()`
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 2.2. Policies by Table

#### Table: `profiles`
- **Enable RLS**: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
- **Worker Select**: Workers can only read their own profile:
  ```sql
  CREATE POLICY "Workers can view own profile" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (id = auth.uid());
  ```
- **Admin Select/All**: Admin has full access:
  ```sql
  CREATE POLICY "Admins have full access to profiles" 
  ON profiles FOR ALL 
  TO authenticated 
  USING (get_user_role() = 'ADMIN');
  ```

#### Table: `workers`
- **Enable RLS**: `ALTER TABLE workers ENABLE ROW LEVEL SECURITY;`
- **Worker Select**: Workers can only view their own worker record:
  ```sql
  CREATE POLICY "Workers can view own worker record" 
  ON workers FOR SELECT 
  TO authenticated 
  USING (profile_id = auth.uid());
  ```
- **Admin All**: Full management by Admin:
  ```sql
  CREATE POLICY "Admins have full access to workers" 
  ON workers FOR ALL 
  TO authenticated 
  USING (get_user_role() = 'ADMIN');
  ```

#### Table: `production_entries`
- **Enable RLS**: `ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;`
- **Worker Select**: Workers view ONLY their own entries:
  ```sql
  CREATE POLICY "Workers can view own production entries" 
  ON production_entries FOR SELECT 
  TO authenticated 
  USING (worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid()));
  ```
- **Worker Insert**: Workers can insert their own entries:
  ```sql
  CREATE POLICY "Workers can insert own production entries" 
  ON production_entries FOR INSERT 
  TO authenticated 
  WITH CHECK (worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid()));
  ```
- **Worker Update/Delete**: **DENIED**. Workers cannot update or delete any production record.
- **Admin All**: Full view, update, correction for Admin:
  ```sql
  CREATE POLICY "Admins have full access to production entries" 
  ON production_entries FOR ALL 
  TO authenticated 
  USING (get_user_role() = 'ADMIN');
  ```

#### Table: `weekly_salary`
- **Enable RLS**: `ALTER TABLE weekly_salary ENABLE ROW LEVEL SECURITY;`
- **Worker Select**: Workers view ONLY their own weekly salary:
  ```sql
  CREATE POLICY "Workers can view own weekly salary" 
  ON weekly_salary FOR SELECT 
  TO authenticated 
  USING (worker_id IN (SELECT id FROM workers WHERE profile_id = auth.uid()));
  ```
- **Worker Modify**: **DENIED**.
- **Admin All**: Admins can calculate, review, adjust, and mark paid:
  ```sql
  CREATE POLICY "Admins have full access to weekly salary" 
  ON weekly_salary FOR ALL 
  TO authenticated 
  USING (get_user_role() = 'ADMIN');
  ```

#### Table: `audit_logs`
- **Enable RLS**: `ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;`
- **Worker Access**: **DENIED** (No SELECT, INSERT, UPDATE, DELETE).
- **Admin Select**:
  ```sql
  CREATE POLICY "Admins can view audit logs" 
  ON audit_logs FOR SELECT 
  TO authenticated 
  USING (get_user_role() = 'ADMIN');
  ```

---

## 3. Server-Side Input Validation (Zod Schemas)

All mutations are checked against strict Zod schemas before hitting the database:
- `PieceSubmissionSchema`:
  ```ts
  z.object({
    piece_count: z.number().int().min(1, "Pieces must be at least 1").max(25000, "Unrealistic piece count. Maximum 25,000 pieces per submission."),
    production_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
  })
  ```
- `WorkerCreateSchema`:
  ```ts
  z.object({
    worker_id: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/, "Worker ID must be uppercase alphanumeric (e.g. MK001)"),
    full_name: z.string().min(2, "Full name required").max(100),
    mobile: z.string().min(10, "Valid 10-digit mobile number required").max(15),
    operation_id: z.string().uuid("Valid operation required"),
    password: z.string().min(6, "Password must be at least 6 characters")
  })
  ```
- `SalaryReviewSchema`:
  ```ts
  z.object({
    weekly_salary_id: z.string().uuid(),
    final_salary: z.number().min(0, "Salary cannot be negative"),
    adjustment_amount: z.number().default(0),
    notes: z.string().max(500).optional()
  })
  ```

---

## 4. Audit Log Emitter
Every administrative change generates a structured log:
- `action`: E.g. `WORKER_CREATED`, `RATE_UPDATED`, `SALARY_APPROVED`, `SALARY_PAID`
- `actor_id` & `actor_name`: Identity of supervisor/admin
- `target_id`: ID of altered record
- `old_values` & `new_values`: JSON snapshots for forensic auditability
