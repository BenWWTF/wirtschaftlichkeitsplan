'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Get the authenticated user's ID from Supabase
 * @throws Error if user is not authenticated
 */
export async function getAuthUserId(): Promise<string> {
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
