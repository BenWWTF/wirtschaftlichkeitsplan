'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
}

/**
 * StatCard Component
 *
 * Displays a key metric or statistic in a card format with optional trend indicators.
 * Used across dashboard pages to show financial metrics.
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Gesamtumsatz"
 *   value="€ 2.500,00"
 *   icon={DollarSign}
 *   trend={{ value: 12.5, label: "+12.5% vs. letzter Monat" }}
 *   variant="success"
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  }

  const trendColors = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
  }

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </p>
        {Icon && <Icon className="h-5 w-5 text-neutral-400 dark:text-neutral-600" />}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {value}
        </p>
        {trend && (
          <p
            className={cn(
              'text-sm mt-2',
              trend.value >= 0 ? trendColors.success : trendColors.error
            )}
          >
            {trend.value >= 0 ? '↑' : '↓'} {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
