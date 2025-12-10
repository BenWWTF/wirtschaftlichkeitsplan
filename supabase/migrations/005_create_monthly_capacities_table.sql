-- Table: monthly_capacities
-- Stores custom monthly capacity settings for therapy sessions per week
-- Allows users to override the global max_sessions_per_week setting on a per-month basis
CREATE TABLE IF NOT EXISTS public.monthly_capacities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  max_sessions_per_week INTEGER NOT NULL CHECK (max_sessions_per_week > 0 AND max_sessions_per_week <= 168),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Create index for efficient queries by user and month
CREATE INDEX IF NOT EXISTS idx_monthly_capacities_user_id_month ON public.monthly_capacities(user_id, month DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.monthly_capacities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_capacities
CREATE POLICY "Users can view own monthly capacities"
  ON public.monthly_capacities
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create monthly capacities"
  ON public.monthly_capacities
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own monthly capacities"
  ON public.monthly_capacities
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own monthly capacities"
  ON public.monthly_capacities
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
