/**
 * Viability Calculator
 * Calculates overall practice viability score based on multiple metrics
 */

import type { ViabilityScore } from '../types'

export interface ViabilityInput {
  totalRevenue: number
  totalExpenses: number
  totalSessions: number
  targetSessions: number
  therapyCount: number
  activeTherapyCount: number
}

/**
 * Calculate viability score (0-100)
 * Weighted composite of:
 * - Revenue Ratio (40%): revenue / expenses
 * - Therapy Utilization (30%): active therapies / total therapies
 * - Session Utilization (20%): actual sessions / target sessions
 * - Expense Management (10%): (revenue - expenses) / revenue
 *
 * @param input Viability metrics input
 * @returns ViabilityScore with detailed breakdown
 */
export function calculateViabilityScore(input: ViabilityInput): ViabilityScore {
  // 1. Revenue Ratio (40%)
  // How well revenue covers expenses
  const revenueRatio =
    input.totalExpenses > 0 ? input.totalRevenue / input.totalExpenses : 0
  const revenueRatioScore = Math.min(revenueRatio * 100, 100) // Cap at 100

  // 2. Therapy Utilization (30%)
  // Percentage of available therapies being actively used
  const therapyUtilization =
    input.therapyCount > 0
      ? (input.activeTherapyCount / input.therapyCount) * 100
      : 0

  // 3. Session Utilization (20%)
  // Actual sessions vs target sessions
  const sessionUtilization =
    input.targetSessions > 0
      ? (input.totalSessions / input.targetSessions) * 100
      : 0
  const cappedSessionUtilization = Math.min(sessionUtilization, 100)

  // 4. Expense Management (10%)
  // Profitability as percentage of revenue
  // Shift to 0-100 range: net_income/revenue becomes 0-100 when profit_margin is -100% to +100%
  const profitMarginPercent =
    input.totalRevenue > 0
      ? ((input.totalRevenue - input.totalExpenses) / input.totalRevenue) * 100
      : -100
  const expenseManagementScore = profitMarginPercent + 100 // Convert -100..100 to 0..200, then we'll cap it

  // Calculate weighted score
  const weightedScore =
    revenueRatioScore * 0.4 +
    therapyUtilization * 0.3 +
    cappedSessionUtilization * 0.2 +
    Math.min(expenseManagementScore * 0.5, 100) * 0.1 // Cap expense component

  // Normalize final score to 0-100
  const score = Math.min(100, Math.max(0, weightedScore))

  // Determine status based on score
  let status: 'critical' | 'caution' | 'healthy'
  if (score < 40) {
    status = 'critical'
  } else if (score < 70) {
    status = 'caution'
  } else {
    status = 'healthy'
  }

  return {
    score,
    revenueRatio,
    therapyUtilization,
    sessionUtilization: cappedSessionUtilization,
    expenseManagement: Math.max(0, profitMarginPercent),
    status
  }
}

/**
 * Get human-readable interpretation of viability score
 * @param score Viability score (0-100)
 * @returns Description of viability status
 */
export function getViabilityInterpretation(score: number): string {
  if (score < 20) {
    return 'Practice is not viable - immediate action required'
  } else if (score < 40) {
    return 'Critical concerns - significant changes needed'
  } else if (score < 60) {
    return 'Below target - requires attention'
  } else if (score < 80) {
    return 'Acceptable but room for improvement'
  } else {
    return 'Strong viability and growth potential'
  }
}

/**
 * Identify the primary constraint limiting viability
 * @param input Viability metrics input
 * @returns Description of the primary limiting factor
 */
export function identifyPrimaryConstraint(input: ViabilityInput): string {
  const revenueRatio =
    input.totalExpenses > 0 ? input.totalRevenue / input.totalExpenses : 0
  const therapyUtilization =
    input.therapyCount > 0
      ? (input.activeTherapyCount / input.therapyCount) * 100
      : 0
  const sessionUtilization =
    input.targetSessions > 0
      ? (input.totalSessions / input.targetSessions) * 100
      : 0

  const constraints = [
    { name: 'Revenue Coverage', score: Math.min(revenueRatio * 100, 100) },
    { name: 'Therapy Utilization', score: therapyUtilization },
    { name: 'Session Volume', score: sessionUtilization }
  ]

  // Find constraint with lowest score
  const primary = constraints.reduce((min, current) =>
    current.score < min.score ? current : min
  )

  return primary.name
}

/**
 * Calculate what improvement is needed to reach a target score
 * @param currentInput Current metrics
 * @param targetScore Target viability score
 * @returns Object describing what needs to change
 */
export function calculateImprovementPath(
  currentInput: ViabilityInput,
  targetScore: number = 75
): {
  currentScore: number
  targetScore: number
  revenueNeeded: number
  expenseReductionNeeded: number
  additionalSessions: number
  feasibility: 'easy' | 'moderate' | 'difficult'
} {
  const currentScore = calculateViabilityScore(currentInput).score

  if (currentScore >= targetScore) {
    return {
      currentScore,
      targetScore,
      revenueNeeded: 0,
      expenseReductionNeeded: 0,
      additionalSessions: 0,
      feasibility: 'easy'
    }
  }

  // Estimate what's needed
  const revenueNeeded = currentInput.totalExpenses * 1.2 - currentInput.totalRevenue
  const expenseReductionNeeded = currentInput.totalExpenses * 0.2
  const sessionDeficit = currentInput.targetSessions - currentInput.totalSessions
  const additionalSessions = Math.max(0, sessionDeficit)

  // Determine feasibility
  let feasibility: 'easy' | 'moderate' | 'difficult' = 'moderate'
  if (revenueNeeded < currentInput.totalRevenue * 0.1) {
    feasibility = 'easy'
  } else if (revenueNeeded > currentInput.totalRevenue * 0.5) {
    feasibility = 'difficult'
  }

  return {
    currentScore,
    targetScore,
    revenueNeeded: Math.max(0, revenueNeeded),
    expenseReductionNeeded: Math.max(0, expenseReductionNeeded),
    additionalSessions,
    feasibility
  }
}
