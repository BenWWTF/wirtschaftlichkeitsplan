import useSWR from 'swr'
import { getExpenses } from '@/lib/actions/expenses'
import type { Expense } from '@/lib/types'

/**
 * Hook to fetch and cache expenses with optional month filtering
 * Deduplicates requests for the same month within 1 minute
 */
export function useExpenses(userId?: string, month?: string) {
  const { data, error, isLoading, mutate } = useSWR<Expense[]>(
    userId && month ? [`expenses-${userId}-${month}`] : null,
    () => getExpenses(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      // Deduplicate for 1 minute
      dedupingInterval: 60000,
      // Focus throttle: 5 minutes
      focusThrottleInterval: 300000,
      // Smart comparison to avoid unnecessary rerenders
      compare: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    }
  )

  // Filter by month if provided
  const filteredExpenses = month && data
    ? data.filter(exp => exp.expense_date?.substring(0, 7) === month)
    : data || []

  return {
    expenses: filteredExpenses,
    isLoading,
    error,
    mutate,
    isValidating: isLoading,
  }
}
