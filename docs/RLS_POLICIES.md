# Row-Level Security (RLS) Policies Documentation

## Executive Summary

This document provides a comprehensive analysis of Row-Level Security (RLS) policies required for the Wirtschaftlichkeitsplan Next.js/Supabase application. The application manages therapy practice financial planning with strict data isolation requirements between users.

**Date:** 2025-11-14
**Status:** CRITICAL - RLS policies partially implemented, requires review and hardening
**Security Level:** Multi-tenant SaaS application with sensitive financial data

---

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Security Requirements](#security-requirements)
3. [Current RLS Implementation Status](#current-rls-implementation-status)
4. [Required RLS Policies by Table](#required-rls-policies-by-table)
5. [Security Vulnerabilities and Recommendations](#security-vulnerabilities-and-recommendations)
6. [Implementation Checklist](#implementation-checklist)

---

## Database Schema Overview

### Core Tables Identified

Based on analysis of `/lib/actions/*.ts` files, the following tables are actively used:

1. **therapy_types** - Therapy service definitions with pricing
2. **monthly_plans** - Session planning and actuals tracking
3. **expenses** - Practice expense records
4. **practice_settings** - User practice configuration
5. **latido_invoices** - Imported invoice data from Latido platform
6. **latido_import_sessions** - Import audit trail
7. **latido_reconciliation** - Invoice-to-session matching records

### Data Access Patterns

All server actions use:
- `getAuthUserId()` utility to retrieve the authenticated user ID
- `createClient()` from `@/utils/supabase/server` for database access
- `.eq('user_id', userId)` filter on all queries

---

## Security Requirements

### Multi-Tenant Data Isolation

**Critical Requirement:** Each user must only access their own data. Cross-user data access must be prevented at the database level.

**Data Sensitivity:**
- Financial records (revenue, expenses, pricing)
- Practice business information
- Patient session counts (indirect PHI)
- Tax-relevant financial data

**Authentication Method:**
- Supabase Auth with `auth.uid()` function
- User ID stored in `auth.users` table
- Foreign key: `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`

**Special Case - Demo User:**
- UUID: `00000000-0000-0000-0000-000000000000`
- Currently allowed in RLS policies (migration 002)
- **Security Risk:** Should be removed in production

---

## Current RLS Implementation Status

### Migration 001 (Initial Policies)

All four core tables have basic RLS policies:
- ✅ RLS enabled on all tables
- ✅ SELECT, INSERT, UPDATE, DELETE policies created
- ✅ Uses `auth.uid() = user_id` pattern
- ✅ Both USING and WITH CHECK clauses implemented

### Migration 002 (Demo User Exception)

**SECURITY CONCERN:** Modified policies to allow demo user:
```sql
USING (
  (SELECT auth.uid()) = user_id
  OR user_id = '00000000-0000-0000-0000-000000000000'
)
```

**Risk Assessment:** HIGH
- Bypasses authentication for demo data
- Could allow unauthorized access if demo user ID is exploited
- Should be environment-restricted (dev/staging only)

### Migration 003 (Latido Tables)

Latido-related tables have standard RLS policies:
- ✅ latido_invoices - 4 policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ latido_import_sessions - 3 policies (SELECT, INSERT, UPDATE)
- ✅ latido_reconciliation - 3 policies (SELECT, INSERT, UPDATE)
- ❌ Missing DELETE policy on latido_import_sessions
- ❌ Missing DELETE policy on latido_reconciliation

---

## Required RLS Policies by Table

### 1. therapy_types

**Purpose:** Stores therapy service definitions with pricing information

**Current Status:** ✅ Implemented with demo user exception

**Required Policies:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view own therapy types"
  ON public.therapy_types
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Rationale:**
- Users must only see their own therapy types
- Prevents competitor pricing visibility
- Protects business model information

**Access Pattern in Code:**
- `lib/actions/import.ts` (lines 24-27): Therapy type lookup for import validation
- `lib/actions/analysis.ts` (lines 44-48): Break-even analysis queries
- `lib/actions/therapies.ts` (lines 138-142): Full therapy list retrieval
- `lib/actions/dashboard.ts` (lines 272-276): Dashboard metrics

#### INSERT Policy
```sql
CREATE POLICY "Users can create therapy types"
  ON public.therapy_types
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Users can only create therapies for themselves
- Prevents insertion of records for other users
- Enforces user_id matches authenticated user

**Access Pattern in Code:**
- `lib/actions/therapies.ts` (lines 20-28): Create therapy action

#### UPDATE Policy
```sql
CREATE POLICY "Users can update own therapy types"
  ON public.therapy_types
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Users can only modify their own therapy definitions
- USING clause: filters rows that can be updated
- WITH CHECK: validates new values don't change user_id

**Access Pattern in Code:**
- `lib/actions/therapies.ts` (lines 62-72): Update therapy action

#### DELETE Policy
```sql
CREATE POLICY "Users can delete own therapy types"
  ON public.therapy_types
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Rationale:**
- Users can only delete their own therapy types
- Cascade deletion handled by foreign key constraints

**Access Pattern in Code:**
- `lib/actions/therapies.ts` (lines 107-111): Delete therapy action
- `lib/actions/settings.ts` (lines 146-149): Bulk delete in demo data cleanup

**Additional Security Considerations:**
- ⚠️ No validation preventing deletion of therapies with associated monthly_plans
- Consider adding CHECK constraint or trigger to prevent orphaned data

---

### 2. monthly_plans

**Purpose:** Stores planned and actual therapy sessions per month

**Current Status:** ✅ Implemented with demo user exception

**Required Policies:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view own monthly plans"
  ON public.monthly_plans
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Rationale:**
- Session counts are sensitive business data
- Prevents competitors from analyzing practice volume
- Required for all financial reporting

**Access Pattern in Code:**
- `lib/actions/import.ts` (lines 88-94): Check existing plans during import
- `lib/actions/analysis.ts` (lines 160-163): Average session calculations
- `lib/actions/monthly-plans.ts` (lines 22-27, 50-55): Monthly plan retrieval
- `lib/actions/dashboard.ts` (lines 56-60, 164-169): Dashboard metrics
- **High frequency queries** - performance critical

#### INSERT Policy
```sql
CREATE POLICY "Users can create monthly plans"
  ON public.monthly_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Prevents users from creating plans for other practices
- Enforces data ownership at creation

**Access Pattern in Code:**
- `lib/actions/import.ts` (lines 124-133): Automated import creation
- `lib/actions/monthly-plans.ts` (lines 149-159): Manual plan creation

**Security Gap:**
- ⚠️ No validation that therapy_type_id belongs to same user
- **CRITICAL:** Must add CHECK constraint or policy to verify therapy ownership

**Recommended Enhanced Policy:**
```sql
CREATE POLICY "Users can create monthly plans"
  ON public.monthly_plans
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM therapy_types
      WHERE id = therapy_type_id
      AND user_id = auth.uid()
    )
  );
```

#### UPDATE Policy
```sql
CREATE POLICY "Users can update own monthly plans"
  ON public.monthly_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Users update actual sessions after performing them
- Must prevent modification of other users' data
- WITH CHECK prevents user_id hijacking

**Access Pattern in Code:**
- `lib/actions/import.ts` (lines 107-113): Update actual sessions from import
- `lib/actions/monthly-plans.ts` (lines 131-139): Manual plan updates

**Security Gap:**
- ⚠️ Same therapy_type_id ownership issue as INSERT
- Should verify therapy still belongs to user on update

#### DELETE Policy
```sql
CREATE POLICY "Users can delete own monthly plans"
  ON public.monthly_plans
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Rationale:**
- Allow users to remove incorrect planning data
- Essential for data cleanup workflows

**Access Pattern in Code:**
- `lib/actions/monthly-plans.ts` (lines 184-188): Delete monthly plan
- `lib/actions/settings.ts` (lines 133-137): Bulk delete in demo cleanup

---

### 3. expenses

**Purpose:** Stores all practice expense records

**Current Status:** ✅ Implemented with demo user exception

**Required Policies:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view own expenses"
  ON public.expenses
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Rationale:**
- Expense data is highly sensitive financial information
- Tax-relevant data requiring strict access control
- Contains business cost structure information

**Access Pattern in Code:**
- `lib/actions/analysis.ts` (lines 83-86): Monthly expense calculations
- `lib/actions/analytics.ts` (lines 84-89): Analytics expense data
- `lib/actions/expenses.ts` (lines 155-159): Full expense list
- `lib/actions/dashboard.ts` (lines 84-87, 195-197, 360-364): Dashboard aggregations

#### INSERT Policy
```sql
CREATE POLICY "Users can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Users can only add expenses to their own practice
- Prevents injection of expenses into other users' accounts

**Access Pattern in Code:**
- `lib/actions/expenses.ts` (lines 20-32): Create expense action

#### UPDATE Policy
```sql
CREATE POLICY "Users can update own expenses"
  ON public.expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Allow correction of expense records
- Essential for accurate financial reporting
- Audit trail maintained via updated_at timestamp

**Access Pattern in Code:**
- `lib/actions/expenses.ts` (lines 70-84): Update expense action

#### DELETE Policy
```sql
CREATE POLICY "Users can delete own expenses"
  ON public.expenses
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Rationale:**
- Allow removal of duplicate or incorrect entries
- Required for data quality maintenance

**Access Pattern in Code:**
- `lib/actions/expenses.ts` (lines 122-126): Delete expense action
- `lib/actions/settings.ts` (lines 140-143): Bulk delete in demo cleanup

**Additional Recommendations:**
- Consider soft-delete approach for audit trail
- Add trigger to log deletions for tax compliance

---

### 4. practice_settings

**Purpose:** Stores user practice configuration (one record per user)

**Current Status:** ✅ Implemented with demo user exception, ❌ Missing DELETE policy

**Required Policies:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view own practice settings"
  ON public.practice_settings
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Rationale:**
- Practice configuration is user-specific
- Contains business assumptions and planning parameters
- One-to-one relationship with user

**Access Pattern in Code:**
- `lib/actions/analysis.ts` (lines 278-282): Fixed costs retrieval
- `lib/actions/settings.ts` (lines 94-98): Settings retrieval

#### INSERT Policy
```sql
CREATE POLICY "Users can create practice settings"
  ON public.practice_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Users create settings during signup
- UNIQUE constraint on user_id prevents duplicates
- Initial settings created in auth.ts signup flow

**Access Pattern in Code:**
- `lib/actions/auth.ts` (lines 46-55): Signup settings creation
- `lib/actions/settings.ts` (lines 48-60): Manual settings creation

**Security Note:**
- ✅ UNIQUE constraint on user_id column prevents multiple records
- ✅ ON DELETE CASCADE ensures cleanup when user deleted

#### UPDATE Policy
```sql
CREATE POLICY "Users can update own practice settings"
  ON public.practice_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Users frequently update practice configuration
- Financial assumptions change over time
- Must prevent user_id tampering

**Access Pattern in Code:**
- `lib/actions/settings.ts` (lines 31-43): Update settings action

#### DELETE Policy (MISSING)
```sql
-- CURRENTLY NOT IMPLEMENTED
-- RECOMMENDED:
CREATE POLICY "Users can delete own practice settings"
  ON public.practice_settings
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Rationale:**
- Allow users to reset settings to defaults
- Required for account cleanup workflows
- Currently only deleted in demo cleanup (lines 152-155)

**Access Pattern in Code:**
- `lib/actions/settings.ts` (lines 152-155): Demo data cleanup

**Recommendation:** Add DELETE policy for completeness and future account management features.

---

### 5. latido_invoices

**Purpose:** Stores invoices imported from Latido practice management platform

**Current Status:** ✅ Implemented (migration 003)

**Required Policies:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view own latido invoices"
  ON public.latido_invoices
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Rationale:**
- Invoice data contains sensitive financial information
- Payment details are PCI-relevant
- Must isolate invoice data between practices

**Access Pattern in Code:**
- `lib/actions/latido-import.ts` (lines 234-238): Get invoices by user/month

#### INSERT Policy
```sql
CREATE POLICY "Users can create latido invoices"
  ON public.latido_invoices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Import process creates bulk invoice records
- Must ensure imported data belongs to importing user
- UNIQUE constraint on (user_id, invoice_number) prevents duplicates

**Access Pattern in Code:**
- `lib/actions/latido-import.ts` (lines 190-199): Bulk invoice import

**Security Considerations:**
- ✅ UNIQUE constraint prevents duplicate invoice numbers per user
- ⚠️ No validation of import_id ownership (should reference user's own import sessions)
- ⚠️ No validation of matched_monthly_plan_id ownership

**Enhanced Policy Recommended:**
```sql
CREATE POLICY "Users can create latido invoices"
  ON public.latido_invoices
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (import_id IS NULL OR EXISTS (
      SELECT 1 FROM latido_import_sessions
      WHERE id = import_id AND user_id = auth.uid()
    ))
    AND (matched_monthly_plan_id IS NULL OR EXISTS (
      SELECT 1 FROM monthly_plans
      WHERE id = matched_monthly_plan_id AND user_id = auth.uid()
    ))
  );
```

#### UPDATE Policy
```sql
CREATE POLICY "Users can update own latido invoices"
  ON public.latido_invoices
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Allow reconciliation status updates
- Users can add notes and mark invoices as reconciled
- Payment status updates after external verification

**Security Gap:**
- ⚠️ Same foreign key ownership validation missing (import_id, matched_monthly_plan_id)

#### DELETE Policy
```sql
CREATE POLICY "Users can delete own latido invoices"
  ON public.latido_invoices
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Rationale:**
- Allow removal of incorrect imports
- Essential for re-importing corrected data
- Cascade handled by reconciliation table foreign keys

**Note:** No explicit DELETE usage found in code review, but required for data management.

---

### 6. latido_import_sessions

**Purpose:** Audit trail for invoice import operations

**Current Status:** ⚠️ Partial - Missing DELETE policy

**Required Policies:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view own import sessions"
  ON public.latido_import_sessions
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Rationale:**
- Users need to review import history
- Audit trail for troubleshooting
- Shows success/failure statistics

**Access Pattern in Code:**
- Implicit via foreign key in latido_invoices queries

#### INSERT Policy
```sql
CREATE POLICY "Users can create import sessions"
  ON public.latido_import_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Each import creates a session record
- Tracks who imported what and when
- Essential for audit compliance

**Access Pattern in Code:**
- `lib/actions/latido-import.ts` (lines 176-184): Create import session

#### UPDATE Policy
```sql
CREATE POLICY "Users can update own import sessions"
  ON public.latido_import_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Update success/failure counts after import
- Add import notes for audit trail

**Access Pattern in Code:**
- `lib/actions/latido-import.ts` (lines 204-210): Update import statistics

#### DELETE Policy (MISSING)
```sql
-- RECOMMENDED TO ADD:
CREATE POLICY "Users can delete own import sessions"
  ON public.latido_import_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Rationale:**
- Allow cleanup of failed/test imports
- Data retention management
- User should control their audit history

**Recommendation:** Add DELETE policy for data management completeness.

---

### 7. latido_reconciliation

**Purpose:** Tracks matching between Latido invoices and internal therapy sessions

**Current Status:** ⚠️ Partial - Missing DELETE policy

**Required Policies:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view own reconciliation records"
  ON public.latido_reconciliation
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Rationale:**
- Reconciliation data shows invoice-to-session matching
- Contains discrepancy analysis (sensitive)
- Required for financial accuracy verification

**Access Pattern in Code:**
- Via stored function `get_latido_reconciliation_summary` (migration 003, lines 179-230)

#### INSERT Policy
```sql
CREATE POLICY "Users can create reconciliation records"
  ON public.latido_reconciliation
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Create matching records during reconciliation process
- Links invoices to monthly plans
- UNIQUE constraint on (user_id, invoice_id, plan_id)

**Security Gap:**
- ⚠️ No validation that latido_invoice_id belongs to user
- ⚠️ No validation that monthly_plan_id belongs to user

**Enhanced Policy Recommended:**
```sql
CREATE POLICY "Users can create reconciliation records"
  ON public.latido_reconciliation
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM latido_invoices
      WHERE id = latido_invoice_id AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM monthly_plans
      WHERE id = monthly_plan_id AND user_id = auth.uid()
    )
  );
```

#### UPDATE Policy
```sql
CREATE POLICY "Users can update own reconciliation records"
  ON public.latido_reconciliation
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Rationale:**
- Update reconciliation status (pending, matched, unmatched)
- Add resolution notes
- Mark as resolved with timestamp

**Security Gap:**
- ⚠️ Same foreign key ownership validation missing

#### DELETE Policy (MISSING)
```sql
-- RECOMMENDED TO ADD:
CREATE POLICY "Users can delete own reconciliation records"
  ON public.latido_reconciliation
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Rationale:**
- Allow removal of incorrect reconciliation matches
- Re-reconciliation workflows require cleanup
- User data ownership

**Recommendation:** Add DELETE policy for reconciliation management.

---

## Security Vulnerabilities and Recommendations

### Critical Issues

#### 1. Demo User Bypass (HIGH SEVERITY)
**Issue:** Migration 002 adds `OR user_id = '00000000-0000-0000-0000-000000000000'` to all policies

**Risk:**
- Bypasses authentication entirely for demo user
- Could be exploited if demo UUID is known
- Violates zero-trust principle

**Recommendation:**
```sql
-- Add environment check to limit demo user to development
CREATE OR REPLACE FUNCTION is_demo_allowed() RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('app.environment', true) IN ('development', 'staging');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies to use function
USING (
  auth.uid() = user_id
  OR (user_id = '00000000-0000-0000-0000-000000000000' AND is_demo_allowed())
)
```

**Urgency:** Remove from production immediately

#### 2. Foreign Key Ownership Validation (MEDIUM SEVERITY)
**Issue:** No validation that referenced records belong to the same user

**Affected Policies:**
- `monthly_plans` INSERT/UPDATE (therapy_type_id)
- `latido_invoices` INSERT/UPDATE (import_id, matched_monthly_plan_id)
- `latido_reconciliation` INSERT/UPDATE (latido_invoice_id, monthly_plan_id)

**Risk:**
- User could link to another user's therapy types
- Cross-user data contamination
- Inaccurate financial reporting

**Recommendation:** Implement enhanced policies with EXISTS clauses (shown above in each table section)

**Urgency:** High - implement in next security release

#### 3. Missing DELETE Policies (LOW SEVERITY)
**Issue:** DELETE policies missing on:
- `practice_settings`
- `latido_import_sessions`
- `latido_reconciliation`

**Risk:**
- Unable to delete records through application
- Requires direct database access for cleanup
- Inconsistent policy coverage

**Recommendation:** Add DELETE policies to all tables

**Urgency:** Low - add in next maintenance release

### Audit and Compliance Recommendations

#### 1. Soft Deletes for Financial Records
**Tables:** `expenses`, `latido_invoices`, `monthly_plans`

**Rationale:**
- Financial data should not be permanently deleted
- Tax audit requirements (7-10 year retention)
- Fraud detection and investigation

**Implementation:**
```sql
-- Add deleted_at column
ALTER TABLE expenses ADD COLUMN deleted_at TIMESTAMPTZ;

-- Update SELECT policy to exclude soft-deleted
CREATE POLICY "Users can view own expenses"
  ON public.expenses
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Change DELETE to UPDATE
CREATE POLICY "Users can soft-delete own expenses"
  ON public.expenses
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NOT NULL);
```

#### 2. Audit Logging
**Recommendation:** Implement trigger-based audit logging

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id, changed_at DESC);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
```

#### 3. Rate Limiting for Bulk Operations
**Tables:** `latido_invoices`, `monthly_plans`

**Rationale:**
- Prevent bulk data exfiltration
- Detect abnormal access patterns
- DoS protection

**Implementation:**
Consider application-level rate limiting on:
- Import operations (max 1000 invoices per import)
- Bulk queries (max 5000 records per query)

### Testing Recommendations

#### RLS Policy Testing Checklist

For each table, verify:

1. **Authentication Required**
   - [ ] Anonymous users cannot read any data
   - [ ] Anonymous users cannot write any data

2. **User Isolation**
   - [ ] User A cannot read User B's data
   - [ ] User A cannot modify User B's data
   - [ ] User A cannot delete User B's data

3. **Ownership Enforcement**
   - [ ] INSERT requires user_id = auth.uid()
   - [ ] UPDATE cannot change user_id
   - [ ] Foreign keys reference same user's records

4. **Policy Coverage**
   - [ ] SELECT policy exists and tested
   - [ ] INSERT policy exists and tested
   - [ ] UPDATE policy exists and tested
   - [ ] DELETE policy exists and tested

#### Sample Test Cases

```sql
-- Test 1: User cannot view other user's therapy types
SET request.jwt.claim.sub = '<user_a_uuid>';
SELECT * FROM therapy_types WHERE user_id = '<user_b_uuid>';
-- Expected: 0 rows

-- Test 2: User cannot insert with wrong user_id
SET request.jwt.claim.sub = '<user_a_uuid>';
INSERT INTO therapy_types (user_id, name, price_per_session, variable_cost_per_session)
VALUES ('<user_b_uuid>', 'Test', 100, 20);
-- Expected: Error - new row violates row-level security policy

-- Test 3: User cannot update other user's records
SET request.jwt.claim.sub = '<user_a_uuid>';
UPDATE expenses SET amount = 999 WHERE user_id = '<user_b_uuid>';
-- Expected: 0 rows updated

-- Test 4: User cannot link to other user's therapy types
SET request.jwt.claim.sub = '<user_a_uuid>';
INSERT INTO monthly_plans (user_id, therapy_type_id, month, planned_sessions)
VALUES ('<user_a_uuid>', '<user_b_therapy_id>', '2025-01-01', 10);
-- Expected: Error (with enhanced policy) or data contamination (current)
```

---

## Implementation Checklist

### Phase 1: Critical Security Fixes (Immediate)

- [ ] **Remove demo user bypass from production**
  - [ ] Create environment-aware function
  - [ ] Update all policies to use environment check
  - [ ] Test in staging environment
  - [ ] Deploy to production
  - [ ] Verify demo user blocked in production

- [ ] **Add foreign key ownership validation**
  - [ ] Update monthly_plans INSERT policy (therapy_type_id)
  - [ ] Update monthly_plans UPDATE policy (therapy_type_id)
  - [ ] Update latido_invoices INSERT policy (import_id, monthly_plan_id)
  - [ ] Update latido_invoices UPDATE policy (import_id, monthly_plan_id)
  - [ ] Update latido_reconciliation INSERT policy (invoice_id, monthly_plan_id)
  - [ ] Update latido_reconciliation UPDATE policy (invoice_id, monthly_plan_id)

### Phase 2: Policy Completeness (Next Release)

- [ ] **Add missing DELETE policies**
  - [ ] practice_settings DELETE policy
  - [ ] latido_import_sessions DELETE policy
  - [ ] latido_reconciliation DELETE policy

- [ ] **Test all policies**
  - [ ] Run RLS test suite for each table
  - [ ] Verify user isolation
  - [ ] Verify authentication requirement
  - [ ] Verify foreign key ownership

### Phase 3: Audit and Compliance (Future Enhancement)

- [ ] **Implement soft deletes**
  - [ ] Add deleted_at columns to financial tables
  - [ ] Update DELETE policies to soft-delete
  - [ ] Create admin function for hard deletes
  - [ ] Update SELECT policies to filter soft-deleted

- [ ] **Add audit logging**
  - [ ] Create audit_log table
  - [ ] Create audit triggers for all tables
  - [ ] Add retention policy (10 years)
  - [ ] Create audit query functions

- [ ] **Rate limiting**
  - [ ] Implement application-level rate limiting
  - [ ] Add monitoring for bulk operations
  - [ ] Create alerts for suspicious patterns

### Phase 4: Documentation and Monitoring

- [ ] **Documentation**
  - [ ] Document RLS policy testing procedures
  - [ ] Create runbook for RLS policy updates
  - [ ] Document audit log queries
  - [ ] Security incident response plan

- [ ] **Monitoring**
  - [ ] Set up alerts for RLS policy violations
  - [ ] Monitor auth.uid() = NULL queries
  - [ ] Track failed authorization attempts
  - [ ] Regular security audits

---

## Database Functions and RLS

### Security Definer Functions

The following functions use `SECURITY DEFINER` and bypass RLS:

1. **get_monthly_summary** (migration 001, line 159)
2. **get_monthly_expenses** (migration 001, line 192)
3. **get_monthly_total_revenue** (migration 001, line 217)
4. **get_monthly_total_expenses** (migration 001, line 234)
5. **reconcile_latido_invoice** (migration 003, line 132)
6. **get_latido_reconciliation_summary** (migration 003, line 179)

**Security Concern:** These functions run with elevated privileges

**Mitigation:**
- All functions properly filter by user_id parameter
- No direct data access without user context
- ✅ Functions are secure as implemented

**Recommendation:**
- Add explicit user_id validation at function start
- Log all function calls for audit trail
- Consider SECURITY INVOKER where possible

---

## Summary and Key Recommendations

### Current Security Posture

**Strengths:**
- ✅ RLS enabled on all tables
- ✅ Basic CRUD policies implemented
- ✅ User isolation via user_id foreign key
- ✅ Application consistently uses getAuthUserId()

**Weaknesses:**
- ❌ Demo user bypass in production (CRITICAL)
- ❌ Missing foreign key ownership validation (HIGH)
- ❌ Incomplete DELETE policy coverage (LOW)
- ❌ No soft-delete for financial records (MEDIUM)
- ❌ No audit logging (MEDIUM)

### Top 5 Priorities

1. **Remove demo user bypass from production** (Critical, 1 day)
2. **Add foreign key ownership validation** (High, 2 days)
3. **Complete DELETE policy coverage** (Low, 1 day)
4. **Implement comprehensive RLS testing** (High, 2 days)
5. **Plan audit logging implementation** (Medium, 1 week)

### Estimated Implementation Timeline

- **Phase 1 (Critical):** 3 days
- **Phase 2 (Completeness):** 3 days
- **Phase 3 (Audit):** 2 weeks
- **Phase 4 (Monitoring):** 1 week

**Total:** ~4 weeks for full implementation

---

## Conclusion

The application has a solid foundation for data security with RLS policies implemented on all tables. However, several critical improvements are needed before production deployment:

1. **Immediate action required:** Remove demo user bypass from production environment
2. **High priority:** Add foreign key ownership validation to prevent cross-user data contamination
3. **Recommended:** Implement soft-deletes and audit logging for financial compliance

The current implementation protects against basic security threats but needs hardening for production use with sensitive financial data. The recommendations in this document provide a clear path to enterprise-grade security.

---

**Document Prepared By:** Claude Code Analysis
**Review Status:** Pending Supabase Project Lead Review
**Next Review Date:** 2025-11-21 (1 week from creation)
**Classification:** Internal - Security Documentation
