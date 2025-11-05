'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export function MonthSelector({
  selectedMonth,
  onMonthChange
}: MonthSelectorProps) {
  const currentDate = new Date()

  // Parse selected month (format: YYYY-MM)
  const [year, month] = selectedMonth.split('-').map(Number)
  const selectedDate = new Date(year, month - 1)

  // Helper to format month string
  const formatMonthString = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }

  // Helper to format display text
  const formatMonthDisplay = (date: Date) => {
    return new Intl.DateTimeFormat('de-AT', {
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  // Navigation handlers
  const handlePrevMonth = () => {
    const prev = new Date(selectedDate)
    prev.setMonth(prev.getMonth() - 1)
    onMonthChange(formatMonthString(prev))
  }

  const handleNextMonth = () => {
    const next = new Date(selectedDate)
    next.setMonth(next.getMonth() + 1)
    onMonthChange(formatMonthString(next))
  }

  const handleToday = () => {
    onMonthChange(formatMonthString(currentDate))
  }

  // Generate list of available months (current and next 12 months)
  const availableMonths = useMemo(() => {
    const months = []
    const startDate = new Date()
    startDate.setDate(1)

    for (let i = 0; i < 13; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      months.push({
        value: formatMonthString(date),
        label: formatMonthDisplay(date)
      })
    }

    return months
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {formatMonthDisplay(selectedDate)}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
          Planen Sie Ihre Sitzungen für diesen Monat
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          title="Vorheriger Monat"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          {availableMonths.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          title="Nächster Monat"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {selectedMonth !== formatMonthString(currentDate) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="ml-2"
          >
            Heute
          </Button>
        )}
      </div>
    </div>
  )
}
