'use client'

import { useState, useEffect, useMemo } from 'react'
import { getBreakEvenHistory } from '@/lib/actions/analysis'
import { formatEuro } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BreakEvenHistoryProps {
  fixedCosts: number
}

export function BreakEvenHistory({ fixedCosts }: BreakEvenHistoryProps) {
  const [monthRange, setMonthRange] = useState<'last3' | 'last6' | 'last12'>('last3')
  const [historyData, setHistoryData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load history data
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      try {
        const data = await getBreakEvenHistory(monthRange, fixedCosts)
        setHistoryData(data || [])
      } catch (error) {
        console.error('Error loading break-even history:', error)
        setHistoryData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [monthRange, fixedCosts])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (historyData.length === 0) {
      return null
    }

    const bestMonth = historyData.reduce((best, current) =>
      current.sessionsNeeded < best.sessionsNeeded ? current : best
    )

    const worstMonth = historyData.reduce((worst, current) =>
      current.sessionsNeeded > worst.sessionsNeeded ? current : worst
    )

    const avgSessionsNeeded =
      historyData.reduce((sum, d) => sum + d.sessionsNeeded, 0) / historyData.length

    const surplusCount = historyData.filter(d => d.profitabilityStatus === 'surplus').length
    const trend = surplusCount > historyData.length / 2 ? 'improving' : 'declining'

    return {
      bestMonth,
      worstMonth,
      avgSessionsNeeded,
      surplusCount,
      trend
    }
  }, [historyData])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-neutral-600 dark:text-neutral-400">Wird geladen...</div>
      </div>
    )
  }

  if (historyData.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
          Keine Daten vorhanden
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Erstellen Sie monatliche Pläne, um die Break-Even-Verlauf zu sehen.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Range Selector */}
      <div className="flex gap-2">
        <Button
          onClick={() => setMonthRange('last3')}
          variant={monthRange === 'last3' ? 'default' : 'outline'}
          size="sm"
        >
          Letzte 3 Monate
        </Button>
        <Button
          onClick={() => setMonthRange('last6')}
          variant={monthRange === 'last6' ? 'default' : 'outline'}
          size="sm"
        >
          Letzte 6 Monate
        </Button>
        <Button
          onClick={() => setMonthRange('last12')}
          variant={monthRange === 'last12' ? 'default' : 'outline'}
          size="sm"
        >
          Letzte 12 Monate
        </Button>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Break-Even-Verlauf
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              style={{ color: 'currentColor' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              style={{ color: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              formatter={(value) => {
                if (typeof value === 'number') {
                  return [Math.round(value), '']
                }
                return value
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="sessionsNeeded"
              stroke="#3b82f6"
              name="Sitzungen für Break-Even"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="actualSessions"
              stroke="#10b981"
              name="Durchgeführte Sitzungen"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Month */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              ✅ Bester Monat
            </h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summaryStats.bestMonth.month}
            </p>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              {summaryStats.bestMonth.sessionsNeeded} Sitzungen benötigt
            </p>
          </div>

          {/* Worst Month */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
              ⚠️ Schwächster Monat
            </h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summaryStats.worstMonth.month}
            </p>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              {summaryStats.worstMonth.sessionsNeeded} Sitzungen benötigt
            </p>
          </div>

          {/* Trend */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📈 Trend
            </h4>
            <div className="flex items-center gap-2">
              {summaryStats.trend === 'improving' ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-blue-800 dark:text-blue-200">Verbesserung</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-blue-800 dark:text-blue-200">Verschlechterung</span>
                </>
              )}
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
              {summaryStats.surplusCount} von {historyData.length} Monaten profitabel
            </p>
          </div>

          {/* Average Sessions */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              📊 Durchschnitt
            </h4>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {Math.round(summaryStats.avgSessionsNeeded)}
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              Durchschnittliche Sitzungen für Break-Even
            </p>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-neutral-900 dark:text-white">
                  Monat
                </th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-white">
                  Break-Even
                </th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-white">
                  Tatsächlich
                </th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-white">
                  Differenz
                </th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-900 dark:text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {historyData.map((row) => (
                <tr
                  key={row.month}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                >
                  <td className="px-4 py-3 text-neutral-900 dark:text-white font-medium">
                    {row.month}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                    {row.sessionsNeeded}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                    {row.actualSessions}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      row.surplusDeficit > 0
                        ? 'text-green-600 dark:text-green-400'
                        : row.surplusDeficit < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {row.surplusDeficit > 0 ? '+' : ''}
                    {row.surplusDeficit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        row.profitabilityStatus === 'surplus'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : row.profitabilityStatus === 'breakeven'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {row.profitabilityStatus === 'surplus'
                        ? '✓ Überschuss'
                        : row.profitabilityStatus === 'breakeven'
                          ? '= Break-Even'
                          : '✗ Defizit'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
