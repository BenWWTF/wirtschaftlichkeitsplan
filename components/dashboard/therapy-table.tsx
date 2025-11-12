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
import { Edit2, Trash2 } from 'lucide-react'
import type { TherapyType } from '@/lib/types'
import { formatEuro } from '@/lib/utils'

interface TherapyTableProps {
  therapies: TherapyType[]
  onEdit: (therapy: TherapyType) => void
  onDelete: (id: string) => Promise<void>
}

export function TherapyTable({ therapies, onEdit, onDelete }: TherapyTableProps) {
  const handleDelete = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Therapieart löschen möchten?')) {
      try {
        await onDelete(id)
      } catch (error) {
        console.error('Fehler beim Löschen:', error)
      }
    }
  }

  if (therapies.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Keine Therapiearten vorhanden. Erstellen Sie eine neue Therapieart, um zu beginnen.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="font-semibold">Therapieart</TableHead>
            <TableHead className="text-right font-semibold">Sitzungspreis</TableHead>
            <TableHead className="text-right font-semibold">Variable Kosten</TableHead>
            <TableHead className="text-right font-semibold">Beitragsmarge</TableHead>
            <TableHead className="w-32 text-right font-semibold">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {therapies.map((therapy) => {
            const contributionMargin = therapy.price_per_session - therapy.variable_cost_per_session
            const contributionMarginPercent =
              therapy.price_per_session > 0
                ? ((contributionMargin / therapy.price_per_session) * 100).toFixed(1)
                : 0

            return (
              <TableRow key={therapy.id} className="border-border hover:bg-muted/50">
                <TableCell className="font-medium">{therapy.name}</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold">{formatEuro(therapy.price_per_session)}</span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatEuro(therapy.variable_cost_per_session)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-green-600">
                      {formatEuro(contributionMargin)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {contributionMarginPercent}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(therapy)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(therapy.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
