'use client'

import { useMemo } from 'react'
import {
  calculateAustrianTax,
  getTaxOptimizationTips,
  formatEuroAT,
  type TaxCalculationResult
} from '@/lib/utils/austrian-tax'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface TaxPlanningCardProps {
  grossRevenue: number
  totalExpenses: number
  practiceType: 'kassenarzt' | 'wahlarzt' | 'mixed'
  privatePatientRevenue?: number
}

export function TaxPlanningCard({
  grossRevenue,
  totalExpenses,
  practiceType,
  privatePatientRevenue
}: TaxPlanningCardProps) {
  const taxResult = useMemo(() => {
    return calculateAustrianTax({
      grossRevenue,
      totalExpenses,
      practiceType,
      applyingPauschalierung: true, // Most practices use this
      privatePatientRevenue
    })
  }, [grossRevenue, totalExpenses, practiceType, privatePatientRevenue])

  const tips = useMemo(() => {
    return getTaxOptimizationTips(taxResult)
  }, [taxResult])

  const getEffectiveRateColor = (rate: number) => {
    if (rate < 30) return 'text-green-600 dark:text-green-400'
    if (rate < 45) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle>Steuer & Abgaben (AT)</CardTitle>
        </div>
        <CardDescription>
          Geschätzte Steuerlast und Nettoeinkommen nach österreichischem Steuerrecht
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gross Profit */}
          <div className="space-y-1">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Gewinn (brutto)
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatEuroAT(taxResult.profit)}
            </p>
          </div>

          {/* Total Tax Burden */}
          <div className="space-y-1">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Gesamte Steuerlast
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{formatEuroAT(taxResult.totalTaxBurden)}
            </p>
            <p className={`text-xs font-medium ${getEffectiveRateColor(taxResult.effectiveTaxRate)}`}>
              {taxResult.effectiveTaxRate.toFixed(1)}% effektive Rate
            </p>
          </div>

          {/* Net Income */}
          <div className="space-y-1">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Nettoeinkommen
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatEuroAT(taxResult.netIncome)}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Das nehmen Sie tatsächlich mit nach Hause
            </p>
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Aufschlüsselung der Abgaben
          </h4>

          <div className="space-y-2">
            {/* SV Contributions */}
            <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Sozialversicherung (SVS)
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Kranken-, Pensions- & Unfallversicherung
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {formatEuroAT(taxResult.svBeitraege)}
              </p>
            </div>

            {/* Ärztekammer */}
            <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Ärztekammer
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Pflichtbeitrag + Fortbildung
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {formatEuroAT(taxResult.aerztekammerBeitrag)}
              </p>
            </div>

            {/* Income Tax */}
            <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Einkommensteuer
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Progressiver Steuersatz (bis 50%)
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {formatEuroAT(taxResult.incomeTax)}
              </p>
            </div>

            {/* VAT (if applicable) */}
            {taxResult.vat > 0 && (
              <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    Umsatzsteuer (USt)
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    20% auf Privatpatienten
                  </p>
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {formatEuroAT(taxResult.vat)}
                </p>
              </div>
            )}

            {/* Pauschale Deduction */}
            {taxResult.pauschalDeduction > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Pauschale Betriebsausgaben
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    13% Steuerersparnis (E/A-Rechnung)
                  </p>
                </div>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  -{formatEuroAT(taxResult.pauschalDeduction)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tax Optimization Tips */}
        {tips.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Steueroptimierungs-Tipps
            </h4>

            <div className="space-y-2">
              {tips.map((tip, index) => {
                const isWarning = tip.includes('⚠️')
                const isSuccess = tip.includes('✅')
                const isInfo = tip.includes('ℹ️')

                const bgColor = isWarning
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : isSuccess
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'

                const textColor = isWarning
                  ? 'text-amber-800 dark:text-amber-200'
                  : isSuccess
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-blue-800 dark:text-blue-200'

                const IconComponent = isWarning
                  ? AlertCircle
                  : isSuccess
                    ? CheckCircle
                    : Info

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor}`}
                  >
                    <IconComponent className={`h-4 w-4 mt-0.5 flex-shrink-0 ${textColor}`} />
                    <p className={`text-sm ${textColor}`}>
                      {tip.replace(/[💡⚠️✅ℹ️]/g, '')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            ℹ️ Hinweis zur Berechnung
          </h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Diese Berechnung basiert auf den österreichischen Steuersätzen 2025 und verwendet
            vereinfachte Annahmen. Für eine verbindliche Steuerberechnung konsultieren Sie bitte
            Ihren Steuerberater. Die Berechnung berücksichtigt: Einkommensteuer (progressiv bis 50%),
            SVS-Beiträge (~27%), Ärztekammer-Beiträge (~3%), und optional die 13% Pauschalierung
            bei E/A-Rechnung.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
