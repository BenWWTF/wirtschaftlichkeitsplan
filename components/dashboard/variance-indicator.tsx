'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface VarianceIndicatorProps {
  variance: number
  variancePercent: number
  achievement?: number
  size?: 'sm' | 'md' | 'lg'
  showPercent?: boolean
}

export function VarianceIndicator({
  variance,
  variancePercent,
  achievement = 0,
  size = 'md',
  showPercent = true,
}: VarianceIndicatorProps) {
  // Determine color based on achievement %
  const isPositive = variance > 0
  const isNegative = variance < 0
  const isZero = variance === 0

  // Color logic: green (>=100%), amber (90-99%), red (<90%)
  let colorClass = ''
  let bgColorClass = ''

  if (isZero) {
    colorClass = 'text-neutral-600 dark:text-neutral-400'
    bgColorClass = 'bg-neutral-100 dark:bg-neutral-800'
  } else if (achievement >= 100) {
    colorClass = 'text-green-700 dark:text-green-300'
    bgColorClass = 'bg-green-100 dark:bg-green-900/30'
  } else if (achievement >= 90) {
    colorClass = 'text-amber-700 dark:text-amber-300'
    bgColorClass = 'bg-amber-100 dark:bg-amber-900/30'
  } else {
    colorClass = 'text-red-700 dark:text-red-300'
    bgColorClass = 'bg-red-100 dark:bg-red-900/30'
  }

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const paddingClasses = {
    sm: 'px-2 py-1',
    md: 'px-2.5 py-1.5',
    lg: 'px-3 py-2',
  }

  return (
    <div
      className={`inline-flex items-center rounded-md ${paddingClasses[size]} ${bgColorClass} ${colorClass} font-medium whitespace-nowrap`}
      title={`Varianz: ${variance > 0 ? '+' : ''}${variance} (${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`}
    >
      {isNegative && <TrendingDown className={iconSizeClasses[size]} />}
      {isPositive && <TrendingUp className={iconSizeClasses[size]} />}
      {isZero && <Minus className={iconSizeClasses[size]} />}

      <span className={sizeClasses[size]}>
        {variance > 0 ? '+' : ''}
        {variance}
        {showPercent && ` (${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`}
      </span>
    </div>
  )
}
