'use client'

import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number | null
  previousValue?: string | number
  unit?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  onClick?: () => void
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  previousValue,
  unit,
  description,
  variant = 'default',
  onClick
}: KPICardProps) {
  // Determine trend direction and color
  const getTrendInfo = () => {
    if (trend === null || trend === undefined) {
      return { icon: Minus, color: 'text-neutral-500', bgColor: 'bg-neutral-100 dark:bg-neutral-800', label: 'No trend' }
    }
    if (trend > 1) {
      return { icon: ArrowUp, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', label: `+${trend.toFixed(1)}%` }
    }
    if (trend < -1) {
      return { icon: ArrowDown, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', label: `${trend.toFixed(1)}%` }
    }
    return { icon: Minus, color: 'text-neutral-500', bgColor: 'bg-neutral-100 dark:bg-neutral-800', label: 'Flat' }
  }

  const trendInfo = getTrendInfo()
  const TrendIcon = trendInfo.icon

  // Determine variant colors
  const variantColors = {
    default: 'border-neutral-200 dark:border-neutral-700',
    success: 'border-green-200 dark:border-green-900',
    warning: 'border-yellow-200 dark:border-yellow-900',
    danger: 'border-red-200 dark:border-red-900'
  }

  const variantBgColors = {
    default: 'bg-neutral-50 dark:bg-neutral-800/50',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'bg-red-50 dark:bg-red-900/20'
  }

  const variantIconColors = {
    default: 'text-neutral-600 dark:text-neutral-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-neutral-800 rounded-lg border ${variantColors[variant]}
        p-6 hover:shadow-lg transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {value}
            </h3>
            {unit && (
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {unit}
              </span>
            )}
          </div>
        </div>
        <div className={`${variantBgColors[variant]} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${variantIconColors[variant]}`} />
        </div>
      </div>

      {/* Trend Indicator */}
      {trend !== undefined && trend !== null && (
        <div className={`flex items-center gap-2 mb-3 ${trendInfo.bgColor} px-3 py-2 rounded-md w-fit`}>
          <TrendIcon className={`h-4 w-4 ${trendInfo.color}`} />
          <span className={`text-sm font-medium ${trendInfo.color}`}>
            {trendInfo.label}
          </span>
        </div>
      )}

      {/* Description or Previous Value */}
      {description && (
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      )}
      {previousValue && !description && (
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Previous: {previousValue}
        </p>
      )}
    </div>
  )
}
