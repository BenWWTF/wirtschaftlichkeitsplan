'use client'

import { useState, useEffect } from 'react'
import { getMonthlyCapacity, setMonthlyCapacity, removeMonthlyCapacity } from '@/lib/actions/monthly-capacity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, X, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface CapacityEditorProps {
  month: string
  defaultCapacity: number
  onCapacityChange?: () => void
}

/**
 * Capacity Editor Component
 * Allows users to set a custom monthly capacity or reset to default
 */
export function CapacityEditor({
  month,
  defaultCapacity,
  onCapacityChange
}: CapacityEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customCapacity, setCustomCapacity] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')

  // Load custom capacity on mount or when month changes
  useEffect(() => {
    const loadCapacity = async () => {
      setIsLoading(true)
      const capacity = await getMonthlyCapacity(month)
      setCustomCapacity(capacity)
      setInputValue((capacity || defaultCapacity).toString())
      setIsLoading(false)
    }

    loadCapacity()
  }, [month, defaultCapacity])

  const handleSave = async () => {
    const value = parseInt(inputValue, 10)

    // Validate input
    if (isNaN(value) || value < 1 || value > 168) {
      toast.error('Kapazität muss zwischen 1 und 168 Stunden pro Woche liegen')
      return
    }

    setIsSaving(true)
    try {
      const result = await setMonthlyCapacity(month, value)

      if (result.error) {
        toast.error(result.error)
      } else {
        setCustomCapacity(value)
        setIsEditing(false)
        toast.success('Kapazität gespeichert')
        onCapacityChange?.()
      }
    } catch (error) {
      toast.error('Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveCustom = async () => {
    setIsSaving(true)
    try {
      const result = await removeMonthlyCapacity(month)

      if (result.error) {
        toast.error(result.error)
      } else {
        setCustomCapacity(null)
        setInputValue(defaultCapacity.toString())
        setIsEditing(false)
        toast.success('Kapazität zurückgesetzt auf Standard')
        onCapacityChange?.()
      }
    } catch (error) {
      toast.error('Fehler beim Zurücksetzen')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setInputValue((customCapacity || defaultCapacity).toString())
    setIsEditing(false)
  }

  const currentCapacity = customCapacity || defaultCapacity
  const isCustom = customCapacity !== null

  if (isLoading) {
    return (
      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Monatliche Kapazität
        </h3>
        {isCustom && (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">
            Benutzerdefiniert
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-600 dark:text-neutral-400 block mb-2">
              Maximale Sitzungen pro Woche
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="168"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="z.B. 30"
                className="flex-1"
                disabled={isSaving}
              />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">Stunden</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Bereich: 1-168 Stunden pro Woche
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="flex-1"
            >
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              disabled={isSaving}
            >
              Abbrechen
            </Button>
            {isCustom && (
              <Button
                onClick={handleRemoveCustom}
                variant="ghost"
                size="sm"
                disabled={isSaving}
                className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Auf Standard zurücksetzen"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {currentCapacity}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              {isCustom
                ? 'Für diesen Monat benutzerdefiniert'
                : 'Standard aus Einstellungen'}
            </p>
          </div>
          <Button
            onClick={() => {
              setIsEditing(true)
              setInputValue(currentCapacity.toString())
            }}
            variant="ghost"
            size="sm"
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
