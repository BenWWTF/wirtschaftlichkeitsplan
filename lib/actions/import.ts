'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthUserId } from '@/lib/utils/auth'
import type { SessionImportRow, ImportResult } from '@/lib/types/import'

/**
 * Process session import data
 * Maps sessions to therapy types and updates monthly_plans
 */
export async function processSessionImport(
  sessions: SessionImportRow[]
): Promise<ImportResult> {
  const userId = await getAuthUserId()
  const supabase = await createClient()
  const errors: any[] = []
  const warnings: any[] = []
  let imported_count = 0
  let skipped_count = 0

  try {
    // Step 1: Get all existing therapy types for the user
    const { data: therapyTypes, error: therapyError } = await supabase
      .from('therapy_types')
      .select('id, name, price_per_session')
      .eq('user_id', userId)

    if (therapyError) {
      return {
        success: false,
        imported_count: 0,
        skipped_count: sessions.length,
        errors: [{ row: 0, message: `Database error: ${therapyError.message}` }],
        warnings: []
      }
    }

    // Create a map for quick lookup (case-insensitive)
    const therapyMap = new Map(
      therapyTypes?.map(t => [t.name.toLowerCase(), t]) || []
    )

    // Step 2: Group sessions by month and therapy type
    const monthlyData = new Map<string, Map<string, { planned: number; actual: number; revenue: number }>>()

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i]
      const month = session.date.slice(0, 7) // Extract YYYY-MM
      const therapyName = session.therapy_type.toLowerCase()

      // Check if therapy type exists
      const therapy = therapyMap.get(therapyName)
      if (!therapy) {
        warnings.push({
          row: i + 1,
          message: `Therapy type "${session.therapy_type}" not found. Please create it first in therapy management.`,
          data: { therapy_type: session.therapy_type }
        })
        skipped_count++
        continue
      }

      // Initialize month data if needed
      if (!monthlyData.has(month)) {
        monthlyData.set(month, new Map())
      }

      const monthMap = monthlyData.get(month)!
      const therapyId = therapy.id

      // Initialize therapy data for this month
      if (!monthMap.has(therapyId)) {
        monthMap.set(therapyId, { planned: 0, actual: 0, revenue: 0 })
      }

      const data = monthMap.get(therapyId)!
      data.actual += session.sessions
      data.revenue += session.revenue || (session.sessions * therapy.price_per_session)

      imported_count++
    }

    // Step 3: Update or create monthly_plans entries
    for (const [month, therapyData] of monthlyData.entries()) {
      for (const [therapyId, data] of therapyData.entries()) {
        // Check if monthly plan exists
        const { data: existingPlan, error: planError } = await supabase
          .from('monthly_plans')
          .select('id, planned_sessions')
          .eq('user_id', userId)
          .eq('therapy_type_id', therapyId)
          .eq('month', month)
          .maybeSingle()

        if (planError) {
          errors.push({
            row: 0,
            message: `Error checking monthly plan: ${planError.message}`,
            data: { month, therapyId }
          })
          continue
        }

        if (existingPlan) {
          // Update existing plan with actual sessions
          const { error: updateError } = await supabase
            .from('monthly_plans')
            .update({
              actual_sessions: data.actual,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPlan.id)

          if (updateError) {
            errors.push({
              row: 0,
              message: `Error updating monthly plan: ${updateError.message}`,
              data: { month, therapyId }
            })
          }
        } else {
          // Create new monthly plan with actual sessions
          const { error: insertError } = await supabase
            .from('monthly_plans')
            .insert({
              user_id: userId,
              therapy_type_id: therapyId,
              month,
              planned_sessions: 0, // No planning data, just actuals
              actual_sessions: data.actual,
              notes: 'Imported from practice software'
            })

          if (insertError) {
            errors.push({
              row: 0,
              message: `Error creating monthly plan: ${insertError.message}`,
              data: { month, therapyId }
            })
          }
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/berichte')
    revalidatePath('/dashboard/analyse')
    revalidatePath('/dashboard/planung')
    revalidatePath('/dashboard')

    return {
      success: errors.length === 0,
      imported_count,
      skipped_count,
      errors,
      warnings
    }
  } catch (error) {
    return {
      success: false,
      imported_count: 0,
      skipped_count: sessions.length,
      errors: [{
        row: 0,
        message: error instanceof Error ? error.message : 'Unknown error during import'
      }],
      warnings: []
    }
  }
}

/**
 * Get import templates
 */
export async function getImportTemplates() {
  return {
    standard: 'Date,Therapy Type,Sessions,Revenue,Patient Type,Notes\n2025-01-15,Psychotherapie,3,240,privat,Einzelsitzungen\n2025-01-16,Gruppentherapie,1,120,kasse,',
    latido: 'Datum,Leistung,Anzahl,Betrag,Patientenart,Notizen\n15.01.2025,Psychotherapie,3,240.00,Privat,Einzelsitzungen\n16.01.2025,Gruppentherapie,1,120.00,Kasse,'
  }
}

/**
 * Validate therapy types before import
 * Returns list of therapy types in import that don't exist in database
 */
export async function validateTherapyTypes(
  therapyNames: string[]
): Promise<{ missing: string[]; existing: string[] }> {
  const userId = await getAuthUserId()
  const supabase = await createClient()

  const { data: therapyTypes } = await supabase
    .from('therapy_types')
    .select('name')
    .eq('user_id', userId)

  const existingNames = new Set(
    therapyTypes?.map(t => t.name.toLowerCase()) || []
  )

  const missing: string[] = []
  const existing: string[] = []

  for (const name of therapyNames) {
    if (existingNames.has(name.toLowerCase())) {
      existing.push(name)
    } else {
      missing.push(name)
    }
  }

  return { missing, existing }
}
