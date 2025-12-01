'use client'

import { useState, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isAfter,
  isBefore,
  startOfYear,
  endOfYear,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DateRange {
  startDate: Date
  endDate: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  presets?: boolean
  customRanges?: boolean
  className?: string
  onApply?: (range: DateRange) => void
  saveToUrl?: boolean
}

type PresetKey = 'thisMonth' | 'lastMonth' | 'last3Months' | 'lastYear' | 'ytd'

interface Preset {
  label: string
  getValue: () => DateRange
}

const PRESETS: Record<PresetKey, Preset> = {
  thisMonth: {
    label: 'Diesen Monat',
    getValue: () => {
      const today = new Date()
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(today),
      }
    },
  },
  lastMonth: {
    label: 'Letzten Monat',
    getValue: () => {
      const today = new Date()
      const lastMonth = subMonths(today, 1)
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      }
    },
  },
  last3Months: {
    label: 'Letzte 3 Monate',
    getValue: () => {
      const today = new Date()
      const threeMonthsAgo = subMonths(today, 3)
      return {
        startDate: startOfMonth(threeMonthsAgo),
        endDate: endOfMonth(today),
      }
    },
  },
  lastYear: {
    label: 'Letztes Jahr',
    getValue: () => {
      const today = new Date()
      const lastYear = subMonths(today, 12)
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear),
      }
    },
  },
  ytd: {
    label: 'Jahr bis Datum',
    getValue: () => {
      const today = new Date()
      return {
        startDate: startOfYear(today),
        endDate: today,
      }
    },
  },
}

/**
 * Date Range Picker Component
 * Allows selection of custom date ranges with presets
 */
export function DateRangePicker({
  value,
  onChange,
  presets = true,
  customRanges = true,
  className = '',
  onApply,
  saveToUrl = false,
}: DateRangePickerProps) {
  const today = new Date()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRange>(
    value || {
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    }
  )
  const [displayMonth, setDisplayMonth] = useState(selectedRange.startDate)

  const handleSelectRange = useCallback(
    (range: DateRange) => {
      if (isBefore(range.endDate, range.startDate)) {
        // Swap if end is before start
        const temp = range.startDate
        range.startDate = range.endDate
        range.endDate = temp
      }

      setSelectedRange(range)
      onChange?.(range)

      if (saveToUrl) {
        const params = new URLSearchParams()
        params.set('startDate', format(range.startDate, 'yyyy-MM-dd'))
        params.set('endDate', format(range.endDate, 'yyyy-MM-dd'))
        window.history.replaceState({}, '', `?${params.toString()}`)
      }
    },
    [onChange, saveToUrl]
  )

  const handleApply = () => {
    onApply?.(selectedRange)
    setIsOpen(false)
  }

  const displayText =
    format(selectedRange.startDate, 'dd.MM.yyyy', { locale: de }) ===
    format(selectedRange.endDate, 'dd.MM.yyyy', { locale: de })
      ? format(selectedRange.startDate, 'dd.MM.yyyy', { locale: de })
      : `${format(selectedRange.startDate, 'dd.MM.yyyy', { locale: de })} - ${format(selectedRange.endDate, 'dd.MM.yyyy', { locale: de })}`

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center gap-2 min-w-[220px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          <span className="text-sm font-medium">{displayText}</span>
        </div>
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 p-4 min-w-[600px]">
          <div className="grid grid-cols-3 gap-6">
            {/* Presets */}
            {presets && (
              <div className="col-span-1 border-r border-neutral-200 dark:border-neutral-700 pr-4">
                <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-3">
                  Voreinstellungen
                </h3>
                <div className="space-y-2">
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => {
                        const range = preset.getValue()
                        handleSelectRange(range)
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar */}
            {customRanges && (
              <div className={presets ? 'col-span-2' : 'col-span-3'}>
                <div className="mb-4">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}
                      className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-sm font-semibold">
                      {format(displayMonth, 'MMMM yyyy', { locale: de })}
                    </h3>
                    <button
                      onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
                      className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                      <div
                        key={day}
                        className="text-xs font-semibold text-center text-neutral-600 dark:text-neutral-400 h-8 flex items-center justify-center"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Days */}
                    {generateCalendarDays(displayMonth).map((day, idx) => {
                      const isCurrentMonth = day.getMonth() === displayMonth.getMonth()
                      const isSelected =
                        !isBefore(day, selectedRange.endDate) &&
                        !isAfter(day, selectedRange.startDate)
                      const isStart =
                        format(day, 'yyyy-MM-dd') ===
                        format(selectedRange.startDate, 'yyyy-MM-dd')
                      const isEnd =
                        format(day, 'yyyy-MM-dd') ===
                        format(selectedRange.endDate, 'yyyy-MM-dd')

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            const newRange = { ...selectedRange }
                            if (
                              isBefore(day, selectedRange.startDate) ||
                              (isAfter(day, selectedRange.startDate) &&
                                isBefore(day, selectedRange.endDate))
                            ) {
                              newRange.startDate = day
                            } else {
                              newRange.endDate = day
                            }
                            handleSelectRange(newRange)
                          }}
                          className={`
                          h-8 rounded-md text-xs font-medium transition-colors
                          ${!isCurrentMonth ? 'text-neutral-400 dark:text-neutral-600 cursor-default' : ''}
                          ${isSelected && !isStart && !isEnd ? 'bg-blue-100 dark:bg-blue-900/30 text-neutral-900 dark:text-neutral-100' : ''}
                          ${isStart || isEnd ? 'bg-blue-600 text-white' : ''}
                          ${!isSelected && isCurrentMonth ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800' : ''}
                        `}
                        >
                          {day.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      value={format(selectedRange.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const date = new Date(e.target.value)
                        handleSelectRange({
                          ...selectedRange,
                          startDate: date,
                        })
                      }}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Enddatum
                    </label>
                    <input
                      type="date"
                      value={format(selectedRange.endDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const date = new Date(e.target.value)
                        handleSelectRange({
                          ...selectedRange,
                          endDate: date,
                        })
                      }}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleApply}
            >
              Anwenden
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Generate calendar days for a given month
 */
function generateCalendarDays(date: Date): Date[] {
  const month = date.getMonth()
  const year = date.getFullYear()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  const firstDayOfWeek = firstDay.getDay() || 7 // Monday = 1, Sunday = 7

  const days: Date[] = []

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 2; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonthLastDay - i))
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  // Next month days (fill grid to 42 cells = 6 weeks)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i))
  }

  return days
}
