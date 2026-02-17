'use client'

import { useState, useEffect } from 'react'
import type { MonthlyMetrics, TherapyMetrics, DashboardSummary } from '@/lib/actions/dashboard'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from './business-reports/overview-tab'
import { TherapyTab } from './business-reports/therapy-tab'
import { FinancialTab } from './business-reports/financial-tab'
import { ForecastTab } from './business-reports/forecast-tab'
import { TaxesTab } from './business-reports/taxes-tab'

interface ReportsViewProps {
  monthlyData: MonthlyMetrics[]
  therapyMetrics: TherapyMetrics[]
  summary: DashboardSummary
  analytics: AdvancedAnalytics | null
}

export function ReportsView({
  monthlyData,
  therapyMetrics,
  summary,
  analytics
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && ['overview', 'therapy', 'financial', 'forecast', 'taxes'].includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    window.history.replaceState(null, '', `#${tab}`)
  }

  return (
    <div className="space-y-8">
      {/* Empty State */}
      {monthlyData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400 text-center">
            Keine Daten verfügbar. Starten Sie mit der Erfassung Ihrer Daten in der monatlichen Planung.
          </p>
        </div>
      )}

      {/* Tabs */}
      {monthlyData.length > 0 && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-5 min-w-full">
              <TabsTrigger value="overview" className="min-h-[44px] flex-shrink-0">Übersicht</TabsTrigger>
              <TabsTrigger value="therapy" className="min-h-[44px] flex-shrink-0">Therapien</TabsTrigger>
              <TabsTrigger value="financial" className="min-h-[44px] flex-shrink-0">Finanzen</TabsTrigger>
              <TabsTrigger value="forecast" className="min-h-[44px] flex-shrink-0">Prognose</TabsTrigger>
              <TabsTrigger value="taxes" className="min-h-[44px] flex-shrink-0">Steuern</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              monthlyData={monthlyData}
              therapyMetrics={therapyMetrics}
              summary={summary}
            />
          </TabsContent>

          <TabsContent value="therapy" className="mt-6">
            <TherapyTab analytics={analytics} therapies={therapyMetrics} />
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <FinancialTab monthlyData={monthlyData} />
          </TabsContent>

          <TabsContent value="forecast" className="mt-6">
            <ForecastTab monthlyData={monthlyData} />
          </TabsContent>

          <TabsContent value="taxes" className="mt-6">
            <TaxesTab summary={summary} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
