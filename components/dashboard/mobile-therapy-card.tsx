'use client'

import { useState } from 'react'
import { Pill, TrendingUp, Users, Euro, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getTouchTargetClasses } from '@/hooks/useTouchTarget'

interface MobileTherapyCardProps {
  id: string
  name: string
  price: number
  sessionsPerWeek?: number
  occupancyRate?: number
  revenue?: number
  margin?: number
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

/**
 * MobileTherapyCard Component
 *
 * Optimized card layout for displaying therapy types on mobile devices.
 *
 * Features:
 * - Compact card layout with key metrics visible
 * - Expandable section for detailed statistics
 * - Visual indicators for performance (occupancy, margin)
 * - Touch-optimized action buttons
 * - Color-coded performance tiers
 */
export function MobileTherapyCard({
  id,
  name,
  price,
  sessionsPerWeek,
  occupancyRate,
  revenue,
  margin,
  onEdit,
  onDelete,
  className,
}: MobileTherapyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)

  const formattedRevenue = revenue
    ? new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }).format(revenue)
    : null

  // Determine performance tier based on occupancy rate
  const getPerformanceTier = (rate?: number): 'high' | 'medium' | 'low' | null => {
    if (!rate) return null
    if (rate >= 80) return 'high'
    if (rate >= 60) return 'medium'
    return 'low'
  }

  const performanceTier = getPerformanceTier(occupancyRate)

  const tierColors = {
    high: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    low: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
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
      {/* Header: Name and Price */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-4 h-4 text-accent-600 dark:text-accent-400 flex-shrink-0" />
            <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {formattedPrice}
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              / Sitzung
            </span>
          </div>
        </div>

        {/* Performance Badge */}
        {performanceTier && (
          <div
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border',
              tierColors[performanceTier]
            )}
          >
            {occupancyRate?.toFixed(0)}%
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {sessionsPerWeek !== undefined && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Sitzungen/Woche
              </div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {sessionsPerWeek}
              </div>
            </div>
          </div>
        )}

        {formattedRevenue && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Umsatz
              </div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formattedRevenue}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Details Section */}
      {isExpanded && (
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {occupancyRate !== undefined && (
              <div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Auslastung
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {occupancyRate.toFixed(1)}%
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      performanceTier === 'high' && 'bg-green-500',
                      performanceTier === 'medium' && 'bg-yellow-500',
                      performanceTier === 'low' && 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {margin !== undefined && (
              <div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Gewinnmarge
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {margin.toFixed(1)}%
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        {/* Expand/Collapse Button */}
        {(occupancyRate !== undefined || margin !== undefined) && (
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

        {/* Edit Button */}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(id)}
            className={cn(
              'gap-2',
              getTouchTargetClasses('sm')
            )}
            aria-label="Therapie bearbeiten"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-sm">Bearbeiten</span>
          </Button>
        )}

        {/* Delete Button */}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className={cn(
              'gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
              'hover:bg-red-50 dark:hover:bg-red-900/20',
              getTouchTargetClasses('sm')
            )}
            aria-label="Therapie löschen"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
