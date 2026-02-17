/**
 * Variance Alerts Component
 * Displays actionable alerts based on variance detection
 */

'use client'

import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useState } from 'react'
import type { VarianceAlert } from '@/lib/calculations'

interface VarianceAlertsProps {
  alerts: VarianceAlert[]
}

export function VarianceAlerts({ alerts }: VarianceAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id))

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
      case 'info':
        return 'bg-accent-50 dark:bg-accent-950/20 border-accent-200 dark:border-accent-800 text-accent-800 dark:text-accent-200'
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
      case 'info':
        return 'bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200'
    }
  }

  const dismissAlert = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          ⚠️ Attention Needed ({visibleAlerts.length})
        </h3>
      </div>

      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg border p-4 ${getSeverityColor(alert.severity)} transition-all duration-200`}
        >
          <div className="flex gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getSeverityIcon(alert.severity)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <p className="text-sm mt-1 opacity-90">{alert.message}</p>

                  {/* Variance Details */}
                  <div className="flex gap-4 mt-2 text-xs opacity-75 font-medium">
                    <span>
                      Variance: €{Math.abs(alert.variance).toFixed(2)} (
                      {alert.variancePercent > 0 ? '+' : ''}
                      {alert.variancePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Severity Badge */}
                <span
                  className={`inline-block flex-shrink-0 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getSeverityBadgeColor(alert.severity)}`}
                >
                  {alert.severity === 'critical' && '🔴'}
                  {alert.severity === 'warning' && '🟡'}
                  {alert.severity === 'info' && '🔵'}
                  {alert.severity.charAt(0).toUpperCase() +
                    alert.severity.slice(1)}
                </span>
              </div>

              {/* Action Items */}
              {alert.actionItems.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold opacity-75">
                    Recommended Actions:
                  </p>
                  <ul className="text-xs opacity-75 space-y-1 pl-4">
                    {alert.actionItems.slice(0, 2).map((item, idx) => (
                      <li key={idx} className="list-disc">
                        {item}
                      </li>
                    ))}
                    {alert.actionItems.length > 2 && (
                      <li className="text-xs opacity-60 italic">
                        +{alert.actionItems.length - 2} more action items
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => dismissAlert(alert.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {dismissedIds.size > 0 && (
        <button
          onClick={() => setDismissedIds(new Set())}
          className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 underline"
        >
          Show dismissed alerts ({dismissedIds.size})
        </button>
      )}
    </div>
  )
}
