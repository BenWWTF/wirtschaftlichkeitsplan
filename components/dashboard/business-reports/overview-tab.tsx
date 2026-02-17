'use client'

import { useState, useMemo, useEffect } from 'react'
import type { MonthlyMetrics, TherapyMetrics, DashboardSummary } from '@/lib/actions/dashboard'
import { formatEuro } from '@/lib/utils'
import { MetricCard } from './components/metric-card'
import { DateRangeSelector } from './components/date-range-selector'
import {
  CHART_COLORS,
  TOOLTIP_STYLE,
  CHART_MARGIN,
  GRADIENT_IDS,
  formatAxisEuro,
} from './components/chart-config'
import { Euro, TrendingUp, Users } from 'lucide-react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface OverviewTabProps {
  monthlyData: MonthlyMetrics[]
  therapyMetrics: TherapyMetrics[]
  summary: DashboardSummary
}

export function OverviewTab({
  monthlyData,
  therapyMetrics,
  summary
}: OverviewTabProps) {
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

  useEffect(() => {
    if (!dateRangeStart && !dateRangeEnd) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 3)
      startDate.setDate(1)
      setDateRangeStart(startDate)
      setDateRangeEnd(endDate)
    }
  }, [])

  const filteredData = useMemo(() => {
    if (!dateRangeStart || !dateRangeEnd) return monthlyData
    return monthlyData.filter((m) => {
      const monthStr = m.month.substring(0, 7)
      const startStr = dateRangeStart.toISOString().substring(0, 7)
      const endStr = dateRangeEnd.toISOString().substring(0, 7)
      return monthStr >= startStr && monthStr <= endStr
    })
  }, [monthlyData, dateRangeStart, dateRangeEnd])

  const totalRevenue = filteredData.reduce((sum, m) => sum + m.actual_revenue, 0)
  const totalProfit = filteredData.reduce((sum, m) => sum + m.profitability, 0)
  const totalSessions = filteredData.reduce((sum, m) => sum + m.actual_sessions, 0)
  const totalCosts = filteredData.reduce((sum, m) => sum + m.total_costs_with_sumup, 0)
  const costRatio = totalRevenue > 0 ? (totalCosts / totalRevenue) * 100 : 0

  // Sparkline data arrays for metric cards
  const revenueSparkline = filteredData.map(m => m.actual_revenue)
  const profitSparkline = filteredData.map(m => m.profitability)
  const sessionSparkline = filteredData.map(m => m.actual_sessions)

  const chartData = useMemo(() => {
    return filteredData.map((item) => {
      const monthStr = item.month.length === 7 ? `${item.month}-01` : item.month
      const monthDate = new Date(monthStr)
      return {
        month: monthDate.toLocaleDateString('de-AT', { month: 'short', year: '2-digit' }),
        Umsatz: item.actual_revenue,
        Gewinn: item.profitability,
      }
    })
  }, [filteredData])

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <DateRangeSelector
          onDateRangeChange={(startDate, endDate) => {
            setDateRangeStart(startDate)
            setDateRangeEnd(endDate)
          }}
        />
      </div>

      {/* Metric Cards with sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Umsatz"
          value={formatEuro(totalRevenue)}
          icon={<Euro className="h-5 w-5 text-accent-500" />}
          sparkline={revenueSparkline}
        />
        <MetricCard
          label="Gewinn"
          value={formatEuro(totalProfit)}
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          variant={totalProfit >= 0 ? 'success' : 'danger'}
          subtext="Umsatz abzgl. aller Kosten"
          sparkline={profitSparkline}
        />
        <MetricCard
          label="Sitzungen"
          value={totalSessions}
          icon={<Users className="h-5 w-5 text-purple-500" />}
          subtext={`Ø ${filteredData.length > 0 ? Math.round(totalSessions / filteredData.length) : 0} pro Monat`}
          sparkline={sessionSparkline}
        />
      </div>

      {/* ComposedChart: revenue bars + profitability line */}
      {chartData.length > 0 ? (
        <div
          className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
          role="figure"
          aria-label="Umsatz und Gewinn im Zeitverlauf als Diagramm"
        >
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Umsatz & Gewinn im Zeitverlauf
          </h3>
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={CHART_MARGIN.withLegend}
                accessibilityLayer
              >
                <defs>
                  <linearGradient id={GRADIENT_IDS.revenue} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e5e7eb)" className="[.dark_&]:stroke-neutral-700" />
                <XAxis
                  dataKey="month"
                  stroke="var(--chart-axis, #6b7280)"
                  className="[.dark_&]:stroke-neutral-400"
                  style={{ fontSize: '0.75rem' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--chart-axis, #6b7280)"
                  className="[.dark_&]:stroke-neutral-400"
                  style={{ fontSize: '0.75rem' }}
                  tickFormatter={formatAxisEuro}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number) => formatEuro(value)}
                  cursor={{ fill: 'rgba(122, 155, 168, 0.08)' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '0.5rem', fontSize: '0.8125rem' }}
                  iconType="circle"
                  iconSize={8}
                />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                <Bar
                  dataKey="Umsatz"
                  fill={`url(#${GRADIENT_IDS.revenue})`}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
                <Line
                  type="monotone"
                  dataKey="Gewinn"
                  stroke={CHART_COLORS.profit}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_COLORS.profit, strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: CHART_COLORS.profit, strokeWidth: 2, fill: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="h-72 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Keine Daten im gewählten Zeitraum
          </p>
        </div>
      )}

      {/* Cost Ratio */}
      <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: costRatio > 80 ? '#FEE2E2' : costRatio > 60 ? '#FEF3C7' : '#DCFCE7',
                color: costRatio > 80 ? '#991B1B' : costRatio > 60 ? '#92400E' : '#166534',
              }}
            >
              {costRatio.toFixed(0)}%
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              Kostenquote
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {costRatio.toFixed(1)}% Ihrer Einnahmen gehen in Kosten
              {costRatio > 80 && ' — Optimierung empfohlen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
