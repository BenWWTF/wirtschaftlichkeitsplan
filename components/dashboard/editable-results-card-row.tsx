'use client'

import { useState } from 'react'
import type { ResultsRow } from '@/lib/actions/monthly-results'
import { formatEuro } from '@/lib/utils'
import { VarianceIndicator } from './variance-indicator'
import { AchievementBadge } from './achievement-badge'
import { Pencil, Check, X, Trash2 } from 'lucide-react'

interface EditableResultsCardRowProps {
  result: ResultsRow
  onSave: (therapyTypeId: string, actualSessions: number) => Promise<void>
  onDelete?: (therapyTypeId: string) => Promise<void>
}

export function EditableResultsCardRow({ result, onSave, onDelete }: EditableResultsCardRowProps) {
  const { therapy_type_id, therapy_name, price_per_session, planned_sessions, actual_sessions, variance, variancePercent, achievement } = result
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(actual_sessions?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    setEditValue(actual_sessions?.toString() || '')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleSave = async () => {
    const newValue = parseInt(editValue) || 0
    if (newValue === actual_sessions) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(therapy_type_id, newValue)
      setIsEditing(false)
      setEditValue('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(therapy_type_id)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-accent-50 dark:bg-accent-900/10 rounded-lg border-2 border-accent-300 dark:border-accent-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">{therapy_name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatEuro(price_per_session)}/Sitzung</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">Geplant</span>
            <span className="font-semibold text-neutral-900 dark:text-white">{planned_sessions}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">Tatsächlich</span>
            <input
              type="number"
              min="0"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-20 px-2 py-1 text-right rounded border border-accent-300 dark:border-accent-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
              autoFocus
            />
          </div>

          <div className="pt-2 border-t border-accent-200 dark:border-accent-800 flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">Abweichung</span>
            <span className="text-xs text-neutral-500">-</span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 text-sm font-medium"
            >
              <Check className="h-4 w-4" />
              Speichern
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white disabled:opacity-50 text-sm font-medium"
            >
              <X className="h-4 w-4" />
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-neutral-900 dark:text-white">{therapy_name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatEuro(price_per_session)}/Sitzung</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleEdit}
            disabled={isDeleting}
            className="p-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors disabled:opacity-50"
            title="Bearbeiten"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {onDelete && actual_sessions !== null && actual_sessions > 0 && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 text-neutral-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title="Ergebnisse zurücksetzen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Geplant</span>
          <span className="font-semibold text-neutral-900 dark:text-white">{planned_sessions}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Tatsächlich</span>
          <span className="font-semibold text-neutral-900 dark:text-white">{actual_sessions}</span>
        </div>

        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Abweichung</span>
          <VarianceIndicator variance={variance} variancePercent={variancePercent} achievement={achievement} size="sm" />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <AchievementBadge achievement={achievement} size="sm" />
        </div>
      </div>
    </div>
  )
}
