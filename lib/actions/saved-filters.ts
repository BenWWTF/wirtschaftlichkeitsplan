'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FilterRule } from '@/components/dashboard/advanced-filter'

export interface SavedFilterInput {
  name: string
  collection?: string
  filters: FilterRule[]
  pageType: 'expenses' | 'therapies' | 'results'
  isDefault?: boolean
}

export interface SavedFilter extends SavedFilterInput {
  id: string
  createdAt: string
  updatedAt: string
}

/**
 * Get all saved filters for a user and page type
 */
export async function getSavedFilters(pageType: 'expenses' | 'therapies' | 'results') {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', user.id)
      .eq('page_type', pageType)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { error: 'Fehler beim Laden der Filter' }
    }

    return {
      data: (data || []).map(f => ({
        id: f.id,
        name: f.name,
        collection: f.collection,
        filters: f.filter_criteria as FilterRule[],
        pageType: f.page_type,
        isDefault: f.is_default,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })),
    }
  } catch (error) {
    console.error('Get saved filters error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Laden der Filter' }
  }
}

/**
 * Create a new saved filter
 */
export async function createSavedFilter(input: SavedFilterInput) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Check if filter with same name already exists
    const { data: existing } = await supabase
      .from('saved_filters')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', input.name)
      .single()

    if (existing) {
      return { error: 'Ein Filter mit diesem Namen existiert bereits' }
    }

    const { data, error } = await supabase
      .from('saved_filters')
      .insert({
        user_id: user.id,
        name: input.name,
        collection: input.collection || null,
        filter_criteria: input.filters,
        page_type: input.pageType,
        is_default: input.isDefault || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { error: `Fehler: ${error.message || 'Speichern fehlgeschlagen'}` }
    }

    if (!data) {
      return { error: 'Filter konnte nicht erstellt werden' }
    }

    revalidatePath('/dashboard')

    return {
      data: {
        id: data.id,
        name: data.name,
        collection: data.collection,
        filters: data.filter_criteria as FilterRule[],
        pageType: data.page_type,
        isDefault: data.is_default,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }
  } catch (error) {
    console.error('Create saved filter error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Erstellen des Filters' }
  }
}

/**
 * Update a saved filter
 */
export async function updateSavedFilter(
  filterId: string,
  input: Partial<SavedFilterInput>
) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('saved_filters')
      .select('user_id')
      .eq('id', filterId)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return { error: 'Sie haben keine Berechtigung für diesen Filter' }
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name) updateData.name = input.name
    if (input.collection !== undefined) updateData.collection = input.collection || null
    if (input.filters) updateData.filter_criteria = input.filters
    if (input.isDefault !== undefined) updateData.is_default = input.isDefault

    const { data, error } = await supabase
      .from('saved_filters')
      .update(updateData)
      .eq('id', filterId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { error: `Fehler: ${error.message || 'Update fehlgeschlagen'}` }
    }

    if (!data) {
      return { error: 'Filter konnte nicht aktualisiert werden' }
    }

    revalidatePath('/dashboard')

    return {
      data: {
        id: data.id,
        name: data.name,
        collection: data.collection,
        filters: data.filter_criteria as FilterRule[],
        pageType: data.page_type,
        isDefault: data.is_default,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }
  } catch (error) {
    console.error('Update saved filter error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Aktualisieren des Filters' }
  }
}

/**
 * Delete a saved filter
 */
export async function deleteSavedFilter(filterId: string) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('saved_filters')
      .select('user_id')
      .eq('id', filterId)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return { error: 'Sie haben keine Berechtigung für diesen Filter' }
    }

    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', filterId)

    if (error) {
      console.error('Database error:', error)
      return { error: `Fehler: ${error.message || 'Löschen fehlgeschlagen'}` }
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Delete saved filter error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Löschen des Filters' }
  }
}

/**
 * Set a filter as the default for a page type
 */
export async function setDefaultFilter(filterId: string) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Get the filter to find its page type
    const { data: filter } = await supabase
      .from('saved_filters')
      .select('page_type, user_id')
      .eq('id', filterId)
      .single()

    if (!filter || filter.user_id !== user.id) {
      return { error: 'Sie haben keine Berechtigung für diesen Filter' }
    }

    // First, unset all default filters for this page type
    await supabase
      .from('saved_filters')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('page_type', filter.page_type)

    // Then set this one as default
    const { data, error } = await supabase
      .from('saved_filters')
      .update({ is_default: true })
      .eq('id', filterId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { error: `Fehler: ${error.message || 'Update fehlgeschlagen'}` }
    }

    revalidatePath('/dashboard')

    return {
      data: {
        id: data.id,
        name: data.name,
        collection: data.collection,
        filters: data.filter_criteria as FilterRule[],
        pageType: data.page_type,
        isDefault: data.is_default,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }
  } catch (error) {
    console.error('Set default filter error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Setzen des Standard-Filters' }
  }
}

/**
 * Get the default filter for a page type
 */
export async function getDefaultFilter(pageType: 'expenses' | 'therapies' | 'results') {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null }
    }

    const { data } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', user.id)
      .eq('page_type', pageType)
      .eq('is_default', true)
      .single()

    if (!data) {
      return { data: null }
    }

    return {
      data: {
        id: data.id,
        name: data.name,
        collection: data.collection,
        filters: data.filter_criteria as FilterRule[],
        pageType: data.page_type,
        isDefault: data.is_default,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }
  } catch (error) {
    console.error('Get default filter error:', error)
    return { data: null }
  }
}
