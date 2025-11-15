/**
 * Context Toggle Component
 * Allows users to switch between different time scopes (month/quarter/year/allTime)
 */

'use client'

import { useState } from 'react'
import type { MetricsScope, ComparisonMode } from '@/lib/metrics/unified-metrics'

interface ContextToggleProps {
  currentScope: MetricsScope
  currentComparisonMode: ComparisonMode
  onScopeChange: (scope: MetricsScope) => void
  onComparisonModeChange: (mode: ComparisonMode) => void
}

export function ContextToggle({
  currentScope,
  currentComparisonMode,
  onScopeChange,
  onComparisonModeChange
}: ContextToggleProps) {
  const scopes: Array<{ value: MetricsScope; label: string; description: string }> = [
    { value: 'month', label: 'Month', description: 'Current month' },
    { value: 'quarter', label: 'Quarter', description: 'This quarter' },
    { value: 'year', label: 'Year', description: 'Year to date' },
    { value: 'allTime', label: 'All Time', description: 'Complete history' }
  ]

  const comparisonModes: Array<{ value: ComparisonMode; label: string; description: string }> = [
    { value: 'none', label: 'None', description: 'No comparison' },
    { value: 'plan', label: 'Plan', description: 'vs Planned' },
    { value: 'lastPeriod', label: 'Last Period', description: 'vs Previous' },
    { value: 'lastYear', label: 'Last Year', description: 'vs Last Year' }
  ]

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4">
      {/* Scope Selection */}
      <div>
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block mb-3">
          View Data By
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {scopes.map((scope) => (
            <button
              key={scope.value}
              onClick={() => onScopeChange(scope.value)}
              className={`relative group py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentScope === scope.value
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
              title={scope.description}
            >
              {scope.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Mode Selection */}
      <div>
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block mb-3">
          Compare To
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {comparisonModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onComparisonModeChange(mode.value)}
              className={`relative group py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentComparisonMode === mode.value
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
              title={mode.description}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Help Text */}
      {currentComparisonMode !== 'none' && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          📊 Comparing {currentScope} data against{' '}
          {currentComparisonMode === 'plan'
            ? 'your plan'
            : currentComparisonMode === 'lastPeriod'
              ? 'previous period'
              : 'last year'}
        </p>
      )}
    </div>
  )
}
