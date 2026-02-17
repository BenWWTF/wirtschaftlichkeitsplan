'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { TherapyMetrics } from '@/lib/actions/dashboard'

interface TherapyFilterProps {
  therapies: TherapyMetrics[]
  onFilterChange: (selectedTherapyIds: string[]) => void
}

export function TherapyFilter({ therapies, onFilterChange }: TherapyFilterProps) {
  const [selectedTherapies, setSelectedTherapies] = useState<string[]>([])
  const [showFilter, setShowFilter] = useState(false)

  // Extract unique therapy types
  const uniqueTherapies = Array.from(
    new Map(therapies.map((t) => [t.therapy_id, { id: t.therapy_id, name: t.therapy_name }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const handleTherapyToggle = (therapyId: string) => {
    const newSelected = selectedTherapies.includes(therapyId)
      ? selectedTherapies.filter((id) => id !== therapyId)
      : [...selectedTherapies, therapyId]

    setSelectedTherapies(newSelected)
    onFilterChange(newSelected)
  }

  const handleClearAll = () => {
    setSelectedTherapies([])
    onFilterChange([])
  }

  const getFilterLabel = (): string => {
    if (selectedTherapies.length === 0) {
      return 'Alle Therapien'
    }
    if (selectedTherapies.length === 1) {
      const therapy = uniqueTherapies.find((t) => t.id === selectedTherapies[0])
      return therapy?.name || 'Filter'
    }
    return `${selectedTherapies.length} Therapien`
  }

  return (
    <div className="relative flex items-center gap-2">
      <Filter className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />

      <div className="flex items-center gap-2">
        <Button
          variant={selectedTherapies.length > 0 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilter(!showFilter)}
          className="text-xs"
          aria-label={`Therapien filtern. ${getFilterLabel()} ausgewählt`}
          aria-haspopup="dialog"
          aria-expanded={showFilter}
        >
          {getFilterLabel()}
          {selectedTherapies.length > 0 && (
            <X className="h-3 w-3 ml-1 opacity-70" />
          )}
        </Button>

        {/* Live region for filter status announcements */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          role="status"
        >
          {selectedTherapies.length === 0
            ? 'Alle Therapien angezeigt'
            : `${selectedTherapies.length} von ${uniqueTherapies.length} Therapien ausgewählt`
          }
        </div>
      </div>

      {showFilter && (
        <div className="absolute top-full mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 z-[60] min-w-64 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              Therapien filtern
            </span>
            {selectedTherapies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-xs"
              >
                Löschen
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uniqueTherapies.length === 0 ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center py-2">
                Keine Therapien verfügbar
              </p>
            ) : (
              uniqueTherapies.map((therapy) => (
                <label
                  key={therapy.id}
                  className="flex items-center gap-3 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedTherapies.includes(therapy.id)}
                    onCheckedChange={() => handleTherapyToggle(therapy.id)}
                    id={therapy.id}
                    aria-label={`${therapy.name} ${selectedTherapies.includes(therapy.id) ? 'ausgewählt' : 'nicht ausgewählt'}`}
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {therapy.name}
                  </span>
                </label>
              ))
            )}
          </div>

          {selectedTherapies.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400">
              {selectedTherapies.length} von {uniqueTherapies.length} ausgewählt
            </div>
          )}
        </div>
      )}

      {showFilter && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowFilter(false)}
        />
      )}
    </div>
  )
}
