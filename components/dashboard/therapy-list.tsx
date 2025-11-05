'use client'

import { useState } from 'react'
import type { TherapyType } from '@/lib/types'
import { TherapyDialog } from './therapy-dialog'
import { TherapyTable } from './therapy-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface TherapyListProps {
  initialTherapies: TherapyType[]
}

export function TherapyList({ initialTherapies }: TherapyListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTherapy, setSelectedTherapy] = useState<TherapyType | null>(
    null
  )

  function handleEdit(therapy: TherapyType) {
    setSelectedTherapy(therapy)
    setDialogOpen(true)
  }

  function handleCreate() {
    setSelectedTherapy(null)
    setDialogOpen(true)
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setSelectedTherapy(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Therapiearten
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Verwalten Sie Ihre Therapiearten, Preise und Kosten
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Neue Therapieart
        </Button>
      </div>

      {/* Stats Cards */}
      {initialTherapies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Therapiearten
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {initialTherapies.length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Durchschnittspreis
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              €{' '}
              {(
                initialTherapies.reduce(
                  (sum, t) => sum + t.price_per_session,
                  0
                ) / initialTherapies.length
              ).toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Durchschnittsmarge
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(
                (initialTherapies.reduce(
                  (sum, t) =>
                    sum +
                    ((t.price_per_session - t.variable_cost_per_session) /
                      t.price_per_session) *
                      100,
                  0
                ) /
                  initialTherapies.length || 0)
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <TherapyTable therapies={initialTherapies} onEdit={handleEdit} />

      {/* Dialog */}
      <TherapyDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        therapy={selectedTherapy}
      />
    </div>
  )
}
