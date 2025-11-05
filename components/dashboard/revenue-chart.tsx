'use client'

import { useMemo } from 'react'
import type { MonthlyMetrics } from '@/lib/actions/dashboard'
import { formatEuro } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'

interface RevenueChartProps {
  data: MonthlyMetrics[]
  chartType?: 'line' | 'bar' | 'composed'
}

export function RevenueChart({
  data,
  chartType = 'composed'
}: RevenueChartProps) {
  const chartData = useMemo(
    () =>
      data.map((month) => ({
        month: new Date(`${month.month}-01`)
          .toLocaleDateString('de-AT', {
            month: 'short',
            year: '2-digit'
          })
          .replace(' ', ' '),
        'Geplanter Umsatz': month.planned_revenue,
        'Tatsächlicher Umsatz': month.actual_revenue,
        'Kosten': month.total_expenses,
        'Deckungsbeitrag': month.actual_margin,
        'Gewinn/Verlust': month.profitability
      })),
    [data]
  )

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <p className="text-neutral-600 dark:text-neutral-400">
          Keine Daten verfügbar
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-80 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'composed' ? (
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
              label={{ value: '€', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#fff'
              }}
              formatter={(value) => formatEuro(value as number)}
            />
            <Legend
              wrapperStyle={{ paddingTop: '1rem' }}
              iconType="line"
            />
            <Bar dataKey="Kosten" fill="#ef4444" opacity={0.6} />
            <Line
              type="monotone"
              dataKey="Geplanter Umsatz"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Tatsächlicher Umsatz"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        ) : chartType === 'bar' ? (
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#fff'
              }}
              formatter={(value) => formatEuro(value as number)}
            />
            <Legend wrapperStyle={{ paddingTop: '1rem' }} />
            <Bar dataKey="Geplanter Umsatz" fill="#3b82f6" />
            <Bar dataKey="Tatsächlicher Umsatz" fill="#10b981" />
            <Bar dataKey="Kosten" fill="#ef4444" />
          </BarChart>
        ) : (
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#fff'
              }}
              formatter={(value) => formatEuro(value as number)}
            />
            <Legend wrapperStyle={{ paddingTop: '1rem' }} />
            <Line
              type="monotone"
              dataKey="Geplanter Umsatz"
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Tatsächlicher Umsatz"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Kosten"
              stroke="#ef4444"
              strokeWidth={2}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
