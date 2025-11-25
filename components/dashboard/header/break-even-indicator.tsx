/**
 * Break-Even Indicator Component
 * Shows progress towards break-even and key financial health metric
 */

import { TrendingUp } from 'lucide-react'

interface BreakEvenIndicatorProps {
  netIncome: number
  targetBreakEven: number
  status: 'surplus' | 'breakeven' | 'deficit'
}

export function BreakEvenIndicator({
  netIncome,
  targetBreakEven,
  status
}: BreakEvenIndicatorProps) {
  const progressPercent = Math.min(
    100,
    Math.max(0, ((targetBreakEven + netIncome) / targetBreakEven) * 100)
  )

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'surplus':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      case 'breakeven':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
      case 'deficit':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
    }
  }

  const getTextColor = (s: string) => {
    switch (s) {
      case 'surplus':
        return 'text-green-600 dark:text-green-400'
      case 'breakeven':
        return 'text-amber-600 dark:text-amber-400'
      case 'deficit':
        return 'text-red-600 dark:text-red-400'
    }
  }

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'surplus':
        return 'Profitable'
      case 'breakeven':
        return 'At Break-Even'
      case 'deficit':
        return 'Below Break-Even'
    }
  }

  const amountToBreakEven = Math.max(0, targetBreakEven - netIncome)

  return (
    <div
      className={`${getStatusColor(status)} rounded-lg border p-6 transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Break-Even Status
          </p>
          <p className={`text-2xl font-bold mt-1 ${getTextColor(status)}`}>
            {getStatusLabel(status)}
          </p>
        </div>
        <TrendingUp className={`h-8 w-8 ${getTextColor(status)}`} />
      </div>

      {/* Net Income */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Net Income
          </span>
          <span className={`text-lg font-semibold ${getTextColor(status)}`}>
            €{netIncome.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Progress to Break-Even */}
      {status === 'deficit' && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              To Break-Even
            </span>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              €{amountToBreakEven.toFixed(2)} needed
            </span>
          </div>
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {progressPercent.toFixed(0)}% of break-even reached
          </p>
        </div>
      )}

      {/* Status Messages */}
      <div className="text-xs space-y-1 border-t border-neutral-200 dark:border-neutral-700 pt-4">
        {status === 'surplus' && (
          <p className="text-green-700 dark:text-green-300">
            ✓ Practice is profitable and operating above break-even
          </p>
        )}
        {status === 'breakeven' && (
          <p className="text-amber-700 dark:text-amber-300">
            ⚠ Practice is at break-even - monitor closely for sustainability
          </p>
        )}
        {status === 'deficit' && (
          <p className="text-red-700 dark:text-red-300">
            • Additional €{amountToBreakEven.toFixed(2)} revenue needed to break even
          </p>
        )}
      </div>
    </div>
  )
}
