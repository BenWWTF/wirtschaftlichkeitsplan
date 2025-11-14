'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthUserId } from '@/lib/utils/auth'
import { logError } from '@/lib/utils/logger'
import { TherapyTypeSchema, type TherapyTypeInput } from '@/lib/validations'
import type { TherapyType } from '@/lib/types'

/**
 * Create a new therapy type
 */
export async function createTherapyAction(input: TherapyTypeInput) {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const validated = TherapyTypeSchema.parse(input)

    // Insert into database
    const { data, error } = await supabase
      .from('therapy_types')
      .insert({
        user_id: userId,
        name: validated.name,
        price_per_session: validated.price_per_session,
        variable_cost_per_session: validated.variable_cost_per_session
      })
      .select()

    if (error) {
      logError('createTherapyAction', 'Database error while creating therapy', error, {
        therapyName: validated.name
      })
      return { error: `Fehler: ${error.message || 'Speichern fehlgeschlagen'}` }
    }

    // Revalidate cache
    revalidatePath('/dashboard/therapien')

    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Validierungsfehler' }
  }
}

/**
 * Update an existing therapy type
 */
export async function updateTherapyAction(
  id: string,
  input: TherapyTypeInput
) {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const validated = TherapyTypeSchema.parse(input)

    // Update in database
    const { data, error } = await supabase
      .from('therapy_types')
      .update({
        name: validated.name,
        price_per_session: validated.price_per_session,
        variable_cost_per_session: validated.variable_cost_per_session,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      logError('updateTherapyAction', 'Database error while updating therapy', error, {
        therapyId: id,
        therapyName: validated.name
      })
      return { error: `Fehler: ${error.message || 'Aktualisieren fehlgeschlagen'}` }
    }

    if (!data || data.length === 0) {
      return { error: 'Therapieart nicht gefunden oder keine Berechtigung' }
    }

    // Revalidate cache
    revalidatePath('/dashboard/therapien')

    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Validierungsfehler' }
  }
}

/**
 * Delete a therapy type
 */
export async function deleteTherapyAction(id: string) {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    // Delete from database
    const { error } = await supabase
      .from('therapy_types')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      logError('deleteTherapyAction', 'Database error while deleting therapy', error, { therapyId: id })
      return { error: `Fehler: ${error.message || 'Löschen fehlgeschlagen'}` }
    }

    // Revalidate cache
    revalidatePath('/dashboard/therapien')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Ein Fehler ist aufgetreten' }
  }
}

/**
 * Get all therapy types for current user (for use in server components)
 */
export async function getTherapies(): Promise<TherapyType[]> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('therapy_types')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logError('getTherapies', 'Supabase error fetching therapies', error, {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
      return []
    }

    return data || []
  } catch (err) {
    logError('getTherapies', 'Exception fetching therapies', err)
    return []
  }
}
