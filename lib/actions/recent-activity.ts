'use server'

import { createClient } from '@/utils/supabase/server'

export interface ActivityItem {
  id: string
  type: 'expense' | 'plan' | 'therapy'
  label: string
  detail?: string
  timestamp: string // ISO string
}

/**
 * Fetches recent activity by combining the latest records
 * from expenses, monthly_plans, and therapy_types.
 * Returns up to `limit` items sorted by most recent first.
 */
export async function getRecentActivity(limit: number = 8): Promise<ActivityItem[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return []

  const activities: ActivityItem[] = []

  // Fetch recent expenses (use expense_date as fallback timestamp)
  try {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, description, amount, expense_date, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (expenses) {
      for (const e of expenses) {
        activities.push({
          id: `expense-${e.id}`,
          type: 'expense',
          label: 'Ausgabe erfasst',
          detail: e.description
            ? `${e.description} (${Number(e.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })})`
            : Number(e.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
          timestamp: e.created_at || e.expense_date,
        })
      }
    }
  } catch {
    // Table may have different schema; skip gracefully
  }

  // Fetch recent monthly plan updates
  try {
    const { data: plans } = await supabase
      .from('monthly_plans')
      .select('id, month, planned_sessions, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (plans) {
      for (const p of plans) {
        const monthStr = typeof p.month === 'string' ? p.month.substring(0, 7) : ''
        activities.push({
          id: `plan-${p.id}`,
          type: 'plan',
          label: 'Planung aktualisiert',
          detail: monthStr ? `${p.planned_sessions} Sitzungen (${monthStr})` : `${p.planned_sessions} Sitzungen`,
          timestamp: p.updated_at,
        })
      }
    }
  } catch {
    // Skip gracefully
  }

  // Fetch recent therapy type changes
  try {
    const { data: therapies } = await supabase
      .from('therapy_types')
      .select('id, name, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(3)

    if (therapies) {
      for (const t of therapies) {
        activities.push({
          id: `therapy-${t.id}`,
          type: 'therapy',
          label: 'Therapieart aktualisiert',
          detail: t.name,
          timestamp: t.updated_at,
        })
      }
    }
  } catch {
    // Skip gracefully
  }

  // Sort all by timestamp descending, take top N
  return activities
    .filter((a) => a.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}
