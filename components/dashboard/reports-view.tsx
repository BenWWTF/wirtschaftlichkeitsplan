'use client'

import { useState, useEffect, useMemo } from 'react'
import type { MonthlyMetrics, TherapyMetrics, DashboardSummary } from '@/lib/actions/dashboard'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from './business-reports/overview-tab'
import { TherapyTab } from './business-reports/therapy-tab'
import { FinancialTab } from './business-reports/financial-tab'
import { ForecastTab } from './business-reports/forecast-tab'
import { TaxesTab } from './business-reports/taxes-tab'
import { DateRangeSelector } from './business-reports/components/date-range-selector'
import { TherapyFilter } from './business-reports/components/therapy-filter'

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
  const [selectedTherapies, setSelectedTherapies] = useState<string[]>([])
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

  useEffect(() => {
    // Restore tab state from URL hash
    const hash = window.location.hash.replace('#', '')
    if (hash && ['overview', 'therapy', 'financial', 'forecast', 'taxes'].includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  // Filter data based on selected therapies and date range
  const filteredTherapyMetrics = useMemo(() => {
    let filtered = therapyMetrics

    if (selectedTherapies.length > 0) {
      filtered = filtered.filter((t) => selectedTherapies.includes(t.therapy_id))
    }

    return filtered
  }, [therapyMetrics, selectedTherapies])

  const filteredMonthlyData = useMemo(() => {
    let filtered = monthlyData

    if (dateRangeStart && dateRangeEnd) {
      filtered = filtered.filter((m) => {
        const date = new Date(m.month)
        return date >= dateRangeStart && date <= dateRangeEnd
      })
    }

    return filtered
  }, [monthlyData, dateRangeStart, dateRangeEnd])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Update URL hash for bookmarking/sharing
    window.history.replaceState(null, '', `#${tab}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Geschäftsberichte
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Übersicht der durchgeführten Sitzungen und erzielten Ergebnisse
        </p>

        {/* Filters */}
        {monthlyData.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <DateRangeSelector
              onDateRangeChange={(startDate, endDate) => {
                setDateRangeStart(startDate)
                setDateRangeEnd(endDate)
              }}
            />
            <TherapyFilter
              therapies={therapyMetrics}
              onFilterChange={setSelectedTherapies}
            />
          </div>
        )}
      </div>

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="therapy">Therapien</TabsTrigger>
            <TabsTrigger value="financial">Finanzen</TabsTrigger>
            <TabsTrigger value="forecast">Prognose</TabsTrigger>
            <TabsTrigger value="taxes">Steuern</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              monthlyData={filteredMonthlyData}
              therapyMetrics={filteredTherapyMetrics}
              summary={summary}
            />
          </TabsContent>

          <TabsContent value="therapy" className="mt-6">
            <TherapyTab analytics={analytics} therapies={filteredTherapyMetrics} />
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <FinancialTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="forecast" className="mt-6">
            <ForecastTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="taxes" className="mt-6">
            <TaxesTab summary={summary} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
