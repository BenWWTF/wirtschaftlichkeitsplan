'use server'

import { createClient } from '@/utils/supabase/server'
import { logError } from '@/lib/utils/logger'
import type { MetricsResult, TherapyMetrics } from './metrics-result'
import { calculateMarginPercent } from './metrics-result'

/**
 * Calculate planned metrics from planned_sessions column
 * Represents the user's financial forecast
 *
 * @param userId - Authenticated user ID
 * @param monthYear - Month in YYYY-MM format
 * @returns Planned metrics for the specified month
 */
export async function getPlannedMetrics(
  userId: string,
  monthYear: string
): Promise<MetricsResult> {
  const supabase = await createClient()

  // Convert YYYY-MM to YYYY-MM-01 for database query
  const monthDate = monthYear.length === 7 ? `${monthYear}-01` : monthYear

  try {
    // Fetch monthly plans for the specified month
    const { data: plans, error: plansError } = await supabase
      .from('monthly_plans')
      .select('id, planned_sessions, therapy_type_id')
      .eq('user_id', userId)
      .eq('month', monthDate)

    if (plansError) {
      logError('getPlannedMetrics', 'Error fetching monthly plans', plansError, { userId, monthYear })
      throw plansError
    }

    // Return empty metrics if no plans exist
    if (!plans || plans.length === 0) {
      return createEmptyMetrics()
    }

    // Fetch therapy types to get pricing information
    const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]
    const { data: therapies, error: therapiesError } = await supabase
      .from('therapy_types')
      .select('id, name, price_per_session, variable_cost_per_session')
      .in('id', therapyTypeIds)

    if (therapiesError) {
      logError('getPlannedMetrics', 'Error fetching therapy types', therapiesError, { therapyTypeIds })
      throw therapiesError
    }

    if (!therapies || therapies.length === 0) {
      logError('getPlannedMetrics', 'No therapies found', new Error('Missing therapy types'), { therapyTypeIds })
      return createEmptyMetrics()
    }

    // Create therapy lookup map
    const therapyMap = Object.fromEntries(
      therapies.map(t => [t.id, t])
    )

    // Calculate metrics by therapy
    const byTherapy: TherapyMetrics[] = []
    let totalSessions = 0
    let totalRevenue = 0
    let totalVariableCosts = 0
    let totalMargin = 0

    for (const plan of plans) {
      const therapy = therapyMap[plan.therapy_type_id]

      if (!therapy) {
        logError('getPlannedMetrics', 'Therapy not found in map', new Error('Missing therapy'), {
          therapy_id: plan.therapy_type_id
        })
        continue
      }

      // Guard: Skip if planned_sessions is null or undefined
      const plannedSessions = plan.planned_sessions ?? 0

      const revenue = plannedSessions * therapy.price_per_session
      const variableCosts = plannedSessions * therapy.variable_cost_per_session
      const margin = revenue - variableCosts

      totalSessions += plannedSessions
      totalRevenue += revenue
      totalVariableCosts += variableCosts
      totalMargin += margin

      byTherapy.push({
        therapy_id: therapy.id,
        therapy_name: therapy.name,
        sessions: plannedSessions,
        price_per_session: therapy.price_per_session,
        revenue,
        variable_cost_per_session: therapy.variable_cost_per_session,
        variable_costs: variableCosts,
        margin,
        margin_percent: calculateMarginPercent(margin, revenue)
      })
    }

    // Calculate overall margin percentage
    const marginPercent = calculateMarginPercent(totalMargin, totalRevenue)

    // Determine break-even status (without expenses - that's handled at dashboard level)
    const breakEvenStatus: 'surplus' | 'breakeven' | 'deficit' =
      totalMargin > 0 ? 'surplus' : totalMargin === 0 ? 'breakeven' : 'deficit'

    return {
      total_sessions: totalSessions,
      total_revenue: totalRevenue,
      total_variable_costs: totalVariableCosts,
      total_margin: totalMargin,
      margin_percent: marginPercent,
      break_even_status: breakEvenStatus,
      by_therapy: byTherapy
    }

  } catch (error) {
    logError('getPlannedMetrics', 'Unexpected error in getPlannedMetrics', error, { userId, monthYear })
    return createEmptyMetrics()
  }
}

/**
 * Create empty metrics result for error/no-data scenarios
 */
function createEmptyMetrics(): MetricsResult {
  return {
    total_sessions: 0,
    total_revenue: 0,
    total_variable_costs: 0,
    total_margin: 0,
    margin_percent: 0,
    break_even_status: 'deficit',
    by_therapy: []
  }
}
