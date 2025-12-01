'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'

export interface DateRange {
  startDate: string
  endDate: string
  label: string
}

interface QuickDateFiltersProps {
  onApply: (range: DateRange) => void
  isLoading?: boolean
}

export function QuickDateFilters({ onApply, isLoading = false }: QuickDateFiltersProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Calculate date ranges
  const today = new Date()
  const getDateString = (date: Date) => date.toISOString().split('T')[0]

  const getQuickFilters = useCallback(() => {
    const today = new Date()
    const todayStr = getDateString(today)

    // This week
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
    const weekStartStr = getDateString(weekStart)

    // This month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthStartStr = getDateString(monthStart)

    // Last month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    const lastMonthStartStr = getDateString(lastMonthStart)
    const lastMonthEndStr = getDateString(lastMonthEnd)

    // This year (YTD)
    const yearStart = new Date(today.getFullYear(), 0, 1)
    const yearStartStr = getDateString(yearStart)

    // Last 30 days
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    const thirtyDaysAgoStr = getDateString(thirtyDaysAgo)

    // Last 90 days
    const ninetyDaysAgo = new Date(today)
    ninetyDaysAgo.setDate(today.getDate() - 90)
    const ninetyDaysAgoStr = getDateString(ninetyDaysAgo)

    return [
      {
        label: 'Heute',
        startDate: todayStr,
        endDate: todayStr,
      },
      {
        label: 'Diese Woche',
        startDate: weekStartStr,
        endDate: todayStr,
      },
      {
        label: 'Diesen Monat',
        startDate: monthStartStr,
        endDate: todayStr,
      },
      {
        label: 'Letzter Monat',
        startDate: lastMonthStartStr,
        endDate: lastMonthEndStr,
      },
      {
        label: 'Letzte 30 Tage',
        startDate: thirtyDaysAgoStr,
        endDate: todayStr,
      },
      {
        label: 'Letzte 90 Tage',
        startDate: ninetyDaysAgoStr,
        endDate: todayStr,
      },
      {
        label: 'Dieses Jahr (YTD)',
        startDate: yearStartStr,
        endDate: todayStr,
      },
    ]
  }, [])

  const handleApplyCustom = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Bitte geben Sie Start- und Enddatum ein')
      return
    }

    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error('Startdatum muss vor Enddatum liegen')
      return
    }

    onApply({
      startDate: customStartDate,
      endDate: customEndDate,
      label: 'Benutzerdefiniert',
    })

    setIsCustomOpen(false)
    setCustomStartDate('')
    setCustomEndDate('')
  }

  const quickFilters = getQuickFilters()

  return (
    <div className="space-y-3">
      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Button
            key={filter.label}
            variant="outline"
            size="sm"
            onClick={() => onApply(filter)}
            disabled={isLoading}
            className="text-xs h-8"
          >
            {filter.label}
          </Button>
        ))}

        {/* Custom Date Range Button */}
        <Button
          variant={isCustomOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          disabled={isLoading}
          className="text-xs h-8"
        >
          <Calendar className="h-3 w-3 mr-1" />
          Benutzerdefiniert
        </Button>
      </div>

      {/* Custom Date Range Picker */}
      {isCustomOpen && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Startdatum
              </label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Enddatum
              </label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApplyCustom}
              disabled={isLoading}
              className="flex-1 h-8"
            >
              {isLoading ? 'Wird angewendet...' : 'Anwenden'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCustomOpen(false)
                setCustomStartDate('')
                setCustomEndDate('')
              }}
              className="flex-1 h-8"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Wählen Sie einen vordefinierten Zeitraum oder erstellen Sie einen benutzerdefinierten Filter.
      </p>
    </div>
  )
}
