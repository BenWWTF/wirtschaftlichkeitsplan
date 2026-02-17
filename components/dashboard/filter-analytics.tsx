'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getFilterAnalytics, getMostUsedFilters } from '@/lib/actions/filter-analytics'
import { Loader } from 'lucide-react'

interface FilterAnalyticsData {
  filterName: string
  usageCount: number
  avgExecutionTime: number
  avgResultsCount: number
}

interface ExecutionTimeData {
  time: string
  avgMs: number
  count: number
}

export function FilterAnalytics() {
  const [mostUsedFilters, setMostUsedFilters] = useState<FilterAnalyticsData[]>([])
  const [executionTimeData, setExecutionTimeData] = useState<ExecutionTimeData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // Get most used filters
      const filtersResult = await getMostUsedFilters(10)
      if (!filtersResult.error && filtersResult.data) {
        setMostUsedFilters(filtersResult.data)
      }

      // Get execution time data
      const executionResult = await getFilterAnalytics(7) // Last 7 days
      if (!executionResult.error && executionResult.data) {
        setExecutionTimeData(executionResult.data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filter Analytics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Most Used Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Häufigste Filter</CardTitle>
          <CardDescription>
            Top 10 Filter, die Sie am häufigsten verwenden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mostUsedFilters.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              Noch keine Filter-Daten verfügbar
            </p>
          ) : (
            <div className="space-y-3">
              {mostUsedFilters.map((filter, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {filter.filterName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Ø Ausführungszeit: {filter.avgExecutionTime.toFixed(0)}ms | Ø Ergebnisse: {filter.avgResultsCount.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-accent-600 dark:text-accent-400">
                      {filter.usageCount}x
                    </p>
                    <p className="text-xs text-gray-500">verwendet</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Time Trend */}
      {executionTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filter-Ausführungszeit</CardTitle>
            <CardDescription>
              Durchschnittliche Ausführungszeit der letzten 7 Tage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={executionTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: 'Zeit (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgMs" fill="#3b82f6" name="Ø Ausführungszeit (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Optimierungstipps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-2">
            <span className="text-accent-500">→</span>
            <p>Speichern Sie häufig verwendete Filter, um Zeit zu sparen</p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent-500">→</span>
            <p>Verwenden Sie spezifischere Filter für schnellere Ergebnisse</p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent-500">→</span>
            <p>Die Kombination mehrerer Filter kann die Abfragezeit erhöhen</p>
          </div>
          <div className="flex gap-2">
            <span className="text-accent-500">→</span>
            <p>Vergessen Sie nicht, Standard-Filter zu setzen für schnellere Workflow</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
