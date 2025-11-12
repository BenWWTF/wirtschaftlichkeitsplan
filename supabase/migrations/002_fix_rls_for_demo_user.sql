-- Fix RLS policies to allow demo user (without authentication)
-- Demo user UUID: 00000000-0000-0000-0000-000000000000

-- Drop and recreate RLS policies for therapy_types
DROP POLICY IF EXISTS "Users can view own therapy types" ON public.therapy_types;
DROP POLICY IF EXISTS "Users can create therapy types" ON public.therapy_types;
DROP POLICY IF EXISTS "Users can update own therapy types" ON public.therapy_types;
DROP POLICY IF EXISTS "Users can delete own therapy types" ON public.therapy_types;

CREATE POLICY "Users can view own therapy types"
  ON public.therapy_types
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can create therapy types"
  ON public.therapy_types
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can update own therapy types"
  ON public.therapy_types
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can delete own therapy types"
  ON public.therapy_types
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

-- Drop and recreate RLS policies for monthly_plans
DROP POLICY IF EXISTS "Users can view own monthly plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Users can create monthly plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Users can update own monthly plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Users can delete own monthly plans" ON public.monthly_plans;

CREATE POLICY "Users can view own monthly plans"
  ON public.monthly_plans
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can create monthly plans"
  ON public.monthly_plans
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can update own monthly plans"
  ON public.monthly_plans
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can delete own monthly plans"
  ON public.monthly_plans
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

-- Drop and recreate RLS policies for expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Users can view own expenses"
  ON public.expenses
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can update own expenses"
  ON public.expenses
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can delete own expenses"
  ON public.expenses
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

-- Drop and recreate RLS policies for practice_settings (if user_id match exists)
DROP POLICY IF EXISTS "Users can view own practice settings" ON public.practice_settings;
DROP POLICY IF EXISTS "Users can create practice settings" ON public.practice_settings;
DROP POLICY IF EXISTS "Users can update own practice settings" ON public.practice_settings;

CREATE POLICY "Users can view own practice settings"
  ON public.practice_settings
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can create practice settings"
  ON public.practice_settings
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Users can update own practice settings"
  ON public.practice_settings
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );
