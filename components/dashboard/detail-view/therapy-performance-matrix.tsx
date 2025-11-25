/**
 * Therapy Performance Matrix Component
 * Displays table of all therapy types with key metrics and performance indicators
 */

import type { TherapyMetric } from '@/lib/calculations'

interface TherapyPerformanceMatrixProps {
  therapies: TherapyMetric[]
  dataViewMode?: 'prognose' | 'resultate'
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function TherapyPerformanceMatrix({
  therapies,
  dataViewMode
}: TherapyPerformanceMatrixProps) {
  const sortedTherapies = [...therapies].sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  )

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
              <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">
                Therapieart
              </th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                {dataViewMode === 'prognose' ? 'Geplante Sitzungen' : 'Sitzungen'}
              </th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                Umsatz
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {sortedTherapies.map((therapy) => (
              <tr
                key={therapy.id}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                {/* Therapy Name */}
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {therapy.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      €{therapy.pricePerSession.toFixed(2)}/session
                    </p>
                  </div>
                </td>

                {/* Sessions */}
                <td className="px-4 py-3 text-right">
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {dataViewMode === 'prognose' ? therapy.plannedSessions : therapy.actualSessions}
                  </p>
                </td>

                {/* Revenue */}
                <td className="px-4 py-3 text-right">
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {formatEuro(therapy.totalRevenue)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {therapies.length === 0 && (
        <div className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
          <p>No therapy data available</p>
        </div>
      )}
    </div>
  )
}
