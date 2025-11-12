'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthlyPlanSchema, type MonthlyPlanInput } from '@/lib/validations'
import type { MonthlyPlan, TherapyType } from '@/lib/types'
import { upsertMonthlyPlanAction, deleteMonthlyPlanAction } from '@/lib/actions/monthly-plans'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface SessionPlannerGridProps {
  month: string
  therapies: TherapyType[]
  monthlyPlans: any[]
  onRefresh: () => void
}

export function SessionPlannerGrid({
  month,
  therapies,
  monthlyPlans,
  onRefresh,
}: SessionPlannerGridProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<MonthlyPlanInput>({
    resolver: zodResolver(MonthlyPlanSchema),
    defaultValues: {
      therapy_type_id: '',
      month: month,
      planned_sessions: 0,
      actual_sessions: undefined,
      notes: '',
    },
  })

  const handleAddPlan = async (therapy: TherapyType) => {
    setIsLoading(true)
    try {
      const result = await upsertMonthlyPlanAction({
        therapy_type_id: therapy.id,
        month: month,
        planned_sessions: 0,
        actual_sessions: undefined,
        notes: '',
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Plan hinzugefügt')
        onRefresh()
      }
    } catch (error) {
      toast.error('Fehler beim Hinzufügen des Plans')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePlan = async (
    planId: string,
    therapyId: string,
    updates: Partial<MonthlyPlanInput>
  ) => {
    setIsLoading(true)
    try {
      const currentPlan = monthlyPlans.find((p) => p.id === planId)
      const result = await upsertMonthlyPlanAction({
        therapy_type_id: therapyId,
        month: month,
        planned_sessions: updates.planned_sessions ?? currentPlan.planned_sessions,
        actual_sessions: updates.actual_sessions ?? currentPlan.actual_sessions,
        notes: updates.notes ?? currentPlan.notes,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Plan aktualisiert')
        onRefresh()
      }
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Plans')
    } finally {
      setIsLoading(false)
      setEditingId(null)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Möchten Sie diesen Plan wirklich löschen?')) return

    setIsLoading(true)
    try {
      const result = await deleteMonthlyPlanAction(planId)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Plan gelöscht')
        onRefresh()
      }
    } catch (error) {
      toast.error('Fehler beim Löschen des Plans')
    } finally {
      setIsLoading(false)
    }
  }

  const getTherapyName = (therapyId: string): string => {
    return therapies.find((t) => t.id === therapyId)?.name || 'Unbekannt'
  }

  const getTherapyPrice = (therapyId: string): number => {
    return therapies.find((t) => t.id === therapyId)?.price_per_session || 0
  }

  const getTherapyCost = (therapyId: string): number => {
    return therapies.find((t) => t.id === therapyId)?.variable_cost_per_session || 0
  }

  const plansByTherapy: Record<string, any> = {}
  monthlyPlans.forEach((plan) => {
    plansByTherapy[plan.therapy_type_id] = plan
  })

  const therapiesWithoutPlans = therapies.filter(
    (t) => !plansByTherapy[t.id]
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sitzungsplanung für {month}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {therapies.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Keine Therapiearten definiert. Erstellen Sie zunächst Therapiearten im Tab &quot;Therapien&quot;.
            </div>
          ) : (
            <>
              {/* Existing Plans */}
              {Object.keys(plansByTherapy).length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Geplante Therapiearten</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead>Therapieart</TableHead>
                          <TableHead className="text-right">Preis/Sitzung</TableHead>
                          <TableHead className="text-center">Geplante Sitzungen</TableHead>
                          <TableHead className="text-center">Tatsächliche Sitzungen</TableHead>
                          <TableHead className="text-right">Geplante Einnahmen</TableHead>
                          <TableHead className="text-right">Geplanter Gewinn</TableHead>
                          <TableHead className="text-center">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(plansByTherapy).map(([therapyId, plan]) => {
                          const price = getTherapyPrice(therapyId)
                          const cost = getTherapyCost(therapyId)
                          const plannedRevenue = plan.planned_sessions * price
                          const plannedCost = plan.planned_sessions * cost
                          const plannedProfit = plannedRevenue - plannedCost

                          return (
                            <TableRow key={plan.id}>
                              <TableCell className="font-medium">
                                {getTherapyName(therapyId)}
                              </TableCell>
                              <TableCell className="text-right">€{price.toFixed(2)}</TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  className="w-20 mx-auto"
                                  value={plan.planned_sessions}
                                  onChange={(e) =>
                                    handleUpdatePlan(plan.id, therapyId, {
                                      planned_sessions: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  disabled={isLoading}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  className="w-20 mx-auto"
                                  value={plan.actual_sessions || 0}
                                  onChange={(e) =>
                                    handleUpdatePlan(plan.id, therapyId, {
                                      actual_sessions: parseInt(e.target.value) || null,
                                    })
                                  }
                                  disabled={isLoading}
                                />
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">
                                €{plannedRevenue.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-blue-600 font-semibold">
                                €{plannedProfit.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePlan(plan.id)}
                                  disabled={isLoading}
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
                </div>
              )}

              {/* Add More Plans */}
              {therapiesWithoutPlans.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    {Object.keys(plansByTherapy).length > 0
                      ? 'Weitere Therapiearten hinzufügen'
                      : 'Therapiearten planen'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {therapiesWithoutPlans.map((therapy) => (
                      <Button
                        key={therapy.id}
                        variant="outline"
                        className="justify-between h-auto py-3"
                        onClick={() => handleAddPlan(therapy)}
                        disabled={isLoading}
                      >
                        <div className="text-left">
                          <div className="font-medium">{therapy.name}</div>
                          <div className="text-xs text-muted-foreground">
                            €{therapy.price_per_session.toFixed(2)}/Sitzung
                          </div>
                        </div>
                        <span className="text-lg">+</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
