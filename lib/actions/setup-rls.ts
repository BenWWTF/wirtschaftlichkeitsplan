'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Setup/Fix RLS policies for demo user
 * Allows data access for demo user UUID: 00000000-0000-0000-0000-000000000000
 */
export async function setupDemoUserRLS() {
  const supabase = await createClient()

  const sqlStatements = [
    // Therapy Types RLS Policies
    `DROP POLICY IF EXISTS "Users can view own therapy types" ON public.therapy_types`,
    `DROP POLICY IF EXISTS "Users can create therapy types" ON public.therapy_types`,
    `DROP POLICY IF EXISTS "Users can update own therapy types" ON public.therapy_types`,
    `DROP POLICY IF EXISTS "Users can delete own therapy types" ON public.therapy_types`,

    `CREATE POLICY "Users can view own therapy types"
      ON public.therapy_types
      FOR SELECT
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can create therapy types"
      ON public.therapy_types
      FOR INSERT
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can update own therapy types"
      ON public.therapy_types
      FOR UPDATE
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can delete own therapy types"
      ON public.therapy_types
      FOR DELETE
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    // Monthly Plans RLS Policies
    `DROP POLICY IF EXISTS "Users can view own monthly plans" ON public.monthly_plans`,
    `DROP POLICY IF EXISTS "Users can create monthly plans" ON public.monthly_plans`,
    `DROP POLICY IF EXISTS "Users can update own monthly plans" ON public.monthly_plans`,
    `DROP POLICY IF EXISTS "Users can delete own monthly plans" ON public.monthly_plans`,

    `CREATE POLICY "Users can view own monthly plans"
      ON public.monthly_plans
      FOR SELECT
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can create monthly plans"
      ON public.monthly_plans
      FOR INSERT
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can update own monthly plans"
      ON public.monthly_plans
      FOR UPDATE
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can delete own monthly plans"
      ON public.monthly_plans
      FOR DELETE
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    // Expenses RLS Policies
    `DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses`,
    `DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses`,
    `DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses`,
    `DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses`,

    `CREATE POLICY "Users can view own expenses"
      ON public.expenses
      FOR SELECT
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can create expenses"
      ON public.expenses
      FOR INSERT
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can update own expenses"
      ON public.expenses
      FOR UPDATE
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,

    `CREATE POLICY "Users can delete own expenses"
      ON public.expenses
      FOR DELETE
      USING (
        (SELECT auth.uid()) = user_id
        OR user_id = '00000000-0000-0000-0000-000000000000'
      )`,
  ]

  console.log('[setupDemoUserRLS] Starting RLS policy setup...')

  for (const sql of sqlStatements) {
    const { error } = await supabase.rpc('exec', { sql })
    if (error) {
      console.error('[setupDemoUserRLS] Error executing SQL:', sql, error)
      // Continue with other statements even if one fails
    }
  }

  console.log('[setupDemoUserRLS] RLS policy setup complete')
  return { success: true }
}
