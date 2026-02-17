'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { PracticeSettingsSchema, type PracticeSettingsInput } from '@/lib/validations'
import type { PracticeSettings } from '@/lib/types'

/**
 * Create or update practice settings
 * Since there's only one settings record per user, this will either create or update
 */
export async function upsertPracticeSettingsAction(input: PracticeSettingsInput) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung fehlgeschlagen' }
  }

  try {
    console.log('[upsertPracticeSettingsAction] Input received:', JSON.stringify(input))
    const validated = PracticeSettingsSchema.parse(input)
    console.log('[upsertPracticeSettingsAction] Validation passed:', JSON.stringify(validated))

    // Check if settings exist
    const { data: existing } = await supabase
      .from('practice_settings')
      .select('*')
      .eq('user_id', user.id)
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
          payment_processing_fee_percentage: validated.payment_processing_fee_percentage,
          annual_revenue_goal: validated.annual_revenue_goal ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()

      result = { data, error }
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('practice_settings')
        .insert({
          user_id: user.id,
          practice_name: validated.practice_name,
          practice_type: validated.practice_type,
          monthly_fixed_costs: validated.monthly_fixed_costs,
          average_variable_cost_per_session: validated.average_variable_cost_per_session,
          expected_growth_rate: validated.expected_growth_rate,
          payment_processing_fee_percentage: validated.payment_processing_fee_percentage,
          annual_revenue_goal: validated.annual_revenue_goal ?? null
        })
        .select()

      result = { data, error }
    }

    if (result.error) {
      console.error('[upsertPracticeSettingsAction] Database error:', JSON.stringify(result.error, null, 2))
      return { error: `Fehler: ${result.error.message || 'Speichern fehlgeschlagen'}` }
    }

    console.log('[upsertPracticeSettingsAction] Save successful:', JSON.stringify(result.data))

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
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[getPracticeSettings] Authentication error:', authError)
      return null
    }

    const { data, error } = await supabase
      .from('practice_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no settings exist yet, return null (not an error)
      if (error.code === 'PGRST116') {
        console.log('No practice settings found, will create defaults')
        return null
      }
      console.error('Supabase error fetching practice settings:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    return data
  } catch (err) {
    console.error('Exception fetching practice settings:', err)
    return null
  }
}

/**
 * Update practice settings with partial updates
 * Allows updating specific fields like payment_processing_fee_percentage
 * without requiring all fields to be present
 */
export async function updatePracticeSettings(
  updates: Partial<Omit<PracticeSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; data?: PracticeSettings; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentifizierung fehlgeschlagen' }
    }

    // Filter out undefined values and add updated_at
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    )

    if (Object.keys(filteredUpdates).length === 0) {
      return { success: false, error: 'Keine Änderungen angegeben' }
    }

    const { data, error } = await supabase
      .from('practice_settings')
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      // If no settings exist yet, create them with defaults
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Praxiseinstellungen nicht gefunden. Bitte erstellen Sie zuerst Ihre Praxiseinstellungen.' }
      }
      console.error('Database error updating practice settings:', {
        message: error.message,
        code: error.code,
        details: error.details
      })
      return { success: false, error: `Fehler: ${error.message || 'Aktualisierung fehlgeschlagen'}` }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/einstellungen')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/analyse')
    revalidatePath('/dashboard/berichte')
    revalidatePath('/dashboard/therapien')

    return { success: true, data }
  } catch (err) {
    console.error('Exception updating practice settings:', err)
    if (err instanceof Error) {
      return { success: false, error: err.message }
    }
    return { success: false, error: 'Unbekannter Fehler bei der Aktualisierung' }
  }
}
