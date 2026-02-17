'use client'

import { useState, useEffect, useMemo } from 'react'
import type { MonthlyMetrics } from '@/lib/actions/dashboard'
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
import { TrendingUp, AlertCircle, Target } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface ForecastTabProps {
  monthlyData: MonthlyMetrics[]
}

export function ForecastTab({ monthlyData }: ForecastTabProps) {
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

  useEffect(() => {
    if (!dateRangeStart && !dateRangeEnd) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 6)
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

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
          <Target className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">Keine Daten verfügbar</p>
      </div>
    )
  }

  const numMonths = filteredData.length || 1
  const totalRevenue = filteredData.reduce((sum, m) => sum + m.actual_revenue, 0)
  const totalSessions = filteredData.reduce((sum, m) => sum + m.actual_sessions, 0)
  const totalFixedCosts = filteredData.reduce((sum, m) => sum + m.total_expenses, 0)
  const avgMonthlyRevenue = totalRevenue / numMonths
  const avgRevenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0
  const avgMonthlyFixedCosts = totalFixedCosts / numMonths

  // Variable cost per session = SumUp fees per session
  const totalSumUpCosts = filteredData.reduce((sum, m) => sum + m.actual_sumup_costs, 0)
  const avgVariableCostPerSession = totalSessions > 0 ? totalSumUpCosts / totalSessions : 0

  // Break-even = avgMonthlyFixedCosts / (avgRevenuePerSession - avgVariableCostPerSession)
  const contributionPerSession = avgRevenuePerSession - avgVariableCostPerSession
  const sessionsToBreakEven = contributionPerSession > 0
    ? Math.ceil(avgMonthlyFixedCosts / contributionPerSession)
    : 0

  // Chart: profitability over time with color split above/below zero
  const chartData = useMemo(() => {
    return filteredData.map((item) => {
      const monthStr = item.month.length === 7 ? `${item.month}-01` : item.month
      const monthDate = new Date(monthStr)
      return {
        month: monthDate.toLocaleDateString('de-AT', { month: 'short', year: '2-digit' }),
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          label="Ø Monatsumsatz"
          value={formatEuro(avgMonthlyRevenue)}
          icon={<TrendingUp className="h-5 w-5 text-accent-500" />}
          subtext={`Über ${numMonths} Monate`}
        />
        <MetricCard
          label="Break-Even Sitzungen/Monat"
          value={sessionsToBreakEven > 0 ? sessionsToBreakEven : '–'}
          icon={<Target className="h-5 w-5 text-yellow-500" />}
          subtext={contributionPerSession > 0
            ? `${formatEuro(contributionPerSession)} Deckungsbeitrag/Sitzung`
            : 'Nicht berechenbar'
          }
          variant={sessionsToBreakEven > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* AreaChart — profitability over time with zero line */}
      {chartData.length > 0 ? (
        <div
          className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
          role="figure"
          aria-label="Gewinnentwicklung im Zeitverlauf als Flächendiagramm"
        >
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Gewinnentwicklung
          </h3>
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={CHART_MARGIN.standard} accessibilityLayer>
                <defs>
                  <linearGradient id={GRADIENT_IDS.profit} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.3} />
                    <stop offset="50%" stopColor={CHART_COLORS.profit} stopOpacity={0.05} />
                    <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0} />
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
                  cursor={{ stroke: CHART_COLORS.revenue, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <ReferenceLine
                  y={0}
                  stroke={CHART_COLORS.loss}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: 'Break-Even',
                    fill: CHART_COLORS.loss,
                    fontSize: 11,
                    position: 'insideTopRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Gewinn"
                  stroke={CHART_COLORS.profit}
                  strokeWidth={2.5}
                  fill={`url(#${GRADIENT_IDS.profit})`}
                  dot={{ r: 3, fill: CHART_COLORS.profit, strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: CHART_COLORS.profit, strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
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

    </div>
  )
}
