'use server'

import { createClient } from '@/utils/supabase/server'
import { getAuthUserId } from '@/lib/utils/auth'
import { logError } from '@/lib/utils/logger'
import { revalidatePath } from 'next/cache'

/**
 * Get the custom capacity for a specific month
 * Returns null if no custom capacity is set (uses default from settings)
 */
export async function getMonthlyCapacity(month: string): Promise<number | null> {
  const userId = await getAuthUserId()
  const supabase = await createClient()

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  try {
    const { data, error } = await supabase
      .from('monthly_capacities')
      .select('max_sessions_per_week')
      .eq('user_id', userId)
      .eq('month', monthDate)
      .single()

    if (error) {
      // Not found is expected - just means no custom capacity set
      if (error.code === 'PGRST116') {
        return null
      }
      logError('getMonthlyCapacity', 'Error fetching monthly capacity', error, { month })
      return null
    }

    return data?.max_sessions_per_week || null
  } catch (error) {
    logError('getMonthlyCapacity', 'Exception fetching monthly capacity', error, { month })
    return null
  }
}

/**
 * Set custom capacity for a specific month
 */
export async function setMonthlyCapacity(month: string, maxSessionsPerWeek: number) {
  const userId = await getAuthUserId()
  const supabase = await createClient()

  try {
    // Validate input
    if (maxSessionsPerWeek < 1 || maxSessionsPerWeek > 168) {
      return { error: 'Kapazität muss zwischen 1 und 168 Stunden pro Woche liegen' }
    }

    // Convert YYYY-MM to YYYY-MM-01 for date column
    const monthDate = month.includes('-') && month.length === 7
      ? `${month}-01`
      : month

    // Check if capacity already exists for this month
    const { data: existing } = await supabase
      .from('monthly_capacities')
      .select('id')
      .eq('user_id', userId)
      .eq('month', monthDate)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('monthly_capacities')
        .update({
          max_sessions_per_week: maxSessionsPerWeek,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        return { error: `Fehler beim Aktualisieren: ${error.message}` }
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('monthly_capacities')
        .insert({
          user_id: userId,
          month: monthDate,
          max_sessions_per_week: maxSessionsPerWeek
        })

      if (error) {
        return { error: `Fehler beim Erstellen: ${error.message}` }
      }
    }

    revalidatePath('/dashboard/planung')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Speichern der Kapazität' }
  }
}

/**
 * Remove custom capacity for a month (revert to default)
 */
export async function removeMonthlyCapacity(month: string) {
  const userId = await getAuthUserId()
  const supabase = await createClient()

  try {
    // Convert YYYY-MM to YYYY-MM-01 for date column
    const monthDate = month.includes('-') && month.length === 7
      ? `${month}-01`
      : month

    const { error } = await supabase
      .from('monthly_capacities')
      .delete()
      .eq('user_id', userId)
      .eq('month', monthDate)

    if (error) {
      return { error: `Fehler beim Löschen: ${error.message}` }
    }

    revalidatePath('/dashboard/planung')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Löschen' }
  }
}
