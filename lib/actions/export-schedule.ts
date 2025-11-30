'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ExportSchedule {
  id: string
  name: string
  description?: string
  schedule_type: 'daily' | 'weekly' | 'monthly'
  schedule_time: string
  schedule_day?: number
  schedule_date?: number
  selected_reports: string[]
  export_format: 'pdf' | 'xlsx' | 'csv'
  include_in_email: boolean
  email_recipients: string[]
  storage_location: 'local' | 'cloud'
  is_active: boolean
  last_exported_at?: string
  next_export_at?: string
  export_count: number
  failed_count: number
  created_at: string
  updated_at: string
}

/**
 * Get all export schedules for current user
 */
export async function getExportSchedules(): Promise<{ data: ExportSchedule[]; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: [], error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('export_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Error fetching export schedules:', error)
    return { data: [], error: 'Failed to fetch schedules' }
  }
}

/**
 * Get single export schedule by ID
 */
export async function getExportSchedule(scheduleId: string): Promise<{ data?: ExportSchedule; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('export_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    console.error('Error fetching export schedule:', error)
    return { error: 'Failed to fetch schedule' }
  }
}

/**
 * Create new export schedule
 */
export async function createExportSchedule(
  schedule: Omit<ExportSchedule, 'id' | 'created_at' | 'updated_at' | 'last_exported_at' | 'export_count' | 'failed_count'>
): Promise<{ data?: ExportSchedule; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Calculate next export time
    const nextExportAt = calculateNextExportTime(
      schedule.schedule_type,
      schedule.schedule_time,
      schedule.schedule_day,
      schedule.schedule_date
    )

    const { data, error } = await supabase
      .from('export_schedules')
      .insert([
        {
          user_id: user.id,
          ...schedule,
          next_export_at: nextExportAt,
          export_count: 0,
          failed_count: 0
        }
      ])
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { data }
  } catch (error) {
    console.error('Error creating export schedule:', error)
    return { error: 'Failed to create schedule' }
  }
}

/**
 * Update export schedule
 */
export async function updateExportSchedule(
  scheduleId: string,
  updates: Partial<ExportSchedule>
): Promise<{ data?: ExportSchedule; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Recalculate next export time if schedule changed
    const nextExportAt =
      updates.schedule_type ||
      updates.schedule_time ||
      updates.schedule_day ||
      updates.schedule_date
        ? calculateNextExportTime(
            updates.schedule_type,
            updates.schedule_time,
            updates.schedule_day,
            updates.schedule_date
          )
        : undefined

    const updateData = {
      ...updates,
      ...(nextExportAt && { next_export_at: nextExportAt })
    }

    const { data, error } = await supabase
      .from('export_schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { data }
  } catch (error) {
    console.error('Error updating export schedule:', error)
    return { error: 'Failed to update schedule' }
  }
}

/**
 * Delete export schedule
 */
export async function deleteExportSchedule(scheduleId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error } = await supabase
      .from('export_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting export schedule:', error)
    return { success: false, error: 'Failed to delete schedule' }
  }
}

/**
 * Toggle schedule active status
 */
export async function toggleExportScheduleActive(
  scheduleId: string,
  isActive: boolean
): Promise<{ data?: ExportSchedule; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('export_schedules')
      .update({ is_active: isActive })
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { data }
  } catch (error) {
    console.error('Error toggling schedule:', error)
    return { error: 'Failed to toggle schedule' }
  }
}

/**
 * Calculate next export time based on schedule
 */
