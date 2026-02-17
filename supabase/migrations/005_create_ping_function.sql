-- Keepalive function for GitHub Action to prevent Supabase free tier pausing
CREATE OR REPLACE FUNCTION public.ping()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'pong'::text;
$$;
