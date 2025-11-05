'use client'

import { useState } from 'react'
import type { TherapyType } from '@/lib/types'
import { deleteTherapyAction } from '@/lib/actions/therapies'
import { formatEuro } from '@/lib/utils'
import { toast } from 'sonner'
import { Edit2, Trash2, AlertCircle } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface TherapyTableProps {
  therapies: TherapyType[]
  onEdit: (therapy: TherapyType) => void
  isLoading?: boolean
}

export function TherapyTable({
  therapies,
  onEdit,
  isLoading = false
}: TherapyTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(therapy: TherapyType) {
    if (!window.confirm(`Möchten Sie "${therapy.name}" wirklich löschen?`)) {
      return
    }

    try {
      setDeletingId(therapy.id)
      const result = await deleteTherapyAction(therapy.id)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Therapieart gelöscht')
      }
    } catch (error) {
      toast.error('Fehler beim Löschen')
      console.error(error)
    } finally {
      setDeletingId(null)
    }
  }

  if (therapies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Keine Therapiearten vorhanden
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-sm">
          Erstellen Sie Ihre erste Therapieart, um zu beginnen. Klicken Sie auf &quot;Neue Therapieart&quot;, um eine hinzuzufügen.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Preis pro Sitzung</TableHead>
            <TableHead className="text-right">Variable Kosten</TableHead>
            <TableHead className="text-right">Deckungsbeitrag</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {therapies.map((therapy) => {
            const margin =
              therapy.price_per_session - therapy.variable_cost_per_session
            const marginPercent =
              (margin / therapy.price_per_session) * 100

            return (
              <TableRow key={therapy.id}>
                <TableCell className="font-medium">{therapy.name}</TableCell>
                <TableCell className="text-right">
                  {formatEuro(therapy.price_per_session)}
                </TableCell>
                <TableCell className="text-right">
                  {formatEuro(therapy.variable_cost_per_session)}
                </TableCell>
                <TableCell>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatEuro(margin)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {marginPercent.toFixed(1)}%
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(therapy)}
                      disabled={isLoading || deletingId === therapy.id}
                      title="Bearbeiten"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(therapy)}
                      disabled={isLoading || deletingId === therapy.id}
                      title="Löschen"
                    >
                      {deletingId === therapy.id ? (
                        <span className="text-xs">Lösching...</span>
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
