'use client'

import type { MetricsResult } from '@/lib/metrics/metrics-result'

interface ResultsKPISectionProps {
  results: MetricsResult
  totalExpenses: number
  monthYear: string
}

export function ResultsKPISection({
  results,
  totalExpenses,
  monthYear
}: ResultsKPISectionProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Format month for display
  const formatMonthYear = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long'
    })
  }

  const therapyCount = results.by_therapy.length
  const netIncome = results.total_revenue - results.total_variable_costs - totalExpenses
  const hasActualSessions = results.total_sessions > 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Ergebnisse ({formatMonthYear(monthYear)})
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Tatsächliche Geschäftsergebnisse basierend auf absolvierten Sitzungen
        </p>
      </div>

      {!hasActualSessions && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Noch keine absolvierten Sitzungen. Protokollieren Sie Sitzungen, um tatsächliche Ergebnisse zu sehen.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Actual Revenue */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tatsächliche Einnahmen</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(results.total_revenue)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {results.total_sessions} Sitzungen absolviert
              </p>
            </div>
            <div className="text-blue-500 text-3xl">💵</div>
          </div>
        </div>

        {/* Net Income */}
        <div
          className={`bg-white rounded-lg shadow p-6 border-l-4 ${
            netIncome >= 0 ? 'border-green-500' : 'border-red-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Nettogewinn</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  netIncome >= 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {formatCurrency(netIncome)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Nach allen Kosten
              </p>
            </div>
            <div className={netIncome >= 0 ? 'text-green-500 text-3xl' : 'text-red-500 text-3xl'}>
              {netIncome >= 0 ? '📊' : '⚠️'}
            </div>
          </div>
        </div>

        {/* Actual Margin */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Deckungsbeitrag</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(results.total_margin)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {results.margin_percent.toFixed(1)}% der Einnahmen
              </p>
            </div>
            <div className="text-green-500 text-3xl">✓</div>
          </div>
        </div>

        {/* Break-Even Status */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-2 capitalize">
                {results.break_even_status === 'surplus'
                  ? 'Überschuss'
                  : results.break_even_status === 'breakeven'
                    ? 'Gewinnschwelle'
                    : 'Defizit'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Geschäftsleistung
              </p>
            </div>
            <div className="text-purple-500 text-3xl">
              {results.break_even_status === 'surplus'
                ? '🎯'
                : results.break_even_status === 'breakeven'
                  ? '⚪'
                  : '📉'}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Gesamtausgaben</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Variable Kosten</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatCurrency(results.total_variable_costs)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Rentabilität</p>
            <p className={`text-xl font-bold mt-1 ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {((netIncome / (results.total_revenue || 1)) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Therapy Breakdown Table */}
      {hasActualSessions && therapyCount > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Ergebnisse nach Therapietyp
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Therapietyp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
                    Sitzungen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
                    Preis/Sitzung
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
                    Einnahmen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
                    Marge
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
                    Marge %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.by_therapy.map((therapy) => (
                  <tr key={therapy.therapy_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {therapy.therapy_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      {therapy.sessions}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      {formatCurrency(therapy.price_per_session)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(therapy.revenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      <span className={therapy.margin >= 0 ? 'text-green-700' : 'text-red-700'}>
                        {formatCurrency(therapy.margin)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {therapy.margin_percent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
