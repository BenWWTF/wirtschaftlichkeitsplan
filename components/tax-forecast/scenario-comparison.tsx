'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowDown,
  ArrowUp,
  Trash2,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import type { TaxScenario, ComprehensiveTaxResult } from '@/lib/types/tax-types'
import { formatEuro } from '@/lib/config/tax-config'

interface ScenarioComparisonProps {
  scenarios: TaxScenario[]
  onSelectScenario?: (scenarioId: string) => void
  onDeleteScenario?: (scenarioId: string) => void
  onGenerateReport?: (scenarioId: string) => void
  selectedScenarioId?: string | null
}

export function ScenarioComparison({
  scenarios,
  onSelectScenario,
  onDeleteScenario,
  onGenerateReport,
  selectedScenarioId,
}: ScenarioComparisonProps) {
  if (scenarios.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Keine Szenarien zur Anzeige. Erstellen Sie zunächst eine
              Steuerschätzung.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find best and worst scenarios
  const bestScenario = scenarios.reduce((best, current) => {
    return current.result.netIncome > best.result.netIncome ? current : best
  })

  const worstScenario = scenarios.reduce((worst, current) => {
    return current.result.netIncome < worst.result.netIncome ? current : worst
  })

  // Calculate differences from first scenario
  const firstResult = scenarios[0].result
  const getDifference = (value: number, baseValue: number) => {
    const diff = value - baseValue
    return {
      value: diff,
      percent: ((diff / baseValue) * 100).toFixed(1),
      isPositive: diff > 0,
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Anzahl Szenarien
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {scenarios.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Beste Option
            </p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400 truncate">
              {bestScenario.scenarioName}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {formatEuro(bestScenario.result.netIncome)} Netto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Schlechteste Option
            </p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400 truncate">
              {worstScenario.scenarioName}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {formatEuro(worstScenario.result.netIncome)} Netto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Differenz (Best/Schlecht)
            </p>
            <p className="text-lg font-semibold text-accent-600 dark:text-accent-400">
              {formatEuro(
                bestScenario.result.netIncome -
                  worstScenario.result.netIncome
              )}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {(
                ((bestScenario.result.netIncome -
                  worstScenario.result.netIncome) /
                  worstScenario.result.netIncome) *
                100
              ).toFixed(1)}
              % Unterschied
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaillierter Vergleich</CardTitle>
          <CardDescription>
            Vergleichen Sie alle Ihre Steuer-Szenarien nebeneinander
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Szenario</TableHead>
                  <TableHead className="text-right">Bruttoeinkommen</TableHead>
                  <TableHead className="text-right">
                    Sozialversicherung
                  </TableHead>
                  <TableHead className="text-right">Einkommensteuer</TableHead>
                  <TableHead className="text-right">Nettoeinkommen</TableHead>
                  <TableHead className="text-right">Belastung</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((scenario) => {
                  const result = scenario.result
                  const isBest = scenario.id === bestScenario.id
                  const isWorst = scenario.id === worstScenario.id
                  const isSelected = scenario.id === selectedScenarioId

                  return (
                    <TableRow
                      key={scenario.id}
                      className={`${
                        isSelected
                          ? 'bg-accent-50 dark:bg-accent-900/20'
                          : isBest
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : isWorst
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : ''
                      } cursor-pointer`}
                      onClick={() => onSelectScenario?.(scenario.id)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {scenario.scenarioName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(scenario.createdAt).toLocaleDateString(
                              'de-AT'
                            )}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {isBest && (
                              <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                                <CheckCircle className="w-3 h-3" />
                                Beste
                              </span>
                            )}
                            {isWorst && (
                              <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs">
                                <AlertCircle className="w-3 h-3" />
                                Schlechteste
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-semibold">
                            {formatEuro(result.totalGrossIncome)}
                          </p>
                          {scenario !== scenarios[0] && (
                            <p
                              className={`text-xs ${
                                getDifference(
                                  result.totalGrossIncome,
                                  firstResult.totalGrossIncome
                                ).isPositive
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {getDifference(
                                result.totalGrossIncome,
                                firstResult.totalGrossIncome
                              ).isPositive ? (
                                <ArrowUp className="w-3 h-3 inline mr-1" />
                              ) : (
                                <ArrowDown className="w-3 h-3 inline mr-1" />
                              )}
                              {getDifference(
                                result.totalGrossIncome,
                                firstResult.totalGrossIncome
                              ).percent}
                              %
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            -{formatEuro(result.totalSs)}
                          </p>
                          {scenario !== scenarios[0] && (
                            <p
                              className={`text-xs ${
                                getDifference(
                                  result.totalSs,
                                  firstResult.totalSs
                                ).isPositive
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {getDifference(
                                result.totalSs,
                                firstResult.totalSs
                              ).isPositive ? (
                                <ArrowUp className="w-3 h-3 inline mr-1" />
                              ) : (
                                <ArrowDown className="w-3 h-3 inline mr-1" />
                              )}
                              {Math.abs(
                                parseFloat(
                                  getDifference(
                                    result.totalSs,
                                    firstResult.totalSs
                                  ).percent
                                )
                              ).toFixed(1)}
                              %
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            -{formatEuro(result.totalIncomeTax)}
                          </p>
                          {scenario !== scenarios[0] && (
                            <p
                              className={`text-xs ${
                                getDifference(
                                  result.totalIncomeTax,
                                  firstResult.totalIncomeTax
                                ).isPositive
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {getDifference(
                                result.totalIncomeTax,
                                firstResult.totalIncomeTax
                              ).isPositive ? (
                                <ArrowUp className="w-3 h-3 inline mr-1" />
                              ) : (
                                <ArrowDown className="w-3 h-3 inline mr-1" />
                              )}
                              {Math.abs(
                                parseFloat(
                                  getDifference(
                                    result.totalIncomeTax,
                                    firstResult.totalIncomeTax
                                  ).percent
                                )
                              ).toFixed(1)}
                              %
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {formatEuro(result.netIncome)}
                          </p>
                          {scenario !== scenarios[0] && (
                            <p
                              className={`text-xs ${
                                getDifference(
                                  result.netIncome,
                                  firstResult.netIncome
                                ).isPositive
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {getDifference(
                                result.netIncome,
                                firstResult.netIncome
                              ).isPositive ? (
                                <ArrowUp className="w-3 h-3 inline mr-1" />
                              ) : (
                                <ArrowDown className="w-3 h-3 inline mr-1" />
                              )}
                              {getDifference(
                                result.netIncome,
                                firstResult.netIncome
                              ).percent}
                              %
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-semibold">
                          {result.burdenPercentage.toFixed(1)}%
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {onGenerateReport && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onGenerateReport(scenario.id)
                              }}
                              title="Bericht generieren"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                          {onDeleteScenario && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (
                                  confirm(
                                    'Möchten Sie dieses Szenario wirklich löschen?'
                                  )
                                ) {
                                  onDeleteScenario(scenario.id)
                                }
                              }}
                              title="Szenario löschen"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Metrics */}
      {scenarios.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metriken-Analyse</CardTitle>
            <CardDescription>
              Vergleichende Analyse der Szenarien
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Net Income Range */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                Nettoeinkommen Spanne
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full"></div>
                  </div>
                </div>
                <div className="text-right min-w-fit">
                  <p className="text-sm font-semibold">
                    {formatEuro(bestScenario.result.netIncome)} bis{' '}
                    {formatEuro(worstScenario.result.netIncome)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Spanne:{' '}
                    {formatEuro(
                      bestScenario.result.netIncome -
                        worstScenario.result.netIncome
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Burden Percentage Range */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                Steuerbelastung Spanne
              </p>
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center gap-4 text-sm"
                  >
                    <span className="w-32 truncate text-neutral-600 dark:text-neutral-400">
                      {scenario.scenarioName}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            scenario.result.burdenPercentage < 35
                              ? 'bg-green-500'
                              : scenario.result.burdenPercentage < 50
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min(scenario.result.burdenPercentage, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="w-12 text-right font-semibold">
                        {scenario.result.burdenPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Average Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Ø Bruttoeinkommen
                </p>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {formatEuro(
                    scenarios.reduce(
                      (sum, s) => sum + s.result.totalGrossIncome,
                      0
                    ) / scenarios.length
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Ø Sozialversicherung
                </p>
                <p className="font-semibold text-orange-600 dark:text-orange-400">
                  -{formatEuro(
                    scenarios.reduce((sum, s) => sum + s.result.totalSs, 0) /
                      scenarios.length
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Ø Einkommensteuer
                </p>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  -{formatEuro(
                    scenarios.reduce(
                      (sum, s) => sum + s.result.totalIncomeTax,
                      0
                    ) / scenarios.length
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Ø Nettoeinkommen
                </p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatEuro(
                    scenarios.reduce(
                      (sum, s) => sum + s.result.netIncome,
                      0
                    ) / scenarios.length
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
