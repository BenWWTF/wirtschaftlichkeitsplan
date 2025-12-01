'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAdvancedAnalytics, type AdvancedAnalytics } from '@/lib/actions/analytics'

interface UseRealtimeMetricsOptions {
  autoRefreshInterval?: number // milliseconds, 0 = disabled
  onUpdate?: (metrics: AdvancedAnalytics) => void
  onError?: (error: Error) => void
}

interface UseRealtimeMetricsReturn {
  metrics: AdvancedAnalytics | null
  isLoading: boolean
  isConnected: boolean
  lastUpdated: Date | null
  error: Error | null
  refetch: () => Promise<void>
  subscribe: () => void
  unsubscribe: () => void
}

/**
 * Hook for real-time metric updates using Supabase subscriptions
 * Subscribes to changes in monthly_metrics, expenses, and therapies tables
 */
export function useRealtimeMetrics(
  options: UseRealtimeMetricsOptions = {}
): UseRealtimeMetricsReturn {
  const {
    autoRefreshInterval = 30000, // 30 seconds default
    onUpdate,
    onError,
  } = options

  const [metrics, setMetrics] = useState<AdvancedAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const supabaseRef = useRef(createClient())
  const channelsRef = useRef<any[]>([])
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load metrics
  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAdvancedAnalytics()

      if (data) {
        setMetrics(data)
        setLastUpdated(new Date())
        onUpdate?.(data)
      } else {
        setError(new Error('No analytics data available'))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      console.error('[useRealtimeMetrics] Failed to load metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onUpdate, onError])

  // Refetch metrics
  const refetch = useCallback(async () => {
    await loadMetrics()
  }, [loadMetrics])

  // Schedule auto-refresh
  const scheduleAutoRefresh = useCallback(() => {
    if (autoRefreshTimeoutRef.current) {
      clearTimeout(autoRefreshTimeoutRef.current)
    }

    if (autoRefreshInterval > 0) {
      autoRefreshTimeoutRef.current = setTimeout(() => {
        refetch()
        scheduleAutoRefresh() // Recursively schedule next refresh
      }, autoRefreshInterval)
    }
  }, [autoRefreshInterval, refetch])

  // Subscribe to real-time changes
  const subscribe = useCallback(() => {
    try {
      const supabase = supabaseRef.current

      // Subscribe to monthly_plans changes
      const plansChannel = supabase
        .channel('metrics:monthly_plans')
        .on(
          'postgres_changes',
          {
            event: '*', // all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'monthly_plans',
          },
          () => {
            console.log('[useRealtimeMetrics] Detected monthly_plans change')
            refetch()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[useRealtimeMetrics] Subscribed to monthly_plans')
            setIsConnected(true)
          }
        })

      // Subscribe to expenses changes
      const expensesChannel = supabase
        .channel('metrics:expenses')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expenses',
          },
          () => {
            console.log('[useRealtimeMetrics] Detected expenses change')
            refetch()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[useRealtimeMetrics] Subscribed to expenses')
          }
        })

      // Subscribe to therapy_types changes
      const therapyChannel = supabase
        .channel('metrics:therapy_types')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'therapy_types',
          },
          () => {
            console.log('[useRealtimeMetrics] Detected therapy_types change')
            refetch()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[useRealtimeMetrics] Subscribed to therapy_types')
          }
        })

      channelsRef.current = [plansChannel, expensesChannel, therapyChannel]
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[useRealtimeMetrics] Failed to subscribe:', error)
      setIsConnected(false)
      // Gracefully degrade to polling if realtime fails
      scheduleAutoRefresh()
    }
  }, [refetch, scheduleAutoRefresh])

  // Unsubscribe from real-time changes
  const unsubscribe = useCallback(async () => {
    const supabase = supabaseRef.current

    for (const channel of channelsRef.current) {
      try {
        await supabase.removeChannel(channel)
      } catch (err) {
        console.error('[useRealtimeMetrics] Failed to unsubscribe:', err)
      }
    }

    channelsRef.current = []
    setIsConnected(false)

    if (autoRefreshTimeoutRef.current) {
      clearTimeout(autoRefreshTimeoutRef.current)
    }
  }, [])

  // Initialize: load metrics and subscribe
  useEffect(() => {
    loadMetrics()
    subscribe()
    scheduleAutoRefresh()

    return () => {
      unsubscribe()
    }
  }, [loadMetrics, subscribe, unsubscribe, scheduleAutoRefresh])

  return {
    metrics,
    isLoading,
    isConnected,
    lastUpdated,
    error,
    refetch,
    subscribe,
    unsubscribe,
  }
}
