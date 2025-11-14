'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/utils/logger'
import { PracticeSettingsSchema, type PracticeSettingsInput } from '@/lib/validations'
import type { PracticeSettings } from '@/lib/types'
import { getAuthUserId } from '@/lib/utils/auth'

/**
 * Create or update practice settings
 * Since there's only one settings record per user, this will either create or update
 */
export async function upsertPracticeSettingsAction(input: PracticeSettingsInput) {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const validated = PracticeSettingsSchema.parse(input)

    // Check if settings exist
    const { data: existing } = await supabase
      .from('practice_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    let result

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('practice_settings')
        .update({
          practice_name: validated.practice_name,
          practice_type: validated.practice_type,
          monthly_fixed_costs: validated.monthly_fixed_costs,
          average_variable_cost_per_session: validated.average_variable_cost_per_session,
          expected_growth_rate: validated.expected_growth_rate,
          max_sessions_per_week: validated.max_sessions_per_week,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()

      result = { data, error }
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('practice_settings')
        .insert({
          user_id: userId,
          practice_name: validated.practice_name,
          practice_type: validated.practice_type,
          monthly_fixed_costs: validated.monthly_fixed_costs,
          average_variable_cost_per_session: validated.average_variable_cost_per_session,
          expected_growth_rate: validated.expected_growth_rate,
          max_sessions_per_week: validated.max_sessions_per_week
        })
        .select()

      result = { data, error }
    }

    if (result.error) {
      logError('upsertPracticeSettingsAction', 'Database error while upserting settings', result.error, {
        practiceName: validated.practice_name
      })
      return { error: `Fehler: ${result.error.message || 'Speichern fehlgeschlagen'}` }
    }

    // Revalidate cache
    revalidatePath('/dashboard/einstellungen')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/analyse')
    revalidatePath('/dashboard/berichte')

    return { success: true, data: result.data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Validierungsfehler' }
  }
}

/**
 * Get practice settings (for use in server components)
 */
export async function getPracticeSettings(): Promise<PracticeSettings | null> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('practice_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If no settings exist yet, return null (not an error)
      if (error.code === 'PGRST116') {
        console.log('No practice settings found, will create defaults')
        return null
      }
      logError('getPracticeSettings', 'Supabase error fetching practice settings', error, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    return data
  } catch (err) {
    logError('getPracticeSettings', 'Exception fetching practice settings', err)
    return null
  }
}

/**
 * Delete all data for the current user (careful operation)
 */
export async function deleteDemoDataAction() {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    // Delete data in the correct order to avoid foreign key constraint issues
    // Delete child records first, then parent records

    // 1. Delete monthly_plans (depends on therapy_types)
    await supabase
      .from('monthly_plans')
      .delete()
      .eq('user_id', userId)

    // 2. Delete expenses
    await supabase
      .from('expenses')
      .delete()
      .eq('user_id', userId)

    // 3. Delete therapy_types
    await supabase
      .from('therapy_types')
      .delete()
      .eq('user_id', userId)

    // 4. Delete practice_settings
    await supabase
      .from('practice_settings')
      .delete()
      .eq('user_id', userId)

    // Revalidate all dashboard paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/planung')
    revalidatePath('/dashboard/analyse')
    revalidatePath('/dashboard/berichte')
    revalidatePath('/dashboard/einstellungen')

    return { success: true, message: 'Demo data deleted successfully' }
  } catch (error) {
    logError('deleteDemoDataAction', 'Error deleting demo data', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete demo data' }
  }
}
