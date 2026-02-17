'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Repeat, CalendarClock } from 'lucide-react'
import type { Expense } from '@/lib/types'
import { formatEuro } from '@/lib/utils'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useIsMobile } from '@/components/ui/hooks/useMediaQuery'
import { MobileCard, MobileCardRow } from '@/components/dashboard/mobile-card'

interface ExpenseTableProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => Promise<void>
}

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  const isMobile = useIsMobile()

  const handleDelete = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Ausgabe löschen möchten?')) {
      try {
        await onDelete(id)
      } catch (error) {
        console.error('Fehler beim Löschen:', error)
      }
    }
  }

  const getRecurrenceLabel = (interval: string | null) => {
    if (!interval) return null
    switch (interval) {
      case 'monthly':
        return 'Monatlich'
      case 'quarterly':
        return 'Vierteljährlich'
      case 'yearly':
        return 'Jährlich'
      default:
        return null
    }
  }

  const getSpreadMonthlyAmount = (expense: Expense) => {
    if (!expense.spread_monthly || !expense.recurrence_interval) return null
    if (expense.recurrence_interval === 'yearly') return expense.amount / 12
    if (expense.recurrence_interval === 'quarterly') return expense.amount / 3
    return null
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Keine Ausgaben vorhanden. Erstellen Sie eine neue Ausgabe, um zu beginnen.
        </p>
      </div>
    )
  }

  // Mobile view: Render cards
  if (isMobile) {
    return (
      <div className="space-y-3">
        {expenses.map((expense) => {
          const date = new Date(expense.expense_date)
          const formattedDate = format(date, 'dd.MM.yyyy', { locale: de })
          const recurrenceLabel = getRecurrenceLabel(expense.recurrence_interval)
          const spreadAmount = getSpreadMonthlyAmount(expense)

          return (
            <MobileCard
              key={expense.id}
              title={expense.category}
              subtitle={expense.subcategory || formattedDate}
              badge={
                <span className="text-sm font-semibold text-accent-700 dark:text-accent-300 whitespace-nowrap">
                  {formatEuro(expense.amount)}
                </span>
              }
              expandableContent={
                <div className="space-y-2">
                  <MobileCardRow label="Datum" value={formattedDate} />
                  {expense.description && (
                    <MobileCardRow label="Beschreibung" value={expense.description} />
                  )}
                  {expense.is_recurring && recurrenceLabel && (
                    <div className="flex items-center gap-2 py-2">
                      <Repeat className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                      <span className="text-xs font-medium text-accent-600 dark:text-accent-400">
                        {recurrenceLabel}
                      </span>
                    </div>
                  )}
                  {spreadAmount !== null && (
                    <div className="flex items-center gap-2 py-2">
                      <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        = {formatEuro(spreadAmount)}/Monat
                      </span>
                    </div>
                  )}
                </div>
              }
              expandLabel={expense.description || expense.is_recurring ? 'Details' : undefined}
              actions={
                <div className="flex gap-2 w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(expense)}
                    className="flex-1 text-accent-600 hover:text-accent-700 hover:bg-accent-50 dark:hover:bg-accent-950/20"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </div>
              }
            >
              <MobileCardRow
                label="Betrag"
                value={formatEuro(expense.amount)}
                variant="highlight"
              />
            </MobileCard>
          )
        })}
      </div>
    )
  }

  // Desktop view: Render table
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="font-semibold">Datum</TableHead>
            <TableHead className="font-semibold">Kategorie</TableHead>
            <TableHead className="font-semibold">Beschreibung</TableHead>
            <TableHead className="text-right font-semibold">Betrag</TableHead>
            <TableHead className="w-32 text-right font-semibold">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const date = new Date(expense.expense_date)
            const formattedDate = format(date, 'dd.MM.yyyy', { locale: de })
            const recurrenceLabel = getRecurrenceLabel(expense.recurrence_interval)
            const spreadAmount = getSpreadMonthlyAmount(expense)

            return (
              <TableRow key={expense.id} className="border-border hover:bg-muted/50">
                <TableCell className="font-medium whitespace-nowrap">
                  {formattedDate}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{expense.category}</span>
                    {expense.subcategory && (
                      <span className="text-sm text-muted-foreground">
                        {expense.subcategory}
                      </span>
                    )}
                    {expense.is_recurring && recurrenceLabel && (
                      <span className="inline-flex items-center gap-1 text-xs text-accent-600 dark:text-accent-400 mt-1">
                        <Repeat className="h-3 w-3" />
                        {recurrenceLabel}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {expense.description || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-semibold">{formatEuro(expense.amount)}</span>
                    {spreadAmount !== null && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <CalendarClock className="h-3 w-3" />
                        = {formatEuro(spreadAmount)}/Mo.
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(expense)}
                    className="text-accent-600 hover:text-accent-700 hover:bg-accent-50"
                    aria-label={`Ausgabe ${expense.description || 'bearbeiten'}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label={`Ausgabe ${expense.description || 'löschen'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
