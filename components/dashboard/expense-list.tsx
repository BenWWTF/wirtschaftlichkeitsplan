'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Filter, RotateCw, Upload, ArrowUp, ArrowDown } from 'lucide-react'
import type { Expense } from '@/lib/types'
import { ExpenseTable } from './expense-table'
import { ExpenseDialogEnhanced } from './expense-dialog-enhanced'
import { ExportExpensesButton } from './export-expenses-button'
import { BillScanner, type BillScannerSuggestion } from './bill-scanner'
import { deleteExpenseAction, getExpenses } from '@/lib/actions/expenses'
import { toast } from 'sonner'
import { formatEuro } from '@/lib/utils'
import { AUSTRIAN_EXPENSE_CATEGORIES } from '@/lib/constants'

interface ExpenseListProps {
  expenses: Expense[]
}

type SortColumn = 'date' | 'amount' | 'category' | 'description'
type SortDirection = 'asc' | 'desc'

export function ExpenseList({ expenses: initialExpenses }: ExpenseListProps) {
  const [open, setOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<'all' | 'fixkosten' | 'investitionskosten'>('all')
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
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
      spread_monthly: false,
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
        // Refresh expenses from server
        const freshExpenses = await getExpenses()
        setExpenses(freshExpenses)
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Fehler beim Löschen der Ausgabe')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    // Apply type filter (Fixkosten vs Investitionskosten)
    if (filterType === 'fixkosten') {
      filtered = filtered.filter((exp) => exp.is_recurring)
    } else if (filterType === 'investitionskosten') {
      filtered = filtered.filter((exp) => !exp.is_recurring)
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((exp) => exp.category === filterCategory)
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortColumn) {
        case 'date':
          aValue = new Date(a.expense_date).getTime()
          bValue = new Date(b.expense_date).getTime()
          break
        case 'amount':
          aValue = parseFloat(a.amount.toString())
          bValue = parseFloat(b.amount.toString())
          break
        case 'category':
          aValue = a.category.toLowerCase()
          bValue = b.category.toLowerCase()
          break
        case 'description':
          aValue = (a.description || '').toLowerCase()
          bValue = (b.description || '').toLowerCase()
          break
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [expenses, filterCategory, filterType, sortColumn, sortDirection])

  // Calculate total
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
  }, [filteredExpenses])

  // Get unique categories from expenses
  const categoriesInUse = useMemo(() => {
    const cats = new Set(expenses.map((exp) => exp.category))
    return Array.from(cats).sort()
  }, [expenses])

  // Calculate fixed costs (recurring expenses) with monthly spread applied
  const fixedCosts = useMemo(() => {
    return expenses
      .filter((exp) => exp.is_recurring)
      .reduce((sum, exp) => {
        const amount = parseFloat(exp.amount.toString())
        // Apply spread monthly logic if enabled
        if (exp.spread_monthly) {
          if (exp.recurrence_interval === 'yearly') {
            return sum + (amount / 12)
          } else if (exp.recurrence_interval === 'quarterly') {
            return sum + (amount / 3)
          }
        }
        return sum + amount
      }, 0)
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
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-accent-500 dark:hover:border-accent-500 transition-colors text-left"
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
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-accent-500 dark:hover:border-accent-500 transition-colors text-left"
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

      {/* Sort Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Sortieren:</span>
        <Button
          variant={sortColumn === 'date' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (sortColumn === 'date') {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
            } else {
              setSortColumn('date')
              setSortDirection('desc')
            }
          }}
          className="gap-1"
        >
          Datum
          {sortColumn === 'date' && (
            sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant={sortColumn === 'amount' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (sortColumn === 'amount') {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
            } else {
              setSortColumn('amount')
              setSortDirection('desc')
            }
          }}
          className="gap-1"
        >
          Betrag
          {sortColumn === 'amount' && (
            sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant={sortColumn === 'category' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (sortColumn === 'category') {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
            } else {
              setSortColumn('category')
              setSortDirection('asc')
            }
          }}
          className="gap-1"
        >
          Kategorie
          {sortColumn === 'category' && (
            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant={sortColumn === 'description' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (sortColumn === 'description') {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
            } else {
              setSortColumn('description')
              setSortDirection('asc')
            }
          }}
          className="gap-1"
        >
          Beschreibung
          {sortColumn === 'description' && (
            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          )}
        </Button>
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
        onSuccess={async () => {
          setOpen(false)
          setSelectedExpense(null)
          toast.success('Ausgabe erfolgreich gespeichert')
          // Refresh expenses from server
          const freshExpenses = await getExpenses()
          setExpenses(freshExpenses)
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
