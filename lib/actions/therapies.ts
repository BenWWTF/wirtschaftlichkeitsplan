'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TherapyTypeSchema, type TherapyTypeInput } from '@/lib/validations'
import type { TherapyType, TherapyWithMetrics } from '@/lib/types'
import { calculatePaymentFee, calculateNetRevenue, SUMUP_FEE_RATE } from '@/lib/calculations/payment-fees'

/**
 * Create a new therapy type
 */
export async function createTherapyAction(input: TherapyTypeInput) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung fehlgeschlagen' }
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
        price_per_session: validated.price_per_session
      })
      .select()

    if (error) {
      console.error('Database error:', JSON.stringify(error, null, 2))
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
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung fehlgeschlagen' }
  }

  try {
    const validated = TherapyTypeSchema.parse(input)

    // Update in database
    const { data, error } = await supabase
      .from('therapy_types')
      .update({
        name: validated.name,
        price_per_session: validated.price_per_session,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('Database error:', JSON.stringify(error, null, 2))
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
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung fehlgeschlagen' }
  }

  try {
    // Delete from database
    const { error } = await supabase
      .from('therapy_types')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', JSON.stringify(error, null, 2))
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
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    // Use demo user if no authenticated user
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from('therapy_types')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching therapies:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching therapies:', err)
    return []
  }
}

/**
 * Get all therapy types with calculated payment fee metrics
 *
 * This function fetches therapies and enriches each with:
 * - netRevenuePerSession: Price after payment processing fee deduction
 * - paymentFeePerSession: The fee amount per session
 * - feePercentage: The fee percentage used (from practice settings or default)
 *
 * @returns Array of therapies with net revenue metrics
 */
export async function getTherapiesWithMetrics(): Promise<TherapyWithMetrics[]> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[getTherapiesWithMetrics] Authentication error:', authError)
      return []
    }

    // Fetch therapies and practice settings in parallel
    const [therapiesResult, settingsResult] = await Promise.all([
      supabase
        .from('therapy_types')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('practice_settings')
        .select('payment_processing_fee_percentage')
        .eq('user_id', user.id)
        .single()
    ])

    if (therapiesResult.error) {
      console.error('Supabase error fetching therapies:', {
        message: therapiesResult.error.message,
        code: therapiesResult.error.code,
        details: therapiesResult.error.details,
        hint: therapiesResult.error.hint
      })
      return []
    }

    const therapies = therapiesResult.data || []

    // Use practice settings fee percentage if available, otherwise use default SumUp rate
    // Note: practice_settings stores percentage as decimal (e.g., 1.39), SUMUP_FEE_RATE is 0.0139
    const feePercentage = settingsResult.data?.payment_processing_fee_percentage ?? (SUMUP_FEE_RATE * 100)
    const feeRate = feePercentage / 100 // Convert percentage to decimal for calculations

    // Enrich each therapy with payment fee metrics
    const therapiesWithMetrics: TherapyWithMetrics[] = therapies.map((therapy) => {
      const pricePerSession = therapy.price_per_session
      const paymentFeePerSession = pricePerSession * feeRate
      const netRevenuePerSession = pricePerSession - paymentFeePerSession

      return {
        ...therapy,
        netRevenuePerSession,
        paymentFeePerSession,
        feePercentage
      }
    })

    return therapiesWithMetrics
  } catch (err) {
    console.error('Exception fetching therapies with metrics:', err)
    return []
  }
}
