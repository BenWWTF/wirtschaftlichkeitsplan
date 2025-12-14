'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, AlertTriangle, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Dot } from 'recharts'
import type { UnifiedMetricsResponse } from '@/lib/metrics/unified-metrics'
import { formatCurrency } from '@/lib/utils/formatting'
import { cn } from '@/lib/utils'

interface VarianceAnalysisTabProps {
  metrics: UnifiedMetricsResponse
}

interface VarianceRow {
  label: string
  planned: number
  actual: number
  variance: number
  variancePercent: number
  status: 'good' | 'warning' | 'critical'
}

interface TherapyVarianceData extends VarianceRow {
  revenue: number
  margin: number
}

function getVarianceStatus(percent: number): 'good' | 'warning' | 'critical' {
  const abs = Math.abs(percent)
  if (abs <= 5) return 'good'
  if (abs <= 15) return 'warning'
  return 'critical'
}

function getStatusColor(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    case 'critical':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }
}

function getStatusTextColor(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good':
      return 'text-green-700 dark:text-green-400'
    case 'warning':
      return 'text-amber-700 dark:text-amber-400'
    case 'critical':
      return 'text-red-700 dark:text-red-400'
  }
}

function VarianceIcon({ status }: { status: 'good' | 'warning' | 'critical' }) {
  switch (status) {
    case 'good':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-amber-500" />
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
  }
}

function formatPeriodDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function getPeriodLabel(startDate: Date): string {
  const monthYear = new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric'
  }).format(startDate)
  return monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
}

