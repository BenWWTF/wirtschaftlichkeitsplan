-- Add spread_monthly flag to expenses for annual bills distributed as monthly fixed costs
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS spread_monthly BOOLEAN NOT NULL DEFAULT FALSE;
