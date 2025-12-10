'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { TherapyType } from '@/lib/types'
import { MonthlyPlanSchema, type MonthlyPlanInput } from '@/lib/validations'
import { upsertMonthlyPlanAction, deleteMonthlyPlanAction } from '@/lib/actions/monthly-plans'
import { formatEuro } from '@/lib/utils'
import { toast } from 'sonner'
import { Check, X, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PlannerCardRowProps {
  therapy: TherapyType
  plan: any
  month: string
  plannedRevenue: number
  onRefresh: () => Promise<void>
}

/**
 * Mobile Card View for Planning Row
 * Displays therapy data as an expandable card on mobile devices
 */
export function PlannerCardRow({
  therapy,
  plan,
  month,
  plannedRevenue,
  onRefresh
}: PlannerCardRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const form = useForm<MonthlyPlanInput>({
    resolver: zodResolver(MonthlyPlanSchema),
    defaultValues: {
      therapy_type_id: therapy.id,
      month: month,
      planned_sessions: plan?.planned_sessions || 0,
      actual_sessions: plan?.actual_sessions || null,
      notes: plan?.notes || ''
    }
  })

  async function onSubmit(values: MonthlyPlanInput) {
    try {
      setIsSaving(true)

      const result = await upsertMonthlyPlanAction(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(plan ? 'Plan aktualisiert' : 'Plan erstellt')
        setIsEditing(false)
        setIsExpanded(false)
        await onRefresh()
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!plan?.id) {
      toast.error('Keine Plan-ID vorhanden')
      return
    }

    try {
      setIsDeleting(true)

      const result = await deleteMonthlyPlanAction(plan.id)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Plan gelöscht')
        setIsExpanded(false)
        await onRefresh()
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const plannedSessions = form.watch('planned_sessions')

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-blue-200 dark:border-blue-700 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-white">{therapy.name}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(false)
              form.reset()
            }}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Price Info */}
        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
          <span>Preis/Sitzung:</span>
          <span className="font-medium">{formatEuro(therapy.price_per_session)}</span>
        </div>

        {/* Input Field */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Geplante Sitzungen
          </label>
          <Input
            type="number"
            min="0"
            {...form.register('planned_sessions', { valueAsNumber: true })}
            className="w-full"
            placeholder="0"
          />
        </div>

        {/* Calculated Revenue */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Geschätzter Umsatz:</span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {formatEuro((plannedSessions || 0) * therapy.price_per_session)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={isSaving}
            className="flex-1 gap-1"
          >
            <Check className="h-4 w-4" />
            Speichern
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(false)
              form.reset()
            }}
            disabled={isSaving}
            className="flex-1"
          >
            Abbrechen
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Card Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
      >
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{therapy.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {plannedRevenue > 0 ? formatEuro(plannedRevenue) : '—'}
            </span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {plan?.planned_sessions || 0} Sitzungen
            </span>
          </div>
        </div>
        <div className="text-neutral-400">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-4 space-y-3">
          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Preis pro Sitzung:</span>
              <span className="font-medium">{formatEuro(therapy.price_per_session)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Geplante Sitzungen:</span>
              <span className="font-medium">{plan?.planned_sessions || '—'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Umsatz:</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {plannedRevenue > 0 ? formatEuro(plannedRevenue) : '—'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="flex-1 gap-1"
            >
              <Edit2 className="h-4 w-4" />
              Bearbeiten
            </Button>
            {plan && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
