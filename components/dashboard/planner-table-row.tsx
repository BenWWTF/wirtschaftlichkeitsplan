'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { TherapyType } from '@/lib/types'
import { MonthlyPlanSchema, type MonthlyPlanInput } from '@/lib/validations'
import { upsertMonthlyPlanAction, deleteMonthlyPlanAction } from '@/lib/actions/monthly-plans'
import { formatEuro } from '@/lib/utils'
import { toast } from 'sonner'
import { Check, X, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PlannerTableRowProps {
  therapy: TherapyType
  plan: any
  month: string
  plannedRevenue: number
  onRefresh: () => Promise<void>
}

export function PlannerTableRow({
  therapy,
  plan,
  month,
  plannedRevenue,
  onRefresh
}: PlannerTableRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  useEffect(() => {
    form.reset({
      therapy_type_id: therapy.id,
      month: month,
      planned_sessions: plan?.planned_sessions || 0,
      actual_sessions: plan?.actual_sessions || null,
      notes: plan?.notes || ''
    })
  }, [plan, therapy.id, month, form])

  async function onSubmit(values: MonthlyPlanInput) {
    try {
      setIsSaving(true)

      const result = await upsertMonthlyPlanAction(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(plan ? 'Plan aktualisiert' : 'Plan erstellt')
        setIsEditing(false)
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
      <tr className="bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30">
        <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
          {therapy.name}
        </td>
        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
          {formatEuro(therapy.price_per_session)}
        </td>
        <td className="px-6 py-4 text-center">
          <Input
            type="number"
            min="0"
            {...form.register('planned_sessions', { valueAsNumber: true })}
            className="w-20 h-9 text-center"
            placeholder="0"
          />
        </td>
        <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900 dark:text-white">
          {formatEuro((plannedSessions || 0) * therapy.price_per_session)}
        </td>
        <td className="px-6 py-4 text-center flex gap-2 justify-center">
          <Button
            size="sm"
            variant="default"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={isSaving}
            className="gap-1"
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
          >
            <X className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
      <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
        {therapy.name}
      </td>
      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
        {formatEuro(therapy.price_per_session)}
      </td>
      <td className="px-6 py-4 text-center text-sm font-medium text-neutral-900 dark:text-white">
        {plan?.planned_sessions || '—'}
      </td>
      <td className="px-6 py-4 text-right text-sm font-bold text-green-600 dark:text-green-400">
        {plannedRevenue > 0 ? formatEuro(plannedRevenue) : '—'}
      </td>
      <td className="px-6 py-4 text-center flex gap-2 justify-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
          className="gap-1"
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
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </td>
    </tr>
  )
}
