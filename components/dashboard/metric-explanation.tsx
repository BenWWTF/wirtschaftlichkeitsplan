'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MetricExplanationProps {
  icon?: React.ReactNode
  title: string
  value: string | number
  unit?: string
  description: string
  benchmark?: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

/**
 * MetricExplanation Component
 *
 * Displays a metric with plain-language explanation of what it means,
 * a benchmark (if applicable), and an action button to navigate to the page
 * where the user can change this metric.
 *
 * Replaces confusing numbers with clear context and next steps.
 */
export function MetricExplanation({
  icon,
  title,
  value,
  unit,
  description,
  benchmark,
  actionLabel,
  actionHref,
  className
}: MetricExplanationProps) {
  return (
    <Card className={cn('border-l-4 border-l-blue-500', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            {icon && <div className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1">{icon}</div>}
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {title}
              </CardTitle>
            </div>
          </div>
          <Info className="h-4 w-4 text-neutral-400 flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Metric Value */}
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3">
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {value}
            {unit && <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400 ml-1">{unit}</span>}
          </div>
        </div>

        {/* Explanation */}
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {description}
        </p>

        {/* Benchmark */}
        {benchmark && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
              Benchmark
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {benchmark}
            </p>
          </div>
        )}

        {/* Action Button */}
        {actionLabel && actionHref && (
          <div className="pt-2">
            <Link href={actionHref} className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {actionLabel}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
