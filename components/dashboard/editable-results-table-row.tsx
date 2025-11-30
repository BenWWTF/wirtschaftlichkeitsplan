'use client'

import { useState } from 'react'
import type { ResultsRow } from '@/lib/actions/monthly-results'
import { formatEuro } from '@/lib/utils'
import { VarianceIndicator } from './variance-indicator'
import { AchievementBadge } from './achievement-badge'
import { Pencil, Check, X } from 'lucide-react'

interface EditableResultsTableRowProps {
  result: ResultsRow
  onSave: (therapyTypeId: string, actualSessions: number) => Promise<void>
}

export function EditableResultsTableRow({ result, onSave }: EditableResultsTableRowProps) {
  const { id, therapy_type_id, therapy_name, price_per_session, planned_sessions, actual_sessions, variance, variancePercent, achievement } = result
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(actual_sessions?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)

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

  if (isEditing) {
    return (
      <tr className="bg-blue-50 dark:bg-blue-900/10 border-b border-neutral-200 dark:border-neutral-700">
        <td className="px-6 py-4">
          <p className="font-medium text-neutral-900 dark:text-white">{therapy_name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatEuro(price_per_session)}/Sitzung</p>
        </td>
        <td className="px-6 py-4 text-center font-semibold text-neutral-900 dark:text-white">
          {planned_sessions}
        </td>
        <td className="px-6 py-4 text-center">
          <input
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-16 px-2 py-1 text-center rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
            autoFocus
          />
        </td>
        <td className="px-6 py-4 text-center text-neutral-600 dark:text-neutral-400">
          -
        </td>
        <td className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
              title="Speichern"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 text-neutral-600 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 disabled:opacity-50"
              title="Abbrechen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 transition-colors">
      <td className="px-6 py-4">
        <p className="font-medium text-neutral-900 dark:text-white">{therapy_name}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatEuro(price_per_session)}/Sitzung</p>
      </td>
      <td className="px-6 py-4 text-center font-semibold text-neutral-900 dark:text-white">
        {planned_sessions}
      </td>
      <td className="px-6 py-4 text-center font-semibold text-neutral-900 dark:text-white">
        {actual_sessions}
      </td>
      <td className="px-6 py-4 text-center">
        <VarianceIndicator variance={variance} variancePercent={variancePercent} achievement={achievement} size="md" />
      </td>
      <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
        <AchievementBadge achievement={achievement} size="md" />
        <button
          onClick={handleEdit}
          className="ml-2 p-1 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          title="Bearbeiten"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}
