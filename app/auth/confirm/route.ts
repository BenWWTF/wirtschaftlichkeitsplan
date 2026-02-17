import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Auth confirmation route handler
 * Exchanges the secure code from email confirmation links for an Auth token
 *
 * This handles:
 * - Email confirmation after signup
 * - Password recovery links
 * - Magic link authentication
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  // Validate redirect URL to prevent open redirect attacks
  const safeNext = isSafeRedirect(next) ? next : '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Redirect user to specified redirect URL or dashboard
      redirect(safeNext)
    }
  }

  // Redirect the user to an error page with some instructions
  redirect('/error')
}

/**
 * Validates that a redirect URL is safe (prevents open redirect attacks)
 * Only allows relative URLs starting with / and not containing //
 */
function isSafeRedirect(url: string): boolean {
  if (!url) return false
  // Must start with /
  if (!url.startsWith('/')) return false
  // Must not contain // (protocol or domain)
  if (url.includes('//')) return false
  // Must not contain common protocol prefixes
  if (url.toLowerCase().includes('http:') || url.toLowerCase().includes('https:')) return false
  return true
}
