'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getTouchTargetClasses } from '@/hooks/useTouchTarget'

interface MobileResultCardProps {
  month: string
  year: number
  plannedRevenue: number
  actualRevenue: number
  plannedSessions: number
  actualSessions: number
  variance?: number
  occupancyRate?: number
  onViewDetails?: () => void
  className?: string
}

/**
 * MobileResultCard Component
 *
 * Optimized card layout for displaying monthly results on mobile devices.
 *
 * Features:
 * - Compact display of planned vs actual metrics
 * - Visual variance indicators (positive/negative)
 * - Performance badges for occupancy
 * - Expandable section for detailed comparison
 * - Color-coded status indicators
 */
export function MobileResultCard({
  month,
  year,
  plannedRevenue,
  actualRevenue,
  plannedSessions,
  actualSessions,
  variance,
  occupancyRate,
  onViewDetails,
  className,
}: MobileResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const monthDate = new Date(year, parseInt(month) - 1, 1)
  const formattedMonth = format(monthDate, 'MMMM yyyy', { locale: de })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)

  const revenueVariance = actualRevenue - plannedRevenue
  const revenueVariancePercent = (revenueVariance / plannedRevenue) * 100
  const sessionsVariance = actualSessions - plannedSessions

  const isPositiveRevenue = revenueVariance >= 0
  const isPositiveSessions = sessionsVariance >= 0

  // Determine overall performance status
  const getPerformanceStatus = (): 'excellent' | 'good' | 'warning' | 'poor' => {
    if (revenueVariancePercent >= 10) return 'excellent'
    if (revenueVariancePercent >= 0) return 'good'
    if (revenueVariancePercent >= -10) return 'warning'
    return 'poor'
  }

  const performanceStatus = getPerformanceStatus()

  const statusColors = {
    excellent: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    good: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    poor: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  }

  const statusLabels = {
    excellent: 'Hervorragend',
    good: 'Gut',
    warning: 'Achtung',
    poor: 'Verbesserung nötig',
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg border bg-white dark:bg-neutral-900',
        'border-neutral-200 dark:border-neutral-800',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {/* Header: Month and Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-accent-600 dark:text-accent-400 flex-shrink-0" />
            <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {formattedMonth}
            </span>
          </div>
        </div>

        {/* Performance Status Badge */}
        <div
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium border',
            statusColors[performanceStatus]
          )}
        >
          {statusLabels[performanceStatus]}
        </div>
      </div>

      {/* Revenue Comparison */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Umsatz (Plan)
          </span>
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {formatCurrency(plannedRevenue)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Umsatz (Ist)
          </span>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {formatCurrency(actualRevenue)}
          </span>
        </div>

        {/* Variance Indicator */}
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg',
            isPositiveRevenue
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          )}
        >
          {isPositiveRevenue ? (
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
          <span
            className={cn(
              'text-sm font-semibold',
              isPositiveRevenue
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            )}
          >
            {isPositiveRevenue ? '+' : ''}
            {formatCurrency(revenueVariance)} ({revenueVariancePercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
            Sitzungen
          </div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {actualSessions} / {plannedSessions}
          </div>
          <div
            className={cn(
              'text-xs font-medium',
              isPositiveSessions
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {isPositiveSessions ? '+' : ''}
            {sessionsVariance}
          </div>
        </div>

        {occupancyRate !== undefined && (
          <div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              Auslastung
            </div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {occupancyRate.toFixed(1)}%
            </div>
            <div className="mt-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  occupancyRate >= 80 && 'bg-green-500',
                  occupancyRate >= 60 && occupancyRate < 80 && 'bg-yellow-500',
                  occupancyRate < 60 && 'bg-red-500'
                )}
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expandable Details Section */}
      {isExpanded && variance !== undefined && (
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-start gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Gesamtabweichung
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Die Abweichung vom Plan beträgt{' '}
                <span className="font-semibold">{variance.toFixed(1)}%</span>
                {'. '}
                {variance >= 0
                  ? 'Die Ziele wurden übertroffen.'
                  : 'Die Ziele wurden nicht erreicht.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        {/* Expand/Collapse Button */}
        {variance !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex-1 gap-2',
              getTouchTargetClasses('sm')
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm">Weniger</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm">Details</span>
              </>
            )}
          </Button>
        )}

        {/* View Full Details Button */}
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className={cn(
              'gap-2',
              getTouchTargetClasses('sm')
            )}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Vollansicht</span>
          </Button>
        )}
      </div>
    </div>
  )
}
