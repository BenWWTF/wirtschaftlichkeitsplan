import useSWR from 'swr'
import { getDashboardSummary } from '@/lib/actions/dashboard'
import type { DashboardSummary } from '@/lib/actions/dashboard'

/**
 * Hook to fetch and cache dashboard summary (KPIs)
 * Called frequently for dashboard display - high cache value
 */
export function useDashboardSummary(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR<DashboardSummary>(
    'dashboard-summary',
    () => getDashboardSummary(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      // Deduplicate for 2 minutes (dashboard is stable)
      dedupingInterval: 120000,
      // Focus throttle: 5 minutes (less critical than transaction data)
      focusThrottleInterval: 300000,
      // Smart comparison
      compare: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    }
  )

  return {
    summary: data || null,
    isLoading,
    error,
    mutate,
    isValidating: isLoading,
  }
}
