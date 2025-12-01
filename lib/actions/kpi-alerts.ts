'use server'

import { createClient } from '@/utils/supabase/server'

export interface KPIAlert {
  id: string
  user_id: string
  metric_name: string
  threshold_value: number
  alert_type: 'below' | 'above'
  notification_channels: {
    inApp: boolean
    email: boolean
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateKPIAlertInput {
  metric_name: string
  threshold_value: number
  alert_type: 'below' | 'above'
  notification_channels?: {
    inApp?: boolean
    email?: boolean
  }
  is_active?: boolean
}

/**
 * Get all KPI alerts for the current user
 */
export async function getKPIAlerts(): Promise<KPIAlert[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('kpi_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getKPIAlerts] Database error:', error)
    throw new Error('Failed to fetch KPI alerts')
  }

  return data || []
}

/**
 * Create a new KPI alert
 */
export async function createKPIAlert(
  input: CreateKPIAlertInput
): Promise<KPIAlert> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('kpi_alerts')
    .insert({
      user_id: user.id,
      metric_name: input.metric_name,
      threshold_value: input.threshold_value,
      alert_type: input.alert_type,
      notification_channels: {
        inApp: input.notification_channels?.inApp ?? true,
        email: input.notification_channels?.email ?? false,
      },
      is_active: input.is_active ?? true,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    console.error('[createKPIAlert] Database error:', error)
    throw new Error('Failed to create KPI alert')
  }

  return data
}

/**
 * Update an existing KPI alert
 */
export async function updateKPIAlert(
  alertId: string,
  updates: Partial<CreateKPIAlertInput>
): Promise<KPIAlert> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (updates.metric_name) updateData.metric_name = updates.metric_name
  if (updates.threshold_value !== undefined) updateData.threshold_value = updates.threshold_value
  if (updates.alert_type) updateData.alert_type = updates.alert_type
  if (updates.notification_channels) {
    updateData.notification_channels = updates.notification_channels
  }
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active

  const { data, error } = await supabase
    .from('kpi_alerts')
    .update(updateData)
    .eq('id', alertId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[updateKPIAlert] Database error:', error)
    throw new Error('Failed to update KPI alert')
  }

  return data
}

/**
 * Delete a KPI alert
 */
export async function deleteKPIAlert(alertId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('kpi_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[deleteKPIAlert] Database error:', error)
    throw new Error('Failed to delete KPI alert')
  }
}

/**
 * Check if an alert should be triggered
 * Returns true if the condition is met
 */
export function shouldTriggerAlert(
  currentValue: number,
  alert: KPIAlert
): boolean {
  if (!alert.is_active) return false

  if (alert.alert_type === 'below') {
    return currentValue < alert.threshold_value
  } else {
    return currentValue > alert.threshold_value
  }
}

/**
 * Check all alerts against current metrics
 */
export async function checkAllAlerts(metrics: Record<string, number>): Promise<KPIAlert[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const alerts = await getKPIAlerts()
  const triggeredAlerts: KPIAlert[] = []

  for (const alert of alerts) {
    const currentValue = metrics[alert.metric_name]
    if (currentValue !== undefined && shouldTriggerAlert(currentValue, alert)) {
      triggeredAlerts.push(alert)
    }
  }

  return triggeredAlerts
}

/**
 * Get alert status for a metric
 * Returns 'critical', 'warning', or 'ok'
 */
export function getAlertStatus(
  currentValue: number,
  alerts: KPIAlert[]
): 'critical' | 'warning' | 'ok' {
  const relevantAlerts = alerts.filter(a => a.is_active)

  for (const alert of relevantAlerts) {
    if (shouldTriggerAlert(currentValue, alert)) {
      return 'critical'
    }
  }

  // Check for warning threshold (90% of critical threshold)
  for (const alert of relevantAlerts) {
    const warningThreshold = alert.threshold_value * 0.9
    if (alert.alert_type === 'below' && currentValue < warningThreshold) {
      return 'warning'
    }
    if (alert.alert_type === 'above' && currentValue > alert.threshold_value * 1.1) {
      return 'warning'
    }
  }

  return 'ok'
}
