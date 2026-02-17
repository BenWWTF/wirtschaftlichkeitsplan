'use server'

/**
 * Historical Metrics
 * Fetches monthly snapshots for sparkline trend visualizations
 */

import { createClient } from '@/utils/supabase/server'
import { calculateAustrianTax } from '@/lib/utils/austrian-tax'

export interface MonthlySnapshot {
  month: string // YYYY-MM
  totalRevenue: number
  totalNetRevenue: number
  totalSessions: number
  averageSessionPrice: number
  netIncome: number
}

/**
 * Fetch historical monthly snapshots for the last N months
 * Used to power sparkline trend indicators on KPI cards
 */
export async function getHistoricalSnapshots(months: number = 6): Promise<MonthlySnapshot[]> {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const userId = user.id

  // Calculate the start date (N months back from the first day of the current month)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const startDate = new Date(currentYear, currentMonth - months, 1)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // End of current month

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  // Fetch practice settings for fee percentage
  const { data: settings } = await supabase
    .from('practice_settings')
    .select('payment_processing_fee_percentage, practice_type')
    .eq('user_id', userId)
    .single()

  const feePercentage = settings?.payment_processing_fee_percentage ?? 1.39
  const practiceType = (settings?.practice_type as 'kassenarzt' | 'wahlarzt' | 'mixed') || 'wahlarzt'

  // Fetch therapy types
  const { data: therapies } = await supabase
    .from('therapy_types')
    .select('id, price_per_session')
    .eq('user_id', userId)

  const therapyPriceMap = new Map<string, number>(
    therapies?.map((t: any) => [t.id, t.price_per_session]) || []
  )

  // Fetch monthly plans for the period
  const { data: plans } = await supabase
    .from('monthly_plans')
    .select('therapy_type_id, month, planned_sessions, actual_sessions')
    .eq('user_id', userId)
    .gte('month', startStr)
    .lte('month', endStr)

  // Fetch expenses (recurring + one-time in range)
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_date, is_recurring, recurrence_interval, spread_monthly')
    .eq('user_id', userId)
    .or(`is_recurring.eq.true,and(is_recurring.eq.false,expense_date.gte.${startStr},expense_date.lte.${endStr})`)

  // Build month keys for the range
  const monthKeys: string[] = []
  const d = new Date(startDate)
  while (d <= endDate) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthKeys.push(key)
    d.setMonth(d.getMonth() + 1)
  }

  // Aggregate sessions and revenue per month
  const monthlyRevenue = new Map<string, number>()
  const monthlySessions = new Map<string, number>()
  const monthlySessionsByTherapy = new Map<string, Map<string, { sessions: number; price: number }>>()

  monthKeys.forEach((key) => {
    monthlyRevenue.set(key, 0)
    monthlySessions.set(key, 0)
    monthlySessionsByTherapy.set(key, new Map())
  })

  plans?.forEach((plan: any) => {
    // plan.month is in YYYY-MM-DD format (first of month)
    const monthDate = new Date(plan.month)
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyRevenue.has(key)) return

    const sessions = plan.actual_sessions ?? plan.planned_sessions ?? 0
    const price = therapyPriceMap.get(plan.therapy_type_id) || 0
    const revenue = sessions * price

    monthlyRevenue.set(key, (monthlyRevenue.get(key) || 0) + revenue)
    monthlySessions.set(key, (monthlySessions.get(key) || 0) + sessions)

    // Track per-therapy for average price calculation
    const therapyMap = monthlySessionsByTherapy.get(key)!
    const existing = therapyMap.get(plan.therapy_type_id) || { sessions: 0, price }
    existing.sessions += sessions
    therapyMap.set(plan.therapy_type_id, existing)
  })

  // Calculate monthly expenses (handle recurring)
  const monthlyExpenses = new Map<string, number>()
  monthKeys.forEach((key) => monthlyExpenses.set(key, 0))

  expenses?.forEach((expense: any) => {
    const amount = expense.amount || 0

    if (!expense.is_recurring) {
      // One-time: add to the specific month
      const expDate = new Date(expense.expense_date)
      const key = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`
      if (monthlyExpenses.has(key)) {
        monthlyExpenses.set(key, (monthlyExpenses.get(key) || 0) + amount)
      }
      return
    }

    // Recurring: distribute across all months in range
    monthKeys.forEach((key) => {
      let monthAmount = 0
      switch (expense.recurrence_interval) {
        case 'daily':
          monthAmount = amount * 30.44
          break
        case 'weekly':
          monthAmount = amount * 4.34
          break
        case 'monthly':
          monthAmount = amount
          break
        case 'quarterly':
          // If spread_monthly, always use monthly equivalent (amount/3)
          monthAmount = amount / 3
          break
        case 'yearly':
        case 'annual':
          // Always spread yearly to monthly (amount/12)
          monthAmount = amount / 12
          break
        default:
          monthAmount = amount
      }
      monthlyExpenses.set(key, (monthlyExpenses.get(key) || 0) + monthAmount)
    })
  })

  // Build snapshots
  const snapshots: MonthlySnapshot[] = monthKeys.map((key) => {
    const totalRevenue = monthlyRevenue.get(key) || 0
    const totalSessions = monthlySessions.get(key) || 0
    const totalPaymentFees = totalRevenue * (feePercentage / 100)
    const totalNetRevenue = totalRevenue - totalPaymentFees
    const totalExpensesForMonth = monthlyExpenses.get(key) || 0

    // Calculate average session price for this month
    const therapyMap = monthlySessionsByTherapy.get(key)!
    let weightedSum = 0
    let totalSessionCount = 0
    therapyMap.forEach(({ sessions, price }) => {
      weightedSum += sessions * price
      totalSessionCount += sessions
    })
    const averageSessionPrice = totalSessionCount > 0 ? weightedSum / totalSessionCount : 0

    // Calculate net income (simplified, using Austrian tax)
    const taxResult = calculateAustrianTax({
      grossRevenue: totalNetRevenue,
      totalExpenses: totalExpensesForMonth,
      practiceType: practiceType,
      applyingPauschalierung: totalNetRevenue < 220000,
      monthsInPeriod: 1
    })

    return {
      month: key,
      totalRevenue,
      totalNetRevenue,
      totalSessions,
      averageSessionPrice,
      netIncome: taxResult.netIncome
    }
  })

  return snapshots
}
