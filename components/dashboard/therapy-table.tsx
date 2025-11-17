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
import { useIsMobile } from '@/components/ui/hooks/useMediaQuery'
import { MobileCard, MobileCardRow } from '@/components/dashboard/mobile-card'

interface TherapyTableProps {
  therapies: TherapyType[]
  onEdit: (therapy: TherapyType) => void
  onDelete: (id: string) => Promise<void>
}

export function TherapyTable({ therapies, onEdit, onDelete }: TherapyTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [therapyToDelete, setTherapyToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMobile = useIsMobile()

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

  // Mobile view: Render cards
  if (isMobile) {
    if (therapies.length === 0) {
      return (
        <EmptyState
          icon={Pill}
          title="Keine Therapiearten vorhanden"
          description="Erstellen Sie Ihre erste Therapieart, um mit der Finanzplanung zu beginnen."
        />
      )
    }

    return (
      <>
        <div className="space-y-3">
          {therapies.map((therapy) => (
            <MobileCard
              key={therapy.id}
              title={therapy.name}
              badge={
                <span className="text-sm font-semibold text-accent-700 dark:text-accent-300 whitespace-nowrap">
                  {formatEuro(therapy.price_per_session)}
                </span>
              }
              actions={
                <div className="flex gap-2 w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(therapy)}
                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(therapy.id)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </div>
              }
            >
              <MobileCardRow
                label="Sitzungspreis"
                value={formatEuro(therapy.price_per_session)}
                variant="highlight"
              />
            </MobileCard>
          ))}
        </div>

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

  // Desktop view: Render table
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
