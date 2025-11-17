/**
 * Session Calculator
 * Pure functions for calculating session-related metrics
 */

import type { SessionMetrics } from '../types'

/**
 * Calculate session metrics (planned vs actual)
 * @param plannedSessions Number of sessions planned
 * @param actualSessions Number of sessions completed
 * @returns SessionMetrics with variance and utilization data
 */
export function calculateSessionMetrics(
  plannedSessions: number,
  actualSessions: number
): SessionMetrics {
  const variance = actualSessions - plannedSessions

  const variancePercent =
    plannedSessions > 0 ? (variance / plannedSessions) * 100 : 0

  const utilizationRate =
    plannedSessions > 0 ? (actualSessions / plannedSessions) * 100 : 0

  return {
    plannedSessions,
    actualSessions,
    variance,
    variancePercent,
    utilizationRate
  }
}

/**
 * Calculate total sessions from an array of session counts
 * @param sessionCounts Array of session counts
 * @returns Total sessions
 */
export function calculateTotalSessions(sessionCounts: number[]): number {
  return sessionCounts.reduce((sum, count) => sum + count, 0)
}

/**
 * Calculate average sessions per therapy type
 * @param totalSessions Total number of sessions
 * @param therapyCount Number of therapy types
 * @returns Average sessions per therapy type
 */
export function calculateAverageSessionsPerTherapy(
  totalSessions: number,
  therapyCount: number
): number {
  if (therapyCount === 0) return 0
  return totalSessions / therapyCount
}

/**
 * Check if sessions meet minimum threshold
 * @param actualSessions Actual sessions completed
 * @param minSessions Minimum required sessions
 * @returns true if minimum is met
 */
export function isMeetingMinimum(
  actualSessions: number,
  minSessions: number
): boolean {
  return actualSessions >= minSessions
}

/**
 * Calculate percentage of planned sessions achieved
 * @param plannedSessions Planned sessions
 * @param actualSessions Actual sessions
 * @returns Percentage (0-100+)
 */
export function calculateAchievementPercent(
  plannedSessions: number,
  actualSessions: number
): number {
  if (plannedSessions === 0) {
    return actualSessions > 0 ? 100 : 0
  }
  return (actualSessions / plannedSessions) * 100
}
