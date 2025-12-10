'use server'

import { getPlannedMetrics } from './planned-metrics'
import { getActualMetrics } from './actual-metrics'
import { logError } from '@/lib/utils/logger'

export interface MonthlyHistory {
  month: string // YYYY-MM format
  forecast_revenue: number
  actual_revenue: number
  forecast_sessions: number
  actual_sessions: number
}

/**
 * Get 12-month history of planned vs actual metrics
 * Used for trend analysis and charting
 *
 * @param userId - Authenticated user ID
 * @param endMonthYear - End month in YYYY-MM format (defaults to current month)
 * @returns Array of 12 months of historical data
 */
export async function get12MonthHistory(
  userId: string,
  endMonthYear?: string
): Promise<MonthlyHistory[]> {
  try {
    // Determine end month (current month if not specified)
    const endMonth = endMonthYear || new Date().toISOString().slice(0, 7)

    // Generate array of last 12 months (including current)
    const months = generateLast12Months(endMonth)

    // Fetch planned and actual metrics for all months in parallel
    const historyPromises = months.map(async (month) => {
      const [planned, actual] = await Promise.all([
        getPlannedMetrics(userId, month),
        getActualMetrics(userId, month)
      ])

      return {
        month,
        forecast_revenue: planned.total_revenue,
        actual_revenue: actual.total_revenue,
        forecast_sessions: planned.total_sessions,
        actual_sessions: actual.total_sessions
      }
    })

    const history = await Promise.all(historyPromises)

    return history

  } catch (error) {
    logError('get12MonthHistory', 'Error fetching 12-month history', error, { userId, endMonthYear })
    return []
  }
}

/**
 * Generate array of last 12 months in YYYY-MM format
 * @param endMonth - End month in YYYY-MM format
 * @returns Array of 12 month strings in chronological order
 */
function generateLast12Months(endMonth: string): string[] {
  const months: string[] = []
  const [year, month] = endMonth.split('-').map(Number)

  let currentYear = year
  let currentMonth = month

  // Generate 12 months going backwards from end month
  for (let i = 0; i < 12; i++) {
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    months.unshift(monthStr) // Add to beginning to maintain chronological order

    // Move to previous month
    currentMonth--
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    }
  }

  return months
}
