'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Filter, RotateCw, Upload } from 'lucide-react'
import type { Expense } from '@/lib/types'
import { ExpenseTable } from './expense-table'
import { ExpenseDialogEnhanced } from './expense-dialog-enhanced'
import { ExportExpensesButton } from './export-expenses-button'
import { BillScanner, type BillScannerSuggestion } from './bill-scanner'
import { deleteExpenseAction } from '@/lib/actions/expenses'
import { toast } from 'sonner'
import { formatEuro } from '@/lib/utils'
import { AUSTRIAN_EXPENSE_CATEGORIES } from '@/lib/constants'

interface ExpenseListProps {
  expenses: Expense[]
}

export function ExpenseList({ expenses: initialExpenses }: ExpenseListProps) {
  const [open, setOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<'all' | 'fixkosten' | 'investitionskosten'>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [expenses, setExpenses] = useState(initialExpenses)

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setOpen(true)
  }

  const handleCreate = () => {
    setSelectedExpense(null)
    setOpen(true)
  }

  const handleScannerSuggestion = (suggestion: BillScannerSuggestion) => {
    setSelectedExpense({
      id: '',
      user_id: '',
      amount: suggestion.amount,
      category: suggestion.category_hint || AUSTRIAN_EXPENSE_CATEGORIES[0].category,
      subcategory: null,
      description: `${suggestion.vendor_name}: ${suggestion.description}`,
      expense_date: suggestion.invoice_date,
      is_recurring: false,
      recurrence_interval: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setScannerOpen(false)
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

  // Filter expenses by category and type
  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    // Apply type filter (Fixkosten vs Investitionskosten)
    if (filterType === 'fixkosten') {
      filtered = filtered.filter((exp) => exp.is_recurring)
    } else if (filterType === 'investitionskosten') {
      filtered = filtered.filter((exp) => !exp.is_recurring)
    }

    // Apply category filter
    if (filterCategory === 'all') return filtered
    return filtered.filter((exp) => exp.category === filterCategory)
  }, [expenses, filterCategory, filterType])

  // Calculate total
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
  }, [filteredExpenses])

  // Get unique categories from expenses
  const categoriesInUse = useMemo(() => {
    const cats = new Set(expenses.map((exp) => exp.category))
    return Array.from(cats).sort()
  }, [expenses])

  // Calculate fixed costs (recurring expenses)
  const fixedCosts = useMemo(() => {
    return expenses
      .filter((exp) => exp.is_recurring)
      .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
  }, [expenses])

  // Calculate investment costs (one-time, larger amounts)
  const investmentCosts = useMemo(() => {
    return expenses
      .filter((exp) => !exp.is_recurring)
      .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
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
        <div className="flex gap-2">
          <ExportExpensesButton />
          {/* Mobile: Show only scanner button */}
          <Button
            onClick={() => setScannerOpen(true)}
            size="lg"
            className="md:hidden"
          >
            <Upload className="h-4 w-4 mr-2" />
            Rechnung scannen
          </Button>
          {/* Desktop: Show both buttons */}
          <Button onClick={handleCreate} size="lg" className="hidden md:flex">
            <Plus className="h-4 w-4 mr-2" />
            Neue Ausgabe
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setFilterType('fixkosten')
            setFilterCategory('all')
          }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
        >
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Meine Fixkosten Pro Monat
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {formatEuro(fixedCosts)}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Wiederkehrende Ausgaben
          </p>
        </button>

        <button
          onClick={() => {
            setFilterType('investitionskosten')
            setFilterCategory('all')
          }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
        >
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Meine Investitionskosten
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {formatEuro(investmentCosts)}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Einmalige Ausgaben
          </p>
        </button>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Gesamt Ausgaben
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {formatEuro(totalExpenses)}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            {filteredExpenses.length} Ausgaben{(filterCategory !== 'all' || filterType !== 'all') && ' (gefiltert)'}
          </p>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-neutral-500" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filter:</span>
        <Button
          variant={filterType === 'all' && filterCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilterType('all')
            setFilterCategory('all')
          }}
        >
          Alle
        </Button>
        <Button
          variant={filterType === 'fixkosten' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilterType('fixkosten')
            setFilterCategory('all')
          }}
        >
          Fixkosten
        </Button>
        <Button
          variant={filterType === 'investitionskosten' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilterType('investitionskosten')
            setFilterCategory('all')
          }}
        >
          Investitionskosten
        </Button>
        {AUSTRIAN_EXPENSE_CATEGORIES.map((cat) => (
          <Button
            key={cat.category}
            variant={filterCategory === cat.category && filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilterCategory(cat.category)
              setFilterType('all')
            }}
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

      <ExpenseDialogEnhanced
        open={open}
        onOpenChange={setOpen}
        expense={selectedExpense}
        onSuccess={() => {
          setOpen(false)
          setSelectedExpense(null)
          setRefreshKey(k => k + 1)
          toast.success('Ausgabe erfolgreich gespeichert')
        }}
      />

      {/* Bill Scanner Dialog */}
      <BillScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onSuggestion={handleScannerSuggestion}
      />
    </div>
  )
}
