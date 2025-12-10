/**
 * Shared metrics result interface
 * Used by both planned-metrics.ts and actual-metrics.ts
 * Ensures parallel structure between forecast and results calculations
 */

export interface MetricsResult {
  total_sessions: number
  total_revenue: number
  total_variable_costs: number
  total_margin: number
  margin_percent: number
  break_even_status: 'surplus' | 'breakeven' | 'deficit'
  by_therapy: TherapyMetrics[]
}

export interface TherapyMetrics {
  therapy_id: string
  therapy_name: string
  sessions: number
  price_per_session: number
  revenue: number
  variable_cost_per_session: number
  variable_costs: number
  margin: number
  margin_percent: number
}

/**
 * Helper function to determine break-even status
 */
export function calculateBreakEvenStatus(
  margin: number,
  expenses: number
): 'surplus' | 'breakeven' | 'deficit' {
  const netIncome = margin - expenses

  if (netIncome > 0) return 'surplus'
  if (netIncome === 0) return 'breakeven'
  return 'deficit'
}

/**
 * Helper function to calculate margin percentage
 */
export function calculateMarginPercent(margin: number, revenue: number): number {
  if (revenue === 0) return 0
  return (margin / revenue) * 100
}