function calculateNextExportTime(
  scheduleType: 'daily' | 'weekly' | 'monthly',
  scheduleTime: string,
  scheduleDay?: number,
  scheduleDate?: number
): Date {
  const now = new Date()
  const [hours, minutes] = scheduleTime.split(':').map(Number)

  let nextExport = new Date(now)
  nextExport.setHours(hours, minutes, 0, 0)

  if (scheduleType === 'daily') {
    // If scheduled time has passed today, schedule for tomorrow
    if (nextExport <= now) {
      nextExport.setDate(nextExport.getDate() + 1)
    }
  } else if (scheduleType === 'weekly') {
    const targetDay = scheduleDay ?? 0 // Default to Sunday
    const currentDay = nextExport.getDay()

    // Calculate days until target day
    let daysUntilTarget = (targetDay - currentDay + 7) % 7
    if (daysUntilTarget === 0 && nextExport <= now) {
      daysUntilTarget = 7
    } else if (daysUntilTarget === 0) {
      daysUntilTarget = 0
    }

    nextExport.setDate(nextExport.getDate() + daysUntilTarget)
  } else if (scheduleType === 'monthly') {
    const targetDate = scheduleDate ?? 1
    nextExport.setDate(targetDate)

    // If target date has passed this month, move to next month
    if (nextExport <= now) {
      nextExport.setMonth(nextExport.getMonth() + 1)
    }
  }

  return nextExport
}

/**
 * Mark schedule as executed
 */
export async function markScheduleExecuted(
  scheduleId: string,
  success: boolean,
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: schedule, error: fetchError } = await supabase
      .from('export_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !schedule) {
      return { success: false, error: 'Schedule not found' }
    }

    // Calculate next export time
    const nextExportAt = calculateNextExportTime(
      schedule.schedule_type,
      schedule.schedule_time,
      schedule.schedule_day,
      schedule.schedule_date
    )

    const updateData = {
      last_exported_at: new Date().toISOString(),
      next_export_at: nextExportAt.toISOString(),
      export_count: success ? schedule.export_count + 1 : schedule.export_count,
      failed_count: !success ? schedule.failed_count + 1 : schedule.failed_count,
      ...(errorMessage && { last_error: errorMessage })
    }

    const { error } = await supabase
      .from('export_schedules')
      .update(updateData)
      .eq('id', scheduleId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking schedule executed:', error)
    return { success: false, error: 'Failed to mark schedule as executed' }
  }
}

/**
 * Get schedules due for execution
 */
export async function getSchedulesDueForExecution(): Promise<{ data: ExportSchedule[]; error?: string }> {
  const supabase = await createClient()

  try {
    const now = new Date()

    const { data, error } = await supabase
      .from('export_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_export_at', now.toISOString())
      .order('next_export_at', { ascending: true })

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Error fetching schedules due for execution:', error)
    return { data: [], error: 'Failed to fetch schedules' }
  }
}

/**
 * Validate export schedule
 */
export function validateExportSchedule(schedule: Partial<ExportSchedule>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!schedule.name || schedule.name.trim().length === 0) {
    errors.push('Schedule name is required')
  }

  if (!schedule.schedule_type || !['daily', 'weekly', 'monthly'].includes(schedule.schedule_type)) {
    errors.push('Invalid schedule type')
  }

  if (!schedule.schedule_time || !/^\d{2}:\d{2}$/.test(schedule.schedule_time)) {
    errors.push('Invalid schedule time format (HH:MM required)')
  }

  if (schedule.schedule_type === 'weekly' && (schedule.schedule_day === undefined || schedule.schedule_day < 0 || schedule.schedule_day > 6)) {
    errors.push('Invalid schedule day (0-6 required for weekly schedules)')
  }

  if (schedule.schedule_type === 'monthly' && (schedule.schedule_date === undefined || schedule.schedule_date < 1 || schedule.schedule_date > 31)) {
    errors.push('Invalid schedule date (1-31 required for monthly schedules)')
  }

  if (!schedule.selected_reports || schedule.selected_reports.length === 0) {
    errors.push('At least one report must be selected')
  }

  if (!schedule.export_format || !['pdf', 'xlsx', 'csv'].includes(schedule.export_format)) {
    errors.push('Invalid export format')
  }

  if (schedule.include_in_email && (!schedule.email_recipients || schedule.email_recipients.length === 0)) {
    errors.push('Email recipients required when email delivery is enabled')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
