'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

export type FilterOperator = 'eq' | 'gt' | 'lt' | 'between' | 'contains' | 'gte' | 'lte'
export type FilterLogic = 'AND' | 'OR'
export type FilterableField =
  | 'category'
  | 'amount'
  | 'date'
  | 'description'
  | 'is_recurring'
  | 'therapy_type'
  | 'price_range'
  | 'occupancy_range'

export interface FilterRule {
  id: string
  field: FilterableField
  operator: FilterOperator
  value: any
  valueEnd?: any
  logic: FilterLogic
}

interface AdvancedFilterProps {
  pageType: 'expenses' | 'therapies' | 'results'
  onApply: (filters: FilterRule[]) => void
  onSave?: (filters: FilterRule[], filterName: string) => void
  initialFilters?: FilterRule[]
  isLoading?: boolean
}

const FILTER_CONFIGS = {
  expenses: {
    fields: [
      { value: 'category', label: 'Kategorie' },
      { value: 'amount', label: 'Betrag' },
      { value: 'date', label: 'Datum' },
      { value: 'description', label: 'Beschreibung' },
      { value: 'is_recurring', label: 'Wiederkehrend' },
    ],
    operators: {
      category: ['eq', 'contains'],
      amount: ['eq', 'gt', 'lt', 'between', 'gte', 'lte'],
      date: ['eq', 'gt', 'lt', 'between'],
      description: ['contains'],
      is_recurring: ['eq'],
    },
  },
  therapies: {
    fields: [
      { value: 'therapy_type', label: 'Therapietyp' },
      { value: 'price_range', label: 'Preisbereich' },
      { value: 'occupancy_range', label: 'Auslastung' },
    ],
    operators: {
      therapy_type: ['eq', 'contains'],
      price_range: ['between', 'gte', 'lte'],
      occupancy_range: ['between', 'gte', 'lte'],
    },
  },
  results: {
    fields: [
      { value: 'therapy_type', label: 'Therapietyp' },
      { value: 'date', label: 'Datum' },
      { value: 'amount', label: 'Betrag' },
    ],
    operators: {
      therapy_type: ['eq', 'contains'],
      date: ['eq', 'gt', 'lt', 'between'],
      amount: ['eq', 'gt', 'lt', 'between'],
    },
  },
}

const OPERATOR_LABELS = {
  eq: 'Gleich',
  gt: 'Größer als',
  lt: 'Kleiner als',
  gte: 'Größer oder gleich',
  lte: 'Kleiner oder gleich',
  between: 'Zwischen',
  contains: 'Enthält',
}

export function AdvancedFilter({
  pageType,
  onApply,
  onSave,
  initialFilters = [],
  isLoading = false,
}: AdvancedFilterProps) {
  const [filters, setFilters] = useState<FilterRule[]>(initialFilters.length > 0 ? initialFilters : [])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const config = FILTER_CONFIGS[pageType]

  const addFilter = useCallback(() => {
    const newFilter: FilterRule = {
      id: `filter-${Date.now()}`,
      field: config.fields[0].value as FilterableField,
      operator: 'eq',
      value: '',
      logic: filters.length > 0 ? 'AND' : 'AND',
    }
    setFilters([...filters, newFilter])
  }, [filters, config])

  const removeFilter = useCallback((id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }, [filters])

  const updateFilter = useCallback(
    (id: string, updates: Partial<FilterRule>) => {
      setFilters(
        filters.map(f =>
          f.id === id ? { ...f, ...updates } : f
        )
      )
    },
    [filters]
  )

  const handleApply = () => {
    if (filters.length === 0) {
      toast.error('Bitte fügen Sie mindestens einen Filter hinzu')
      return
    }

    // Validate all filters have values
    const hasInvalidFilters = filters.some(
      f => f.value === '' || (f.operator === 'between' && !f.valueEnd)
    )
    if (hasInvalidFilters) {
      toast.error('Bitte füllen Sie alle Filterfelder aus')
      return
    }

    onApply(filters)
  }

  const handleSave = () => {
    if (!filterName.trim()) {
      toast.error('Bitte geben Sie einen Namen für den Filter ein')
      return
    }

    if (filters.length === 0) {
      toast.error('Bitte fügen Sie mindestens einen Filter hinzu')
      return
    }

    onSave?.(filters, filterName)
    setFilterName('')
    setShowSaveDialog(false)
  }

  const handleClear = () => {
    setFilters([])
  }

  const getOperatorsList = (field: FilterableField): string[] => {
    return (config.operators as Record<string, string[]>)[field] || ['eq']
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          Erweiterte Filter
          {filters.length > 0 && (
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {filters.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Rules (when expanded) */}
      {isExpanded && (
        <div className="space-y-3 mb-4">
          {filters.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
              Keine Filter hinzugefügt. Klicken Sie auf &quot;Filter hinzufügen&quot;, um zu beginnen.
            </p>
          ) : (
            filters.map((filter, index) => (
              <div key={filter.id} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {/* Logic operator (AND/OR) for rules after the first */}
                {index > 0 && (
                  <div className="flex gap-2">
                    <Select value={filter.logic} onValueChange={(value) =>
                      updateFilter(filter.id, { logic: value as FilterLogic })
                    }>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">UND</SelectItem>
                        <SelectItem value="OR">ODER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filter Rule */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  {/* Field */}
                  <Select
                    value={filter.field}
                    onValueChange={(value) =>
                      updateFilter(filter.id, { field: value as FilterableField })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.fields.map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator */}
                  <Select
                    value={filter.operator}
                    onValueChange={(value) =>
                      updateFilter(filter.id, { operator: value as FilterOperator })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperatorsList(filter.field).map(op => (
                        <SelectItem key={op} value={op}>
                          {OPERATOR_LABELS[op as FilterOperator]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value Input */}
                  {filter.operator !== 'between' && (
                    <Input
                      type={filter.field === 'date' ? 'date' : filter.field.includes('amount') || filter.field.includes('price') ? 'number' : 'text'}
                      placeholder="Wert"
                      value={filter.value}
                      onChange={(e) =>
                        updateFilter(filter.id, { value: e.target.value })
                      }
                      className="col-span-1"
                    />
                  )}

                  {/* Between range inputs */}
                  {filter.operator === 'between' && (
                    <>
                      <Input
                        type={filter.field === 'date' ? 'date' : 'number'}
                        placeholder="Von"
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(filter.id, { value: e.target.value })
                        }
                      />
                      <Input
                        type={filter.field === 'date' ? 'date' : 'number'}
                        placeholder="Bis"
                        value={filter.valueEnd || ''}
                        onChange={(e) =>
                          updateFilter(filter.id, { valueEnd: e.target.value })
                        }
                      />
                    </>
                  )}

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="h-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Add Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addFilter}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Filter hinzufügen
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApply}
              disabled={filters.length === 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Wird angewendet...' : 'Filter anwenden'}
            </Button>

            {onSave && (
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                disabled={filters.length === 0}
              >
                Speichern
              </Button>
            )}

            {filters.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleClear}
              >
                Löschen
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Filter speichern
            </h3>

            <Input
              placeholder="Filtername"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="mb-4"
              autoFocus
            />

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="flex-1"
              >
                Speichern
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false)
                  setFilterName('')
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
