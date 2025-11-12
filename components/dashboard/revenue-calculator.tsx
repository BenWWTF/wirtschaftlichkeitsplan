'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TherapyType } from '@/lib/types'

interface RevenueCalculatorProps {
  month: string
  monthlyPlans: any[]
  therapies: TherapyType[]
}

export function RevenueCalculator({
  month,
  monthlyPlans,
  therapies,
}: RevenueCalculatorProps) {
  const getTherapyName = (therapyId: string): string => {
    return therapies.find((t) => t.id === therapyId)?.name || 'Unbekannt'
  }

  const getTherapyPrice = (therapyId: string): number => {
    return therapies.find((t) => t.id === therapyId)?.price_per_session || 0
  }

  const getTherapyCost = (therapyId: string): number => {
    return therapies.find((t) => t.id === therapyId)?.variable_cost_per_session || 0
  }

  // Calculate totals
  let totalPlannedRevenue = 0
  let totalPlannedCost = 0
  let totalPlannedProfit = 0
  let totalActualRevenue = 0
  let totalActualCost = 0
  let totalActualProfit = 0

  const breakdownData = monthlyPlans.map((plan) => {
    const price = getTherapyPrice(plan.therapy_type_id)
    const cost = getTherapyCost(plan.therapy_type_id)

    const plannedRevenue = plan.planned_sessions * price
    const plannedCostAmount = plan.planned_sessions * cost
    const plannedProfit = plannedRevenue - plannedCostAmount

    const actualSessions = plan.actual_sessions || 0
    const actualRevenue = actualSessions * price
    const actualCostAmount = actualSessions * cost
    const actualProfit = actualRevenue - actualCostAmount

    totalPlannedRevenue += plannedRevenue
    totalPlannedCost += plannedCostAmount
    totalPlannedProfit += plannedProfit

    totalActualRevenue += actualRevenue
    totalActualCost += actualCostAmount
    totalActualProfit += actualProfit

    return {
      therapyId: plan.therapy_type_id,
      therapyName: getTherapyName(plan.therapy_type_id),
      plannedSessions: plan.planned_sessions,
      actualSessions,
      price,
      cost,
      plannedRevenue,
      plannedCost: plannedCostAmount,
      plannedProfit,
      actualRevenue,
      actualCost: actualCostAmount,
      actualProfit,
      marginPercentage:
        price > 0
          ? (((price - cost) / price) * 100).toFixed(1)
          : '0',
    }
  })

  const plannedMarginPercent = totalPlannedRevenue > 0
    ? ((totalPlannedProfit / totalPlannedRevenue) * 100).toFixed(1)
    : '0'

  const actualMarginPercent = totalActualRevenue > 0
    ? ((totalActualProfit / totalActualRevenue) * 100).toFixed(1)
    : '0'

  const monthLabel = new Date(month + '-01').toLocaleDateString('de-AT', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Geplante Einnahmen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{totalPlannedRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyPlans.reduce((sum, p) => sum + p.planned_sessions, 0)} Sitzungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Geplante Kosten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              €{totalPlannedCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalPlannedCost / totalPlannedRevenue) * 100).toFixed(1)}% der Einnahmen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Geplanter Gewinn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              €{totalPlannedProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {plannedMarginPercent}% Marge
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {breakdownData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gewinnberechnung nach Therapieart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="text-left py-2 px-3">Therapieart</th>
                    <th className="text-center py-2 px-3">Sitzungen</th>
                    <th className="text-right py-2 px-3">Preis</th>
                    <th className="text-right py-2 px-3">Kosten</th>
                    <th className="text-right py-2 px-3">Marge</th>
                    <th className="text-right py-2 px-3">Einnahmen</th>
                    <th className="text-right py-2 px-3">Kosten (gesamt)</th>
                    <th className="text-right py-2 px-3">Gewinn</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownData.map((row) => (
                    <tr key={row.therapyId} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{row.therapyName}</td>
                      <td className="py-2 px-3 text-center">{row.plannedSessions}</td>
                      <td className="py-2 px-3 text-right">€{row.price.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">€{row.cost.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">
                        <span className="font-semibold text-green-600">
                          {row.marginPercentage}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        €{row.plannedRevenue.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-orange-600">
                        €{row.plannedCost.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-blue-600">
                        €{row.plannedProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {monthlyPlans.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Keine geplanten Therapiesitzungen für {monthLabel}. 
            Fügen Sie Sitzungen in der Sitzungsplanung oben hinzu.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
