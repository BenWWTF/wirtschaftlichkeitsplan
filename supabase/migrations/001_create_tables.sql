-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: therapy_types
-- Stores all therapy types with pricing information
CREATE TABLE IF NOT EXISTS public.therapy_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_per_session DECIMAL(10, 2) NOT NULL CHECK (price_per_session > 0),
  variable_cost_per_session DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (variable_cost_per_session >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: monthly_plans
-- Stores planned and actual sessions per therapy type per month
CREATE TABLE IF NOT EXISTS public.monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapy_type_id UUID NOT NULL REFERENCES public.therapy_types(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  planned_sessions INTEGER NOT NULL CHECK (planned_sessions > 0),
  actual_sessions INTEGER CHECK (actual_sessions >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, therapy_type_id, month)
);

-- Table: expenses
-- Stores all practice expenses categorized by Austrian accounting standards
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('monthly', 'quarterly', 'yearly')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: practice_settings
-- Stores user's practice configuration and financial assumptions
CREATE TABLE IF NOT EXISTS public.practice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_name TEXT NOT NULL,
  practice_type TEXT NOT NULL DEFAULT 'mixed' CHECK (practice_type IN ('kassenarzt', 'wahlarzt', 'mixed')),
  monthly_fixed_costs DECIMAL(10, 2) NOT NULL DEFAULT 8000 CHECK (monthly_fixed_costs >= 0),
  average_variable_cost_per_session DECIMAL(10, 2) NOT NULL DEFAULT 20 CHECK (average_variable_cost_per_session >= 0),
  expected_growth_rate DECIMAL(5, 2) NOT NULL DEFAULT 5 CHECK (expected_growth_rate >= -100 AND expected_growth_rate <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_therapy_types_user_id ON public.therapy_types(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_user_id_month ON public.monthly_plans(user_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_therapy_type_id ON public.monthly_plans(therapy_type_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_date ON public.expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(user_id, category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.therapy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for therapy_types
CREATE POLICY "Users can view own therapy types"
  ON public.therapy_types
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create therapy types"
  ON public.therapy_types
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own therapy types"
  ON public.therapy_types
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own therapy types"
  ON public.therapy_types
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- RLS Policies for monthly_plans
CREATE POLICY "Users can view own monthly plans"
  ON public.monthly_plans
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create monthly plans"
  ON public.monthly_plans
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own monthly plans"
  ON public.monthly_plans
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own monthly plans"
  ON public.monthly_plans
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses"
  ON public.expenses
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- RLS Policies for practice_settings
CREATE POLICY "Users can view own practice settings"
  ON public.practice_settings
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create practice settings"
  ON public.practice_settings
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own practice settings"
  ON public.practice_settings
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- PostgreSQL Functions for common queries
-- Get monthly summary (revenue, expenses, net income)
CREATE OR REPLACE FUNCTION get_monthly_summary(user_id_param UUID, year_param INTEGER DEFAULT NULL)
RETURNS TABLE(
  month TEXT,
  therapy_type TEXT,
  planned_sessions INTEGER,
  price_per_session DECIMAL,
  planned_revenue DECIMAL,
  actual_sessions INTEGER,
  actual_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(mp.month, 'YYYY-MM-DD')::TEXT as month,
    tt.name as therapy_type,
    mp.planned_sessions,
    tt.price_per_session,
    (mp.planned_sessions * tt.price_per_session) as planned_revenue,
    mp.actual_sessions,
    CASE
      WHEN mp.actual_sessions IS NOT NULL
      THEN (mp.actual_sessions * tt.price_per_session)
      ELSE NULL
    END as actual_revenue
  FROM public.monthly_plans mp
  JOIN public.therapy_types tt ON mp.therapy_type_id = tt.id
  WHERE mp.user_id = user_id_param
    AND (year_param IS NULL OR EXTRACT(YEAR FROM mp.month) = year_param)
  ORDER BY mp.month DESC, tt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get monthly expenses by category
CREATE OR REPLACE FUNCTION get_monthly_expenses(user_id_param UUID, month_param DATE DEFAULT NULL)
RETURNS TABLE(
  category TEXT,
  subcategory TEXT,
  total_amount DECIMAL,
  is_recurring BOOLEAN,
  expense_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.category,
    e.subcategory,
    SUM(e.amount) as total_amount,
    e.is_recurring,
    COUNT(e.id)::INTEGER as expense_count
  FROM public.expenses e
  WHERE e.user_id = user_id_param
    AND (month_param IS NULL OR DATE_TRUNC('month', e.expense_date)::DATE = DATE_TRUNC('month', month_param)::DATE)
  GROUP BY e.category, e.subcategory, e.is_recurring
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total revenue for a specific month
CREATE OR REPLACE FUNCTION get_monthly_total_revenue(user_id_param UUID, month_param DATE)
RETURNS DECIMAL AS $$
DECLARE
  total_revenue DECIMAL;
BEGIN
  SELECT COALESCE(SUM(mp.planned_sessions * tt.price_per_session), 0)
  INTO total_revenue
  FROM public.monthly_plans mp
  JOIN public.therapy_types tt ON mp.therapy_type_id = tt.id
  WHERE mp.user_id = user_id_param
    AND mp.month = DATE_TRUNC('month', month_param)::DATE;

  RETURN total_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total expenses for a specific month
CREATE OR REPLACE FUNCTION get_monthly_total_expenses(user_id_param UUID, month_param DATE)
RETURNS DECIMAL AS $$
DECLARE
  total_expenses DECIMAL;
BEGIN
  SELECT COALESCE(SUM(e.amount), 0)
  INTO total_expenses
  FROM public.expenses e
  WHERE e.user_id = user_id_param
    AND DATE_TRUNC('month', e.expense_date)::DATE = DATE_TRUNC('month', month_param)::DATE;

  RETURN total_expenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
