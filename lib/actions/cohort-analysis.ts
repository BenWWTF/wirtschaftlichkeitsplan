'use server'

import { createClient } from '@/utils/supabase/server'

export interface CohortCell {
  value: number
  therapyId: string
  therapyName: string
  month: string
}

export interface CohortData {
  therapies: Array<{ id: string; name: string }>
  months: string[]
  data: Record<string, number[]> // therapyId -> array of values
  metric: 'revenue' | 'sessions' | 'margin' | 'occupancy'
  year: number
}

/**
 * Calculate cohort analysis for therapies over months
 */
export async function getCohortAnalysis(
  year: number,
  metric: 'revenue' | 'sessions' | 'margin' | 'occupancy' = 'revenue',
  monthCount: number = 12
): Promise<CohortData | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  try {
    // Fetch therapy types
    const { data: therapies } = await supabase
      .from('therapy_types')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (!therapies || therapies.length === 0) {
      return null
    }

    // Generate months
    const months: string[] = []
    const startDate = new Date(year, 0, 1)
    for (let i = 0; i < monthCount; i++) {
      const monthDate = new Date(year, i, 1)
      if (monthDate.getFullYear() === year) {
        months.push(monthDate.toLocaleString('de-DE', { month: 'short' }).toUpperCase())
      }
    }

    // Fetch all monthly plans for the year
    const { data: plans } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', user.id)
      .gte('month', `${year}-01-01`)
      .lte('month', `${year}-12-31`)

    // Fetch all expenses for the year
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('month', `${year}-01-01`)
      .lte('month', `${year}-12-31`)

    if (!plans || !expenses) {
      return null
    }

    // Build cohort data
    const cohortData: Record<string, number[]> = {}
    const therapyMap = new Map(therapies.map(t => [t.id, t]))

    // Initialize arrays
    therapies.forEach(therapy => {
      cohortData[therapy.id] = Array(monthCount).fill(0)
    })

    // Group plans by month
    const plansByMonth = new Map<string, typeof plans>()
    plans.forEach(plan => {
      const month = plan.month.substring(0, 7) // YYYY-MM
      if (!plansByMonth.has(month)) {
        plansByMonth.set(month, [])
      }
      plansByMonth.get(month)!.push(plan)
    })

    // Group expenses by month
    const expensesByMonth = new Map<string, typeof expenses>()
    expenses.forEach(exp => {
      const month = exp.month.substring(0, 7)
      if (!expensesByMonth.has(month)) {
        expensesByMonth.set(month, [])
      }
      expensesByMonth.get(month)!.push(exp)
    })

    // Calculate metrics for each therapy and month
    let monthIndex = 0
    for (let i = 0; i < monthCount; i++) {
      const monthDate = new Date(year, i, 1)
      const monthStr = monthDate.toISOString().split('T')[0].substring(0, 7)

      const monthPlans = plansByMonth.get(monthStr) || []
      const monthExps = expensesByMonth.get(monthStr) || []

      therapies.forEach(therapy => {
        const relevantPlans = monthPlans.filter(
          p => p.therapy_type_id === therapy.id
        )

        if (metric === 'revenue') {
          const value = relevantPlans.reduce((sum, plan) => {
            return sum + (plan.actual_sessions || 0) * therapy.price_per_session
          }, 0)
          cohortData[therapy.id][monthIndex] = value
        } else if (metric === 'sessions') {
          const value = relevantPlans.reduce((sum, plan) => {
            return sum + (plan.actual_sessions || 0)
          }, 0)
          cohortData[therapy.id][monthIndex] = value
        } else if (metric === 'margin') {
          const revenue = relevantPlans.reduce((sum, plan) => {
            return sum + (plan.actual_sessions || 0) * therapy.price_per_session
          }, 0)
          const cost = relevantPlans.reduce((sum, plan) => {
            return (
              sum + (plan.actual_sessions || 0) * therapy.variable_cost_per_session
            )
          }, 0)
          const totalExpenses = monthExps.reduce((sum, exp) => sum + (exp.amount || 0), 0)
          const margin = revenue - cost - totalExpenses
          const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0
          cohortData[therapy.id][monthIndex] = marginPercent
        } else if (metric === 'occupancy') {
          const occupancy = relevantPlans.reduce((sum, plan) => {
            const occ =
              plan.planned_sessions && plan.planned_sessions > 0
                ? (plan.actual_sessions || 0) / plan.planned_sessions
                : 0
            return sum + occ * 100
          }, 0)
          const avgOccupancy =
            relevantPlans.length > 0 ? occupancy / relevantPlans.length : 0
          cohortData[therapy.id][monthIndex] = avgOccupancy
        }
      })

      monthIndex++
    }

    return {
      therapies: therapies.map(t => ({ id: t.id, name: t.name })),
      months,
      data: cohortData,
      metric,
      year,
    }
  } catch (error) {
    console.error('[getCohortAnalysis] Error:', error)
    throw error
  }
}

/**
 * Calculate statistics for cohort data
 */
export function calculateCohortStats(values: number[]) {
  const filtered = values.filter(v => v > 0)
  if (filtered.length === 0) {
    return { min: 0, max: 0, avg: 0 }
  }

  return {
    min: Math.min(...filtered),
    max: Math.max(...filtered),
    avg: filtered.reduce((a, b) => a + b, 0) / filtered.length,
  }
}

/**
 * Get color intensity for heat map based on value
 */
export function getHeatMapColor(
  value: number,
  min: number,
  max: number,
  metric: string
): string {
  if (value === 0) return 'bg-neutral-50 dark:bg-neutral-900'

  // Normalize value between 0 and 1
  const range = max - min
  const normalized =
    range > 0
      ? (value - min) / range
      : 0.5

  // For metrics where lower is worse, invert
  const inverted =
    metric === 'margin' || metric === 'occupancy'
      ? normalized
      : normalized

  // Return color based on intensity
  if (inverted > 0.75) {
    return 'bg-green-200 dark:bg-green-900/40 text-green-900 dark:text-green-100'
  } else if (inverted > 0.5) {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
  } else if (inverted > 0.25) {
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100'
  } else {
    return 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100'
  }
}
