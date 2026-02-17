'use client'

import { ReactNode, useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts'
import { CHART_COLORS } from './chart-config'

interface MetricCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  subtext?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
  /** Array of numbers to render as a sparkline inside the card */
  sparkline?: number[]
}

const SPARKLINE_COLORS: Record<string, string> = {
  default: CHART_COLORS.revenue,
  success: CHART_COLORS.profit,
  warning: '#F59E0B',
  danger: CHART_COLORS.loss,
}

export function MetricCard({
  label,
  value,
  icon,
  trend,
  subtext,
  variant = 'default',
  className = '',
  sparkline,
}: MetricCardProps) {
  const sparklineData = useMemo(() => {
    if (!sparkline || sparkline.length < 2) return null
    return sparkline.map((v) => ({ v }))
  }, [sparkline])

  const sparklineColor = SPARKLINE_COLORS[variant] || SPARKLINE_COLORS.default

  // Determine if sparkline trend is up or down
  const sparklineTrendUp = sparkline && sparkline.length >= 2
    ? sparkline[sparkline.length - 1] >= sparkline[0]
    : true

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      default:
        return 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
    }
  }

  const getLabelColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'danger':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-neutral-600 dark:text-neutral-400'
    }
  }

  return (
    <div className={`${getBackgroundColor()} rounded-lg border p-6 relative overflow-hidden ${className}`}>
      {/* Sparkline background */}
      {sparklineData && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 pointer-events-none" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparklineTrendUp ? CHART_COLORS.profit : CHART_COLORS.loss}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className={`text-sm font-medium ${getLabelColor()}`}>
            {label}
          </p>
          {icon && (
            <div className="text-neutral-400 dark:text-neutral-500">
              {icon}
            </div>
          )}
        </div>

        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {value}
        </p>

        {trend && (
          <p className={`text-sm mt-2 flex items-center gap-1 ${
            trend.isPositive
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </p>
        )}

        {subtext && !trend && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}
