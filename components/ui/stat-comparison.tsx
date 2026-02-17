'use client'

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface StatComparisonProps {
  /**
   * Label for the statistic
   */
  label: string

  /**
   * Current/actual value
   */
  currentValue: number | string

  /**
   * Target/planned value
   */
  targetValue: number | string

  /**
   * Format function for display (e.g., formatEuro)
   */
  format?: (value: number | string) => string

  /**
   * Color scheme
   */
  color?: 'success' | 'warning' | 'error' | 'info'

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Show percentage variance
   */
  showVariance?: boolean

  /**
   * Show variance arrow
   */
  showArrow?: boolean

  /**
   * Whether higher is better (for variance direction)
   */
  higherIsBetter?: boolean
}

/**
 * StatComparison Component
 * Shows side-by-side comparison of current vs target values
 * with variance calculation and visual indicators
 */
export function StatComparison({
  label,
  currentValue,
  targetValue,
  format = (v) => String(v),
  color = 'info',
  size = 'md',
  showVariance = true,
  showArrow = true,
  higherIsBetter = true
}: StatComparisonProps) {
  // Convert to numbers for calculations
  const current = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue
  const target = typeof targetValue === 'string' ? parseFloat(targetValue) : targetValue

  // Calculate variance
  const variance = current - target
  const variancePercent = target !== 0 ? (variance / target) * 100 : 0
  const isExceeded = variance > 0

  // Determine variance color
  const getVarianceColor = () => {
    if (variancePercent === 0) return 'text-neutral-600 dark:text-neutral-400'

    if (higherIsBetter) {
      return isExceeded ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    } else {
      return isExceeded ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
    }
  }

  // Get arrow icon
  const getArrowIcon = () => {
    if (variancePercent === 0) {
      return <Minus className="h-4 w-4" />
    }

    if (higherIsBetter) {
      return isExceeded ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    } else {
      return isExceeded ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
    }
  }

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'gap-2',
      label: 'text-xs',
      value: 'text-sm font-bold',
      variance: 'text-xs'
    },
    md: {
      container: 'gap-3',
      label: 'text-sm',
      value: 'text-base font-bold',
      variance: 'text-sm'
    },
    lg: {
      container: 'gap-4',
      label: 'text-base',
      value: 'text-lg font-bold',
      variance: 'text-base'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={`flex flex-col ${classes.container}`}>
      {/* Label */}
      <div className={`${classes.label} font-medium text-neutral-600 dark:text-neutral-400`}>
        {label}
      </div>

      {/* Comparison Values */}
      <div className="flex items-center justify-between gap-4">
        {/* Current Value */}
        <div className="flex flex-col gap-1">
          <div className={`${classes.label} text-neutral-500 dark:text-neutral-500 uppercase tracking-wide`}>
            Aktuell
          </div>
          <div className={`${classes.value} text-accent-600 dark:text-accent-400`}>
            {format(currentValue)}
          </div>
        </div>

        {/* Divider */}
        <div className="text-neutral-300 dark:text-neutral-700">|</div>

        {/* Target Value */}
        <div className="flex flex-col gap-1">
          <div className={`${classes.label} text-neutral-500 dark:text-neutral-500 uppercase tracking-wide`}>
            Ziel
          </div>
          <div className={`${classes.value} text-neutral-600 dark:text-neutral-400`}>
            {format(targetValue)}
          </div>
        </div>
      </div>

      {/* Variance Information */}
      {showVariance && (
        <div className={`flex items-center gap-1 ${getVarianceColor()}`}>
          {showArrow && getArrowIcon()}
          <span className={`${classes.variance} font-semibold`}>
            {isExceeded ? '+' : ''}{variancePercent.toFixed(1)}% {variancePercent > 0 ? 'über' : 'unter'} Ziel
          </span>
        </div>
      )}
    </div>
  )
}
