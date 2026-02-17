-- Add annual revenue goal to practice_settings
ALTER TABLE public.practice_settings
ADD COLUMN IF NOT EXISTS annual_revenue_goal DECIMAL(10, 2) DEFAULT NULL CHECK (annual_revenue_goal IS NULL OR annual_revenue_goal >= 0);
