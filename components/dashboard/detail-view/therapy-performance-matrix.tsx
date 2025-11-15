/**
 * Therapy Performance Matrix Component
 * Displays table of all therapy types with key metrics and performance indicators
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { TherapyMetric } from '@/lib/calculations'

interface TherapyPerformanceMatrixProps {
  therapies: TherapyMetric[]
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function getTrendIcon(utilization: number) {
  if (utilization > 100) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (utilization > 80) return <Minus className="h-4 w-4 text-amber-500" />
  return <TrendingDown className="h-4 w-4 text-red-500" />
}

export function TherapyPerformanceMatrix({
  therapies
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
                Therapy Type
              </th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                Sessions
              </th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                Revenue
              </th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                Margin
              </th>
              <th className="px-4 py-3 text-center font-semibold text-neutral-700 dark:text-neutral-300">
                Utilization
              </th>
              <th className="px-4 py-3 text-center font-semibold text-neutral-700 dark:text-neutral-300">
                Status
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
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {therapy.actualSessions}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      planned: {therapy.plannedSessions}
                    </p>
                  </div>
                </td>

                {/* Revenue */}
                <td className="px-4 py-3 text-right">
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {formatEuro(therapy.totalRevenue)}
                  </p>
                </td>

                {/* Margin */}
                <td className="px-4 py-3 text-right">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {formatEuro(therapy.totalMargin)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {therapy.marginPercent.toFixed(1)}%
                    </p>
                  </div>
                </td>

                {/* Utilization */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          therapy.utilizationRate > 100
                            ? 'bg-green-500'
                            : therapy.utilizationRate > 80
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(therapy.utilizationRate, 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 w-10 text-right">
                      {therapy.utilizationRate.toFixed(0)}%
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    {getTrendIcon(therapy.utilizationRate)}
                  </div>
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
