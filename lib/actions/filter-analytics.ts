'use server'

import { createClient } from '@/utils/supabase/server'
import type { FilterRule } from '@/components/dashboard/advanced-filter'
import { filtersToString } from '@/lib/utils/filter-builder'

export interface FilterAnalyticsData {
  filterName: string
  usageCount: number
  avgExecutionTime: number
  avgResultsCount: number
}

export interface ExecutionTimeData {
  time: string
  avgMs: number
  count: number
}

/**
 * Track a filter application
 */
export async function trackFilterApplication(
  filters: FilterRule[],
  resultsCount: number,
  executionTimeMs: number
) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false }
    }

    // Convert filters to string representation for easier analytics
    const filterString = filtersToString(filters)

    await supabase
      .from('filter_analytics')
      .insert({
        user_id: user.id,
        filter_criteria: filters,
        results_count: resultsCount,
        execution_time_ms: executionTimeMs,
      })
      .single()

    return { success: true }
  } catch (error) {
    console.error('Filter analytics tracking error:', error)
    // Don't throw for analytics - it's not critical
    return { success: false }
  }
}

/**
 * Get most used filters for a user
 */
export async function getMostUsedFilters(limit: number = 10) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Get raw analytics data
    const { data: rawData, error } = await supabase
      .from('filter_analytics')
      .select('filter_criteria, execution_time_ms, results_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Query error:', error)
      return { error: 'Fehler beim Abrufen der Analysedaten' }
    }

    if (!rawData || rawData.length === 0) {
      return { data: [] }
    }

    // Group by filter criteria and aggregate stats
    const filterStats = new Map<string, {
      usageCount: number
      totalExecutionTime: number
      totalResults: number
      executionTimes: number[]
      resultCounts: number[]
    }>()

    rawData.forEach(record => {
      const filterKey = JSON.stringify(record.filter_criteria)
      const current = filterStats.get(filterKey) || {
        usageCount: 0,
        totalExecutionTime: 0,
        totalResults: 0,
        executionTimes: [],
        resultCounts: [],
      }

      current.usageCount++
      current.totalExecutionTime += record.execution_time_ms || 0
      current.totalResults += record.results_count || 0
      current.executionTimes.push(record.execution_time_ms || 0)
      current.resultCounts.push(record.results_count || 0)

      filterStats.set(filterKey, current)
    })

    // Convert to sorted array
    const results: FilterAnalyticsData[] = Array.from(filterStats.entries())
      .map(([filterKey, stats]) => ({
        filterName: JSON.parse(filterKey)
          .map((f: FilterRule) => `${f.field} ${f.operator}`)
          .join(' & '),
        usageCount: stats.usageCount,
        avgExecutionTime: Math.round(stats.totalExecutionTime / stats.usageCount),
        avgResultsCount: Math.round(stats.totalResults / stats.usageCount),
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)

    return { data: results }
  } catch (error) {
    console.error('Get most used filters error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Abrufen der Analysedaten' }
  }
}

/**
 * Get filter execution time statistics for the last N days
 */
export async function getFilterAnalytics(days: number = 7) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Calculate date range
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const { data: rawData, error } = await supabase
      .from('filter_analytics')
      .select('created_at, execution_time_ms, results_count')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Query error:', error)
      return { error: 'Fehler beim Abrufen der Analysedaten' }
    }

    if (!rawData || rawData.length === 0) {
      return { data: [] }
    }

    // Group by day and aggregate
    const dailyStats = new Map<string, {
      executionTimes: number[]
      resultsCounts: number[]
      count: number
    }>()

    rawData.forEach(record => {
      const date = new Date(record.created_at)
      const dayKey = date.toISOString().split('T')[0]

      const current = dailyStats.get(dayKey) || {
        executionTimes: [],
        resultsCounts: [],
        count: 0,
      }

      current.executionTimes.push(record.execution_time_ms || 0)
      current.resultsCounts.push(record.results_count || 0)
      current.count++

      dailyStats.set(dayKey, current)
    })

    // Convert to array with aggregated stats
    const results: ExecutionTimeData[] = Array.from(dailyStats.entries())
      .map(([day, stats]) => ({
        time: new Date(day).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
        avgMs: Math.round(
          stats.executionTimes.reduce((a, b) => a + b, 0) / stats.executionTimes.length
        ),
        count: stats.count,
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

    return { data: results }
  } catch (error) {
    console.error('Get filter analytics error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Abrufen der Analysedaten' }
  }
}

/**
 * Get filter usage recommendations
 */
export async function getFilterRecommendations() {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Get the most used filters
    const filtersResult = await getMostUsedFilters(5)
    if (filtersResult.error || !filtersResult.data) {
      return { data: [] }
    }

    // Get slow filters (>500ms average)
    const { data: slowFilters } = await supabase
      .from('filter_analytics')
      .select('filter_criteria, execution_time_ms')
      .eq('user_id', user.id)
      .gte('execution_time_ms', 500)
      .limit(100)

    const recommendations = []

    // Recommend saving frequently used filters
    if (filtersResult.data.length > 0 && filtersResult.data[0].usageCount > 5) {
      recommendations.push({
        type: 'save_filter',
        message: `Sie verwenden Ihre häufigsten Filter über ${filtersResult.data[0].usageCount} Mal. Speichern Sie diese, um Zeit zu sparen.`,
        priority: 'high',
      })
    }

    // Recommend optimizing slow filters
    if (slowFilters && slowFilters.length > 5) {
      recommendations.push({
        type: 'optimize_filter',
        message: 'Sie haben mehrere langsame Filter. Versuchen Sie, spezifischere Kriterien zu verwenden.',
        priority: 'medium',
      })
    }

    return { data: recommendations }
  } catch (error) {
    console.error('Get recommendations error:', error)
    return { data: [] }
  }
}
