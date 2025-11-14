'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Get the authenticated user's ID from Supabase
 * In development with DEMO_MODE enabled, returns demo user ID
 * @throws Error if user is not authenticated
 */
export async function getAuthUserId(): Promise<string> {
  // Development/Testing: Support demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && process.env.NEXT_PUBLIC_DEMO_USER_ID) {
    return process.env.NEXT_PUBLIC_DEMO_USER_ID
  }

  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error fetching authenticated user:', error)
    throw new Error('Failed to get user authentication status')
  }

  if (!user || !user.id) {
    throw new Error('User is not authenticated')
  }

  return user.id
}
