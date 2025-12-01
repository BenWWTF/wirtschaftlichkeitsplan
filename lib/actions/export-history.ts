'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ExportHistoryItem {
  id: string
  export_type: string
  export_format: string
  file_name: string
  file_size?: number
  file_path?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  sent_via_email: boolean
  email_recipients?: string[]
  created_at: string
  expires_at: string
  period_start?: string
  period_end?: string
  record_count?: number
}

/**
 * Get export history for current user
 */
export async function getExportHistory(
  limit: number = 10,
  offset: number = 0
): Promise<{ data: ExportHistoryItem[]; total?: number; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: [], error: 'Authentication required' }
    }

    const { data, error, count } = await supabase
      .from('export_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [], total: count || 0 }
  } catch (error) {
    console.error('Error fetching export history:', error)
    return { data: [], error: 'Failed to fetch export history' }
  }
}

/**
 * Get single export history item
 */
export async function getExportHistoryItem(itemId: string): Promise<{ data?: ExportHistoryItem; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('export_history')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    console.error('Error fetching export history item:', error)
    return { error: 'Failed to fetch export history item' }
  }
}

/**
 * Create export history entry
 */
export async function createExportHistoryEntry(
  data: Omit<ExportHistoryItem, 'id' | 'created_at'>
): Promise<{ data?: ExportHistoryItem; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const { data: result, error } = await supabase
      .from('export_history')
      .insert([
        {
          user_id: user.id,
          ...data
        }
      ])
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { data: result }
  } catch (error) {
    console.error('Error creating export history entry:', error)
    return { error: 'Failed to create export history entry' }
  }
}

/**
 * Delete export history entry
 */
export async function deleteExportHistoryEntry(itemId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error } = await supabase
      .from('export_history')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting export history entry:', error)
    return { success: false, error: 'Failed to delete export history entry' }
  }
}

/**
 * Update export history entry status
 */
export async function updateExportHistoryStatus(
  itemId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const updateData: any = { status }
    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { error } = await supabase
      .from('export_history')
      .update(updateData)
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error updating export history status:', error)
    return { success: false, error: 'Failed to update export history status' }
  }
}

/**
 * Archive old exports
 */
export async function archiveOldExports(): Promise<{ success: boolean; archivedCount?: number; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Archive exports past their expiration date
    const { error } = await supabase
      .from('export_history')
      .update({ archived: true })
      .eq('user_id', user.id)
      .lt('expires_at', new Date().toISOString())
      .eq('archived', false)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error archiving old exports:', error)
    return { success: false, error: 'Failed to archive old exports' }
  }
}

/**
 * Get export history statistics
 */
export async function getExportHistoryStats(): Promise<{
  totalExports?: number
  completedExports?: number
  failedExports?: number
  totalSize?: number
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('export_history')
      .select('status, file_size', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('archived', false)

    if (error) {
      return { error: error.message }
    }

    const stats = {
      totalExports: data?.length || 0,
      completedExports: data?.filter(d => d.status === 'completed').length || 0,
      failedExports: data?.filter(d => d.status === 'failed').length || 0,
      totalSize: data?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0
    }

    return stats
  } catch (error) {
    console.error('Error getting export history stats:', error)
    return { error: 'Failed to get export history stats' }
  }
}

/**
 * Get exports by type
 */
export async function getExportsByType(
  exportType: string,
  limit: number = 10
): Promise<{ data: ExportHistoryItem[]; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: [], error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('export_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('export_type', exportType)
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Error getting exports by type:', error)
    return { data: [], error: 'Failed to get exports by type' }
  }
}

/**
 * Get exports by date range
 */
export async function getExportsByDateRange(
  startDate: Date,
  endDate: Date,
  limit: number = 50
): Promise<{ data: ExportHistoryItem[]; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: [], error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('export_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Error getting exports by date range:', error)
    return { data: [], error: 'Failed to get exports by date range' }
  }
}

/**
 * Clean up expired exports
 */
export async function cleanupExpiredExports(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Delete archived exports that are past 60 days
    const thirtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    const { error } = await supabase
      .from('export_history')
      .delete()
      .eq('user_id', user.id)
      .eq('archived', true)
      .lt('expires_at', thirtyDaysAgo.toISOString())

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error cleaning up expired exports:', error)
    return { success: false, error: 'Failed to cleanup expired exports' }
  }
}
