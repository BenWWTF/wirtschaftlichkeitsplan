-- Migration: Create Tax Scenarios Table
-- Description: Creates the tax_scenarios table for storing comprehensive tax calculations
-- Created: 2024

-- Create the tax_scenarios table
CREATE TABLE IF NOT EXISTS public.tax_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  description TEXT,

  -- Input data (complete tax input)
  input_data JSONB NOT NULL,

  -- Result data (complete calculation result)
  result_data JSONB NOT NULL,

  -- Indexed columns for filtering and searching
  tax_year INTEGER NOT NULL,
  total_gross_income DECIMAL(12, 2),
  total_net_income DECIMAL(12, 2),
  total_tax_burden DECIMAL(12, 2),
  burden_percentage DECIMAL(5, 2),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_gross_income CHECK (total_gross_income >= 0),
  CONSTRAINT positive_net_income CHECK (total_net_income >= 0),
  CONSTRAINT valid_burden_percentage CHECK (burden_percentage >= 0 AND burden_percentage <= 100)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tax_scenarios_user_id ON public.tax_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_scenarios_user_year ON public.tax_scenarios(user_id, tax_year DESC);
CREATE INDEX IF NOT EXISTS idx_tax_scenarios_created_at ON public.tax_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tax_scenarios_name ON public.tax_scenarios USING GIN (
  to_tsvector('german', scenario_name)
);

-- Create a view for user scenario summaries
CREATE OR REPLACE VIEW public.tax_scenario_summaries AS
SELECT
  ts.id,
  ts.user_id,
  ts.scenario_name,
  ts.tax_year,
  ts.total_gross_income,
  ts.total_net_income,
  ts.total_tax_burden,
  ts.burden_percentage,
  ts.created_at,
  ts.updated_at
FROM public.tax_scenarios ts
ORDER BY ts.created_at DESC;

-- Enable Row Level Security (RLS)
ALTER TABLE public.tax_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own scenarios
CREATE POLICY "Users can view own scenarios"
  ON public.tax_scenarios
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- RLS Policy: Users can only insert their own scenarios
CREATE POLICY "Users can insert own scenarios"
  ON public.tax_scenarios
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- RLS Policy: Users can only update their own scenarios
CREATE POLICY "Users can update own scenarios"
  ON public.tax_scenarios
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS Policy: Users can only delete their own scenarios
CREATE POLICY "Users can delete own scenarios"
  ON public.tax_scenarios
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tax_scenario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_tax_scenarios_updated_at
BEFORE UPDATE ON public.tax_scenarios
FOR EACH ROW
EXECUTE FUNCTION update_tax_scenario_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_scenarios TO authenticated;
GRANT SELECT ON public.tax_scenario_summaries TO authenticated;

-- Create audit log table (optional - for tracking changes)
CREATE TABLE IF NOT EXISTS public.tax_scenario_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES public.tax_scenarios(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_scenario ON public.tax_scenario_audit_log(scenario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.tax_scenario_audit_log(user_id);

-- Grant audit log permissions
GRANT INSERT ON public.tax_scenario_audit_log TO authenticated;
GRANT SELECT ON public.tax_scenario_audit_log TO authenticated;
