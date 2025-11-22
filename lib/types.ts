export type TherapyType = {
  id: string
  user_id: string
  name: string
  price_per_session: number
  created_at: string
  updated_at: string
}

export type MonthlyPlan = {
  id: string
  user_id: string
  therapy_type_id: string
  month: string // YYYY-MM-DD format (first day of month)
  planned_sessions: number
  actual_sessions: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Expense = {
  id: string
  user_id: string
  category: string
  subcategory: string | null
  amount: number
  expense_date: string
  is_recurring: boolean
  recurrence_interval: 'monthly' | 'quarterly' | 'yearly' | null
  description: string | null
  created_at: string
  updated_at: string
}

export type PracticeSettings = {
  id: string
  user_id: string
  practice_name: string
  practice_type: 'kassenarzt' | 'wahlarzt' | 'mixed'
  monthly_fixed_costs: number
  average_variable_cost_per_session: number
  expected_growth_rate: number // as percentage (e.g., 5 for 5%)
  payment_processing_fee_percentage: number // SumUp payment fee percentage (default 1.39)
  created_at: string
  updated_at: string
}

export type MonthlySummary = {
  month: string
  planned_revenue: number
  actual_revenue: number | null
  expenses: number
  net_income: number | null
}

export type BreakEvenAnalysis = {
  therapy_type_id: string
  therapy_type_name: string
  price_per_session: number
  contribution_margin: number
  contribution_margin_percent: number
}

export type AustrianExpenseCategory = {
  category: string
  subcategories: string[]
}

export type ExpenseDocument = {
  id: string
  user_id: string
  expense_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  storage_bucket: string
  extracted_text: string | null
  upload_date: string
  created_at: string
  updated_at: string
}
