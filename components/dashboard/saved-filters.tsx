'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Edit2, Copy, Star } from 'lucide-react'
import { toast } from 'sonner'
import type { FilterRule } from '@/components/dashboard/advanced-filter'
import {
  getSavedFilters,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  setDefaultFilter,
} from '@/lib/actions/saved-filters'
import { filtersToString } from '@/lib/utils/filter-builder'

export interface SavedFilter {
  id: string
  name: string
  collection?: string
  filters: FilterRule[]
  pageType: 'expenses' | 'therapies' | 'results'
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface SavedFiltersProps {
  pageType: 'expenses' | 'therapies' | 'results'
  onSelectFilter: (filters: FilterRule[]) => void
  onFilterDeleted?: () => void
}

export function SavedFilters({
  pageType,
  onSelectFilter,
  onFilterDeleted,
}: SavedFiltersProps) {
  const [filters, setFilters] = useState<SavedFilter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [collections, setCollections] = useState<string[]>([])

  // Load saved filters on mount
  useEffect(() => {
    loadFilters()
  }, [pageType])

  const loadFilters = async () => {
    setIsLoading(true)
    try {
      const result = await getSavedFilters(pageType)
      if (result.error) {
        toast.error(result.error)
        setFilters([])
      } else if (result.data) {
        setFilters(result.data)
        // Extract unique collections
        const uniqueCollections = [...new Set(
          result.data
            .map(f => f.collection)
            .filter(Boolean)
        )]
        setCollections(uniqueCollections as string[])
      }
    } catch (error) {
      console.error('Error loading filters:', error)
      toast.error('Fehler beim Laden der Filter')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectFilter = (filter: SavedFilter) => {
    onSelectFilter(filter.filters)
    toast.success(`Filter "${filter.name}" angewendet`)
  }

  const handleDeleteFilter = async (id: string, name: string) => {
    if (!confirm(`Möchten Sie den Filter "${name}" wirklich löschen?`)) {
      return
    }

    try {
      const result = await deleteSavedFilter(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setFilters(filters.filter(f => f.id !== id))
        onFilterDeleted?.()
        toast.success('Filter gelöscht')
      }
    } catch (error) {
      console.error('Error deleting filter:', error)
      toast.error('Fehler beim Löschen des Filters')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const result = await setDefaultFilter(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        // Update local state
        setFilters(
          filters.map(f => ({
            ...f,
            isDefault: f.id === id,
          }))
        )
        toast.success('Standard-Filter aktualisiert')
      }
    } catch (error) {
      console.error('Error setting default filter:', error)
      toast.error('Fehler beim Aktualisieren des Standard-Filters')
    }
  }

  const handleUpdateName = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Bitte geben Sie einen Namen ein')
      return
    }

    try {
      const filter = filters.find(f => f.id === id)
      if (!filter) return

      const result = await updateSavedFilter(id, {
        name: editName,
        collection: filter.collection,
        filters: filter.filters,
        pageType,
        isDefault: filter.isDefault,
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setFilters(
          filters.map(f =>
            f.id === id ? result.data as SavedFilter : f
          )
        )
        setEditingId(null)
        setEditName('')
        toast.success('Filter aktualisiert')
      }
    } catch (error) {
      console.error('Error updating filter:', error)
      toast.error('Fehler beim Aktualisieren des Filters')
    }
  }

  const handleDuplicateFilter = async (filter: SavedFilter) => {
    const newName = `${filter.name} (Kopie)`
    try {
      const result = await createSavedFilter({
        name: newName,
        collection: filter.collection,
        filters: filter.filters,
        pageType,
        isDefault: false,
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setFilters([...filters, result.data])
        toast.success('Filter dupliziert')
      }
    } catch (error) {
      console.error('Error duplicating filter:', error)
      toast.error('Fehler beim Duplizieren des Filters')
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Gespeicherte Filter werden geladen...
        </p>
      </div>
    )
  }

  if (filters.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Keine gespeicherten Filter vorhanden. Erstellen Sie einen neuen Filter und speichern Sie ihn.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter List */}
      {filters.map(filter => (
        <div
          key={filter.id}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-start justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex-1 min-w-0">
            {editingId === filter.id ? (
              <div className="flex gap-2 mb-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleUpdateName(filter.id)}
                  className="h-8"
                >
                  Speichern
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                  className="h-8"
                >
                  Abbrechen
                </Button>
              </div>
            ) : (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {filter.name}
                  </h4>
                  {filter.isDefault && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                      Standard
                    </span>
                  )}
                  {filter.collection && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                      {filter.collection}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {filtersToString(filter.filters)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Erstellt: {new Date(filter.createdAt).toLocaleDateString('de-DE')}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSelectFilter(filter)}
              className="h-8 px-2"
              title="Filter anwenden"
            >
              ↻
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSetDefault(filter.id)}
              className="h-8 px-2"
              title={filter.isDefault ? 'Standard-Filter ist gesetzt' : 'Als Standard setzen'}
              disabled={filter.isDefault}
            >
              <Star className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDuplicateFilter(filter)}
              className="h-8 px-2"
              title="Filter duplizieren"
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingId(filter.id)
                setEditName(filter.name)
              }}
              className="h-8 px-2"
              title="Filter umbenennen"
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteFilter(filter.id, filter.name)}
              className="h-8 px-2 text-red-600 hover:text-red-700 dark:text-red-400"
              title="Filter löschen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
