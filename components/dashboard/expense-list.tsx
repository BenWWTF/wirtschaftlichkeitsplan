'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Plus, Filter } from 'lucide-react'
import type { Expense } from '@/lib/types'
import { ExpenseTable } from './expense-table'
import { deleteExpenseAction } from '@/lib/actions/expenses'
import { toast } from 'sonner'
import { formatEuro } from '@/lib/utils'
import { AUSTRIAN_EXPENSE_CATEGORIES } from '@/lib/constants'

// Dynamic import for expense dialog (form-heavy component)
const ExpenseDialog = dynamic(() => import('./expense-dialog').then(mod => ({ default: mod.ExpenseDialog })), {
  loading: () => null,
  ssr: false
})

interface ExpenseListProps {
  expenses: Expense[]
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const [open, setOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setOpen(true)
  }

  const handleCreate = () => {
    setSelectedExpense(null)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const result = await deleteExpenseAction(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Ausgabe erfolgreich gelöscht')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Fehler beim Löschen der Ausgabe')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter expenses by category
  const filteredExpenses = useMemo(() => {
    if (filterCategory === 'all') return expenses
    return expenses.filter((exp) => exp.category === filterCategory)
  }, [expenses, filterCategory])

  // Calculate total
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
  }, [filteredExpenses])

  // Get unique categories from expenses
  const categoriesInUse = useMemo(() => {
    const cats = new Set(expenses.map((exp) => exp.category))
    return Array.from(cats).sort()
  }, [expenses])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ausgaben</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Betriebsausgaben
          </p>
        </div>
        <Button onClick={handleCreate} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Neue Ausgabe
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Gesamt Ausgaben
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {formatEuro(totalExpenses)}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            {filteredExpenses.length} Ausgaben{filterCategory !== 'all' && ' (gefiltert)'}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Kategorien
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {categoriesInUse.length}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Verschiedene Kategorien
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Wiederkehrend
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {expenses.filter((exp) => exp.is_recurring).length}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Regelmäßige Ausgaben
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-neutral-500" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filter:</span>
        <Button
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('all')}
        >
          Alle
        </Button>
        {AUSTRIAN_EXPENSE_CATEGORIES.map((cat) => (
          <Button
            key={cat.category}
            variant={filterCategory === cat.category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat.category)}
          >
            {cat.category}
          </Button>
        ))}
      </div>

      <ExpenseTable
        expenses={filteredExpenses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ExpenseDialog
        open={open}
        onOpenChange={setOpen}
        expense={selectedExpense}
      />
    </div>
  )
}
