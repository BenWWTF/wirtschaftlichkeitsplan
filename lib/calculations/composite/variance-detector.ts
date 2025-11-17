/**
 * Variance Detector
 * Identifies deviations from plan and generates actionable alerts
 */

import type { VarianceAlert } from '../types'

export interface MetricsComparison {
  actualRevenue: number
  plannedRevenue: number
  actualExpenses: number
  plannedExpenses: number
  actualSessions: number
  plannedSessions: number
  therapyMetrics: Array<{
    id: string
    name: string
    actualSessions: number
    plannedSessions: number
    actualRevenue: number
    plannedRevenue: number
  }>
}

/**
 * Detect all variances and generate alerts
 * @param actual Current period metrics
 * @param plan Planned metrics for comparison
 * @returns Array of VarianceAlert objects
 */
export function detectVariances(
  actual: MetricsComparison,
  plan?: MetricsComparison
): VarianceAlert[] {
  if (!plan) return []

  const alerts: VarianceAlert[] = []

  // 1. Revenue Variance Detection
  const revenueVariance = actual.actualRevenue - plan.plannedRevenue
  const revenueVariancePercent =
    plan.plannedRevenue > 0
      ? (revenueVariance / plan.plannedRevenue) * 100
      : 0

  if (revenueVariancePercent < -15) {
    alerts.push({
      id: 'revenue-significantly-below',
      type: 'REVENUE_BELOW_PLAN',
      severity: 'critical',
      title: 'Revenue 15%+ Below Plan',
      message: `Expected €${plan.plannedRevenue.toFixed(2)}, achieved €${actual.actualRevenue.toFixed(2)}`,
      metric: 'total_revenue',
      currentValue: actual.actualRevenue,
      expectedValue: plan.plannedRevenue,
      variance: revenueVariance,
      variancePercent: revenueVariancePercent,
      actionItems: [
        'Review therapy session booking rates and cancellation trends',
        'Analyze pricing - consider if price adjustments needed',
        'Increase marketing and patient acquisition efforts',
        'Check for seasonal patterns or market changes'
      ]
    })
  } else if (revenueVariancePercent < -5) {
    alerts.push({
      id: 'revenue-below-plan',
      type: 'REVENUE_BELOW_PLAN',
      severity: 'warning',
      title: 'Revenue 5-15% Below Plan',
      message: `Expected €${plan.plannedRevenue.toFixed(2)}, achieved €${actual.actualRevenue.toFixed(2)}`,
      metric: 'total_revenue',
      currentValue: actual.actualRevenue,
      expectedValue: plan.plannedRevenue,
      variance: revenueVariance,
      variancePercent: revenueVariancePercent,
      actionItems: [
        'Monitor booking trends closely',
        'Consider targeted promotions for underperforming therapies'
      ]
    })
  } else if (revenueVariancePercent > 20) {
    alerts.push({
      id: 'revenue-above-plan',
      type: 'REVENUE_ABOVE_PLAN',
      severity: 'info',
      title: 'Revenue Exceeding Plan',
      message: `Expected €${plan.plannedRevenue.toFixed(2)}, achieved €${actual.actualRevenue.toFixed(2)}`,
      metric: 'total_revenue',
      currentValue: actual.actualRevenue,
      expectedValue: plan.plannedRevenue,
      variance: revenueVariance,
      variancePercent: revenueVariancePercent,
      actionItems: [
        'Analyze what drives outperformance - replicate success',
        'Consider if current capacity can handle increased demand',
        'Evaluate pricing power - might support further increases'
      ]
    })
  }

  // 2. Session Volume Variance
  const sessionVariance = actual.actualSessions - plan.plannedSessions
  const sessionVariancePercent =
    plan.plannedSessions > 0 ? (sessionVariance / plan.plannedSessions) * 100 : 0

  if (sessionVariancePercent < -20) {
    alerts.push({
      id: 'sessions-significantly-below',
      type: 'REVENUE_BELOW_PLAN',
      severity: 'critical',
      title: 'Session Volume 20%+ Below Plan',
      message: `Expected ${plan.plannedSessions} sessions, completed ${actual.actualSessions}`,
      metric: 'total_sessions',
      currentValue: actual.actualSessions,
      expectedValue: plan.plannedSessions,
      variance: sessionVariance,
      variancePercent: sessionVariancePercent,
      actionItems: [
        'Investigate patient dropout or cancellation reasons',
        'Review scheduling efficiency and slot utilization',
        'Check therapist availability and capacity'
      ]
    })
  }

  // 3. Expense Variance
  const expenseVariance = actual.actualExpenses - plan.plannedExpenses
  const expenseVariancePercent =
    plan.plannedExpenses > 0
      ? (expenseVariance / plan.plannedExpenses) * 100
      : 0

  if (expenseVariancePercent > 15) {
    alerts.push({
      id: 'expenses-over-budget',
      type: 'EXPENSE_OVERRUN',
      severity: 'critical',
      title: 'Expenses 15%+ Over Budget',
      message: `Budgeted €${plan.plannedExpenses.toFixed(2)}, spent €${actual.actualExpenses.toFixed(2)}`,
      metric: 'total_expenses',
      currentValue: actual.actualExpenses,
      expectedValue: plan.plannedExpenses,
      variance: expenseVariance,
      variancePercent: expenseVariancePercent,
      actionItems: [
        'Review cost breakdown - identify largest overruns',
        'Negotiate with suppliers for better rates',
        'Reduce non-essential spending',
        'Implement cost control measures'
      ]
    })
  }

  // 4. Therapy Type Variances
  actual.therapyMetrics.forEach((actualTherapy) => {
    const plannedTherapy = plan.therapyMetrics.find(
      (t) => t.id === actualTherapy.id
    )

    if (!plannedTherapy) return

    // Session utilization for this therapy
    const therapySessionVariance =
      actualTherapy.actualSessions - plannedTherapy.plannedSessions
    const therapySessionVariancePercent =
      plannedTherapy.plannedSessions > 0
        ? (therapySessionVariance / plannedTherapy.plannedSessions) * 100
        : 0

    // Underutilization alert - only if there are actual planned sessions
    if (therapySessionVariancePercent < -30 && plannedTherapy.plannedSessions > 0 && actualTherapy.actualSessions > 0) {
      alerts.push({
        id: `therapy-underutilized-${actualTherapy.id}`,
        type: 'THERAPY_UNDERUTILIZED',
        severity: 'warning',
        title: `${actualTherapy.name}: Only ${Math.abs(therapySessionVariancePercent).toFixed(0)}% Below Plan`,
        message: `Expected ${plannedTherapy.plannedSessions} sessions, got ${actualTherapy.actualSessions}`,
        metric: `therapy_${actualTherapy.id}_sessions`,
        currentValue: actualTherapy.actualSessions,
        expectedValue: plannedTherapy.plannedSessions,
        variance: therapySessionVariance,
        variancePercent: therapySessionVariancePercent,
        actionItems: [
          `Review ${actualTherapy.name} pricing - may be too high`,
          `Investigate patient demand for this therapy type`,
          `Update marketing for ${actualTherapy.name}`,
          'Consider adjusting therapist allocation to higher-demand types'
        ]
      })
    }

    // Opportunity (over-performance) alert
    if (therapySessionVariancePercent > 25) {
      alerts.push({
        id: `therapy-opportunity-${actualTherapy.id}`,
        type: 'THERAPY_OPPORTUNITY',
        severity: 'info',
        title: `${actualTherapy.name}: Growing Faster Than Expected (+${therapySessionVariancePercent.toFixed(0)}%)`,
        message: `Expected ${plannedTherapy.plannedSessions} sessions, achieved ${actualTherapy.actualSessions}`,
        metric: `therapy_${actualTherapy.id}_revenue`,
        currentValue: actualTherapy.actualRevenue,
        expectedValue: plannedTherapy.plannedRevenue,
        variance: actualTherapy.actualRevenue - plannedTherapy.plannedRevenue,
        variancePercent: therapySessionVariancePercent,
        actionItems: [
          `Consider expanding capacity for ${actualTherapy.name}`,
          'Allocate additional marketing budget to this therapy type',
          'Analyze success factors to replicate in other areas'
        ]
      })
    }
  })

  // Sort by severity: critical > warning > info
  const severityRank = { critical: 0, warning: 1, info: 2 }
  alerts.sort(
    (a, b) =>
      severityRank[a.severity] - severityRank[b.severity] ||
      Math.abs(b.variancePercent) - Math.abs(a.variancePercent)
  )

  return alerts
}

/**
 * Get summary of variance alerts
 * @param alerts Array of variance alerts
 * @returns Summary counts
 */
export function getVarianceSummary(alerts: VarianceAlert[]): {
  total: number
  critical: number
  warnings: number
  opportunities: number
} {
  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warnings: alerts.filter((a) => a.severity === 'warning').length,
    opportunities: alerts.filter((a) => a.severity === 'info').length
  }
}

/**
 * Check if a critical issue exists that needs immediate attention
 * @param alerts Array of variance alerts
 * @returns true if critical alerts exist
 */
export function hasCriticalIssues(alerts: VarianceAlert[]): boolean {
  return alerts.some((a) => a.severity === 'critical')
}
