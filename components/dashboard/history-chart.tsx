'use client'

import type { MonthlyHistory } from '@/lib/metrics/history-metrics'

interface HistoryChartProps {
  history: MonthlyHistory[]
}

export function HistoryChart({ history }: HistoryChartProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format month for display
  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('de-DE', {
      month: 'short',
      year: '2-digit'
    })
  }

  // Find min and max for scaling
  const allRevenues = history.flatMap(h => [h.forecast_revenue, h.actual_revenue])
  const maxRevenue = Math.max(...allRevenues, 1)
  const minRevenue = 0

  // Calculate bar heights (as percentages)
  const getBarHeight = (revenue: number) => {
    if (maxRevenue === 0) return 0
    return (revenue / maxRevenue) * 100
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">12-Monats-Trend</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Noch keine Verlaufsdaten verfügbar.</p>
          <p className="text-sm text-gray-500 mt-2">
            Daten werden angezeigt, sobald Sie Sitzungen absolviert haben.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">12-Monats-Trend</h2>
        <p className="text-gray-600 text-sm mt-1">
          Vergleich der geplanten (Prognose) und tatsächlichen Einnahmen über die letzten 12 Monate
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
          <span className="text-sm text-gray-700">Geplante Einnahmen</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Tatsächliche Einnahmen</span>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-full inline-flex gap-2 pb-4">
          {history.map((month) => (
            <div key={month.month} className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
              {/* Bars Container */}
              <div className="flex gap-1.5 items-end h-64 bg-gray-50 rounded p-2">
                {/* Planned Bar */}
                <div className="flex-1 bg-blue-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                  style={{
                    height: `${getBarHeight(month.forecast_revenue)}%`,
                    minHeight: month.forecast_revenue > 0 ? '4px' : '0px'
                  }}
                  title={`Planned: ${formatCurrency(month.forecast_revenue)}`}
                ></div>

                {/* Actual Bar */}
                <div
                  className="flex-1 bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                  style={{
                    height: `${getBarHeight(month.actual_revenue)}%`,
                    minHeight: month.actual_revenue > 0 ? '4px' : '0px'
                  }}
                  title={`Actual: ${formatCurrency(month.actual_revenue)}`}
                ></div>
              </div>

              {/* Month Label */}
              <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                {formatMonth(month.month)}
              </span>

              {/* Session Count */}
              <div className="text-xs text-gray-500 text-center w-full">
                <div>P: {month.forecast_sessions}</div>
                <div>A: {month.actual_sessions}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h3 className="font-semibold text-gray-900 mb-6">Zusammenfassung</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Planned Revenue */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Gesamt Geplant
            </p>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(history.reduce((sum, h) => sum + h.forecast_revenue, 0))}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {history.reduce((sum, h) => sum + h.forecast_sessions, 0)} Sitzungen
            </p>
          </div>

          {/* Total Actual Revenue */}
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Gesamt Tatsächlich
            </p>
            <p className="text-xl font-bold text-green-900">
              {formatCurrency(history.reduce((sum, h) => sum + h.actual_revenue, 0))}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {history.reduce((sum, h) => sum + h.actual_sessions, 0)} Sitzungen
            </p>
          </div>

          {/* Revenue Variance */}
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Einnahmen-Abweichung
            </p>
            {(() => {
              const totalPlanned = history.reduce((sum, h) => sum + h.forecast_revenue, 0)
              const totalActual = history.reduce((sum, h) => sum + h.actual_revenue, 0)
              const variance = totalActual - totalPlanned
              const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0
              return (
                <>
                  <p className={`text-xl font-bold ${variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                  </p>
                  <p className={`text-xs mt-2 ${variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {variance >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                  </p>
                </>
              )
            })()}
          </div>

          {/* Average Monthly Revenue */}
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Ø monatlich (Tatsächlich)
            </p>
            {(() => {
              const monthsWithData = history.filter(h => h.actual_revenue > 0).length
              const avgMonthly = monthsWithData > 0
                ? history.reduce((sum, h) => sum + h.actual_revenue, 0) / monthsWithData
                : 0
              return (
                <>
                  <p className="text-xl font-bold text-orange-900">
                    {formatCurrency(avgMonthly)}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {monthsWithData} Monat{monthsWithData > 1 ? 'e' : ''} mit Daten
                  </p>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mt-8">
        <h3 className="font-semibold text-gray-900 mb-4">Monatliche Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Monat</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Geplante Einnahmen</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Tatsächliche Einnahmen</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Abweichung</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Geplante Sitzungen</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Tatsächliche Sitzungen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((month) => {
                const variance = month.actual_revenue - month.forecast_revenue
                const variancePercent = month.forecast_revenue > 0
                  ? (variance / month.forecast_revenue) * 100
                  : 0
                return (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatMonth(month.month)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(month.forecast_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {formatCurrency(month.actual_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={variance >= 0 ? 'text-green-700' : 'text-red-700'}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                        <br />
                        <span className="text-xs">
                          ({variance >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {month.forecast_sessions}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {month.actual_sessions}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
