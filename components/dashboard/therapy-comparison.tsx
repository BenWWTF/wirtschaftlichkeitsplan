'use client'

import { useMemo } from 'react'
import type { TherapyMetrics } from '@/lib/actions/dashboard'
import { formatEuro } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ComposedChart
} from 'recharts'
import { AlertCircle } from 'lucide-react'

interface TherapyComparisonProps {
  therapies: TherapyMetrics[]
  chartType?: 'bar' | 'radar'
}

export function TherapyComparison({
  therapies,
  chartType = 'bar'
}: TherapyComparisonProps) {
  const chartData = useMemo(() => {
    return therapies.map((therapy) => ({
      name: therapy.therapy_name.substring(0, 20), // Truncate long names
      'Umsatz': therapy.total_revenue,
      'Auslastung': Math.round(therapy.profitability_percent),
      fullName: therapy.therapy_name
    }))
  }, [therapies])

  if (therapies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
        <AlertCircle className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400">
          Keine Therapiearten vorhanden
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'radar' ? (
            <RadarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '0.75rem' }}
              />
              <PolarRadiusAxis stroke="#6b7280" />
              <Radar
                name="Umsatz (€)"
                dataKey="Umsatz"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Radar
                name="Auslastung (%)"
                dataKey="Auslastung"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Legend wrapperStyle={{ paddingTop: '1rem' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
                formatter={(value, name) => {
                  if (name === 'Auslastung (%)') {
                    return `${value}%`
                  }
                  return formatEuro(value as number)
                }}
              />
            </RadarChart>
          ) : (
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
                yAxisId="left"
                label={{ value: '€', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                style={{ fontSize: '0.875rem' }}
                label={{ value: '%', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
                formatter={(value, name) => {
                  if (name === 'Auslastung (%)') {
                    return `${Math.round(value as number)}%`
                  }
                  return formatEuro(value as number)
                }}
                labelFormatter={(label) => {
                  const fullData = chartData.find(d => d.name === label)
                  return fullData ? fullData.fullName : label
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '1rem' }} />
              <Bar dataKey="Umsatz" fill="#3b82f6" yAxisId="left" name="Umsatz (€)" />
              <Line
                dataKey="Auslastung"
                stroke="#f59e0b"
                yAxisId="right"
                name="Auslastung (%)"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
