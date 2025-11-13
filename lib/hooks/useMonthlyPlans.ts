import useSWR from 'swr'
import { getMonthlyPlans } from '@/lib/actions/monthly-plans'
import type { MonthlyPlan } from '@/lib/types'

/**
 * Hook to fetch and cache monthly plans for a specific month
 * Deduplicates requests for the same month within 1 minute
 */
export function useMonthlyPlans(month?: string) {
  const { data, error, isLoading, mutate } = useSWR<MonthlyPlan[]>(
    month ? [`monthly-plans-${month}`] : null,
    () => month ? getMonthlyPlans(month) : Promise.resolve([]),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      // Deduplicate for 1 minute
      dedupingInterval: 60000,
      // Focus throttle: 5 minutes
      focusThrottleInterval: 300000,
      // Smart comparison
      compare: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    }
  )

  return {
    plans: data || [],
    isLoading,
    error,
    mutate,
    isValidating: isLoading,
  }
}
