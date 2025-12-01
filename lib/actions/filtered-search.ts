'use server'

import { createClient } from '@/utils/supabase/server'
import type { FilterRule } from '@/components/dashboard/advanced-filter'
import type { Expense } from '@/lib/types'
import { buildFilterQuery, validateFilters } from '@/lib/utils/filter-builder'

const PAGE_SIZE = 50

/**
 * Get filtered expenses with pagination and sorting
 */
export async function getFilteredExpenses(
  filters: FilterRule[],
  page: number = 1,
  sortBy: string = 'expense_date',
  sortOrder: 'asc' | 'desc' = 'desc',
  limit: number = PAGE_SIZE
) {
  const supabase = await createClient()

  try {
    // Validate auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Validate filters
    const validation = validateFilters(filters)
    if (!validation.isValid) {
      return { error: validation.errors[0] || 'Ungültige Filter' }
    }

    // Build query
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })

    // Apply filters
    query = buildFilterQuery(query as any, filters, user.id) as any

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Query error:', error)
      return { error: 'Fehler beim Abrufen der Ausgaben' }
    }

    const totalPages = count ? Math.ceil(count / limit) : 0

    return {
      data: data as Expense[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Filtered search error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler bei der gefilterten Suche' }
  }
}

/**
 * Get filtered therapies
 */
export async function getFilteredTherapies(
  filters: FilterRule[],
  page: number = 1,
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  limit: number = PAGE_SIZE
) {
  const supabase = await createClient()

  try {
    // Validate auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Validate filters
    const validation = validateFilters(filters)
    if (!validation.isValid) {
      return { error: validation.errors[0] || 'Ungültige Filter' }
    }

    // Build query
    let query = supabase
      .from('therapies')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    // Manual filter application for therapies since they have different field names
    filters.forEach(filter => {
      if (filter.field === 'therapy_type' && filter.operator === 'contains') {
        query = query.ilike('name', `%${filter.value}%`)
      } else if (filter.field === 'therapy_type' && filter.operator === 'eq') {
        query = query.eq('name', filter.value)
      } else if (filter.field === 'price_range') {
        if (filter.operator === 'between') {
          query = query
            .gte('price_per_session', parseFloat(filter.value))
            .lte('price_per_session', parseFloat(filter.valueEnd))
        } else if (filter.operator === 'gte') {
          query = query.gte('price_per_session', parseFloat(filter.value))
        } else if (filter.operator === 'lte') {
          query = query.lte('price_per_session', parseFloat(filter.value))
        }
      }
    })

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Query error:', error)
      return { error: 'Fehler beim Abrufen der Therapien' }
    }

    const totalPages = count ? Math.ceil(count / limit) : 0

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Filtered search error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler bei der gefilterten Suche' }
  }
}

/**
 * Get filter suggestions based on current data
 */
export async function getFilterValueSuggestions(
  field: string,
  searchTerm: string = '',
  type: 'expenses' | 'therapies' = 'expenses'
) {
  const supabase = await createClient()

  try {
    // Validate auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    if (type === 'expenses') {
      if (field === 'category') {
        const { data, error } = await supabase
          .from('expenses')
          .select('category')
          .eq('user_id', user.id)
          .ilike('category', `%${searchTerm}%`)
          .limit(10)

        if (error) throw error

        const unique = [...new Set((data || []).map(d => d.category).filter(Boolean))]
        return { data: unique }
      }

      if (field === 'description') {
        const { data, error } = await supabase
          .from('expenses')
          .select('description')
          .eq('user_id', user.id)
          .ilike('description', `%${searchTerm}%`)
          .limit(10)

        if (error) throw error

        const unique = [...new Set((data || []).map(d => d.description).filter(Boolean))]
        return { data: unique }
      }
    }

    if (type === 'therapies') {
      if (field === 'therapy_type') {
        const { data, error } = await supabase
          .from('therapies')
          .select('name')
          .eq('user_id', user.id)
          .ilike('name', `%${searchTerm}%`)
          .limit(10)

        if (error) throw error

        return { data: (data || []).map(d => d.name) }
      }
    }

    return { data: [] }
  } catch (error) {
    console.error('Filter suggestions error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Abrufen von Vorschlägen' }
  }
}

/**
 * Track filter usage for analytics
 */
export async function trackFilterUsage(
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
    console.error('Analytics tracking error:', error)
    // Don't throw for analytics
    return { success: false }
  }
}
