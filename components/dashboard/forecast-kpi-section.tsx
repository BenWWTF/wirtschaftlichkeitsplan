'use client'

import type { MetricsResult } from '@/lib/metrics/metrics-result'

interface ForecastKPISectionProps {
  forecast: MetricsResult
  monthYear: string
}

export function ForecastKPISection({
  forecast,
  monthYear
}: ForecastKPISectionProps) {
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

  const therapyCount = forecast.by_therapy.length

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Planung ({formatMonthYear(monthYear)})
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Finanzielle Prognose basierend auf geplanten Sitzungen
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned Revenue */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Geplante Einnahmen</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(forecast.total_revenue)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {forecast.total_sessions} Sitzungen geplant
              </p>
            </div>
            <div className="text-blue-500 text-3xl">💰</div>
          </div>
        </div>

        {/* Planned Margin */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Geplante Marge</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(forecast.total_margin)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {forecast.margin_percent.toFixed(1)}% der Einnahmen
              </p>
            </div>
            <div className="text-green-500 text-3xl">📈</div>
          </div>
        </div>

        {/* Variable Costs */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Variable Kosten</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(forecast.total_variable_costs)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Kosten pro Sitzung
              </p>
            </div>
            <div className="text-orange-500 text-3xl">⚙️</div>
          </div>
        </div>

        {/* Active Therapies */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Geplante Therapien</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {therapyCount}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Unterschiedliche Typen
              </p>
            </div>
            <div className="text-purple-500 text-3xl">🏥</div>
          </div>
        </div>
      </div>

      {/* Therapy Breakdown Table */}
      {therapyCount > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Aufschlüsselung nach Therapietyp
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forecast.by_therapy.map((therapy) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {therapyCount === 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-sm text-yellow-800">
            Keine Therapietypen für diesen Monat geplant. Fügen Sie geplante Sitzungen hinzu, um Prognose-Metriken zu sehen.
          </p>
        </div>
      )}
    </div>
  )
}
