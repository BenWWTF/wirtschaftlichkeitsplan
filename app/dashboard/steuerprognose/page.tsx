'use client'

import { useState, useCallback } from 'react'
import { RelatedPages } from '@/components/dashboard/related-pages'
import { TaxInputForm } from '@/components/tax-forecast/tax-input-form'
import { TaxCalculationSummary } from '@/components/tax-forecast/tax-calculation-summary'
import { ScenarioComparison } from '@/components/tax-forecast/scenario-comparison'
import type {
  ComprehensiveTaxInput,
  ComprehensiveTaxResult,
  TaxScenario,
} from '@/lib/types/tax-types'
import { calculateComprehensiveTax } from '@/lib/utils/comprehensive-tax'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, AlertCircle } from 'lucide-react'

export default function SteuerprognosePage() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison'>('calculator')
  const [currentResult, setCurrentResult] = useState<ComprehensiveTaxResult | null>(null)
  const [scenarios, setScenarios] = useState<TaxScenario[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)

  const handleCalculate = useCallback((input: ComprehensiveTaxInput) => {
    setIsLoading(true)
    try {
      // Calculate taxes
      const result = calculateComprehensiveTax(input)
      setCurrentResult(result)
      setShowSaveDialog(true)
    } catch (error) {
      console.error('Calculation error:', error)
      // Error handling would go here
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSaveScenario = useCallback(() => {
    if (!currentResult || !scenarioName.trim()) {
      return
    }

    const newScenario: TaxScenario = {
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'current-user', // This would come from auth in a real app
      scenarioName: scenarioName,
      input: {
        // The input would need to be stored with the result
        taxYear: currentResult.taxYear,
      },
      result: currentResult,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setScenarios((prev) => [newScenario, ...prev])
    setScenarioName('')
    setShowSaveDialog(false)
    setSelectedScenarioId(newScenario.id)
    if (scenarios.length > 0) {
      setActiveTab('comparison')
    }
  }, [currentResult, scenarioName, scenarios.length])

  const handleDeleteScenario = useCallback((scenarioId: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== scenarioId))
    if (selectedScenarioId === scenarioId) {
      setSelectedScenarioId(null)
    }
  }, [selectedScenarioId])

  const handleSelectScenario = useCallback((scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId)
    if (scenario) {
      setCurrentResult(scenario.result)
      setSelectedScenarioId(scenarioId)
      setActiveTab('calculator')
    }
  }, [scenarios])

  const handleGenerateReport = useCallback((scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId)
    if (scenario) {
      // Report generation would be implemented here
      console.log('Generating report for scenario:', scenario.scenarioName)
    }
  }, [scenarios])

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Meine Steuerprognose
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Berechnen Sie Ihre österreichische Steuerschätzung mit detaillierter Analyse und
            Optimierungsvorschlägen
          </p>
        </div>

        {/* Info Box */}
        <Card className="mb-6 border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-accent-900 dark:text-accent-100">
                  <strong>Hinweis:</strong> Diese Berechnung basiert auf vereinfachten
                  österreichischen Steuersätzen und Annahmen. Für eine verbindliche
                  Steuerberechnung konsultieren Sie bitte Ihren Steuerberater.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'calculator' | 'comparison')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 min-h-[44px]">
            <TabsTrigger value="calculator" className="min-h-[44px]">Steuerschätzung</TabsTrigger>
            <TabsTrigger value="comparison" disabled={scenarios.length === 0} className="min-h-[44px]">
              Vergleich ({scenarios.length})
            </TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Input Form */}
              <div className="lg:col-span-1">
                <TaxInputForm onCalculate={handleCalculate} isLoading={isLoading} />
              </div>

              {/* Results */}
              <div className="lg:col-span-2">
                {currentResult ? (
                  <div className="space-y-6">
                    <TaxCalculationSummary result={currentResult} />

                    {/* Save Scenario Dialog */}
                    {showSaveDialog && (
                      <Card className="border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20">
                        <CardHeader>
                          <CardTitle className="text-base">Szenario speichern</CardTitle>
                          <CardDescription>
                            Geben Sie einen Namen für dieses Steuerszenario ein
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="scenario-name" className="text-sm font-medium">
                              Szenarioname
                            </label>
                            <Input
                              id="scenario-name"
                              placeholder="z.B. Szenario Q1 2024"
                              value={scenarioName}
                              onChange={(e) => setScenarioName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveScenario()
                                }
                              }}
                              className="min-h-[44px]"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              onClick={handleSaveScenario}
                              disabled={!scenarioName.trim()}
                              className="flex-1"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Speichern
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowSaveDialog(false)
                                setScenarioName('')
                              }}
                              className="flex-1"
                            >
                              Abbrechen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-dashed flex items-center justify-center min-h-96">
                    <CardContent className="text-center">
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Füllen Sie das Formular aus und klicken Sie auf &quot;Steuern berechnen&quot;, um
                        Ihre Steuerschätzung zu sehen.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            <ScenarioComparison
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={handleSelectScenario}
              onDeleteScenario={handleDeleteScenario}
              onGenerateReport={handleGenerateReport}
            />
          </TabsContent>
        </Tabs>
        <RelatedPages currentPage="/dashboard/steuerprognose" />
      </div>
    </main>
  )
}
