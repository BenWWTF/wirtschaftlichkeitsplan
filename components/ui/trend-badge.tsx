'use client'

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

type TrendDirection = 'up' | 'down' | 'neutral'
type TrendSeverity = 'positive' | 'negative' | 'neutral' | 'warning'

interface TrendBadgeProps {
  /**
   * Trend direction
   */
  trend: TrendDirection

  /**
   * Percentage change
   */
  percentage: number

  /**
   * Visual severity (overrides trend-based color if set)
   */
  severity?: TrendSeverity

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Show icon
   */
  showIcon?: boolean

  /**
   * Additional CSS class
   */
  className?: string

  /**
   * Custom label (overrides percentage display)
   */
  label?: string

  /**
   * Whether higher is better (for semantic coloring)
   */
  higherIsBetter?: boolean
}

/**
 * TrendBadge Component
 * Visual indicator showing trend direction with percentage change
 * Useful for KPI cards, comparisons, and analytics displays
 */
export function TrendBadge({
  trend,
  percentage,
  severity,
  size = 'md',
  showIcon = true,
  className = '',
  label,
  higherIsBetter = true
}: TrendBadgeProps) {
  // Determine color based on severity or trend + higherIsBetter logic
  const getColorClasses = () => {
    if (severity) {
      switch (severity) {
        case 'positive':
          return 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        case 'negative':
          return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        case 'warning':
          return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
        case 'neutral':
          return 'bg-neutral-50 dark:bg-neutral-950/20 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
        default:
          return 'bg-neutral-50 dark:bg-neutral-950/20 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
      }
    }

    // Determine color based on trend and higherIsBetter
    if (trend === 'neutral') {
      return 'bg-neutral-50 dark:bg-neutral-950/20 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
    }

    if (higherIsBetter) {
      return trend === 'up'
        ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    } else {
      return trend === 'down'
        ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  }

  // Get icon component
  const getIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'

    switch (trend) {
      case 'up':
        return <ArrowUp className={iconSize} />
      case 'down':
        return <ArrowDown className={iconSize} />
      case 'neutral':
        return <Minus className={iconSize} />
    }
  }

  // Format percentage display
  const formatPercentage = () => {
    if (label) return label
    const sign = trend === 'up' ? '+' : trend === 'down' ? '−' : ''
    return `${sign}${Math.abs(percentage).toFixed(1)}%`
  }

  return (
    <div
      className={`
        inline-flex items-center rounded-full font-semibold transition-all duration-200
        ${sizeClasses[size]}
        ${getColorClasses()}
        ${className}
      `}
    >
      {showIcon && getIcon()}
      <span>{formatPercentage()}</span>
    </div>
  )
}
