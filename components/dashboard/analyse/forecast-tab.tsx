'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, AlertCircle } from 'lucide-react'
import type { UnifiedMetricsResponse } from '@/lib/metrics/unified-metrics'
import { formatCurrency } from '@/lib/utils/formatting'

interface ForecastTabProps {
  metrics: UnifiedMetricsResponse
}

export function ForecastTab({ metrics }: ForecastTabProps) {
  // Use current period expenses as baseline (no previous period data available in UnifiedMetricsResponse)
  const baselineMonthlyExpenses = metrics.totalExpenses

  // Calculate average revenue per session for default
  const defaultAvgRevenuePerSession = metrics.totalSessions > 0
    ? metrics.totalRevenue / metrics.totalSessions
    : metrics.averageSessionPrice

  // Calculate break-even sessions for initial value
  const initialBreakEvenSessions = baselineMonthlyExpenses > 0
    ? Math.ceil(baselineMonthlyExpenses / (defaultAvgRevenuePerSession * (1 - 0.0139)))
    : 0

  // Initialize with break-even number of sessions
  const [monthlySessionCount, setMonthlySessionCount] = useState<number>(initialBreakEvenSessions || metrics.totalSessions || 10)
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState<number>(baselineMonthlyExpenses)

  // Allow manual adjustment of price per session
  const [pricePerSession, setPricePerSession] = useState<number>(defaultAvgRevenuePerSession)

  // Calculate 6-month forecast based on monthly session count and adjustable price per session
  const forecastData = Array.from({ length: 6 }, (_, i) => {
    const monthNum = i + 1
    const month = new Date()
    month.setMonth(month.getMonth() + i)
    const monthName = month.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })

    // Revenue calculation: sessions × adjustable price per session
    const monthlyRevenue = Math.round(monthlySessionCount * pricePerSession)

    // Apply SumUp fee to get net revenue
    const sumupFeePercent = 1.39 // Default SumUp fee
    const netRevenue = Math.round(monthlyRevenue * (1 - sumupFeePercent / 100))

    // Use editable monthly fixed costs
    const monthlyExpenses = monthlyFixedCosts

    // Profit = Net Revenue - Expenses
    const monthlyProfit = netRevenue - monthlyExpenses

    return {
      month: monthName,
      revenue: netRevenue,
      expenses: monthlyExpenses,
      profit: monthlyProfit
    }
  })

  const totalForecastedProfit = forecastData.reduce((sum, d) => sum + d.profit, 0)
  const averageMonthlyProfit = Math.round(totalForecastedProfit / 6)
  const breakEvenSessions = monthlyFixedCosts > 0
    ? Math.ceil(monthlyFixedCosts / (pricePerSession * (1 - 0.0139)))
    : 0

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <strong>ℹ️ Hinweis:</strong> Alle Umsatzzahlen sind <strong>Netto</strong> (nach SumUp-Gebühren von 1,39% abgezogen)
        </p>
      </div>

      {/* Session & Cost Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Session Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sitzungen pro Monat</CardTitle>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Geplante Anzahl der Sitzungen
            </p>
          </CardHeader>
          <CardContent>
            <input
              type="number"
              value={monthlySessionCount}
              onChange={(e) => setMonthlySessionCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              min="1"
            />
          </CardContent>
        </Card>

        {/* Price Per Session Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preis pro Sitzung</CardTitle>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Anpassbar
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <input
                type="number"
                value={Math.round(pricePerSession)}
                onChange={(e) => setPricePerSession(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                min="1"
              />
              <div className="text-xs text-neutral-500">
                Standard: {formatCurrency(defaultAvgRevenuePerSession)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fixed Costs Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fixkosten pro Monat</CardTitle>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Basierend auf aktuellem Monat
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <input
                type="number"
                value={monthlyFixedCosts}
                onChange={(e) => setMonthlyFixedCosts(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                min="0"
              />
              <div className="text-xs text-neutral-500">
                Aktueller Monat: {formatCurrency(metrics.totalExpenses)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Break-Even Indicator */}
      <Card className={monthlySessionCount >= breakEvenSessions ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Break-Even Punkt</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{breakEvenSessions} Sitzungen/Monat</p>
            </div>
            <div className="text-right">
              {monthlySessionCount >= breakEvenSessions ? (
                <>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">✅ Oben Break-Even</p>
                  <p className="text-xs text-green-600 dark:text-green-400">+{monthlySessionCount - breakEvenSessions} Sitzungen über Break-Even</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">⚠️ Unter Break-Even</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{breakEvenSessions - monthlySessionCount} Sitzungen fehlen</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              6-Monats-Gewinn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalForecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totalForecastedProfit)}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Bei {monthlySessionCount} Sitzungen/Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Ø Gewinn pro Monat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${averageMonthlyProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(averageMonthlyProfit)}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Monatlicher Durchschnitt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Prognostizierte Kosten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(monthlyFixedCosts)}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Verwendet in Prognose
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>6-Monats-Trendprognose</CardTitle>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Basierend auf aktuellen Trends mit angenommener Wachstumsrate
          </p>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  name="Umsatz"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  name="Kosten"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  name="Gewinn"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaillierte Prognose</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 px-3 font-semibold text-neutral-900 dark:text-white">Monat</th>
                  <th className="text-right py-2 px-3 font-semibold text-neutral-900 dark:text-white">Umsatz</th>
                  <th className="text-right py-2 px-3 font-semibold text-neutral-900 dark:text-white">Kosten</th>
                  <th className="text-right py-2 px-3 font-semibold text-neutral-900 dark:text-white">Gewinn</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.map((row, i) => (
                  <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="py-3 px-3 text-neutral-900 dark:text-white">{row.month}</td>
                    <td className="py-3 px-3 text-right text-neutral-900 dark:text-white">{formatCurrency(row.revenue)}</td>
                    <td className="py-3 px-3 text-right text-neutral-900 dark:text-white">{formatCurrency(row.expenses)}</td>
                    <td className="py-3 px-3 text-right font-semibold">
                      <span className="text-green-600 dark:text-green-400">{formatCurrency(row.profit)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Prognose-Einblicke
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          {monthlySessionCount >= breakEvenSessions ? (
            <>
              <li>✅ Mit {monthlySessionCount} Sitzungen/Monat erzielen Sie einen Gewinn von {formatCurrency(averageMonthlyProfit)}</li>
              <li>• Sie benötigen mindestens {breakEvenSessions} Sitzungen/Monat, um Ihre Kosten zu decken (Break-Even)</li>
              <li>• Zusätzliche Sitzungen: Jede weitere Sitzung bringt durchschnittlich {formatCurrency(pricePerSession * (1 - 0.0139))} Netto-Umsatz</li>
              <li>• Überprüfen Sie Ihre Termine und Marketing, um die geplanten {monthlySessionCount} Sitzungen zu erreichen</li>
            </>
          ) : (
            <>
              <li>⚠️ Mit nur {monthlySessionCount} Sitzungen/Monat haben Sie einen Verlust von {formatCurrency(averageMonthlyProfit)}</li>
              <li>• Sie benötigen mindestens {breakEvenSessions} Sitzungen/Monat zur Kostendeckung</li>
              <li>• Das sind {breakEvenSessions - monthlySessionCount} zusätzliche Sitzungen pro Monat</li>
              <li>• Erhöhen Sie Ihre Marketing-Aktivitäten oder passen Sie Ihre Kostenstruktur an</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}
