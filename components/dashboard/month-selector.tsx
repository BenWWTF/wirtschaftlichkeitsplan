'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
  availableMonths?: string[]
}

export function MonthSelector({
  selectedMonth,
  onMonthChange,
  availableMonths = [],
}: MonthSelectorProps) {
  const [displayMonth, setDisplayMonth] = useState(selectedMonth)

  useEffect(() => {
    setDisplayMonth(selectedMonth)
  }, [selectedMonth])

  const getMonthLabel = (month: string): string => {
    try {
      const [year, monthNum] = month.split('-')
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      return date.toLocaleDateString('de-AT', {
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return month
    }
  }

  const getNextMonth = (month: string): string => {
    const [year, monthNum] = month.split('-')
    let nextMonth = parseInt(monthNum) + 1
    let nextYear = parseInt(year)

    if (nextMonth > 12) {
      nextMonth = 1
      nextYear++
    }

    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
  }

  const getPreviousMonth = (month: string): string => {
    const [year, monthNum] = month.split('-')
    let prevMonth = parseInt(monthNum) - 1
    let prevYear = parseInt(year)

    if (prevMonth < 1) {
      prevMonth = 12
      prevYear--
    }

    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  }

  const handlePreviousMonth = () => {
    const prevMonth = getPreviousMonth(displayMonth)
    setDisplayMonth(prevMonth)
    onMonthChange(prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = getNextMonth(displayMonth)
    setDisplayMonth(nextMonth)
    onMonthChange(nextMonth)
  }

  const handleSelectChange = (value: string) => {
    setDisplayMonth(value)
    onMonthChange(value)
  }

  // Generate list of months for the last 12 months and next 12 months
  const generateMonthOptions = () => {
    const months: string[] = []
    const today = new Date()

    // Start from 12 months ago
    for (let i = -12; i <= 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      months.push(`${year}-${month}`)
    }

    return months
  }

  const monthOptions = generateMonthOptions()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
        className="h-10 w-10"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="w-40">
        <Select value={displayMonth} onValueChange={handleSelectChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month}>
                {getMonthLabel(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-10 w-10"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {availableMonths.length > 0 && (
        <div className="ml-auto text-sm text-muted-foreground">
          {availableMonths.includes(displayMonth) ? (
            <span className="text-green-600">● Daten vorhanden</span>
          ) : (
            <span className="text-amber-600">○ Keine Daten</span>
          )}
        </div>
      )}
    </div>
  )
}
