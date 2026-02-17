'use client'

import { useState, useMemo } from 'react'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import type { TherapyMetrics } from '@/lib/actions/dashboard'
import { formatEuro } from '@/lib/utils'
import { MetricCard } from './components/metric-card'
import { TherapyFilter } from './components/therapy-filter'
import {
  CHART_COLORS,
  TOOLTIP_STYLE,
  CHART_MARGIN,
  formatAxisEuro,
} from './components/chart-config'
import { Euro, Users } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface TherapyTabProps {
  analytics: AdvancedAnalytics | null
  therapies?: TherapyMetrics[]
}

export function TherapyTab({ analytics, therapies }: TherapyTabProps) {
  const [selectedTherapies, setSelectedTherapies] = useState<string[]>([])

  const filteredTherapies = useMemo(() => {
    if (!therapies || therapies.length === 0) return []
    let filtered = therapies
    if (selectedTherapies.length > 0) {
      filtered = filtered.filter((t) => selectedTherapies.includes(t.therapy_id))
    }
    return [...filtered].sort((a, b) => b.total_revenue - a.total_revenue)
  }, [therapies, selectedTherapies])

  const totalRevenue = filteredTherapies.reduce((sum, t) => sum + t.total_revenue, 0)
  const totalSessions = filteredTherapies.reduce((sum, t) => sum + t.total_actual_sessions, 0)

  const topByRevenue = filteredTherapies.length > 0 ? filteredTherapies[0] : null
  const topBySessions = useMemo(() => {
    if (filteredTherapies.length === 0) return null
    return [...filteredTherapies].sort((a, b) => b.total_actual_sessions - a.total_actual_sessions)[0]
  }, [filteredTherapies])

  const chartData = useMemo(() => {
    return filteredTherapies.map((t) => ({
      name: t.therapy_name.length > 22 ? t.therapy_name.substring(0, 20) + '...' : t.therapy_name,
      fullName: t.therapy_name,
      Umsatz: t.total_revenue,
    }))
  }, [filteredTherapies])

  if (!therapies || therapies.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
          <Users className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">
          Keine Therapiedaten verfügbar.
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
          Fügen Sie Therapiearten und Monatsplanungen hinzu.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <TherapyFilter
          therapies={therapies}
          onFilterChange={setSelectedTherapies}
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          label="Umsatzstärkste Therapie"
          value={topByRevenue ? topByRevenue.therapy_name : '–'}
          icon={<Euro className="h-5 w-5 text-accent-500" />}
          subtext={topByRevenue ? formatEuro(topByRevenue.total_revenue) : undefined}
        />
        <MetricCard
          label="Meiste Sitzungen"
          value={topBySessions ? topBySessions.therapy_name : '–'}
          icon={<Users className="h-5 w-5 text-purple-500" />}
          subtext={topBySessions ? `${topBySessions.total_actual_sessions} Sitzungen` : undefined}
        />
      </div>

      {/* Horizontal BarChart — revenue per therapy */}
      {chartData.length > 0 && (
        <div
          className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
          role="figure"
          aria-label="Umsatz pro Therapieart als horizontales Balkendiagramm"
        >
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Umsatz pro Therapieart
          </h3>
          <div className="w-full" style={{ height: Math.max(200, chartData.length * 52) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={CHART_MARGIN.horizontal}
                accessibilityLayer
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e5e7eb)" className="[.dark_&]:stroke-neutral-700" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--chart-axis, #6b7280)"
                  className="[.dark_&]:stroke-neutral-400"
                  style={{ fontSize: '0.75rem' }}
                  tickFormatter={formatAxisEuro}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  stroke="var(--chart-axis, #6b7280)"
                  className="[.dark_&]:stroke-neutral-400"
                  style={{ fontSize: '0.75rem' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number) => formatEuro(value)}
                  labelFormatter={(_label, payload) => {
                    if (payload && payload.length > 0) {
                      return (payload[0].payload as { fullName: string }).fullName
                    }
                    return _label
                  }}
                  cursor={{ fill: 'rgba(122, 155, 168, 0.08)' }}
                />
                <Bar dataKey="Umsatz" radius={[0, 6, 6, 0]} maxBarSize={32}>
                  {chartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS.category[index % CHART_COLORS.category.length]}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detail Table */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
          Detailübersicht
        </h3>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-3 px-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Therapieart
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Preis/Sitzung
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Sitzungen
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Umsatz
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Anteil
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTherapies.map((therapy) => {
                const revenuePercent = totalRevenue > 0
                  ? (therapy.total_revenue / totalRevenue) * 100
                  : 0

                return (
                  <tr
                    key={therapy.therapy_id}
                    className="border-b border-neutral-100 dark:border-neutral-700/50 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/20 transition-colors"
                  >
                    <td className="py-3 px-2 text-sm text-neutral-900 dark:text-white font-medium">
                      {therapy.therapy_name}
                    </td>
                    <td className="py-3 px-2 text-sm text-neutral-600 dark:text-neutral-400 text-right tabular-nums">
                      {formatEuro(therapy.price_per_session)}
                    </td>
                    <td className="py-3 px-2 text-sm text-neutral-600 dark:text-neutral-400 text-right tabular-nums">
                      {therapy.total_actual_sessions}
                    </td>
                    <td className="py-3 px-2 text-sm text-neutral-900 dark:text-white text-right font-medium tabular-nums">
                      {formatEuro(therapy.total_revenue)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${revenuePercent}%`,
                              backgroundColor: CHART_COLORS.revenue,
                            }}
                          />
                        </div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums w-12 text-right">
                          {revenuePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-200 dark:border-neutral-700">
                <td className="py-3 px-2 text-sm font-semibold text-neutral-900 dark:text-white">
                  Gesamt
                </td>
                <td className="py-3 px-2"></td>
                <td className="py-3 px-2 text-sm font-semibold text-neutral-900 dark:text-white text-right tabular-nums">
                  {totalSessions}
                </td>
                <td className="py-3 px-2 text-sm font-semibold text-neutral-900 dark:text-white text-right tabular-nums">
                  {formatEuro(totalRevenue)}
                </td>
                <td className="py-3 px-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
