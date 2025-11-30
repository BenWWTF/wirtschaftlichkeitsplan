/**
 * Revenue Calculator
 * Pure functions for calculating revenue-related metrics
 * Now includes payment processing fee deductions (e.g., SumUp 1.39%)
 */

import type { SessionRevenue } from '../types'
import { calculateNetPrice } from '../payment-fees'

/**
 * Calculate revenue from sessions and price per session
 * Core formula: revenue = sessions × price
 *
 * @param sessions Number of sessions completed
 * @param pricePerSession Price per individual session
 * @returns SessionRevenue with detailed breakdown
 */
export function calculateSessionRevenue(
  sessions: number,
  pricePerSession: number
): SessionRevenue {
  const revenue = sessions * pricePerSession

  return {
    revenue,
    sessions,
    pricePerSession,
    averagePrice: pricePerSession
  }
}

/**
 * Calculate total revenue from multiple therapy types
 * @param therapyData Array of {sessions, price} objects
 * @returns Total revenue across all therapies
 */
export function calculateTotalRevenue(
  therapyData: Array<{ sessions: number; price: number }>
): number {
  return therapyData.reduce((sum, therapy) => {
    return sum + therapy.sessions * therapy.price
  }, 0)
}

/**
 * Calculate average price per session across all therapies
 * @param therapyData Array of therapy revenue data
 * @returns Average price per session (weighted)
 */
export function calculateAveragePricePerSession(
  therapyData: Array<{ sessions: number; price: number }>
): number {
  const totalSessions = therapyData.reduce((sum, t) => sum + t.sessions, 0)
  const totalRevenue = calculateTotalRevenue(therapyData)

  if (totalSessions === 0) return 0
  return totalRevenue / totalSessions
}

/**
 * Calculate revenue per therapy type
 * @param therapyData Array of therapy objects with sessions and prices
 * @returns Array of revenue per therapy
 */
export function calculateRevenueByTherapy(
  therapyData: Array<{ id: string; sessions: number; price: number }>
): Array<{ id: string; revenue: number; sessions: number; price: number }> {
  return therapyData.map((therapy) => ({
    id: therapy.id,
    revenue: therapy.sessions * therapy.price,
    sessions: therapy.sessions,
    price: therapy.price
  }))
}

/**
 * Calculate the top revenue-generating therapy type
 * @param revenueByTherapy Array of {id, revenue}
 * @returns ID of therapy with highest revenue, or null
 */
export function getTopRevenueTherapy(
  revenueByTherapy: Array<{ id: string; revenue: number }>
): string | null {
  if (revenueByTherapy.length === 0) return null

  return revenueByTherapy.reduce((max, current) =>
    current.revenue > max.revenue ? current : max
  ).id
}

/**
 * Calculate revenue growth rate between two periods
 * @param currentRevenue Revenue in current period
 * @param previousRevenue Revenue in previous period
 * @returns Growth rate as percentage (-100 to +infinity)
 */
export function calculateRevenueGrowthRate(
  currentRevenue: number,
  previousRevenue: number
): number {
  if (previousRevenue === 0) {
    return currentRevenue > 0 ? 100 : 0
  }
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100
}

/**
 * Calculate revenue variance (actual vs planned)
 * @param actualRevenue Actual revenue earned
 * @param plannedRevenue Planned revenue target
 * @returns Variance in euros and percentage
 */
export function calculateRevenueVariance(
  actualRevenue: number,
  plannedRevenue: number
): { variance: number; variancePercent: number } {
  const variance = actualRevenue - plannedRevenue
  const variancePercent =
    plannedRevenue > 0 ? (variance / plannedRevenue) * 100 : 0

  return {
    variance,
    variancePercent
  }
}

/**
 * Calculate NET revenue after payment processing fee deduction
 * @param sessions Number of sessions completed
 * @param pricePerSession Gross price per session (before fees)
 * @param paymentFeePercentage Payment processing fee percentage (e.g., 1.39)
 * @returns SessionRevenue with net values after fees
 */
export function calculateSessionRevenueAfterFees(
  sessions: number,
  pricePerSession: number,
  paymentFeePercentage: number = 0
): SessionRevenue {
  const netPrice = calculateNetPrice(pricePerSession, paymentFeePercentage)
  const revenue = sessions * netPrice

  return {
    revenue,
    sessions,
    pricePerSession: netPrice,
    averagePrice: netPrice
  }
}

/**
 * Calculate total NET revenue from multiple therapy types after fees
 * @param therapyData Array of {sessions, price} objects
 * @param paymentFeePercentage Payment processing fee percentage
 * @returns Total net revenue across all therapies (after fees)
 */
export function calculateTotalRevenueAfterFees(
  therapyData: Array<{ sessions: number; price: number }>,
  paymentFeePercentage: number = 0
): number {
  return therapyData.reduce((sum, therapy) => {
    const netPrice = calculateNetPrice(therapy.price, paymentFeePercentage)
    return sum + therapy.sessions * netPrice
  }, 0)
}

/**
 * Calculate average NET price per session after fees (weighted)
 * @param therapyData Array of therapy revenue data
 * @param paymentFeePercentage Payment processing fee percentage
 * @returns Average net price per session
 */
export function calculateAveragePricePerSessionAfterFees(
  therapyData: Array<{ sessions: number; price: number }>,
  paymentFeePercentage: number = 0
): number {
  const totalSessions = therapyData.reduce((sum, t) => sum + t.sessions, 0)
  const totalNetRevenue = calculateTotalRevenueAfterFees(therapyData, paymentFeePercentage)

  if (totalSessions === 0) return 0
  return totalNetRevenue / totalSessions
}

/**
 * Calculate NET revenue per therapy type after fees
 * @param therapyData Array of therapy objects with sessions and prices
 * @param paymentFeePercentage Payment processing fee percentage
 * @returns Array of net revenue per therapy (after fees)
 */
export function calculateRevenueByTherapyAfterFees(
  therapyData: Array<{ id: string; sessions: number; price: number }>,
  paymentFeePercentage: number = 0
): Array<{ id: string; revenue: number; sessions: number; price: number }> {
  return therapyData.map((therapy) => {
    const netPrice = calculateNetPrice(therapy.price, paymentFeePercentage)
    return {
      id: therapy.id,
      revenue: therapy.sessions * netPrice,
      sessions: therapy.sessions,
      price: netPrice
    }
  })
}
