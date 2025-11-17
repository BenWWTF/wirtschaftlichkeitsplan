'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { TherapyType } from '@/lib/types'
import { TherapyTable } from './therapy-table'
import { TherapyDialog } from './therapy-dialog'
import { deleteTherapyAction } from '@/lib/actions/therapies'
import { toast } from 'sonner'

interface TherapyListProps {
  therapies: TherapyType[]
}

export function TherapyList({ therapies }: TherapyListProps) {
  const [open, setOpen] = useState(false)
  const [selectedTherapy, setSelectedTherapy] = useState<TherapyType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (therapy: TherapyType) => {
    setSelectedTherapy(therapy)
    setOpen(true)
  }

  const handleCreate = () => {
    setSelectedTherapy(null)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const result = await deleteTherapyAction(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Therapieart erfolgreich gelöscht')
      }
    } catch (error) {
      console.error('Error deleting therapy:', error)
      toast.error('Fehler beim Löschen der Therapieart')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Therapiearten</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Therapiearten und deren Preise
          </p>
        </div>
        <Button onClick={handleCreate} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Neue Therapieart
        </Button>
      </div>

      <TherapyTable
        therapies={therapies}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TherapyDialog
        open={open}
        onOpenChange={setOpen}
        therapy={selectedTherapy}
        onSuccess={() => {
          setOpen(false)
          setSelectedTherapy(null)
          // Trigger a page refresh or reload from server
          window.location.reload()
        }}
      />
    </div>
  )
}
