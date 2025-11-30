'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SearchResult {
  id: string
  type: 'expense' | 'therapy' | 'document'
  title: string
  description?: string
  date?: string
  amount?: number
  category?: string
}

export interface SearchSuggestion {
  text: string
  type: 'history' | 'category' | 'therapy'
}

/**
 * Global search across expenses, therapies, and documents
 */
export async function globalSearchAction(query: string) {
  const supabase = await createClient()

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    if (!query.trim()) {
      return { data: [] }
    }

    const searchTerm = `%${query}%`
    const results: SearchResult[] = []

    // Search expenses
    try {
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('id, category, description, amount, expense_date')
        .eq('user_id', user.id)
        .or(`description.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .limit(10)

      if (!expenseError && expenses) {
        results.push(
          ...expenses.map((expense) => ({
            id: expense.id,
            type: 'expense' as const,
            title: expense.category || 'Ausgabe',
            description: expense.description || undefined,
            date: expense.expense_date,
            amount: expense.amount,
            category: expense.category,
          }))
        )
      }
    } catch (error) {
      console.error('Error searching expenses:', error)
    }

    // Search therapies
    try {
      const { data: therapies, error: therapyError } = await supabase
        .from('therapies')
        .select('id, name, price_per_session, updated_at')
        .eq('user_id', user.id)
        .ilike('name', searchTerm)
        .limit(10)

      if (!therapyError && therapies) {
        results.push(
          ...therapies.map((therapy) => ({
            id: therapy.id,
            type: 'therapy' as const,
            title: therapy.name,
            date: therapy.updated_at,
            amount: therapy.price_per_session,
          }))
        )
      }
    } catch (error) {
      console.error('Error searching therapies:', error)
    }

    // Search documents
    try {
      const { data: documents, error: docError } = await supabase
        .from('expense_documents')
        .select('id, file_name, extracted_text, upload_date')
        .eq('user_id', user.id)
        .or(`file_name.ilike.${searchTerm},extracted_text.ilike.${searchTerm}`)
        .limit(10)

      if (!docError && documents) {
        results.push(
          ...documents.map((doc) => ({
            id: doc.id,
            type: 'document' as const,
            title: doc.file_name,
            description: doc.extracted_text?.substring(0, 100) || undefined,
            date: doc.upload_date,
          }))
        )
      }
    } catch (error) {
      console.error('Error searching documents:', error)
    }

    // Sort by relevance and date (most recent first)
    results.sort((a, b) => {
      if (!a.date || !b.date) return 0
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return { data: results.slice(0, 20) }
  } catch (error) {
    console.error('Global search error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Suchanfrage fehlgeschlagen' }
  }
}

/**
 * Get search suggestions based on user's data
 */
export async function getSearchSuggestions() {
  const supabase = await createClient()

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    const suggestions: SearchSuggestion[] = []

    // Get unique categories
    try {
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null)
        .limit(5)

      if (!error && expenses) {
        const categories = [...new Set(expenses.map(e => e.category))].slice(0, 3)
        suggestions.push(
          ...categories.map(cat => ({
            text: cat as string,
            type: 'category' as const,
          }))
        )
      }
    } catch (error) {
      console.error('Error getting category suggestions:', error)
    }

    // Get therapy names
    try {
      const { data: therapies, error } = await supabase
        .from('therapies')
        .select('name')
        .eq('user_id', user.id)
        .limit(5)

      if (!error && therapies) {
        suggestions.push(
          ...therapies.map(t => ({
            text: t.name,
            type: 'therapy' as const,
          }))
        )
      }
    } catch (error) {
      console.error('Error getting therapy suggestions:', error)
    }

    return { data: suggestions.slice(0, 10) }
  } catch (error) {
    console.error('Get suggestions error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Abrufen von Vorschlägen' }
  }
}

/**
 * Track search analytics
 */
export async function trackSearchAnalytics(
  query: string,
  resultsCount: number,
  executionTimeMs: number
) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Only insert if user is authenticated
    if (user) {
      await supabase
        .from('search_analytics')
        .insert({
          user_id: user.id,
          query,
          results_count: resultsCount,
          execution_time_ms: executionTimeMs,
        })
        .single()
    }

    return { success: true }
  } catch (error) {
    console.error('Analytics tracking error:', error)
    // Don't throw error for analytics - it's not critical
    return { success: false }
  }
}
