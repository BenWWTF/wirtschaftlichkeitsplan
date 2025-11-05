import { createClient } from '@/utils/supabase/server'
import type { TherapyType } from '@/lib/types'

/**
 * Get all therapy types for the current user
 */
export async function getTherapyTypes(): Promise<TherapyType[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('therapy_types')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching therapy types:', error)
    throw error
  }

  return data || []
}

/**
 * Get a single therapy type by ID
 */
export async function getTherapyType(id: string): Promise<TherapyType | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('therapy_types')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching therapy type:', error)
    throw error
  }

  return data || null
}

/**
 * Get therapy type with monthly planning data
 */
export async function getTherapyTypeWithPlans(id: string, month?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('therapy_types')
    .select(`
      *,
      monthly_plans (
        id,
        month,
        planned_sessions,
        actual_sessions,
        notes
      )
    `)
    .eq('id', id)

  if (month) {
    query = query.eq('monthly_plans.month', month)
  }

  const { data, error } = await query.single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching therapy type with plans:', error)
    throw error
  }

  return data
}
