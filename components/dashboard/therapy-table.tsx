'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit2, Trash2, Pill } from 'lucide-react'
import type { TherapyType } from '@/lib/types'
import { formatEuro } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { ResponsiveTable } from '@/components/ui/responsive-table'
import type { Column } from '@/components/ui/responsive-table'

interface TherapyTableProps {
  therapies: TherapyType[]
  onEdit: (therapy: TherapyType) => void
  onDelete: (id: string) => Promise<void>
}

export function TherapyTable({ therapies, onEdit, onDelete }: TherapyTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [therapyToDelete, setTherapyToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (id: string) => {
    setTherapyToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!therapyToDelete) return

    setIsDeleting(true)
    try {
      await onDelete(therapyToDelete)
      setDeleteDialogOpen(false)
      setTherapyToDelete(null)
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Define columns for ResponsiveTable
  const columns: Column<TherapyType>[] = [
    {
      key: 'name',
      header: 'Therapieart',
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'price_per_session',
      header: 'Sitzungspreis',
      align: 'right',
      cell: (value) => (
        <span className="font-semibold">{formatEuro(value)}</span>
      ),
    },
    {
      key: 'variable_cost_per_session',
      header: 'Variable Kosten',
      align: 'right',
      cell: (value) => <span className="text-muted-foreground">{formatEuro(value)}</span>,
    },
    {
      key: 'id',
      header: 'Beitragsmarge',
      align: 'right',
      cell: (_, therapy) => {
        const contributionMargin = therapy.price_per_session - therapy.variable_cost_per_session
        const contributionMarginPercent =
          therapy.price_per_session > 0
            ? ((contributionMargin / therapy.price_per_session) * 100).toFixed(1)
            : 0
        return (
          <div className="flex flex-col items-end">
            <span className="font-semibold text-green-600">{formatEuro(contributionMargin)}</span>
            <span className="text-xs text-muted-foreground">{contributionMarginPercent}%</span>
          </div>
        )
      },
    },
    {
      key: 'id',
      header: 'Aktionen',
      align: 'right',
      cell: (_, therapy) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(therapy)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            title="Bearbeiten"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(therapy.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            disabled={isDeleting}
            title="Löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <ResponsiveTable
        data={therapies}
        columns={columns}
        rowKey={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Pill}
            title="Keine Therapiearten vorhanden"
            description="Erstellen Sie Ihre erste Therapieart, um mit der Finanzplanung zu beginnen."
          />
        }
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Therapieart löschen?</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Therapieart und alle damit verbundenen Daten werden permanent gelöscht.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
