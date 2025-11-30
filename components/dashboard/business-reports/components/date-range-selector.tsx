'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void
}

export function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps) {
  const [selectedRange, setSelectedRange] = useState('3months')
  const [showCustom, setShowCustom] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const getDateRange = (months: number): { startDate: Date; endDate: Date } => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(1)
    return { startDate, endDate }
  }

  const handleRangeSelect = (months: number, rangeKey: string) => {
    setSelectedRange(rangeKey)
    const { startDate, endDate } = getDateRange(months)
    onDateRangeChange(startDate, endDate)
    setShowCustom(false)
  }

  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate)
      const endDate = new Date(customEndDate)
      if (startDate <= endDate) {
        setSelectedRange('custom')
        onDateRangeChange(startDate, endDate)
        setShowCustom(false)
      }
    }
  }

  const getRangeLabel = (): string => {
    if (selectedRange === 'custom' && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString('de-DE')} - ${new Date(customEndDate).toLocaleDateString('de-DE')}`
    }
    if (selectedRange === '3months') return 'Letzte 3 Monate'
    if (selectedRange === '6months') return 'Letzte 6 Monate'
    if (selectedRange === '12months') return 'Letzte 12 Monate'
    return 'Zeitraum'
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedRange === '3months' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRangeSelect(3, '3months')}
          className="text-xs"
        >
          3 Mo.
        </Button>
        <Button
          variant={selectedRange === '6months' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRangeSelect(6, '6months')}
          className="text-xs"
        >
          6 Mo.
        </Button>
        <Button
          variant={selectedRange === '12months' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRangeSelect(12, '12months')}
          className="text-xs"
        >
          12 Mo.
        </Button>
        <Button
          variant={selectedRange === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="text-xs"
        >
          Benutzerdefiniert
        </Button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded border border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-900 dark:text-white">Von</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-900 dark:text-white">Bis</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800"
            />
          </div>
          <Button
            size="sm"
            onClick={handleCustomApply}
            disabled={!customStartDate || !customEndDate}
            className="text-xs"
          >
            OK
          </Button>
        </div>
      )}
    </div>
  )
}
