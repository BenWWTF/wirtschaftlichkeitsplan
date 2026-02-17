'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, Plus, Trash2, Calculator } from 'lucide-react'
import type {
  ComprehensiveTaxInput,
  EmploymentIncome,
  SelfEmploymentIncome,
  TaxDeductions,
  TaxCredits,
} from '@/lib/types/tax-types'

interface TaxInputFormProps {
  onCalculate: (input: ComprehensiveTaxInput) => void
  isLoading?: boolean
}

/**
 * Comprehensive tax input form
 *
 * Supports:
 * - Employment income with special payments
 * - Self-employment income with expenses
 * - Multiple deductions
 * - Tax credits
 */
export function TaxInputForm({ onCalculate, isLoading = false }: TaxInputFormProps) {
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear())

  // Employment
  const [employmentEnabled, setEmploymentEnabled] = useState(true)
  const [employment, setEmployment] = useState<EmploymentIncome>({
    grossSalary: 60000,
    specialPaymentsGross: 0,
    homeOfficeDays: 0,
  })

  // Self-employment
  const [selfEmploymentEnabled, setSelfEmploymentEnabled] = useState(true)
  const [selfEmployment, setSelfEmployment] = useState<SelfEmploymentIncome>({
    totalRevenue: 45000,
    businessExpenses: 22000,
  })

  // Deductions
  const [deductions, setDeductions] = useState<TaxDeductions>({
    charitableDonations: 0,
    pensionContributions: 0,
    lifeInsurancePremiums: 0,
  })

  // Credits
  const [credits, setCredits] = useState<TaxCredits>({
    hasCommuterCredit: true,
    numberOfChildren: 0,
  })

  // Helper functions
  const handleInputChange = (field: string, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
    return numValue
  }

  const handleSubmit = useCallback(() => {
    const input: ComprehensiveTaxInput = {
      employment: employmentEnabled ? employment : undefined,
      selfEmployment: selfEmploymentEnabled ? selfEmployment : undefined,
      deductions,
      credits,
      taxYear,
    }

    onCalculate(input)
  }, [employment, employmentEnabled, selfEmployment, selfEmploymentEnabled, deductions, credits, taxYear, onCalculate])

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Steuerjahr</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={taxYear.toString()} onValueChange={(val) => setTaxYear(parseInt(val))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Steuerjahr wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="employment" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employment">Einkommen</TabsTrigger>
          <TabsTrigger value="deductions">Abzüge & Gutschriften</TabsTrigger>
        </TabsList>

        {/* EINKOMMEN TAB */}
        <TabsContent value="employment" className="space-y-4">
          {/* Employment Income Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="employment-enabled"
                    checked={employmentEnabled}
                    onChange={(e) => setEmploymentEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="employment-enabled" className="flex flex-col gap-1 cursor-pointer">
                    <CardTitle className="text-base">Angestellteneinkommen</CardTitle>
                    <CardDescription>Gehalt und Lohn vom Arbeitgeber</CardDescription>
                  </label>
                </div>
              </div>
            </CardHeader>

            {employmentEnabled && (
              <CardContent className="space-y-4">
                {/* Gross Salary */}
                <div className="space-y-2">
                  <Label htmlFor="emp-gross">Jahresbrutto</Label>
                  <Input
                    id="emp-gross"
                    type="number"
                    placeholder="€60,000"
                    value={employment.grossSalary || ''}
                    onChange={(e) =>
                      setEmployment({
                        ...employment,
                        grossSalary: handleInputChange('grossSalary', e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-neutral-500">
                    Bruttobezüge laut Lohnzettel (Zeile 210)
                  </p>
                </div>

                {/* Special Payments */}
                <div className="space-y-2">
                  <Label htmlFor="emp-special">Sonderzahlungen (13., 14. Gehalt)</Label>
                  <Input
                    id="emp-special"
                    type="number"
                    placeholder="€0"
                    value={employment.specialPaymentsGross || ''}
                    onChange={(e) =>
                      setEmployment({
                        ...employment,
                        specialPaymentsGross: handleInputChange('specialPaymentsGross', e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-neutral-500">
                    Bruttobetrag vor Sozialversicherung
                  </p>
                </div>

                {/* Homeoffice */}
                <div className="space-y-2">
                  <Label htmlFor="emp-homeoffice">Homeoffice Tage/Jahr</Label>
                  <Input
                    id="emp-homeoffice"
                    type="number"
                    placeholder="0"
                    value={employment.homeOfficeDays || ''}
                    onChange={(e) =>
                      setEmployment({
                        ...employment,
                        homeOfficeDays: handleInputChange('homeOfficeDays', e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-neutral-500">
                    Anzahl der Tage im Homeoffice (€3/Tag, max €100/Monat)
                  </p>
                </div>

                {/* Wage Tax Withheld */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">
                    <ChevronDown className="w-4 h-4" />
                    Bereits einbehaltene Steuern (optional)
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emp-wage-tax">Einbehaltene Lohnsteuer</Label>
                      <Input
                        id="emp-wage-tax"
                        type="number"
                        placeholder="€0"
                        value={employment.wageTaxWithheld || ''}
                        onChange={(e) =>
                          setEmployment({
                            ...employment,
                            wageTaxWithheld: handleInputChange('wageTaxWithheld', e.target.value),
                          })
                        }
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            )}
          </Card>

          {/* Self-Employment Income Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selfemployment-enabled"
                    checked={selfEmploymentEnabled}
                    onChange={(e) => setSelfEmploymentEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="selfemployment-enabled" className="flex flex-col gap-1 cursor-pointer">
                    <CardTitle className="text-base">Selbständiges Einkommen</CardTitle>
                    <CardDescription>Geschäftseinkommen und Betriebsausgaben</CardDescription>
                  </label>
                </div>
              </div>
            </CardHeader>

            {selfEmploymentEnabled && (
              <CardContent className="space-y-4">
                {/* Total Revenue */}
                <div className="space-y-2">
                  <Label htmlFor="self-revenue">Gesamtumsatz</Label>
                  <Input
                    id="self-revenue"
                    type="number"
                    placeholder="€45,000"
                    value={selfEmployment.totalRevenue || ''}
                    onChange={(e) =>
                      setSelfEmployment({
                        ...selfEmployment,
                        totalRevenue: handleInputChange('totalRevenue', e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-neutral-500">
                    Gesamte Betriebseinnahmen (Brutto)
                  </p>
                </div>

                {/* Total Expenses */}
                <div className="space-y-2">
                  <Label htmlFor="self-expenses">Gesamtausgaben</Label>
                  <Input
                    id="self-expenses"
                    type="number"
                    placeholder="€22,000"
                    value={selfEmployment.businessExpenses || ''}
                    onChange={(e) =>
                      setSelfEmployment({
                        ...selfEmployment,
                        businessExpenses: handleInputChange('businessExpenses', e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-neutral-500">
                    Summe aller Betriebsausgaben
                  </p>
                </div>

                {/* Quick Info */}
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-sm border border-primary-200 dark:border-primary-800">
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    <strong>Gewinn:</strong>{' '}
                    €
                    {((selfEmployment.totalRevenue || 0) - (selfEmployment.businessExpenses || 0)).toLocaleString(
                      'de-AT',
                      { maximumFractionDigits: 0 }
                    )}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* DEDUCTIONS & CREDITS TAB */}
        <TabsContent value="deductions" className="space-y-4">
          {/* Deductions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sonderausgaben (Abzüge)</CardTitle>
              <CardDescription>Spenden, Versicherungen, Fortbildung, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Charitable Donations */}
              <div className="space-y-2">
                <Label htmlFor="ded-donations">Spenden</Label>
                <Input
                  id="ded-donations"
                  type="number"
                  placeholder="€0"
                  value={deductions.charitableDonations || ''}
                  onChange={(e) =>
                    setDeductions({
                      ...deductions,
                      charitableDonations: handleInputChange('charitableDonations', e.target.value),
                    })
                  }
                />
                <p className="text-xs text-neutral-500">
                  An anerkannte Organisationen
                </p>
              </div>

              {/* Pension Contributions */}
              <div className="space-y-2">
                <Label htmlFor="ded-pension">Pensionsbeiträge (private AVS)</Label>
                <Input
                  id="ded-pension"
                  type="number"
                  placeholder="€0"
                  value={deductions.pensionContributions || ''}
                  onChange={(e) =>
                    setDeductions({
                      ...deductions,
                      pensionContributions: handleInputChange('pensionContributions', e.target.value),
                    })
                  }
                />
                <p className="text-xs text-neutral-500">
                  Max. €3.100/Jahr
                </p>
              </div>

              {/* Life Insurance */}
              <div className="space-y-2">
                <Label htmlFor="ded-insurance">Lebensversicherung</Label>
                <Input
                  id="ded-insurance"
                  type="number"
                  placeholder="€0"
                  value={deductions.lifeInsurancePremiums || ''}
                  onChange={(e) =>
                    setDeductions({
                      ...deductions,
                      lifeInsurancePremiums: handleInputChange('lifeInsurancePremiums', e.target.value),
                    })
                  }
                />
                <p className="text-xs text-neutral-500">
                  Beitrag zur Lebensversicherung (max. €730/Jahr)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Credits Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Absetzbeträge (Gutschriften)</CardTitle>
              <CardDescription>Steuergutschriften und Kredite</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Commuter Credit */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-sm">
                <div>
                  <Label htmlFor="credit-commuter" className="text-sm font-medium cursor-pointer">
                    Verkehrsabsetzbetrag
                  </Label>
                  <p className="text-xs text-neutral-500 mt-1">
                    Pendlerkredit (€421)
                  </p>
                </div>
                <input
                  id="credit-commuter"
                  type="checkbox"
                  checked={credits.hasCommuterCredit || false}
                  onChange={(e) =>
                    setCredits({
                      ...credits,
                      hasCommuterCredit: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>

              {/* Children */}
              <div className="space-y-2">
                <Label htmlFor="credit-children">Anzahl der Kinder</Label>
                <Input
                  id="credit-children"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={credits.numberOfChildren || ''}
                  onChange={(e) =>
                    setCredits({
                      ...credits,
                      numberOfChildren: handleInputChange('numberOfChildren', e.target.value),
                    })
                  }
                />
                <p className="text-xs text-neutral-500">
                  Für Unterhaltsabsetzbetrag
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calculate Button */}
      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        size="lg"
        className="w-full"
      >
        <Calculator className="w-5 h-5 mr-2" />
        {isLoading ? 'Berechne...' : 'Steuern berechnen'}
      </Button>

      {/* Info Box */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-sm border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>ℹ️ Hinweis:</strong> Diese Berechnung basiert auf vereinfachten
          Annahmen und österreichischen Steuersätzen {taxYear}. Für eine verbindliche
          Steuerberechnung konsultieren Sie bitte Ihren Steuerberater.
        </p>
      </div>
    </div>
  )
}
