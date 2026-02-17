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
  formatAxisEuro,
} from './components/chart-config'
import { Euro, TrendingDown, TrendingUp, PieChart } from 'lucide-react'
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
} from 'recharts'

interface ExpenseByCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

interface FinancialTabProps {
  monthlyData: MonthlyMetrics[]
}

// Colors assigned dynamically by index from CHART_COLORS.category

export function FinancialTab({ monthlyData }: FinancialTabProps) {
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

  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined)

  // Use profitability (real profit after all expenses), NOT actual_margin
  const totalRevenue = filteredData.reduce((sum, m) => sum + m.actual_revenue, 0)
  const totalProfit = filteredData.reduce((sum, m) => sum + m.profitability, 0)
  const totalFixedCosts = filteredData.reduce((sum, m) => sum + m.total_expenses, 0)
  const totalSumUpCosts = filteredData.reduce((sum, m) => sum + m.actual_sumup_costs, 0)
  const totalCosts = totalFixedCosts + totalSumUpCosts

  // Sparkline data
  const revenueSparkline = filteredData.map(m => m.actual_revenue)
  const costSparkline = filteredData.map(m => m.total_costs_with_sumup)
  const profitSparkline = filteredData.map(m => m.profitability)

  // Chart: stacked bar (fixed costs + SumUp) with revenue line
  const chartData = useMemo(() => {
    return filteredData.map((item) => {
      const monthStr = item.month.length === 7 ? `${item.month}-01` : item.month
      const monthDate = new Date(monthStr)
      return {
        month: monthDate.toLocaleDateString('de-AT', { month: 'short', year: '2-digit' }),
        Fixkosten: item.total_expenses,
        'SumUp-Gebühren': item.actual_sumup_costs,
        Umsatz: item.actual_revenue,
      }
    })
  }, [filteredData])

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        if (filteredData.length === 0) {
          setIsLoadingExpenses(false)
          return
        }

        const months = filteredData.map(m => m.month)
        const startMonth = months[0].substring(0, 7)
        const endMonth = months[months.length - 1].substring(0, 7)

        const response = await fetch(`/api/expenses?startMonth=${startMonth}&endMonth=${endMonth}`)
        const data = await response.json()

        if (data.expenses && data.expenses.length > 0) {
          const categoryMap = new Map<string, number>()
          let totalByCategory = 0

          data.expenses.forEach((exp: any) => {
            const category = exp.category || 'Sonstiges'
            const amount = exp.amount || 0
            categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
            totalByCategory += amount
          })

          const categories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount], index) => ({
              category,
              amount,
              percentage: totalByCategory > 0 ? (amount / totalByCategory) * 100 : 0,
              color: CHART_COLORS.category[index % CHART_COLORS.category.length],
            }))

          setExpensesByCategory(categories)
        }
      } catch (error) {
        console.error('Error fetching expenses:', error)
      } finally {
        setIsLoadingExpenses(false)
      }
    }

    setIsLoadingExpenses(true)
    fetchExpenses()
  }, [filteredData])

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
          <Euro className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">Keine Daten verfügbar</p>
      </div>
    )
  }

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
          label="Einnahmen"
          value={formatEuro(totalRevenue)}
          icon={<Euro className="h-5 w-5 text-accent-500" />}
          sparkline={revenueSparkline}
        />
        <MetricCard
          label="Gesamtkosten"
          value={formatEuro(totalCosts)}
          icon={<TrendingDown className="h-5 w-5 text-red-500" />}
          subtext={`Fixkosten ${formatEuro(totalFixedCosts)} + SumUp ${formatEuro(totalSumUpCosts)}`}
          sparkline={costSparkline}
          variant="danger"
        />
        <MetricCard
          label="Gewinn"
          value={formatEuro(totalProfit)}
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          variant={totalProfit >= 0 ? 'success' : 'danger'}
          subtext="Umsatz abzgl. aller Kosten"
          sparkline={profitSparkline}
        />
      </div>

      {/* Stacked Cost Chart with Revenue Line */}
      {chartData.length > 0 ? (
        <div
          className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
          role="figure"
          aria-label="Kosten vs. Einnahmen im Zeitverlauf als Diagramm"
        >
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Kosten vs. Einnahmen im Zeitverlauf
          </h3>
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={CHART_MARGIN.withLegend} accessibilityLayer>
                <defs>
                  <linearGradient id="gradient-fixed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.fixedCosts} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={CHART_COLORS.fixedCosts} stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="gradient-sumup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.sumupFees} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={CHART_COLORS.sumupFees} stopOpacity={0.4} />
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
                <Bar dataKey="Fixkosten" stackId="costs" fill="url(#gradient-fixed)" radius={[0, 0, 0, 0]} maxBarSize={48} />
                <Bar dataKey="SumUp-Gebühren" stackId="costs" fill="url(#gradient-sumup)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Line
                  type="monotone"
                  dataKey="Umsatz"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_COLORS.revenue, strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: CHART_COLORS.revenue, strokeWidth: 2, fill: '#fff' }}
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

      {/* Expense Category Breakdown — Pie Chart */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-500" />
          Kostenstruktur nach Kategorien
        </h3>

        {isLoadingExpenses ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse w-48 h-48 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
        ) : expensesByCategory.length === 0 ? (
          <div className="text-center py-8 text-neutral-600 dark:text-neutral-400 text-sm">
            Keine Kostendaten verfügbar
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Pie Chart */}
            <div
              className="w-full lg:w-1/2 h-72"
              role="figure"
              aria-label="Kostenverteilung als Kreisdiagramm"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="category"
                    activeIndex={activePieIndex}
                    activeShape={(props: any) => {
                      const {
                        cx, cy, innerRadius, outerRadius, startAngle, endAngle,
                        fill, payload, percent, value
                      } = props
                      return (
                        <g>
                          <text x={cx} y={cy - 8} textAnchor="middle" className="fill-neutral-900 dark:fill-white text-sm font-semibold">
                            {payload.category}
                          </text>
                          <text x={cx} y={cy + 12} textAnchor="middle" className="fill-neutral-500 dark:fill-neutral-400 text-xs">
                            {formatEuro(value)} ({(percent * 100).toFixed(1)}%)
                          </text>
                          <Sector
                            cx={cx}
                            cy={cy}
                            innerRadius={innerRadius - 4}
                            outerRadius={outerRadius + 6}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={fill}
                          />
                          <Sector
                            cx={cx}
                            cy={cy}
                            innerRadius={outerRadius + 8}
                            outerRadius={outerRadius + 10}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={fill}
                          />
                        </g>
                      )
                    }}
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(undefined)}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => [formatEuro(value), name]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="w-full lg:w-1/2 space-y-3">
              {expensesByCategory.map((category, index) => (
                <div
                  key={category.category}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-default ${
                    activePieIndex === index ? 'bg-neutral-100 dark:bg-neutral-700/40' : ''
                  }`}
                  onMouseEnter={() => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(undefined)}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {category.category}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white ml-2 tabular-nums flex-shrink-0">
                        {formatEuro(category.amount)}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
