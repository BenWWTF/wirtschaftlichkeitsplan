import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using service role key
 * This bypasses RLS and is used for trusted server operations
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
