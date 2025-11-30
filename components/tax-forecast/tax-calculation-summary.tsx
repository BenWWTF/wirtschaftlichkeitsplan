'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Share2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComprehensiveTaxResult, TaxOptimizationTip } from '@/lib/types/tax-types'
import { generateTaxOptimizationTips } from '@/lib/utils/comprehensive-tax'
import { formatEuro } from '@/lib/config/tax-config'
import { generateReport, downloadReport } from '@/lib/services/tax-report-generator'

interface TaxCalculationSummaryProps {
  result: ComprehensiveTaxResult
  onExport?: (format: 'pdf' | 'csv' | 'html') => void
}

export function TaxCalculationSummary({
  result,
  onExport,
}: TaxCalculationSummaryProps) {
  const tips = generateTaxOptimizationTips(result)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'html' | null>(null)

  const handleExport = async (format: 'pdf' | 'csv' | 'html') => {
    if (onExport) {
      onExport(format)
      return
    }

    setIsExporting(true)
    setExportFormat(format)
    try {
      const result_export = await generateReport(result, format === 'pdf' ? 'html' : format, `Steuerschätzung ${result.taxYear}`)
      if (result_export instanceof Blob) {
        downloadReport(
          result_export,
          `Steuerschaetzung-${result.taxYear}-${new Date().toISOString().split('T')[0]}`,
          format === 'pdf' ? 'html' : format
        )
      } else {
        // Handle string result (JSON/CSV)
        const mimeType = format === 'csv' ? 'text/csv' : 'application/json'
        const blob = new Blob([result_export], { type: mimeType })
        downloadReport(
          blob,
          `Steuerschaetzung-${result.taxYear}-${new Date().toISOString().split('T')[0]}`,
          format
        )
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
      setExportFormat(null)
    }
  }

  const getEffectiveRateColor = (rate: number) => {
    if (rate < 30) return 'text-green-600 dark:text-green-400'
    if (rate < 45) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getBurdenColor = (percentage: number) => {
    if (percentage < 35) return 'bg-green-500'
    if (percentage < 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card className="border-accent-200 dark:border-accent-800 bg-gradient-to-br from-accent-50 to-transparent dark:from-accent-900/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            <div>
              <CardTitle>Steuerschätzung {result.taxYear}</CardTitle>
              <CardDescription>
                Basierend auf Ihren Einnahmen und Ausgaben
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Gross Income */}
            <div className="space-y-1">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Bruttoeinkommen
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatEuro(result.totalGrossIncome)}
              </p>
            </div>

            {/* Social Security */}
            <div className="space-y-1">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Sozialversicherung
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                -{formatEuro(result.totalSs)}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {result.burdenPercentage >= 30
                  ? ((result.totalSs / result.totalGrossIncome) * 100).toFixed(1)
                  : '20'}{' '}
                %
              </p>
            </div>

            {/* Income Tax */}
            <div className="space-y-1">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Einkommensteuer
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                -{formatEuro(result.totalIncomeTax)}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {result.effectiveTaxRate.toFixed(1)} %
              </p>
            </div>

            {/* Net Income */}
            <div className="space-y-1">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Nettoeinkommen
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatEuro(result.netIncome)}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Das nehmen Sie mit
              </p>
            </div>
          </div>

          {/* Burden Visualization */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                Gesamtsteuerbelastung
              </p>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                {result.burdenPercentage.toFixed(1)}%
              </p>
            </div>
            <Progress
              value={Math.min(result.burdenPercentage, 100)}
              className="h-3"
            />
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Von €{formatEuro(result.totalGrossIncome)} gehen €
              {formatEuro(result.totalDirectBurden)} an Steuern und Sozialversicherung
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={isExporting && exportFormat === 'pdf'}
              className="flex-1"
            >
              {isExporting && exportFormat === 'pdf' ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting && exportFormat === 'csv'}
              className="flex-1"
            >
              {isExporting && exportFormat === 'csv' ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('html')}
              disabled={isExporting && exportFormat === 'html'}
              className="flex-1"
            >
              {isExporting && exportFormat === 'html' ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-1" />
              )}
              Teilen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaillierte Aufschlüsselung</CardTitle>
          <CardDescription>
            Wie sich Ihre Steuerbelastung zusammensetzt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Employment */}
          {result.employmentGross > 0 && (
            <div className="space-y-2 pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Angestellteneinkommen
              </h4>
              <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-sm">
                <span className="text-sm">Jahresbrutto</span>
                <span className="text-sm font-semibold">
                  {formatEuro(result.employmentGross)}
                </span>
              </div>
              {result.employeeSs > 0 && (
                <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-sm">
                  <span className="text-sm">Sozialversicherung (Angestellte)</span>
                  <span className="text-sm font-semibold">
                    -{formatEuro(result.employeeSs)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Self-Employment */}
          {result.selfEmploymentProfit > 0 && (
            <div className="space-y-2 pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Selbständiges Einkommen
              </h4>
              <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-sm">
                <span className="text-sm">Gewinn</span>
                <span className="text-sm font-semibold">
                  {formatEuro(result.selfEmploymentProfit)}
                </span>
              </div>
              {result.gewinnfreibetrag > 0 && (
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-sm border border-green-200 dark:border-green-800">
                  <span className="text-sm text-green-900 dark:text-green-100">
                    Gewinnfreibetrag (15%)
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    -{formatEuro(result.gewinnfreibetrag)}
                  </span>
                </div>
              )}
              {result.selfEmployedSs > 0 && (
                <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-sm">
                  <span className="text-sm">Sozialversicherung (SVS)</span>
                  <span className="text-sm font-semibold">
                    -{formatEuro(result.selfEmployedSs)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Taxes */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Einkommensteuer
            </h4>
            <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-sm">
              <span className="text-sm">Einkommensteuer (nach Gutschriften)</span>
              <span className="text-sm font-semibold">
                {formatEuro(result.totalIncomeTax)}
              </span>
            </div>
            {result.appliedCredits > 0 && (
              <div className="flex justify-between items-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-sm border border-primary-200 dark:border-primary-800">
                <span className="text-sm text-primary-900 dark:text-primary-100">
                  Absetzbeträge (Gutschriften)
                </span>
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  -{formatEuro(result.appliedCredits)}
                </span>
              </div>
            )}
            {result.taxLiability !== 0 && (
              <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-sm border border-amber-200 dark:border-amber-800">
                <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  {result.taxLiability > 0 ? 'Steuernachzahlung' : 'Steuerrückerstattung'}
                </span>
                <span className={`text-sm font-semibold ${result.taxLiability > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  {result.taxLiability > 0 ? '-' : '+'}
                  {formatEuro(Math.abs(result.taxLiability))}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax Rates Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Steuersätze</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Durchschnittssatz
            </p>
            <p className="text-xl font-bold">
              {result.effectiveTaxRate.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Grenzsteuersatz
            </p>
            <p className="text-xl font-bold">
              {result.marginalTaxRate.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Gesamtbelastung
            </p>
            <p className="text-xl font-bold">
              {result.burdenPercentage.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Quartalsvorauszahlung
            </p>
            <p className="text-xl font-bold">
              {formatEuro(result.totalIncomeTax / 4)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tax Optimization Tips */}
      {tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent-600 dark:text-accent-400" />
              Steuertipps für Sie
            </CardTitle>
            <CardDescription>
              Personalisierte Empfehlungen zur Steueroptimierung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tips.map((tip, index) => {
              const bgColor =
                tip.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : tip.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'

              const textColor =
                tip.type === 'warning'
                  ? 'text-amber-800 dark:text-amber-200'
                  : tip.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-primary-800 dark:text-primary-200'

              const IconComponent =
                tip.type === 'warning'
                  ? AlertCircle
                  : tip.type === 'success'
                    ? CheckCircle
                    : Info

              return (
                <div
                  key={index}
                  className={`border p-4 rounded-lg space-y-1 ${bgColor}`}
                >
                  <div className="flex items-start gap-2">
                    <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${textColor}`} />
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${textColor}`}>
                        {tip.title}
                      </p>
                      <p className={`text-sm ${textColor}`}>
                        {tip.description}
                      </p>
                      {tip.potentialSavings && (
                        <p className={`text-sm font-semibold mt-2 ${textColor}`}>
                          Mögliche Ersparnis: {formatEuro(tip.potentialSavings)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-sm p-4">
        <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          ℹ️ Hinweis zur Berechnung
        </h4>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Diese Berechnung basiert auf den österreichischen Steuersätzen {result.taxYear}{' '}
          und verwendet vereinfachte Annahmen. Für eine verbindliche Steuerberechnung
          konsultieren Sie bitte Ihren Steuerberater. Die Berechnung berücksichtigt:
          progressive Einkommensteuer (bis {result.marginalTaxRate.toFixed(0)}%), SVS-Beiträge,
          Gewinnfreibetrag, und Absetzbeträge.
        </p>
      </div>
    </div>
  )
}
