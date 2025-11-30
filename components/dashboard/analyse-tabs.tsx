'use client'

import { useState } from 'react'
import { TrendingUp, Activity } from 'lucide-react'
import { ForecastTab } from './analyse/forecast-tab'
import { VarianceAnalysisTab } from './analyse/variance-analysis-tab'
import type { UnifiedMetricsResponse } from '@/lib/metrics/unified-metrics'
import { cn } from '@/lib/utils'

interface AnalyseTabsProps {
  metrics: UnifiedMetricsResponse
}

type TabType = 'forecast' | 'variance'

const TABS: Array<{
  id: TabType
  label: string
  icon: React.ReactNode
  description: string
}> = [
  {
    id: 'forecast',
    label: 'Prognose',
    icon: <TrendingUp className="h-4 w-4" />,
    description: '6-Monats-Vorhersage'
  },
  {
    id: 'variance',
    label: 'Abweichungen',
    icon: <Activity className="h-4 w-4" />,
    description: 'Plan vs. Ist'
  }
]

export function AnalyseTabs({ metrics }: AnalyseTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('forecast')

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="text-xs opacity-60">({tab.description})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'forecast' && <ForecastTab metrics={metrics} />}
        {activeTab === 'variance' && <VarianceAnalysisTab metrics={metrics} />}
      </div>
    </div>
  )
}