export function VarianceAnalysisTab({ metrics }: VarianceAnalysisTabProps) {
  const [expandedTherapy, setExpandedTherapy] = useState<string | null>(null)
  const [showAllTherapies, setShowAllTherapies] = useState(false)

  // Calculate key variances
  const sessionVariance = metrics.totalPlannedSessions - metrics.totalSessions
  const sessionVariancePercent = metrics.totalPlannedSessions > 0
    ? ((sessionVariance / metrics.totalPlannedSessions) * 100)
    : 0

  // Estimate planned revenue based on average price and planned sessions
  const plannedRevenue = Math.round(metrics.averageSessionPrice * metrics.totalPlannedSessions)
  const revenueVariance = plannedRevenue - metrics.totalRevenue
  const revenueVariancePercent = plannedRevenue > 0 ? ((revenueVariance / plannedRevenue) * 100) : 0

  // Build variance rows
  const mainVariances: VarianceRow[] = [
    {
      label: 'Sitzungen (geplant vs. Ist)',
      planned: metrics.totalPlannedSessions,
      actual: metrics.totalSessions,
      variance: sessionVariance,
      variancePercent: sessionVariancePercent,
      status: getVarianceStatus(sessionVariancePercent)
    },
    {
      label: 'Umsatz (geplant vs. Ist)',
      planned: plannedRevenue,
      actual: metrics.totalRevenue,
      variance: revenueVariance,
      variancePercent: revenueVariancePercent,
      status: getVarianceStatus(revenueVariancePercent)
    }
  ]

  const therapyVariances: TherapyVarianceData[] = metrics.therapyMetrics.map(therapy => ({
    label: therapy.name,
    planned: therapy.plannedSessions,
    actual: therapy.actualSessions,
    variance: therapy.plannedSessions - therapy.actualSessions,
    variancePercent: therapy.plannedSessions > 0
      ? (((therapy.plannedSessions - therapy.actualSessions) / therapy.plannedSessions) * 100)
      : 0,
    status: getVarianceStatus(
      therapy.plannedSessions > 0
        ? (((therapy.plannedSessions - therapy.actualSessions) / therapy.plannedSessions) * 100)
        : 0
    ),
    revenue: therapy.totalRevenue,
    margin: therapy.totalMargin
  }))

  // Sort therapies by absolute variance (most important first)
  const sortedTherapies = useMemo(() => {
    return [...therapyVariances].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
  }, [therapyVariances])

  // Show top 10, or all if user clicks "Show More"
  const displayedTherapies = useMemo(() => {
    return showAllTherapies ? sortedTherapies : sortedTherapies.slice(0, 10)
  }, [sortedTherapies, showAllTherapies])

  // Count variance statuses
  const goodCount = mainVariances.filter(v => v.status === 'good').length +
                   therapyVariances.filter(v => v.status === 'good').length
  const warningCount = mainVariances.filter(v => v.status === 'warning').length +
                       therapyVariances.filter(v => v.status === 'warning').length
  const criticalCount = mainVariances.filter(v => v.status === 'critical').length +
                        therapyVariances.filter(v => v.status === 'critical').length

  // Format period information
  const periodLabel = getPeriodLabel(metrics.period.start)
  const startDateFormatted = formatPeriodDate(metrics.period.start)
  const endDateFormatted = formatPeriodDate(metrics.period.end)

  return (
    <div className="space-y-6">
      {/* Period Context Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">
              📅 Abweichungsanalyse für:
            </p>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {periodLabel}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
              {startDateFormatted} – {endDateFormatted}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">
              Vergleich:
            </p>
            <p className="text-base font-semibold text-blue-900 dark:text-blue-100">
              Geplant vs. Ist
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
              Innerhalb dieser Periode
            </p>
          </div>
        </div>
      </div>

      {/* PHASE 1: Critical KPI Card */}
      <Card className={cn(
        'border-2',
        criticalCount > 0
          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
          : warningCount > 0
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
          : 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Abweichungs-Übersicht</p>
              <div className="flex gap-4">
                <div>
                  <p className={`text-2xl font-bold ${goodCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-400'}`}>
                    {goodCount}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Im Plan (±5%)</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${warningCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400'}`}>
                    {warningCount}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Warnung (±5-15%)</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}`}>
                    {criticalCount}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Kritisch (&gt;±15%)</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              {criticalCount > 0 && (
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">⚠️ Handlung erforderlich</p>
              )}
              {warningCount > 0 && criticalCount === 0 && (
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">📌 Beobachten erforderlich</p>
              )}
              {criticalCount === 0 && warningCount === 0 && (
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">✅ Alles im Plan</p>
              )}
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {therapyVariances.length} Therapietypen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PHASE 2: Main Variances with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sessions Variance */}
        <Card className={cn('border', getStatusColor(mainVariances[0].status))}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sitzungen</CardTitle>
              <span className={cn('text-sm font-bold px-2 py-1 rounded', getStatusTextColor(mainVariances[0].status))}>
                {mainVariances[0].variancePercent > 0 ? '+' : ''}{mainVariances[0].variancePercent.toFixed(1)}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dumbbell Chart */}
            <div className="h-16 flex items-center justify-between px-2 mb-4">
              <div className="text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Geplant</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{mainVariances[0].planned}</p>
              </div>
              <div className="flex-1 mx-4 flex items-center">
                <div className="h-1 flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full relative">
                  <div
                    className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full ${
                      mainVariances[0].status === 'good'
                        ? 'bg-green-500'
                        : mainVariances[0].status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      left: `${(mainVariances[0].actual / Math.max(mainVariances[0].planned, mainVariances[0].actual)) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Ist</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{mainVariances[0].actual}</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
              Differenz: {mainVariances[0].variance < 0 ? '' : '+'}{mainVariances[0].variance} Sitzungen
            </p>
          </CardContent>
        </Card>

        {/* Revenue Variance */}
        <Card className={cn('border', getStatusColor(mainVariances[1].status))}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Umsatz</CardTitle>
              <span className={cn('text-sm font-bold px-2 py-1 rounded', getStatusTextColor(mainVariances[1].status))}>
                {mainVariances[1].variancePercent > 0 ? '+' : ''}{mainVariances[1].variancePercent.toFixed(1)}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dumbbell Chart */}
            <div className="h-16 flex items-center justify-between px-2 mb-4">
              <div className="text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Geplant</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{formatCurrency(mainVariances[1].planned)}</p>
              </div>
              <div className="flex-1 mx-4 flex items-center">
                <div className="h-1 flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full relative">
                  <div
                    className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full ${
                      mainVariances[1].status === 'good'
                        ? 'bg-green-500'
                        : mainVariances[1].status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      left: `${(mainVariances[1].actual / Math.max(mainVariances[1].planned, mainVariances[1].actual)) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Ist</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{formatCurrency(mainVariances[1].actual)}</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
              Differenz: {mainVariances[1].variance < 0 ? '' : '+'}{formatCurrency(mainVariances[1].variance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PHASE 2: Therapy Ranking Bar Chart */}
      {sortedTherapies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Therapien nach Abweichung</CardTitle>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Sortiert nach absoluter Sitzungs-Abweichung
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedTherapies} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="label" type="category" stroke="#6b7280" width={145} style={{ fontSize: '11px' }} />
                  <Tooltip
                    formatter={(value) => {
                      if (typeof value === 'number') {
                        return Math.abs(value)
                      }
                      return value
                    }}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Bar
                    dataKey="variance"
                    fill="#3b82f6"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PHASE 2: Therapy Breakdown with Enhanced Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Therapiearten - Detailliert</CardTitle>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {displayedTherapies.length} von {therapyVariances.length} Therapietypen angezeigt
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displayedTherapies.map((therapy) => (
              <div
                key={therapy.label}
                className={cn('border rounded-lg p-3 transition-all', getStatusColor(therapy.status))}
              >
                <button
                  onClick={() => setExpandedTherapy(expandedTherapy === therapy.label ? null : therapy.label)}
                  className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <VarianceIcon status={therapy.status} />
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white text-sm">{therapy.label}</h4>
                      <p className={cn('text-xs font-medium', getStatusTextColor(therapy.status))}>
                        {therapy.planned} → {therapy.actual} ({therapy.variancePercent > 0 ? '+' : ''}{therapy.variancePercent.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right pr-2">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formatCurrency(therapy.revenue)}</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Umsatz</p>
                    </div>
                    {expandedTherapy === therapy.label ? (
                      <ChevronUp className="h-4 w-4 text-neutral-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-600" />
                    )}
                  </div>
                </button>

                {expandedTherapy === therapy.label && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Deckungsbeitrag</p>
                      <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(therapy.margin)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Gewinn-Impact</p>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {therapy.variance !== 0
                          ? formatCurrency(Math.round((therapy.margin / (therapy.actual || 1)) * therapy.variance))
                          : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!showAllTherapies && sortedTherapies.length > 10 && (
            <button
              onClick={() => setShowAllTherapies(true)}
              className="mt-4 w-full py-2 px-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Alle {therapyVariances.length} Therapietypen anzeigen →
            </button>
          )}

          {showAllTherapies && sortedTherapies.length > 10 && (
            <button
              onClick={() => setShowAllTherapies(false)}
              className="mt-4 w-full py-2 px-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Weniger anzeigen ↑
            </button>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Abweichungs-Einblicke
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          {sessionVariancePercent > 5 && (
            <li>• Sie haben {Math.abs(sessionVariance)} weniger Sitzungen als geplant – prüfen Sie Ihre Auslastung und Marketingmaßnahmen</li>
          )}
          {sessionVariancePercent < -5 && (
            <li>• Sie führen {Math.abs(sessionVariance)} mehr Sitzungen durch als geplant – großartig! Erwägen Sie, Ihre Pläne anzupassen</li>
          )}
          {revenueVariancePercent > 10 && (
            <li>• Ihr Umsatz ist {Math.abs(revenueVariance) > 0 ? formatCurrency(Math.abs(revenueVariance)) : '...'} unter Plan – dies könnte auf weniger Sitzungen oder niedrigere Preise zurückzuführen sein</li>
          )}
          {therapyVariances.some(t => t.status === 'critical') && (
            <li>• {therapyVariances.filter(t => t.status === 'critical').length} Therapietyp(en) haben Abweichungen über 15% – untersuchen Sie diese zuerst</li>
          )}
          <li>• Nutzen Sie diese Erkenntnisse, um Ihre Planung für den nächsten Monat zu informieren</li>
        </ul>
      </div>
    </div>
  )
}
