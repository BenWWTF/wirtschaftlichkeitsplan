'use client'

import type { ComparisonMode } from '@/lib/metrics/unified-metrics'

interface DataViewToggleProps {
  currentMode: 'prognose' | 'resultate'
  onModeChange: (mode: 'prognose' | 'resultate') => void
}

export function DataViewToggle({ currentMode, onModeChange }: DataViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-full p-1">
      <button
        onClick={() => onModeChange('prognose')}
        className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${
          currentMode === 'prognose'
            ? 'bg-accent-600 text-white shadow-sm'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <span>📋</span>
          <span>Prognose</span>
        </span>
      </button>
      <button
        onClick={() => onModeChange('resultate')}
        className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${
          currentMode === 'resultate'
            ? 'bg-green-500 text-white shadow-sm'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <span>✅</span>
          <span>Resultate</span>
        </span>
      </button>
    </div>
  )
}
