-- Add max_sessions_per_week column to practice_settings table
ALTER TABLE public.practice_settings
ADD COLUMN max_sessions_per_week INTEGER DEFAULT 30 CHECK (max_sessions_per_week > 0);

-- Create comment for clarity
COMMENT ON COLUMN public.practice_settings.max_sessions_per_week IS 'Maximum number of therapy sessions per week that the practice can handle (capacity planning)';
