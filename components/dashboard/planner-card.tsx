'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { TherapyType } from '@/lib/types'
import { MonthlyPlanSchema, type MonthlyPlanInput } from '@/lib/validations'
import { upsertMonthlyPlanAction, getMonthlyPlans, deleteMonthlyPlanAction } from '@/lib/actions/monthly-plans'
import { formatEuro } from '@/lib/utils'
import { calculatePaymentFee, calculateNetRevenue, SUMUP_FEE_RATE } from '@/lib/calculations/payment-fees'
import { toast } from 'sonner'
import { ChevronDown, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface PlannerCardProps {
  therapy: TherapyType
  month: string
  isExpanded: boolean
  onToggleExpand: () => void
  onRefresh?: () => Promise<void>
}

interface MonthlyPlanData {
  id: string
  planned_sessions: number
  actual_sessions: number | null
  notes: string | null
}

export function PlannerCard({
  therapy,
  month,
  isExpanded,
  onToggleExpand,
  onRefresh
}: PlannerCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [planData, setPlanData] = useState<MonthlyPlanData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<MonthlyPlanInput>({
    resolver: zodResolver(MonthlyPlanSchema),
    defaultValues: {
      therapy_type_id: therapy.id,
      month: month,
      planned_sessions: 4,
      actual_sessions: null,
      notes: ''
    }
  })

  // Load existing plan for this therapy and month
  useEffect(() => {
    const loadPlan = async () => {
      const plans = await getMonthlyPlans(month)
      const existingPlan = plans.find((p) => p.therapy_type_id === therapy.id)

      if (existingPlan) {
        setPlanData(existingPlan as MonthlyPlanData)
        form.reset({
          therapy_type_id: therapy.id,
          month: month,
          planned_sessions: existingPlan.planned_sessions,
          actual_sessions: existingPlan.actual_sessions,
          notes: existingPlan.notes || ''
        })
      }
    }

    loadPlan()
  }, [therapy.id, month, form])

  async function onSubmit(values: MonthlyPlanInput) {
    try {
      setIsLoading(true)

      const result = await upsertMonthlyPlanAction(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(planData ? 'Plan aktualisiert' : 'Plan erstellt')
        setPlanData(result.data?.[0])

        // Refresh the parent's plan list to update totals
        if (onRefresh) {
          await onRefresh()
        }
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleDeleteClick() {
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!planData) return

    setIsDeleting(true)
    try {
      const result = await deleteMonthlyPlanAction(planData.id)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Plan gelöscht')
        setPlanData(null)
        form.reset()
        setDeleteDialogOpen(false)

        // Refresh the parent's plan list to update totals
        if (onRefresh) {
          await onRefresh()
        }
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Calculate values for display
  const plannedSessions = form.watch('planned_sessions')
  const grossRevenue = plannedSessions * therapy.price_per_session
  const paymentFees = calculatePaymentFee(grossRevenue)
  const netRevenue = calculateNetRevenue(grossRevenue)
  const feePercentage = (SUMUP_FEE_RATE * 100).toFixed(2)

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {therapy.name}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {formatEuro(therapy.price_per_session)} pro Sitzung
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-neutral-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Planned Sessions */}
              <FormField
                control={form.control}
                name="planned_sessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geplante Sitzungen</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="4"
                        min="0"
                        disabled={isLoading}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Wie viele Sitzungen planen Sie?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actual Sessions */}
              <FormField
                control={form.control}
                name="actual_sessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durchgeführte Sitzungen</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="—"
                        min="0"
                        disabled={isLoading}
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value, 10)
                              : null
                          )
                        }
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Aktualisieren Sie am Monatsende
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Urlaub, erhöhte Nachfrage..."
                        disabled={isLoading}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Summary with Fee Breakdown */}
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Bruttoumsatz:
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {formatEuro(grossRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Zahlungsgebuehren ({feePercentage}%):
                  </span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatEuro(paymentFees)}
                  </span>
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                    Nettoumsatz:
                  </span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatEuro(netRevenue)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 gap-2"
                >
                  <Check className="h-4 w-4" />
                  {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                </Button>
                {planData && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isLoading || isDeleting}
                    onClick={handleDeleteClick}
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monatsplan löschen?</DialogTitle>
            <DialogDescription>
              Der Plan für {therapy.name} im Monat {month} wird permanent gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
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
    </div>
  )
}
