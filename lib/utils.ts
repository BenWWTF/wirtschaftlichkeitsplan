import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parse } from 'date-fns'
import { de } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number as Austrian Euro currency (€1.234,56)
 */
export function formatEuro(amount: number, includeSymbol = true): string {
  return new Intl.NumberFormat('de-AT', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format number with Austrian locale (1.234,56)
 */
export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('de-AT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

/**
 * Format date as Austrian format (DD.MM.YYYY)
 */
export function formatDate(date: Date | string, formatStr = 'dd.MM.yyyy'): string {
  const dateObj = typeof date === 'string' ? parse(date, 'yyyy-MM-dd', new Date()) : date
  return format(dateObj, formatStr, { locale: de })
}

/**
 * Format date as month label (z.B. November 2024)
 */
export function formatMonthLabel(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parse(date, 'yyyy-MM-dd', new Date()) : date
  return format(dateObj, 'MMMM yyyy', { locale: de })
}

/**
 * Get first day of month as YYYY-MM-DD
 */
export function getFirstDayOfMonth(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse month string (YYYY-MM-DD) to month label
 */
export function parseMonthString(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return formatMonthLabel(date)
}

/**
 * Calculate break-even analysis for a therapy type
 */
export function calculateBreakEven(
  pricePerSession: number,
  variableCostPerSession: number,
  fixedCostsMonthly: number
) {
  const contributionMargin = pricePerSession - variableCostPerSession

  if (contributionMargin <= 0) {
    return {
      sessionsNeeded: null,
      revenueNeeded: null,
      contributionMarginPercent: 0,
      profitPerSession: contributionMargin,
      isViable: false,
      message: 'Variable Kosten übersteigen Preis - nicht wirtschaftlich'
    }
  }

  const sessionsNeeded = Math.ceil(fixedCostsMonthly / contributionMargin)
  const revenueNeeded = sessionsNeeded * pricePerSession

  return {
    sessionsNeeded,
    revenueNeeded,
    contributionMarginPercent: (contributionMargin / pricePerSession) * 100,
    profitPerSession: contributionMargin,
    isViable: true,
    message: `${sessionsNeeded} Sitzungen/Monat benötigt`
  }
}

/**
 * Calculate total monthly revenue from therapy sessions
 */
export function calculateMonthlyRevenue(
  therapyData: Array<{
    price_per_session: number
    planned_sessions: number
  }>
): number {
  return therapyData.reduce((total, therapy) => {
    return total + therapy.price_per_session * therapy.planned_sessions
  }, 0)
}

/**
 * Calculate month-over-month growth
 */
export function calculateMoMGrowth(current: number, previous: number) {
  if (previous === 0) return null
  const percentChange = ((current - previous) / previous) * 100
  return {
    absolute: current - previous,
    percent: parseFloat(percentChange.toFixed(2)),
    isFavorable: percentChange > 0
  }
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Calculate simple moving average
 */
export function calculateSMA(data: number[], periods: number): (number | null)[] {
  return data.map((_, index) => {
    if (index < periods - 1) return null
    const slice = data.slice(index - periods + 1, index + 1)
    return slice.reduce((sum, val) => sum + val, 0) / periods
  })
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '…'
}

/**
 * Get color based on trend (positive/negative)
 */
export function getTrendColor(value: number): 'green' | 'red' | 'gray' {
  if (value > 0) return 'green'
  if (value < 0) return 'red'
  return 'gray'
}
