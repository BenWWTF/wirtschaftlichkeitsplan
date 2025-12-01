'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
  availableMonths?: string[]
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

export function MonthSelector({
  selectedMonth,
  onMonthChange,
  availableMonths = [],
}: MonthSelectorProps) {
  const [displayMonth, setDisplayMonth] = useState(selectedMonth)
  const [isOpen, setIsOpen] = useState(false)
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setDisplayMonth(selectedMonth)
  }, [selectedMonth])

  // Keyboard event handler for popover
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        setViewYear((prev) => prev + 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        setViewYear((prev) => prev - 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        setViewYear((prev) => prev - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        setViewYear((prev) => prev + 1)
        break
      default:
        break
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const getMonthLabel = (year: number, month: number): string => {
    return MONTHS[month - 1] || ''
  }

  const handleSelectMonth = (month: number) => {
    const monthStr = `${viewYear}-${String(month).padStart(2, '0')}`
    setDisplayMonth(monthStr)
    onMonthChange(monthStr)
    setIsOpen(false)
  }

  const handlePreviousYear = () => {
    setViewYear(viewYear - 1)
  }

  const handleNextYear = () => {
    setViewYear(viewYear + 1)
  }

  const [selectedYear, selectedMonthNum] = displayMonth.split('-')
  const selectedMonthNumber = parseInt(selectedMonthNum)

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Display current selection */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
          className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium text-neutral-900 dark:text-white flex items-center gap-2"
          aria-label={`Monat wählen. ${getMonthLabel(parseInt(selectedYear), selectedMonthNumber)} ${selectedYear} ausgewählt`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span>{getMonthLabel(parseInt(selectedYear), selectedMonthNumber)} {selectedYear}</span>
          <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">▼</span>
        </button>

        {availableMonths.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {availableMonths.includes(displayMonth) ? (
              <span className="text-green-600 font-medium">● Daten vorhanden</span>
            ) : (
              <span className="text-amber-600 font-medium">○ Keine Daten</span>
            )}
          </div>
        )}
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 w-72">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousYear}
              className="h-8 w-8"
              aria-label="Vorheriges Jahr"
              title="Vorheriges Jahr"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
              {viewYear}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextYear}
              className="h-8 w-8"
              aria-label="Nächstes Jahr"
              title="Nächstes Jahr"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1
              const isSelected = parseInt(selectedYear) === viewYear && selectedMonthNumber === month
              const monthStr = `${viewYear}-${String(month).padStart(2, '0')}`
              const hasData = availableMonths.includes(monthStr)

              return (
                <button
                  key={month}
                  onClick={() => handleSelectMonth(month)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSelectMonth(month)
                    }
                  }}
                  className={`py-2 px-2 rounded text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600'
                  } ${hasData ? 'ring-2 ring-green-500 dark:ring-green-400' : ''}`}
                  title={hasData ? 'Daten vorhanden' : 'Keine Daten'}
                  aria-label={`${MONTHS[month - 1]} ${viewYear} ${isSelected ? '(ausgewählt)' : ''} ${hasData ? '(Daten vorhanden)' : '(Keine Daten)'}`}
                  aria-pressed={isSelected}
                >
                  {MONTHS[month - 1].slice(0, 3)}
                </button>
              )
            })}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
