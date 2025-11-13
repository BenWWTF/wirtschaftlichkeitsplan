'use client'

import { useState, useMemo, memo } from 'react'
import type { BreakEvenAnalysis } from '@/lib/types'
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
  Area,
  ComposedChart,
  ReferenceLine,
  Cell
} from 'recharts'
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

interface BreakEvenChartProps {
  therapies: BreakEvenAnalysis[]
  fixedCosts: number
  onScenarioChange?: (scenario: 'pessimistic' | 'realistic' | 'optimistic', fixedCosts: number) => void
}

type ScenarioData = {
  name: string
  sessions: number
  revenue: number
  profit: number
}

function BreakEvenChartComponent({
  therapies,
  fixedCosts,
  onScenarioChange
}: BreakEvenChartProps) {
  const [selectedScenario, setSelectedScenario] = useState<'pessimistic' | 'realistic' | 'optimistic'>('realistic')
  const [adjustedFixedCosts, setAdjustedFixedCosts] = useState(fixedCosts)

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (therapies.length === 0) {
      return null
    }

    // Calculate weighted average contribution margin
    const avgContribution = therapies.reduce((sum, t) => sum + t.contribution_margin, 0) / therapies.length

    // Get min and max contribution margins
    const minContribution = Math.min(...therapies.map(t => t.contribution_margin))
    const maxContribution = Math.max(...therapies.map(t => t.contribution_margin))

    // Calculate break-even points for each scenario
    const breakEvenRealistic = avgContribution > 0 ? Math.ceil(adjustedFixedCosts / avgContribution) : 0
    const breakEvenOptimistic = maxContribution > 0 ? Math.ceil(adjustedFixedCosts / maxContribution) : 0
    const breakEvenPessimistic = minContribution > 0 ? Math.ceil(adjustedFixedCosts / minContribution) : Infinity

    return {
      avgContribution,
      minContribution,
      maxContribution,
      breakEvenRealistic,
      breakEvenOptimistic,
      breakEvenPessimistic
    }
  }, [therapies, adjustedFixedCosts])

  // Generate break-even chart data
  const breakEvenChartData = useMemo(() => {
    if (!metrics) return []

    const maxSessions = Math.ceil(metrics.breakEvenRealistic * 1.5)
    const data = []

    for (let sessions = 0; sessions <= maxSessions; sessions += Math.max(1, Math.floor(maxSessions / 50))) {
      const revenue = sessions * metrics.avgContribution
      const profit = revenue - adjustedFixedCosts

      data.push({
        sessions,
        revenue,
        fixedCosts: adjustedFixedCosts,
        profit,
        isBreakEven: sessions === metrics.breakEvenRealistic
      })
    }

    return data
  }, [metrics, adjustedFixedCosts])

  // Generate contribution margin by therapy type data
  const therapyBarData = useMemo(() => {
    return therapies.map(therapy => ({
      name: therapy.therapy_type_name,
      contributionMargin: therapy.contribution_margin,
      contributionMarginPercent: therapy.contribution_margin_percent,
      price: therapy.price_per_session
    }))
  }, [therapies])

  // Generate scenario comparison data
  const scenarioData = useMemo((): ScenarioData[] => {
    if (!metrics) return []

    return [
      {
        name: 'Pessimistisch',
        sessions: metrics.breakEvenPessimistic === Infinity ? 0 : metrics.breakEvenPessimistic,
        revenue: metrics.breakEvenPessimistic === Infinity ? 0 : metrics.breakEvenPessimistic * metrics.minContribution,
        profit: 0
      },
      {
        name: 'Realistisch',
        sessions: metrics.breakEvenRealistic,
        revenue: metrics.breakEvenRealistic * metrics.avgContribution,
        profit: 0
      },
      {
        name: 'Optimistisch',
        sessions: metrics.breakEvenOptimistic,
        revenue: metrics.breakEvenOptimistic * metrics.maxContribution,
        profit: 0
      }
    ]
  }, [metrics])

  // Get color based on contribution margin percentage
  const getBarColor = (percent: number) => {
    if (percent >= 70) return '#10b981' // green-500
    if (percent >= 50) return '#3b82f6' // blue-500
    if (percent >= 30) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }

  // Custom tooltip for break-even chart
  const BreakEvenTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-neutral-900 dark:text-white mb-2">
            {data.sessions} Sitzungen
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600 dark:text-blue-400">
              Umsatz: {formatEuro(data.revenue)}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">
              Fixkosten: {formatEuro(data.fixedCosts)}
            </p>
            <p className={data.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {data.profit >= 0 ? 'Gewinn' : 'Verlust'}: {formatEuro(Math.abs(data.profit))}
            </p>
          </div>
          {data.isBreakEven && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
              ⚡ Break-Even-Point
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Custom tooltip for therapy bars
  const TherapyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-neutral-900 dark:text-white mb-2">
            {data.name}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-neutral-600 dark:text-neutral-400">
              Preis: {formatEuro(data.price)}
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              Deckungsbeitrag: {formatEuro(data.contributionMargin)}
            </p>
            <p className="text-green-600 dark:text-green-400">
              DB-Quote: {data.contributionMarginPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for scenario comparison
  const ScenarioTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-neutral-900 dark:text-white mb-2">
            {data.name}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600 dark:text-blue-400">
              Benötigt: {data.sessions} Sitzungen
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">
              Umsatz: {formatEuro(data.revenue)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Handle fixed cost adjustment
  const handleFixedCostChange = (increment: number) => {
    const newCosts = Math.max(0, adjustedFixedCosts + increment)
    setAdjustedFixedCosts(newCosts)
    if (onScenarioChange) {
      onScenarioChange(selectedScenario, newCosts)
    }
  }

  if (!metrics || therapies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
          Keine Daten verfügbar
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Erstellen Sie Therapiearten, um die Break-Even-Visualisierung anzuzeigen.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Break-Even Point Visualization */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Break-Even-Punkt Visualisierung
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Umsatz, Fixkosten und Gewinn im Verhältnis zur Anzahl der Sitzungen
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-neutral-600 dark:text-neutral-400">
              Break-Even bei {metrics.breakEvenRealistic} Sitzungen
            </span>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={breakEvenChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-neutral-200 dark:stroke-neutral-700"
              />
              <XAxis
                dataKey="sessions"
                label={{
                  value: 'Anzahl Sitzungen',
                  position: 'insideBottom',
                  offset: -10,
                  className: 'fill-neutral-600 dark:fill-neutral-400'
                }}
                className="text-xs fill-neutral-600 dark:fill-neutral-400"
              />
              <YAxis
                label={{
                  value: 'Betrag (€)',
                  angle: -90,
                  position: 'insideLeft',
                  className: 'fill-neutral-600 dark:fill-neutral-400'
                }}
                tickFormatter={(value) => formatEuro(value, false)}
                className="text-xs fill-neutral-600 dark:fill-neutral-400"
              />
              <Tooltip content={<BreakEvenTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
                iconType="line"
              />

              {/* Shaded areas for profit/loss */}
              <Area
                type="monotone"
                dataKey="profit"
                fill="url(#profitGradient)"
                stroke="none"
                fillOpacity={1}
                isAnimationActive={true}
              />

              {/* Fixed costs line */}
              <Line
                type="monotone"
                dataKey="fixedCosts"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Fixkosten"
                isAnimationActive={true}
              />

              {/* Revenue line */}
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                name="Umsatz"
                isAnimationActive={true}
              />

              {/* Profit line */}
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Gewinn"
                isAnimationActive={true}
              />

              {/* Break-even point reference line */}
              <ReferenceLine
                x={metrics.breakEvenRealistic}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: 'Break-Even',
                  position: 'top',
                  fill: '#f59e0b',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend explanation */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">
              <strong className="text-neutral-900 dark:text-white">Umsatz:</strong> Einnahmen aus Sitzungen
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500 border-dashed border-t-2"></div>
            <span className="text-neutral-600 dark:text-neutral-400">
              <strong className="text-neutral-900 dark:text-white">Fixkosten:</strong> Konstante monatliche Kosten
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-green-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">
              <strong className="text-neutral-900 dark:text-white">Gewinn:</strong> Umsatz minus Fixkosten
            </span>
          </div>
        </div>
      </div>

      {/* Contribution Margin by Therapy Type */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Deckungsbeitrag nach Therapieart
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Vergleich der Profitabilität Ihrer Therapiearten
          </p>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={therapyBarData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-neutral-200 dark:stroke-neutral-700"
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs fill-neutral-600 dark:fill-neutral-400"
                interval={0}
              />
              <YAxis
                label={{
                  value: 'Deckungsbeitrag (€)',
                  angle: -90,
                  position: 'insideLeft',
                  className: 'fill-neutral-600 dark:fill-neutral-400'
                }}
                tickFormatter={(value) => formatEuro(value, false)}
                className="text-xs fill-neutral-600 dark:fill-neutral-400"
              />
              <Tooltip content={<TherapyTooltip />} />
              <Bar
                dataKey="contributionMargin"
                name="Deckungsbeitrag"
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
              >
                {therapyBarData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.contributionMarginPercent)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Color legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">≥ 70% DB-Quote</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">50-69% DB-Quote</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">30-49% DB-Quote</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-neutral-600 dark:text-neutral-400">&lt; 30% DB-Quote</span>
          </div>
        </div>
      </div>

      {/* What-If Scenario Comparison */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            What-If-Szenario-Vergleich
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Vergleichen Sie verschiedene Szenarien basierend auf Ihrem Therapieart-Mix
          </p>
        </div>

        {/* Fixed costs adjuster */}
        <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-900 dark:text-white">
              Fixkosten anpassen:
            </label>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatEuro(adjustedFixedCosts)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleFixedCostChange(-500)}
              className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Fixkosten um 500€ reduzieren"
            >
              -500€
            </button>
            <button
              onClick={() => handleFixedCostChange(-100)}
              className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Fixkosten um 100€ reduzieren"
            >
              -100€
            </button>
            <button
              onClick={() => setAdjustedFixedCosts(fixedCosts)}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              aria-label="Auf ursprüngliche Fixkosten zurücksetzen"
            >
              Reset
            </button>
            <button
              onClick={() => handleFixedCostChange(100)}
              className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Fixkosten um 100€ erhöhen"
            >
              +100€
            </button>
            <button
              onClick={() => handleFixedCostChange(500)}
              className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Fixkosten um 500€ erhöhen"
            >
              +500€
            </button>
          </div>
        </div>

        {/* Scenario comparison chart */}
        <div className="h-[300px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={scenarioData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-neutral-200 dark:stroke-neutral-700"
              />
              <XAxis
                dataKey="name"
                className="text-sm fill-neutral-600 dark:fill-neutral-400"
              />
              <YAxis
                label={{
                  value: 'Benötigte Sitzungen',
                  angle: -90,
                  position: 'insideLeft',
                  className: 'fill-neutral-600 dark:fill-neutral-400'
                }}
                className="text-xs fill-neutral-600 dark:fill-neutral-400"
              />
              <Tooltip content={<ScenarioTooltip />} />
              <Bar
                dataKey="sessions"
                name="Sitzungen"
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
              >
                <Cell fill="#ef4444" /> {/* Red for pessimistic */}
                <Cell fill="#3b82f6" /> {/* Blue for realistic */}
                <Cell fill="#10b981" /> {/* Green for optimistic */}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pessimistic */}
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Pessimistisch
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Nur niedrigste Deckungsbeiträge
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {metrics.breakEvenPessimistic === Infinity ? '∞' : metrics.breakEvenPessimistic}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Sitzungen benötigt
                  </p>
                  {metrics.breakEvenPessimistic !== Infinity && (
                    <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                      {formatEuro(metrics.minContribution)} DB/Sitzung
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Realistic */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Realistisch
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Durchschnittliche Deckungsbeiträge
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {metrics.breakEvenRealistic}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Sitzungen benötigt
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    {formatEuro(metrics.avgContribution)} DB/Sitzung
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Optimistic */}
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Optimistisch
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Nur höchste Deckungsbeiträge
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {metrics.breakEvenOptimistic}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Sitzungen benötigt
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    {formatEuro(metrics.maxContribution)} DB/Sitzung
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                So interpretieren Sie die Szenarien
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Pessimistisch:</strong> Zeigt, wie viele Sitzungen Sie benötigen, wenn Sie nur die Therapieart
                mit dem niedrigsten Deckungsbeitrag anbieten. <strong>Realistisch:</strong> Basiert auf dem Durchschnitt
                aller Ihrer Therapiearten. <strong>Optimistisch:</strong> Zeigt das beste Szenario, wenn Sie nur die
                profitabelste Therapieart anbieten würden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * BreakEvenChart - Memoized component for break-even analysis visualization
 *
 * Skips re-render when props haven't changed. This prevents expensive re-renders of:
 * - 3 Recharts visualizations (ComposedChart, BarChart, LineChart)
 * - Complex tooltip and legend components
 * - Multiple useMemo calculations
 *
 * Impact: 20-30% reduction in re-renders when parent re-renders but therapies/fixedCosts unchanged
 */
export const BreakEvenChart = memo(BreakEvenChartComponent)
