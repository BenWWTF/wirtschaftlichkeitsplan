'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TherapyTypeSchema, type TherapyTypeInput } from '@/lib/validations'
import type { TherapyType } from '@/lib/types'

/**
 * Create a new therapy type
 */
export async function createTherapyAction(input: TherapyTypeInput) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Authentifizierung erforderlich' }
  }

  // Validate input
  try {
    const validated = TherapyTypeSchema.parse(input)

    // Insert into database
    const { data, error } = await supabase
      .from('therapy_types')
      .insert({
        user_id: user.id,
        name: validated.name,
        price_per_session: validated.price_per_session,
        variable_cost_per_session: validated.variable_cost_per_session
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return { error: 'Fehler beim Speichern. Bitte versuchen Sie es später.' }
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
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Authentifizierung erforderlich' }
  }

  try {
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
      .eq('user_id', user.id) // Ensure user owns this
      .select()

    if (error) {
      console.error('Database error:', error)
      return { error: 'Fehler beim Aktualisieren. Bitte versuchen Sie es später.' }
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
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Authentifizierung erforderlich' }
  }

  try {
    // Delete from database
    const { error } = await supabase
      .from('therapy_types')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this

    if (error) {
      console.error('Database error:', error)
      return { error: 'Fehler beim Löschen. Bitte versuchen Sie es später.' }
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
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('therapy_types')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching therapies:', error)
    return []
  }

  return data || []
}
