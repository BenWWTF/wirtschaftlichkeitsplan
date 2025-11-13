import useSWR from 'swr'
import { getTherapies } from '@/lib/actions/therapies'
import type { TherapyType } from '@/lib/types'

/**
 * Hook to fetch and cache therapy types with request deduplication
 * Reduces duplicate API calls when component re-mounts or re-renders
 */
export function useTherapies(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR<TherapyType[]>(
    userId ? [`therapies-${userId}`] : null,
    () => getTherapies(),
    {
      // Don't revalidate when window regains focus (avoid unnecessary refreshes)
      revalidateOnFocus: false,
      // But revalidate when network reconnects (lost connection)
      revalidateOnReconnect: true,
      // Deduplicate requests for 1 minute
      dedupingInterval: 60000,
      // Don't refetch when switching tabs (focus throttle)
      focusThrottleInterval: 300000, // 5 minutes
      // Keep data in cache for 5 minutes
      compare: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    }
  )

  return {
    therapies: data || [],
    isLoading,
    error,
    mutate, // Manual refresh trigger
    isValidating: isLoading,
  }
}
